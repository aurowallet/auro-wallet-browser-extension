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
 *  lock time
 */
export const LOCK_TIME = 30 * 60  * 1000

/**
 * fee config interface
 */
export const BASE_INFO_URL = ""

/**
 * default language config
 */
export const DEFAULT_LANGUAGE = "en"

/**
 * default home page tx length
 */
export const TX_LIST_LENGTH = 20

const GQL_URL_MAINNET = ""
const TRANSACTION_URL_MAINNET = ""
const EXPLORER_URL_MAINNET = ""
const TX_GQL_URL_MAINNET = ""

const GQL_URL_DEVNET = ""
const TRANSACTION_URL_DEVNET = ""
const EXPLORER_URL_DEVNET = ""
const TX_GQL_URL_DEVNET = ""

export const MAIN_NET_BASE_CONFIG={
    netType:NET_CONFIG_TYPE.Mainnet,
    url:GQL_URL_MAINNET,
    txUrl:TRANSACTION_URL_MAINNET,
    explorer:EXPLORER_URL_MAINNET,
    gqlTxUrl:TX_GQL_URL_MAINNET
}
export const TEST_NET_BASE_CONFIG={
  netType:NET_CONFIG_TYPE.Devnet,
  url:GQL_URL_DEVNET,
  txUrl:TRANSACTION_URL_DEVNET,
  explorer:EXPLORER_URL_DEVNET,
  gqlTxUrl:TX_GQL_URL_DEVNET
}

export const UNKNOWN_NET_BASE_CONFIG={
  netType:NET_CONFIG_TYPE.Unknown
}

/**
 * current net config version if net change just add 1 
 */
export const NET_CONFIG_VERSION = 1024

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