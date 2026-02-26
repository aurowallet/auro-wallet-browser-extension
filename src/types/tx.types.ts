/**
 * Transaction related types for the Auro Wallet extension
 */

// ============ Transaction Status ============

export const TX_STATUS = {
  PENDING: "PENDING",
  SUCCESS: "applied",
  FAILED: "failed",
} as const;

export type TxStatusType = (typeof TX_STATUS)[keyof typeof TX_STATUS];

// ============ Transaction Kind ============

export type TxKind = "payment" | "stake_delegation" | "delegation" | "zkapp";

// ============ ZkApp Command Types ============

export interface AccountUpdate {
  body?: {
    publicKey?: string;
    tokenId?: string;
    balanceChange?: {
      magnitude: string;
      sgn: string;
    };
  };
}

export interface ZkappCommand {
  accountUpdates?: AccountUpdate[];
  feePayer?: {
    body?: {
      publicKey?: string;
    };
  };
}

// ============ Transaction Body ============

export interface TxBody {
  zkappCommand?: ZkappCommand;
}

// ============ Transaction Data ============

export interface TxData {
  id?: string;
  hash?: string;
  kind?: string;
  from: string;
  to: string;
  amount?: string | number;
  fee?: string | number;
  nonce: number;
  memo?: string;
  status: TxStatusType | string;
  dateTime?: string;
  failureReason?: string;
  body?: TxBody;
  isFromAddressScam?: boolean;
  showSpeedUp?: boolean;
  showExplorer?: boolean;
}

// ============ Token Base Info ============

export interface TokenBaseInfo {
  isMainToken?: boolean;
  decimals?: number;
  symbol?: string;
  name?: string;
}

// ============ Token Info ============

export interface TokenInfo {
  tokenId?: string;
  tokenBaseInfo?: TokenBaseInfo;
}

// ============ Account Types ============

export interface AccountInfo {
  address: string;
  type: string;
  hdPath?: string;
  accountName?: string;
}

export interface AccountState {
  currentAccount: AccountInfo;
}

// ============ Network Config ============

export interface NetworkNode {
  explorer?: string;
  url?: string;
  name?: string;
}

export interface NetworkConfig {
  currentNode: NetworkNode;
}

// ============ Fee Config ============

export interface TransactionFee {
  slow: string;
  medium: string;
  fast: string;
}

export interface FeeConfig {
  version: number;
  transactionFee: TransactionFee;
  feeCap: string;
  speedUpBuffer: string;
  zkAppAccountUpdateFee: string;
}


// ============ Cache State ============

export interface CacheState {
  feeRecommend?: FeeConfig;
}

// ============ Ledger State ============

export interface LedgerState {
  ledgerConnectStatus: string;
}

// ============ Redux Root State ============

/**
 * Re-export RootState from reducers for backward compatibility
 */
export type { RootState } from "@/reducers";
