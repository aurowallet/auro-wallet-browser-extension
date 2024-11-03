import { DAppActions } from '@aurowallet/mina-provider';
import extension from 'extensionizer';
import ObservableStore from "obs-store";
import { DAPP_ACTION_CANCEL_ALL, DAPP_ACTION_CLOSE_WINDOW, DAPP_ACTION_CREATE_NULLIFIER, DAPP_ACTION_GET_ACCOUNT, DAPP_ACTION_SEND_TRANSACTION, DAPP_ACTION_SIGN_MESSAGE, DAPP_ACTION_SWITCH_CHAIN, WORKER_ACTIONS } from '../constant/msgTypes';
import { checkAndTop, checkAndTopV2, closePopupWindow, lastWindowIds, openPopupWindow, PopupSize, startExtensionPopup, startPopupWindow } from "../utils/popup";
import { checkNodeExist, getArrayDiff, getCurrentNodeConfig, getExtensionAction, getLocalNetworkList, getMessageFromCode, getOriginFromUrl, isNumber, urlValid } from '../utils/utils';
import { addressValid } from '../utils/validator';
import apiService from './APIService';
import { verifyFieldsMessage, verifyMessage } from './lib';
import { get, save } from './storageService';
import { Default_Network_List } from '@/constant/network';
import { errorCodes } from '@/constant/dappError';
import { verifyTokenCommand, zkCommondFormat } from '@/utils/zkUtils';
import { getAccountInfo } from './api';
import { ZKAPP_APPROVE_LIST } from '@/constant/storageKey';
import { ZK_DEFAULT_TOKEN_ID } from '../constant';
import { TOKEN_BUILD } from '@/constant/tokenMsgTypes';
import { decryptData, encryptData } from '@/utils/fore';
import { node_public_keys, react_private_keys, TOKEN_BUILD_URL } from '../../config';
import { sendMsg } from '../utils/commonMsg';
import { POPUP_CHANNEL_KEYS } from '@/constant/commonType';
const { v4: uuidv4 } = require('uuid');

let signRequests = [];
let approveRequests = [];
let chainRequests = []

let tokenSigneRequests = [];

export const windowId = {
  approve_page: "approve_page",
  request_sign: "request_sign",
  token_sign: "token_sign",
}
const ZKAPP_CHAIN_ACTION = [
  DAppActions.mina_addChain,
  DAppActions.mina_switchChain
]

class DappService {
  constructor() {
    this.dappStore = new ObservableStore({
      accountApprovedUrlList: {},
      currentConnect: {},
      tokenBuildList:{}
    })
    this.signEventListener = undefined
    this.tokenSignListener = undefined
  }

  requestCallback(request, id, sendResponse) {
    request().then((data) => {
      sendResponse({
        result: data,
        id: id
      });
    }).catch(error => {
      sendResponse({
        error: { ...error },
        id: id
      });
    })
  }

  async handleMessage(message, sender, sendResponse) {
    const { action, payload: { id, params, site } } = message;
    switch (action) {
      case DAppActions.mina_requestAccounts:
        this.requestCallback(
          () => this.requestAccounts(id,site),
          id,
          sendResponse
        )
        break;
      case DAppActions.mina_accounts:
        this.requestCallback(
          () => this.requestConnectedAccount(site),
          id,
          sendResponse
        )
        break;
      case DAppActions.mina_sendPayment:
      case DAppActions.mina_sendStakeDelegation:
      case DAppActions.mina_sendTransaction:
        this.requestCallback(
          () => this.signTransaction(id, { ...params, action }, site),
          id,
          sendResponse
        )
        break;
      case DAppActions.mina_signMessage:
      case DAppActions.mina_sign_JsonMessage:
      case DAppActions.mina_signFields:
        this.requestCallback(
          () => this.signTransaction(id, { ...params, action }, site),
          id,
          sendResponse
        )
        break;
      case DAppActions.mina_verifyMessage:
      case DAppActions.mina_verify_JsonMessage:
        this.requestCallback(
          () => verifyMessage(params.publicKey, params.signature, params.data),
          id,
          sendResponse
        )
        break;
      case DAppActions.mina_requestNetwork:
        this.requestCallback(
          () => this.requestNetwork(),
          id,
          sendResponse
        )
        break;
      case DAppActions.mina_verifyFields:
          this.requestCallback(
            () => verifyFieldsMessage(params.publicKey, params.signature, params.data),
            id,
            sendResponse
          )
          break;
      case DAppActions.mina_switchChain:
        this.requestCallback(
          () => this.signTransaction(id, { ...params, action }, site),
          id,
          sendResponse
        )
        break;
      case DAppActions.mina_addChain:
        this.requestCallback(
          () => this.signTransaction(id, { ...params, action }, site),
          id,
          sendResponse
        )
        break;
      case DAppActions.mina_createNullifier:
          this.requestCallback(
            () => this.signTransaction(id, { ...params, action }, site),
            id,
            sendResponse
          )
          break;
      case TOKEN_BUILD.add:
        const addId = await this.addTokenBuildList(message.payload)
        sendResponse(addId)
        break
      case TOKEN_BUILD.getParams:
        this.requestCallback(
          () => this.getTokenParamsById(message.payload),
          id,
          sendResponse
        )
        break;
      case TOKEN_BUILD.requestSign:
        this.requestCallback(
          () => this.requestTokenBuildSign(id, { ...params, action }, site),
          id,
          sendResponse
        )
        break;
      default:
        this.requestCallback(
          async ()=>{
            return { code:errorCodes.unsupportedMethod, message:getMessageFromCode(errorCodes.unsupportedMethod)}
          },
          id,
          sendResponse
        )
        break;
    }
  }
  async requestAccountNetInfo(params,site){
    return new Promise(async (resolve,reject) => {
      const {publicKey,tokenId} = params
      if(!publicKey || !addressValid(publicKey)){
        reject({ code:errorCodes.invalidParams, message: getMessageFromCode(errorCodes.invalidParams)})
        return 
      }
      const tokenID = tokenId ? tokenId : ZK_DEFAULT_TOKEN_ID
      const accountInfo = await getAccountInfo(publicKey,tokenID)
      if(accountInfo.error){
        reject({ code:errorCodes.throwError, message: JSON.stringify(accountInfo.error)})
      }
      if (accountInfo.account === null) {
        reject({
          code: errorCodes.notFound,
          message: `fetchAccount: Account with public key ${publicKey} does not exist.`,
        })
      }
      resolve({account:accountInfo.account})
    })
  }
  
  async signTransaction(id, params, site) {
    return new Promise(async (resolve, reject) => {
      let that = this
      try {
        let nextParams = {...params}
        let currentAccount = this.getCurrentAccountAddress()
        let approveAccountStatus = this.getCurrentAccountConnectStatus(site.origin, currentAccount)
        if (!approveAccountStatus) {
          reject({ code:errorCodes.userDisconnect, message:getMessageFromCode(errorCodes.userDisconnect)})
          return
        }
        const sendAction = params.action 
        if(lastWindowIds[POPUP_CHANNEL_KEYS.popup]){ 
          await checkAndTopV2(POPUP_CHANNEL_KEYS.popup)
        }
        if(ZKAPP_CHAIN_ACTION.indexOf(sendAction)!==-1 && chainRequests.length>0){
          reject({ code:errorCodes.zkChainPending,message: getMessageFromCode(errorCodes.zkChainPending)})
          return
        }

        let currentChainInfo 
        if(ZKAPP_CHAIN_ACTION.indexOf(sendAction)!==-1){
          currentChainInfo = await this.requestCurrentNetwork()
        }
        if(sendAction === DAppActions.mina_switchChain){
          let customNodeList = await getLocalNetworkList()
          let allNodeList = [...Default_Network_List,...customNodeList]
          let currentSupportChainList = allNodeList.map((node)=>{
            return node.networkID;
          })
          const nextChainIndex = currentSupportChainList.indexOf(params.networkID);
          if (nextChainIndex === -1) {
            reject({ code:errorCodes.notSupportChain, message: getMessageFromCode(errorCodes.notSupportChain) })
            return
          }
          if(currentChainInfo.networkID === params.networkID){
            resolve({
              networkID:currentChainInfo.networkID,
            })
            return
          }
        }
        if(sendAction === DAppActions.mina_addChain){
          const realAddUrl = decodeURIComponent(params.url)
          if (!urlValid(realAddUrl) || !params.name) {
            reject({ code:errorCodes.invalidParams, message: getMessageFromCode(errorCodes.invalidParams)})
            return
          }
          let exist = await this.checkNetworkIsExist(realAddUrl)
          if(exist.index !== -1){
            if(exist.config.url === currentChainInfo.url){
              resolve({
                networkID:currentChainInfo.networkID,
              })
              return 
            }else{
              nextParams.action = DAppActions.mina_switchChain
              nextParams.targetConfig = exist.config
            }
          }
        }
        const checkAddressAction = [
          DAppActions.mina_sendPayment,DAppActions.mina_sendStakeDelegation
        ]
        if(checkAddressAction.indexOf(sendAction)!==-1){
          if (params.to.length <= 0 || !addressValid(params.to)) {
            reject({ code:errorCodes.invalidParams, message: getMessageFromCode(errorCodes.invalidParams)})
            return
          }
        }

        if (sendAction === DAppActions.mina_sendPayment) {
          if (!isNumber(params.amount)|| (params.nonce && !isNumber(params.nonce))) {
            reject({ code:errorCodes.invalidParams, message: getMessageFromCode(errorCodes.invalidParams)})
            return
          }
        }
        if(sendAction === DAppActions.mina_sendTransaction){
          // format zk commond type
          nextParams.transaction = zkCommondFormat(params.transaction)
        }
        if(lastWindowIds[POPUP_CHANNEL_KEYS.popup]){ 
          await checkAndTopV2(POPUP_CHANNEL_KEYS.popup)
        }
        function onMessage(message, sender, sendResponse) {
          const { action, payload } = message;
          if(action === DAPP_ACTION_CANCEL_ALL){
            let requestList = signRequests
            requestList.map((item)=>{
                item.reject({code: errorCodes.userRejectedRequest , message:getMessageFromCode(errorCodes.userRejectedRequest)})
            })
            signRequests=[]
            that.setBadgeContent()
            if(chainRequests.length === 0){
              closePopupWindow(windowId.request_sign) 
              extension.runtime.onMessage.removeListener(onMessage)
              that.signEventListener = undefined
            }
            return 
          }
          const signId = payload?.id
          const currentSignParams = that.getSignParamsByOpenId(signId)
          if(!currentSignParams){
            return
          }
          const nextReject = currentSignParams.reject
          const nextResolve = currentSignParams.resolve
          
          switch (action) {
            case DAPP_ACTION_SEND_TRANSACTION:
                  if (payload.resultOrigin !== currentSignParams.site.origin) {
                    nextReject({ message: getMessageFromCode(errorCodes.originDismatch),code:errorCodes.originDismatch })
                    return
                  }
                  if (payload && (payload.hash || payload.signedData)) {
                    if(payload.hash){
                      nextResolve({
                        hash: payload.hash
                      })
                    }else{
                      nextResolve({
                        signedData: payload.signedData
                      })
                    }
                    that.removeSignParamsByOpenId(payload.id)
                    if(signRequests.length == 0 && chainRequests.length ===0){
                      extension.runtime.onMessage.removeListener(onMessage)
                      that.signEventListener = undefined
                    }
                    that.setBadgeContent()
                  } else if (payload && payload.cancel) {
                    nextReject({code: errorCodes.userRejectedRequest , message:getMessageFromCode(errorCodes.userRejectedRequest)})
                    that.removeSignParamsByOpenId(payload.id)
                    if(signRequests.length == 0 && chainRequests.length ===0){
                      extension.runtime.onMessage.removeListener(onMessage)
                      that.signEventListener = undefined
                    }
                    that.setBadgeContent()
                  } else {
                    let msg = payload.message || getMessageFromCode(errorCodes.internal)
                    nextReject({ message: msg,code:errorCodes.internal })
                  }
                  sendResponse()
                return true
            case DAPP_ACTION_SIGN_MESSAGE:
                  if (payload.resultOrigin !== currentSignParams.site.origin) {
                    nextReject({ message: getMessageFromCode(errorCodes.originDismatch),code:errorCodes.originDismatch })
                    return
                  }
                  if (payload && payload.signature) {
                    nextResolve(payload)
                    that.removeSignParamsByOpenId(payload.id)
                    if(signRequests.length == 0 && chainRequests.length ===0){
                      extension.runtime.onMessage.removeListener(onMessage)
                      that.signEventListener = undefined
                    }
                    that.setBadgeContent()
                    delete payload.resultOrigin
                    delete payload.id
                  } else {
                    nextReject({code: errorCodes.userRejectedRequest , message:getMessageFromCode(errorCodes.userRejectedRequest)})
                    that.removeSignParamsByOpenId(payload.id)
                    if(signRequests.length == 0 && chainRequests.length ===0){
                      extension.runtime.onMessage.removeListener(onMessage)
                      that.signEventListener = undefined
                    }
                    that.setBadgeContent()
                  }
                  sendResponse()
                return true
            case DAPP_ACTION_SWITCH_CHAIN: 
                if (payload.resultOrigin !== currentSignParams.site.origin) {
                  nextReject({ message: getMessageFromCode(errorCodes.originDismatch),code:errorCodes.originDismatch })
                  return
                }
                if(payload){
                  if(payload.cancel){
                    nextReject({code: errorCodes.userRejectedRequest , message:getMessageFromCode(errorCodes.userRejectedRequest)})
                    that.removeNotifyParamsByOpenId(payload.id)
                    if(signRequests.length == 0 && chainRequests.length ===0){
                      extension.runtime.onMessage.removeListener(onMessage)
                      that.signEventListener = undefined
                    }
                    that.setBadgeContent()
                  }else if(payload.nextConfig){
                    nextResolve(payload.nextConfig)
                    that.removeNotifyParamsByOpenId(payload.id)
                    if(signRequests.length == 0 && chainRequests.length ===0){
                      extension.runtime.onMessage.removeListener(onMessage)
                      that.signEventListener = undefined
                    }
                    that.setBadgeContent()
                  }else{
                      let msg = payload.message|| getMessageFromCode(errorCodes.internal)
                      nextReject({ message: msg,code:errorCodes.internal })
                  }
                }
                sendResponse()
                return true
              case DAPP_ACTION_CREATE_NULLIFIER:
                if (payload.resultOrigin !== currentSignParams.site.origin) {
                  nextReject({ message: getMessageFromCode(errorCodes.originDismatch),code:errorCodes.originDismatch })
                  return
                }
                if (payload && payload.private) {
                  nextResolve(payload)
                  that.removeSignParamsByOpenId(payload.id)
                  if(signRequests.length == 0 && chainRequests.length ===0){
                    extension.runtime.onMessage.removeListener(onMessage)
                    that.signEventListener = undefined
                  }
                  that.setBadgeContent()
                  delete payload.resultOrigin
                  delete payload.id
                } else {
                  nextReject({code: errorCodes.userRejectedRequest , message:getMessageFromCode(errorCodes.userRejectedRequest)})
                  that.removeSignParamsByOpenId(payload.id)
                  if(signRequests.length == 0 && chainRequests.length ===0){
                    extension.runtime.onMessage.removeListener(onMessage)
                    that.signEventListener = undefined
                  }
                  that.setBadgeContent()
                }
                sendResponse()
                return true
          }
          return false
        }
        if(!that.signEventListener){
          that.signEventListener = extension.runtime.onMessage.addListener(onMessage)
        }
        let time = new Date().getTime()
        if(ZKAPP_CHAIN_ACTION.indexOf(sendAction)!==-1){
          if(chainRequests.length>0){ // Handle approve and chain requests for concurrent requests
            reject({ code:errorCodes.zkChainPending,message: getMessageFromCode(errorCodes.zkChainPending)})
            return
          }
          chainRequests.push({ id, params:nextParams, site,resolve,reject,time })
        }else{
          signRequests.push({ id, params:nextParams, site,resolve,reject,time })
        }
        this.setBadgeContent()
        sendMsg({
          action: WORKER_ACTIONS.SIGN_ZK,
          },undefined,
          async ()=>{
            await startExtensionPopup(true)
            sendMsg({ action: WORKER_ACTIONS.SIGN_ZK }); 
          }
        )

      } catch (error) {
        reject({ code:errorCodes.throwError,message:getMessageFromCode(errorCodes.throwError),stack: String(error), })
      }
    })
  }
  clearAllPendingZk(){
    let requestList = [...signRequests,...approveRequests,...chainRequests,...tokenSigneRequests]
    requestList.map((item)=>{
      item.reject({code: errorCodes.userRejectedRequest , message:getMessageFromCode(errorCodes.userRejectedRequest)})
    })
    signRequests = []
    approveRequests = []
    chainRequests = []
    tokenSigneRequests = []
    this.setBadgeContent()
  }
  async checkLocalWallet() {
    let localAccount = await get("keyringData")
    if (localAccount && localAccount.keyringData) {
      return true
    } else {
      return false
    }
  }
  async requestConnectedAccount(site) {
    return new Promise(async (resolve) => {
      try {
        let isCreate = await this.checkLocalWallet()
        if (!isCreate) {
          resolve([])
          return
        }
        let currentAccount = this.getCurrentAccountAddress()
        let connectStatus = this.getCurrentAccountConnectStatus(site.origin, currentAccount)
        if (connectStatus) {
          resolve([currentAccount])
          return
        }
        resolve([])
      } catch (error) {
        resolve([])
      }
    })

  }
  async requestAccounts(id,site) {
    let that = this
    return new Promise(async (resolve, reject) => {
      try {
        let isCreate = await this.checkLocalWallet()
        if (!isCreate) {
          reject({ message: getMessageFromCode(errorCodes.noWallet),code:errorCodes.noWallet })
          return
        }
        let currentAccount = this.getCurrentAccountAddress()
        let connectStatus = this.getCurrentAccountConnectStatus(site.origin, currentAccount)
        if (connectStatus) {
          resolve([currentAccount])
          return
        }
        if(lastWindowIds[POPUP_CHANNEL_KEYS.popup]){
          await checkAndTopV2(POPUP_CHANNEL_KEYS.popup)
        }
        if(approveRequests.length>0){
          reject({ message: getMessageFromCode(errorCodes.zkChainPending),code:errorCodes.zkChainPending })
          return
        }
        function onMessage(message, sender, sendResponse) {
          const { action, payload } = message;
          
          const approveId = payload?.id
          const currentApproveParams = that.getApproveParamsByOpenId(approveId)
          if(!currentApproveParams){
            return
          }
          const nextReject = currentApproveParams.reject
          const nextResolve = currentApproveParams.resolve

          switch (action) {
            case DAPP_ACTION_GET_ACCOUNT:
                if (payload.resultOrigin !== currentApproveParams.site.origin) {
                  nextReject({ message: getMessageFromCode(errorCodes.originDismatch),code:errorCodes.originDismatch })
                  return
                }
                approveRequests = []
                that.setBadgeContent()
                if (payload.selectAccount && payload.selectAccount.length > 0) {
                  let account = payload.selectAccount[0]
                  let accountApprovedUrlList = that.dappStore.getState().accountApprovedUrlList
                  let currentApprovedList = accountApprovedUrlList[account.address] || []
                  if (currentApprovedList.indexOf(payload.resultOrigin) === -1) {
                    currentApprovedList.push(payload.resultOrigin)
                  }
                  accountApprovedUrlList[account.address] = currentApprovedList
                  that.updateApproveConnect(accountApprovedUrlList)
                  nextResolve([account.address])
                } else {
                  nextReject({code: errorCodes.userRejectedRequest , message:getMessageFromCode(errorCodes.userRejectedRequest)})
                }
                sendResponse()
              return true
            case DAPP_ACTION_CLOSE_WINDOW:
                if (payload.resultOrigin !== currentApproveParams.site.origin) {
                  nextReject({ message: getMessageFromCode(errorCodes.originDismatch),code:errorCodes.originDismatch })
                  return
                }
                extension.runtime.onMessage.removeListener(onMessage)
                nextResolve([payload.account])
                approveRequests = []
                that.setBadgeContent()
                sendResponse()
                return true
            default:
              break;
          }
          return false
        }
        extension.runtime.onMessage.addListener(onMessage)
        approveRequests.push({ id, site,resolve,reject })
        this.setBadgeContent()
        sendMsg({
          action: WORKER_ACTIONS.APPROVE,
          },undefined,
          async ()=>{
            await startExtensionPopup(true)
            sendMsg({ action: WORKER_ACTIONS.APPROVE }); 
          }
        )
      } catch (error) {
        reject({ stack: String(error),code:errorCodes.throwError,message:getMessageFromCode(errorCodes.throwError) })
      }
    })

  }
  setBadgeContent() {
    const list = [...approveRequests,...signRequests,...chainRequests,...tokenSigneRequests]
    const action = getExtensionAction()
    if (list.length > 0) {
      action.setBadgeText({ text: list.length.toString() });
    } else {
      action.setBadgeText({ text: "" });
    }
  }
  getApproveParamsByOpenId(openId){
    let params = approveRequests.filter((item) => {
      if (item.id === openId) {
        return item
      }
    })
    if (params.length > 0) {
      return params[0];
    } else {
      return null;
    }
  }

  getSignParamsByOpenId(openId) {
    let params = [...signRequests,...chainRequests].filter((item) => {
      if (item.id === openId) {
        return item
      }
    })
    if (params.length > 0) {
      return params[0];
    } else {
      return null;
    }
  }
  getSignParams() {
    let list = [...signRequests,...chainRequests]
    list.sort((a,b)=>a.time-b.time)
    let topItem
    if(list.length>0){
      topItem = list[0]
    }
    return {
      signRequests,
      chainRequests,
      topItem
    }
  }
  getApproveParams() {
    let list = [...approveRequests]
    if(list.length > 0){
      return list[0];
    }
  }
  removeSignParamsByOpenId(openId){
    const newSignRequests = signRequests.filter((item) => {
        return item.id !== openId
    })
    signRequests = newSignRequests
  }
  removeNotifyParamsByOpenId(openId){
    const newNotifyRequests = chainRequests.filter((item) => {
        return item.id !== openId
    })
    chainRequests = newNotifyRequests
  }
  getDappStore() {
    return this.dappStore.getState()
  };
  /**
   * get dapp account  address
   * @param {*} siteUrl 
   * @returns 
   */
  getCurrentAccountConnectStatus(siteUrl, currentAddress = "") {
    let accountApprovedUrlList = this.getDappStore().accountApprovedUrlList
    let currentAccountApproved = accountApprovedUrlList[currentAddress] || []
    return currentAccountApproved.indexOf(siteUrl) !== -1
  }

  getConnectStatus(siteUrl, address) {
    let accountApprovedUrlList = this.getDappStore().accountApprovedUrlList
    let currentAccountApproved = accountApprovedUrlList[address] || []
    if (currentAccountApproved.indexOf(siteUrl) !== -1) {
      return true
    }
    return false
  }
  /**
   * get current web url and disconnect
   * @param {*} siteUrl 
   * @param {*} address 
   * @returns 
   */
  disconnectDapp(siteUrl, address) {
    try {
      let accountApprovedUrlList = this.getDappStore().accountApprovedUrlList
      let currentAccountApproved = accountApprovedUrlList[address] || []
      let urlIndex = currentAccountApproved.indexOf(siteUrl)
      if (urlIndex !== -1) {
        currentAccountApproved.splice(urlIndex, 1);
        this.notifyAccountChange([siteUrl])

        accountApprovedUrlList[address] = currentAccountApproved
        this.updateApproveConnect(accountApprovedUrlList)

      }
      return true
    } catch (error) {
      return false
    }
  }
  /**
   * get the account  exist in web approve list
   * @param {*} address 
   * @param {*} accountList 
   * @returns 
   */
  getAccountIndex(accountList, address) {
    let keysList = accountList.map((item, index) => {
      return item.address
    })
    return keysList.indexOf(address)
  }
  /**
   * delete all connect of target address . when delete account
   * @param {*} address 
   */
  deleteDAppConnect(deletedAddress, oldCurrentAddress, newCurrentAddress) {
    let accountApprovedUrlList = this.getDappStore().accountApprovedUrlList
    if (deletedAddress !== oldCurrentAddress) {
      let deletedAccountApproved = accountApprovedUrlList[deletedAddress]
      if (deletedAccountApproved) {
        delete accountApprovedUrlList[deletedAddress];
        this.updateApproveConnect(accountApprovedUrlList)
      }
    } else {
      let deletedAccountApproved = accountApprovedUrlList[deletedAddress] || []
      let newAccountApproved = accountApprovedUrlList[newCurrentAddress] || []
      let diffConnectedUrl = getArrayDiff(deletedAccountApproved, newAccountApproved)

      if (newAccountApproved.length > 0) {
        this.notifyAccountChange(newAccountApproved, newCurrentAddress)
      }

      if (diffConnectedUrl.length > 0) {
        this.notifyAccountChange(diffConnectedUrl)
      }
    }
    return
  }
  getAppLockStatus() {
    return apiService.getLockStatus()
  }
  getCurrentAccountAddress() {
    return apiService.getCurrentAccountAddress()
  }
  changeCurrentConnecting(address, currentAddress) {
    let accountApprovedUrlList = this.getDappStore().accountApprovedUrlList

    let oldAccountApproved = accountApprovedUrlList[address] || []
    let newAccountApproved = accountApprovedUrlList[currentAddress] || []

    let diffConnectedUrl = getArrayDiff(oldAccountApproved, newAccountApproved)

    if (newAccountApproved.length > 0) {
      this.notifyAccountChange(newAccountApproved, currentAddress)
    }

    if (diffConnectedUrl.length > 0) {
      this.notifyAccountChange(diffConnectedUrl)
    }
    return
  }
  notifyAccountChange(siteUrlList, connectAccount) {
    let account = !connectAccount ? [] : [connectAccount]
    extension.tabs.query({}, (tabs) => {
      let message = {
        action: "accountsChanged",
        result: account
      }
      for (let tabIndex = 0; tabIndex < tabs.length; tabIndex++) {
        const tab = tabs[tabIndex];
        let origin = getOriginFromUrl(tab.url)

        let tabConnectIndex = siteUrlList.indexOf(origin)
        if(tabConnectIndex !== -1){
          extension.tabs.sendMessage(tab.id, message, res => { })
          continue;
        }
      }
    })
  }
  notifyNetworkChange(currentNet) {
    let networkID = currentNet.networkID || ""
    let message = {
      action: "chainChanged",
      result: {
        networkID:networkID,
      }
    }
    this.tabNotify(message)
  }
  tabNotify(message){
    extension.tabs.query({
    }, (tabs) => {
      let currentConnect = this.getDappStore().currentConnect
      for (let index = 0; index < tabs.length; index++) {
        const tab = tabs[index];

        if (currentConnect[tab.id]) {
          extension.tabs.sendMessage(tab.id, message, res => { })
        }
      }
    })
  }
  portDisconnectListener(port) {
    let tab = port?.sender?.tab || {}
    let tabId = tab.id
    if (!tabId) {
      return
    }
    let currentConnect = this.dappStore.getState().currentConnect
    if (currentConnect[tabId]) {
      delete currentConnect[tabId];
      this.dappStore.updateState({
        currentConnect
      })
    }
  }
  setupProviderConnection(port) {
    let tab = port?.sender?.tab || {}
    let tabId = tab.id
    if (!tabId) {
      return
    }
    let origin = port?.sender.origin
    let currentConnect = this.dappStore.getState().currentConnect
    if (!currentConnect[tabId]) {
      currentConnect[tabId] = {
        tabId: tabId,
        origin: origin
      }
      this.dappStore.updateState({
        currentConnect
      })
    }
  }
  requestNetwork() {
    return new Promise(async (resolve) => {
      let netConfig = await getCurrentNodeConfig()
      resolve({networkID:netConfig.networkID})
    })
  }
  requestCurrentNetwork() {
    return new Promise(async (resolve) => {
      let currentNodeConfig = await getCurrentNodeConfig()
      resolve(currentNodeConfig)
    })
  }
  getAppConnectionList(address){
    let accountApprovedUrlList = this.dappStore.getState().accountApprovedUrlList
    let currentAccountApproved = accountApprovedUrlList[address] || []
    return currentAccountApproved
  }
  async checkNetworkIsExist(url){
     let customList = await getLocalNetworkList()
     let allNodeList = [...Default_Network_List,...customList]
      let exist = checkNodeExist(allNodeList, url);
      return exist
  }
  async initApproveConnect(){
    let approveData = await get(ZKAPP_APPROVE_LIST)
    if(approveData?.ZKAPP_APPROVE_LIST){
      let approveMap = JSON.parse(approveData?.ZKAPP_APPROVE_LIST)
      this.dappStore.updateState({
        accountApprovedUrlList:approveMap
      })
    }
  }
   updateApproveConnect(approveMap){
    this.dappStore.updateState({
      accountApprovedUrlList:approveMap
    })
    save({ ZKAPP_APPROVE_LIST: JSON.stringify(approveMap) })
  }
  async addTokenBuildList(buildParams){
    const buildList = this.dappStore.getState().tokenBuildList
    let buildID = uuidv4()
    if(buildList[buildID]){
      buildID = uuidv4()
    }
    buildList[buildID] = {
      ...buildParams.sendParams,
      buildID
    }
    this.dappStore.updateState({
      tokenBuildList:buildList
    })

    let languageCode = buildParams.sendParams.langCode||""
    if(languageCode){
      languageCode = `/${languageCode}`
    }
    let targetUrl = TOKEN_BUILD_URL + languageCode  +"?buildid="+buildID;
    let nextOption = {}
    if(buildParams?.left && buildParams?.top){
      nextOption = {
        left: buildParams.left + PopupSize.exitSize,
        top: buildParams.top  + PopupSize.exitSize,
      }
    }
    startPopupWindow(targetUrl, "tokenSign_"+buildID, "buildDapp", {
      ...nextOption
    });
    return buildID
  }

  removeTokenBuildById(buildID){
    const newBuildList = tokenSigneRequests.filter((item) => {
      return item.id !== buildID
  })
    tokenSigneRequests = newBuildList
    const nextTokenBuildList = this.getDappStore().tokenBuildList
    delete nextTokenBuildList[buildID];
    this.dappStore.updateState({
      tokenBuildList:nextTokenBuildList
    })
  }
  checkSafeBuild(site){
    const buildUrl = new URL(site.origin)
    const hostname = buildUrl.hostname
    const whiteUrl = new URL(TOKEN_BUILD_URL)
    if(hostname!==whiteUrl.host){
      return false
    }
    return true
  }


  getAllTokenSignParams() {
    let list = [...tokenSigneRequests]
    list.sort((a,b)=>a.time-b.time)
    return list
  }

  async getTokenParamsById(payload){
    const site = payload.site
    if(!this.checkSafeBuild(site)){
      console.log('Unsafe Build',site);
      return { message: getMessageFromCode(errorCodes.originDismatch),code:errorCodes.originDismatch }; 
    }
    const buildId = payload.params
    const buildList = this.dappStore.getState().tokenBuildList
    const nextData = buildList[buildId]
    if(nextData){
      const data = encryptData(JSON.stringify(nextData),node_public_keys);
      return data
    }
    return nextData
  }
  getDecryptData(nextParams){
    try {
      const encrypted = nextParams.result
      let realUnSignTxStr = decryptData(encrypted.encryptedData,encrypted.encryptedAESKey,encrypted.iv,react_private_keys);
      return realUnSignTxStr
    } catch (error) {
      return ""
    }
  }
  verifyTokenBuildRes(decryptData,buildData){
    try {
      if(!buildData){
        return false
      }
      let realUnSignTx = JSON.stringify(decryptData.transaction)
      const checkChangeStatus = verifyTokenCommand(
        buildData,
        buildData.tokenId,
        realUnSignTx
      );
      return checkChangeStatus
    } catch (error) {
      console.log('verifyTokenBuildRes',error);
      return false
    }
  }
  requestTokenBuildSign(id, params, site){
    
    return new Promise(async (resolve, reject) => {
      let that = this
      try {
        let nextParams = {...params}
        const sendAction = params.action 
        function onMessage(message, sender, sendResponse) {
          const { action, payload } = message;
          if(action === DAPP_ACTION_CANCEL_ALL){ 
            let requestList = tokenSigneRequests
            requestList.map((item)=>{
                item.reject({code: errorCodes.userRejectedRequest , message:getMessageFromCode(errorCodes.userRejectedRequest)})
            })
            tokenSigneRequests=[]
            that.dappStore.updateState({
              tokenBuildList:{}
            })
            that.setBadgeContent()
            if(tokenSigneRequests.length === 0){
              closePopupWindow(windowId.token_sign) 
              extension.runtime.onMessage.removeListener(onMessage)
              that.tokenSignListener = undefined
            }
            return 
          }
          let currentSignParams = [...tokenSigneRequests].find((item) => {
            if (item.id === payload?.id) {
              return item
            }
          })
          if(!currentSignParams){
            return
          }
          const nextReject = currentSignParams.reject
          const nextResolve = currentSignParams.resolve
          
          switch (action) {
            case TOKEN_BUILD.requestSign:
                  if (payload.resultOrigin !== site.origin) {
                    nextReject({ message: getMessageFromCode(errorCodes.originDismatch),code:errorCodes.originDismatch })
                    return
                  }
                  if (payload && (payload.hash || payload.signedData)) {
                    if(payload.hash){
                      nextResolve({
                        hash: payload.hash
                      })
                    }else{
                      nextResolve({
                        signedData: payload.signedData
                      })
                    }
                    that.removeTokenBuildById(payload.id)
                    if(tokenSigneRequests.length == 0){
                      closePopupWindow(windowId.token_sign)
                      extension.runtime.onMessage.removeListener(onMessage)
                      that.tokenSignListener = undefined
                    }
                    that.setBadgeContent()
                  } else if (payload && payload.cancel) {
                    nextReject({code: errorCodes.userRejectedRequest , message:getMessageFromCode(errorCodes.userRejectedRequest)})
                    that.removeTokenBuildById(payload.id)
                    if(tokenSigneRequests.length == 0 ){
                      closePopupWindow(windowId.token_sign)
                      extension.runtime.onMessage.removeListener(onMessage)
                      that.tokenSignListener = undefined
                    }
                    that.setBadgeContent()
                  } else {
                    let msg = payload.message || getMessageFromCode(errorCodes.internal)
                    nextReject({ message: msg,code:errorCodes.internal })
                  }
                  sendResponse()
                return true
          }
          return false
        }
        const decryptData = that.getDecryptData(nextParams)
        if(!decryptData.buildID){
          reject({ message: getMessageFromCode(errorCodes.verifyFailed),code:errorCodes.verifyFailed })
          return
        }
        const buildList = this.dappStore.getState().tokenBuildList
        const buildData = buildList[decryptData.buildID]

        const checkBuildRes =  that.verifyTokenBuildRes(decryptData,buildData)
        if(!checkBuildRes){
          reject({ message: getMessageFromCode(errorCodes.verifyFailed),code:errorCodes.verifyFailed })
          return
        }
        closePopupWindow("tokenSign_"+decryptData.buildID)
        nextParams.buildData = buildData;
        nextParams.result = decryptData.transaction
        if(!that.tokenSignListener){ 
          that.tokenSignListener = extension.runtime.onMessage.addListener(onMessage)
        }
        let time = new Date().getTime()
        tokenSigneRequests.push({ id, params:nextParams, site,resolve,reject,time })
        this.setBadgeContent()
        sendMsg({
          action: WORKER_ACTIONS.BUILD_TOKEN_SEND,
          },undefined,
          async ()=>{
            await startExtensionPopup(true)
            sendMsg({ action: WORKER_ACTIONS.BUILD_TOKEN_SEND }); 
          }
        )
      } catch (error) {
        reject({ code:errorCodes.throwError,message:getMessageFromCode(errorCodes.throwError),stack: String(error), })
      }
    })
  }
  getAllPendingZK(){
    return {
      signRequests,
      chainRequests,
      approveRequests,
      tokenSigneRequests,
    }
  }
}
const dappService = new DappService()
export default dappService