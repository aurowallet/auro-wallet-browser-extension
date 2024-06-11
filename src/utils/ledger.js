import { ledgerUSBVendorId } from "@ledgerhq/devices";
import Transport from "@ledgerhq/hw-transport-webusb";
import BigNumber from "bignumber.js";
import extension from "extensionizer";
import i18n from "i18next";
import { MinaLedgerJS, Networks, TxType } from "mina-ledger-js";
import { MAIN_COIN_CONFIG } from "../constant";
import { LEDGER_STATUS } from "../constant/commonType";
import { LEDGER_CONNECTED_SUCCESSFULLY } from "../constant/msgTypes";
import { NetworkID_MAP } from "../constant/network";
import Loading from "../popup/component/Loading";
import Toast from "../popup/component/Toast";
import { closePopupWindow, openPopupWindow } from "./popup";
import { getCurrentNodeConfig } from "./utils";

export const LEDGER_CONNECT_TYPE = {
  isPage: "isPage",
};

const status = {
  rejected: "CONDITIONS_OF_USE_NOT_SATISFIED",
};
function initLedgerWindowListener() {
  return new Promise((resolve) => {
    async function onMessage(message, sender, sendResponse) {
      const { action } = message;
      switch (action) {
        case LEDGER_CONNECTED_SUCCESSFULLY:
          extension.runtime.onMessage.removeListener(onMessage);
          resolve();
          sendResponse && sendResponse();
          break;
      }
      return true;
    }
    extension.runtime.onMessage.addListener(onMessage);
  });
}
async function openLedgerWindow() {
  openPopupWindow("./popup.html#/ledger_connect", "ledger");
  await initLedgerWindowListener();
  Toast.info(i18n.t("ledgerConnectSuccess"));
  return { connected: true };
}
async function getPort() {
  const transport = await Transport.create().catch((e) => {
    return null;
  });
  return transport;
}
let appInstance = null;
let portInstance = null;
export async function getApp(type) {
  let app = null;
  if (!appInstance) {
    const transport = await getPort();
    if (transport) {
      app = new MinaLedgerJS(transport);
      portInstance = transport;
      appInstance = app;
    } else {
      if (type !== LEDGER_CONNECT_TYPE.isPage) {
        await openLedgerWindow();
      }
      return { manualConnected: true, app: null };
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
    if (type !== LEDGER_CONNECT_TYPE.isPage) {
      await openLedgerWindow();
    }
    let openApp = !!result.version;
    return { manualConnected: true, app: null, openApp: openApp };
  }
  if (app) {
    closePopupWindow("ledger");
  }
  return { app };
}

export async function ensureUSBPermission() {
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

export async function checkLedgerConnect(type, permissionsCheck) {
  if (type === LEDGER_CONNECT_TYPE.isPage && permissionsCheck) {
    let result = await ensureUSBPermission();
    if (result?.error) {
      return result;
    }
  }
  let timer = setTimeout(() => {
    timer = null;
    Loading.show();
  }, 1000);
  const { app, manualConnected, openApp } = await getApp(type);
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
  if (statusText === status.rejected) {
    return { rejected: true, publicKey: null };
  }
  if (publicKey) {
    return { publicKey };
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
async function networkId() {
  const networkConfig = await getCurrentNodeConfig()
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
    networkId: await networkId(),
    validUntil: 4294967295,
  };
  const { signature, returnCode, statusText } = await app.signTransaction(
    payload
  );
  if (statusText === status.rejected) {
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

export async function getLedgerStatus(){
  let app = null;
  if (!appInstance) {
    const transport = await getPort();
    if (transport) {
      app = new MinaLedgerJS(transport);
      portInstance = transport;
      appInstance = app;
    }else{
      return {status:LEDGER_STATUS.LEDGER_DISCONNECT}
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
    return { status: LEDGER_STATUS.LEDGER_CONNECT_APP_NOT_OPEN};
  }
  return { app,status:LEDGER_STATUS.READY };
}