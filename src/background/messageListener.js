import {
  MINA_APP_CONNECT,
  MINA_APP_SUBMIT_PWD,
  MINA_GET_CURRENT_ACCOUNT,
  MINA_NEW_HD_ACCOUNT,
  MINA_CREATE_PWD,
  MINA_SET_UNLOCKED_STATUS,
  MINA_GET_ALL_ACCOUNT,
  MINA_CREATE_HD_ACCOUNT,
  MINA_IMPORT_HD_ACCOUNT,
  MINA_CHANGE_CURRENT_ACCOUNT,
  MINA_CHANGE_ACCOUNT_NAME,
  MINA_CHANGE_DELETE_ACCOUNT,
  MINA_CHECKOUT_PASSWORD,
  MINA_GET_MNE,
  MINA_GET_PRIVATE_KEY,
  MINA_CHANGE_SEC_PASSWORD,
  MINA_GET_CURRENT_PRIVATE_KEY,
  MINA_SEND_TRANSTRACTION,
  MINA_SEND_STAKE_TRANSTRACTION,
  MINA_CHECK_TX_STATUS,
  MINA_IMPORT_LEDGER,
  MINA_IMPORT_KEY_STORE ,
  MINA_GET_CREATE_MNEMONIC
} from "../constant/types";
import apiService from "./APIService";
import * as storage from "./storageService";

function internalMessageListener(message, sender, sendResponse) {
  const { messageSource, action, payload } = message;
  if (messageSource) {
    return false;
  }
  switch (action) {
    case MINA_CREATE_PWD:
      sendResponse(apiService.createPwd(payload.pwd));
      break;
    case MINA_NEW_HD_ACCOUNT:
      apiService.createAccount(payload.mne).then(res => {
        sendResponse(res);
        return true;
      })
      break
    case MINA_GET_CURRENT_ACCOUNT:
      apiService.getCurrentAccount().then(account => {
        sendResponse(account);
        return true;
      })
      break;
    case MINA_SET_UNLOCKED_STATUS:
      sendResponse(apiService.setUnlockedStatus(payload));
      break;
    case MINA_APP_SUBMIT_PWD:
      apiService.submitPassword(payload).then((res, err) => {
        sendResponse(res);
      })
      break;
    case MINA_GET_ALL_ACCOUNT:
      let account = apiService.getAllAccount()
      sendResponse(account);
      break;
    case MINA_CREATE_HD_ACCOUNT:
      apiService.addHDNewAccount(payload.accountName).then((account) => {
        sendResponse(account);
      })
      break;
    case MINA_IMPORT_HD_ACCOUNT:
      apiService.addImportAccount(payload.privateKey, payload.accountName).then((account) => {
        sendResponse(account);
      })
      break;
    case MINA_CHANGE_CURRENT_ACCOUNT:
      apiService.setCurrentAccount(payload).then((account) => {
        sendResponse(account);
      })
      break;
    case MINA_CHANGE_ACCOUNT_NAME:
      apiService.changeAccountName(payload.address, payload.accountName).then((account) => {
        sendResponse(account);
      })
      break;
    case MINA_CHANGE_DELETE_ACCOUNT:
      apiService.deleteAccount(payload.address, payload.password).then((account) => {
        sendResponse(account);
      })
      break;
    case MINA_CHECKOUT_PASSWORD:
      sendResponse(apiService.checkPassword(payload.password))
      break;
    case MINA_GET_MNE:
      apiService.getMnemonic(payload.password).then((mne) => {
        sendResponse(mne);
      })
      break;
    case MINA_GET_PRIVATE_KEY:
      apiService.getPrivateKey(payload.address, payload.password).then((privateKey) => {
        sendResponse(privateKey);
      })
      break;
    case MINA_CHANGE_SEC_PASSWORD:
      apiService.updateSecPassword(payload.oldPassword, payload.password).then((account) => {
        sendResponse(account);
      })
      break;
    case MINA_GET_CURRENT_PRIVATE_KEY:
      apiService.getCurrentPrivateKey().then((privateKey) => {
        sendResponse(privateKey);
      })
      break;
    case MINA_SEND_TRANSTRACTION:
      apiService.sendTransaction(payload).then((result) => {
        sendResponse(result);
      })
      break;
    case MINA_SEND_STAKE_TRANSTRACTION:
      apiService.sendStakTransaction(payload).then((result) => {
        sendResponse(result);
      })
      break;
    case MINA_CHECK_TX_STATUS:
      sendResponse(apiService.checkTxStatus(payload.paymentId, payload.hash));
      break;
    case MINA_IMPORT_LEDGER:
      apiService.addLedgerAccount(payload.address, payload.accountName).then((account) => {
        sendResponse(account);
      })
      break;
    case MINA_IMPORT_KEY_STORE:
      apiService.addAccountByKeyStore(payload.keypair, payload.password,payload.accountName).then((account) => {
        sendResponse(account);
      })
      break;
    case MINA_GET_CREATE_MNEMONIC:
      sendResponse(apiService.getCreateMnemonic())
      break
    default:
      break;
  }
  return true;
}

let time = ""
function onConnectListener(externalPort) {
  const name = externalPort.name;
  externalPort.onDisconnect.addListener(async function () {
    if (name === MINA_APP_CONNECT) {
      time = Date.now()
      storage.save({
        AppState: { lastClosed: time },
      });
    }

  });
}
export function setupMessageListeners() {
  chrome.runtime.onMessage.addListener(internalMessageListener);
  chrome.runtime.onConnect.addListener(onConnectListener);
}
