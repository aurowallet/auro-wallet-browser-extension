import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import { ledgerUSBVendorId } from "@ledgerhq/devices";
import { MinaApp } from "@zondax/ledger-mina-js";
import BigNumber from "bignumber.js";
import i18n from "i18next";
import { MAIN_COIN_CONFIG } from "../constant";
import { LEDGER_STATUS, LedgerStatusType } from "../constant/commonType";
import { NetworkID_MAP } from "../constant/network";
import Loading from "../popup/component/Loading";
import { getCurrentNodeConfig } from "./browserUtils";
import Toast from "@/popup/component/Toast";

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
}

declare const navigator: Navigator & { hid?: HID };

// ============ Constants ============

const Networks = { MAINNET: 0x01, DEVNET: 0x00 } as const;
const TxType = { PAYMENT: 0x00, DELEGATION: 0x04 } as const;

const statusCode = {
  rejectCode_str: "27013",
};

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
}

interface AddressResult {
  rejected?: boolean;
  publicKey?: string;
}

interface ConnectResult {
  status: LedgerStatusType;
  app: MinaApp | null;
}

// ============ LedgerManager Class ============

let instance: LedgerManager | null = null;

class LedgerManager {
  transport: TransportWebHID | null = null;
  app: MinaApp | null = null;
  status: LedgerStatusType = LEDGER_STATUS.LEDGER_DISCONNECT;
  listeners: StatusListener[] = [];

  constructor() {
    if (instance) return instance;

    if ("hid" in navigator && navigator.hid) {
      navigator.hid.addEventListener("connect", () =>
        this._tryConnectFromExisting()
      );
      navigator.hid.addEventListener("disconnect", () =>
        this._reset(LEDGER_STATUS.LEDGER_DISCONNECT)
      );
    }

    this._tryConnectFromExisting();
    instance = this;
  }

  async _tryConnectFromExisting(): Promise<void> {
    try {
      if (!navigator.hid) return;
      const devices = await navigator.hid.getDevices();
      const ledgerDevice = devices.find(
        (d: HIDDevice) => d.vendorId === ledgerUSBVendorId
      );
      if (!ledgerDevice) {
        this._reset(LEDGER_STATUS.LEDGER_DISCONNECT);
        return;
      }
      await this._connectWithDevice(ledgerDevice);
    } catch (e) {
      console.log("[aurowallet-ledger] _tryConnectFromExisting error:", e);
    }
  }

  async _close(): Promise<void> {
    if (this.transport) {
      try {
        await this.transport.close();
      } catch {
        // ignore
      }
      this.transport = null;
      this.app = null;
    }
  }

  _reset(newStatus: LedgerStatusType): void {
    if (this.status === newStatus) return;
    this._close();
    this.status = newStatus;
    this.listeners.forEach((cb) => cb(newStatus));
  }

  async _connectWithDevice(device: HIDDevice): Promise<void> {
    await this._close();

    let transport: TransportWebHID | null = null;
    let app: MinaApp | null = null;

    try {
      if (device.opened) {
        transport = new TransportWebHID(device);
      } else {
        transport = await TransportWebHID.open(device);
      }
      app = new MinaApp(transport);

      const resp = await app.getAppVersion();
      const isReady = resp.returnCode === "9000" || Number(resp.returnCode) === 0x9000;

      if (isReady) {
        this.transport = transport;
        this.app = app;
        this._update(LEDGER_STATUS.READY);
      } else {
        this.transport = transport;
        this.app = app;
        this._update(LEDGER_STATUS.LEDGER_CONNECT_APP_NOT_OPEN);
      }
    } catch (err) {
      console.warn("[aurowallet-ledger] connect failed:", (err as Error).message || err);
      await this._close();
      this._update(LEDGER_STATUS.LEDGER_DISCONNECT);
    }
  }

  _update(s: LedgerStatusType): void {
    if (this.status === s) return;
    this.status = s;
    this.listeners.forEach((cb) => cb(s));
  }

  async requestConnect(): Promise<ConnectResult> {
    Loading.show();
    try {
      if (!navigator.hid) {
        return { status: this.status, app: this.app };
      }
      const devices = await navigator.hid.requestDevice({
        filters: [{ vendorId: ledgerUSBVendorId }],
      });

      if (devices.length === 0) {
        return { status: this.status, app: this.app };
      }

      const device = devices[0];
      if (device) {
        await this._connectWithDevice(device);
      }
    } catch (err) {
      console.warn("[aurowallet-ledger] requestConnect error:", err);
    } finally {
      Loading.hide();
    }
    return { status: this.status, app: this.app };
  }

  async ensureConnect(): Promise<ConnectResult> {
    await this._tryConnectFromExisting();
    return { status: this.status, app: this.app };
  }

  addStatusListener(cb: StatusListener): void {
    this.listeners.push(cb);
  }

  removeStatusListener(cb: StatusListener): void {
    this.listeners = this.listeners.filter((l) => l !== cb);
  }

  async getAddress(
    accountIndex: number = 0,
    showOnDevice: boolean = true
  ): Promise<AddressResult | undefined> {
    await this.ensureConnect();
    if (this.status !== LEDGER_STATUS.READY) {
      Toast.info(i18n.t("pleaseOpenInLedger"));
      return;
    }
    const resp = await this.app!.getAddress(accountIndex, showOnDevice);
    const returnCode = resp.returnCode?.toString();
    if (returnCode === statusCode.rejectCode_str) {
      return { rejected: true };
    }
    return { publicKey: resp.publicKey || undefined };
  }

  async _sign(
    body: TransactionBody,
    type: number,
    accountIndex: number
  ): Promise<SignResult | undefined> {
    await this.ensureConnect();
    if (this.status !== LEDGER_STATUS.READY) {
      Toast.info(i18n.t("pleaseOpenInLedger"));
      return;
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

    const { signature, returnCode, statusText, message } =
      (await this.app!.signTransaction(payload)) as {
        signature: string;
        returnCode: string | number;
        statusText?: string;
        message?: string;
      };

    const returnCodeStr = returnCode?.toString();
    if (returnCodeStr === statusCode.rejectCode_str) {
      return { rejected: true, error: { message: i18n.t("ledgerRejected") } };
    }

    const isSuccess = returnCode === "9000" || returnCode === 0x9000;
    if (!isSuccess) {
      return {
        signature: null,
        error: { message: statusText || message || "Sign failed" },
      };
    }

    const shuffle = (h: string) =>
      h
        .match(/.{2}/g)!
        .reverse()
        .join("");
    return {
      signature: shuffle(signature.slice(0, 64)) + shuffle(signature.slice(64)),
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
  }

  async signPayment(
    body: TransactionBody,
    accountIndex: number = 0
  ): Promise<SignResult | undefined> {
    return this._sign(body, TxType.PAYMENT, accountIndex);
  }

  async signDelegation(
    body: TransactionBody,
    accountIndex: number = 0
  ): Promise<SignResult | undefined> {
    return this._sign(body, TxType.DELEGATION, accountIndex);
  }

  async signMessage(
    message: string,
    accountIndex: number = 0
  ): Promise<SignResult | undefined> {
    await this.ensureConnect();
    if (this.status !== LEDGER_STATUS.READY) {
      Toast.info(i18n.t("pleaseOpenInLedger"));
      return;
    }

    const networkId = await this._getNetworkId();

    try {
      const resp = (await this.app!.signMessage(accountIndex, networkId, message)) as {
        returnCode?: string | number;
        return_code?: string | number;
        statusText?: string;
        message?: string;
        field?: string;
        scalar?: string;
        signed_message?: string;
      };

      const returnCode =
        resp.returnCode?.toString() || resp.return_code?.toString();

      if (returnCode === statusCode.rejectCode_str) {
        return {
          rejected: true,
          error: { message: i18n.t("ledgerRejected") },
        };
      }

      if (returnCode !== "9000") {
        return {
          signature: null,
          error: {
            message: resp.statusText || resp.message || "Sign message failed",
          },
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
      console.error("[aurowallet-ledger] signMessage exception:", err);
      return {
        signature: null,
        error: {
          message: (err as Error).message || "Unknown error during message signing",
        },
      };
    }
  }

  async _getNetworkId(): Promise<number> {
    const cfg = await getCurrentNodeConfig();
    return cfg.networkID === NetworkID_MAP.mainnet
      ? Networks.MAINNET
      : Networks.DEVNET;
  }

  destroy(): void {
    this._close();
    if ("hid" in navigator) {
      // Event listeners cleanup would need stored references
    }
  }
}

export default new LedgerManager();
