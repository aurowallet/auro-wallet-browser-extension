import { POPUP_CHANNEL_KEYS } from "@/constant/commonType";
import { errorCodes } from "@/constant/dappError";
import { Default_Network_List, type NetworkConfig } from "@/constant/network";
import { ZKAPP_APPROVE_LIST } from "@/constant/storageKey";
import { TOKEN_BUILD } from "@/constant/tokenMsgTypes";
import { decryptData, encryptData } from "@/utils/fore";
import {
  checkPresentationRequestSchema,
  checkStoredCredentialSchema,
} from "@/utils/o1jsUtils";
import BigNumber from "bignumber.js";
import { extractTokenTransferInfo, verifyTokenCommand, zkCommondFormat } from "@/utils/zkUtils";
import { DAppActions } from "@aurowallet/mina-provider";
import browser from "webextension-polyfill";
import {
  node_public_keys,
  react_private_keys,
  TOKEN_BUILD_URL,
} from "../../config";
import {
  DAPP_ACTION_CANCEL_ALL,
  DAPP_ACTION_CLOSE_WINDOW,
  DAPP_ACTION_CREATE_NULLIFIER,
  DAPP_ACTION_GET_ACCOUNT,
  DAPP_ACTION_REQUEST_PRESENTATION,
  DAPP_ACTION_SEND_TRANSACTION,
  DAPP_ACTION_SIGN_MESSAGE,
  DAPP_ACTION_STORE_CREDENTIAL,
  DAPP_ACTION_SWITCH_CHAIN,
  WORKER_ACTIONS,
} from "../constant/msgTypes";
import {
  getCurrentNodeConfig,
  getExtensionAction,
  getLocalNetworkList,
} from "../utils/browserUtils";
import { sendMsg } from "../utils/commonMsg";
import {
  closePopupWindow,
  lastWindowIds,
  PopupSize,
  startExtensionPopup,
  startPopupWindow,
} from "../utils/popup";
import {
  addressValid,
  checkNodeExist,
  getArrayDiff,
  getMessageFromCode,
  getOriginFromUrl,
  isNumber,
  removeUrlFromArrays,
  urlValid,
  urlValidStrict,
} from "../utils/utils";
import apiService from "./apiService";
import { verifyFieldsMessage, verifyMessage } from "./lib";
import { get, save } from "./storageService";

import { v4 as uuidv4 } from "uuid";
import pkg from "../../package.json";

// ============================================
// Types
// ============================================

interface Site {
  origin: string;
  [key: string]: unknown;
}

interface SignRequest {
  id: string;
  params: Record<string, unknown>;
  site: Site;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  time: number;
}

interface ApproveRequest {
  id: string;
  site: Site;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

interface DappMessage {
  action: string;
  payload: {
    id: string;
    params: Record<string, unknown>;
    site: Site;
    [key: string]: unknown;
  };
}

// ============================================
// Module State
// ============================================

let signRequests: SignRequest[] = [];
let approveRequests: ApproveRequest[] = [];
let chainRequests: SignRequest[] = [];
let tokenSignRequests: SignRequest[] = [];

export const windowId = {
  approve_page: "approve_page",
  request_sign: "request_sign",
  token_sign: "token_sign",
};

const ZKAPP_CHAIN_ACTION = [
  DAppActions.mina_addChain,
  DAppActions.mina_switchChain,
];

import { memStore as dappStore } from "@/store";

// ============================================
// Types
// ============================================

/**
 * Message listener type for browser.runtime.onMessage
 */
type MessageListener = (
  message: { action: string; payload: Record<string, unknown> },
  sender: browser.Runtime.MessageSender,
  sendResponse: (response?: unknown) => void
) => boolean | void;

/**
 * Type for browser.runtime.onMessage listener parameter
 */
type BrowserMessageListener = Parameters<typeof browser.runtime.onMessage.addListener>[0];

const READ_ONLY_ACTIONS = new Set([
  DAppActions.mina_accounts,
  DAppActions.mina_requestNetwork,
  DAppActions.mina_verifyMessage,
  DAppActions.mina_verify_JsonMessage,
  DAppActions.mina_verifyFields,
  DAppActions.wallet_info,
  TOKEN_BUILD.getParams,
]);

class RateLimiter {
  private requests = new Map<string, number[]>();

  isAllowed(origin: string, action: string): boolean {
    const isReadOnly = READ_ONLY_ACTIONS.has(action);
    const maxRequests = isReadOnly ? 120 : 60;
    const windowMs = 60000;

    const key = `${origin}:${isReadOnly ? "read" : "write"}`;
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const recent = timestamps.filter((t) => now - t < windowMs);

    if (recent.length >= maxRequests) {
      this.requests.set(key, recent);
      return false;
    }

    recent.push(now);
    this.requests.set(key, recent);
    return true;
  }
}

const dappRateLimiter = new RateLimiter();

function getExtensionBaseUrl(): string {
  return browser.runtime.getURL("");
}

function isExtensionPopupUrl(url: string): boolean {
  const baseUrl = getExtensionBaseUrl();
  return url.startsWith(`${baseUrl}popup.html`);
}

function getSenderUrls(sender: browser.Runtime.MessageSender): string[] {
  const nextUrls = [
    sender.url,
    (sender as browser.Runtime.MessageSender & { origin?: string }).origin,
    sender.tab?.url,
  ].filter((value): value is string => typeof value === "string" && value.length > 0);
  return [...new Set(nextUrls)];
}

function isFromExtensionPopup(sender: browser.Runtime.MessageSender): boolean {
  if (sender.id !== browser.runtime.id) {
    return false;
  }
  return getSenderUrls(sender).some((url) => isExtensionPopupUrl(url));
}

// ============================================
// DappService Class
// ============================================

class DappService {
  private signEventListener: MessageListener | undefined;
  private tokenSignListener: MessageListener | undefined;
  private approveEventListener: MessageListener | undefined;

  constructor() {}

  requestCallback(
    request: () => Promise<unknown>,
    id: string,
    sendResponse: (response: unknown) => void
  ): void {
    request()
      .then((data) => {
        sendResponse({
          result: data,
          id: id,
        });
      })
      .catch((error) => {
        sendResponse({
          error: { ...error },
          id: id,
        });
      });
  }

  async handleMessage(
    message: DappMessage,
    sender: browser.Runtime.MessageSender,
    sendResponse: (response: unknown) => void
  ): Promise<void> {
    const {
      action,
      payload: { id, params, site },
    } = message;

    if (site?.origin && !dappRateLimiter.isAllowed(site.origin, action)) {
      sendResponse({
        error: {
          code: errorCodes.throwError,
          message: "Rate limit exceeded. Please try again later.",
        },
        id,
      });
      return;
    }

    switch (action) {
      case DAppActions.mina_requestAccounts:
        this.requestCallback(
          () => this.requestAccounts(id, site),
          id,
          sendResponse
        );
        break;
      case DAppActions.mina_accounts:
        this.requestCallback(
          () => this.requestConnectedAccount(site),
          id,
          sendResponse
        );
        break;
      case DAppActions.mina_sendPayment:
      case DAppActions.mina_sendStakeDelegation:
      case DAppActions.mina_sendTransaction:
        this.requestCallback(
          () => this.signTransaction(id, { ...params, action }, site),
          id,
          sendResponse
        );
        break;
      case DAppActions.mina_signMessage:
      case DAppActions.mina_sign_JsonMessage:
      case DAppActions.mina_signFields:
        this.requestCallback(
          () => this.signTransaction(id, { ...params, action }, site),
          id,
          sendResponse
        );
        break;
      case DAppActions.mina_storePrivateCredential:
      case DAppActions.mina_requestPresentation:
        this.requestCallback(
          () => this.signTransaction(id, { ...params, action }, site),
          id,
          sendResponse
        );
        break;
      case DAppActions.mina_verifyMessage:
      case DAppActions.mina_verify_JsonMessage:
        this.requestCallback(
          () =>
            verifyMessage(
              (params as any).publicKey,
              (params as any).signature,
              (params as any).data
            ),
          id,
          sendResponse
        );
        break;
      case DAppActions.mina_requestNetwork:
        this.requestCallback(() => this.requestNetwork(), id, sendResponse);
        break;
      case DAppActions.mina_verifyFields:
        this.requestCallback(
          () =>
            verifyFieldsMessage(
              (params as any).publicKey,
              (params as any).signature,
              (params as any).data
            ),
          id,
          sendResponse
        );
        break;
      case DAppActions.mina_switchChain:
        this.requestCallback(
          () => this.signTransaction(id, { ...params, action }, site),
          id,
          sendResponse
        );
        break;
      case DAppActions.mina_addChain:
        this.requestCallback(
          () => this.signTransaction(id, { ...params, action }, site),
          id,
          sendResponse
        );
        break;
      case DAppActions.mina_createNullifier:
        this.requestCallback(
          () => this.signTransaction(id, { ...params, action }, site),
          id,
          sendResponse
        );
        break;
      case TOKEN_BUILD.add:
        const addId = await this.addTokenBuildList(message.payload as any);
        sendResponse(addId);
        break;
      case TOKEN_BUILD.getParams:
        this.requestCallback(
          () => this.getTokenParamsById(message.payload as any),
          id,
          sendResponse
        );
        break;
      case TOKEN_BUILD.requestSign:
        this.requestCallback(
          () => this.requestTokenBuildSign(id, { ...params, action }, site),
          id,
          sendResponse
        );
        break;
      case DAppActions.wallet_info:
        this.requestCallback(() => this.getWalletInfo(), id, sendResponse);
        break;
      case DAppActions.wallet_revokePermissions:
        this.requestCallback(
          () => this.revokePermissions(message.payload as any),
          id,
          sendResponse
        );
        break;
      default:
        this.requestCallback(
          async () => {
            return {
              code: errorCodes.unsupportedMethod,
              message: getMessageFromCode(errorCodes.unsupportedMethod),
            };
          },
          id,
          sendResponse
        );
        break;
    }
  }

  async signTransaction(
    id: string,
    params: Record<string, unknown>,
    site: Site
  ): Promise<unknown> {
    return new Promise(async (resolve, reject) => {
      const that = this;
      let listenerAdded = false;
      try {
        let nextParams: Record<string, unknown> = { ...params };
        const currentAccount = this.getCurrentAccountAddress();
        const approveAccountStatus = this.getCurrentAccountConnectStatus(
          site.origin,
          currentAccount
        );

        if (!approveAccountStatus) {
          reject({
            code: errorCodes.userDisconnect,
            message: getMessageFromCode(errorCodes.userDisconnect),
          });
          return;
        }

        const sendAction = params.action as string;

        if (
          ZKAPP_CHAIN_ACTION.indexOf(sendAction) !== -1 &&
          chainRequests.length > 0
        ) {
          reject({
            code: errorCodes.zkChainPending,
            message: getMessageFromCode(errorCodes.zkChainPending),
          });
          return;
        }

        let currentChainInfo: NetworkConfig | Record<string, never> | undefined;
        if (ZKAPP_CHAIN_ACTION.indexOf(sendAction) !== -1) {
          currentChainInfo = await this.requestCurrentNetwork();
        }

        if (sendAction === DAppActions.mina_switchChain) {
          const customNodeList = await getLocalNetworkList();
          const allNodeList = [...Default_Network_List, ...customNodeList];
          const currentSupportChainList = allNodeList.map((node: NetworkConfig): string | undefined => {
            return node.networkID;
          });
          const nextChainIndex = currentSupportChainList.indexOf(
            params.networkID as string
          );
          if (nextChainIndex === -1) {
            reject({
              code: errorCodes.notSupportChain,
              message: getMessageFromCode(errorCodes.notSupportChain),
            });
            return;
          }
          if (currentChainInfo?.networkID === params.networkID) {
            resolve({
              networkID: currentChainInfo!.networkID,
            });
            return;
          }
        }

        if (sendAction === DAppActions.mina_addChain) {
          const realAddUrl = decodeURIComponent(params.url as string);
          if (!urlValidStrict(realAddUrl) || !params.name) {
            reject({
              code: errorCodes.invalidParams,
              message: getMessageFromCode(errorCodes.invalidParams),
            });
            return;
          }
          const exist = await this.checkNetworkIsExist(realAddUrl);
          if (exist.index !== -1) {
            if (exist.config?.url === currentChainInfo?.url) {
              resolve({
                networkID: currentChainInfo?.networkID,
              });
              return;
            } else {
              nextParams.action = DAppActions.mina_switchChain;
              nextParams.targetConfig = exist.config;
            }
          }
        }

        const checkAddressAction = [
          DAppActions.mina_sendPayment,
          DAppActions.mina_sendStakeDelegation,
        ];
        if (checkAddressAction.indexOf(sendAction) !== -1) {
          if (
            !(params.to as string)?.length ||
            !addressValid(params.to as string)
          ) {
            reject({
              code: errorCodes.invalidParams,
              message: getMessageFromCode(errorCodes.invalidParams),
            });
            return;
          }
        }

        if (sendAction === DAppActions.mina_sendPayment) {
          if (
            !isNumber(params.amount) ||
            (params.nonce && !isNumber(params.nonce))
          ) {
            reject({
              code: errorCodes.invalidParams,
              message: getMessageFromCode(errorCodes.invalidParams),
            });
            return;
          }
        }

        if (sendAction === DAppActions.mina_storePrivateCredential) {
          const credentialData = params.credential || (params as any)["0"];
          const result = checkStoredCredentialSchema(credentialData);
          nextParams.credential = credentialData;
          if (!result.success) {
            reject({
              code: errorCodes.invalidParams,
              message: getMessageFromCode(errorCodes.invalidParams),
            });
            return;
          }
        }

        if (sendAction === DAppActions.mina_requestPresentation) {
          const presentationData = params.presentation || (params as any)["0"];
          const presentationRequest =
            (presentationData as any).presentationRequest ?? {};
          const result = checkPresentationRequestSchema(presentationRequest);
          nextParams.presentationData = presentationData;
          if (!result.success) {
            reject({
              code: errorCodes.invalidParams,
              message: getMessageFromCode(errorCodes.invalidParams),
            });
            return;
          }
        }

        if (sendAction === DAppActions.mina_sendTransaction) {
          nextParams.transaction = zkCommondFormat(params.transaction);
        }

        await startExtensionPopup(true);

        function onMessage(
          message: { action: string; payload: Record<string, unknown> },
          sender: browser.Runtime.MessageSender,
          sendResponse: () => void
        ): boolean | void {
          if (!isFromExtensionPopup(sender)) {
            return false;
          }
          const { action, payload } = message;

          if (action === DAPP_ACTION_CANCEL_ALL) {
            signRequests.forEach((item) => {
              item.reject({
                code: errorCodes.userRejectedRequest,
                message: getMessageFromCode(errorCodes.userRejectedRequest),
              });
            });
            signRequests = [];
            that.setBadgeContent();
            if (chainRequests.length === 0) {
              closePopupWindow(windowId.request_sign);
              browser.runtime.onMessage.removeListener(onMessage as BrowserMessageListener);
              that.signEventListener = undefined;
            }
            return;
          }

          const signId = payload?.id as string;
          const currentSignParams = that.getSignParamsByOpenId(signId);
          if (!currentSignParams) {
            return;
          }

          const nextReject = currentSignParams.reject;
          const nextResolve = currentSignParams.resolve;

          switch (action) {
            case DAPP_ACTION_STORE_CREDENTIAL:
              if (payload.resultOrigin !== currentSignParams.site.origin) {
                nextReject({
                  message: getMessageFromCode(errorCodes.originDismatch),
                  code: errorCodes.originDismatch,
                });
                return;
              }
              if (payload && payload.cancel) {
                nextReject({
                  code: errorCodes.userRejectedRequest,
                  message: getMessageFromCode(errorCodes.userRejectedRequest),
                });
                that.removeSignParamsByOpenId(payload.id as string);
                if (signRequests.length === 0 && chainRequests.length === 0) {
              browser.runtime.onMessage.removeListener(onMessage as BrowserMessageListener);
                  that.signEventListener = undefined;
                }
                that.setBadgeContent();
              } else if (payload && payload.credential) {
                nextResolve({
                  credential: payload.credential,
                });
                that.removeSignParamsByOpenId(payload.id as string);
                if (signRequests.length === 0 && chainRequests.length === 0) {
              browser.runtime.onMessage.removeListener(onMessage as BrowserMessageListener);
                  that.signEventListener = undefined;
                }
                that.setBadgeContent();
              } else {
                const msg =
                  payload.message || getMessageFromCode(errorCodes.internal);
                nextReject({ message: msg, code: errorCodes.internal });
              }
              sendResponse();
              return true;

            case DAPP_ACTION_REQUEST_PRESENTATION:
              if (payload.resultOrigin !== currentSignParams.site.origin) {
                nextReject({
                  message: getMessageFromCode(errorCodes.originDismatch),
                  code: errorCodes.originDismatch,
                });
                return;
              }
              if (payload && payload.cancel) {
                nextReject({
                  code: errorCodes.userRejectedRequest,
                  message: getMessageFromCode(errorCodes.userRejectedRequest),
                });
                that.removeSignParamsByOpenId(payload.id as string);
                if (signRequests.length === 0 && chainRequests.length === 0) {
              browser.runtime.onMessage.removeListener(onMessage as BrowserMessageListener);
                  that.signEventListener = undefined;
                }
                that.setBadgeContent();
              } else if (payload && payload.presentation) {
                nextResolve({
                  presentation: payload.presentation,
                });
                that.removeSignParamsByOpenId(payload.id as string);
                if (signRequests.length === 0 && chainRequests.length === 0) {
              browser.runtime.onMessage.removeListener(onMessage as BrowserMessageListener);
                  that.signEventListener = undefined;
                }
                that.setBadgeContent();
              } else {
                const msg =
                  payload.message || getMessageFromCode(errorCodes.internal);
                nextReject({ message: msg, code: errorCodes.internal });
              }
              sendResponse();
              return true;

            case DAPP_ACTION_SEND_TRANSACTION:
              if (payload.resultOrigin !== currentSignParams.site.origin) {
                nextReject({
                  message: getMessageFromCode(errorCodes.originDismatch),
                  code: errorCodes.originDismatch,
                });
                return;
              }
              if (payload && (payload.hash || payload.signedData)) {
                if (payload.hash) {
                  nextResolve({
                    hash: payload.hash,
                    paymentId: payload.paymentId,
                  });
                } else {
                  nextResolve({
                    signedData: payload.signedData,
                  });
                }
                that.removeSignParamsByOpenId(payload.id as string);
                if (signRequests.length === 0 && chainRequests.length === 0) {
              browser.runtime.onMessage.removeListener(onMessage as BrowserMessageListener);
                  that.signEventListener = undefined;
                }
                that.setBadgeContent();
              } else if (payload && payload.cancel) {
                nextReject({
                  code: errorCodes.userRejectedRequest,
                  message: getMessageFromCode(errorCodes.userRejectedRequest),
                });
                that.removeSignParamsByOpenId(payload.id as string);
                if (signRequests.length === 0 && chainRequests.length === 0) {
              browser.runtime.onMessage.removeListener(onMessage as BrowserMessageListener);
                  that.signEventListener = undefined;
                }
                that.setBadgeContent();
              } else {
                const msg =
                  payload.message || getMessageFromCode(errorCodes.internal);
                nextReject({ message: msg, code: errorCodes.internal });
              }
              sendResponse();
              return true;

            case DAPP_ACTION_SIGN_MESSAGE:
              if (payload.resultOrigin !== currentSignParams.site.origin) {
                nextReject({
                  message: getMessageFromCode(errorCodes.originDismatch),
                  code: errorCodes.originDismatch,
                });
                return;
              }
              if (payload && payload.signature) {
                nextResolve(payload);
                that.removeSignParamsByOpenId(payload.id as string);
                if (signRequests.length === 0 && chainRequests.length === 0) {
              browser.runtime.onMessage.removeListener(onMessage as BrowserMessageListener);
                  that.signEventListener = undefined;
                }
                that.setBadgeContent();
                delete payload.resultOrigin;
                delete payload.id;
              } else {
                nextReject({
                  code: errorCodes.userRejectedRequest,
                  message: getMessageFromCode(errorCodes.userRejectedRequest),
                });
                that.removeSignParamsByOpenId(payload.id as string);
                if (signRequests.length === 0 && chainRequests.length === 0) {
              browser.runtime.onMessage.removeListener(onMessage as BrowserMessageListener);
                  that.signEventListener = undefined;
                }
                that.setBadgeContent();
              }
              sendResponse();
              return true;

            case DAPP_ACTION_SWITCH_CHAIN:
              if (payload.resultOrigin !== currentSignParams.site.origin) {
                nextReject({
                  message: getMessageFromCode(errorCodes.originDismatch),
                  code: errorCodes.originDismatch,
                });
                return;
              }
              if (payload) {
                if (payload.cancel) {
                  nextReject({
                    code: errorCodes.userRejectedRequest,
                    message: getMessageFromCode(errorCodes.userRejectedRequest),
                  });
                  that.removeNotifyParamsByOpenId(payload.id as string);
                  if (signRequests.length === 0 && chainRequests.length === 0) {
                browser.runtime.onMessage.removeListener(onMessage as BrowserMessageListener);
                    that.signEventListener = undefined;
                  }
                  that.setBadgeContent();
                } else if (payload.nextConfig) {
                  nextResolve(payload.nextConfig);
                  that.removeNotifyParamsByOpenId(payload.id as string);
                  if (signRequests.length === 0 && chainRequests.length === 0) {
                browser.runtime.onMessage.removeListener(onMessage as BrowserMessageListener);
                    that.signEventListener = undefined;
                  }
                  that.setBadgeContent();
                } else {
                  const msg =
                    payload.message || getMessageFromCode(errorCodes.internal);
                  nextReject({ message: msg, code: errorCodes.internal });
                }
              }
              sendResponse();
              return true;

            case DAPP_ACTION_CREATE_NULLIFIER:
              if (payload.resultOrigin !== currentSignParams.site.origin) {
                nextReject({
                  message: getMessageFromCode(errorCodes.originDismatch),
                  code: errorCodes.originDismatch,
                });
                return;
              }
              if (payload && payload.private) {
                nextResolve(payload);
                that.removeSignParamsByOpenId(payload.id as string);
                if (signRequests.length === 0 && chainRequests.length === 0) {
              browser.runtime.onMessage.removeListener(onMessage as BrowserMessageListener);
                  that.signEventListener = undefined;
                }
                that.setBadgeContent();
                delete payload.resultOrigin;
                delete payload.id;
              } else {
                nextReject({
                  code: errorCodes.userRejectedRequest,
                  message: getMessageFromCode(errorCodes.userRejectedRequest),
                });
                that.removeSignParamsByOpenId(payload.id as string);
                if (signRequests.length === 0 && chainRequests.length === 0) {
              browser.runtime.onMessage.removeListener(onMessage as BrowserMessageListener);
                  that.signEventListener = undefined;
                }
                that.setBadgeContent();
              }
              sendResponse();
              return true;
          }
          return false;
        }

        if (!that.signEventListener) {
          browser.runtime.onMessage.addListener(onMessage as BrowserMessageListener);
          that.signEventListener = onMessage;
          listenerAdded = true;
        }

        const time = new Date().getTime();
        if (ZKAPP_CHAIN_ACTION.indexOf(sendAction) !== -1) {
          if (chainRequests.length > 0) {
            reject({
              code: errorCodes.zkChainPending,
              message: getMessageFromCode(errorCodes.zkChainPending),
            });
            return;
          }
          chainRequests.push({
            id,
            params: nextParams,
            site,
            resolve,
            reject,
            time,
          });
        } else {
          const duplicate = signRequests.some((item) => item.id === id);
          if (duplicate) {
            reject({
              code: errorCodes.zkChainPending,
              message: getMessageFromCode(errorCodes.zkChainPending),
            });
            return;
          }
          signRequests.push({
            id,
            params: nextParams,
            site,
            resolve,
            reject,
            time,
          });
        }
        this.setBadgeContent();
        sendMsg(
          {
            action: WORKER_ACTIONS.SIGN_ZK,
          },
          undefined,
          async () => {
            await startExtensionPopup(true);
            sendMsg({ action: WORKER_ACTIONS.SIGN_ZK });
          }
        );
      } catch (error) {
        const isDev = process.env.NODE_ENV === 'development';
        if (listenerAdded) {
          that.cleanupSignListener();
        }
        reject({
          code: errorCodes.throwError,
          message: getMessageFromCode(errorCodes.throwError),
          ...(isDev && { stack: String(error) }),
        });
      }
    });
  }

  private cleanupSignListener(): void {
    if (this.signEventListener) {
      browser.runtime.onMessage.removeListener(this.signEventListener as BrowserMessageListener);
      this.signEventListener = undefined;
    }
  }

  private cleanupTokenSignListener(): void {
    if (this.tokenSignListener) {
      browser.runtime.onMessage.removeListener(this.tokenSignListener as BrowserMessageListener);
      this.tokenSignListener = undefined;
    }
  }

  private cleanupApproveListener(): void {
    if (this.approveEventListener) {
      browser.runtime.onMessage.removeListener(this.approveEventListener as BrowserMessageListener);
      this.approveEventListener = undefined;
    }
  }

  clearAllPendingZk(): void {
    const requestList = [
      ...signRequests,
      ...approveRequests,
      ...chainRequests,
      ...tokenSignRequests,
    ];
    requestList.forEach((item) => {
      item.reject({
        code: errorCodes.userRejectedRequest,
        message: getMessageFromCode(errorCodes.userRejectedRequest),
      });
    });
    signRequests = [];
    approveRequests = [];
    chainRequests = [];
    tokenSignRequests = [];
    this.cleanupSignListener();
    this.cleanupTokenSignListener();
    this.cleanupApproveListener();
    this.setBadgeContent();
  }

  async checkLocalWallet(): Promise<boolean> {
    const localAccount = await get("keyringData");
    if (localAccount && (localAccount as any).keyringData) {
      return true;
    } else {
      return false;
    }
  }

  async requestConnectedAccount(site: Site): Promise<string[]> {
    return new Promise(async (resolve) => {
      try {
        const isCreate = await this.checkLocalWallet();
        if (!isCreate) {
          resolve([]);
          return;
        }
        const currentAccount = this.getCurrentAccountAddress();
        const connectStatus = this.getCurrentAccountConnectStatus(
          site.origin,
          currentAccount
        );
        if (connectStatus) {
          resolve([currentAccount]);
          return;
        }
        resolve([]);
      } catch (error) {
        resolve([]);
      }
    });
  }

  async requestAccounts(id: string, site: Site): Promise<string[]> {
    const that = this;
    return new Promise(async (resolve, reject) => {
      try {
        const isCreate = await this.checkLocalWallet();
        if (!isCreate) {
          reject({
            message: getMessageFromCode(errorCodes.noWallet),
            code: errorCodes.noWallet,
          });
          return;
        }
        const currentAccount = this.getCurrentAccountAddress();
        const connectStatus = this.getCurrentAccountConnectStatus(
          site.origin,
          currentAccount
        );
        if (connectStatus) {
          resolve([currentAccount]);
          return;
        }
        await startExtensionPopup(true);
        if (approveRequests.length > 0) {
          reject({
            message: getMessageFromCode(errorCodes.zkChainPending),
            code: errorCodes.zkChainPending,
          });
          return;
        }

        function onMessage(
          message: { action: string; payload: Record<string, unknown> },
          sender: browser.Runtime.MessageSender,
          sendResponse: () => void
        ): boolean | void {
          if (!isFromExtensionPopup(sender)) {
            return false;
          }
          const { action, payload } = message;
          const approveId = payload?.id as string;
          const currentApproveParams = that.getApproveParamsByOpenId(approveId);
          if (!currentApproveParams) {
            return;
          }
          const nextReject = currentApproveParams.reject;
          const nextResolve = currentApproveParams.resolve;

          switch (action) {
            case DAPP_ACTION_GET_ACCOUNT:
              if (payload.resultOrigin !== currentApproveParams.site.origin) {
                nextReject({
                  message: getMessageFromCode(errorCodes.originDismatch),
                  code: errorCodes.originDismatch,
                });
                return;
              }
              approveRequests = [];
              that.cleanupApproveListener();
              that.setBadgeContent();
              if (
                payload.selectAccount &&
                (payload.selectAccount as unknown[]).length > 0
              ) {
                const account = (payload.selectAccount as { address: string }[])[0]!;
                const accountApprovedUrlList =
                  dappStore.getState().accountApprovedUrlList as Record<string, string[]>;
                let currentApprovedList: string[] =
                  accountApprovedUrlList[account!.address] || [];
                if (
                  (currentApprovedList as string[]).indexOf(payload.resultOrigin as string) === -1
                ) {
                  (currentApprovedList as string[]).push(payload.resultOrigin as string);
                }
                accountApprovedUrlList[account!.address] = currentApprovedList;
                that.updateApproveConnect(accountApprovedUrlList as Record<string, string[]>);
                nextResolve([account!.address]);
              } else {
                nextReject({
                  code: errorCodes.userRejectedRequest,
                  message: getMessageFromCode(errorCodes.userRejectedRequest),
                });
              }
              sendResponse();
              return true;
            case DAPP_ACTION_CLOSE_WINDOW:
              if (payload.resultOrigin !== currentApproveParams.site.origin) {
                nextReject({
                  message: getMessageFromCode(errorCodes.originDismatch),
                  code: errorCodes.originDismatch,
                });
                return;
              }
              that.cleanupApproveListener();
              nextResolve([payload.account]);
              approveRequests = [];
              that.setBadgeContent();
              sendResponse();
              return true;
            default:
              break;
          }
          return false;
        }

        if (!that.approveEventListener) {
          browser.runtime.onMessage.addListener(onMessage as BrowserMessageListener);
          that.approveEventListener = onMessage;
        }
        approveRequests.push({ id, site, resolve: resolve as (value: unknown) => void, reject });
        this.setBadgeContent();
        sendMsg(
          {
            action: WORKER_ACTIONS.APPROVE,
          },
          undefined,
          async () => {
            await startExtensionPopup(true);
            sendMsg({ action: WORKER_ACTIONS.APPROVE });
          }
        );
      } catch (error) {
        const isDev = process.env.NODE_ENV === 'development';
        reject({
          code: errorCodes.throwError,
          message: getMessageFromCode(errorCodes.throwError),
          ...(isDev && { stack: String(error) }),
        });
      }
    });
  }

  setBadgeContent = (): void => {
    const list = [
      ...approveRequests,
      ...signRequests,
      ...chainRequests,
      ...tokenSignRequests,
    ];
    const action = getExtensionAction();
    if (list.length > 0) {
      action.setBadgeText({ text: list.length.toString() });
    } else {
      action.setBadgeText({ text: "" });
    }
  };

  getApproveParamsByOpenId(openId: string): ApproveRequest | null {
    const params = approveRequests.filter((item) => item.id === openId);
    if (params.length > 0) {
      return params[0] ?? null;
    } else {
      return null;
    }
  }

  getSignParamsByOpenId(openId: string): SignRequest | null {
    const params = [...signRequests, ...chainRequests].filter(
      (item) => item.id === openId
    );
    if (params.length > 0) {
      return params[0] ?? null;
    } else {
      return null;
    }
  }

  getSignParams(): {
    signRequests: SignRequest[];
    chainRequests: SignRequest[];
    topItem?: SignRequest;
  } {
    const list = [...signRequests, ...chainRequests];
    list.sort((a, b) => a.time - b.time);
    let topItem: SignRequest | undefined;
    if (list.length > 0) {
      topItem = list[0];
    }
    return {
      signRequests,
      chainRequests,
      topItem,
    };
  }

  getApproveParams(): ApproveRequest | undefined {
    const list = [...approveRequests];
    if (list.length > 0) {
      return list[0];
    }
    return undefined;
  }

  removeSignParamsByOpenId(openId: string): void {
    const newSignRequests = signRequests.filter((item) => item.id !== openId);
    signRequests = newSignRequests;
  }

  removeNotifyParamsByOpenId(openId: string): void {
    const newNotifyRequests = chainRequests.filter((item) => item.id !== openId);
    chainRequests = newNotifyRequests;
  }

  getDappStore(): ReturnType<typeof dappStore.getState> {
    return dappStore.getState();
  }

  getCurrentAccountConnectStatus(
    siteUrl: string,
    currentAddress: string = ""
  ): boolean {
    const accountApprovedUrlList = this.getDappStore()
      .accountApprovedUrlList as Record<string, string[]>;
    const currentAccountApproved = accountApprovedUrlList[currentAddress] || [];
    return currentAccountApproved.indexOf(siteUrl) !== -1;
  }

  disconnectDapp(siteUrl: string, address: string): boolean {
    try {
      const accountApprovedUrlList = this.getDappStore()
        .accountApprovedUrlList as Record<string, string[]>;
      const currentAccountApproved = accountApprovedUrlList[address] || [];
      const urlIndex = currentAccountApproved.indexOf(siteUrl);
      if (urlIndex !== -1) {
        currentAccountApproved.splice(urlIndex, 1);
        this.notifyAccountChange([siteUrl]);

        accountApprovedUrlList[address] = currentAccountApproved;
        this.updateApproveConnect(accountApprovedUrlList);
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  deleteDAppConnect(
    deletedAddress: string,
    oldCurrentAddress: string,
    newCurrentAddress: string
  ): void {
    const accountApprovedUrlList = this.getDappStore()
      .accountApprovedUrlList as Record<string, string[]>;
    if (deletedAddress !== oldCurrentAddress) {
      const deletedAccountApproved = accountApprovedUrlList[deletedAddress];
      if (deletedAccountApproved) {
        delete accountApprovedUrlList[deletedAddress];
        this.updateApproveConnect(accountApprovedUrlList);
      }
    } else {
      const deletedAccountApproved =
        accountApprovedUrlList[deletedAddress] || [];
      const newAccountApproved =
        accountApprovedUrlList[newCurrentAddress] || [];
      const diffConnectedUrl = getArrayDiff(
        deletedAccountApproved,
        newAccountApproved
      );

      if (newAccountApproved.length > 0) {
        this.notifyAccountChange(newAccountApproved, newCurrentAddress);
      }

      if (diffConnectedUrl.length > 0) {
        this.notifyAccountChange(diffConnectedUrl);
      }
    }
  }

  getCurrentAccountAddress(): string {
    return apiService.getCurrentAccountAddress() || "";
  }

  changeCurrentConnecting(address: string, currentAddress: string): void {
    const accountApprovedUrlList = this.getDappStore()
      .accountApprovedUrlList as Record<string, string[]>;

    const oldAccountApproved = accountApprovedUrlList[address] || [];
    const newAccountApproved = accountApprovedUrlList[currentAddress] || [];

    const diffConnectedUrl = getArrayDiff(oldAccountApproved, newAccountApproved);
    if (newAccountApproved.length > 0) {
      this.notifyAccountChange(newAccountApproved, currentAddress);
    }

    if (diffConnectedUrl.length > 0) {
      this.notifyAccountChange(diffConnectedUrl);
    }
  }

  notifyAccountChange(siteUrlList: string[], connectAccount?: string): void {
    const account = !connectAccount ? [] : [connectAccount];
    browser.tabs.query({}).then((tabs) => {
      const message = {
        action: "accountsChanged",
        result: account,
      };
      for (let tabIndex = 0; tabIndex < tabs.length; tabIndex++) {
        const tab = tabs[tabIndex];
        if (!tab) continue;
        const origin = getOriginFromUrl(tab.url || "");

        const tabConnectIndex = siteUrlList.indexOf(origin);
        if (tabConnectIndex !== -1 && tab.id) {
          browser.tabs.sendMessage(tab.id, message).catch(() => {
            // Ignore errors from tabs in back/forward cache
          });
        }
      }
    });
  }

  notifyNetworkChange(currentNet: NetworkConfig): void {
    const networkID = currentNet.networkID || "";
    const message = {
      action: "chainChanged",
      result: {
        networkID: networkID,
      },
    };
    this.tabNotify(message);
  }

  tabNotify(message: Record<string, unknown>): void {
    browser.tabs.query({}).then((tabs) => {
      const currentConnect = this.getDappStore().currentConnect as Record<
        number,
        unknown
      >;
      for (let index = 0; index < tabs.length; index++) {
        const tab = tabs[index];
        if (tab && tab.id && currentConnect[tab.id]) {
          browser.tabs.sendMessage(tab.id, message).catch(() => {
            // Ignore errors from tabs in back/forward cache
          });
        }
      }
    });
  }

  portDisconnectListener(port: browser.Runtime.Port): void {
    const tab = port?.sender?.tab || ({} as browser.Tabs.Tab);
    const tabId = tab.id;
    if (!tabId) {
      return;
    }
    const currentConnect = dappStore.getState().currentConnect as Record<
      number,
      unknown
    >;
    if (currentConnect[tabId]) {
      delete currentConnect[tabId];
      dappStore.updateState({
        currentConnect,
      });
    }
  }

  setupProviderConnection(port: browser.Runtime.Port): void {
    const tab = port?.sender?.tab || ({} as browser.Tabs.Tab);
    const tabId = tab.id;
    if (!tabId) {
      return;
    }
    const origin = (port?.sender as browser.Runtime.MessageSender & { origin?: string })?.origin;
    const currentConnect = dappStore.getState().currentConnect as Record<
      number,
      unknown
    >;
    if (!currentConnect[tabId]) {
      currentConnect[tabId] = {
        tabId: tabId,
        origin: origin,
      };
      dappStore.updateState({
        currentConnect,
      });
    }
  }

  requestNetwork(): Promise<{ networkID: string }> {
    return new Promise(async (resolve) => {
      const netConfig = await getCurrentNodeConfig();
      resolve({ networkID: netConfig.networkID });
    });
  }

  requestCurrentNetwork(): Promise<NetworkConfig | Record<string, never>> {
    return new Promise(async (resolve) => {
      const currentNodeConfig = await getCurrentNodeConfig();
      resolve(currentNodeConfig);
    });
  }

  getAppConnectionList(address: string): string[] {
    const accountApprovedUrlList = dappStore.getState()
      .accountApprovedUrlList as Record<string, string[]>;
    const currentAccountApproved = accountApprovedUrlList[address] || [];
    return currentAccountApproved;
  }

  async checkNetworkIsExist(
    url: string
  ): Promise<{ index: number; config?: NetworkConfig }> {
    const customList = await getLocalNetworkList();
    const allNodeList = [...Default_Network_List, ...customList];
    const exist = checkNodeExist(allNodeList, url);
    return exist;
  }

  async initApproveConnect(): Promise<void> {
    const approveData = await get(ZKAPP_APPROVE_LIST) as Record<string, string> | undefined;
    if (approveData?.ZKAPP_APPROVE_LIST) {
      const approveMap = JSON.parse(approveData.ZKAPP_APPROVE_LIST);
      dappStore.updateState({
        accountApprovedUrlList: approveMap,
      });
    }
  }

  updateApproveConnect(approveMap: Record<string, string[]>): void {
    dappStore.updateState({
      accountApprovedUrlList: approveMap,
    });
    save({ ZKAPP_APPROVE_LIST: JSON.stringify(approveMap) });
  }

  async addTokenBuildList(buildParams: {
    sendParams: Record<string, unknown>;
    left?: number;
    top?: number;
  }): Promise<string> {
    const buildList = dappStore.getState().tokenBuildList as Record<
      string,
      unknown
    >;
    let buildID = uuidv4();
    while (buildList[buildID]) {
      buildID = uuidv4();
    }
    buildList[buildID] = {
      ...buildParams.sendParams,
      buildID,
    };
    dappStore.updateState({
      tokenBuildList: buildList,
    });

    let languageCode = (buildParams.sendParams.langCode as string) || "";
    if (languageCode) {
      languageCode = `/${languageCode}`;
    }
    const targetUrl = TOKEN_BUILD_URL + languageCode + "?buildid=" + buildID;
    let nextOption: Record<string, number> = {};
    if (buildParams?.left && buildParams?.top) {
      nextOption = {
        left: buildParams.left + PopupSize.exitSize,
        top: buildParams.top + PopupSize.exitSize,
      };
    }
    startPopupWindow(targetUrl, "tokenSign_" + buildID, {
      ...nextOption,
    });
    return buildID;
  }

  removeTokenBuildById(buildID: string): void {
    const newBuildList = tokenSignRequests.filter((item) => item.id !== buildID);
    tokenSignRequests = newBuildList;
    const nextTokenBuildList = this.getDappStore().tokenBuildList as Record<
      string,
      unknown
    >;
    delete nextTokenBuildList[buildID];
    dappStore.updateState({
      tokenBuildList: nextTokenBuildList,
    });
  }

  checkSafeBuild(site: Site): boolean {
    try {
      const buildUrl = new URL(site.origin);
      const whiteUrl = new URL(TOKEN_BUILD_URL);

      if (buildUrl.protocol !== 'https:') return false;

      if (buildUrl.origin !== whiteUrl.origin) return false;

      return true;
    } catch {
      return false;
    }
  }

  getAllTokenSignParams(): SignRequest[] {
    const list = [...tokenSignRequests];
    list.sort((a, b) => a.time - b.time);
    return list;
  }

  async getTokenParamsById(payload: {
    site: Site;
    params: string;
  }): Promise<unknown> {
    const site = payload.site;
    if (!this.checkSafeBuild(site)) {
      return {
        message: getMessageFromCode(errorCodes.originDismatch),
        code: errorCodes.originDismatch,
      };
    }
    const buildId = payload.params;
    const buildList = dappStore.getState().tokenBuildList as Record<
      string,
      unknown
    >;
    const nextData = buildList[buildId];
    if (nextData) {
      const data = encryptData(JSON.stringify(nextData), node_public_keys);
      return data;
    }
    return nextData;
  }

  getDecryptData(nextParams: { result: Record<string, unknown> }): Record<string, unknown> {
    try {
      const encrypted = nextParams.result;
      const realUnSignTxStr = decryptData(
        encrypted.encryptedData as string,
        encrypted.encryptedAESKey as string,
        encrypted.iv as string,
        react_private_keys
      );
      return realUnSignTxStr as Record<string, unknown>;
    } catch (error) {
      return {};
    }
  }

  verifyTokenBuildRes(
    decryptData: Record<string, unknown>,
    buildData: Record<string, unknown>
  ): boolean {
    if (!buildData) {
      return false;
    }

    let realUnSignTx: string;
    try {
      realUnSignTx = JSON.stringify(decryptData.transaction);
    } catch (error) {
      return false;
    }

    const tokenId = buildData.tokenId as string;
    
    if (!buildData.sender || !buildData.receiver || !buildData.amount) {
      return false;
    }
    
    const extractionResult = extractTokenTransferInfo(realUnSignTx, tokenId);
    if (!extractionResult.success) {
      return false;
    }
    const extractedInfo = extractionResult.data;

    const txMemo = extractedInfo.memo;
    const feePayerMemo = (decryptData.feePayer as Record<string, unknown>)?.memo as string || "";
    const topLevelMemo = decryptData.memo as string || "";
    const resolvedMemo = txMemo || feePayerMemo || topLevelMemo;
    
    if (extractedInfo.sender !== buildData.sender) {
      return false;
    }
    if (extractedInfo.receiver !== buildData.receiver) {
      return false;
    }
    const extractedAmount = new BigNumber(extractedInfo.amount);
    const buildAmount = new BigNumber(String(buildData.amount));
    if (!extractedAmount.isEqualTo(buildAmount)) {
      return false;
    }
    if (extractedInfo.tokenId !== tokenId) {
      return false;
    }
    if (buildData.memo && resolvedMemo && resolvedMemo !== buildData.memo) {
      return false;
    }
    
    const sourceData = {
      sender: buildData.sender as string,
      receiver: buildData.receiver as string,
      amount: buildData.amount as string | number,
      isNewAccount: extractedInfo.isNewAccount,
    };

    try {
      return verifyTokenCommand(sourceData, tokenId, realUnSignTx);
    } catch (error) {
      return false;
    }
  }

  requestTokenBuildSign(
    id: string,
    params: Record<string, unknown>,
    site: Site
  ): Promise<unknown> {
    return new Promise(async (resolve, reject) => {
      const that = this;
      let listenerAdded = false;
      try {
        const nextParams: Record<string, unknown> = { ...params };

        function onMessage(
          message: { action: string; payload: Record<string, unknown> },
          sender: browser.Runtime.MessageSender,
          sendResponse: () => void
        ): boolean | void {
          if (!isFromExtensionPopup(sender)) {
            return false;
          }
          const { action, payload } = message;

          if (action === DAPP_ACTION_CANCEL_ALL) {
            tokenSignRequests.forEach((item) => {
              item.reject({
                code: errorCodes.userRejectedRequest,
                message: getMessageFromCode(errorCodes.userRejectedRequest),
              });
            });
            tokenSignRequests = [];
            dappStore._directUpdate({ tokenBuildList: {} });
            that.setBadgeContent();
            closePopupWindow(windowId.token_sign);
            browser.runtime.onMessage.removeListener(onMessage as BrowserMessageListener);
            that.tokenSignListener = undefined;
            return;
          }

          const currentSignParams = [...tokenSignRequests].find(
            (item) => item.id === payload?.id
          );
          if (!currentSignParams) {
            return;
          }
          const nextReject = currentSignParams.reject;
          const nextResolve = currentSignParams.resolve;

          switch (action) {
            case TOKEN_BUILD.requestSign:
              if (payload.resultOrigin !== currentSignParams.site.origin) {
                nextReject({
                  message: getMessageFromCode(errorCodes.originDismatch),
                  code: errorCodes.originDismatch,
                });
                return;
              }
              if (payload && (payload.hash || payload.signedData)) {
                if (payload.hash) {
                  nextResolve({
                    hash: payload.hash,
                  });
                } else {
                  nextResolve({
                    signedData: payload.signedData,
                  });
                }
                that.removeTokenBuildById(payload.id as string);
                if (tokenSignRequests.length === 0) {
                  closePopupWindow(windowId.token_sign);
              browser.runtime.onMessage.removeListener(onMessage as BrowserMessageListener);
                  that.tokenSignListener = undefined;
                }
                that.setBadgeContent();
              } else if (payload && payload.cancel) {
                nextReject({
                  code: errorCodes.userRejectedRequest,
                  message: getMessageFromCode(errorCodes.userRejectedRequest),
                });
                that.removeTokenBuildById(payload.id as string);
                if (tokenSignRequests.length === 0) {
                  closePopupWindow(windowId.token_sign);
              browser.runtime.onMessage.removeListener(onMessage as BrowserMessageListener);
                  that.tokenSignListener = undefined;
                }
                that.setBadgeContent();
              } else {
                const msg =
                  payload.message || getMessageFromCode(errorCodes.internal);
                nextReject({ message: msg, code: errorCodes.internal });
              }
              sendResponse();
              return true;
          }
          return false;
        }

        const decryptedData = that.getDecryptData(nextParams as any);
        if (!decryptedData.buildID) {
          reject({
            message: getMessageFromCode(errorCodes.verifyFailed),
            code: errorCodes.verifyFailed,
          });
          return;
        }

        const buildList = dappStore.getState().tokenBuildList as Record<
          string,
          Record<string, unknown>
        >;
        const buildData = buildList[decryptedData.buildID as string] || {};

        const checkBuildRes = that.verifyTokenBuildRes(decryptedData, buildData);
        if (!checkBuildRes) {
          reject({
            message: getMessageFromCode(errorCodes.verifyFailed),
            code: errorCodes.verifyFailed,
          });
          return;
        }

        closePopupWindow("tokenSign_" + decryptedData.buildID);
        nextParams.buildData = buildData;
        nextParams.result = decryptedData.transaction;

        if (!that.tokenSignListener) {
          browser.runtime.onMessage.addListener(onMessage as BrowserMessageListener);
          that.tokenSignListener = onMessage;
          listenerAdded = true;
        }

        const time = new Date().getTime();
        tokenSignRequests.push({
          id,
          params: nextParams,
          site,
          resolve,
          reject,
          time,
        });
        this.setBadgeContent();
        sendMsg(
          {
            action: WORKER_ACTIONS.BUILD_TOKEN_SEND,
          },
          undefined,
          async () => {
            await startExtensionPopup(true);
            sendMsg({ action: WORKER_ACTIONS.BUILD_TOKEN_SEND });
          }
        );
      } catch (error) {
        const isDev = process.env.NODE_ENV === 'development';
        if (listenerAdded) {
          that.cleanupTokenSignListener();
        }
        reject({
          code: errorCodes.throwError,
          message: getMessageFromCode(errorCodes.throwError),
          ...(isDev && { stack: String(error) }),
        });
      }
    });
  }

  getAllPendingZK(): {
    signRequests: SignRequest[];
    chainRequests: SignRequest[];
    approveRequests: ApproveRequest[];
    tokenSignRequests: SignRequest[];
  } {
    return {
      signRequests,
      chainRequests,
      approveRequests,
      tokenSignRequests,
    };
  }

  async getWalletInfo(): Promise<{ version: string; init: boolean }> {
    const isCreate = await this.checkLocalWallet();
    const baseWalletInfo = {
      version: pkg.version,
      init: isCreate,
    };
    return baseWalletInfo;
  }

  async revokePermissions(params: { site: Site }): Promise<string[]> {
    const targetOrigin = params.site.origin;
    const accountApprovedUrlList = dappStore.getState()
      .accountApprovedUrlList as Record<string, string[]>;
    const res = removeUrlFromArrays(accountApprovedUrlList, targetOrigin);
    this.updateApproveConnect(res);
    return [];
  }
}

const dappService = new DappService();
export default dappService;
