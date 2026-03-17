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
  WALLET_CHECK_TX_STATUS,
  WALLET_IMPORT_LEDGER,
  WALLET_IMPORT_KEY_STORE,
  WALLET_GET_CREATE_MNEMONIC,
  WALLET_RESET_LAST_ACTIVE_TIME,
  WALLET_DELETE_WATCH_ACCOUNT,
  RESET_WALLET,
  DAPP_GET_CURRENT_ACCOUNT_CONNECT_STATUS,
  DAPP_DISCONNECT_SITE,
  DAPP_DELETE_ACCOUNT_CONNECT_HIS,
  DAPP_CHANGE_CONNECTING_ADDRESS,
  GET_SIGN_PARAMS_BY_ID,
  DAPP_CHANGE_NETWORK,
  WALLET_UPDATE_LOCK_TIME,
  WALLET_GET_LOCK_TIME,
  DAPP_CONNECTION_LIST,
  QA_SIGN_TRANSACTION,
  GET_WALLET_LOCK_STATUS,
  GET_LEDGER_ACCOUNT_NUMBER,
  WALLET_SEND_FIELDS_MESSAGE_TRANSACTION,
  GET_SIGN_PARAMS,
  WALLET_SEND_NULLIFIER,
  POPUP_ACTIONS,
  GET_APPROVE_PARAMS,
  CredentialMsg,
  // Multi-wallet message types
  WALLET_GET_KEYRINGS_LIST,
  WALLET_ADD_HD_KEYRING,
  WALLET_RENAME_KEYRING,
  WALLET_GET_KEYRING_MNEMONIC,
  WALLET_DELETE_KEYRING,
  WALLET_ADD_ACCOUNT_TO_KEYRING,
  WALLET_GET_VAULT_VERSION,
  WALLET_TRY_UPGRADE_VAULT,
  WALLET_GET_CREATE_MNEMONIC_CHALLENGE,
  WALLET_CONFIRM_CREATE_MNEMONIC,
  WALLET_CLEAR_CREATE_MNEMONIC,
  WALLET_GET_CREATE_FLOW_STATE,
} from "../constant/msgTypes";
import apiService from "./apiService";
import * as storage from "./storageService";
import dappService from "./DappService";
import browser from "webextension-polyfill";
import {
  POPUP_CHANNEL_KEYS,
  WALLET_CONNECT_TYPE,
} from "../constant/commonType";
import { TOKEN_BUILD } from "@/constant/tokenMsgTypes";
import {
  createOrActivateTab,
  lastWindowIds,
  startExtensionPopup,
} from "../utils/popup";
import { getExtensionAction } from "../utils/browserUtils";

// ============ Types ============

interface MessagePayload {
  messageSource?: string;
  action?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
}

// ============ Internal Functions ============

function internalMessageListener(
  message: MessagePayload | null | undefined,
  sender: browser.Runtime.MessageSender,
  sendResponse: (response?: unknown) => void
): boolean {
  if (!message || typeof message !== "object") {
    return false;
  }

  const { messageSource, action } = message;
  const payload = message.payload ?? {};
  if (messageSource === "messageFromDapp" || messageSource === "messageFromUpdate") {
    dappService
      .handleMessage(
        message as Parameters<typeof dappService.handleMessage>[0],
        sender,
        sendResponse as Parameters<typeof dappService.handleMessage>[2]
      )
      .catch((err) => {
        console.error("[messageListener]", action, err);
        const responseId =
          payload && typeof payload === "object" && "id" in payload
            ? (payload as { id?: unknown }).id
            : undefined;
        sendResponse({
          error: {
            message: "internalError",
          },
          id: responseId,
        });
      });
    return true;
  }
  if (messageSource) {
    return false;
  }
  if (!action) {
    return false;
  }
  try {
    switch (action) {
    case WALLET_CREATE_PWD:
      apiService.createPwd(payload.pwd).then(() => {
        sendResponse({ success: true });
      }).catch((err) => {
        console.error("[messageListener]", action, err);
        sendResponse({ success: false });
      });
      break;
    case WALLET_NEW_HD_ACCOUNT:
      apiService.createAccount(payload.mne).then((res) => {
        sendResponse(res);
      }).catch((err) => {
        console.error("[messageListener]", action, err);
        sendResponse();
      });
      break;
    case WALLET_GET_CURRENT_ACCOUNT:
      apiService.getCurrentAccount().then((account) => {
        sendResponse(account);
      }).catch((err) => {
        console.error("[messageListener]", action, err);
        sendResponse();
      });
      break;
    case WALLET_SET_UNLOCKED_STATUS:
      apiService.setUnlockedStatus(payload.status).then(() => {
        sendResponse();
      }).catch((err) => {
        console.error("[messageListener]", action, err);
        sendResponse();
      });
      break;
    case WALLET_APP_SUBMIT_PWD:
      apiService.submitPassword(payload.password).then((res) => {
        sendResponse(res);
      }).catch((err) => {
        console.error("[messageListener]", action, err);
        sendResponse();
      });
      break;
    case WALLET_GET_ALL_ACCOUNT:
      const account = apiService.getAllAccount();
      sendResponse(account);
      break;
    case WALLET_CREATE_HD_ACCOUNT:
      apiService.addHDNewAccount(payload.accountName).then((account) => {
        sendResponse(account);
      }).catch((err) => {
        console.error("[messageListener]", action, err);
        sendResponse();
      });
      break;
    case WALLET_IMPORT_HD_ACCOUNT:
      apiService
        .addImportAccount(payload.privateKey, payload.accountName)
        .then((account) => {
          sendResponse(account);
        }).catch((err) => {
          console.error("[messageListener]", action, err);
          sendResponse();
        });
      break;
    case WALLET_CHANGE_CURRENT_ACCOUNT:
      apiService.setCurrentAccount(payload.address).then((account) => {
        sendResponse(account);
      }).catch((err) => {
        console.error("[messageListener]", action, err);
        sendResponse();
      });
      break;
    case WALLET_CHANGE_ACCOUNT_NAME:
      apiService
        .changeAccountName(payload.address, payload.accountName)
        .then((account) => {
          sendResponse(account);
        }).catch((err) => {
          console.error("[messageListener]", action, err);
          sendResponse();
        });
      break;
    case WALLET_CHANGE_DELETE_ACCOUNT:
      apiService
        .deleteAccount(payload.address, payload.password)
        .then((account) => {
          sendResponse(account);
        }).catch((err) => {
          console.error("[messageListener]", action, err);
          sendResponse();
        });
      break;
    case WALLET_DELETE_WATCH_ACCOUNT:
      apiService.deleteAccount(payload.address, "").then((account) => {
        sendResponse(account);
      }).catch((err) => {
        console.error("[messageListener]", action, err);
        sendResponse();
      });
      break;
    case WALLET_CHECKOUT_PASSWORD:
      apiService.checkPassword(payload.password).then((result) => {
        sendResponse(result);
      }).catch((err) => {
        console.error("[messageListener]", action, err);
        sendResponse(false);
      });
      break;
    case WALLET_GET_MNE:
      apiService.getMnemonic(payload.password).then((mne) => {
        sendResponse(mne);
      }).catch((err) => {
        console.error("[messageListener]", action, err);
        sendResponse();
      });
      break;
    case WALLET_GET_PRIVATE_KEY:
      apiService
        .getPrivateKey(payload.address, payload.password)
        .then((privateKey) => {
          sendResponse(privateKey);
        }).catch((err) => {
          console.error("[messageListener]", action, err);
          sendResponse();
        });
      break;
    case WALLET_CHANGE_SEC_PASSWORD:
      apiService
        .updateSecPassword(payload.oldPassword, payload.password)
        .then((account) => {
          sendResponse(account);
        }).catch((err) => {
          console.error("[messageListener]", action, err);
          sendResponse();
        });
      break;
    case WALLET_CHECK_TX_STATUS:
      apiService.checkTxStatus(payload.paymentId, payload.hash, payload.type).then(() => {
        sendResponse();
      }).catch((err) => {
        console.error("[messageListener]", action, err);
        sendResponse();
      });
      break;
    case WALLET_IMPORT_LEDGER:
      apiService
        .addLedgerAccount(
          payload.address,
          payload.accountName,
          payload.accountIndex
        )
        .then((account) => {
          sendResponse(account);
        }).catch((err) => {
          console.error("[messageListener]", action, err);
          sendResponse();
        });
      break;
    case WALLET_IMPORT_KEY_STORE:
      apiService
        .addAccountByKeyStore(payload.keypair, payload.password, payload.accountName)
        .then((account) => {
          sendResponse(account);
        }).catch((err) => {
          console.error("[messageListener]", action, err);
          sendResponse();
        });
      break;
    case WALLET_GET_CREATE_MNEMONIC:
      apiService.getCreateMnemonic(payload.isNewMne).then((mne) => {
        sendResponse(mne);
      }).catch((err) => {
        console.error("[messageListener]", action, err);
        sendResponse("");
      });
      break;
    case WALLET_GET_CREATE_MNEMONIC_CHALLENGE:
      apiService.getCreateMnemonicChallenge().then((res) => {
        sendResponse(res);
      }).catch((err) => {
        console.error("[messageListener]", action, err);
        sendResponse({ error: "tryAgain", type: "local" });
      });
      break;
    case WALLET_CONFIRM_CREATE_MNEMONIC:
      apiService.confirmCreateMnemonic(payload.words).then((res) => {
        sendResponse(res);
      }).catch((err) => {
        console.error("[messageListener]", action, err);
        sendResponse({ error: "tryAgain", type: "local" });
      });
      break;
    case WALLET_CLEAR_CREATE_MNEMONIC:
      apiService.clearCreateMnemonic().then((res) => {
        sendResponse(res);
      }).catch((err) => {
        console.error("[messageListener]", action, err);
        sendResponse({ success: false });
      });
      break;
    case WALLET_GET_CREATE_FLOW_STATE:
      apiService.getCreateFlowState().then((res) => {
        sendResponse(res);
      }).catch((err) => {
        console.error("[messageListener]", action, err);
        sendResponse({ hasExistingWallet: false, isUnlocked: false });
      });
      break;
    case WALLET_RESET_LAST_ACTIVE_TIME:
      sendResponse(apiService.setLastActiveTime());
      break;
    case WALLET_UPDATE_LOCK_TIME:
      apiService.updateLockTime(payload.value).then(() => {
        sendResponse();
      }).catch((err) => {
        console.error("[messageListener]", action, err);
        sendResponse();
      });
      break;
    case WALLET_GET_LOCK_TIME:
      sendResponse(apiService.getCurrentAutoLockTime());
      break;
    case RESET_WALLET:
      dappService.clearAllPendingZk();
      apiService.resetWallet().then(() => {
        sendResponse();
      }).catch((err) => {
        console.error("[messageListener]", action, err);
        sendResponse();
      });
      break;
    case GET_SIGN_PARAMS_BY_ID:
      sendResponse(dappService.getSignParamsByOpenId(payload.openId));
      break;
    case GET_SIGN_PARAMS:
      sendResponse(dappService.getSignParams());
      break;
    case POPUP_ACTIONS.GET_ALL_PENDING_ZK:
      sendResponse(dappService.getAllPendingZK());
      break;
    case TOKEN_BUILD.getAllTokenPendingSign:
      sendResponse(dappService.getAllTokenSignParams());
      break;
    case GET_APPROVE_PARAMS:
      sendResponse(dappService.getApproveParams());
      break;
    case DAPP_GET_CURRENT_ACCOUNT_CONNECT_STATUS:
      sendResponse(
        dappService.getCurrentAccountConnectStatus(
          payload.siteUrl,
          payload.currentAddress
        )
      );
      break;
    case DAPP_DISCONNECT_SITE:
      sendResponse(dappService.disconnectDapp(payload.siteUrl, payload.address));
      break;
    case DAPP_DELETE_ACCOUNT_CONNECT_HIS:
      sendResponse(
        dappService.deleteDAppConnect(
          payload.address,
          payload.oldCurrentAddress,
          payload.currentAddress
        )
      );
      break;
    case DAPP_CHANGE_CONNECTING_ADDRESS:
      sendResponse(
        dappService.changeCurrentConnecting(payload.address, payload.currentAddress)
      );
      break;
    case DAPP_CHANGE_NETWORK:
      sendResponse(dappService.notifyNetworkChange(payload.netConfig));
      break;
    case WALLET_SEND_FIELDS_MESSAGE_TRANSACTION:
      apiService.signFields(payload).then((result) => {
        sendResponse(result);
      }).catch((err) => {
        console.error("[messageListener]", action, err);
        sendResponse();
      });
      break;
    case WALLET_SEND_NULLIFIER:
      apiService.createNullifierByApi(payload).then((result) => {
        sendResponse(result);
      }).catch((err) => {
        console.error("[messageListener]", action, err);
        sendResponse();
      });
      break;
    case QA_SIGN_TRANSACTION:
      apiService.sendTransaction(payload).then((result) => {
        sendResponse(result);
      }).catch((err) => {
        console.error("[messageListener]", action, err);
        sendResponse();
      });
      break;
    case DAPP_CONNECTION_LIST:
      sendResponse(dappService.getAppConnectionList(payload.address));
      break;
    case GET_WALLET_LOCK_STATUS:
      sendResponse(apiService.getLockStatus());
      break;
    case GET_LEDGER_ACCOUNT_NUMBER:
      sendResponse(apiService.getLedgerAccountIndex());
      break;
    case POPUP_ACTIONS.INIT_APPROVE_LIST:
      sendResponse(dappService.initApproveConnect());
      break;
    case POPUP_ACTIONS.POPUP_NOTIFICATION:
      sendResponse();
      break;
    case CredentialMsg.store_credential:
      apiService
        .storePrivateCredential(payload.address, payload.credential)
        .then((res) => {
          sendResponse(res);
        }).catch((err) => {
          console.error("[messageListener]", action, err);
          sendResponse();
        });
      break;
    case CredentialMsg.get_credentials:
      const getCredAddr = typeof payload === 'string' ? payload : payload.address;
      apiService.getPrivateCredential(getCredAddr).then((res) => {
        sendResponse(res);
      }).catch((err) => {
        console.error("[messageListener]", action, err);
        sendResponse();
      });
      break;
    case CredentialMsg.ID_LIST:
      const idListAddr = typeof payload === 'string' ? payload : payload.address;
      apiService.getCredentialIdList(idListAddr).then((res) => {
        sendResponse(res);
      }).catch((err) => {
        console.error("[messageListener]", action, err);
        sendResponse();
      });
      break;
    case CredentialMsg.target_credential:
      apiService
        .getTargetCredential(payload.address, payload.credentialId)
        .then((res) => {
          sendResponse(res);
        }).catch((err) => {
          console.error("[messageListener]", action, err);
          sendResponse();
        });
      break;
    case CredentialMsg.remove_credential_detail:
      apiService
        .removeTargetCredential(payload.address, payload.credentialId)
        .then((res) => {
          sendResponse(res);
        }).catch((err) => {
          console.error("[messageListener]", action, err);
          sendResponse();
        });
      break;
    // ============================================
    // Multi-Wallet Message Handlers
    // ============================================
    case WALLET_GET_KEYRINGS_LIST:
      sendResponse(apiService.getKeyringsList());
      break;
    case WALLET_ADD_HD_KEYRING:
      apiService.addHDKeyring(payload.mnemonic, payload.walletName).then((res) => {
        sendResponse(res);
      }).catch((err) => {
        console.error("[messageListener]", action, err);
        sendResponse();
      });
      break;
    case WALLET_RENAME_KEYRING:
      apiService.renameKeyring(payload.keyringId, payload.name).then((res) => {
        sendResponse(res);
      }).catch((err) => {
        console.error("[messageListener]", action, err);
        sendResponse();
      });
      break;
    case WALLET_GET_KEYRING_MNEMONIC:
      apiService
        .getKeyringMnemonic(payload.keyringId, payload.password)
        .then((res) => {
          sendResponse(res);
        }).catch((err) => {
          console.error("[messageListener]", action, err);
          sendResponse();
        });
      break;
    case WALLET_DELETE_KEYRING:
      apiService
        .deleteKeyring(payload.keyringId, payload.password)
        .then((res) => {
          sendResponse(res);
        }).catch((err) => {
          console.error("[messageListener]", action, err);
          sendResponse();
        });
      break;
    case WALLET_ADD_ACCOUNT_TO_KEYRING:
      apiService
        .addAccountToKeyring(payload.keyringId, payload.accountName)
        .then((res) => {
          sendResponse(res);
        }).catch((err) => {
          console.error("[messageListener]", action, err);
          sendResponse();
        });
      break;
    case WALLET_GET_VAULT_VERSION:
      sendResponse(apiService.getVaultVersion());
      break;
    case WALLET_TRY_UPGRADE_VAULT:
      apiService.tryUpgradeVault().then((res) => {
        sendResponse(res);
      }).catch((err) => {
        console.error("[messageListener]", action, err);
        sendResponse();
      });
      break;
    default:
      return false;
    }
    return true;
  } catch (err) {
    console.error("[messageListener] sync error", action, err);
    sendResponse();
    return true;
  }
}

let time: string | number = "";

function onConnectListener(externalPort: browser.Runtime.Port): void {
  const name = externalPort.name;
  externalPort.onDisconnect.addListener(async function () {
    if (name === WALLET_CONNECT_TYPE.WALLET_APP_CONNECT) {
      time = Date.now();
      storage.save({
        AppState: { lastClosed: time },
      });
    } else if (name === WALLET_CONNECT_TYPE.CONTENT_SCRIPT) {
      dappService.portDisconnectListener(externalPort);
    }
  });
  if (name === WALLET_CONNECT_TYPE.CONTENT_SCRIPT) {
    dappService.setupProviderConnection(externalPort);
  }
}

async function onClickIconListener(_tab: browser.Tabs.Tab): Promise<void> {
  const localAccount = await storage.get("keyringData");
  if (localAccount.keyringData) {
    startExtensionPopup();
  } else {
    createOrActivateTab("popup.html#/register_page");
  }
}

function removeListener(
  tabId: number,
  changeInfo: browser.Tabs.OnRemovedRemoveInfoType
): void {
  if (lastWindowIds[POPUP_CHANNEL_KEYS.popup] === changeInfo.windowId) {
    dappService.clearAllPendingZk();
    lastWindowIds[POPUP_CHANNEL_KEYS.popup] = undefined;
  }
  // welcome is create by tab , so match with tabId
  if (lastWindowIds[POPUP_CHANNEL_KEYS.welcome] === tabId) {
    lastWindowIds[POPUP_CHANNEL_KEYS.welcome] = undefined;
  }
}

export function setupMessageListeners(): void {
  browser.runtime.onMessage.addListener(internalMessageListener as Parameters<typeof browser.runtime.onMessage.addListener>[0]);
  browser.runtime.onConnect.addListener(onConnectListener);
  const action = getExtensionAction();
  action.onClicked.addListener(onClickIconListener);
  browser.tabs.onRemoved.addListener(removeListener);
}

interface ChromeOffscreen {
  createDocument(options: {
    url: string;
    reasons: string[];
    justification: string;
  }): Promise<void>;
}

interface ChromeWithOffscreen {
  offscreen?: ChromeOffscreen;
}

async function createOffscreen(): Promise<void> {
  const chromeWithOffscreen = chrome as unknown as ChromeWithOffscreen;
  if (chromeWithOffscreen.offscreen) {
    await chromeWithOffscreen.offscreen
      .createDocument({
        url: "offscreen.html",
        reasons: ["BLOBS"],
        justification: "keep service worker running",
      })
      .catch(() => {});
  }
}

browser.runtime.onStartup.addListener(createOffscreen);
(self as unknown as { onmessage: () => void }).onmessage = () => {};
createOffscreen();
