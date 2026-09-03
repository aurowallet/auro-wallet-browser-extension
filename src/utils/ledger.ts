import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import { ledgerUSBVendorId } from "@ledgerhq/devices";
import { MinaApp } from "@zondax/ledger-mina-js";
import { LedgerError } from "@zondax/ledger-js";
import BigNumber from "bignumber.js";
import i18n from "i18next";
import { MAIN_COIN_CONFIG } from "../constant";
import { LEDGER_STATUS, LedgerStatusType } from "../constant/commonType";
import { NetworkID_MAP } from "../constant/network";
import Loading from "../popup/component/Loading";
import { getCurrentNodeConfig } from "./browserUtils";
import { isZekoNet } from "./utils";
import Toast from "@/popup/component/Toast";
import {
  applyLedgerZkAppSignature,
  fieldElementToLedgerBytes,
  getLedgerSignedZkApp,
  LedgerSignedZkApp,
  LedgerZkAppBody,
  ledgerSignatureToBase58,
  prepareLedgerZkApp,
} from "./ledgerZkApp";

// ============ WebHID Type Declarations ============

interface HIDDevice {
  vendorId: number;
  productId: number;
  opened: boolean;
  collections: unknown[];
  productName: string;
  open(): Promise<void>;
  close(): Promise<void>;
}

interface HID extends EventTarget {
  getDevices(): Promise<HIDDevice[]>;
  requestDevice(options: { filters: Array<{ vendorId: number }> }): Promise<HIDDevice[]>;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

declare const navigator: Navigator & { hid?: HID };

// ============ Constants ============

const Networks = { MAINNET: 0x01, DEVNET: 0x00 } as const;
const TxType = { PAYMENT: 0x00, DELEGATION: 0x04 } as const;

// Web Locks requires a stable name so extension pages share one APDU queue.
// This is an internal browser resource name, not a Ledger protocol value.
const LEDGER_DEVICE_LOCK_NAME = "aurowallet-ledger-device";
const LEDGER_PROBE_TIMEOUT_MS = 2000;

function stringifyLedgerError(error: unknown): string {
  try {
    const serialized = JSON.stringify(error, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value
    );
    if (serialized && serialized !== "{}") return serialized;
  } catch {
    // Fall through to the native string representation for circular values.
  }

  return String(error);
}

function normalizeLedgerReturnCode(
  returnCode?: string | number | null
): number | undefined {
  if (typeof returnCode === "number") {
    return Number.isFinite(returnCode) ? returnCode : undefined;
  }
  if (typeof returnCode !== "string" || !returnCode.trim()) return undefined;

  const value = returnCode.trim();
  if (/^0x[\da-f]+$/i.test(value)) return Number.parseInt(value.slice(2), 16);

  const decimal = Number(value);
  if (
    Number.isInteger(decimal) &&
    (decimal < 0 || LedgerError[decimal] !== undefined)
  ) {
    return decimal;
  }

  if (/^[\da-f]+$/i.test(value)) {
    const hexadecimal = Number.parseInt(value, 16);
    if (LedgerError[hexadecimal] !== undefined) return hexadecimal;
  }

  return Number.isInteger(decimal) ? decimal : undefined;
}

interface LedgerResponseInfo {
  success: boolean;
  rejected: boolean;
  busy: boolean;
  message: string;
}

interface LedgerResponseOptions {
  detectUnsupported?: boolean;
}

function resolveLedgerResponse(
  response: unknown,
  options: LedgerResponseOptions = {}
): LedgerResponseInfo {
  const value =
    response && typeof response === "object"
      ? (response as {
          name?: string;
          id?: string;
          statusCode?: string | number;
          returnCode?: string | number;
          return_code?: string | number;
          message?: unknown;
          errorMessage?: unknown;
          statusText?: unknown;
        })
      : undefined;
  const returnCode = normalizeLedgerReturnCode(
    value?.returnCode ??
      value?.return_code ??
      value?.statusCode ??
      (typeof response === "string" || typeof response === "number"
        ? response
        : undefined)
  );
  const hasCode = (...codes: LedgerError[]) =>
    returnCode !== undefined && codes.includes(returnCode);
  const conditionsNotSatisfied = hasCode(
    LedgerError.ConditionsOfUseNotSatisfied
  );
  let returnedMessage: string | null = null;
  if (value) {
    for (const message of [value.message, value.errorMessage, value.statusText]) {
      if (typeof message === "string" && message.trim()) {
        returnedMessage = message.trim();
        break;
      }
    }
  }
  // Mina App versions may report a user rejection as either 0x6986 or
  // 0x6985 (ConditionsOfUseNotSatisfied). Classification is code-based;
  // returned messages are used only for display.
  const rejected =
    hasCode(LedgerError.TransactionRejected, LedgerError.UserRefusedOnDevice) ||
    conditionsNotSatisfied;
  const transportBusy =
    value?.id === "TransportLocked" ||
    value?.name === "TransportRaceCondition";
  const busy =
    !rejected &&
    (transportBusy ||
      conditionsNotSatisfied ||
      hasCode(LedgerError.LockedDevice, LedgerError.DeviceIsBusy));
  const unsupported =
    !!options.detectUnsupported &&
    hasCode(
      LedgerError.InstructionNotSupported,
      LedgerError.UnknownApdu,
      LedgerError.ClaNotSupported
    );
  let message = returnedMessage || stringifyLedgerError(response);
  if (rejected) message = i18n.t("ledgerRejected");
  if (busy && !returnedMessage) message = i18n.t("ledgerBusyTip");
  if (unsupported) message = i18n.t("ledgerZkAppUpdateRequired");

  return {
    success: hasCode(LedgerError.NoErrors),
    rejected,
    busy,
    message,
  };
}

function toLedgerFailure(info: LedgerResponseInfo): {
  rejected?: boolean;
  error: { message: string };
} {
  return {
    rejected: info.rejected || undefined,
    error: { message: info.message },
  };
}

function normalizeLedgerTransactionSignature(signature: string): string {
  const normalized = String(signature || "").replace(/^0x/i, "");
  if (!/^[0-9a-f]+$/i.test(normalized) || normalized.length !== 128) {
    throw new Error("Ledger payment signature must contain exactly 64 bytes");
  }
  const reverseBytes = (part: string): string =>
    part.match(/.{2}/g)!.reverse().join("");
  return reverseBytes(normalized.slice(0, 64)) + reverseBytes(normalized.slice(64));
}

// ============ Types ============

type StatusListener = (status: LedgerStatusType) => void;

interface TransactionBody {
  fromAddress: string;
  toAddress?: string;
  receiverAddress?: string;
  amount?: string | number;
  fee: string | number;
  nonce: string | number;
  memo?: string;
}

interface SignResult {
  rejected?: boolean;
  signature?: string | { field: string; scalar: string } | null;
  payload?: {
    fee: number;
    from: string;
    to: string;
    nonce: number;
    amount: number;
    memo: string;
    validUntil: number;
  };
  error?: { message: string };
  signedMessage?: string;
  signedZkApp?: LedgerSignedZkApp;
}

interface AddressResult {
  rejected?: boolean;
  publicKey?: string;
  error?: { message: string };
}

interface AccountVerificationResult {
  verified: boolean;
  rejected?: boolean;
  error?: { message: string };
}

interface ConnectResult {
  status: LedgerStatusType;
  app: MinaApp | null;
}

type AwaitDeviceCallback = () => void;

export interface LedgerDiagnostics {
  status: LedgerStatusType;
  webHIDSupported: boolean;
  deviceOpened: boolean;
  appVersion: string | null;
  lastErrorMessage: string | null;
}

// ============ LedgerManager Class ============

export class LedgerManager {
  transport: TransportWebHID | null = null;
  app: MinaApp | null = null;
  status: LedgerStatusType = LEDGER_STATUS.LEDGER_DISCONNECT;
  listeners: StatusListener[] = [];
  appVersion: string | null = null;
  private lastErrorMessage: string | null = null;
  private connectionPromise: Promise<ConnectResult> | null = null;
  private readonly handleHIDConnect: EventListener;
  private readonly handleHIDDisconnect: EventListener;

  constructor(options: { autoConnect?: boolean } = {}) {
    this.handleHIDConnect = (event: Event) => {
      const device = (event as Event & { device?: HIDDevice }).device;
      this._runConnectionAttempt(() =>
        device ? this._connectWithDevice(device) : this._tryConnectFromExisting()
      ).catch(() => this._reset(LEDGER_STATUS.LEDGER_DISCONNECT));
    };
    this.handleHIDDisconnect = (event: Event) => {
      const device = (event as Event & { device?: HIDDevice }).device;
      const currentDevice = this.transport?.device as unknown as
        | HIDDevice
        | undefined;
      if (device && currentDevice && device !== currentDevice) return;
      this._reset(LEDGER_STATUS.LEDGER_DISCONNECT);
    };

    const webHIDSupported = typeof navigator !== "undefined" && !!navigator.hid;

    if (webHIDSupported && navigator.hid) {
      navigator.hid.addEventListener("connect", this.handleHIDConnect);
      navigator.hid.addEventListener("disconnect", this.handleHIDDisconnect);
    }

    if (options.autoConnect !== false) {
      this.ensureConnect().catch(() =>
        this._reset(LEDGER_STATUS.LEDGER_DISCONNECT)
      );
    }
  }

  private _resolveLedgerResponse(
    response: unknown,
    options?: LedgerResponseOptions
  ): LedgerResponseInfo {
    const info = resolveLedgerResponse(response, options);
    if (info.busy) {
      this._update(LEDGER_STATUS.LEDGER_BUSY, info.message);
    }
    return info;
  }

  private _result(): ConnectResult {
    return { status: this.status, app: this.app };
  }

  private _isCurrentTransportOpen(): boolean {
    return !!this.transport?.device?.opened;
  }

  private async _withDeviceLock<T>(
    task: () => Promise<T>
  ): Promise<T> {
    const lockManager =
      typeof navigator !== "undefined" ? navigator.locks : undefined;
    if (!lockManager) return task();

    return lockManager.request(
      LEDGER_DEVICE_LOCK_NAME,
      { mode: "exclusive" },
      task
    );
  }

  private async _isDeviceLockHeld(): Promise<boolean> {
    const lockManager =
      typeof navigator !== "undefined" ? navigator.locks : undefined;
    if (!lockManager) return false;
    try {
      const snapshot = await lockManager.query();
      return !!snapshot.held?.some(
        (lock) => lock.name === LEDGER_DEVICE_LOCK_NAME
      );
    } catch {
      return false;
    }
  }

  private async _runConnectionAttempt(
    task: () => Promise<ConnectResult>
  ): Promise<ConnectResult> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    const promise = task();
    this.connectionPromise = promise;
    try {
      const result = await promise;
      return result;
    } finally {
      if (this.connectionPromise === promise) {
        this.connectionPromise = null;
      }
    }
  }

  async _tryConnectFromExisting(): Promise<ConnectResult> {
    try {
      if (!navigator.hid) {
        this._reset(LEDGER_STATUS.LEDGER_DISCONNECT);
        return this._result();
      }
      const devices = await navigator.hid.getDevices();
      const ledgerDevices = devices.filter(
        (d: HIDDevice) => d.vendorId === ledgerUSBVendorId
      );
      if (ledgerDevices.length === 0) {
        this._reset(LEDGER_STATUS.LEDGER_DISCONNECT);
        return this._result();
      }

      return this._connectWithDevices(ledgerDevices);
    } catch {
      this._reset(LEDGER_STATUS.LEDGER_DISCONNECT);
      return this._result();
    }
  }

  private async _connectWithDevices(
    devices: HIDDevice[]
  ): Promise<ConnectResult> {
    let sawAppNotOpen = false;
    let sawBusy = false;

    for (const device of devices) {
      const result = await this._connectWithDevice(device);
      if (result.status === LEDGER_STATUS.READY) {
        return result;
      }
      if (result.status === LEDGER_STATUS.LEDGER_CONNECT_APP_NOT_OPEN) {
        sawAppNotOpen = true;
      }
      if (result.status === LEDGER_STATUS.LEDGER_BUSY) {
        sawBusy = true;
      }
    }

    if (sawBusy) {
      this._update(LEDGER_STATUS.LEDGER_BUSY);
    } else if (sawAppNotOpen) {
      this._update(LEDGER_STATUS.LEDGER_CONNECT_APP_NOT_OPEN);
    }
    return this._result();
  }

  private async _getAppVersion(
    app: MinaApp,
    acquireLock: boolean = true
  ): ReturnType<MinaApp["getAppVersion"]> {
    const requestVersion = () => app.getAppVersion();

    return acquireLock
      ? this._withDeviceLock(requestVersion)
      : requestVersion();
  }

  async _close(): Promise<void> {
    const transport = this.transport;
    this.transport = null;
    this.app = null;
    this.appVersion = null;
    if (!transport) return;
    try {
      await transport.close();
    } catch {}
  }

  _reset(newStatus: LedgerStatusType): void {
    this._close().catch(() => {});
    this._update(newStatus);
  }

  async _connectWithDevice(device: HIDDevice): Promise<ConnectResult> {
    await this._close();

    let transport: TransportWebHID | null = null;
    const wasOpened = device.opened;

    try {
      const connection = await this._withDeviceLock(
        async () => {
          const nextTransport = device.opened
            ? new TransportWebHID(
                device as ConstructorParameters<typeof TransportWebHID>[0]
              )
            : await TransportWebHID.open(
                device as Parameters<typeof TransportWebHID.open>[0]
              );

          try {
            const nextApp = new MinaApp(nextTransport);
            const nextResponse = await this._getAppVersion(
              nextApp,
              false
            );
            return {
              transport: nextTransport,
              app: nextApp,
              response: nextResponse,
            };
          } catch (error) {
            await nextTransport.close().catch(() => {});
            throw error;
          }
        }
      );
      transport = connection.transport;
      const app = connection.app;
      const resp = connection.response;

      transport.on("disconnect", () => {
        if (this.transport !== transport) return;
        this._reset(LEDGER_STATUS.LEDGER_DISCONNECT);
      });

      this.transport = transport;
      this.app = app;
      this.appVersion = resp.version || null;

      const info = this._resolveLedgerResponse(resp);

      if (info.success) {
        this._update(LEDGER_STATUS.READY);
      } else if (info.rejected || info.busy) {
        this._update(LEDGER_STATUS.LEDGER_BUSY, info.message);
      } else {
        this._update(
          device.opened
            ? LEDGER_STATUS.LEDGER_CONNECT_APP_NOT_OPEN
            : LEDGER_STATUS.LEDGER_DISCONNECT
        );
      }
      return this._result();
    } catch (error) {
      if (transport) {
        try {
          await transport.close();
        } catch {}
      } else if (!wasOpened && device.opened) {
        try {
          await device.close();
        } catch {}
      }
      this.transport = null;
      this.app = null;
      this.appVersion = null;
      const info = this._resolveLedgerResponse(error);
      if (info.rejected || info.busy) {
        this._update(LEDGER_STATUS.LEDGER_BUSY, info.message);
      } else {
        this._update(LEDGER_STATUS.LEDGER_DISCONNECT);
      }
      return this._result();
    }
  }

  _update(s: LedgerStatusType, errorMessage?: string | null): void {
    const previousErrorMessage = this.lastErrorMessage;
    if (errorMessage !== undefined) {
      this.lastErrorMessage = errorMessage || null;
    } else if (s !== LEDGER_STATUS.LEDGER_BUSY) {
      this.lastErrorMessage = null;
    }
    if (
      this.status === s &&
      this.lastErrorMessage === previousErrorMessage
    ) {
      return;
    }
    this.status = s;
    this.listeners.forEach((cb) => {
      try {
        cb(s);
      } catch {}
    });
  }

  async requestConnect(): Promise<ConnectResult> {
    Loading.show();
    try {
      if (!navigator.hid) {
        return this._result();
      }

      if (this.connectionPromise) {
        const existingResult = await this.connectionPromise;
        if (existingResult.status === LEDGER_STATUS.READY) {
          return existingResult;
        }
      }

      return await this._runConnectionAttempt(
        async () => {
          const devices = await navigator.hid!.requestDevice({
            filters: [{ vendorId: ledgerUSBVendorId }],
          });

          if (devices.length === 0) return this._result();
          return this._connectWithDevices(devices);
        }
      );
    } catch {
      return this._result();
    } finally {
      Loading.hide();
    }
  }

  async ensureConnect(): Promise<ConnectResult> {
    if (
      this.app &&
      this._isCurrentTransportOpen()
    ) {
      // Do not wait indefinitely behind a previous APDU after its UI was closed.
      if (await this._isDeviceLockHeld()) {
        this._update(LEDGER_STATUS.LEDGER_BUSY);
        return this._result();
      }
      try {
        const response = await Promise.race([
          this._getAppVersion(this.app),
          new Promise<never>((_, reject) => {
            setTimeout(
              () =>
                reject({
                  id: "TransportLocked",
                  message: i18n.t("ledgerBusyTip"),
                }),
              LEDGER_PROBE_TIMEOUT_MS
            );
          }),
        ]);
        const info = this._resolveLedgerResponse(response);
        this.appVersion = response.version || null;
        if (info.success) {
          this._update(LEDGER_STATUS.READY);
        } else if (info.rejected || info.busy) {
          this._update(LEDGER_STATUS.LEDGER_BUSY, info.message);
        } else {
          this._update(
            this._isCurrentTransportOpen()
              ? LEDGER_STATUS.LEDGER_CONNECT_APP_NOT_OPEN
              : LEDGER_STATUS.LEDGER_DISCONNECT
          );
        }
      } catch (error) {
        const info = this._resolveLedgerResponse(error);
        if (info.rejected || info.busy) {
          this._update(LEDGER_STATUS.LEDGER_BUSY, info.message);
        } else {
          this._update(LEDGER_STATUS.LEDGER_DISCONNECT);
        }
      }
      return this._result();
    }
    return this._runConnectionAttempt(() =>
      this._tryConnectFromExisting()
    );
  }

  addStatusListener(cb: StatusListener): void {
    if (!this.listeners.includes(cb)) {
      this.listeners.push(cb);
    }
    try {
      cb(this.status);
    } catch {}
  }

  removeStatusListener(cb: StatusListener): void {
    this.listeners = this.listeners.filter((l) => l !== cb);
  }

  getDiagnostics(): LedgerDiagnostics {
    return {
      status: this.status,
      webHIDSupported: typeof navigator !== "undefined" && !!navigator.hid,
      deviceOpened: this._isCurrentTransportOpen(),
      appVersion: this.appVersion,
      lastErrorMessage: this.lastErrorMessage,
    };
  }

  getLastErrorMessage(): string | null {
    return this.lastErrorMessage;
  }

  private async _verifySigningAccount(
    expectedAddress: string,
    accountIndex: number
  ): Promise<AccountVerificationResult> {
    if (!expectedAddress) {
      return {
        verified: false,
        error: { message: i18n.t("buildFailed") },
      };
    }

    const response = await this._withDeviceLock(() =>
      this.app!.getAddress(accountIndex, false)
    );
    const info = this._resolveLedgerResponse(response);
    const addressMatches =
      !!response.publicKey && response.publicKey === expectedAddress;

    if (!info.success || !response.publicKey) {
      return {
        verified: false,
        ...toLedgerFailure(info),
      };
    }
    if (!addressMatches) {
      return {
        verified: false,
        error: { message: i18n.t("ledgerAccountMismatch") },
      };
    }

    this._update(LEDGER_STATUS.READY);
    return { verified: true };
  }

  async getAddress(
    accountIndex: number = 0,
    showOnDevice: boolean = true
  ): Promise<AddressResult> {
    const connection = await this.ensureConnect();
    if (this.status !== LEDGER_STATUS.READY) {
      Toast.info(i18n.t("pleaseOpenInLedger"));
      return {
        error: {
          message: resolveLedgerResponse({ status: connection.status }).message,
        },
      };
    }

    try {
      const resp = await this._withDeviceLock(() =>
        this.app!.getAddress(accountIndex, showOnDevice)
      );
      const info = this._resolveLedgerResponse(resp);
      if (!info.success || !resp.publicKey) {
        return toLedgerFailure(info);
      }
      return { publicKey: resp.publicKey || undefined };
    } catch (error) {
      const info = this._resolveLedgerResponse(error);
      return toLedgerFailure(info);
    }
  }

  async _sign(
    body: TransactionBody,
    type: number,
    accountIndex: number,
    onAwaitDevice?: AwaitDeviceCallback
  ): Promise<SignResult | undefined> {
    await this.ensureConnect();
    if (this.status !== LEDGER_STATUS.READY) {
      Toast.info(i18n.t("pleaseOpenInLedger"));
      return;
    }
    const cfg = await getCurrentNodeConfig();
    if (isZekoNet(cfg.networkID)) {
      return { signature: null, error: { message: i18n.t("notSupportNow") } };
    }

    try {
      const verification = await this._verifySigningAccount(
        body.fromAddress,
        accountIndex
      );
      if (!verification.verified) {
        return {
          rejected: verification.rejected,
          signature: null,
          error: verification.error,
        };
      }
    } catch (error) {
      const info = this._resolveLedgerResponse(error);
      return {
        signature: null,
        ...toLedgerFailure(info),
      };
    }

    const networkId = await this._getNetworkId();
    const decimal = new BigNumber(10).pow(MAIN_COIN_CONFIG.decimals);

    const amountNano = new BigNumber(body.amount || 0).multipliedBy(decimal);
    const feeNano = new BigNumber(body.fee).multipliedBy(decimal);

    const payload = {
      txType: type,
      senderAccount: accountIndex,
      senderAddress: body.fromAddress,
      receiverAddress: body.toAddress || body.receiverAddress || "",
      amount: amountNano.toNumber(),
      fee: feeNano.toNumber(),
      nonce: +body.nonce,
      memo: body.memo || "",
      networkId,
      validUntil: 4294967295,
    };

    try {
      const { signature, returnCode, statusText, message } =
        (await this._withDeviceLock(() => {
          onAwaitDevice?.();
          return this.app!.signTransaction(payload);
        })) as {
          signature: string;
          returnCode: string | number;
          statusText?: string;
          message?: string;
        };

      const info = this._resolveLedgerResponse({
        returnCode,
        statusText,
        message,
      });
      if (!info.success) {
        return {
          signature: null,
          ...toLedgerFailure(info),
        };
      }
      return {
        signature:
          normalizeLedgerTransactionSignature(signature),
        payload: {
          fee: payload.fee,
          from: payload.senderAddress,
          to: payload.receiverAddress,
          nonce: payload.nonce,
          amount: payload.amount,
          memo: payload.memo,
          validUntil: payload.validUntil,
        },
      };
    } catch (error) {
      const info = this._resolveLedgerResponse(error);
      return { signature: null, ...toLedgerFailure(info) };
    }
  }

  async signPayment(
    body: TransactionBody,
    accountIndex: number = 0,
    onAwaitDevice?: AwaitDeviceCallback
  ): Promise<SignResult | undefined> {
    return this._sign(body, TxType.PAYMENT, accountIndex, onAwaitDevice);
  }

  async signDelegation(
    body: TransactionBody,
    accountIndex: number = 0,
    onAwaitDevice?: AwaitDeviceCallback
  ): Promise<SignResult | undefined> {
    return this._sign(body, TxType.DELEGATION, accountIndex, onAwaitDevice);
  }

  async signMessage(
    message: string,
    accountIndex: number = 0,
    onAwaitDevice?: AwaitDeviceCallback
  ): Promise<SignResult | undefined> {
    await this.ensureConnect();
    if (this.status !== LEDGER_STATUS.READY) {
      Toast.info(i18n.t("pleaseOpenInLedger"));
      return;
    }

    const cfg = await getCurrentNodeConfig();
    if (isZekoNet(cfg.networkID)) {
      return { signature: null, error: { message: i18n.t("notSupportNow") } };
    }

    const networkId = await this._getNetworkId();

    try {
      const resp = (await this._withDeviceLock(() => {
        onAwaitDevice?.();
        return this.app!.signMessage(accountIndex, networkId, message);
      })) as {
        returnCode?: string | number;
        return_code?: string | number;
        statusText?: string;
        message?: string;
        field?: string;
        scalar?: string;
        signed_message?: string;
      };

      const info = this._resolveLedgerResponse(resp);
      if (!info.success) {
        return {
          signature: null,
          ...toLedgerFailure(info),
        };
      }
      return {
        signature: {
          field: resp.field || "",
          scalar: resp.scalar || "",
        },
        signedMessage: resp.signed_message,
      };
    } catch (err) {
      const info = this._resolveLedgerResponse(err);
      return {
        signature: null,
        ...toLedgerFailure(info),
      };
    }
  }

  async signZkApp(
    body: LedgerZkAppBody,
    accountIndex: number = 0,
    onAwaitDevice?: AwaitDeviceCallback
  ): Promise<SignResult | undefined> {
    await this.ensureConnect();
    if (this.status !== LEDGER_STATUS.READY) {
      Toast.info(i18n.t("pleaseOpenInLedger"));
      return;
    }

    const cfg = await getCurrentNodeConfig();
    if (isZekoNet(cfg.networkID)) {
      return { signature: null, error: { message: i18n.t("notSupportNow") } };
    }

    try {
      const verification = await this._verifySigningAccount(
        body.fromAddress,
        accountIndex
      );
      if (!verification.verified) {
        return {
          rejected: verification.rejected,
          signature: null,
          error: verification.error,
        };
      }

      const prepared = await prepareLedgerZkApp(body, cfg.networkID);
      const networkId = await this._getNetworkId();

      for (const request of prepared.signingRequests) {
        const resp = await this._withDeviceLock(() => {
          onAwaitDevice?.();
          return this.app!.signFieldElement(
            accountIndex,
            networkId,
            fieldElementToLedgerBytes(request.fieldElement)
          );
        });
        const info = this._resolveLedgerResponse(resp, {
          detectUnsupported: true,
        });
        if (!info.success || !resp.field || !resp.scalar) {
          return {
            signature: null,
            ...toLedgerFailure(info),
          };
        }

        applyLedgerZkAppSignature(
          prepared,
          request,
          ledgerSignatureToBase58(resp.field, resp.scalar)
        );
      }
      return { signedZkApp: getLedgerSignedZkApp(prepared) };
    } catch (err) {
      const info = this._resolveLedgerResponse(err, {
        detectUnsupported: true,
      });
      return {
        signature: null,
        ...toLedgerFailure(info),
      };
    }
  }

  async _getNetworkId(): Promise<number> {
    const cfg = await getCurrentNodeConfig();
    return cfg.networkID === NetworkID_MAP.mainnet
      ? Networks.MAINNET
      : Networks.DEVNET;
  }

  async destroy(): Promise<void> {
    if (typeof navigator !== "undefined" && navigator.hid) {
      navigator.hid.removeEventListener("connect", this.handleHIDConnect);
      navigator.hid.removeEventListener("disconnect", this.handleHIDDisconnect);
    }
    this.listeners = [];
    await this._close();
    this._update(LEDGER_STATUS.LEDGER_DISCONNECT);
  }
}

export default new LedgerManager({ autoConnect: false });
