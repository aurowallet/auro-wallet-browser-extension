export const cointypes = {
  name: 'MINA',
  segwitAvailable: true,
  coinType: 12586,
  network: null,
  symbol:'MINA',
  decimals:9
}
/**
 * 锁定时间，默认10分钟
 */
export const LOCK_TIME = 120 * 60 * 1000

/**
 * 系统版本
 */
export const VERSION_CONFIG = ""

/**
 * 默认的请求接口
 */
export const GQL_URL = ""


/**
 * fee等配置信息接口
 */
export const BASE_INFO_URL = ""

/**
 * 默认的浏览器接口 
 */
export const EXPLORER_URL = ""


/**
 * 交易记录接口
 */
export const TRANSACTION_URL = ""
/**
 * 默认的语言选项
 */
export const DEFAULT_LANGUAGE = ""

/**
 * 首页默认的请求条数
 */
export const TX_LIST_LENGTH = 20

export const network_config=[
  {
      id: 1,
      name: "Mainnet",
      url:GQL_URL,
      explorer:EXPLORER_URL
    },
]
