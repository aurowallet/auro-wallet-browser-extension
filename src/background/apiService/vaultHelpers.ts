import { ACCOUNT_TYPE } from "../../constant/commonType";
import {
  isLegacyVault,
  isV2Vault,
  KEYRING_TYPE,
} from "../../constant/vaultTypes";

// ============================================
// Types
// ============================================

export interface V2Account {
  address: string;
  name?: string;
  hdIndex?: number;
  privateKey?: string;
}

export interface V2Keyring {
  id: string;
  type: string;
  name?: string;
  mnemonic?: string;
  accounts: V2Account[];
  currentAddress?: string;
  nextHdIndex?: number;
  createdAt?: number;
}

export interface V2Vault {
  version: 2;
  keyrings: V2Keyring[];
  currentKeyringId?: string;
  nextWalletIndex?: number;
}

export interface V1Wallet {
  mnemonic?: string;
  accounts: any[];
  currentAddress?: string;
}

export type VaultData = V2Vault | V1Wallet[];

export interface AccountInfo {
  address?: string;
  accountName?: string;
  name?: string;
  type?: string;
  hdPath?: number;
  privateKey?: string;
  keyringId?: string;
  keyringType?: string;
  typeIndex?: number;
  [key: string]: unknown;
}

// ============================================
// V2 Vault Helper Functions
// ============================================

/**
 * Check vault version
 */
export const getVaultVersion = (data: VaultData | null): "v1" | "v2" | null => {
  if (!data) return null;
  if (isV2Vault(data)) return "v2";
  if (Array.isArray(data)) return "v1";
  return null;
};

/**
 * Get all accounts from vault (V1 & V2 compatible)
 */
export const getAllAccountsFromVault = (data: VaultData | null): AccountInfo[] => {
  if (!data) return [];

  if (isV2Vault(data)) {
    // V2: collect accounts from all keyrings
    const accounts: AccountInfo[] = [];
    const typeIndexCounters: Record<string, number> = {
      [ACCOUNT_TYPE.WALLET_INSIDE]: 0,
      [ACCOUNT_TYPE.WALLET_OUTSIDE]: 0,
      [ACCOUNT_TYPE.WALLET_LEDGER]: 0,
      [ACCOUNT_TYPE.WALLET_WATCH]: 0,
    };

    data.keyrings.forEach((keyring) => {
      keyring.accounts.forEach((acc: V2Account) => {
        const accountType = keyringTypeToAccountType(keyring.type);
        typeIndexCounters[accountType] = (typeIndexCounters[accountType] ?? 0) + 1;

        const accountInfo: AccountInfo = {
          address: acc.address,
          accountName: acc.name,
          type: accountType,
          keyringId: keyring.id,
          keyringType: keyring.type,
          typeIndex: typeIndexCounters[accountType],
        };

        // Only add hdPath for HD accounts
        if (acc.hdIndex !== undefined) {
          accountInfo.hdPath = acc.hdIndex;
        }

        // Only add privateKey for imported accounts
        if (acc.privateKey !== undefined) {
          accountInfo.privateKey = acc.privateKey;
        }

        accounts.push(accountInfo);
      });
    });
    return accounts;
  }

  // V1: return accounts directly
  return (data as V1Wallet[])[0]?.accounts || [];
};

/**
 * Get mnemonic from vault (V1 & V2 compatible)
 */
export const getMnemonicFromVault = (data: VaultData | null): string | null => {
  if (!data) return null;

  if (isV2Vault(data)) {
    // V2: get from first HD keyring
    const hdKeyring = data.keyrings.find((kr) => kr.type === KEYRING_TYPE.HD);
    return hdKeyring?.mnemonic || null;
  }

  // V1: return mnemonic from first wallet
  return (data as V1Wallet[])[0]?.mnemonic || null;
};

/**
 * Get current address from vault (V1 & V2 compatible)
 */
export const getCurrentAddressFromVault = (data: VaultData | null): string | null => {
  if (!data) return null;

  if (isV2Vault(data)) {
    const currentKeyring =
      data.keyrings.find((kr) => kr.id === data.currentKeyringId) ||
      data.keyrings[0];
    return currentKeyring?.currentAddress ?? currentKeyring?.accounts?.[0]?.address ?? null;
  }

  return (data as V1Wallet[])[0]?.currentAddress || null;
};

/**
 * Convert keyring type to account type
 */
export const keyringTypeToAccountType = (keyringType: string): string => {
  const typeMap: Record<string, string> = {
    [KEYRING_TYPE.HD]: ACCOUNT_TYPE.WALLET_INSIDE,
    [KEYRING_TYPE.IMPORTED]: ACCOUNT_TYPE.WALLET_OUTSIDE,
    [KEYRING_TYPE.LEDGER]: ACCOUNT_TYPE.WALLET_LEDGER,
    [KEYRING_TYPE.WATCH]: ACCOUNT_TYPE.WALLET_WATCH,
  };
  return typeMap[keyringType] || ACCOUNT_TYPE.WALLET_INSIDE;
};

// ============================================
// Constants
// ============================================

export const STATUS = {
  TX_STATUS_PENDING: "PENDING",
  TX_STATUS_INCLUDED: "INCLUDED",
  TX_STATUS_UNKNOWN: "UNKNOWN",
};

export const DEFAULT_ACCOUNT_NAME = "Account 1";
export const FETCH_TYPE_QA = "Berkeley-QA";
