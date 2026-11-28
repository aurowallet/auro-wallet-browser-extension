/** Public NFT identity and sandbox query results for the supported MinaNFT layout. */
export type NFTNetwork = import("@/constant/network").NetworkID;

export interface INFTIdentity {
  collectionAddress: string;
  nftAddress: string;
}

export interface INFTInfo {
  collectionAddress: string;
  tokenAddress: string;
  tokenId: string;
  owner: string;
  name: string;
  image: string;
  chain: NFTNetwork;
  canTransfer: boolean;
  isPaused: boolean;
  description?: string;
  attributes?: {name: string; value: string}[];
  metadataRoot?: string;
}

export interface INFTInfoResponse {
  nft: INFTInfo;
  collection: {
    collectionAddress: string;
    tokenId: string;
    chain: NFTNetwork;
    isPaused: boolean;
    requireTransferApproval: boolean;
    collectionName?: string;
    transferFee?: string;
    creator?: string;
  };
}

export interface ILocalTransferRequest {
  gqlUrl?: string;
  chain: NFTNetwork;
  collectionAddress: string;
  nftAddress: string;
  sender: string;
  recipient: string;
  fee: string;
  memo: string;
  nonce?: string;
}
export interface ILocalTransferSummary extends ILocalTransferRequest {
  gqlUrl: string;
  nftName?: string;
  owner: string;
  tokenId: string;
  nonce: string;
  nftVersion: string;
  collectionTransferFee: string;
  feeRecipient: string;
  totalDebit: string;
  collectionVk: string;
  nftVk: string;
  metadataRoot: string;
  chainId: string;
  accountCreationFee: "0";
  provingFee: "0";
  checkedAt: string;
}
export type LocalTransferState =
  | "queued"
  | "proving"
  | "ready";
export interface ILocalTransferJob {
  jobId: string;
  chain: NFTNetwork;
  state: LocalTransferState;
  summary: ILocalTransferSummary;
  createdAt: number;
  tabId?: number;
  transaction?: Record<string, any>;
}

/** Plain values exchanged with the NFT sandbox. */
export interface INFTAccountIdentity extends INFTIdentity {
  tokenId: string;
}

export interface INFTAccountState {
  publicKey: string;
  zkappState: string[];
  verificationKey: { hash: string };
}

export interface INFTChainState {
  collection: INFTAccountState;
  nft: INFTAccountState;
  daemonStatus: { chainId: string };
}

export interface INFTDecodedState {
  name: string;
  storage: string;
  metadataRoot: string;
  owner: string;
  version: string;
  canTransfer: boolean;
  isPaused: boolean;
  collection: {
    name: string;
    creator: string;
    transferFee: string;
    isPaused: boolean;
    requireTransferApproval: boolean;
  };
}

export interface INFTTransferData {
  defaultToken: string;
  nextFields: string[];
  memo: string;
}
