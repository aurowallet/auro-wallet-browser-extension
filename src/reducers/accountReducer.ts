/**
 * Account Reducer
 */

import {
  formatAllTxHistory,
  processNewTokenStatus,
  processTokenList,
  processTokenShowStatus,
  setScamAndTxList,
  TokenItem,
  FormattedTx,
  TokenConfig,
  TxHistoryAction,
} from "@/utils/reducer";
import { mergeLocalConfigToNetToken } from "../utils/utils";

// ============ Action Types ============

const CHANGE_ACCOUNT_TX_HISTORY_V2 = "CHANGE_ACCOUNT_TX_HISTORY_V2";
const UPDATE_CURRENT_ACCOUNT = "UPDATE_CURRENT_ACCOUNT";
const INIT_CURRENT_ACCOUNT = "INIT_CURRENT_ACCOUNT";
const UPDATE_NET_HOME_REFRESH = "UPDATE_NET_HOME_REFRESH";
const UPDATE_STAKING_DATA = "UPDATE_STAKING_DATA";
const UPDATE_ACCOUNT_LIST_BALANCE = "UPDATE_ACCOUNT_LIST_BALANCE";
const UPDATE_SCAM_LIST = "UPDATE_SCAM_LIST";
const UPDATE_TOKEN_ASSETS = "UPDATE_TOKEN_ASSETS";
const UPDATE_CURRENT_PRICE = "UPDATE_CURRENT_PRICE";
const UPDATE_LOCAL_TOKEN_CONFIG = "UPDATE_LOCAL_TOKEN_CONFIG";
const UPDATE_LOCAL_SHOWED_TOKEN_IDS = "UPDATE_LOCAL_SHOWED_TOKEN_IDS";
const UPDATE_SUPPORT_TOKEN_LIST = "UPDATE_SUPPORT_TOKEN_LIST";

// ============ Interfaces ============

export interface TokenInfo {
  tokenId: string;
  tokenSymbol?: string;
  balance?: string;
  showBalance?: string;
  tokenAddress?: string;
  decimals?: number;
  localConfig?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ScamData {
  address: string;
  [key: string]: unknown;
}

export interface AccountData {
  address?: string;
  publicKey?: string;
  accountName?: string;
  type?: string;
  [key: string]: unknown;
}

export interface TxHistoryItem {
  hash?: string;
  type?: string;
  status?: string;
  [key: string]: unknown;
}

export interface TokenPrice {
  [tokenId: string]: number | string;
}

export const ACCOUNT_BALANCE_CACHE_STATE = {
  INIT_STATE: "INIT_STATE",
  USING_CACHE: "USING_CACHE",
  NEW_STATE: "NEW_STATE",
} as const;

export type AccountBalanceCacheState =
  (typeof ACCOUNT_BALANCE_CACHE_STATE)[keyof typeof ACCOUNT_BALANCE_CACHE_STATE];

export interface AccountInfoState {
  txList: FormattedTx[];
  txHistoryMap: Record<string, FormattedTx[]>;
  currentAccount: AccountData;
  shouldRefresh: boolean;
  isSilentRefresh: boolean;
  isAccountCache: AccountBalanceCacheState;
  stakingLoadingRefresh: boolean;
  accountBalanceMap: Record<string, unknown>;
  scamList: ScamData[];
  tokenList: TokenItem[];
  mainTokenNetInfo: TokenItem | undefined;
  tokenShowList: TokenItem[];
  tokenPrice: TokenPrice;
  tokenTotalAmount: string | number;
  localTokenConfig: TokenConfig;
  localShowedTokenIds: string[];
  newTokenCount: number | string;
  supportTokenList: TokenItem[];
}

// ============ Action Interfaces ============

interface ChangeAccountTxHistoryV2Action extends TxHistoryAction {
  type: typeof CHANGE_ACCOUNT_TX_HISTORY_V2;
}

interface UpdateCurrentAccountAction {
  type: typeof UPDATE_CURRENT_ACCOUNT;
  account: AccountData;
}

interface InitCurrentAccountAction {
  type: typeof INIT_CURRENT_ACCOUNT;
  account: AccountData;
}

interface UpdateNetHomeRefreshAction {
  type: typeof UPDATE_NET_HOME_REFRESH;
  shouldRefresh: boolean;
  isSilent?: boolean;
}

interface UpdateStakingDataAction {
  type: typeof UPDATE_STAKING_DATA;
  shouldRefresh: boolean;
}

interface UpdateAccountListBalanceAction {
  type: typeof UPDATE_ACCOUNT_LIST_BALANCE;
  list: Record<string, unknown>;
}

interface UpdateScamListAction {
  type: typeof UPDATE_SCAM_LIST;
  scamList: ScamData[];
}

interface UpdateTokenAssetsAction {
  type: typeof UPDATE_TOKEN_ASSETS;
  tokenList: TokenInfo[];
  isCache?: boolean;
}

interface UpdateCurrentPriceAction {
  type: typeof UPDATE_CURRENT_PRICE;
  tokenPrice: TokenPrice;
  isCachePrice: boolean;
}

interface UpdateLocalTokenConfigAction {
  type: typeof UPDATE_LOCAL_TOKEN_CONFIG;
  tokenConfig: TokenConfig;
  tokenId: string;
}

interface UpdateLocalShowedTokenIdsAction {
  type: typeof UPDATE_LOCAL_SHOWED_TOKEN_IDS;
  tokenIds: string[];
}

interface UpdateSupportTokenListAction {
  type: typeof UPDATE_SUPPORT_TOKEN_LIST;
  tokens: TokenItem[];
}

type AccountAction =
  | ChangeAccountTxHistoryV2Action
  | UpdateCurrentAccountAction
  | InitCurrentAccountAction
  | UpdateNetHomeRefreshAction
  | UpdateStakingDataAction
  | UpdateAccountListBalanceAction
  | UpdateScamListAction
  | UpdateTokenAssetsAction
  | UpdateCurrentPriceAction
  | UpdateLocalTokenConfigAction
  | UpdateLocalShowedTokenIdsAction
  | UpdateSupportTokenListAction;

// ============ Action Creators ============

export function updateSupportTokenList(tokens: TokenItem[]) {
  return { type: UPDATE_SUPPORT_TOKEN_LIST, tokens };
}

export function updateLocalShowedTokenId(tokenIds: string[]) {
  return { type: UPDATE_LOCAL_SHOWED_TOKEN_IDS, tokenIds };
}

export function updateLocalTokenConfig(
  tokenConfig: Record<string, unknown>,
  tokenId: string
) {
  return { type: UPDATE_LOCAL_TOKEN_CONFIG, tokenConfig, tokenId };
}

export function updateCurrentPrice(tokenPrice: TokenPrice, isCachePrice: boolean) {
  return { type: UPDATE_CURRENT_PRICE, tokenPrice, isCachePrice };
}

export function updateAccountTxV2(
  {
    txPendingList,
    zkPendingList,
    fullTxList,
  }: {
    txPendingList: FormattedTx[];
    zkPendingList: FormattedTx[];
    fullTxList: FormattedTx[];
  },
  tokenId: string
) {
  return {
    type: CHANGE_ACCOUNT_TX_HISTORY_V2,
    txPendingList,
    zkPendingList,
    fullTxList,
    tokenId,
  };
}

export function updateCurrentAccount(account: AccountData) {
  return { type: UPDATE_CURRENT_ACCOUNT, account };
}

export function initCurrentAccount(account: AccountData) {
  return { type: INIT_CURRENT_ACCOUNT, account };
}

export function updateShouldRequest(shouldRefresh: boolean, isSilent?: boolean) {
  return { type: UPDATE_NET_HOME_REFRESH, shouldRefresh, isSilent };
}

export function updateStakingRefresh(shouldRefresh: boolean) {
  return { type: UPDATE_STAKING_DATA, shouldRefresh };
}

export function updateAccountList(list: Record<string, unknown>) {
  return { type: UPDATE_ACCOUNT_LIST_BALANCE, list };
}

export function updateScamList(scamList: ScamData[]) {
  return { type: UPDATE_SCAM_LIST, scamList };
}

export function updateTokenAssets(tokenList: TokenInfo[], isCache?: boolean) {
  return { type: UPDATE_TOKEN_ASSETS, tokenList, isCache };
}

// ============ Initial State ============

const initState: AccountInfoState = {
  txList: [],
  txHistoryMap: {},
  currentAccount: {},
  shouldRefresh: true,
  isSilentRefresh: false,
  isAccountCache: ACCOUNT_BALANCE_CACHE_STATE.INIT_STATE,
  stakingLoadingRefresh: false,
  accountBalanceMap: {},
  scamList: [],
  tokenList: [],
  mainTokenNetInfo: undefined,
  tokenShowList: [],
  tokenPrice: {},
  tokenTotalAmount: "0",
  localTokenConfig: {},
  localShowedTokenIds: [],
  newTokenCount: 0,
  supportTokenList: [],
};

// ============ Reducer ============

const accountInfo = (state: AccountInfoState = initState, action: AccountAction): AccountInfoState => {
  switch (action.type) {
    case CHANGE_ACCOUNT_TX_HISTORY_V2:
      const tokenId = action.tokenId || '';
      let newList = formatAllTxHistory(action);
      if (state.scamList.length > 0) {
        newList = setScamAndTxList(state.scamList, newList);
      }
      const newTxHistoryMap = {
        ...state.txHistoryMap,
        [tokenId]: newList,
      };
      return { ...state, txHistoryMap: newTxHistoryMap, isSilentRefresh: false };

    case UPDATE_CURRENT_ACCOUNT:
      return {
        ...state,
        currentAccount: action.account,
        txHistoryMap: {},
        shouldRefresh: true,
        tokenList: [],
        mainTokenNetInfo: undefined,
        tokenShowList: [],
        tokenPrice: {},
        tokenTotalAmount: "0",
        localTokenConfig: {},
        newTokenCount: 0,
      };

    case INIT_CURRENT_ACCOUNT:
      return { ...state, currentAccount: action.account };

    case UPDATE_NET_HOME_REFRESH:
      const isSilent = action.isSilent;
      const shouldRefresh = action.shouldRefresh;
      if (isSilent) {
        return { ...state, shouldRefresh, isSilentRefresh: true };
      }
      let newState: Partial<AccountInfoState> = {};
      if (shouldRefresh) {
        newState = {
          txHistoryMap: {},
          tokenList: [],
          mainTokenNetInfo: undefined,
          tokenShowList: [],
          tokenPrice: {},
          tokenTotalAmount: "0",
          supportTokenList: [],
          localTokenConfig: {},
          newTokenCount: 0,
        };
      }
      return { ...state, shouldRefresh, isSilentRefresh: false, ...newState };

    case UPDATE_STAKING_DATA:
      return { ...state, stakingLoadingRefresh: action.shouldRefresh };

    case UPDATE_ACCOUNT_LIST_BALANCE:
      return { ...state, accountBalanceMap: action.list };

    case UPDATE_SCAM_LIST:
      const nextScamList = action.scamList.map((scamData: ScamData) => ({
        ...scamData,
        address: scamData.address.toLowerCase(),
      }));
      const allTxMap = state.txHistoryMap;
      const tokenIdList = Object.keys(allTxMap);
      if (tokenIdList.length > 0) {
        let newTxMap: Record<string, FormattedTx[]> = {};
        for (let index = 0; index < tokenIdList.length; index++) {
          const tid = tokenIdList[index];
          if (tid) {
            newTxMap[tid] = setScamAndTxList(nextScamList, allTxMap[tid] || []);
          }
        }
        return { ...state, scamList: nextScamList, txHistoryMap: newTxMap };
      }
      return { ...state, scamList: nextScamList };

    case UPDATE_TOKEN_ASSETS:
      const nextList = action.isCache
        ? action.tokenList
        : mergeLocalConfigToNetToken(action.tokenList as unknown as Parameters<typeof mergeLocalConfigToNetToken>[0], state.tokenList as unknown as Parameters<typeof mergeLocalConfigToNetToken>[1]);
      const result = processTokenList(
        state.supportTokenList,
        nextList as unknown as TokenItem[],
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
      let isAccountCache: AccountBalanceCacheState;
      const cacheState = state.isAccountCache;
      if (
        action.isCachePrice &&
        cacheState !== ACCOUNT_BALANCE_CACHE_STATE.NEW_STATE
      ) {
        isAccountCache = ACCOUNT_BALANCE_CACHE_STATE.USING_CACHE;
      } else {
        isAccountCache = ACCOUNT_BALANCE_CACHE_STATE.NEW_STATE;
      }
      if (state.tokenList.length === 0) {
        return { ...state, tokenPrice: action.tokenPrice, isAccountCache };
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
        isAccountCache,
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
      const tokenShowedUpdate = processNewTokenStatus(
        state.tokenList,
        action.tokenIds
      );
      return {
        ...state,
        localShowedTokenIds: action.tokenIds,
        newTokenCount: tokenShowedUpdate.newTokenCount,
        tokenList: tokenShowedUpdate.tokenList,
        tokenShowList: tokenShowedUpdate.tokenShowList,
        mainTokenNetInfo: tokenShowedUpdate.mainTokenNetInfo,
      };

    case UPDATE_SUPPORT_TOKEN_LIST:
      return { ...state, supportTokenList: action.tokens };

    default:
      return state;
  }
};

export default accountInfo;
