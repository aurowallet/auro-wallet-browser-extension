import BigNumber from "bignumber.js";
import { MAIN_COIN_CONFIG, ZK_DEFAULT_TOKEN_ID } from "../constant";
import {
  amountDecimals,
  mergeLocalConfigToNetToken,
  txSort,
} from "../utils/utils";

const CHANGE_ACCOUNT_TX_HISTORY = "CHANGE_ACCOUNT_TX_HISTORY";

const UPDATE_CURRENT_ACCOUNT = "UPDATE_CURRENT_ACCOUNT";

const INIT_CURRENT_ACCOUNT = "INIT_CURRENT_ACCOUNT";

const UPDATE_NET_HOME_REFRESH = "UPDATE_NET_HOME_REFRESH";

const UPDATE_STAKING_DATA = "UPDATE_STAKING_DATA";

const UPDATE_ACCOUNT_LIST_BALANCE = "UPDATE_ACCOUNT_LIST_BALANCE";

const UPDATE_SCAM_LIST = "UPDATE_SCAM_LIST";

const UPDATE_TOKEN_ASSETS = "UPDATE_TOKEN_ASSETS";

// token price
const UPDATE_CURRENT_PRICE = "UPDATE_CURRENT_PRICE";

const UPDATE_ACCOUNT_LOCAL_STORAGE = "UPDATE_ACCOUNT_LOCAL_STORAGE";

const UPDATE_LOCAL_TOKEN_CONFIG = "UPDATE_LOCAL_TOKEN_CONFIG";

export function updateLocalTokenConfig(tokenConfig) {
  return {
    type: UPDATE_LOCAL_TOKEN_CONFIG,
    tokenConfig,
  };
}

export function updateAccountLocalStorage() {
  return {
    type: UPDATE_ACCOUNT_LOCAL_STORAGE,
  };
}

export function updateCurrentPrice(tokenPrice, isCachePrice) {
  return {
    type: UPDATE_CURRENT_PRICE,
    tokenPrice,
    isCachePrice,
  };
}

export function updateAccountTx(
  txList,
  txPendingList,
  zkAppList,
  zkPendingList
) {
  return {
    type: CHANGE_ACCOUNT_TX_HISTORY,
    txList,
    txPendingList,
    zkAppList,
    zkPendingList,
  };
}
export function updateCurrentAccount(account) {
  return {
    type: UPDATE_CURRENT_ACCOUNT,
    account,
  };
}

export function initCurrentAccount(account) {
  return {
    type: INIT_CURRENT_ACCOUNT,
    account,
  };
}

export function updateShouldRequest(shouldRefresh, isSilent) {
  return {
    type: UPDATE_NET_HOME_REFRESH,
    shouldRefresh,
    isSilent,
  };
}

export function updateStakingRefresh(shouldRefresh) {
  return {
    type: UPDATE_STAKING_DATA,
    shouldRefresh,
  };
}

export function updateAccountList(list) {
  return {
    type: UPDATE_ACCOUNT_LIST_BALANCE,
    list,
  };
}

export function updateScamList(scamList) {
  return {
    type: UPDATE_SCAM_LIST,
    scamList: scamList,
  };
}
export function updateTokenAssets(tokenList, isCache) {
  return {
    type: UPDATE_TOKEN_ASSETS,
    tokenList,
    isCache,
  };
}

export const ACCOUNT_BALANCE_CACHE_STATE = {
  INIT_STATE: "INIT_STATE",
  USING_CACHE: "USING_CACHE",
  NEW_STATE: "NEW_STATE",
};

const defaultMinaAssets = {
  balance: {
    total: "0",
    liquid: "0",
  },
  inferredNonce: 0,
  delegateAccount: null,
  tokenId: ZK_DEFAULT_TOKEN_ID,
  publicKey: "",
  tokenNetInfo: null,
  tokenBaseInfo: {
    isScam: false,
    decimals: MAIN_COIN_CONFIG.decimals,
    isMainToken: true,
    showBalance: "0",
    showAmount: "0",
  },
  localConfig: {
    hideToken: false,
  },
};

const initState = {
  txList: [],
  currentAccount: {},
  shouldRefresh: true,
  isSilentRefresh: false,
  isAccountCache: ACCOUNT_BALANCE_CACHE_STATE.INIT_STATE,
  stakingLoadingRefresh: false,
  accountBalanceMap: {},
  scamList: [],
  tokenList: [defaultMinaAssets],
  mainTokenNetInfo: {},
  tokenShowList: [defaultMinaAssets],
  tokenPrice: {},
  tokenTotalAmount: "0",
  shouldUpdateAccountStorage: false,
  localTokenConfig: {},
};

function compareTokens(a, b) {
  const amountA = a.tokenBaseInfo.showAmount
    ? parseFloat(a.tokenBaseInfo.showAmount)
    : null;
  const amountB = b.tokenBaseInfo.showAmount
    ? parseFloat(b.tokenBaseInfo.showAmount)
    : null;

  if (amountA !== null && amountB !== null) {
    if (amountA > amountB) {
      return -1;
    } else if (amountA < amountB) {
      return 1;
    }
  } else if (amountA !== null) {
    return -1;
  } else if (amountB !== null) {
    return 1;
  }

  const balanceA = parseFloat(a.tokenBaseInfo.showBalance);
  const balanceB = parseFloat(b.tokenBaseInfo.showBalance);

  if (balanceA > balanceB) {
    return -1;
  } else if (balanceA < balanceB) {
    return 1;
  } else {
    const symbolA = a.tokenNetInfo?.tokenSymbol || "";
    const symbolB = b.tokenNetInfo?.tokenSymbol || "";
    return symbolA.localeCompare(symbolB);
  }
}

function processTokenList(tokenAssetsList, prices) {
  const sourceTokenList = tokenAssetsList || initialTokenList;
  let totalShowAmount = 0;
  const nextTokenList = sourceTokenList.map((tokenItem) => {
    const tempToken = {
      ...tokenItem,
      tokenBaseInfo: { ...tokenItem.tokenBaseInfo },
    };
    const tokenBaseInfo = tempToken.tokenBaseInfo;

    tokenBaseInfo.isScam = false;
    let decimals = 1;
    if (tokenItem.tokenNetInfo?.publicKey) {
      const zkappState = tokenItem.tokenNetInfo.zkappState || [];
      if (Array.isArray(zkappState)) {
        decimals = zkappState[0] || 1;
      }
      tokenBaseInfo.decimals = decimals;
      tokenBaseInfo.showBalance = amountDecimals(
        tokenItem.balance.total,
        decimals
      );
    } else {
      if (tokenItem.tokenId === ZK_DEFAULT_TOKEN_ID) {
        tokenBaseInfo.isMainToken = true;
        const delegateAccount = tokenItem.delegateAccount?.publicKey;
        tokenBaseInfo.isDelegation = delegateAccount == tokenItem.publicKey;
        tokenBaseInfo.decimals = MAIN_COIN_CONFIG.decimals;
        tokenBaseInfo.showBalance = amountDecimals(
          tokenItem.balance.total,
          tokenBaseInfo.decimals
        );
      } else {
        tokenBaseInfo.decimals = decimals;
        tokenBaseInfo.showBalance = amountDecimals(
          tokenItem.balance.total,
          decimals
        );
      }
    }

    const tokenPrice = prices[tokenItem.tokenId];
    if (tokenPrice) {
      tokenBaseInfo.showAmount = new BigNumber(tokenBaseInfo.showBalance)
        .multipliedBy(tokenPrice)
        .toString();
      if (!tokenItem.localConfig?.hideToken) {
        totalShowAmount = new BigNumber(totalShowAmount)
          .plus(tokenBaseInfo.showAmount)
          .toString();
      }
    }

    return tempToken;
  });

  nextTokenList.sort(compareTokens);

  const defaultTokenIndex = nextTokenList.findIndex(
    (token) => token.tokenId === ZK_DEFAULT_TOKEN_ID
  );

  let mainTokenNetInfo = defaultMinaAssets.tokenNetInfo;
  if (defaultTokenIndex !== -1) {
    const [defaultToken] = nextTokenList.splice(defaultTokenIndex, 1);
    nextTokenList.unshift(defaultToken);
    mainTokenNetInfo = defaultToken;
  } else {
    nextTokenList.unshift(defaultMinaAssets);
  }

  const tokenShowList = nextTokenList.filter(
    (tokenItem) => !tokenItem.localConfig?.hideToken
  );
  return {
    tokenList: nextTokenList,
    tokenTotalAmount: totalShowAmount,
    tokenShowList,
    mainTokenNetInfo,
  };
}
function processTokenShowStatus(tokenAssetsList, tokenConfig) {
  let tokenShowList = [];
  let totalShowAmount = 0;

  const nextTokenList = tokenAssetsList.map((tokenItem) => {
    let tokenId = tokenItem.tokenId;
    if (tokenConfig[tokenId]) {
      let tempLocalConfig = tokenConfig[tokenId];
      if (!tempLocalConfig?.hideToken) {
        tokenShowList.push(tokenItem);
        let tokenAmount = tokenItem.tokenBaseInfo.showAmount ?? 0;
        totalShowAmount = new BigNumber(totalShowAmount)
          .plus(tokenAmount)
          .toString();
      }
      return {
        ...tokenItem,
        localConfig: tempLocalConfig,
      };
    } else {
      tokenShowList.push(tokenItem);
      let tokenAmount = tokenItem.tokenBaseInfo.showAmount ?? 0;
      totalShowAmount = new BigNumber(totalShowAmount)
        .plus(tokenAmount)
        .toString();
      return tokenItem;
    }
  });
  return { tokenList: nextTokenList, tokenShowList, totalShowAmount };
}

function pendingTx(txList) {
  let newList = [];
  for (let index = 0; index < txList.length; index++) {
    const detail = txList[index];
    newList.push({
      id: detail.id,
      hash: detail.hash,
      kind: detail.kind,
      dateTime: detail.time,
      from: detail.from,
      to: detail.to,
      amount: detail.amount,
      fee: detail.fee,
      nonce: detail.nonce,
      memo: detail.memo,
      status: "PENDING",
      timestamp: new Date(detail.time).getTime(),
    });
  }
  return newList;
}

function getZkOtherAccount(zkApp) {
  let accountUpdates = zkApp.zkappCommand.accountUpdates;
  if (Array.isArray(accountUpdates) && accountUpdates.length > 0) {
    return accountUpdates[0]?.body?.publicKey;
  }
  return "";
}
function zkAppFormat(zkAppList, isPending = false) {
  let newList = [];
  for (let index = 0; index < zkAppList.length; index++) {
    const zkApp = zkAppList[index];
    let isFailed =
      Array.isArray(zkApp.failureReason) && zkApp.failureReason.length > 0;
    let status = isPending ? "PENDING" : isFailed ? "failed" : "applied";
    newList.push({
      id: "",
      hash: zkApp.hash,
      kind: "zkApp",
      dateTime: zkApp.dateTime || "",
      from: zkApp.zkappCommand.feePayer.body.publicKey,
      to: getZkOtherAccount(zkApp),
      amount: "0",
      fee: zkApp.zkappCommand.feePayer.body.fee,
      nonce: zkApp.zkappCommand.feePayer.body.nonce,
      memo: zkApp.zkappCommand.memo,
      status: status,
      type: "zkApp",
      body: zkApp,
      timestamp: isPending ? "" : new Date(zkApp.dateTime).getTime(),
      failureReason: isFailed ? zkApp.failureReason : "",
    });
  }
  return newList;
}
function commonHistoryFormat(list) {
  return list.map((item) => {
    item.timestamp = new Date(item.dateTime).getTime();
    return item;
  });
}

function matchScamAndTxList(scamList, txList) {
  let nextTxList = txList.map((txData) => {
    const nextTxData = { ...txData };
    if (nextTxData.from) {
      const address = nextTxData.from.toLowerCase();
      const scamInfo = scamList.filter((scam) => {
        return scam.address === address;
      });
      nextTxData.isFromAddressScam = scamInfo.length > 0;
    }
    return nextTxData;
  });
  return nextTxList;
}

const accountInfo = (state = initState, action) => {
  switch (action.type) {
    case CHANGE_ACCOUNT_TX_HISTORY:
      let txList = action.txList;
      let txPendingList = action.txPendingList || [];
      let zkAppList = action.zkAppList || [];
      let zkPendingList = action.zkPendingList || [];

      txPendingList = txPendingList.reverse();
      txPendingList = pendingTx(txPendingList);
      zkAppList = zkAppFormat(zkAppList);
      zkPendingList = zkAppFormat(zkPendingList, true);

      txList = commonHistoryFormat(txList);

      const commonList = [...txList, ...zkAppList];
      commonList.sort(txSort);

      const commonPendingList = [...txPendingList, ...zkPendingList];
      commonPendingList.sort((a, b) => b.nonce - a.nonce);
      if (commonPendingList.length > 0) {
        commonPendingList[commonPendingList.length - 1].showSpeedUp = true;
      }
      let newList = [...commonPendingList, ...commonList];
      if (newList.length > 0) {
        newList.push({
          showExplorer: true,
        });
      }
      if (state.scamList.length > 0) {
        newList = matchScamAndTxList(state.scamList, newList);
      }
      return {
        ...state,
        txList: newList,
        isSilentRefresh: false,
      };
    case UPDATE_CURRENT_ACCOUNT:
      let account = action.account;
      return {
        ...state,
        currentAccount: account,
        txList: [],
        shouldRefresh: true,

        tokenList: [defaultMinaAssets],
        mainTokenNetInfo: {},
        tokenShowList: [defaultMinaAssets],
        tokenPrice: {},
        tokenTotalAmount: "0",
      };
    case INIT_CURRENT_ACCOUNT:
      return {
        ...state,
        currentAccount: action.account,
      };
    case UPDATE_NET_HOME_REFRESH:
      let isSilent = action.isSilent;
      let shouldRefresh = action.shouldRefresh;
      if (isSilent) {
        return {
          ...state,
          shouldRefresh: shouldRefresh,
          isSilentRefresh: true,
        };
      }
      let newState = {};
      if (shouldRefresh) {
        newState = {
          txList: [],
          tokenList: [defaultMinaAssets],
          mainTokenNetInfo: {},
          tokenShowList: [defaultMinaAssets],
          tokenPrice: {},
          tokenTotalAmount: "0",
        };
      }
      return {
        ...state,
        shouldRefresh: shouldRefresh,
        isSilentRefresh: false,
        ...newState,
      };
    case UPDATE_STAKING_DATA:
      return {
        ...state,
        stakingLoadingRefresh: action.shouldRefresh,
      };
    case UPDATE_ACCOUNT_LIST_BALANCE:
      return {
        ...state,
        accountBalanceMap: action.list,
      };
    case UPDATE_SCAM_LIST:
      const nextScamList = action.scamList.map((scamData) => {
        return {
          ...scamData,
          address: scamData.address.toLowerCase(),
        };
      });

      if (state.txList.length > 0) {
        const newList = matchScamAndTxList(nextScamList, state.txList);
        return {
          ...state,
          scamList: nextScamList,
          txList: newList,
        };
      }
      return {
        ...state,
        scamList: nextScamList,
      };
    case UPDATE_TOKEN_ASSETS:
      const nextList = action.isCache
        ? action.tokenList
        : mergeLocalConfigToNetToken(action.tokenList, state.tokenList);
      const result = processTokenList(nextList, state.tokenPrice);
      return {
        ...state,
        tokenList: result.tokenList,
        tokenTotalAmount: result.tokenTotalAmount,
        tokenShowList: result.tokenShowList,
        mainTokenNetInfo: result.mainTokenNetInfo,
        shouldUpdateAccountStorage: !action.isCache,
      };
    case UPDATE_CURRENT_PRICE:
      const priceUpdate = processTokenList(state.tokenList, action.tokenPrice);
      let isAccountCache;
      let cacheState = state.isAccountCache;
      if (
        action.isCachePrice &&
        cacheState !== ACCOUNT_BALANCE_CACHE_STATE.NEW_STATE
      ) {
        isAccountCache = ACCOUNT_BALANCE_CACHE_STATE.USING_CACHE;
      } else {
        isAccountCache = ACCOUNT_BALANCE_CACHE_STATE.NEW_STATE;
      }
      return {
        ...state,
        tokenPrice: action.tokenPrice,
        isAccountCache: isAccountCache,
        tokenList: priceUpdate.tokenList,
        tokenTotalAmount: priceUpdate.tokenTotalAmount,
        tokenShowList: priceUpdate.tokenShowList,
        shouldUpdateAccountStorage: !action.isCache,
      };
    case UPDATE_ACCOUNT_LOCAL_STORAGE:
      return {
        ...state,
        shouldUpdateAccountStorage: false,
      };
    case UPDATE_LOCAL_TOKEN_CONFIG:
      const statusUpdate = processTokenShowStatus(
        state.tokenList,
        action.tokenConfig
      );
      return {
        ...state,
        localTokenConfig: action.tokenConfig,
        tokenList: statusUpdate.tokenList,
        tokenShowList: statusUpdate.tokenShowList,
        tokenTotalAmount: statusUpdate.totalShowAmount,
        shouldUpdateAccountStorage: true,
      };
    default:
      return state;
  }
};

export default accountInfo;
