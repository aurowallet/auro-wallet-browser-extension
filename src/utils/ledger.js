import { ledgerUSBVendorId } from "@ledgerhq/devices";
import Transport from "@ledgerhq/hw-transport-webusb";
import { MinaApp } from "@zondax/ledger-mina-js";
import BigNumber from "bignumber.js";
import i18n from "i18next";
import { MAIN_COIN_CONFIG } from "../constant";
import { LEDGER_STATUS } from "../constant/commonType";
import { NetworkID_MAP } from "../constant/network";
import Loading from "../popup/component/Loading";
import { getCurrentNodeConfig } from "./browserUtils";

const Networks = {
  MAINNET: 0x01,
  DEVNET: 0x00,
};

const TxType = {
  PAYMENT: 0x00,
  DELEGATION: 0x04,
};

export const LEDGER_CONNECT_TYPE = {
  isPage: "isPage",
};

const status = {
  rejectCode: "27013",
};
async function getPort() {
  const transport = await Transport.create().catch((e) => {
    return null;
  });
  return transport;
}
let appInstance = null;
let portInstance = null;

async function getApp() {
  let app = null;
  if (!appInstance) {
    const transport = await getPort();
    if (transport) {
      app = new MinaApp(transport);
      portInstance = transport;
      appInstance = app;
    } else {
      return { manualConnected: true, app: null };
    }
  } else {
    app = appInstance;
  }
  try {
    let timer = null;
    const result = await Promise.race([
      app.getAppName(),
      new Promise((resolve) => {
        timer = setTimeout(() => {
          timer = null;
          resolve({ timeout: true });
        }, 300);
      }),
    ]);

    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    if (result.returnCode === "5000" || !result.name || result.timeout) {
      if (portInstance) {
        await portInstance.close();
      }
      portInstance = null;
      appInstance = null;
      return { manualConnected: true, app: null };
    }

    return { app, appName: result.name };
  } catch (err) {
    console.error("Error in getApp:", err);
    if (portInstance) {
      await portInstance.close();
    }
    portInstance = null;
    appInstance = null;
    return { manualConnected: true, app: null };
  }
}
async function ensureUSBPermission() {
  try {
    let devices = await navigator.usb.getDevices();
    if (Array.isArray(devices) && devices.length >= 1) {
      const requestDeviceResult = await navigator.usb.requestDevice({
        filters: [
          {
            vendorId: ledgerUSBVendorId,
          },
        ],
      });
      if (!requestDeviceResult) {
        throw new Error("No device selected");
      }
    }
  } catch (e) {
    alert(e.message ? e.message : e.toString());
    return {
      error: true,
    };
  }
}

export async function checkLedgerConnect(permissionsCheck) {
  if (permissionsCheck) {
    let result = await ensureUSBPermission();
    if (result?.error) {
      return result;
    }
  }
  let timer = setTimeout(() => {
    timer = null;
    Loading.show();
  }, 1000);
  const { app, manualConnected, openApp } = await getApp();
  if (timer) {
    clearTimeout(timer);
  } else {
    Loading.hide();
  }
  return { ledgerApp: app, manualConnected, openApp };
}

export async function requestAccount(app, accountIndex) {
  const { publicKey, returnCode, statusText, ...others } = await app.getAddress(
    accountIndex
  );
  if (returnCode === status.rejectCode) {
    return { rejected: true, publicKey: null };
  }
  if (publicKey) {
    return { publicKey: publicKey };
  } else {
    return { publicKey: null };
  }
}

export async function requestSignDelegation(app, body, ledgerAccountIndex) {
  return requestSign(app, body, TxType.DELEGATION, ledgerAccountIndex);
}

export async function requestSignPayment(app, body, ledgerAccountIndex) {
  return requestSign(app, body, TxType.PAYMENT, ledgerAccountIndex);
}
/**
 * @param {*} app
 * @param {*} body
 * @param {*} ledgerAccountIndex
 * @returns
 */
export async function requestLedgerSignMessage(
  app,
  message,
  ledgerAccountIndex
) {
  return ledgerSignMessage(app, message, ledgerAccountIndex);
}

async function ledgerSignMessage(app, body, ledgerAccountIndex) {
  const networkId = await getNetworkId();
  const { returnCode, field, scalar, signed_message, statusText, message } =
    await app.signMessage(ledgerAccountIndex, networkId, body);
  if (returnCode === status.rejectCode) {
    return {
      rejected: true,
      publicKey: null,
      error: { message: i18n.t("ledgerRejected") },
    };
  }
  if (returnCode !== "9000") {
    return { signature: null, error: { message: statusText || message } };
  }
  return {
    signature: {
      field,
      scalar,
    },
    signedMessage: signed_message,
  };
}

function reEncodeRawSignature(rawSignature) {
  function shuffleBytes(hex) {
    let bytes = hex.match(/.{2}/g);
    bytes.reverse();
    return bytes.join("");
  }

  if (rawSignature.length !== 128) {
    throw "Invalid raw signature input";
  }
  const field = rawSignature.substring(0, 64);
  const scalar = rawSignature.substring(64);
  return shuffleBytes(field) + shuffleBytes(scalar);
}
async function getNetworkId() {
  const networkConfig = await getCurrentNodeConfig();
  const networkID = networkConfig.networkID;
  if (networkID === NetworkID_MAP.mainnet) {
    return Networks.MAINNET;
  } else {
    return Networks.DEVNET;
  }
}
async function requestSign(app, body, type, ledgerAccountIndex) {
  let amount = body.amount || 0;
  let decimal = new BigNumber(10).pow(MAIN_COIN_CONFIG.decimals);
  let sendFee = new BigNumber(body.fee).multipliedBy(decimal).toNumber();
  let sendAmount = new BigNumber(amount).multipliedBy(decimal).toNumber();
  let payload = {
    txType: type,
    senderAccount: ledgerAccountIndex,
    senderAddress: body.fromAddress,
    receiverAddress: body.toAddress,
    amount: sendAmount,
    fee: sendFee,
    nonce: +body.nonce,
    memo: body.memo || "",
    networkId: await getNetworkId(),
    validUntil: 4294967295,
  };
  const { signature, returnCode, statusText } = await app.signTransaction(
    payload
  );
  if (returnCode === status.rejectCode) {
    return {
      rejected: true,
      publicKey: null,
      error: { message: i18n.t("ledgerRejected") },
    };
  }
  if (returnCode !== "9000") {
    return { signature: null, error: { message: statusText } };
  }
  let realSignature = reEncodeRawSignature(signature);
  return {
    signature: realSignature,
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

export async function getLedgerStatus() {
  let app = null;
  if (!appInstance) {
    const transport = await getPort();
    if (transport) {
      app = new MinaApp(transport);
      portInstance = transport;
      appInstance = app;
    } else {
      return { status: LEDGER_STATUS.LEDGER_DISCONNECT };
    }
  } else {
    app = appInstance;
  }
  let timer = null;
  const result = await Promise.race([
    app.getAppName(),
    new Promise((resolve) => {
      timer = setTimeout(() => {
        timer = null;
        resolve({ timeout: true });
      }, 300);
    }),
  ]);
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (result.returnCode === "5000" || !result.name || result.timeout) {
    portInstance.close();
    portInstance = null;
    appInstance = null;
    return { status: LEDGER_STATUS.LEDGER_CONNECT_APP_NOT_OPEN };
  }
  return { app, status: LEDGER_STATUS.READY };
}
