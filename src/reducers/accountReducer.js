import { formatAllTxHistory, processNewTokenStatus, processTokenList, processTokenShowStatus, setScamAndTxList } from "@/utils/reducer";
import {
  mergeLocalConfigToNetToken
} from "../utils/utils";

const CHANGE_ACCOUNT_TX_HISTORY_V2 = "CHANGE_ACCOUNT_TX_HISTORY_V2";

const UPDATE_CURRENT_ACCOUNT = "UPDATE_CURRENT_ACCOUNT";

const INIT_CURRENT_ACCOUNT = "INIT_CURRENT_ACCOUNT";

const UPDATE_NET_HOME_REFRESH = "UPDATE_NET_HOME_REFRESH";

const UPDATE_STAKING_DATA = "UPDATE_STAKING_DATA";

const UPDATE_ACCOUNT_LIST_BALANCE = "UPDATE_ACCOUNT_LIST_BALANCE";

const UPDATE_SCAM_LIST = "UPDATE_SCAM_LIST";

const UPDATE_TOKEN_ASSETS = "UPDATE_TOKEN_ASSETS";

// token price
const UPDATE_CURRENT_PRICE = "UPDATE_CURRENT_PRICE";


const UPDATE_LOCAL_TOKEN_CONFIG = "UPDATE_LOCAL_TOKEN_CONFIG";

const UPDATE_LOCAL_SHOWED_TOKEN_IDS = "UPDATE_LOCAL_SHOWED_TOKEN_IDS";

const UPDATE_SUPPORT_TOKEN_LIST = "UPDATE_SUPPORT_TOKEN_LIST";

export function updateSupportTokenList(tokens) {
  return {
    type: UPDATE_SUPPORT_TOKEN_LIST,
    tokens,
  };
}

export function updateLocalShowedTokenId(tokenIds) {
  return {
    type: UPDATE_LOCAL_SHOWED_TOKEN_IDS,
    tokenIds,
  };
}

export function updateLocalTokenConfig(tokenConfig,tokenId) {
  return {
    type: UPDATE_LOCAL_TOKEN_CONFIG,
    tokenConfig,
    tokenId
  };
}

export function updateCurrentPrice(tokenPrice, isCachePrice) {
  return {
    type: UPDATE_CURRENT_PRICE,
    tokenPrice,
    isCachePrice,
  };
}

export function updateAccountTxV2({
  txList,
  txPendingList,
  zkAppList,
  zkPendingList
},tokenId,
) {
  return {
    type: CHANGE_ACCOUNT_TX_HISTORY_V2,
    txList,
    txPendingList,
    zkAppList,
    zkPendingList,
    tokenId,
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



const initState = {
  txList: [],
  txHistoryMap:{},
  currentAccount: {},
  shouldRefresh: true,
  isSilentRefresh: false,
  isAccountCache: ACCOUNT_BALANCE_CACHE_STATE.INIT_STATE,
  stakingLoadingRefresh: false,
  accountBalanceMap: {},
  scamList: [],
  tokenList: [],
  mainTokenNetInfo: {},
  tokenShowList: [],
  tokenPrice: {},
  tokenTotalAmount: "0",
  localTokenConfig: {},
  localShowedTokenIds: [],
  newTokenCount: 0,
  supportTokenList:[]
};

const accountInfo = (state = initState, action) => {
  switch (action.type) {
    case CHANGE_ACCOUNT_TX_HISTORY_V2:
      let tokenId = action.tokenId
      let newList = formatAllTxHistory(action);
      if (state.scamList.length > 0) {
        newList = setScamAndTxList(state.scamList, newList);
      }

      let newTxHistoryMap = {
        ...state.txHistoryMap,
        [tokenId]:newList
      } 
      return {
        ...state,
        txHistoryMap:newTxHistoryMap,
        isSilentRefresh: false,
      };
    case UPDATE_CURRENT_ACCOUNT:
      let account = action.account;
      return {
        ...state,
        currentAccount: account,
        txHistoryMap: {},
        shouldRefresh: true,

        tokenList: [],
        mainTokenNetInfo: {},
        tokenShowList: [],
        tokenPrice: {},
        tokenTotalAmount: "0",
        localTokenConfig:{},
        newTokenCount:0
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
          txHistoryMap: {},
          tokenList: [],
          mainTokenNetInfo: {},
          tokenShowList: [],
          tokenPrice: {},
          tokenTotalAmount: "0",
          supportTokenList:[],
          localTokenConfig:{},
          newTokenCount:0
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
      const allTxMap =  state.txHistoryMap;
      const tokenIdList = Object.keys(allTxMap)
      if(tokenIdList.length>0){
        let newTxMap = {}
        for (let index = 0; index < tokenIdList.length; index++) {
          const tokenId = tokenIdList[index];
          newTxMap = {
            ...newTxMap,
            [tokenId]:setScamAndTxList(nextScamList, allTxMap[tokenId])
          }
        }
        return {
          ...state,
          scamList: nextScamList,
          txHistoryMap: newTxMap,
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
      const result = processTokenList(
        state.supportTokenList,
        nextList,
        state.tokenPrice,
        state.localShowedTokenIds,
        state.localTokenConfig
      );
      return {
        ...state,
        tokenList: result.tokenList,
        tokenTotalAmount: result.tokenTotalAmount,
        tokenShowList: result.tokenShowList,
        mainTokenNetInfo: result.mainTokenNetInfo,
        newTokenCount: result.newTokenCount,
      };
    case UPDATE_CURRENT_PRICE:
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

      if (state.tokenList.length == 0) {
        return {
          ...state,
          tokenPrice: action.tokenPrice,
          isAccountCache: isAccountCache,
        };
      }
      const priceUpdate = processTokenList(
        state.supportTokenList,
        state.tokenList,
        action.tokenPrice,
        state.localShowedTokenIds,
        state.localTokenConfig
      );
      return {
        ...state,
        tokenPrice: action.tokenPrice,
        isAccountCache: isAccountCache,
        tokenList: priceUpdate.tokenList,
        tokenTotalAmount: priceUpdate.tokenTotalAmount,
        tokenShowList: priceUpdate.tokenShowList,
      };
    case UPDATE_LOCAL_TOKEN_CONFIG:
      const statusUpdate = processTokenShowStatus(
        state.tokenList,
        action.tokenConfig,
        action.tokenId
      );
      return {
        ...state,
        localTokenConfig: action.tokenConfig,
        tokenList: statusUpdate.tokenList,
        tokenShowList: statusUpdate.tokenShowList,
        tokenTotalAmount: statusUpdate.totalShowAmount,
      };
    case UPDATE_LOCAL_SHOWED_TOKEN_IDS:
      const tokenShowedUpdate = processNewTokenStatus(state.tokenList,action.tokenIds);
      return {
        ...state,
        localShowedTokenIds: action.tokenIds, 
        newTokenCount: tokenShowedUpdate.newTokenCount,
        tokenList: tokenShowedUpdate.tokenList,
        tokenShowList: tokenShowedUpdate.tokenShowList,
        mainTokenNetInfo: tokenShowedUpdate.mainTokenNetInfo,
      };
    case UPDATE_SUPPORT_TOKEN_LIST:
      return {
        ...state,
        supportTokenList:action.tokens
      };
    default:
      return state;
  }
};

export default accountInfo;
