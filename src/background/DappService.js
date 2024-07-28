import { DAppActions } from '@aurowallet/mina-provider';
import extension from 'extensionizer';
import ObservableStore from "obs-store";
import { DAPP_ACTION_CANCEL_ALL, DAPP_ACTION_CLOSE_WINDOW, DAPP_ACTION_CREATE_NULLIFIER, DAPP_ACTION_GET_ACCOUNT, DAPP_ACTION_SEND_TRANSACTION, DAPP_ACTION_SIGN_MESSAGE, DAPP_ACTION_SWITCH_CHAIN } from '../constant/msgTypes';
import { checkAndTop, closePopupWindow, openPopupWindow } from "../utils/popup";
import { checkNodeExist, getArrayDiff, getCurrentNodeConfig, getLocalNetworkList, getMessageFromCode, getOriginFromUrl, isNumber, urlValid } from '../utils/utils';
import { addressValid } from '../utils/validator';
import apiService from './APIService';
import { verifyFieldsMessage, verifyMessage } from './lib';
import { get, save } from './storageService';
import { Default_Network_List } from '@/constant/network';
import { errorCodes } from '@/constant/dappError';
import { zkCommondFormat } from '@/utils/zkUtils';
import { getAccountInfo } from './api';
import { ZKAPP_APPROVE_LIST } from '@/constant/storageKey';
import { ZK_DEFAULT_TOKEN_ID } from '../constant';

let signRequests = [];
let approveRequests = [];
let notificationRequests = []
// Interceptor to prevent zkapp from requesting accounts at the same time
let pendingApprove = undefined

export const windowId = {
  approve_page: "approve_page",
  request_sign: "request_sign",
}
const ZKAPP_CHAIN_ACTION = [
  DAppActions.mina_addChain,
  DAppActions.mina_switchChain
]

class DappService {
  constructor() {
    this.dappStore = new ObservableStore({
      accountApprovedUrlList: {},
      currentOpenWindow: {},
      currentConnect: {}
    })
    this.signEventListener = undefined
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

        if(ZKAPP_CHAIN_ACTION.indexOf(sendAction)!==-1 && notificationRequests.length>0){
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
          if (!isNumber(params.amount)) {
            reject({ code:errorCodes.invalidParams, message: getMessageFromCode(errorCodes.invalidParams)})
            return
          }
        }
        if(sendAction === DAppActions.mina_sendTransaction){
          // format zk commond type
          nextParams.transaction = zkCommondFormat(params.transaction)
        }
        if (this.popupId) {
          await checkAndTop(this.popupId, windowId.request_sign)
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
            if(notificationRequests.length === 0){
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
                    if(signRequests.length == 0 && notificationRequests.length ===0){
                      closePopupWindow(windowId.request_sign)
                      extension.runtime.onMessage.removeListener(onMessage)
                      that.signEventListener = undefined
                    }
                    that.setBadgeContent()
                  } else if (payload && payload.cancel) {
                    nextReject({code: errorCodes.userRejectedRequest , message:getMessageFromCode(errorCodes.userRejectedRequest)})
                    that.removeSignParamsByOpenId(payload.id)
                    if(signRequests.length == 0 && notificationRequests.length ===0){
                      closePopupWindow(windowId.request_sign)
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
                    if(signRequests.length == 0 && notificationRequests.length ===0){
                      closePopupWindow(windowId.request_sign)
                      extension.runtime.onMessage.removeListener(onMessage)
                      that.signEventListener = undefined
                    }
                    that.setBadgeContent()
                    delete payload.resultOrigin
                    delete payload.id
                  } else {
                    nextReject({code: errorCodes.userRejectedRequest , message:getMessageFromCode(errorCodes.userRejectedRequest)})
                    that.removeSignParamsByOpenId(payload.id)
                    if(signRequests.length == 0 && notificationRequests.length ===0){
                      closePopupWindow(windowId.request_sign)
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
                    if(signRequests.length == 0 && notificationRequests.length ===0){
                      closePopupWindow(windowId.request_sign)
                      extension.runtime.onMessage.removeListener(onMessage)
                      that.signEventListener = undefined
                    }
                    that.setBadgeContent()
                  }else if(payload.nextConfig){
                    nextResolve(payload.nextConfig)
                    that.removeNotifyParamsByOpenId(payload.id)
                    if(signRequests.length == 0 && notificationRequests.length ===0){
                      closePopupWindow(windowId.request_sign)
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
                  if(signRequests.length == 0 && notificationRequests.length ===0){
                    closePopupWindow(windowId.request_sign)
                    extension.runtime.onMessage.removeListener(onMessage)
                    that.signEventListener = undefined
                  }
                  that.setBadgeContent()
                  delete payload.resultOrigin
                  delete payload.id
                } else {
                  nextReject({code: errorCodes.userRejectedRequest , message:getMessageFromCode(errorCodes.userRejectedRequest)})
                  that.removeSignParamsByOpenId(payload.id)
                  if(signRequests.length == 0 && notificationRequests.length ===0){
                    closePopupWindow(windowId.request_sign)
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
        let siteUrl = site.origin
        let openId = id
        let openParams = new URLSearchParams({ siteUrl, siteIcon: site.webIcon, openId }).toString()
        this.popupId = await this.dappOpenPopWindow('./popup.html#/request_sign?' + openParams, windowId.request_sign, "dapp")
        let time = new Date().getTime()
        if(ZKAPP_CHAIN_ACTION.indexOf(sendAction)!==-1){
          notificationRequests.push({ id, params:nextParams, site,popupId:this.popupId,resolve,reject,time })
        }else{
          signRequests.push({ id, params:nextParams, site,popupId:this.popupId,resolve,reject,time })
        }
        this.setBadgeContent()
      } catch (error) {
        reject({ code:errorCodes.throwError,message:getMessageFromCode(errorCodes.throwError),stack: String(error), })
      }
    })
  }
  async dappOpenPopWindow(url,
    channel = "default",
    windowType = "") {
    let that = this
    let popupWindowId = await openPopupWindow(url, channel, windowType)
    this.setCurrentOpenWindow(url, channel)
    function removeListener (tabInfo, changeInfo) {
      if (popupWindowId === changeInfo.windowId) {
        extension.tabs.onRemoved.removeListener(removeListener)
        let requestList = [...signRequests,...approveRequests,...notificationRequests]
        requestList.map((item)=>{
          if(item.popupId === changeInfo.windowId){
            item.reject({code: errorCodes.userRejectedRequest , message:getMessageFromCode(errorCodes.userRejectedRequest)})
          }
        })
        signRequests = []
        approveRequests = []
        notificationRequests = []
        that.setBadgeContent()
        that.clearCurrentOpenWindow()
      }
    }
    extension.tabs.onRemoved.addListener(removeListener);
    return popupWindowId
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
        if (this.popupId) {
          let isExist = await checkAndTop(this.popupId, windowId.approve_page)
          if (isExist) { 
            reject({ message: getMessageFromCode(errorCodes.zkChainPending),code:errorCodes.zkChainPending })
            return
          }
        }
        if(pendingApprove && pendingApprove.site.origin === site.origin){
          reject({ message: getMessageFromCode(errorCodes.zkChainPending),code:errorCodes.zkChainPending })
          return
        }
        pendingApprove = { id, site}
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
                closePopupWindow(windowId.approve_page)
                that.setBadgeContent()
                if (payload.selectAccount && payload.selectAccount.length > 0) {
                  let account = payload.selectAccount[0]
                  let accountApprovedUrlList = that.dappStore.getState().accountApprovedUrlList
                  let currentApprovedList = accountApprovedUrlList[account.address] || []
                  if (currentApprovedList.indexOf(site.origin) === -1) {
                    currentApprovedList.push(site.origin)
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
                closePopupWindow(payload.page)
                that.setBadgeContent()
                sendResponse()
                return true
            default:
              break;
          }
          return false
        }
        extension.runtime.onMessage.addListener(onMessage)
        let siteUrl = site.origin
        let openParams = new URLSearchParams({ siteUrl, siteIcon: site.webIcon,id }).toString()
        this.popupId = await this.dappOpenPopWindow('./popup.html#/approve_page?' + openParams,
          windowId.approve_page, "dapp")
        approveRequests.push({ id, site,popupId:this.popupId,resolve,reject })
        pendingApprove=undefined
        this.setBadgeContent()
      } catch (error) {
        reject({ stack: String(error),code:errorCodes.throwError,message:getMessageFromCode(errorCodes.throwError) })
      }
    })

  }
  setBadgeContent() {
    const list = [...approveRequests,...signRequests,...notificationRequests]
    let isManifestV3 = extension.runtime.getManifest().manifest_version === 3
    const action = isManifestV3 ? chrome.action : chrome.browserAction;
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
    let params = [...signRequests,...notificationRequests].filter((item) => {
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
    let list = [...signRequests,...notificationRequests]
    list.sort((a,b)=>a.time-b.time)
    let topItem
    if(list.length>0){
      topItem = list[0]
    }
    return {
      signRequests,
      notificationRequests,
      topItem
    }
  }
  removeSignParamsByOpenId(openId){
    const newSignRequests = signRequests.filter((item) => {
        return item.id !== openId
    })
    signRequests = newSignRequests
  }
  removeNotifyParamsByOpenId(openId){
    const newNotifyRequests = notificationRequests.filter((item) => {
        return item.id !== openId
    })
    notificationRequests = newNotifyRequests
  }
  getDappStore() {
    return this.dappStore.getState()
  };
  getCurrentOpenWindow() {
    return this.getDappStore().currentOpenWindow
  }
  setCurrentOpenWindow(url, channel) {
    this.dappStore.updateState({
      currentOpenWindow: {
        url, channel
      }
    })
  }
  clearCurrentOpenWindow() {
    this.dappStore.updateState({
      currentOpenWindow: {}
    })
  }
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
}
const dappService = new DappService()
export default dappService