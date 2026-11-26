const mockDmk = {
  startDiscovering: jest.fn(),
  stopDiscovering: jest.fn().mockResolvedValue(undefined),
  listenToAvailableDevices: jest.fn(),
  connect: jest.fn().mockResolvedValue("dmk-session"),
  disconnect: jest.fn().mockResolvedValue(undefined),
  getDeviceSessionState: jest.fn(),
  close: jest.fn(),
  sendApdu: jest.fn(),
};

const mockDmkTransport = jest.fn();
const mockMinaApp = jest.fn().mockImplementation((transport) => ({ transport }));

jest.mock("@ledgerhq/devices", () => ({ ledgerUSBVendorId: 0x2c97 }));
jest.mock("@ledgerhq/hw-transport-webhid", () => ({
  __esModule: true,
  default: class TransportWebHID {},
}));
jest.mock("@zondax/ledger-mina-js", () => ({ MinaApp: mockMinaApp }));
jest.mock("@zondax/ledger-js", () => ({ DMKTransport: mockDmkTransport }));
jest.mock("@ledgerhq/device-management-kit", () => ({
  DeviceManagementKitBuilder: class DeviceManagementKitBuilder {
    addTransport() {
      return this;
    }

    build() {
      return mockDmk;
    }
  },
}));
jest.mock("@ledgerhq/device-transport-kit-web-hid", () => ({
  webHidIdentifier: "WEB-HID",
  webHidTransportFactory: jest.fn(),
}), { virtual: true });

import {
  connectLedgerSession,
  DEFAULT_LEDGER_TRANSPORT_MODE,
  findLedgerTransportCandidates,
  getLedgerTransportConnectionLabel,
  getLedgerTransportModeLabel,
  isLedgerTransportMode,
  LEDGER_TRANSPORT_MODE,
  LEDGER_TRANSPORT_NO_ACTIVE_SESSION_LABEL,
  requestLedgerTransportCandidates,
} from "../../src/utils/ledgerTransport";

function observable<T>(values: T[]) {
  return {
    subscribe(observer: { next(value: T): void }) {
      values.forEach((value) => observer.next(value));
      return { unsubscribe: jest.fn() };
    },
  };
}

describe("DMK Ledger transport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(globalThis, "navigator", {
      value: { hid: {} },
      configurable: true,
    });
  });

  it("uses Legacy as the default transport mode", () => {
    expect(DEFAULT_LEDGER_TRANSPORT_MODE).toBe(LEDGER_TRANSPORT_MODE.LEGACY);
  });

  it("centralizes transport validation and diagnostic labels", () => {
    expect(isLedgerTransportMode(LEDGER_TRANSPORT_MODE.LEGACY)).toBe(true);
    expect(isLedgerTransportMode(LEDGER_TRANSPORT_MODE.DMK)).toBe(true);
    expect(isLedgerTransportMode("unsupported")).toBe(false);
    expect(getLedgerTransportModeLabel(LEDGER_TRANSPORT_MODE.LEGACY)).toBe(
      "Legacy"
    );
    expect(getLedgerTransportModeLabel(LEDGER_TRANSPORT_MODE.DMK)).toBe("DMK");
    expect(getLedgerTransportModeLabel(null)).toBe(
      LEDGER_TRANSPORT_NO_ACTIVE_SESSION_LABEL
    );
    expect(getLedgerTransportConnectionLabel(LEDGER_TRANSPORT_MODE.LEGACY)).toBe(
      "HID"
    );
  });

  it("waits for the DMK known-device lookup after its initial empty list", async () => {
    let availableDevicesObserver:
      | { next(devices: Array<{ id: string; name: string }>): void }
      | undefined;
    mockDmk.listenToAvailableDevices.mockReturnValue({
      subscribe(observer: typeof availableDevicesObserver) {
        availableDevicesObserver = observer;
        observer?.next([]);
        return { unsubscribe: jest.fn() };
      },
    });

    const candidatesPromise = findLedgerTransportCandidates(
      LEDGER_TRANSPORT_MODE.DMK
    );
    await new Promise((resolve) => setImmediate(resolve));
    expect(availableDevicesObserver).toBeDefined();
    expect(mockDmk.close).not.toHaveBeenCalled();

    availableDevicesObserver?.next([{ id: "device-1", name: "Ledger Nano" }]);
    await expect(candidatesPromise).resolves.toEqual([
      expect.objectContaining({
        dmk: mockDmk,
        device: { id: "device-1", name: "Ledger Nano" },
      }),
    ]);
  });

  it("creates a DMK session with polling disabled and releases it on disconnect", async () => {
    const stateObserver: { next(state: { deviceStatus: string }): void } = {
      next: () => {},
    };
    mockDmk.startDiscovering.mockReturnValue(
      observable([{ id: "device-1", name: "Ledger Nano" }])
    );
    mockDmk.getDeviceSessionState.mockReturnValue({
      subscribe(observer: typeof stateObserver) {
        stateObserver.next = observer.next;
        return { unsubscribe: jest.fn() };
      },
    });

    const [candidate] = await requestLedgerTransportCandidates(
      LEDGER_TRANSPORT_MODE.DMK
    );
    expect(candidate).toBeDefined();

    const session = await connectLedgerSession(
      LEDGER_TRANSPORT_MODE.DMK,
      candidate!
    );

    expect(mockDmk.connect).toHaveBeenCalledWith({
      device: { id: "device-1", name: "Ledger Nano" },
      sessionRefresherOptions: { isRefresherDisabled: true },
    });
    expect(mockDmkTransport).toHaveBeenCalledWith(mockDmk, "dmk-session");
    expect(mockMinaApp).toHaveBeenCalledTimes(1);
    expect(session.isOpen()).toBe(true);

    const onDisconnect = jest.fn();
    session.setDisconnectHandler(onDisconnect);
    stateObserver.next({ deviceStatus: "NOT CONNECTED" });
    expect(session.isOpen()).toBe(false);
    expect(onDisconnect).toHaveBeenCalledTimes(1);

    await session.close();
    expect(mockDmk.disconnect).toHaveBeenCalledWith({ sessionId: "dmk-session" });
    expect(mockDmk.close).toHaveBeenCalled();
  });
});
