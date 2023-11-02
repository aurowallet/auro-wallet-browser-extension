import {
  BerkeleyUrlConfig,
  DevnetUrlConfig,
  MainnetUrlConfig,
  Testworld2UrlConfig,
} from "../../config";

/** all network type contain unknown */
export const NET_CONFIG_TYPE = { 
  Mainnet: "mainnet",
  Devnet: "devnet",
  Berkeley: "berkeley",
  Testworld2: "testworld2",
  Unknown: "unknown",
}; 
/** main net config */
const base_mainnet_config = {
  netType: NET_CONFIG_TYPE.Mainnet,
  url: MainnetUrlConfig.gql,
  explorer: MainnetUrlConfig.explorer,
  gqlTxUrl: MainnetUrlConfig.tx,
  name: "Mainnet",
  id: 1,
};
/** dev net config */
const base_dev_config = {
  netType: NET_CONFIG_TYPE.Devnet,
  url: DevnetUrlConfig.gql,
  explorer: DevnetUrlConfig.explorer,
  gqlTxUrl: DevnetUrlConfig.tx,
  name: "Devnet",
  id: 2,
};
/** berkeley net config */
const base_berkeley_config = {
  netType: NET_CONFIG_TYPE.Berkeley,
  url: BerkeleyUrlConfig.gql,
  explorer: BerkeleyUrlConfig.explorer,
  gqlTxUrl: BerkeleyUrlConfig.tx,
  id: 11,
  name: "Berkeley",
};
/** testworld2 net config */
const base_testworld2_config = {
  netType: NET_CONFIG_TYPE.Testworld2,
  url: Testworld2UrlConfig.gql,
  explorer: Testworld2UrlConfig.explorer,
  gqlTxUrl: Testworld2UrlConfig.tx,
  id: 12,
  name: "Testworld2",
};
/** unknown net config */
export const BASE_unknown_config = {
  netType: NET_CONFIG_TYPE.Unknown,
};

export const NETWORK_CONFIG_LIST = [
  base_mainnet_config,
  base_dev_config,
  base_berkeley_config,
  base_testworld2_config,
];

/** support network config */
export const NET_CONFIG_MAP = {
  [NET_CONFIG_TYPE.Mainnet]: {
    type_id: "0",
    config: base_mainnet_config,
  },
  [NET_CONFIG_TYPE.Devnet]: {
    type_id: "1",
    config: base_dev_config,
  },
  [NET_CONFIG_TYPE.Berkeley]: {
    type_id: "11",
    config: base_berkeley_config,
  },
  [NET_CONFIG_TYPE.Testworld2]: {
    type_id: "12",
    config: base_testworld2_config,
  },
};

/** not support transaction history */
export const NET_CONFIG_NOT_SUPPORT_TX_HISTORY = [
  // NET_CONFIG_TYPE.Unknown,
  // NET_CONFIG_TYPE.Testworld2,
  // NET_CONFIG_TYPE.Devnet,
];
/** not support stake   */
export const NET_CONFIG_NOT_SUPPORT_STAKING = [
  NET_CONFIG_TYPE.Unknown,
  // NET_CONFIG_TYPE.Devnet,
];

/** the netType that support zkapp */
export const NET_CONFIG_SUPPORT_ZKAPP = [
  NET_CONFIG_TYPE.Berkeley,
  NET_CONFIG_TYPE.Testworld2,
];
