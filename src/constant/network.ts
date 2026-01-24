import {
  DevnetUrlConfig,
  MainnetUrlConfig,
  ZekoTestnetConfig,
} from "../../config";

// ============ Network ID Map ============

export const NetworkID_MAP = {
  mainnet: "mina:mainnet",
  testnet: "mina:devnet",
  zekotestnet: "zeko:testnet",
} as const;

export type NetworkID = (typeof NetworkID_MAP)[keyof typeof NetworkID_MAP];

// ============ Network Config Interface ============

export interface NetworkConfig {
  url: string;
  explorer: string;
  gqlTxUrl: string;
  name: string;
  isDefaultNode: boolean;
  networkID: NetworkID;
}

// ============ Default Configs ============

export const DefaultMainnetConfig: NetworkConfig = {
  url: MainnetUrlConfig.gql,
  explorer: MainnetUrlConfig.explorer,
  gqlTxUrl: MainnetUrlConfig.tx,
  name: "Mainnet",
  isDefaultNode: true,
  networkID: NetworkID_MAP.mainnet,
};

const DefaultDevnetConfig: NetworkConfig = {
  url: DevnetUrlConfig.gql,
  explorer: DevnetUrlConfig.explorer,
  gqlTxUrl: DevnetUrlConfig.tx,
  name: "Devnet",
  isDefaultNode: true,
  networkID: NetworkID_MAP.testnet,
};

const ZekoDevnetConfig: NetworkConfig = {
  url: ZekoTestnetConfig.gql,
  explorer: ZekoTestnetConfig.explorer,
  gqlTxUrl: ZekoTestnetConfig.tx,
  name: "Zeko Testnet",
  isDefaultNode: true,
  networkID: NetworkID_MAP.zekotestnet,
};

// ============ Default Network List ============

export const Default_Network_List: NetworkConfig[] = [
  DefaultMainnetConfig,
  DefaultDevnetConfig,
  ZekoDevnetConfig,
];
