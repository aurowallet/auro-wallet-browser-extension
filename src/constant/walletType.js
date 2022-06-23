export const ACCOUNT_TYPE = {
  WALLET_INSIDE: "WALLET_INSIDE",
  WALLET_OUTSIDE: "WALLET_OUTSIDE",
  WALLET_LEDGER: "WALLET_LEDGER",
  WALLET_WATCH: "WALLET_WATCH",
}
/**
 * Type of error
 */
 export const ERROR_TYPE = {
  CanceRequest: "Cancel Request",
};



export const NET_CONFIG_TYPE = {
  Mainnet:"Mainnet",
  Devnet:"Devnet",
  Unknown:"Unknown",
}


export const WALLET_CONNECT_TYPE = {
  WALLET_APP_CONNECT:"WALLET_APP_CONNECT",
  CONTENT_SCRIPT : 'mina-contentscript',
}



/** not support transaction history */
export const NET_CONFIG_NOT_SUPPORT_TX_HISTORY =[
  NET_CONFIG_TYPE.Unknown,
]
/** not support stake   */
export const NET_CONFIG_NOT_SUPPORT_STAKING =[
  NET_CONFIG_TYPE.Unknown,
]
