// ============ Network Config ============

export const NET_WORK_CONFIG_V2 = "NET_WORK_CONFIG_V2";

// ============ Language Config ============

export const LANGUAGE_CONFIG = "LANGUAGE_CONFIG";

// ============ User Agreement ============

export const USER_AGREEMENT = "USER_AGREEMENT";

// ============ Address Book ============

export const ADDRESS_BOOK_CONFIG = "ADDRESS_BOOK_CONFIG";

// ============ Currency Config ============

export const CURRENCY_UNIT_CONFIG = "CURRENCY_UNIT_CONFIG";

// ============ Watch Mode ============

export const WATCH_MODE_TIP_SHOW = "WATCH_MODE_TIP_SHOW";

// ============ Local Base Info ============

export const LOCAL_BASE_INFO = "LOCAL_BASE_INFO";

// ============ Local Cache Keys ============

export const LOCAL_CACHE_KEYS = {
  ACCOUNT_BALANCE: "ACCOUNT_BALANCE",
  COIN_PRICE: "COIN_PRICE_V2",
  BLOCK_INFO: "BLOCK_INFO",
  DAEMON_STATUS: "DAEMON_STATUS",
  DELEGATION_INFO: "DELEGATION_INFO",
  STAKING_LIST: "STAKING_LIST",
  STAKING_APR: "STAKING_APR",
  BASE_TOKEN_ASSETS: "BASE_TOKEN_ASSETS",
  ALL_TX_HISTORY: "ALL_TX_HISTORY",
  ALL_TX_HISTORY_V2: "ALL_TX_HISTORY_V2",
} as const;

export type LocalCacheKey = keyof typeof LOCAL_CACHE_KEYS;

// ============ Stable Account Cache Keys ============

export const STABLE_LOCAL_ACCOUNT_CACHE_KEYS = {
  TOKEN_CONFIG: "TOKEN_CONFIG",
  SHOWED_TOKEN: "SHOWED_TOKEN",
} as const;

// ============ Fee & Scam ============

export const RECOMMEND_FEE = "RECOMMEND_FEE";
export const SCAM_LIST = "SCAM_LIST";

// ============ Network Flags ============

export const NET_WORK_CHANGE_FLAG = "NET_WORK_CHANGE_FLAG";
export const NETWORK_SHOW_TESTNET = "NETWORK_SHOW_TESTNET";

// ============ ZkApp ============

export const ZKAPP_APPROVE_LIST = "ZKAPP_APPROVE_LIST";

// ============ Token ============

export const SUPPORT_TOKEN_LIST = "SUPPORT_TOKEN_LIST";

// ============ Debug ============

export const DEBUG_LOG_STORAGE_KEY = "DEBUG_LOG_ENABLED";

