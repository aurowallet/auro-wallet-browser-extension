import { MinaApp } from "@zondax/ledger-mina-js";
import i18n from "i18next";
import browser from "webextension-polyfill";
import { LEDGER_STATUS, LedgerStatusType } from "../constant/commonType";
import { LEDGER_TRANSPORT_MODE_STORAGE_KEY } from "../constant/storageKey";
import { extGetLocal, extSaveLocal } from "../background/extensionStorage";
import Loading from "../popup/component/Loading";
import {
  connectLedgerSession,
  DEFAULT_LEDGER_TRANSPORT_MODE,
  disposeLedgerTransportCandidate,
  findLedgerTransportCandidates,
  HID,
  HIDDevice,
  isLedgerTransportMode,
  isWebHidSupported,
  LedgerSession,
  LedgerTransportCandidate,
  LEDGER_TRANSPORT_MODE,
  LedgerTransportMode,
  requestLedgerTransportCandidates,
} from "./ledgerTransport";

declare const navigator: Navigator & { hid?: HID };

const LEDGER_PROBE_TIMEOUT_MS = 2000;

export interface LedgerResponseInfo {
  success: boolean;
  rejected: boolean;
  busy: boolean;
  appNotOpen: boolean;
  message: string;
}

export interface LedgerConnectionResult {
  status: LedgerStatusType;
  app: MinaApp | null;
}

export interface LedgerDiagnostics {
  status: LedgerStatusType;
  webHIDSupported: boolean;
  transportOpen: boolean;
  selectedTransportMode: LedgerTransportMode;
  activeTransportMode: LedgerTransportMode | null;
  sessionModeMatchesSelected: boolean;
  appVersion: string | null;
  lastErrorMessage: string | null;
}

type StatusListener = (status: LedgerStatusType) => void;

interface LedgerConnectionOptions {
  autoConnect?: boolean;
  withDeviceLock<T>(task: () => Promise<T>): Promise<T>;
  isDeviceLockHeld(): Promise<boolean>;
  waitForActiveLedgerOperations(): Promise<void>;
  resolveResponse(response: unknown): LedgerResponseInfo;
}

/**
 * Owns the browser-to-device lifecycle. It deliberately contains no Mina
 * transaction construction or signing rules, so transport upgrades remain
 * isolated from the shared Ledger business flows.
 */
export class LedgerConnectionManager {
  private session: LedgerSession | null = null;
  private currentApp: MinaApp | null = null;
  private currentStatus: LedgerStatusType = LEDGER_STATUS.LEDGER_DISCONNECT;
  private listeners: StatusListener[] = [];
  private currentAppVersion: string | null = null;
  private lastErrorMessage: string | null = null;
  private connectionPromise: Promise<LedgerConnectionResult> | null = null;
  private transportTransitionInProgress = false;
  private transportMode: LedgerTransportMode = DEFAULT_LEDGER_TRANSPORT_MODE;
  private readonly transportModeReady: Promise<void>;
  private readonly handleHIDConnect: EventListener;
  private readonly handleHIDDisconnect: EventListener;
  private readonly handleTransportModeStorageChange: (
    changes: Record<string, { newValue?: unknown }>,
    area: string
  ) => void;

  constructor(private readonly options: LedgerConnectionOptions) {
    this.transportModeReady = this.restoreTransportMode();
    this.handleHIDConnect = (_event: Event) => {
      this.runConnectionAttempt(async () => {
        await this.transportModeReady;
        if (this.transportTransitionInProgress) return this.result();
        return this.tryConnectFromExisting();
      }).catch(() => this.reset(LEDGER_STATUS.LEDGER_DISCONNECT));
    };
    this.handleHIDDisconnect = (event: Event) => {
      const device = (event as Event & { device?: HIDDevice }).device;
      if (this.session?.mode === LEDGER_TRANSPORT_MODE.DMK) return;
      if (device && this.session && !this.session.matchesHidDevice(device)) return;
      this.reset(LEDGER_STATUS.LEDGER_DISCONNECT);
    };
    this.handleTransportModeStorageChange = (changes, area) => {
      if (area !== "local") return;
      const mode = changes[LEDGER_TRANSPORT_MODE_STORAGE_KEY]?.newValue;
      if (!isLedgerTransportMode(mode)) return;
      this.syncTransportModeFromStorage(mode).catch(() => {});
    };

    if (isWebHidSupported() && navigator.hid) {
      navigator.hid.addEventListener("connect", this.handleHIDConnect);
      navigator.hid.addEventListener("disconnect", this.handleHIDDisconnect);
    }

    try {
      browser.storage.onChanged.addListener(this.handleTransportModeStorageChange);
    } catch {
      // Storage events are unavailable in some extension lifecycle contexts.
    }

    if (options.autoConnect !== false) {
      this.ensureConnect().catch(() => this.reset(LEDGER_STATUS.LEDGER_DISCONNECT));
    }
  }

  get app(): MinaApp | null {
    return this.currentApp;
  }

  get status(): LedgerStatusType {
    return this.currentStatus;
  }

  get isTransitioning(): boolean {
    return this.transportTransitionInProgress;
  }

  private result(): LedgerConnectionResult {
    return { status: this.currentStatus, app: this.currentApp };
  }

  private isCurrentTransportOpen(): boolean {
    return !!this.session?.isOpen();
  }

  private async restoreTransportMode(): Promise<void> {
    try {
      const storedMode = await extGetLocal(LEDGER_TRANSPORT_MODE_STORAGE_KEY);
      if (isLedgerTransportMode(storedMode)) {
        this.transportMode = storedMode;
      }
    } catch {
      // Storage is unavailable in some test and extension lifecycle contexts.
    }
  }

  private async runConnectionAttempt(
    task: () => Promise<LedgerConnectionResult>
  ): Promise<LedgerConnectionResult> {
    if (this.connectionPromise) return this.connectionPromise;

    const promise = task();
    this.connectionPromise = promise;
    try {
      return await promise;
    } finally {
      if (this.connectionPromise === promise) this.connectionPromise = null;
    }
  }

  async tryConnectFromExisting(): Promise<LedgerConnectionResult> {
    try {
      if (!isWebHidSupported()) {
        this.reset(LEDGER_STATUS.LEDGER_DISCONNECT);
        return this.result();
      }
      await this.transportModeReady;
      if (this.transportTransitionInProgress) return this.result();
      const mode = this.transportMode;
      const devices = await findLedgerTransportCandidates(mode);
      return this.connectWithDevices(devices, mode);
    } catch {
      this.reset(LEDGER_STATUS.LEDGER_DISCONNECT);
      return this.result();
    }
  }

  private async connectWithDevices(
    devices: LedgerTransportCandidate[],
    mode: LedgerTransportMode = this.transportMode
  ): Promise<LedgerConnectionResult> {
    let sawAppNotOpen = false;
    let sawBusy = false;

    for (const device of devices) {
      if (this.transportTransitionInProgress || this.transportMode !== mode) {
        disposeLedgerTransportCandidate(device);
        continue;
      }
      const result = await this.connectWithDevice(device, mode);
      if (result.status === LEDGER_STATUS.READY) return result;
      if (result.status === LEDGER_STATUS.LEDGER_CONNECT_APP_NOT_OPEN) {
        sawAppNotOpen = true;
      }
      if (result.status === LEDGER_STATUS.LEDGER_BUSY) sawBusy = true;
    }

    if (sawBusy) {
      this.updateStatus(LEDGER_STATUS.LEDGER_BUSY, null);
    } else if (sawAppNotOpen) {
      this.updateStatus(LEDGER_STATUS.LEDGER_CONNECT_APP_NOT_OPEN);
    }
    return this.result();
  }

  private async getAppVersion(
    app: MinaApp,
    acquireLock: boolean = true
  ): ReturnType<MinaApp["getAppVersion"]> {
    const requestVersion = () => app.getAppVersion();
    return acquireLock ? this.options.withDeviceLock(requestVersion) : requestVersion();
  }

  private async close(): Promise<void> {
    const session = this.session;
    this.session = null;
    this.currentApp = null;
    this.currentAppVersion = null;
    if (!session) return;
    try {
      await session.close();
    } catch {}
  }

  private reset(newStatus: LedgerStatusType): void {
    this.close().catch(() => {});
    this.updateStatus(newStatus);
  }

  private async connectWithDevice(
    device: LedgerTransportCandidate,
    mode: LedgerTransportMode
  ): Promise<LedgerConnectionResult> {
    await this.close();
    let session: LedgerSession | null = null;

    try {
      const connection = await this.options.withDeviceLock(async () => {
        const nextSession = await connectLedgerSession(mode, device);
        try {
          const response = await this.getAppVersion(nextSession.app, false);
          return { session: nextSession, app: nextSession.app, response };
        } catch (error) {
          await nextSession.close().catch(() => {});
          throw error;
        }
      });
      session = connection.session;
      const response = connection.response;

      session.setDisconnectHandler(() => {
        if (this.session !== session) return;
        this.reset(LEDGER_STATUS.LEDGER_DISCONNECT);
      });

      this.session = session;
      this.currentApp = connection.app;
      this.currentAppVersion = response.version || null;

      const info = this.resolveResponse(response);
      if (info.success) {
        this.updateStatus(LEDGER_STATUS.READY);
      } else if (info.rejected || info.busy) {
        this.updateStatus(LEDGER_STATUS.LEDGER_BUSY, info.message);
      } else {
        this.updateStatus(
          session.isOpen()
            ? LEDGER_STATUS.LEDGER_CONNECT_APP_NOT_OPEN
            : LEDGER_STATUS.LEDGER_DISCONNECT
        );
      }
      return this.result();
    } catch (error) {
      if (session) {
        try {
          await session.close();
        } catch {}
      } else {
        disposeLedgerTransportCandidate(device);
      }
      this.session = null;
      this.currentApp = null;
      this.currentAppVersion = null;
      const info = this.resolveResponse(error);
      if (info.rejected || info.busy) {
        this.updateStatus(LEDGER_STATUS.LEDGER_BUSY, info.message);
      } else {
        this.updateStatus(LEDGER_STATUS.LEDGER_DISCONNECT);
      }
      return this.result();
    }
  }

  private resolveResponse(response: unknown): LedgerResponseInfo {
    const info = this.options.resolveResponse(response);
    this.applyResponseInfo(info);
    return info;
  }

  applyResponseInfo(info: LedgerResponseInfo): void {
    if (info.busy) {
      this.updateStatus(LEDGER_STATUS.LEDGER_BUSY, info.message);
    } else if (info.appNotOpen) {
      this.updateStatus(LEDGER_STATUS.LEDGER_CONNECT_APP_NOT_OPEN);
    }
  }

  updateStatus(status: LedgerStatusType, errorMessage?: string | null): void {
    const previousErrorMessage = this.lastErrorMessage;
    if (errorMessage !== undefined) {
      this.lastErrorMessage = errorMessage || null;
    } else if (status !== LEDGER_STATUS.LEDGER_BUSY) {
      this.lastErrorMessage = null;
    }
    if (this.currentStatus === status && this.lastErrorMessage === previousErrorMessage) {
      return;
    }
    this.currentStatus = status;
    this.listeners.forEach((listener) => {
      try {
        listener(status);
      } catch {}
    });
  }

  async requestConnect(): Promise<LedgerConnectionResult> {
    Loading.show();
    try {
      if (!isWebHidSupported()) return this.result();
      await this.transportModeReady;
      if (this.transportTransitionInProgress) return this.result();

      if (this.connectionPromise) {
        const existingResult = await this.connectionPromise;
        if (existingResult.status === LEDGER_STATUS.READY) return existingResult;
      }

      return await this.runConnectionAttempt(async () => {
        const mode = this.transportMode;
        const devices = await requestLedgerTransportCandidates(mode);
        return this.connectWithDevices(devices, mode);
      });
    } catch {
      return this.result();
    } finally {
      Loading.hide();
    }
  }

  async ensureConnect(): Promise<LedgerConnectionResult> {
    await this.transportModeReady;
    if (this.transportTransitionInProgress) return this.result();
    if (this.currentApp && this.isCurrentTransportOpen()) {
      if (await this.options.isDeviceLockHeld()) {
        this.updateStatus(LEDGER_STATUS.LEDGER_BUSY, null);
        return this.result();
      }
      try {
        const response = await Promise.race([
          this.getAppVersion(this.currentApp),
          new Promise<never>((_, reject) => {
            setTimeout(
              () => reject({ id: "TransportLocked", message: i18n.t("ledgerBusyTip") }),
              LEDGER_PROBE_TIMEOUT_MS
            );
          }),
        ]);
        const info = this.resolveResponse(response);
        this.currentAppVersion = response.version || null;
        if (info.success) {
          this.updateStatus(LEDGER_STATUS.READY);
        } else if (info.rejected || info.busy) {
          this.updateStatus(LEDGER_STATUS.LEDGER_BUSY, info.message);
        } else {
          this.updateStatus(
            this.isCurrentTransportOpen()
              ? LEDGER_STATUS.LEDGER_CONNECT_APP_NOT_OPEN
              : LEDGER_STATUS.LEDGER_DISCONNECT
          );
        }
      } catch (error) {
        const info = this.resolveResponse(error);
        if (info.rejected || info.busy) {
          this.updateStatus(LEDGER_STATUS.LEDGER_BUSY, info.message);
        } else {
          this.updateStatus(LEDGER_STATUS.LEDGER_DISCONNECT);
        }
      }
      return this.result();
    }
    return this.runConnectionAttempt(() => this.tryConnectFromExisting());
  }

  addStatusListener(listener: StatusListener): void {
    if (!this.listeners.includes(listener)) this.listeners.push(listener);
    try {
      listener(this.currentStatus);
    } catch {}
  }

  removeStatusListener(listener: StatusListener): void {
    this.listeners = this.listeners.filter((current) => current !== listener);
  }

  getDiagnostics(): LedgerDiagnostics {
    return {
      status: this.currentStatus,
      webHIDSupported: isWebHidSupported(),
      transportOpen: this.isCurrentTransportOpen(),
      selectedTransportMode: this.transportMode,
      activeTransportMode: this.session?.mode || null,
      sessionModeMatchesSelected:
        !this.session || this.session.mode === this.transportMode,
      appVersion: this.currentAppVersion,
      lastErrorMessage: this.lastErrorMessage,
    };
  }

  getLastErrorMessage(): string | null {
    return this.lastErrorMessage;
  }

  getTransportMode(): LedgerTransportMode {
    return this.transportMode;
  }

  async getStoredTransportMode(): Promise<LedgerTransportMode> {
    await this.transportModeReady;
    return this.transportMode;
  }

  async setTransportMode(
    mode: LedgerTransportMode,
    hasActiveLedgerOperation: boolean
  ): Promise<void> {
    if (!isLedgerTransportMode(mode)) {
      throw new Error("Unsupported Ledger transport mode");
    }
    await this.transportModeReady;
    if (hasActiveLedgerOperation || this.connectionPromise || this.transportTransitionInProgress) {
      throw new Error("Cannot switch Ledger transport during an active operation");
    }
    if (this.transportMode === mode) return;

    this.transportTransitionInProgress = true;
    try {
      await extSaveLocal(LEDGER_TRANSPORT_MODE_STORAGE_KEY, mode);
      await this.close();
      this.transportMode = mode;
      this.updateStatus(LEDGER_STATUS.LEDGER_DISCONNECT);
    } finally {
      this.transportTransitionInProgress = false;
    }
  }

  private async syncTransportModeFromStorage(
    mode: LedgerTransportMode
  ): Promise<void> {
    if (this.transportTransitionInProgress) return;

    this.transportTransitionInProgress = true;
    try {
      await this.transportModeReady;
      if (this.transportMode === mode) return;
      await this.options.waitForActiveLedgerOperations();
      // Queue behind an in-flight APDU rather than closing a session while a
      // signature is being produced in another extension page.
      await this.options.withDeviceLock(async () => {
        await this.close();
        this.transportMode = mode;
        this.updateStatus(LEDGER_STATUS.LEDGER_DISCONNECT);
      });
    } finally {
      this.transportTransitionInProgress = false;
    }
  }

  async destroy(): Promise<void> {
    if (typeof navigator !== "undefined" && navigator.hid) {
      navigator.hid.removeEventListener("connect", this.handleHIDConnect);
      navigator.hid.removeEventListener("disconnect", this.handleHIDDisconnect);
    }
    try {
      browser.storage.onChanged.removeListener(
        this.handleTransportModeStorageChange
      );
    } catch {
      // Storage events are unavailable in some extension lifecycle contexts.
    }
    this.listeners = [];
    await this.close();
    this.updateStatus(LEDGER_STATUS.LEDGER_DISCONNECT);
  }
}
