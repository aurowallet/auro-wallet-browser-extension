import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { getLocal, saveLocal } from "./background/localStorage";
import * as storage from "./background/storageService";
import { LOCK_TIME, network_config } from "../config";
import { CURRENCY_UNIT_CONFIG, LOCAL_CACHE_KEYS, NET_WORK_CONFIG } from "./constant/storageKey";
import { WALLET_APP_CONNECT, WALLET_GET_CURRENT_ACCOUNT, WALLET_SET_UNLOCKED_STATUS } from "./constant/types";
import "./i18n";
import App from "./popup/App";
import rootReducer from "./reducers";
import { initCurrentAccount, updateAccountTx, updateCurrentAccount, updateNetAccount } from "./reducers/accountReducer";
import { ENTRY_WITCH_ROUTE, updateEntryWitchRoute } from "./reducers/entryRouteReducer";
import { NET_CONFIG_DEFAULT, updateNetConfig } from "./reducers/network";
import { sendMsg } from "./utils/commonMsg";
import extension from 'extensionizer'
import { CURRENCY_UNIT } from "./constant/pageType";
import { updateCurrencyConfig } from "./reducers/currency";
import { updateCurrentPrice } from "./reducers/cache";
import { updateBlockInfo, updateDaemonStatus, updateDelegationInfo, updateStakingList, updateValidatorDetail } from "./reducers/stakingReducer";
import { isNumber } from "./utils/utils";

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
/**
 * 获取本地缓存的数据
 */
function getlocalCache(store,netType,currentAccount){ 
  let address = currentAccount?.address || ""
  if(netType === NET_CONFIG_DEFAULT){
    let localHistory = getLocal(LOCAL_CACHE_KEYS.TRANSACTION_HISTORY)
    let txList = []
    let pendingTxList = []
    if(localHistory){
        let localHistoryJson = safeJsonParse(localHistory)
        txList = localHistoryJson ? localHistoryJson[address] :[]
    }
    let localPendingHistory = getLocal(LOCAL_CACHE_KEYS.PENDING_TRANSACTION_HISTORY)
    if(localPendingHistory){
      let localPendingJson = safeJsonParse(localPendingHistory)
      pendingTxList = localPendingJson ? localPendingJson[address] :[]
    }
    store.dispatch(updateAccountTx(txList, pendingTxList))  
  } 
  let localAccount = getLocal(LOCAL_CACHE_KEYS.ACCOUNT_BALANCE)
  if(localAccount){
    let localAccountJson = safeJsonParse(localAccount)
    let netAccount = localAccountJson ? localAccountJson[address]:""
    if(netAccount){
      store.dispatch(updateNetAccount(netAccount))
    }
  }
  let localPrice = getLocal(LOCAL_CACHE_KEYS.COIN_PRICE)
  if(localPrice){
    let localPriceJson = safeJsonParse(localPrice)
    if(localPriceJson && isNumber(localPriceJson.price)){
      store.dispatch(updateCurrentPrice(localPriceJson.price))
    }
  }

  let localDaemonStatus = getLocal(LOCAL_CACHE_KEYS.DAEMON_STATUS)
  if(localDaemonStatus){
    let localDaemonStatusJson = safeJsonParse(localDaemonStatus)
    if(localDaemonStatusJson){
      store.dispatch(updateDaemonStatus(localDaemonStatusJson))
    }
  }

  let localDelegationInfo = getLocal(LOCAL_CACHE_KEYS.DELEGATION_INFO)
  if(localDelegationInfo){
    let localDelegationInfoJson = safeJsonParse(localDelegationInfo)
    let delegationInfoJson = localDelegationInfoJson?localDelegationInfoJson[address]:""
    if(delegationInfoJson){
      store.dispatch(updateDelegationInfo(delegationInfoJson))
    }
  }

  let localBlockInfo = getLocal(LOCAL_CACHE_KEYS.BLOCK_INFO)
  if(localBlockInfo){
    let localBlockInfoJson = safeJsonParse(localBlockInfo)
    if(localBlockInfoJson){
      store.dispatch(updateBlockInfo(localBlockInfoJson))
    }
  }

  let localValidatorDetail = getLocal(LOCAL_CACHE_KEYS.VALIDATOR_DETAIL)
  if(localValidatorDetail){
    let localValidatorDetailJson = safeJsonParse(localValidatorDetail)
    if(localValidatorDetailJson){
      store.dispatch(updateValidatorDetail(localValidatorDetailJson))
    }
  }


  let localStakingList = getLocal(LOCAL_CACHE_KEYS.STAKING_LIST)
  if(localStakingList){
    let localStakingListJson = safeJsonParse(localStakingList)
    if(localStakingListJson){
      store.dispatch(updateStakingList({stakingList:localStakingListJson}))
    }
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
    let localNetConfig = await getLocalNetConfig(store)
    const {netList,currentUrl} = localNetConfig
    let netType = ""
    for (let index = 0; index < netList.length; index++) {
        const netConfig = netList[index];
        if(currentUrl === netConfig.url){
            netType = netConfig.type
            break
        }
    }
    // 初始化账户和路由
    let accountData = await getLocalStatus(store)
    const {currentAccount,nextRoute} = accountData
    // 初始化本地数据缓存
    getlocalCache(store,netType,currentAccount)
    
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
