import browser from "webextension-polyfill";

const mockExtGetLocal = jest.fn();
const mockExtSaveLocal = jest.fn();
const mockFindLedgerTransportCandidates = jest.fn();
const mockRequestLedgerTransportCandidates = jest.fn();
const mockIsWebHidSupported = jest.fn();
const mockConnectLedgerSession = jest.fn();
const mockHidAddEventListener = jest.fn();
const mockLedgerTransportMode = { LEGACY: "legacy", DMK: "dmk" } as const;
const mockIsLedgerTransportMode = jest.fn(
  (value: unknown) => Object.values(mockLedgerTransportMode).includes(
    value as (typeof mockLedgerTransportMode)[keyof typeof mockLedgerTransportMode]
  )
);

jest.mock("../../src/background/extensionStorage", () => ({
  extGetLocal: mockExtGetLocal,
  extSaveLocal: mockExtSaveLocal,
}));

jest.mock("../../src/utils/ledgerTransport", () => ({
  LEDGER_TRANSPORT_MODE: mockLedgerTransportMode,
  DEFAULT_LEDGER_TRANSPORT_MODE: mockLedgerTransportMode.LEGACY,
  connectLedgerSession: mockConnectLedgerSession,
  disposeLedgerTransportCandidate: jest.fn(),
  findLedgerTransportCandidates: mockFindLedgerTransportCandidates,
  isLedgerTransportMode: mockIsLedgerTransportMode,
  isWebHidSupported: mockIsWebHidSupported,
  requestLedgerTransportCandidates: mockRequestLedgerTransportCandidates,
}));

jest.mock("@zondax/ledger-mina-js", () => ({ MinaApp: class MinaApp {} }));
jest.mock("@zondax/ledger-js", () => ({ LedgerError: { NoErrors: 0 } }));
jest.mock("../../src/popup/component/Loading", () => ({
  __esModule: true,
  default: { show: jest.fn(), hide: jest.fn() },
}));

import { LEDGER_STATUS } from "../../src/constant/commonType";
import { LEDGER_TRANSPORT_MODE_STORAGE_KEY } from "../../src/constant/storageKey";
import { LedgerManager } from "../../src/utils/ledger";
import { LEDGER_TRANSPORT_MODE } from "../../src/utils/ledgerTransport";

describe("Ledger transport mode selection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExtGetLocal.mockResolvedValue(LEDGER_TRANSPORT_MODE.DMK);
    mockIsWebHidSupported.mockReturnValue(true);
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        hid: {
          addEventListener: mockHidAddEventListener,
          removeEventListener: jest.fn(),
        },
      },
    });
  });

  const getHidConnectHandler = (): EventListener => {
    const registration = mockHidAddEventListener.mock.calls.find(
      ([eventName]) => eventName === "connect"
    );
    return registration?.[1] as EventListener;
  };

  const getTransportModeStorageListener = () => {
    const registration = (browser.storage.onChanged.addListener as jest.Mock).mock.calls.find(
      ([listener]) => typeof listener === "function"
    );
    return registration?.[0] as (
      changes: Record<string, { newValue?: unknown }>,
      area: string
    ) => void;
  };

  it("uses Legacy by default and persists explicit DMK and Legacy choices", async () => {
    mockExtGetLocal.mockResolvedValue(undefined);
    mockExtSaveLocal.mockResolvedValue(undefined);
    const manager = new LedgerManager({ autoConnect: false });

    expect(await manager.getStoredTransportMode()).toBe(
      LEDGER_TRANSPORT_MODE.LEGACY
    );

    await manager.setTransportMode(LEDGER_TRANSPORT_MODE.DMK);
    expect(manager.getTransportMode()).toBe(LEDGER_TRANSPORT_MODE.DMK);
    expect(mockExtSaveLocal).toHaveBeenLastCalledWith(
      LEDGER_TRANSPORT_MODE_STORAGE_KEY,
      LEDGER_TRANSPORT_MODE.DMK
    );

    await manager.setTransportMode(LEDGER_TRANSPORT_MODE.LEGACY);
    expect(manager.getTransportMode()).toBe(LEDGER_TRANSPORT_MODE.LEGACY);
    expect(mockExtSaveLocal).toHaveBeenLastCalledWith(
      LEDGER_TRANSPORT_MODE_STORAGE_KEY,
      LEDGER_TRANSPORT_MODE.LEGACY
    );
    await manager.destroy();
  });

  it("keeps Legacy when persisted or external modes are invalid", async () => {
    mockExtGetLocal.mockResolvedValue("unsupported");
    const manager = new LedgerManager({ autoConnect: false });

    expect(await manager.getStoredTransportMode()).toBe(
      LEDGER_TRANSPORT_MODE.LEGACY
    );

    const storageListener = getTransportModeStorageListener();
    storageListener(
      {
        [LEDGER_TRANSPORT_MODE_STORAGE_KEY]: {
          newValue: "unsupported",
        },
      },
      "local"
    );
    await new Promise((resolve) => setImmediate(resolve));

    expect(manager.getTransportMode()).toBe(LEDGER_TRANSPORT_MODE.LEGACY);
    await manager.destroy();
  });

  it("does not fall back to Legacy when an opted-in DMK auto-connect fails", async () => {
    mockFindLedgerTransportCandidates.mockRejectedValue(
      new Error("DMK discovery failed")
    );
    const manager = new LedgerManager({ autoConnect: false });
    await manager.getStoredTransportMode();

    const result = await manager._tryConnectFromExisting();

    expect(result.status).toBe(LEDGER_STATUS.LEDGER_DISCONNECT);
    expect(mockFindLedgerTransportCandidates).toHaveBeenCalledTimes(1);
    expect(mockFindLedgerTransportCandidates).toHaveBeenCalledWith(
      LEDGER_TRANSPORT_MODE.DMK
    );
    await manager.destroy();
  });

  it("does not fall back to Legacy when an opted-in DMK user connection fails", async () => {
    mockRequestLedgerTransportCandidates.mockRejectedValue(
      new Error("DMK discovery failed")
    );
    const manager = new LedgerManager({ autoConnect: false });
    await manager.getStoredTransportMode();

    const result = await manager.requestConnect();

    expect(result.status).toBe(LEDGER_STATUS.LEDGER_DISCONNECT);
    expect(mockRequestLedgerTransportCandidates).toHaveBeenCalledTimes(1);
    expect(mockRequestLedgerTransportCandidates).toHaveBeenCalledWith(
      LEDGER_TRANSPORT_MODE.DMK
    );
    await manager.destroy();
  });

  it("does not start a connection while switching transport modes", async () => {
    let resolveSave: (() => void) | undefined;
    mockExtGetLocal.mockResolvedValue(LEDGER_TRANSPORT_MODE.LEGACY);
    mockExtSaveLocal.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        })
    );
    const manager = new LedgerManager({ autoConnect: false });
    await manager.getStoredTransportMode();

    const switchPromise = manager.setTransportMode(LEDGER_TRANSPORT_MODE.DMK);
    await Promise.resolve();
    const result = await manager._tryConnectFromExisting();

    expect(result.status).toBe(LEDGER_STATUS.LEDGER_DISCONNECT);
    expect(mockFindLedgerTransportCandidates).not.toHaveBeenCalled();

    resolveSave?.();
    await switchPromise;
    await manager.destroy();
  });

  it("synchronizes an external transport-mode change after the current device lock", async () => {
    mockExtGetLocal.mockResolvedValue(LEDGER_TRANSPORT_MODE.LEGACY);
    const manager = new LedgerManager({ autoConnect: false });
    await manager.getStoredTransportMode();

    const storageListener = getTransportModeStorageListener();
    storageListener(
      {
        [LEDGER_TRANSPORT_MODE_STORAGE_KEY]: {
          newValue: LEDGER_TRANSPORT_MODE.DMK,
        },
      },
      "local"
    );
    await new Promise((resolve) => setImmediate(resolve));

    expect(manager.getTransportMode()).toBe(LEDGER_TRANSPORT_MODE.DMK);
    expect(manager.getDiagnostics().selectedTransportMode).toBe(
      LEDGER_TRANSPORT_MODE.DMK
    );

    await manager.destroy();
    expect(browser.storage.onChanged.removeListener).toHaveBeenCalledWith(
      storageListener
    );
  });

  it("waits for a local Ledger operation before applying an external mode change", async () => {
    mockExtGetLocal.mockResolvedValue(LEDGER_TRANSPORT_MODE.LEGACY);
    let resolveDiscovery: ((devices: []) => void) | undefined;
    mockFindLedgerTransportCandidates.mockImplementation(
      () =>
        new Promise<[]>((resolve) => {
          resolveDiscovery = resolve;
        })
    );
    const manager = new LedgerManager({ autoConnect: false });
    await manager.getStoredTransportMode();

    const connectPromise = manager.ensureConnect();
    await new Promise((resolve) => setImmediate(resolve));
    const storageListener = getTransportModeStorageListener();
    storageListener(
      {
        [LEDGER_TRANSPORT_MODE_STORAGE_KEY]: {
          newValue: LEDGER_TRANSPORT_MODE.DMK,
        },
      },
      "local"
    );
    await new Promise((resolve) => setImmediate(resolve));

    expect(manager.getTransportMode()).toBe(LEDGER_TRANSPORT_MODE.LEGACY);

    resolveDiscovery?.([]);
    await connectPromise;
    await new Promise((resolve) => setImmediate(resolve));
    expect(manager.getTransportMode()).toBe(LEDGER_TRANSPORT_MODE.DMK);
    await manager.destroy();
  });

  it("uses DMK discovery rather than the raw HID device after a DMK user plugs in", async () => {
    mockFindLedgerTransportCandidates.mockResolvedValue([]);
    const manager = new LedgerManager({ autoConnect: false });
    await manager.getStoredTransportMode();
    const onConnect = getHidConnectHandler();

    onConnect({ device: { vendorId: 0x2c97 } } as unknown as Event);
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockFindLedgerTransportCandidates).toHaveBeenCalledWith(
      LEDGER_TRANSPORT_MODE.DMK
    );
    expect(mockConnectLedgerSession).not.toHaveBeenCalled();
    await manager.destroy();
  });

  it("rediscovers only Ledger candidates after a Legacy user plugs in", async () => {
    mockExtGetLocal.mockResolvedValue(LEDGER_TRANSPORT_MODE.LEGACY);
    mockFindLedgerTransportCandidates.mockResolvedValue([]);
    const manager = new LedgerManager({ autoConnect: false });
    await manager.getStoredTransportMode();
    const onConnect = getHidConnectHandler();

    onConnect({ device: { vendorId: 0x1234 } } as unknown as Event);
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockFindLedgerTransportCandidates).toHaveBeenCalledWith(
      LEDGER_TRANSPORT_MODE.LEGACY
    );
    expect(mockConnectLedgerSession).not.toHaveBeenCalled();
    await manager.destroy();
  });
});
