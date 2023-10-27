import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import extension from 'extensionizer';
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { NET_CONFIG_VERSION } from "../config";
import { windowId } from "./background/DappService";
import { getLocal, saveLocal } from "./background/localStorage";
import { extGetLocal, extSaveLocal } from "./background/extensionStorage";
import { CURRENCY_UNIT } from "./constant";
import { CURRENCY_UNIT_CONFIG, LANGUAGE_CONFIG, NET_WORK_CONFIG, STORAGE_UPGRADE_STATUS } from "./constant/storageKey";
import { DAPP_GET_CURRENT_OPEN_WINDOW, WALLET_GET_CURRENT_ACCOUNT } from "./constant/msgTypes";
import "./i18n";
import App from "./popup/App";
import rootReducer from "./reducers";
import { initCurrentAccount } from "./reducers/accountReducer";
import { updateDAppOpenWindow } from "./reducers/cache";
import { updateCurrencyConfig } from "./reducers/currency";
import { ENTRY_WITCH_ROUTE, updateEntryWitchRoute } from "./reducers/entryRouteReducer";
import { NET_CONFIG_DEFAULT, updateNetConfig } from "./reducers/network";
import store from "./store/store";
import { sendMsg } from "./utils/commonMsg";
import { WALLET_CONNECT_TYPE } from "./constant/commonType";
import { NETWORK_CONFIG_LIST, NET_CONFIG_MAP, NET_CONFIG_TYPE } from "./constant/network";


function getLocalNetConfig(store) {
  return new Promise(async (resolve)=>{
    let localNetConfig = await extGetLocal(NET_WORK_CONFIG)
    let config
    if (!localNetConfig) {
      let netList = NETWORK_CONFIG_LIST.map((item) => {
        item.type = NET_CONFIG_DEFAULT
        return item
      })
      config = {
        currentConfig: netList[0],
        netList: netList,
        netConfigVersion:NET_CONFIG_VERSION
      }
      store.dispatch(updateNetConfig(config))
      await extSaveLocal(NET_WORK_CONFIG, config)
      resolve(config)
    }else{
      let newJson = await updateNetLocalConfig(localNetConfig)
      store.dispatch(updateNetConfig(newJson))
      resolve(newJson)
    }
  })
}

async function updateNetLocalConfig(netConfig){
  let localVersion = netConfig.netConfigVersion || 0 

  if(localVersion >= NET_CONFIG_VERSION){
    return netConfig
  }
  let localNetList = netConfig.netList
  let currentUrl = netConfig.currentUrl || netConfig.currentConfig.url
  let currentConfig = {}
  let defaultList = []
  let addList = []
  let currentUrlType = ""
  localNetList.map((item,index)=>{
   
    let newItem = item
    if(item.type === NET_CONFIG_DEFAULT){
      defaultList.push(item)
    }else{
      let id = item.url
      newItem =  {
        ...NET_CONFIG_MAP[NET_CONFIG_TYPE.Mainnet].config,
        name:item.name||"Unknown",
        id,
        ...item,
      }
      addList.push(newItem)
    }
    if(newItem.url === currentUrl){
      currentConfig = newItem
      currentUrlType = newItem.type
    }

  })
  let config
  if(addList.length === 0){
    let netList = NETWORK_CONFIG_LIST.map((item) => {
      item.type = NET_CONFIG_DEFAULT
      return item
    })
    config = {
      currentConfig: netList[0],
      netList: netList,
      netConfigVersion:NET_CONFIG_VERSION
    }
  }else{
    let newNetList = NETWORK_CONFIG_LIST.map((item) => {
      item.type = NET_CONFIG_DEFAULT
      return item
    }) 
    newNetList.push(...addList)
    let newCurrentConfig = {}
    if(currentUrlType === NET_CONFIG_DEFAULT){
      newCurrentConfig = newNetList[0]
    }else{
      newCurrentConfig = currentConfig
    }
    config = {
      currentConfig:newCurrentConfig,
      netList: newNetList,
      netConfigVersion:NET_CONFIG_VERSION
    }
  }
  await extSaveLocal(NET_WORK_CONFIG, config) 
  return config
}
/**
 * 
 * @param {*} selectKey The old version is stored as an array, the new version is changed to string
 * @param {*} newConfigList 
 * @returns 
 */
function compareConfig(oldConfig,newConfigList){
  let isNewListSelect = false
  let selectKey = ""
  if(Array.isArray(oldConfig)){
    for (let index = 0; index < oldConfig.length; index++) {
      const config = oldConfig[index];
      if(config.isSelect){
        selectKey = config.key
        break
      }
    }
  }else{
    selectKey = oldConfig
  }

  if(selectKey){
    for (let index = 0; index < newConfigList.length; index++) {
      let newConfig = newConfigList[index];
      if(newConfig.key === selectKey){
        newConfig.isSelect = true
        isNewListSelect = true
        saveLocal(CURRENCY_UNIT_CONFIG, JSON.stringify(newConfig.key))
        break
      }
    }
  }
  if(!isNewListSelect){
    newConfigList[0].isSelect = true
    saveLocal(CURRENCY_UNIT_CONFIG, JSON.stringify(newConfigList[0].key))
  }
  return newConfigList
}
function safeJsonParse(data){
  try {
    return JSON.parse(data)
  } catch (error) {
    return ""
  }
}
function getLocalCurrencyConfig(store) { 
  let localCurrencyConfig = getLocal(CURRENCY_UNIT_CONFIG)
  if (!localCurrencyConfig) {
    let currencyList = CURRENCY_UNIT
    currencyList[0].isSelect = true
    store.dispatch(updateCurrencyConfig(currencyList))
    saveLocal(CURRENCY_UNIT_CONFIG, JSON.stringify(currencyList[0].key))
  }else{
    let oldConfigKey= safeJsonParse(localCurrencyConfig)
    let list = compareConfig(oldConfigKey,CURRENCY_UNIT)
    store.dispatch(updateCurrencyConfig(list))
  }
}

async function getDappStatus(store){
  return new Promise((resolve)=>{
    let nextRoute =""
    sendMsg({
      action: DAPP_GET_CURRENT_OPEN_WINDOW,
    },
      async (window) => {
        if(window && window.channel){
          store.dispatch(updateDAppOpenWindow(window))
          if(window.channel === windowId.request_sign){
            nextRoute = ENTRY_WITCH_ROUTE.DAPP_SIGN_PAGE
          }else if(window.channel === windowId.approve_page){
            nextRoute = ENTRY_WITCH_ROUTE.DAPP_APPROVE_PAGE
          }else if(window.channel === windowId.zkpp_notification){
            nextRoute = ENTRY_WITCH_ROUTE.DAPP_APPROVE_PAGE
          }
        }else{
          nextRoute = ENTRY_WITCH_ROUTE.HOME_PAGE
        }
        resolve(nextRoute)
      })
  })

}

async function getLocalStatus(store) {
  return new Promise((resolve)=>{
    sendMsg({
      action: WALLET_GET_CURRENT_ACCOUNT,
    },async (currentAccount)=>{
      let nextRoute =""
      if (currentAccount && currentAccount.localAccount && currentAccount.localAccount.keyringData) {
        if(currentAccount.isUnlocked){
          store.dispatch(initCurrentAccount(currentAccount))
          nextRoute = await getDappStatus(store)
        }else{
          nextRoute = ENTRY_WITCH_ROUTE.LOCK_PAGE
        }
        resolve({currentAccount,nextRoute})
      }else{
        nextRoute = ENTRY_WITCH_ROUTE.WELCOME
        resolve({nextRoute})
      }
    })
  })
}
async function upgradeStorageConfig(){
  // 这里存在
  // 1. 从v2 升级到 v3 这里需要升级  标示是存储过 语言记录或者网络记录
    
  // 当不存在这两个记录时，则此处不需要升级，直接返回即可， 说明是v3 或者是新使用
  
  // 当存在任意一个记录时，则标示是升级，存在哪个升级哪个，升级结束后，本地保存一份升级的记录，
  // 下次打开时，如果存在这个记录，说明已升级，直接返回，如果不存在，则继续升级过程
  const languageConfig = getLocal(LANGUAGE_CONFIG) 
  const networkConfig = getLocal(NET_WORK_CONFIG) 
  if(!languageConfig || !networkConfig){// 当不存在这两个记录时，则此处不需要升级，直接返回即可， 说明是v3 或者是新使用
    return 
  }
  const storageUpgradeToV3Status = getLocal(STORAGE_UPGRADE_STATUS)
  if(storageUpgradeToV3Status){ // 下次打开时，如果存在这个记录，说明已升级，直接返回，
    return
  }

  if(languageConfig){
    await extSaveLocal(LANGUAGE_CONFIG, languageConfig)
  }
  if(networkConfig){
    await extSaveLocal(NET_WORK_CONFIG, JSON.parse(networkConfig))
  }
  saveLocal(STORAGE_UPGRADE_STATUS,true)
}

export const applicationEntry = {
  async run() {
    await this.appInit(store)
    this.render();
  },

  async appInit(store) {
    extension.runtime.connect({ name: WALLET_CONNECT_TYPE.WALLET_APP_CONNECT });

    await upgradeStorageConfig()
    // init netRequest
    await getLocalNetConfig(store)
    // init nextRoute
    let accountData = await getLocalStatus(store)
    const {nextRoute} = accountData
    // init Currency
    getLocalCurrencyConfig(store)
    
    if(nextRoute){
      store.dispatch(updateEntryWitchRoute(nextRoute))
    }
  },
 
  render() {
    ReactDOM.render(
      <React.StrictMode>
        <Provider store={store}>
          <App />
        </Provider>
      </React.StrictMode>,
      document.getElementById("root")
    );
  },
};

applicationEntry.run();
