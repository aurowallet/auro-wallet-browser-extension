import {
  BerkeleyUrlConfig,
  DevnetUrlConfig,
  MainnetUrlConfig,
} from "../../config";

export const NetworkID_MAP = {
  mainnet: "mina:mainnet",
  testnet: "mina:testnet",
  berkeley: "mina:berkeley",
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

const DefaultBerkeleyConfig = {
  url: BerkeleyUrlConfig.gql,
  explorer: BerkeleyUrlConfig.explorer,
  gqlTxUrl: BerkeleyUrlConfig.tx,
  name: "Berkeley",
  isDefaultNode: true,
  networkID: NetworkID_MAP.berkeley,
};

export const Default_Network_List = [
  DefaultMainnetConfig,
  DefaultDevnetConfig,
  DefaultBerkeleyConfig,
];