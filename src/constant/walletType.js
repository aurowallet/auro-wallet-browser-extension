import { Berkeley_NET_BASE_CONFIG, MAIN_NET_BASE_CONFIG, TEST_NET_BASE_CONFIG, Testworld2_NET_BASE_CONFIG } from "../../config";

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
  Berkeley:"Berkeley",
  Testworld2:"Testworld2",
  Unknown:"Unknown",
}

export const NET_CONFIG_LIST = {
  [NET_CONFIG_TYPE.Mainnet]:{
    type_id:"0",
    config:{...MAIN_NET_BASE_CONFIG}
  },
  [NET_CONFIG_TYPE.Devnet]:{
    type_id:"1",
    config:{...TEST_NET_BASE_CONFIG}
  },
  [NET_CONFIG_TYPE.Berkeley]:{
    type_id:"11",
    config:{...Berkeley_NET_BASE_CONFIG}
  },
  [NET_CONFIG_TYPE.Testworld2]:{
    type_id:"12",
    config:{...Testworld2_NET_BASE_CONFIG}
  },
}

export const WALLET_CONNECT_TYPE = {
  WALLET_APP_CONNECT:"WALLET_APP_CONNECT",
  CONTENT_SCRIPT : 'mina-contentscript',
}



/** not support transaction history */
export const NET_CONFIG_NOT_SUPPORT_TX_HISTORY =[
  NET_CONFIG_TYPE.Unknown,
  NET_CONFIG_TYPE.Testworld2,
  // NET_CONFIG_TYPE.Devnet,
]
/** not support stake   */
export const NET_CONFIG_NOT_SUPPORT_STAKING =[
  NET_CONFIG_TYPE.Unknown,
  // NET_CONFIG_TYPE.Devnet,
]
