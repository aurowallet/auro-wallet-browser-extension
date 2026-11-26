import { ledgerUSBVendorId } from "@ledgerhq/devices";
import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import type { LedgerTransport } from "@zondax/ledger-js";
import { MinaApp } from "@zondax/ledger-mina-js";

export const LEDGER_TRANSPORT_MODE = {
  LEGACY: "legacy",
  DMK: "dmk",
} as const;

// DMK is an explicit opt-in rollout path. Existing and new users remain on
// the established WebHID transport until they enable it in Preferences.
export const DEFAULT_LEDGER_TRANSPORT_MODE = LEDGER_TRANSPORT_MODE.LEGACY;

export type LedgerTransportMode =
  (typeof LEDGER_TRANSPORT_MODE)[keyof typeof LEDGER_TRANSPORT_MODE];

export const LEDGER_TRANSPORT_DISPLAY = {
  [LEDGER_TRANSPORT_MODE.LEGACY]: {
    modeLabel: "Legacy",
    connectionLabel: "HID",
  },
  [LEDGER_TRANSPORT_MODE.DMK]: {
    modeLabel: "DMK",
    connectionLabel: "DMK",
  },
} as const satisfies Record<
  LedgerTransportMode,
  { modeLabel: string; connectionLabel: string }
>;

// Diagnostics value used when no Ledger session is currently active.
export const LEDGER_TRANSPORT_NO_ACTIVE_SESSION_LABEL = "none";

export function isLedgerTransportMode(
  value: unknown
): value is LedgerTransportMode {
  return Object.values(LEDGER_TRANSPORT_MODE).includes(
    value as LedgerTransportMode
  );
}

export function getLedgerTransportModeLabel(
  mode: LedgerTransportMode | null
): string {
  return mode
    ? LEDGER_TRANSPORT_DISPLAY[mode].modeLabel
    : LEDGER_TRANSPORT_NO_ACTIVE_SESSION_LABEL;
}

export function getLedgerTransportConnectionLabel(
  mode: LedgerTransportMode
): string {
  return LEDGER_TRANSPORT_DISPLAY[mode].connectionLabel;
}

export interface HIDDevice {
  vendorId: number;
  productId: number;
  opened: boolean;
  collections: unknown[];
  productName: string;
  open(): Promise<void>;
  close(): Promise<void>;
}

export interface HID extends EventTarget {
  getDevices(): Promise<HIDDevice[]>;
  requestDevice(options: { filters: Array<{ vendorId: number }> }): Promise<HIDDevice[]>;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

declare const navigator: Navigator & { hid?: HID };

interface Subscription {
  unsubscribe(): void;
}

interface Observable<T> {
  subscribe(observer: {
    next(value: T): void;
    error?(error: unknown): void;
    complete?(): void;
  }): Subscription;
}

interface DmkDiscoveredDevice {
  readonly id: string;
  readonly name: string;
}

interface DmkSessionState {
  readonly deviceStatus: string;
}

interface Dmk {
  startDiscovering(args: { transport?: unknown }): Observable<DmkDiscoveredDevice>;
  stopDiscovering(): Promise<void>;
  listenToAvailableDevices(args: {
    transport?: unknown;
  }): Observable<DmkDiscoveredDevice[]>;
  connect(args: {
    device: unknown;
    sessionRefresherOptions: { isRefresherDisabled: boolean };
  }): Promise<string>;
  disconnect(args: { sessionId: string }): Promise<void>;
  getDeviceSessionState(args: { sessionId: string }): Observable<DmkSessionState>;
  close(): void;
  sendApdu(args: {
    sessionId: string;
    apdu: Uint8Array;
    abortTimeout?: number;
    triggersDisconnection?: boolean;
  }): Promise<{ statusCode: Uint8Array; data: Uint8Array }>;
}

interface DmkModules {
  DeviceManagementKitBuilder: new () => {
    addTransport(transport: unknown): { build(): Dmk };
  };
  webHidIdentifier: unknown;
  webHidTransportFactory: unknown;
  DMKTransport: new (dmk: Dmk, sessionId: string) => unknown;
}

interface DmkLedgerTransportCandidate {
  readonly dmk: Dmk;
  readonly modules: DmkModules;
  readonly device: DmkDiscoveredDevice;
}

export type LedgerTransportCandidate = HIDDevice | DmkLedgerTransportCandidate;

export interface LedgerSession {
  readonly mode: LedgerTransportMode;
  readonly app: MinaApp;
  isOpen(): boolean;
  matchesHidDevice(device: HIDDevice): boolean;
  setDisconnectHandler(handler: () => void): void;
  close(): Promise<void>;
}

function isHidDevice(device: LedgerTransportCandidate): device is HIDDevice {
  return "vendorId" in device;
}

function firstValue<T>(observable: Observable<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let subscription: Subscription | null = null;
    subscription = observable.subscribe({
      next(value) {
        if (settled) return;
        settled = true;
        resolve(value);
        subscription?.unsubscribe();
      },
      error(error) {
        if (settled) return;
        settled = true;
        reject(error);
        subscription?.unsubscribe();
      },
      complete() {
        if (!settled) {
          settled = true;
          reject(new Error("Ledger device discovery completed without a device"));
        }
      },
    });
    if (settled) subscription.unsubscribe();
  });
}

const DMK_AVAILABLE_DEVICE_TIMEOUT_MS = 2000;

/**
 * WebHID's DMK transport exposes its known devices through a BehaviorSubject.
 * Its initial synchronous value is always an empty list, while the browser
 * permission-backed `navigator.hid.getDevices()` lookup completes afterwards.
 * Do not mistake that initialization value for a missing authorized device.
 */
function firstAvailableDmkDevice(
  observable: Observable<DmkDiscoveredDevice[]>
): Promise<DmkDiscoveredDevice | null> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let subscription: Subscription | null = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const finish = (device: DmkDiscoveredDevice | null, error?: unknown) => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      subscription?.unsubscribe();
      if (error !== undefined) reject(error);
      else resolve(device);
    };

    subscription = observable.subscribe({
      next(devices) {
        const device = devices[0];
        if (device) finish(device);
      },
      error(error) {
        finish(null, error);
      },
      complete() {
        finish(null);
      },
    });

    // A missing authorization/device should remain a normal disconnected
    // state rather than leave every Ledger action waiting indefinitely.
    if (settled) {
      subscription?.unsubscribe();
      return;
    }
    timeout = setTimeout(() => finish(null), DMK_AVAILABLE_DEVICE_TIMEOUT_MS);
  });
}

async function loadDmkModules(): Promise<DmkModules> {
  const [dmkModule, webHidModule, ledgerJsModule] = await Promise.all([
    import("@ledgerhq/device-management-kit"),
    import("@ledgerhq/device-transport-kit-web-hid"),
    import("@zondax/ledger-js"),
  ]);

  return {
    DeviceManagementKitBuilder:
      dmkModule.DeviceManagementKitBuilder as unknown as DmkModules["DeviceManagementKitBuilder"],
    webHidIdentifier: webHidModule.webHidIdentifier,
    webHidTransportFactory: webHidModule.webHidTransportFactory,
    DMKTransport: ledgerJsModule.DMKTransport,
  };
}

class LegacyLedgerSession implements LedgerSession {
  readonly mode = LEDGER_TRANSPORT_MODE.LEGACY;
  private disconnectHandler: (() => void) | null = null;

  constructor(
    private readonly transport: TransportWebHID,
    readonly app: MinaApp
  ) {
    this.transport.on("disconnect", () => this.disconnectHandler?.());
  }

  isOpen(): boolean {
    return !!this.transport.device?.opened;
  }

  matchesHidDevice(device: HIDDevice): boolean {
    return this.transport.device === (device as unknown as typeof this.transport.device);
  }

  setDisconnectHandler(handler: () => void): void {
    this.disconnectHandler = handler;
  }

  async close(): Promise<void> {
    await this.transport.close();
  }
}

class DmkLedgerSession implements LedgerSession {
  readonly mode = LEDGER_TRANSPORT_MODE.DMK;
  private disconnectHandler: (() => void) | null = null;
  private sessionStateSubscription: Subscription | null = null;
  private active = true;

  constructor(
    readonly app: MinaApp,
    private readonly dmk: Dmk,
    private readonly sessionId: string
  ) {
    this.sessionStateSubscription = this.dmk
      .getDeviceSessionState({ sessionId })
      .subscribe({
        next: (state) => {
          if (state.deviceStatus !== "NOT CONNECTED") return;
          this.active = false;
          this.disconnectHandler?.();
        },
        error: () => {
          this.active = false;
          this.disconnectHandler?.();
        },
      });
  }

  isOpen(): boolean {
    return this.active;
  }

  matchesHidDevice(_device: HIDDevice): boolean {
    // DMK owns HID device lifecycle and reports disconnects through session state.
    return false;
  }

  setDisconnectHandler(handler: () => void): void {
    this.disconnectHandler = handler;
  }

  async close(): Promise<void> {
    const subscription = this.sessionStateSubscription;
    this.sessionStateSubscription = null;
    subscription?.unsubscribe();
    this.active = false;
    try {
      await this.dmk.disconnect({ sessionId: this.sessionId });
    } finally {
      this.dmk.close();
    }
  }
}

export function isWebHidSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.hid;
}

export async function findLedgerTransportCandidates(
  mode: LedgerTransportMode
): Promise<LedgerTransportCandidate[]> {
  if (!isWebHidSupported()) return [];
  if (mode === LEDGER_TRANSPORT_MODE.LEGACY) {
    const devices = await navigator.hid!.getDevices();
    return devices.filter((device) => device.vendorId === ledgerUSBVendorId);
  }

  const modules = await loadDmkModules();
  const dmk = new modules.DeviceManagementKitBuilder()
    .addTransport(modules.webHidTransportFactory)
    .build();
  try {
    const device = await firstAvailableDmkDevice(
      dmk.listenToAvailableDevices({ transport: modules.webHidIdentifier })
    );
    if (!device) return [];
    return [{ dmk, modules, device }];
  } catch (error) {
    dmk.close();
    throw error;
  }
}

export async function requestLedgerTransportCandidates(
  mode: LedgerTransportMode
): Promise<LedgerTransportCandidate[]> {
  if (!isWebHidSupported()) return [];
  if (mode === LEDGER_TRANSPORT_MODE.LEGACY) {
    return navigator.hid!.requestDevice({
      filters: [{ vendorId: ledgerUSBVendorId }],
    });
  }

  const modules = await loadDmkModules();
  const dmk = new modules.DeviceManagementKitBuilder()
    .addTransport(modules.webHidTransportFactory)
    .build();
  try {
    const device = await firstValue(
      dmk.startDiscovering({ transport: modules.webHidIdentifier })
    );
    return [{ dmk, modules, device }];
  } catch (error) {
    dmk.close();
    throw error;
  } finally {
    await dmk.stopDiscovering().catch(() => {});
  }
}

export function disposeLedgerTransportCandidate(
  candidate: LedgerTransportCandidate
): void {
  if (!isHidDevice(candidate)) candidate.dmk.close();
}

export async function connectLedgerSession(
  mode: LedgerTransportMode,
  candidate: LedgerTransportCandidate
): Promise<LedgerSession> {
  if (mode === LEDGER_TRANSPORT_MODE.LEGACY) {
    if (!isHidDevice(candidate)) {
      throw new Error("Legacy Ledger transport requires a WebHID device");
    }
    const transport = candidate.opened
      ? new TransportWebHID(
          candidate as ConstructorParameters<typeof TransportWebHID>[0]
        )
      : await TransportWebHID.open(
          candidate as Parameters<typeof TransportWebHID.open>[0]
        );
    try {
      return new LegacyLedgerSession(transport, new MinaApp(transport));
    } catch (error) {
      await transport.close().catch(() => {});
      throw error;
    }
  }

  if (isHidDevice(candidate)) {
    throw new Error("DMK Ledger transport requires a discovered DMK device");
  }
  const { dmk, modules, device } = candidate;
  let sessionId: string | null = null;
  try {
    // Disable DMK polling: Mina's multi-APDU flows must remain contiguous.
    sessionId = await dmk.connect({
      device,
      sessionRefresherOptions: { isRefresherDisabled: true },
    });
    const transport = new modules.DMKTransport(dmk, sessionId);
    return new DmkLedgerSession(
      new MinaApp(transport as LedgerTransport),
      dmk,
      sessionId
    );
  } catch (error) {
    if (sessionId) {
      await dmk.disconnect({ sessionId }).catch(() => {});
    }
    dmk.close();
    throw error;
  }
}
