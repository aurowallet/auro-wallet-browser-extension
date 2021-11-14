import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import extension from 'extensionizer';
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { network_config } from "../config";
import { getLocal, saveLocal } from "./background/localStorage";
import { CURRENCY_UNIT } from "./constant/pageType";
import { CURRENCY_UNIT_CONFIG, NET_WORK_CONFIG } from "./constant/storageKey";
import { WALLET_APP_CONNECT, WALLET_GET_CURRENT_ACCOUNT } from "./constant/types";
import "./i18n";
import App from "./popup/App";
import rootReducer from "./reducers";
import { initCurrentAccount } from "./reducers/accountReducer";
import { updateCurrencyConfig } from "./reducers/currency";
import { ENTRY_WITCH_ROUTE, updateEntryWitchRoute } from "./reducers/entryRouteReducer";
import { NET_CONFIG_DEFAULT, updateNetConfig } from "./reducers/network";
import { sendMsg } from "./utils/commonMsg";

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
        currentUrl: netList[0].url,
        netList: netList
      }
      store.dispatch(updateNetConfig(config))
      saveLocal(NET_WORK_CONFIG, JSON.stringify(config))
      resolve(config)
    }else{
      config = JSON.parse(localNetConfig)
      store.dispatch(updateNetConfig(config))
      resolve(config)
    }
  })
}
/**
 * 
 * @param {*} selectKey 旧版本存储为 array ， 新版本改为string
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

async function getLocalStatus(store) {
  return new Promise((resolve)=>{
    sendMsg({
      action: WALLET_GET_CURRENT_ACCOUNT,
    },async (currentAccount)=>{
      let nextRoute =""
      if (currentAccount && currentAccount.localAccount && currentAccount.localAccount.keyringData) {
        if(currentAccount.isUnlocked){
          store.dispatch(initCurrentAccount(currentAccount))
          nextRoute = ENTRY_WITCH_ROUTE.HOME_PAGE
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
    this.createReduxStore();
    this.appInit(this.reduxStore)
    this.render();
  },

  async appInit(store) {
    extension.runtime.connect({ name: WALLET_APP_CONNECT });
    // 初始化网络请求
    await getLocalNetConfig(store)
    // 初始化账户和路由
    let accountData = await getLocalStatus(store)
    const {nextRoute} = accountData
    // 初始化当前 发币类型
    getLocalCurrencyConfig(store)
    
    if(nextRoute){
      store.dispatch(updateEntryWitchRoute(nextRoute))
    }
  },
  createReduxStore() {
    this.reduxStore = configureStore({
      reducer: rootReducer,
      middleware: [...getDefaultMiddleware(),
      ],
    });
  },
  render() {
    ReactDOM.render(
      <React.StrictMode>
        <Provider store={this.reduxStore}>
          <App />
        </Provider>
      </React.StrictMode>,
      document.getElementById("root")
    );
  },
};

applicationEntry.run();
