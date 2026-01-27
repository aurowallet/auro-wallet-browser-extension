interface UrlConfig {
  gql: string;
  explorer: string;
  tx: string;
}

declare module '*/config' {
  export const BASE_INFO_URL: string;
  export const MainnetUrlConfig: UrlConfig;
  export const DevnetUrlConfig: UrlConfig;
  export const ZekoTestnetConfig: UrlConfig;
  export const TokenBuildUrl: string;
  export const NET_CONFIG_VERSION: string;
  export const react_private_keys: string;
  export const node_public_keys: string;
}
