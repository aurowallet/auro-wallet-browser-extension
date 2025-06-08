import {
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
  WALLET_SEND_TRANSACTION,
  WALLET_SEND_STAKE_TRANSACTION,
  WALLET_CHECK_TX_STATUS,
  WALLET_IMPORT_LEDGER,
  WALLET_IMPORT_KEY_STORE,
  WALLET_GET_CREATE_MNEMONIC, WALLET_IMPORT_WATCH_MODE,
  WALLET_RESET_LAST_ACTIVE_TIME,
  WALLET_DELETE_WATCH_ACCOUNT,
  RESET_WALLET,
  DAPP_GET_CURRENT_ACCOUNT_CONNECT_STATUS, DAPP_GET_CONNECT_STATUS, DAPP_DISCONNECT_SITE, DAPP_DELETE_ACCOUNT_CONNECT_HIS, DAPP_CHANGE_CONNECTING_ADDRESS, GET_SIGN_PARAMS_BY_ID, WALLET_SEND_MESSAGE_TRANSACTION, DAPP_CHANGE_NETWORK,WALLET_UPDATE_LOCK_TIME, WALLET_GET_LOCK_TIME, DAPP_CONNECTION_LIST, QA_SIGN_TRANSACTION,GET_WALLET_LOCK_STATUS, GET_LEDGER_ACCOUNT_NUMBER, WALLET_SEND_FIELDS_MESSAGE_TRANSACTION, GET_SIGN_PARAMS, WALLET_SEND_NULLIFIER, POPUP_ACTIONS,
  GET_APPROVE_PARAMS,
  CredentialMsg
} from "../constant/msgTypes";
import apiService from "./APIService";
import * as storage from "./storageService";
import dappService from "./DappService";
import browser from 'webextension-polyfill';
import { POPUP_CHANNEL_KEYS, WALLET_CONNECT_TYPE } from "../constant/commonType";
import { TOKEN_BUILD } from "@/constant/tokenMsgTypes";
import { createOrActivateTab, lastWindowIds, startExtensionPopup } from "../utils/popup";
import { getExtensionAction } from "../utils/utils";

function internalMessageListener(message, sender, sendResponse) {
  const { messageSource, action, payload } = message;
  if (messageSource === 'messageFromDapp' || messageSource ===  "messageFromUpdate") {
    dappService.handleMessage(message, sender, sendResponse)
    return true
  }
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
    case WALLET_SEND_TRANSACTION:
      apiService.sendLegacyPayment(payload).then((result) => {
        sendResponse(result);
      })
      break;
    case WALLET_SEND_STAKE_TRANSACTION:
      apiService.sendLegacyStakeDelegation(payload).then((result) => {
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
      apiService.addAccountByKeyStore(payload.keypair, payload.password, payload.accountName).then((account) => {
        sendResponse(account);
      })
      break;
    case WALLET_GET_CREATE_MNEMONIC:
      sendResponse(apiService.getCreateMnemonic(payload.isNewMne))
      break
    case WALLET_RESET_LAST_ACTIVE_TIME:
      sendResponse(apiService.setLastActiveTime())
      break
    case WALLET_UPDATE_LOCK_TIME:
      sendResponse(apiService.updateLockTime(payload))
      break
    case WALLET_GET_LOCK_TIME:
      sendResponse(apiService.getCurrentAutoLockTime())
      break
    case RESET_WALLET:
      sendResponse(apiService.resetWallet())
      break
    case GET_SIGN_PARAMS_BY_ID:
      sendResponse(dappService.getSignParamsByOpenId(payload.openId))
      break
    case GET_SIGN_PARAMS:
      sendResponse(dappService.getSignParams())
      break
    case POPUP_ACTIONS.GET_ALL_PENDING_ZK:
      sendResponse(dappService.getAllPendingZK())
      break
    case TOKEN_BUILD.getAllTokenPendingSign:
      sendResponse(dappService.getAllTokenSignParams())
      break;
    case GET_APPROVE_PARAMS:
      sendResponse(dappService.getApproveParams())
      break
    case DAPP_GET_CURRENT_ACCOUNT_CONNECT_STATUS:
      sendResponse(dappService.getCurrentAccountConnectStatus(payload.siteUrl, payload.currentAddress))
      break
    case DAPP_GET_CONNECT_STATUS:
      sendResponse(dappService.getConnectStatus(payload.siteUrl, payload.address))
      break
    case DAPP_DISCONNECT_SITE:
      sendResponse(dappService.disconnectDapp(payload.siteUrl, payload.address))
      break
    case DAPP_DELETE_ACCOUNT_CONNECT_HIS:
      sendResponse(dappService.deleteDAppConnect(payload.address, payload.oldCurrentAddress, payload.currentAddress))
      break
    case DAPP_CHANGE_CONNECTING_ADDRESS:
      sendResponse(dappService.changeCurrentConnecting(payload.address, payload.currentAddress))
      break
    case DAPP_CHANGE_NETWORK:
      sendResponse(dappService.notifyNetworkChange(payload.netConfig))
      break
    case WALLET_SEND_MESSAGE_TRANSACTION:
      apiService.signMessage(payload).then((result) => {
        sendResponse(result);
      })
      break;
    case WALLET_SEND_FIELDS_MESSAGE_TRANSACTION:
      apiService.signFields(payload).then((result) => {
        sendResponse(result);
      })
      break;
    case WALLET_SEND_NULLIFIER:
      apiService.createNullifierByApi(payload).then((result) => {
        sendResponse(result);
      })
      break;
    case QA_SIGN_TRANSACTION:
      apiService.sendTransaction(payload).then((result) => {
        sendResponse(result);
      })
      break;
    case DAPP_CONNECTION_LIST:
      sendResponse(dappService.getAppConnectionList(payload.address))
      break
    case GET_WALLET_LOCK_STATUS:
      sendResponse(apiService.getLockStatus())
      break
    case GET_LEDGER_ACCOUNT_NUMBER:
      sendResponse(apiService.getLedgerAccountIndex())
      break
    case POPUP_ACTIONS.INIT_APPROVE_LIST:
      sendResponse(dappService.initApproveConnect())
      break
    case CredentialMsg.store_credential:
      apiService.storePrivateCredential(payload.address,payload.credential).then((res, err) => {
        sendResponse(res);
      })
      break;
    case CredentialMsg.get_credentials:
      apiService.getPrivateCredential(payload).then((res, err) => {
        sendResponse(res);
      })
      break;
    case CredentialMsg.ID_LIST:
      apiService.getCredentialIdList(payload).then((res, err) => {
        sendResponse(res);
      })
      break;
    case CredentialMsg.target_credential:
      apiService.getTargetCredential(payload.address,payload.credentialId).then((res, err) => {
        sendResponse(res);
      })
      break;
      case CredentialMsg.remove_credential_detail:
      apiService.removeTargetCredential(payload.address,payload.credentialId).then((res, err) => {
        sendResponse(res);
      })
      break;
    default:
      break;
  }
  return true;
}

let time = ""
function onConnectListener(externalPort) {
  const name = externalPort.name;
  externalPort.onDisconnect.addListener(async function () {
    if (name === WALLET_CONNECT_TYPE.WALLET_APP_CONNECT) {
      time = Date.now()
      storage.save({
        AppState: { lastClosed: time },
      });
    } else if (name === WALLET_CONNECT_TYPE.CONTENT_SCRIPT) {
      dappService.portDisconnectListener(externalPort)
    }
  });
  if (name === WALLET_CONNECT_TYPE.CONTENT_SCRIPT) {
    dappService.setupProviderConnection(externalPort)
  }
}

async function onClickIconListener(tab) {
  let localAccount = await storage.get("keyringData")
  if(localAccount.keyringData){
    startExtensionPopup()
  }else{
    createOrActivateTab("popup.html#/register_page")
  }
}
function removeListener (tabId, changeInfo) {
  if(lastWindowIds[POPUP_CHANNEL_KEYS.popup] === changeInfo.windowId){
    dappService.clearAllPendingZk()
    lastWindowIds[POPUP_CHANNEL_KEYS.popup] = undefined
  }
  // welcome is create by tab , so match with tabId
  if(lastWindowIds[POPUP_CHANNEL_KEYS.welcome] === tabId){
    lastWindowIds[POPUP_CHANNEL_KEYS.welcome] = undefined
  }
}
export function setupMessageListeners() {
  browser.runtime.onMessage.addListener(internalMessageListener);
  browser.runtime.onConnect.addListener(onConnectListener);
  const action = getExtensionAction()
  action.onClicked.addListener(onClickIconListener)
  browser.tabs.onRemoved.addListener(removeListener);
}

async function createOffscreen() {
  if(chrome.offscreen){
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['BLOBS'],
      justification: 'keep service worker running',
    }).catch(() => {});
  }
}
browser.runtime.onStartup.addListener(createOffscreen);
self.onmessage = e => {};
createOffscreen();