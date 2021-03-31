import Transport from "@ledgerhq/hw-transport-webusb"
import {MinaLedgerJS, Networks, TxType} from "mina-ledger-js"
import {closePopupWindow, openPopupWindow} from "./popup"
import {LEDGER_CONNECTED_SUCCESSFULLY} from "../constant/types"
import Loading from "../popup/component/Loading";
import BigNumber from "bignumber.js";
import {cointypes} from "../../config";
import Toast from "../popup/component/Toast";
import {getLanguage} from "../i18n";
const status = {
  rejected: 'CONDITIONS_OF_USE_NOT_SATISFIED',
}
function initLedgerWindowListener () {
  return new Promise((resolve)=>{
    async function onMessage (message, sender, sendResponse) {
      const { action } = message
      switch (action) {
        case LEDGER_CONNECTED_SUCCESSFULLY:
          chrome.runtime.onMessage.removeListener(onMessage)
          resolve()
          sendResponse && sendResponse()
          break
      }
    }
    chrome.runtime.onMessage.addListener(onMessage)
  })
}
async function openLedgerWindow () {
  openPopupWindow('./popup.html#/ledger_connect', 'ledger')
  await initLedgerWindowListener()
  Toast.info(getLanguage('ledgerConnectSuccess'))
  return {connected: true}
}
async function getPort() {
  const transport = await Transport.create().catch((e)=>{
    return null
  })
  return transport;
}
let appInstance = null;
let portInstance = null;
export async function getApp() {
  let app = null
  if (!appInstance) {
    const transport = await getPort()
    if (transport) {
      app = new MinaLedgerJS(transport)
      portInstance = transport
      appInstance = app
    } else {
      await openLedgerWindow()
      return  {manualConnected: true, app: null}
    }
  } else {
    app = appInstance
  }
  let timer = null
  const result = await Promise.race([
    app.getAppName(),
    new Promise((resolve)=>{
      timer = setTimeout(()=>{
        timer = null
        resolve({timeout: true})
      }, 300)
    })
  ]);
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  if (result.returnCode === '5000' || !result.name || result.timeout) {
    portInstance.close()
    portInstance = null
    appInstance = null
    await openLedgerWindow()
    return {manualConnected: true, app: null}
  }
  if (app) {
    closePopupWindow('ledger')
  }
  return {app}
}

export async function checkLedgerConnect() {
  let timer = setTimeout(()=>{
    timer = null;
    Loading.show()
  },1000)
  const {app} = await getApp()
  if (timer) {
    clearTimeout(timer)
  } else {
    Loading.hide()
  }
  return {ledgerApp: app}
}

export async function requestAccount(app) {
  const {publicKey, returnCode, statusText, ...others} = await app.getAddress(0)
  if (statusText === status.rejected) {
    return {rejected: true, publicKey: null}
  }
  if (publicKey) {
    return {publicKey}
  } else {
    return {publicKey:null};
  }
}

export async function requestSignDelegation (app, body) {
  return requestSign(app, body, TxType.DELEGATION)
}

export async function requestSignPayment (app, body) {
  return requestSign(app, body, TxType.PAYMENT)
}

async function requestSign(app, body, type) {
  // fromAddress, toAddress, fee, nonce, memo
  let amount = body.amount || 0
  let decimal = new BigNumber(10).pow(cointypes.decimals)
  let sendFee = new BigNumber(body.fee).multipliedBy(decimal).toNumber()
  let sendAmount = new BigNumber(amount).multipliedBy(decimal).toNumber()
  let payload = {
    txType: type,
    senderAccount: 0,
    senderAddress: body.fromAddress,
    receiverAddress: body.toAddress,
    amount: sendAmount,
    fee: sendFee,
    nonce: +body.nonce,
    memo: body.memo || "",
    networkId: Networks.MAINNET,
    validUntil: 4294967295
  }
  const {signature, returnCode, statusText} = await app.signTransaction(payload)
  if (statusText === status.rejected) {
    return {rejected: true, publicKey: null, error: {message: getLanguage('ledgerRejected')}}
  }
  if (returnCode !== '9000') {
    return {signature: null, error: {message: statusText}}
  }
  return {
    signature,
    payload: {
      fee: payload.fee,
      from: payload.senderAddress,
      to: payload.receiverAddress,
      nonce: payload.nonce,
      amount: payload.amount,
      memo: payload.memo,
      validUntil: payload.validUntil,
    }
  }
}
