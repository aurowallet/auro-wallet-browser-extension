import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import browser from 'webextension-polyfill';
import { NET_CONFIG_VERSION } from "../config";
import {
  extGetLocal,
  extRemoveLocal,
  extSaveLocal,
} from "./background/extensionStorage";
import { getLocal, saveLocal } from "./background/localStorage";
import { CURRENCY_UNIT } from "./constant";
import { WALLET_CONNECT_TYPE } from "./constant/commonType";
import { POPUP_ACTIONS, WALLET_GET_CURRENT_ACCOUNT } from "./constant/msgTypes";
import { DefaultMainnetConfig, NetworkConfig } from "./constant/network";
import {
  CURRENCY_UNIT_CONFIG,
  NET_WORK_CHANGE_FLAG,
  NET_WORK_CONFIG_V2,
} from "./constant/storageKey";
import { languageInit } from "./i18n";
import PopupMonitor from "./monitor/PopupMonitor";
import App from "./popup/App";
import { ThemeProvider } from "./popup/style/ThemeProvider";
import { GlobalStyles } from "./popup/style/common";
import {
  initCurrentAccount,
  updateShouldRequest,
} from "./reducers/accountReducer";
import { CurrencyItem, updateCurrencyConfig } from "./reducers/currency";
import {
  ENTRY_WITCH_ROUTE,
  updateEntryWitchRoute,
} from "./reducers/entryRouteReducer";
import { updateCurrentNode, updateCustomNodeList } from "./reducers/network";
import store from "./store/store";
import { sendMsg } from "./utils/commonMsg";

interface NetConfig {
  currentNode: typeof DefaultMainnetConfig;
  customNodeList: NetworkConfig[];
  nodeConfigVersion: string;
}

function getLocalNetConfig(appStore: typeof store): Promise<NetConfig> {
  return new Promise(async (resolve) => {
    const localNetConfig = await extGetLocal(NET_WORK_CONFIG_V2) as NetConfig | null;
    if (!localNetConfig) {
      const config: NetConfig = {
        currentNode: DefaultMainnetConfig,
        customNodeList: [],
        nodeConfigVersion: NET_CONFIG_VERSION,
      };
      appStore.dispatch(updateCurrentNode(config.currentNode));
      await extSaveLocal(NET_WORK_CONFIG_V2, config);
      resolve(config);
    } else {
      appStore.dispatch(updateCurrentNode(localNetConfig.currentNode));
      appStore.dispatch(updateCustomNodeList(localNetConfig.customNodeList));
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
function compareConfig(oldConfig: string | CurrencyItem[], newConfigList: CurrencyItem[]): CurrencyItem[] {
  let isNewListSelect = false;
  let selectKey = "";
  if (Array.isArray(oldConfig)) {
    for (let index = 0; index < oldConfig.length; index++) {
      const config = oldConfig[index];
      if (config?.isSelect) {
        selectKey = config.key;
        break;
      }
    }
  } else {
    selectKey = oldConfig;
  }

  if (selectKey) {
    for (let index = 0; index < newConfigList.length; index++) {
      const newConfig = newConfigList[index];
      if (newConfig?.key === selectKey) {
        newConfig.isSelect = true;
        isNewListSelect = true;
        saveLocal(CURRENCY_UNIT_CONFIG, JSON.stringify(newConfig.key));
        break;
      }
    }
  }
  if (!isNewListSelect && newConfigList[0]) {
    newConfigList[0].isSelect = true;
    saveLocal(CURRENCY_UNIT_CONFIG, JSON.stringify(newConfigList[0].key));
  }
  return newConfigList;
}
function safeJsonParse(data: string): string {
  try {
    return JSON.parse(data);
  } catch (error) {
    return "";
  }
}
function getLocalCurrencyConfig(appStore: typeof store): void {
  const localCurrencyConfig = getLocal(CURRENCY_UNIT_CONFIG);
  if (!localCurrencyConfig) {
    const currencyList: CurrencyItem[] = CURRENCY_UNIT.map(item => ({ ...item }));
    if (currencyList[0]) {
      currencyList[0].isSelect = true;
      appStore.dispatch(updateCurrencyConfig(currencyList));
      saveLocal(CURRENCY_UNIT_CONFIG, JSON.stringify(currencyList[0].key));
    }
  } else {
    const oldConfigKey = safeJsonParse(localCurrencyConfig);
    const currencyList: CurrencyItem[] = CURRENCY_UNIT.map(item => ({ ...item }));
    const list = compareConfig(oldConfigKey, currencyList);
    appStore.dispatch(updateCurrencyConfig(list));
  }
}

interface CurrentAccountResponse {
  localAccount?: { keyringData?: unknown };
  isUnlocked?: boolean;
  address?: string;
  [key: string]: unknown;
}

async function initAccountInfo(appStore: typeof store): Promise<string> {
  return new Promise((resolve) => {
    // Timeout to prevent infinite loading if background script doesn't respond
    const timeoutId = setTimeout(() => {
      resolve(ENTRY_WITCH_ROUTE.WELCOME);
    }, 3000);

    sendMsg(
      {
        action: WALLET_GET_CURRENT_ACCOUNT,
      },
      async (currentAccount: CurrentAccountResponse) => {
        clearTimeout(timeoutId);
        let nextRoute = "";
        // Check if wallet data exists (keyringData indicates encrypted vault exists)
        // Note: address is only available when unlocked
        const hasWalletData = !!currentAccount?.localAccount?.keyringData;
        if (hasWalletData) {
          if (currentAccount.isUnlocked && currentAccount.address) {
            appStore.dispatch(initCurrentAccount(currentAccount));
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
async function initNetworkFlag(): Promise<void> {
  const localFlag = await extGetLocal(NET_WORK_CHANGE_FLAG);
  if (localFlag) {
    store.dispatch(updateShouldRequest(true));
    await extRemoveLocal(NET_WORK_CHANGE_FLAG);
  }
}

function initZkAppConnect(): void {
  sendMsg({
    action: POPUP_ACTIONS.INIT_APPROVE_LIST,
  });
}

export const applicationEntry = {
  async run(): Promise<void> {
    await languageInit();
    let nextRoute: string = await initAccountInfo(store);
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

  async initSandbox(): Promise<void> {
    const sandbox = document.getElementById("o1jssandbox") as HTMLIFrameElement | null;
    if (sandbox?.contentWindow) {
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
  async appInit(appStore: typeof store): Promise<void> {
    browser.runtime.connect({ name: WALLET_CONNECT_TYPE.WALLET_APP_CONNECT });
    
    // init netRequest
    await getLocalNetConfig(appStore);

    await initNetworkFlag();
    // init nextRoute
    // init Currency
    getLocalCurrencyConfig(appStore);
    this.initSandbox();
  },

  render(): void {
    const container = document.getElementById("root");
    if (!container) throw new Error('Root element not found');
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <Provider store={store}>
          <ThemeProvider>
            <GlobalStyles />
            <PopupMonitor />
            <App />
          </ThemeProvider>
        </Provider>
      </React.StrictMode>
    );
  },
};

applicationEntry.run();
