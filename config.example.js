import { NET_CONFIG_TYPE } from "./src/constant/walletType"

export const cointypes = {
  name: 'MINA',
  segwitAvailable: true,
  coinType: 12586,
  network: null,
  symbol:'MINA',
  decimals:9
}
/**
 * lock time default is 24 hours
 */
export const LOCK_TIME = 24 * 60  

/**
 * 系统版本
 */
export const VERSION_CONFIG = "v2.0.1"

/**
 * fee等配置信息接口
 */
export const BASE_INFO_URL = ""

/**
 * 默认的语言选项
 */
export const DEFAULT_LANGUAGE = "en"

/**
 * 首页默认的请求条数
 */
export const TX_LIST_LENGTH = 20

const GQL_URL_MAINNET = ""
const TRANSACTION_URL_MAINNET = ""
const EXPLORER_URL_MAINNET = ""

const GQL_URL_TESTNET = ""
const TRANSACTION_URL_TESTNET = ""
const EXPLORER_URL_TESTNET = ""

export const MAIN_NET_BASE_CONFIG={
    netType:NET_CONFIG_TYPE.Mainnet,
    url:GQL_URL_MAINNET,
    txUrl:TRANSACTION_URL_MAINNET,
    explorer:EXPLORER_URL_MAINNET,
}
export const TEST_NET_BASE_CONFIG={
  netType:NET_CONFIG_TYPE.Devnet,
  url:GQL_URL_TESTNET,
  txUrl:TRANSACTION_URL_TESTNET,
  explorer:EXPLORER_URL_TESTNET,
}
export const UNKNOWN_NET_BASE_CONFIG={
  netType:NET_CONFIG_TYPE.Unknown
}

/**
 * current net config version if net change just add 1 
 */
export const NET_CONFIG_VERSION = 1017

export const network_config=[
  {
      id: 1,
      name: "Mainnet",
      ...MAIN_NET_BASE_CONFIG,
    },
    {
      id: 2,
      name: "Devnet",
      ...TEST_NET_BASE_CONFIG
    },
]