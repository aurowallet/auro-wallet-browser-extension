import { ACCOUNT_TYPE } from "../../constant/commonType";
import {
  countHDKeyrings,
  createHDKeyring,
  isV2Vault,
  KEYRING_TYPE,
  sortKeyringsByCreatedAt,
  getDefaultHDWalletName,
} from "../../constant/vaultTypes";
import { normalizeVault, validateVault } from "../vaultMigration";
import { memStore } from "@/store";
import { removeValue, save } from "../storageService";
import { importWalletByMnemonic } from "../accountService";
import {
  getAllAccountsFromVault,
  keyringTypeToAccountType,
  V2Vault,
  V2Keyring,
  AccountInfo,
  VaultData,
} from "./vaultHelpers";

const encryptUtils = require("../../utils/encryptUtils").default;

// ============================================
// Types
// ============================================

export interface KeyringForUI {
  id: string;
  type: string;
  name: string;
  createdAt?: number;
  accountCount: number;
  currentAddress?: string;
  canAddAccount: boolean;
  accounts: Array<{
    address: string;
    name?: string;
    hdIndex?: number;
    type: string;
  }>;
}

export interface KeyringsListResult {
  keyrings: KeyringForUI[];
  currentKeyringId: string | null;
}

export interface KeyringOperationResult {
  error?: string;
  type?: string;
  success?: boolean;
  keyring?: {
    id: string;
    name?: string;
    type?: string;
  };
  account?: AccountInfo;
  currentAccount?: AccountInfo | null;
  isLastKeyring?: boolean;
  mnemonic?: string;
  existingAccount?: {
    address: string;
    accountName?: string;
  };
}

type GetStoreFn = () => {
  data: V2Vault | unknown[] | null;
  password: string;
  currentAccount: AccountInfo | null;
};

// ============================================
// Helper Functions
// ============================================

const getAccountWithoutPrivate = (account: AccountInfo): AccountInfo => {
  const newAccount = { ...account };
  delete newAccount.privateKey;
  return newAccount;
};

// ============================================
// Keyring List Operations
// ============================================

export const getKeyringsList = (getStore: GetStoreFn): KeyringsListResult => {
  const data = getStore().data;

  if (!data || !isV2Vault(data)) {
    return { keyrings: [], currentKeyringId: null };
  }

  const sortedKeyrings = sortKeyringsByCreatedAt(data.keyrings);

  // Map keyrings to UI format
  const keyringsForUI: KeyringForUI[] = sortedKeyrings.map((keyring: V2Keyring, index: number) => {
    // Fallback name for keyrings without a name (migration from older versions)
    let displayName = keyring.name;
    if (!displayName) {
      if (keyring.type === KEYRING_TYPE.HD) {
        displayName = `Wallet ${index + 1}`;
      } else if (keyring.type === KEYRING_TYPE.IMPORTED) {
        displayName = "Imported Wallet";
      } else if (keyring.type === KEYRING_TYPE.LEDGER) {
        displayName = "Hardware Wallet";
      }
    }

    return {
      id: keyring.id,
      type: keyring.type,
      name: displayName || "",
      createdAt: keyring.createdAt,
      accountCount: keyring.accounts.length,
      currentAddress: keyring.currentAddress,
      // Only HD keyrings can add new accounts
      canAddAccount: keyring.type === KEYRING_TYPE.HD,
      accounts: keyring.accounts.map((acc) => ({
        address: acc.address,
        name: acc.name,
        hdIndex: acc.hdIndex,
        type: keyringTypeToAccountType(keyring.type),
      })),
    };
  });

  return {
    keyrings: keyringsForUI,
    currentKeyringId: data.currentKeyringId || null,
  };
};

// ============================================
// Add HD Keyring
// ============================================

export const addHDKeyring = async (
  mnemonic: string,
  walletName: string | undefined,
  getStore: GetStoreFn
): Promise<KeyringOperationResult> => {
  try {
    const data = getStore().data as V2Vault;
    const password = getStore().password;

    if (!isV2Vault(data)) {
      return { error: "v2Required", type: "local" };
    }

    // Generate wallet name if not provided using nextWalletIndex (never decreases)
    const walletIndex = data.nextWalletIndex || countHDKeyrings(data) + 1;
    const name = walletName || `Wallet ${walletIndex}`;
    // Increment nextWalletIndex for next wallet
    data.nextWalletIndex = walletIndex + 1;

    // Encrypt mnemonic
    const encryptedMnemonic = await encryptUtils.encrypt(password, mnemonic);

    // Create new HD keyring
    const newKeyring = createHDKeyring(name, encryptedMnemonic);

    // Derive first account
    const wallet = importWalletByMnemonic(mnemonic, 0);

    // Check for duplicate address
    const allAccounts = getAllAccountsFromVault(data);
    const existingAccount = allAccounts.find(
      (acc) => acc.address === wallet.pubKey
    );
    if (existingAccount) {
      return {
        error: "repeatTip",
        type: "local",
        existingAccount: {
          address: existingAccount.address || '',
          accountName: existingAccount.name || existingAccount.accountName,
        },
      };
    }

    newKeyring.accounts.push({
      address: wallet.pubKey,
      hdIndex: 0,
      name: "Account 1",
    });
    newKeyring.nextHdIndex = 1;
    newKeyring.currentAddress = wallet.pubKey;

    // Add to vault
    data.keyrings.push(newKeyring);
    data.currentKeyringId = newKeyring.id;

    // Save
    const encryptData = await encryptUtils.encrypt(password, data);
    await removeValue("keyringData");
    await save({ keyringData: encryptData });

    // Update current account
    const currentAccount: AccountInfo = {
      address: wallet.pubKey,
      accountName: "Account 1",
      type: ACCOUNT_TYPE.WALLET_INSIDE,
      hdPath: 0,
      keyringId: newKeyring.id,
    };

    memStore.updateState({ data, currentAccount });

    return {
      keyring: {
        id: newKeyring.id,
        name: newKeyring.name,
        type: newKeyring.type,
      },
      account: getAccountWithoutPrivate(currentAccount),
    };
  } catch (error) {
    console.error("[addHDKeyring] Error:", error);
    return { error: "createFailed", type: "local" };
  }
};

// ============================================
// Rename Keyring
// ============================================

export const renameKeyring = async (
  keyringId: string,
  newName: string,
  getStore: GetStoreFn
): Promise<KeyringOperationResult> => {
  try {
    const data = getStore().data as V2Vault;

    if (!isV2Vault(data)) {
      return { error: "v2Required", type: "local" };
    }

    const keyring = data.keyrings.find((kr) => kr.id === keyringId);
    if (!keyring) {
      return { error: "keyringNotFound", type: "local" };
    }

    keyring.name = newName;

    const encryptData = await encryptUtils.encrypt(
      getStore().password,
      data
    );
    await removeValue("keyringData");
    await save({ keyringData: encryptData });
    memStore.updateState({ data });

    return { success: true, keyring: { id: keyring.id, name: keyring.name } };
  } catch (error) {
    return { error: "renameFailed", type: "local" };
  }
};

// ============================================
// Get Keyring Mnemonic
// ============================================

export const getKeyringMnemonic = async (
  keyringId: string,
  password: string,
  checkPasswordFn: (pwd: string) => boolean,
  getStore: GetStoreFn
): Promise<KeyringOperationResult> => {
  if (!checkPasswordFn(password)) {
    return { error: "passwordError", type: "local" };
  }

  const data = getStore().data as V2Vault;
  if (!isV2Vault(data)) {
    return { error: "v2Required", type: "local" };
  }

  const keyring = data.keyrings.find((kr) => kr.id === keyringId);
  if (!keyring) {
    return { error: "keyringNotFound", type: "local" };
  }

  if (keyring.type !== KEYRING_TYPE.HD) {
    return { error: "notHDKeyring", type: "local" };
  }

  if (!keyring.mnemonic) {
    return { error: "noMnemonic", type: "local" };
  }

  const mnemonic = await encryptUtils.decrypt(password, keyring.mnemonic);
  return { mnemonic };
};

// ============================================
// Delete Keyring
// ============================================

export const deleteKeyring = async (
  keyringId: string,
  password: string,
  checkPasswordFn: (pwd: string) => boolean,
  getStore: GetStoreFn
): Promise<KeyringOperationResult> => {
  try {
    if (!checkPasswordFn(password)) {
      return { error: "passwordError", type: "local" };
    }

    const data = getStore().data as V2Vault;

    if (!isV2Vault(data)) {
      return { error: "v2Required", type: "local" };
    }

    const keyringIndex = data.keyrings.findIndex((kr) => kr.id === keyringId);
    if (keyringIndex === -1) {
      return { error: "keyringNotFound", type: "local" };
    }

    // If deleting the last keyring, clear the vault entirely
    if (data.keyrings.length === 1) {
      await removeValue("keyringData");
      memStore.updateState({
        data: undefined,
        currentAccount: undefined,
        password: undefined,
        isUnlocked: false,
      });
      return { success: true, isLastKeyring: true };
    }

    // Remove the keyring
    data.keyrings.splice(keyringIndex, 1);

    // Update currentKeyringId if needed
    if (data.currentKeyringId === keyringId && data.keyrings[0]) {
      data.currentKeyringId = data.keyrings[0].id;
    }

    // Save
    const encryptData = await encryptUtils.encrypt(password, data);
    await removeValue("keyringData");
    await save({ keyringData: encryptData });

    // Update current account to first account of new current keyring
    const newCurrentKeyring = data.keyrings.find(
      (kr) => kr.id === data.currentKeyringId
    );
    let currentAccount: AccountInfo | null = null;
    if (newCurrentKeyring && newCurrentKeyring.accounts.length > 0) {
      const firstAccount = newCurrentKeyring.accounts[0];
      if (firstAccount) {
        currentAccount = {
          address: firstAccount.address,
          accountName: firstAccount.name,
          type: keyringTypeToAccountType(newCurrentKeyring.type),
          hdPath: firstAccount.hdIndex,
          keyringId: newCurrentKeyring.id,
        };
      }
    }

    memStore.updateState({ data, currentAccount: currentAccount ?? undefined });

    return {
      success: true,
      currentAccount: currentAccount
        ? getAccountWithoutPrivate(currentAccount)
        : null,
    };
  } catch (error) {
    console.error("[deleteKeyring] Error:", error);
    return { error: "deleteFailed", type: "local" };
  }
};

// ============================================
// Add Account to Keyring
// ============================================

export const addAccountToKeyring = async (
  keyringId: string,
  accountName: string | undefined,
  getStore: GetStoreFn
): Promise<KeyringOperationResult> => {
  try {
    const data = getStore().data as V2Vault;
    const password = getStore().password;

    if (!isV2Vault(data)) {
      return { error: "v2Required", type: "local" };
    }

    const keyring = data.keyrings.find((kr) => kr.id === keyringId);
    if (!keyring) {
      return { error: "keyringNotFound", type: "local" };
    }

    if (keyring.type !== KEYRING_TYPE.HD) {
      return { error: "cannotAddToNonHD", type: "local" };
    }

    // Derive next account
    const mnemonic = await encryptUtils.decrypt(password, keyring.mnemonic);
    const nextIndex = keyring.nextHdIndex || keyring.accounts.length;
    const wallet = importWalletByMnemonic(mnemonic, nextIndex);

    // Check for duplicate
    const allAccounts = getAllAccountsFromVault(data);
    if (allAccounts.find((acc) => acc.address === wallet.pubKey)) {
      return { error: "repeatTip", type: "local" };
    }

    // Add account
    const name = accountName || `Account ${keyring.accounts.length + 1}`;
    keyring.accounts.push({
      address: wallet.pubKey,
      hdIndex: nextIndex,
      name,
    });
    keyring.nextHdIndex = nextIndex + 1;
    keyring.currentAddress = wallet.pubKey;
    data.currentKeyringId = keyringId;

    // Save
    const encryptData = await encryptUtils.encrypt(password, data);
    await removeValue("keyringData");
    await save({ keyringData: encryptData });

    const currentAccount: AccountInfo = {
      address: wallet.pubKey,
      accountName: name,
      type: ACCOUNT_TYPE.WALLET_INSIDE,
      hdPath: nextIndex,
      keyringId: keyringId,
    };

    memStore.updateState({ data, currentAccount });

    return { account: getAccountWithoutPrivate(currentAccount) };
  } catch (error) {
    console.error("[addAccountToKeyring] Error:", error);
    return { error: "addFailed", type: "local" };
  }
};

// ============================================
// Vault Version Operations
// ============================================

export const getVaultVersionFromStore = (
  getStore: GetStoreFn
): { version: "v1" | "v2" | null } => {
  const data = getStore().data;
  if (!data) return { version: null };
  if (isV2Vault(data)) return { version: "v2" };
  if (Array.isArray(data)) return { version: "v1" };
  return { version: null };
};

export const tryUpgradeVault = async (
  getStore: GetStoreFn
): Promise<{ success: boolean; version?: string; error?: string; type?: string }> => {
  try {
    const data = getStore().data;
    const password = getStore().password;

    if (!data) {
      return { success: false, error: "noVaultData", type: "local" };
    }

    // Already V2
    if (isV2Vault(data)) {
      return { success: true, version: "v2" };
    }

    // Try to migrate
    const { vault: normalizedData, migrated } = normalizeVault(data);

    if (!isV2Vault(normalizedData)) {
      return { success: false, error: "upgradeFailed", type: "local" };
    }

    // Validate the migrated data
    const validation = validateVault(normalizedData);
    if (!validation.valid) {
      return { success: false, error: "validationFailed", type: "local" };
    }

    // Save upgraded data
    const encryptData = await encryptUtils.encrypt(password, normalizedData);
    await save({ keyringData: encryptData });

    // Update memory store
    memStore.updateState({ data: normalizedData as VaultData });

    return { success: true, version: "v2" };
  } catch (error) {
    return { success: false, error: "upgradeFailed", type: "local" };
  }
};
