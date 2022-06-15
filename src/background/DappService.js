import { DAppActions } from '@aurowallet/mina-provider';
import extension from 'extensionizer';
import ObservableStore from "obs-store";
import { DAPP_ACTION_CLOSE_WINDOW, DAPP_ACTION_GET_ACCOUNT, DAPP_ACTION_SEND_TRANSACTION, DAPP_ACTION_SIGN_MESSAGE, DAPP_CLOSE_POPUP_WINDOW, FROM_BACK_TO_RECORD } from '../constant/types';
import { checkAndTop, closePopupWindow, openPopupWindow } from "../utils/popup";
import { getArrayDiff, getCurrentNetConfig, getOriginFromUrl, isNumber } from '../utils/utils';
import { addressValid } from '../utils/validator';
import apiService from './APIService';
import { verifyMessage } from './lib';
import { get } from './storageService';

let signRequests = [];

export const windowId = {
  approve_page: "approve_page",
  request_sign: "request_sign",
}
let badgeList = []

const SIGN_TYPE = {
  TRANSFER: "TRANSFER",
  STAKING: "STAKING",
  MESSAGE: "MESSAGE",
  PARTY:"PARTY"
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
          () => this.requestAccounts(site),
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
        this.requestCallback(
          () => this.signTransaction(id, { ...params, action }, site, SIGN_TYPE.MESSAGE),
          id,
          sendResponse
        )
        break;
      case DAppActions.mina_verifyMessage:
        this.requestCallback(
          () => verifyMessage(params.publicKey, params.signature, params.payload),
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
        if (type !== SIGN_TYPE.MESSAGE && type !== SIGN_TYPE.PARTY) {
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
          let isExist = await checkAndTop(this.popupId, windowId.request_sign)
          if (isExist) {
            reject({ message: "have unfinished transaction" })
            return
          }
        }
        signRequests.push({ id, params, site })
        function onMessage(message, sender, sendResponse) {
          const { action, payload } = message;
          switch (action) {
            case DAPP_ACTION_SEND_TRANSACTION:
              {
                ((async ()=>{
                  if (payload.resultOrigin !== site.origin) {
                    reject({ message: "origin dismatch" })
                    return
                  }
                  if (payload && payload.hash) {
                    extension.runtime.onMessage.removeListener(onMessage)
                    resolve({
                      hash: payload.hash
                    })
                    await closePopupWindow(windowId.request_sign)
                    that.setBadgeContent(windowId.request_sign, BADGE_MINUS)
                  } else if (payload && payload.cancel) {
                    extension.runtime.onMessage.removeListener(onMessage)
                    reject({ message: "user reject", code: 4001 })
                    await closePopupWindow(windowId.request_sign)
                    that.setBadgeContent(windowId.request_sign, BADGE_MINUS)
                  } else {
                    let msg = payload.message || "transaction error"
                    reject({ message: msg })
                  }
                  sendResponse()
                })())
                return true
              }
            case DAPP_ACTION_SIGN_MESSAGE:
              {
                ((async ()=>{
                  if (payload.resultOrigin !== site.origin) {
                    reject({ message: "origin dismatch" })
                    return
                  }
                  if (payload && payload.signature) {
                    extension.runtime.onMessage.removeListener(onMessage)
                    delete payload.resultOrigin
                    resolve(payload)
                    await closePopupWindow(windowId.request_sign)
                    that.setBadgeContent(windowId.request_sign, BADGE_MINUS)
                  } else {
                    extension.runtime.onMessage.removeListener(onMessage)
                    reject({ message: "user reject", code: 4001 })
                    await closePopupWindow(windowId.request_sign)
                    that.setBadgeContent(windowId.request_sign, BADGE_MINUS)
                  }
                  sendResponse()
                })())
                return true
              }
          }
          return false
        }
        extension.runtime.onMessage.addListener(onMessage)
        let isUnlocked = this.getAppLockStatus()
        isUnlocked = isUnlocked ? 1 : 0
        let siteUrl = site.origin
        let openId = id

        let openParams = new URLSearchParams({ isUnlocked, siteUrl, siteIcon: site.webIcon, openId }).toString()
        this.popupId = await this.dappOpenPopWindow('./popup.html#/request_sign?' + openParams, windowId.request_sign, "dapp")
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
        if (channel === windowId.request_sign) {
          signRequests = []
        }
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
  async requestAccounts(site) {
    let that = this
    return new Promise(async (resolve, reject) => {
      try {
        let isCreate = await this.checkLocalWallet()
        if (!isCreate) {
          reject({ message: 'please create or restore wallet first' })
          return
        }
        let currentAccount = this.getCurrentAccountAddress()
        let connectStatus = this.getCurrentAccountConnectStatus(site.origin, currentAccount)//只返回当前账户
        if (connectStatus) {
          resolve([currentAccount])
          return
        }
        function onMessage(message, sender, sendResponse) {
          const { action, payload } = message;
          switch (action) {
            case DAPP_ACTION_GET_ACCOUNT:
              ((async () => {
                if (payload.resultOrigin !== site.origin) {
                  reject({ message: "origin dismatch" })
                  return
                }
                extension.runtime.onMessage.removeListener(onMessage)
                await closePopupWindow(windowId.approve_page)
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
              })())
              return true
            case DAPP_ACTION_CLOSE_WINDOW:
              ((async ()=>{
                if (payload.resultOrigin !== site.origin) {
                  reject({ message: "origin dismatch" })
                  return
                }
                extension.runtime.onMessage.removeListener(onMessage)
                resolve([payload.account])
                await closePopupWindow(payload.page)
                that.setBadgeContent(windowId.approve_page, BADGE_MINUS)
                sendResponse()
              })())
                return true
            default:
              break;
          }
          return false
        }
        extension.runtime.onMessage.addListener(onMessage)
        let isUnlocked = this.getAppLockStatus()
        isUnlocked = isUnlocked ? 1 : 0
        let siteUrl = site.origin
        let openParams = new URLSearchParams({ isUnlocked, siteUrl, siteIcon: site.webIcon }).toString()
        this.popupId = await this.dappOpenPopWindow('./popup.html#/approve_page?' + openParams,
          windowId.approve_page, "dapp")
        this.setBadgeContent(windowId.approve_page, BADGE_ADD)
      } catch (error) {
        reject({ message: String(error) })
      }
    })

  }
  setBadgeContent(content, type) {
    let contentIndex = badgeList.indexOf(content)
    if (type === BADGE_ADD) {
      if (contentIndex === -1) {
        badgeList.push(content)
      }
    } else {
      if (contentIndex !== -1) {
        badgeList.splice(contentIndex, 1)
      }
    }
    if (badgeList.length > 0) {
      extension.browserAction.setBadgeText({ text: badgeList.length.toString() });
      extension.browserAction.setBadgeBackgroundColor({ color: [76, 148, 255, 255] });
    } else {
      extension.browserAction.setBadgeText({ text: "" });
      extension.browserAction.setBadgeBackgroundColor({ color: [0, 0, 0, 0] });
    }
  }
  getSignParams(openId) {
    let params = signRequests.filter((item) => {
      if (item.id === openId) {
        return item
      }
    })
    if (params.length > 0) {
      return signRequests[0];
    } else {
      return null;
    }
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

    extension.tabs.query({
    }, (tabs) => {
      let message = {
        action: "chainChanged",
        result: netType
      }
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
    return new Promise((resolve) => {
      let netConfig = getCurrentNetConfig()
      let netType = ''
      if (netConfig.netType) {
        netType = netConfig.netType
      }
      resolve(netType)
    })
  }
}
const dappService = new DappService()
export default dappService