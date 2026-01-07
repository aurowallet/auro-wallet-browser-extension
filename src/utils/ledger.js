import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import { ledgerUSBVendorId } from "@ledgerhq/devices";
import { MinaApp } from "@zondax/ledger-mina-js";
import BigNumber from "bignumber.js";
import i18n from "i18next";
import { MAIN_COIN_CONFIG } from "../constant";
import { LEDGER_STATUS } from "../constant/commonType";
import { NetworkID_MAP } from "../constant/network";
import Loading from "../popup/component/Loading";
import { getCurrentNodeConfig } from "./browserUtils";
import Toast from "@/popup/component/Toast";

const Networks = { MAINNET: 0x01, DEVNET: 0x00 };
const TxType = { PAYMENT: 0x00, DELEGATION: 0x04 };

let instance = null;
const statusCode = {
  rejectCode_str: "27013",
};

class LedgerManager {
  constructor() {
    if (instance) return instance;

    this.transport = null;
    this.app = null;
    this.status = LEDGER_STATUS.LEDGER_DISCONNECT;
    this.listeners = [];

    if ("hid" in navigator) {
      navigator.hid.addEventListener("connect", () =>
        this._tryConnectFromExisting()
      );
      navigator.hid.addEventListener("disconnect", () =>
        this._reset(LEDGER_STATUS.LEDGER_DISCONNECT)
      );
    }

    // this._pollTimer = setInterval(() => this._tryConnectFromExisting(), 5000);
    this._tryConnectFromExisting();

    instance = this;
  }

  async _tryConnectFromExisting() {
    try {
      const devices = await navigator.hid.getDevices();
      const ledgerDevice = devices.find(
        (d) => d.vendorId === ledgerUSBVendorId
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

  async _close() {
    if (this.transport) {
      try {
        await this.transport.close();
      } catch {}
      this.transport = null;
      this.app = null;
    }
  }

  _reset(newStatus) {
    if (this.status === newStatus) return;
    this._close();
    this.status = newStatus;
    this.listeners.forEach((cb) => cb(newStatus));
  }

  async _connectWithDevice(device) {
    await this._close();

    let transport = null;
    let app = null;

    try {
      if (device.opened) {
        transport = new TransportWebHID(device);
      } else {
        transport = await TransportWebHID.open(device);
      }
      app = new MinaApp(transport);

      const resp = await app.getAppVersion();

      const isReady = resp.returnCode === "9000" || resp.returnCode === 0x9000;

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
      console.warn("[aurowallet-ledger] connect failed:", err.message || err);
      await this._close();
      this._update(LEDGER_STATUS.LEDGER_DISCONNECT);
    }
  }

  _update(s) {
    if (this.status === s) return;
    this.status = s;
    this.listeners.forEach((cb) => cb(s));
  }

  async requestConnect() {
    Loading.show();
    try {
      const devices = await navigator.hid.requestDevice({
        filters: [{ vendorId: ledgerUSBVendorId }],
      });

      if (devices.length === 0) {
        return { status: this.status, app: this.app };
      }

      await this._connectWithDevice(devices[0]);
    } catch (err) {
      console.warn("[aurowallet-ledger] requestConnect error:", err);
    } finally {
      Loading.hide();
    }
    return { status: this.status, app: this.app };
  }

  async ensureConnect() {
    await this._tryConnectFromExisting();
    return { status: this.status, app: this.app };
  }

  addStatusListener(cb) {
    this.listeners.push(cb);
  }

  removeStatusListener(cb) {
    this.listeners = this.listeners.filter((l) => l !== cb);
  }

  async getAddress(accountIndex = 0, showOnDevice = true) {
    await this.ensureConnect();
    if (this.status !== LEDGER_STATUS.READY) {
      Toast.info(i18n.t("pleaseOpenInLedger"));
      return;
    }
    const resp = await this.app.getAddress(accountIndex, showOnDevice);
    const returnCode = resp.returnCode?.toString();
    if (returnCode === statusCode.rejectCode_str) {
      return { rejected: true };
    }
    return { publicKey: resp.publicKey };
  }

  async _sign(body, type, accountIndex) {
    await this.ensureConnect();
    if (this.status !== LEDGER_STATUS.READY) {
      Toast.info(i18n.t("pleaseOpenInLedger"));
      return;
    }
    const networkId = await this._getNetworkId();
    const decimal = new BigNumber(10).pow(MAIN_COIN_CONFIG.decimals);

    const payload = {
      txType: type,
      senderAccount: accountIndex,
      senderAddress: body.fromAddress,
      receiverAddress: body.toAddress || body.receiverAddress,
      amount: new BigNumber(body.amount || 0).multipliedBy(decimal).toNumber(),
      fee: new BigNumber(body.fee).multipliedBy(decimal).toNumber(),
      nonce: +body.nonce,
      memo: body.memo || "",
      networkId,
      validUntil: 4294967295,
    };

    const { signature, returnCode, statusText,message } =
      await this.app.signTransaction(payload);
      
      
    const returnCodeStr = returnCode?.toString();
    if (returnCodeStr === statusCode.rejectCode_str) {
      return { rejected: true, error: { message: i18n.t("ledgerRejected") } };
    }

    const isSuccess = returnCode === "9000" || returnCode === 0x9000;
    if (!isSuccess) {
      return {
        signature: null,
        error: { message: statusText|| message || "Sign failed" },
      };
    }

    const shuffle = (h) => h.match(/.{2}/g).reverse().join("");
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

  async signPayment(body, accountIndex = 0) {
    return this._sign(body, TxType.PAYMENT, accountIndex);
  }

  async signDelegation(body, accountIndex = 0) {
    return this._sign(body, TxType.DELEGATION, accountIndex);
  }

  async signMessage(message, accountIndex = 0) {
    await this.ensureConnect();
    if (this.status !== LEDGER_STATUS.READY) {
      Toast.info(i18n.t("pleaseOpenInLedger"));
      return;
    }

    const networkId = await this._getNetworkId();

    try {
      const resp = await this.app.signMessage(accountIndex, networkId, message);

      const returnCode =
        resp.returnCode?.toString() || resp?.return_code?.toString();

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
          field: resp.field,
          scalar: resp.scalar,
        },
        signedMessage: resp.signed_message,
      };
    } catch (err) {
      console.error("[aurowallet-ledger] signMessage exception:", err);
      return {
        signature: null,
        error: {
          message: err.message || "Unknown error during message signing",
        },
      };
    }
  }

  async _getNetworkId() {
    const cfg = await getCurrentNodeConfig();
    return cfg.networkID === NetworkID_MAP.mainnet
      ? Networks.MAINNET
      : Networks.DEVNET;
  }

  destroy() {
    // if (this._pollTimer) clearInterval(this._pollTimer);
    this._close();
    if ("hid" in navigator) {
      navigator.hid.removeEventListener("connect", this._handleChange);
      navigator.hid.removeEventListener("disconnect", this._handleChange);
    }
  }
}

export default new LedgerManager();
