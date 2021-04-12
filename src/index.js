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
import { NET_CONFIG_DEFAULT } from "./reducers/network";
import { sendMsg } from "./utils/commonMsg";
import extension from 'extensionizer'

function getLocalNetConfig() {
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
    saveLocal(NET_WORK_CONFIG, JSON.stringify(config))
  }
}
async function getLocalStatus(store) {
  sendMsg({
    action: WALLET_GET_CURRENT_ACCOUNT,
  },
    async (currentAccount) => {
      if (currentAccount && currentAccount.localAccount && currentAccount.localAccount.keyringData) {
        await getLockStatus(store, currentAccount)
      } else {
        store.dispatch(updateEntryWitchRoute(ENTRY_WITCH_ROUTE.WELCOME))
      }
    })
}

async function getLockStatus(store, account) {
  const { AppState } = await storage.get("AppState");
  let lockTime = LOCK_TIME
  if (AppState) {
    const { lastClosed } = AppState;
    const now = Date.now();
    const offset = now - lastClosed;
    if (offset < lockTime && account.isUnlocked && account.address) {
      store.dispatch(updateCurrentAccount(account))
      store.dispatch(updateEntryWitchRoute(ENTRY_WITCH_ROUTE.HOME_PAGE))
    } else {
      sendMsg({
        action: WALLET_SET_UNLOCKED_STATUS,
        payload: false
      }, (res) => { })
      store.dispatch(updateEntryWitchRoute(ENTRY_WITCH_ROUTE.LOCK_PAGE))
    }
  } else {
    store.dispatch(updateEntryWitchRoute(ENTRY_WITCH_ROUTE.WELCOME))
  }
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
    getLocalNetConfig()
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
