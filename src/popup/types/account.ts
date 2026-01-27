/**
 * Account and Keyring types for popup UI components
 * 
 * These types are derived from vaultTypes.ts but simplified for UI display purposes.
 * They don't include sensitive data like privateKey or mnemonic.
 */

import { ACCOUNT_TYPE } from "@/constant/commonType";

// ============ Account Types ============

/** Account type values */
export type AccountType = 
  | typeof ACCOUNT_TYPE.WALLET_INSIDE
  | typeof ACCOUNT_TYPE.WALLET_OUTSIDE
  | typeof ACCOUNT_TYPE.WALLET_LEDGER
  | typeof ACCOUNT_TYPE.WALLET_WATCH;

/** Base account info for display */
export interface AccountInfo {
  address: string;
  accountName?: string;
  name?: string;
  type?: AccountType | string;
  hdPath?: number;
  hdIndex?: number;
  balance?: string;
  showBalance?: string;
  publicKey?: string;
  typeIndex?: string | number;
  [key: string]: unknown;
}

/** Account data from legacy vault (V1) */
export interface LegacyAccountData {
  address: string;
  accountName?: string;
  type?: string;
  hdPath?: number;
  publicKey?: string;
}

/** Account item in keyring for display */
export interface KeyringAccountItem {
  address: string;
  name: string;
  hdIndex?: number;
  type?: string;
  [key: string]: unknown;
}

// ============ Keyring Types ============

/** Keyring type values for UI */
export type UIKeyringType = "hd" | "imported" | "ledger" | "watch" | string;

/** Keyring display data for UI */
export interface UIKeyring {
  id: string;
  type: UIKeyringType;
  name: string;
  canAddAccount?: boolean;
  accounts: KeyringAccountItem[];
}

// ============ Balance Types ============

/** Balance map from address to balance info */
export interface BalanceMap {
  [address: string]: {
    balance?: string;
    showBalance?: string;
    nonce?: string | number;
  };
}

// ============ Message Response Types ============

/** Response from WALLET_GET_ALL_ACCOUNT */
export interface GetAllAccountResponse {
  allList?: AccountInfo[];
  commonList?: AccountInfo[];
  accounts?: AccountInfo[];
  accountList?: {
    allList?: AccountInfo[];
    commonList?: AccountInfo[];
    watchList?: AccountInfo[];
  };
  currentAccount?: AccountInfo;
}

/** Response from WALLET_GET_KEYRINGS_LIST */
export interface GetKeyringsListResponse {
  keyrings?: UIKeyring[];
}

/** Response from WALLET_GET_VAULT_VERSION */
export interface GetVaultVersionResponse {
  version?: string;
}
