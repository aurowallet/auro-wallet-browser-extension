import {
  DevnetUrlConfig,
  MainnetUrlConfig,
  ZekoTestnetConfig,
} from "../../config";

export const NetworkID_MAP = {
  mainnet: "mina:mainnet",
  testnet: "mina:testnet",
  zekotestnet:"zeko:testnet"
};

export const DefaultMainnetConfig = {
  url: MainnetUrlConfig.gql,
  explorer: MainnetUrlConfig.explorer,
  gqlTxUrl: MainnetUrlConfig.tx,
  name: "Mainnet",
  isDefaultNode: true,
  networkID: NetworkID_MAP.mainnet,
};

const DefaultDevnetConfig = {
  url: DevnetUrlConfig.gql,
  explorer: DevnetUrlConfig.explorer,
  gqlTxUrl: DevnetUrlConfig.tx,
  name: "Devnet",
  isDefaultNode: true,
  networkID: NetworkID_MAP.testnet,
};

const ZekoDevnetConfig = {
  url: ZekoTestnetConfig.gql,
  explorer: ZekoTestnetConfig.explorer,
  gqlTxUrl: ZekoTestnetConfig.tx,
  name: "Zeko Testnet",
  isDefaultNode: true,
  networkID: NetworkID_MAP.zekotestnet,
};



export const Default_Network_List = [
  DefaultMainnetConfig,
  DefaultDevnetConfig,
  ZekoDevnetConfig
];