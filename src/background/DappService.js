import { DAppActions } from '@aurowallet/mina-provider';
import extension from 'extensionizer';
import ObservableStore from "obs-store";
import { DAPP_ACTION_CANCEL_ALL, DAPP_ACTION_CLOSE_WINDOW, DAPP_ACTION_GET_ACCOUNT, DAPP_ACTION_SEND_TRANSACTION, DAPP_ACTION_SIGN_MESSAGE, DAPP_ACTION_SWITCH_CHAIN, DAPP_CLOSE_POPUP_WINDOW, FROM_BACK_TO_RECORD } from '../constant/msgTypes';
import { checkAndTop, closePopupWindow, openPopupWindow } from "../utils/popup";
import { getArrayDiff, getCurrentNetConfig, getOriginFromUrl, isNumber } from '../utils/utils';
import { addressValid } from '../utils/validator';
import apiService from './APIService';
import { verifyFieldsMessage, verifyMessage } from './lib';
import { get } from './storageService';
import { NET_CONFIG_MAP } from '@/constant/network';

let signRequests = [];
let approveRequests = [];
let notificationRequests = []

export const windowId = {
  approve_page: "approve_page",
  request_sign: "request_sign",
}

const SIGN_TYPE = {
  TRANSFER: "TRANSFER",
  STAKING: "STAKING",
  MESSAGE: "MESSAGE",
  PARTY:"PARTY"
}

const Notification_TYPE = {
  SwitchChain: "SwitchChain",
}
const BADGE_ADD = "BADGE_ADD"
const BADGE_MINUS = "BADGE_MINUS"

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
        this.requestCallback(
          () => this.signTransaction(id, { ...params, action }, site, SIGN_TYPE.TRANSFER),
          id,
          sendResponse
        )
        break;
      case DAppActions.mina_sendStakeDelegation:
        this.requestCallback(
          () => this.signTransaction(id, { ...params, action }, site, SIGN_TYPE.STAKING),
          id,
          sendResponse
        )
        break;

      case DAppActions.mina_sendTransaction:
        this.requestCallback(
          () => this.signTransaction(id, { ...params, action }, site, SIGN_TYPE.PARTY),
          id,
          sendResponse
        )
        break;
      case DAppActions.mina_signMessage:
      case DAppActions.mina_sign_JsonMessage:
      case DAppActions.mina_signFields:
        this.requestCallback(
          () => this.signTransaction(id, { ...params, action }, site, SIGN_TYPE.MESSAGE),
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
          () => this.signTransaction(id, { ...params, action }, site, Notification_TYPE.SwitchChain),
          id,
          sendResponse
        )
        break;
    }
  }
  
  async signTransaction(id, params, site, type) {
    return new Promise(async (resolve, reject) => {
      let that = this
      try {
        let currentAccount = this.getCurrentAccountAddress()
        let approveAccountStatus = this.getCurrentAccountConnectStatus(site.origin, currentAccount)
        if (!approveAccountStatus) {
          reject({ message: "please connect first" })
          return
        }
        if(params.action === DAppActions.mina_switchChain){
          const currentSupportChainList = Object.keys(NET_CONFIG_MAP);
          const nextChainIndex = currentSupportChainList.indexOf(params.chainId);
          if (nextChainIndex === -1) {
            reject({ message: "Unsupport chain" })
            return
          }
        }
        if(type===Notification_TYPE.SwitchChain && notificationRequests.length>0){
          reject({ message: "have unfinished transaction" })
          return
        }
        if (type !== SIGN_TYPE.MESSAGE && type !== SIGN_TYPE.PARTY && type!==Notification_TYPE.SwitchChain) {
          if (params.to.length <= 0 || !addressValid(params.to)) {
            let errorMessage = type === SIGN_TYPE.TRANSFER ? "send address error" : "delegate address error"
            reject({ message: errorMessage })
            return
          }
        }

        if (type === SIGN_TYPE.TRANSFER) {
          if (!isNumber(params.amount)) {
            reject({ message: "amount error" })
            return
          }
        }
        if (this.popupId) {
          await checkAndTop(this.popupId, windowId.request_sign)
        }
        function onMessage(message, sender, sendResponse) {
          const { action, payload } = message;
          if(action === DAPP_ACTION_CANCEL_ALL){
            let requestList = signRequests
            requestList.map((item)=>{
                item.reject({ message: "user reject", code: 4001 })
            })
            signRequests=[]
            that.setBadgeContent(windowId.request_sign, BADGE_MINUS)
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
                  if (payload.resultOrigin !== site.origin) {
                    nextReject({ message: "origin dismatch" })
                    return
                  }
                  if (payload && payload.hash) {
                    nextResolve({
                      hash: payload.hash
                    })
                    that.removeSignParamsByOpenId(payload.id)
                    if(signRequests.length == 0 && notificationRequests.length ===0){
                      closePopupWindow(windowId.request_sign)
                      extension.runtime.onMessage.removeListener(onMessage)
                      that.signEventListener = undefined
                    }
                    that.setBadgeContent(windowId.request_sign, BADGE_MINUS)
                  } else if (payload && payload.cancel) {
                    nextReject({ message: "user reject", code: 4001 })
                    that.removeSignParamsByOpenId(payload.id)
                    if(signRequests.length == 0 && notificationRequests.length ===0){
                      closePopupWindow(windowId.request_sign)
                      extension.runtime.onMessage.removeListener(onMessage)
                      that.signEventListener = undefined
                    }
                    that.setBadgeContent(windowId.request_sign, BADGE_MINUS)
                  } else {
                    let msg = payload.message || "transaction error"
                    nextReject({ message: msg })
                  }
                  sendResponse()
                return true
            case DAPP_ACTION_SIGN_MESSAGE:
                  if (payload.resultOrigin !== site.origin) {
                    nextReject({ message: "origin dismatch" })
                    return
                  }
                  if (payload && payload.signature) {
                    nextResolve(payload)
                    delete payload.resultOrigin
                    that.removeSignParamsByOpenId(payload.id)
                    if(signRequests.length == 0 && notificationRequests.length ===0){
                      closePopupWindow(windowId.request_sign)
                      extension.runtime.onMessage.removeListener(onMessage)
                      that.signEventListener = undefined
                    }
                    that.setBadgeContent(windowId.request_sign, BADGE_MINUS)
                    
                  } else {
                    nextReject({ message: "user reject", code: 4001 })
                    that.removeSignParamsByOpenId(payload.id)
                    if(signRequests.length == 0 && notificationRequests.length ===0){
                      closePopupWindow(windowId.request_sign)
                      extension.runtime.onMessage.removeListener(onMessage)
                      that.signEventListener = undefined
                    }
                    that.setBadgeContent(windowId.request_sign, BADGE_MINUS)
                  }
                  sendResponse()
                return true
            case DAPP_ACTION_SWITCH_CHAIN: 
                if (payload.resultOrigin !== site.origin) {
                  nextReject({ message: "origin dismatch" })
                  return
                }
                if(payload){
                  if(payload.cancel){
                    nextReject({ message: "user reject", code: 4001 })
                    that.removeNotifyParamsByOpenId(payload.id)
                    if(signRequests.length == 0 && notificationRequests.length ===0){
                      closePopupWindow(windowId.request_sign)
                      extension.runtime.onMessage.removeListener(onMessage)
                      that.signEventListener = undefined
                    }
                    that.setBadgeContent(windowId.request_sign, BADGE_MINUS)
                  }else if(payload.status){
                    nextResolve(true)
                    that.removeNotifyParamsByOpenId(payload.id)
                    if(signRequests.length == 0 && notificationRequests.length ===0){
                      closePopupWindow(windowId.request_sign)
                      extension.runtime.onMessage.removeListener(onMessage)
                      that.signEventListener = undefined
                    }
                    that.setBadgeContent(windowId.request_sign, BADGE_MINUS)
                  }else{
                      let msg = payload.message || "Unsupport chain"
                      nextReject({ message: msg })
                  }
                }else{
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
        if(type === Notification_TYPE.SwitchChain){
          notificationRequests.push({ id, params, site,popupId:this.popupId,resolve,reject,time })
        }else{
          signRequests.push({ id, params, site,popupId:this.popupId,resolve,reject,time })
        }
        this.setBadgeContent(windowId.request_sign, BADGE_ADD)
      } catch (error) {
        reject({ message: String(error) })
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
        extension.runtime.sendMessage({
          type: FROM_BACK_TO_RECORD,
          action: DAPP_CLOSE_POPUP_WINDOW,
        });
        let requestList = [...signRequests,...approveRequests,...notificationRequests]
        requestList.map((item)=>{
          if(item.popupId === changeInfo.windowId){
            item.reject({ message: "user reject", code: 4001 })
          }
        })
        signRequests = []
        approveRequests = []
        notificationRequests = []
        that.setBadgeContent(channel, BADGE_MINUS)
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
          reject({ message: 'please create or restore wallet first' })
          return
        }
        let currentAccount = this.getCurrentAccountAddress()
        let connectStatus = this.getCurrentAccountConnectStatus(site.origin, currentAccount)
        if (connectStatus) {
          resolve([currentAccount])
          return
        }
        function onMessage(message, sender, sendResponse) {
          const { action, payload } = message;
          switch (action) {
            case DAPP_ACTION_GET_ACCOUNT:
                if (payload.resultOrigin !== site.origin) {
                  reject({ message: "origin dismatch" })
                  return
                }
                closePopupWindow(windowId.approve_page)
                that.setBadgeContent(windowId.approve_page, BADGE_MINUS)
                if (payload.selectAccount && payload.selectAccount.length > 0) {
                  let account = payload.selectAccount[0]
                  let accountApprovedUrlList = that.dappStore.getState().accountApprovedUrlList
                  let currentApprovedList = accountApprovedUrlList[account.address] || []
                  if (currentApprovedList.indexOf(site.origin) === -1) {
                    currentApprovedList.push(site.origin)
                  }
                  accountApprovedUrlList[account.address] = currentApprovedList
                  that.dappStore.updateState({
                    accountApprovedUrlList
                  })
                  resolve([account.address])
                } else {
                  reject({ message: 'user reject', code: 4001 })
                }
                sendResponse()
              return true
            case DAPP_ACTION_CLOSE_WINDOW:
                if (payload.resultOrigin !== site.origin) {
                  reject({ message: "origin dismatch" })
                  return
                }
                extension.runtime.onMessage.removeListener(onMessage)
                resolve([payload.account])
                closePopupWindow(payload.page)
                that.setBadgeContent(windowId.approve_page, BADGE_MINUS)
                sendResponse()
                return true
            default:
              break;
          }
          return false
        }
        extension.runtime.onMessage.addListener(onMessage)
        let siteUrl = site.origin
        let openParams = new URLSearchParams({ siteUrl, siteIcon: site.webIcon }).toString()
        this.popupId = await this.dappOpenPopWindow('./popup.html#/approve_page?' + openParams,
          windowId.approve_page, "dapp")
        approveRequests.push({ id, site,popupId:this.popupId,resolve,reject })
        this.setBadgeContent(windowId.approve_page, BADGE_ADD)
      } catch (error) {
        reject({ message: String(error) })
      }
    })

  }
  setBadgeContent(content, type) {
    const list = [...approveRequests,...signRequests,...notificationRequests]
    if (list.length > 0) {
      chrome.action?.setBadgeText({ text: list.length.toString() });
    } else {
      chrome.action?.setBadgeText({ text: "" });
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

    if (currentAccountApproved.indexOf(siteUrl) !== -1) {
      return true
    } else {
      return false
    }
  }

  getConncetStatus(siteUrl, address) {
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
        this.dappStore.updateState({
          accountApprovedUrlList
        })

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
        this.dappStore.updateState({
          accountApprovedUrlList
        })
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
    let isUnlocked = this.getAppLockStatus()
    if (isUnlocked) {
      return apiService.getCurrentAccountAddress()
    }
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
    let netType = currentNet.netType || ""
    let message = {
      action: "chainChanged",
      result: netType
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
      let netConfig = await getCurrentNetConfig()
      let netType = ''
      if (netConfig.netType) {
        netType = netConfig.netType
      }
      resolve(netType)
    })
  }
  getAppConnectionList(address){
    let accountApprovedUrlList = this.dappStore.getState().accountApprovedUrlList
    let currentAccountApproved = accountApprovedUrlList[address] || []
    return currentAccountApproved
  }
}
const dappService = new DappService()
export default dappService