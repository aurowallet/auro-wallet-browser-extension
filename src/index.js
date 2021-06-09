import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { getLocal, saveLocal } from "./background/localStorage";
import * as storage from "./background/storageService";
import { LOCK_TIME, network_config } from "../config";
import { NET_WORK_CONFIG } from "./constant/storageKey";
import { WALLET_APP_CONNECT, WALLET_GET_CURRENT_ACCOUNT, WALLET_SET_UNLOCKED_STATUS } from "./constant/types";
import "./i18n";
import App from "./popup/App";
import rootReducer from "./reducers";
import { updateCurrentAccount } from "./reducers/accountReducer";
import { ENTRY_WITCH_ROUTE, updateEntryWitchRoute } from "./reducers/entryRouteReducer";
import { NET_CONFIG_DEFAULT, updateNetConfig } from "./reducers/network";
import { sendMsg } from "./utils/commonMsg";
import extension from 'extensionizer'

function getLocalNetConfig(store) {
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
  }else{
    store.dispatch(updateNetConfig(JSON.parse(localNetConfig)))
  }
}
async function getLocalStatus(store) {
  sendMsg({
    action: WALLET_GET_CURRENT_ACCOUNT,
  },
    async (currentAccount) => {
      if (currentAccount && currentAccount.localAccount && currentAccount.localAccount.keyringData) {
        if(currentAccount.isUnlocked){
          store.dispatch(updateCurrentAccount(currentAccount))
          store.dispatch(updateEntryWitchRoute(ENTRY_WITCH_ROUTE.HOME_PAGE))
        }else{
          store.dispatch(updateEntryWitchRoute(ENTRY_WITCH_ROUTE.LOCK_PAGE))
        }
      } else {
        store.dispatch(updateEntryWitchRoute(ENTRY_WITCH_ROUTE.WELCOME))
      }
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
    await getLocalStatus(store)
    getLocalNetConfig(store)
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
