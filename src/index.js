import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import extension from 'extensionizer';
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { MAIN_NET_BASE_CONFIG, network_config, NET_CONFIG_VERSION } from "../config";
import { windowId } from "./background/DappService";
import { getLocal, saveLocal } from "./background/localStorage";
import { CURRENCY_UNIT } from "./constant/pageType";
import { CURRENCY_UNIT_CONFIG, NET_WORK_CONFIG } from "./constant/storageKey";
import { DAPP_GET_CURRENT_OPEN_WINDOW, WALLET_GET_CURRENT_ACCOUNT } from "./constant/types";
import { WALLET_CONNECT_TYPE } from "./constant/walletType";
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
import { sendNetworkChangeMsg } from "./utils/utils";


function getLocalNetConfig(store) {
  return new Promise((resolve)=>{
    let localNetConfig = getLocal(NET_WORK_CONFIG)
    let config
    if (!localNetConfig) {
      let netList = network_config.map((item) => {
        item.type = NET_CONFIG_DEFAULT
        return item
      })
      config = {
        currentConfig: netList[0],
        netList: netList,
        netConfigVersion:NET_CONFIG_VERSION
      }
      store.dispatch(updateNetConfig(config))
      saveLocal(NET_WORK_CONFIG, JSON.stringify(config))
      resolve(config)
    }else{
      let newJson = updateNetLocalConfig(JSON.parse(localNetConfig))
      store.dispatch(updateNetConfig(newJson))
      resolve(newJson)
    }
  })
}
function updateNetLocalConfig(netConfig){
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
        ...MAIN_NET_BASE_CONFIG,
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
    let netList = network_config.map((item) => {
      item.type = NET_CONFIG_DEFAULT
      return item
    })
    config = {
      currentConfig: netList[0],
      netList: netList,
      netConfigVersion:NET_CONFIG_VERSION
    }
  }else{
    let newNetList = network_config.map((item) => {
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
  saveLocal(NET_WORK_CONFIG, JSON.stringify(config))
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

export const applicationEntry = {
  async run() {
    await this.appInit(store)
    this.render();
  },

  async appInit(store) {
    extension.runtime.connect({ name: WALLET_CONNECT_TYPE.WALLET_APP_CONNECT });

    // init netRequest
    let netConfig =  await getLocalNetConfig(store)
    sendNetworkChangeMsg(netConfig.currentConfig)

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
