import browser from 'webextension-polyfill';
import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { NET_CONFIG_VERSION } from "../config";
import { windowId } from "./background/DappService";
import {
  extGetLocal,
  extRemoveLocal,
  extSaveLocal,
} from "./background/extensionStorage";
import { getLocal, saveLocal } from "./background/localStorage";
import { CURRENCY_UNIT } from "./constant";
import { WALLET_CONNECT_TYPE } from "./constant/commonType";
import { POPUP_ACTIONS, WALLET_GET_CURRENT_ACCOUNT } from "./constant/msgTypes";
import { DefaultMainnetConfig } from "./constant/network";
import {
  CURRENCY_UNIT_CONFIG,
  NET_WORK_CHANGE_FLAG,
  NET_WORK_CONFIG_V2,
} from "./constant/storageKey";
import { languageInit } from "./i18n";
import App from "./popup/App";
import {
  initCurrentAccount,
  updateShouldRequest,
} from "./reducers/accountReducer";
import { updateCurrencyConfig } from "./reducers/currency";
import {
  ENTRY_WITCH_ROUTE,
  updateEntryWitchRoute,
} from "./reducers/entryRouteReducer";
import { updateCurrentNode, updateCustomNodeList } from "./reducers/network";
import store from "./store/store";
import { sendMsg } from "./utils/commonMsg";
import PopupMonitor from "./monitor/PopupMonitor";

function getLocalNetConfig(store) {
  return new Promise(async (resolve) => {
    let localNetConfig = await extGetLocal(NET_WORK_CONFIG_V2);
    let config;
    if (!localNetConfig) {
      config = {
        currentNode: DefaultMainnetConfig,
        customNodeList: [],
        nodeConfigVersion: NET_CONFIG_VERSION,
      };
      store.dispatch(updateCurrentNode(config.currentNode));
      await extSaveLocal(NET_WORK_CONFIG_V2, config);
      resolve(config);
    } else {
      store.dispatch(updateCurrentNode(localNetConfig.currentNode));
      store.dispatch(updateCustomNodeList(localNetConfig.customNodeList));
      resolve(localNetConfig);
    }
  });
}
/**
 *
 * @param {*} selectKey The old version is stored as an array, the new version is changed to string
 * @param {*} newConfigList
 * @returns
 */
function compareConfig(oldConfig, newConfigList) {
  let isNewListSelect = false;
  let selectKey = "";
  if (Array.isArray(oldConfig)) {
    for (let index = 0; index < oldConfig.length; index++) {
      const config = oldConfig[index];
      if (config.isSelect) {
        selectKey = config.key;
        break;
      }
    }
  } else {
    selectKey = oldConfig;
  }

  if (selectKey) {
    for (let index = 0; index < newConfigList.length; index++) {
      let newConfig = newConfigList[index];
      if (newConfig.key === selectKey) {
        newConfig.isSelect = true;
        isNewListSelect = true;
        saveLocal(CURRENCY_UNIT_CONFIG, JSON.stringify(newConfig.key));
        break;
      }
    }
  }
  if (!isNewListSelect) {
    newConfigList[0].isSelect = true;
    saveLocal(CURRENCY_UNIT_CONFIG, JSON.stringify(newConfigList[0].key));
  }
  return newConfigList;
}
function safeJsonParse(data) {
  try {
    return JSON.parse(data);
  } catch (error) {
    return "";
  }
}
function getLocalCurrencyConfig(store) {
  let localCurrencyConfig = getLocal(CURRENCY_UNIT_CONFIG);
  if (!localCurrencyConfig) {
    let currencyList = CURRENCY_UNIT;
    currencyList[0].isSelect = true;
    store.dispatch(updateCurrencyConfig(currencyList));
    saveLocal(CURRENCY_UNIT_CONFIG, JSON.stringify(currencyList[0].key));
  } else {
    let oldConfigKey = safeJsonParse(localCurrencyConfig);
    let list = compareConfig(oldConfigKey, CURRENCY_UNIT);
    store.dispatch(updateCurrencyConfig(list));
  }
}

async function initAccountInfo(store) {
  return new Promise((resolve) => {
    sendMsg(
      {
        action: WALLET_GET_CURRENT_ACCOUNT,
      },
      async (currentAccount) => {
        let nextRoute = "";
        if (currentAccount?.localAccount?.keyringData) {
          if (currentAccount.isUnlocked) {
            store.dispatch(initCurrentAccount(currentAccount));
          } else {
            nextRoute = ENTRY_WITCH_ROUTE.LOCK_PAGE;
          }
          resolve(nextRoute);
        } else {
          nextRoute = ENTRY_WITCH_ROUTE.WELCOME;
          resolve(nextRoute);
        }
      }
    );
  });
}
async function initNetworkFlag() {
  let localFlag = await extGetLocal(NET_WORK_CHANGE_FLAG);
  if (localFlag) {
    store.dispatch(updateShouldRequest(true));
    await extRemoveLocal(NET_WORK_CHANGE_FLAG);
  }
}

function initZkAppConnect() {
  sendMsg({
    action: POPUP_ACTIONS.INIT_APPROVE_LIST,
  });
}

export const applicationEntry = {
  async run() {
    await languageInit();
    let nextRoute = await initAccountInfo(store);
    this.render();
    if (!nextRoute) {
      nextRoute = ENTRY_WITCH_ROUTE.HOME_PAGE;
    }
    const isWalletInit = nextRoute !== ENTRY_WITCH_ROUTE.WELCOME;
    if (!isWalletInit) {
      store.dispatch(updateEntryWitchRoute(ENTRY_WITCH_ROUTE.WELCOME));
    }
    if (isWalletInit) {
      await this.appInit(store);
      store.dispatch(updateEntryWitchRoute(nextRoute));
      initZkAppConnect();
    }
  },

  async initSandbox() {
    const sandbox = document.getElementById("o1jssandbox");
    if (sandbox) {
      const allowedOrigin = `chrome-extension://${browser.runtime.id}`;
      sandbox.contentWindow.postMessage(
        {
          type: "init-sandbox",
          parentOrigin: allowedOrigin,
        },
        "*"
      );
    }
  },
  async appInit(store) {
    browser.runtime.connect({ name: WALLET_CONNECT_TYPE.WALLET_APP_CONNECT });
    
    // init netRequest
    await getLocalNetConfig(store);

    await initNetworkFlag(store);
    // init nextRoute
    // init Currency
    getLocalCurrencyConfig(store);
    this.initSandbox();
  },

  render() {
    const container = document.getElementById("root");
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <Provider store={store}>
          <PopupMonitor />
          <App />
        </Provider>
      </React.StrictMode>
    );
  },
};

applicationEntry.run();
