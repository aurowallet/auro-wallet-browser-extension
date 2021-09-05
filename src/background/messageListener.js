import {
  WALLET_APP_CONNECT,
  WALLET_APP_SUBMIT_PWD,
  WALLET_GET_CURRENT_ACCOUNT,
  WALLET_NEW_HD_ACCOUNT,
  WALLET_CREATE_PWD,
  WALLET_SET_UNLOCKED_STATUS,
  WALLET_GET_ALL_ACCOUNT,
  WALLET_CREATE_HD_ACCOUNT,
  WALLET_IMPORT_HD_ACCOUNT,
  WALLET_CHANGE_CURRENT_ACCOUNT,
  WALLET_CHANGE_ACCOUNT_NAME,
  WALLET_CHANGE_DELETE_ACCOUNT,
  WALLET_CHECKOUT_PASSWORD,
  WALLET_GET_MNE,
  WALLET_GET_PRIVATE_KEY,
  WALLET_CHANGE_SEC_PASSWORD,
  WALLET_GET_CURRENT_PRIVATE_KEY,
  WALLET_SEND_TRANSTRACTION,
  WALLET_SEND_STAKE_TRANSTRACTION,
  WALLET_CHECK_TX_STATUS,
  WALLET_IMPORT_LEDGER,
  WALLET_IMPORT_KEY_STORE,
  WALLET_GET_CREATE_MNEMONIC, WALLET_IMPORT_WATCH_MODE,
  WALLET_RESET_LAST_ACTIVE_TIME,
  WALLET_DELETE_WATCH_ACCOUNT,
  RESET_WALLET
} from "../constant/types";
import apiService from "./APIService";
import * as storage from "./storageService";
import extension from 'extensionizer'

function internalMessageListener(message, sender, sendResponse) {
  const { messageSource, action, payload } = message;
  if (messageSource) {
    return false;
  }
  switch (action) {
    case WALLET_CREATE_PWD:
      sendResponse(apiService.createPwd(payload.pwd));
      break;
    case WALLET_NEW_HD_ACCOUNT:
      apiService.createAccount(payload.mne).then(res => {
        sendResponse(res);
        return true;
      })
      break
    case WALLET_GET_CURRENT_ACCOUNT:
      apiService.getCurrentAccount().then(account => {
        sendResponse(account);
        return true;
      })
      break;
    case WALLET_SET_UNLOCKED_STATUS:
      sendResponse(apiService.setUnlockedStatus(payload));
      break;
    case WALLET_APP_SUBMIT_PWD:
      apiService.submitPassword(payload).then((res, err) => {
        sendResponse(res);
      })
      break;
    case WALLET_GET_ALL_ACCOUNT:
      let account = apiService.getAllAccount()
      sendResponse(account);
      break;
    case WALLET_CREATE_HD_ACCOUNT:
      apiService.addHDNewAccount(payload.accountName).then((account) => {
        sendResponse(account);
      })
      break;
    case WALLET_IMPORT_HD_ACCOUNT:
      apiService.addImportAccount(payload.privateKey, payload.accountName).then((account) => {
        sendResponse(account);
      })
      break;
    case WALLET_CHANGE_CURRENT_ACCOUNT:
      apiService.setCurrentAccount(payload).then((account) => {
        sendResponse(account);
      })
      break;
    case WALLET_CHANGE_ACCOUNT_NAME:
      apiService.changeAccountName(payload.address, payload.accountName).then((account) => {
        sendResponse(account);
      })
      break;
    case WALLET_CHANGE_DELETE_ACCOUNT:
      apiService.deleteAccount(payload.address, payload.password).then((account) => {
        sendResponse(account);
      })
      break;
    case WALLET_DELETE_WATCH_ACCOUNT:
      apiService.deleteAccount(payload.address).then((account) => {
        sendResponse(account);
      })
      break;
    case WALLET_CHECKOUT_PASSWORD:
      sendResponse(apiService.checkPassword(payload.password))
      break;
    case WALLET_GET_MNE:
      apiService.getMnemonic(payload.password).then((mne) => {
        sendResponse(mne);
      })
      break;
    case WALLET_GET_PRIVATE_KEY:
      apiService.getPrivateKey(payload.address, payload.password).then((privateKey) => {
        sendResponse(privateKey);
      })
      break;
    case WALLET_CHANGE_SEC_PASSWORD:
      apiService.updateSecPassword(payload.oldPassword, payload.password).then((account) => {
        sendResponse(account);
      })
      break;
    case WALLET_GET_CURRENT_PRIVATE_KEY:
      apiService.getCurrentPrivateKey().then((privateKey) => {
        sendResponse(privateKey);
      })
      break;
    case WALLET_SEND_TRANSTRACTION:
      apiService.sendTransaction(payload).then((result) => {
        sendResponse(result);
      })
      break;
    case WALLET_SEND_STAKE_TRANSTRACTION:
      apiService.sendStakTransaction(payload).then((result) => {
        sendResponse(result);
      })
      break;
    case WALLET_CHECK_TX_STATUS:
      sendResponse(apiService.checkTxStatus(payload.paymentId, payload.hash));
      break;
    case WALLET_IMPORT_LEDGER:
      apiService.addLedgerAccount(payload.address, payload.accountName, payload.accountIndex).then((account) => {
        sendResponse(account);
      })
      break;
    case WALLET_IMPORT_WATCH_MODE:
      apiService.addWatchModeAccount(payload.address, payload.accountName).then((account) => {
        sendResponse(account);
      })
      break;
    case WALLET_IMPORT_KEY_STORE:
      apiService.addAccountByKeyStore(payload.keypair, payload.password,payload.accountName).then((account) => {
        sendResponse(account);
      })
      break;
    case WALLET_GET_CREATE_MNEMONIC:
      sendResponse(apiService.getCreateMnemonic(payload.isNewMne))
      break
    case WALLET_RESET_LAST_ACTIVE_TIME:
      sendResponse(apiService.setLastActiveTime())
      break
    case RESET_WALLET:
        sendResponse(apiService.resetWallet())
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
    if (name === WALLET_APP_CONNECT) {
      time = Date.now()
      storage.save({
        AppState: { lastClosed: time },
      });
    }

  });
}
export function setupMessageListeners() {
  extension.runtime.onMessage.addListener(internalMessageListener);
  extension.runtime.onConnect.addListener(onConnectListener);
}
