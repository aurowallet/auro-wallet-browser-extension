/* eslint-disable @typescript-eslint/no-explicit-any */
import { DAppActions } from "@aurowallet/mina-provider";
import i18n from "i18next";
import { LANGUAGE_CONFIG } from "../../constant/storageKey";
import { changeLanguage } from "../../i18n";
import { extGetLocal } from "../extensionStorage";
import { createNullifier, signFieldsMessage, signTransaction } from "../lib";
import encryptUtils, { ENCRYPT_VERSION_CRYPTOKEY } from "../../utils/encryptUtils";

import browser from "webextension-polyfill";
import { LOCK_TIME_DEFAULT } from "../../constant";
import { ACCOUNT_TYPE } from "../../constant/commonType";
import {
  FROM_BACK_TO_RECORD,
  TX_SUCCESS,
  WORKER_ACTIONS,
} from "../../constant/msgTypes";
import "../../i18n";
import {
  getCurrentNodeConfig,
  getExtensionAction,
} from "../../utils/browserUtils";
import { sendMsg } from "../../utils/commonMsg";
import { decodeMemo, isZekoNet, parseMnemonicWords } from "../../utils/utils";
import {
  getQATxStatus,
  getTxStatus,
  sendParty,
  sendStakeTx,
  sendTx,
} from "../api";
import {
  get,
  getCredentialById,
  getStoredCredentials,
  removeCredential,
  removeValue,
  save,
  searchCredential,
  storeCredential,
} from "../storageService";

import { memStore } from "@/store";

import {
  generateMne,
  importWalletByKeystore,
  importWalletByMnemonic,
  importWalletByPrivateKey,
} from "../accountService";

// Import vault migration utilities
import {
  countHDKeyrings,
  createEmptyVault,
  createHDKeyring,
  generateUUID,
  isLegacyVault,
  isModernVault,
  KEYRING_TYPE,
  VAULT_VERSION,
  sortKeyringsByCreatedAt,
  getDefaultHDWalletName,
  Vault,
  Keyring,
} from "../../constant/vaultTypes";
import { normalizeVault, validateVault, keyringTypeToAccountType } from "../vaultMigration";

// TypeScript types
interface AccountInfo {
  address: string;
  [key: string]: any;
  accountName?: string;
  type?: string;
  hdPath?: number;
  privateKey?: string;
  keyringId?: string;
  keyringType?: string;
  typeIndex?: number;
  localAccount?: { keyringData: string };
  isUnlocked?: boolean;
  name?: string;
  vaultVersion?: string;
  didMigrate?: boolean;
}

interface MigrateResult {
  data: VaultData;
  version: string;
  didMigrate: boolean;
}

interface ErrorResult {
  error: string;
  type?: string;
  account?: { accountName?: string; address?: string };
  existingAccount?: { address?: string; accountName?: string };
}

interface TransactionParams {
  isSpeedUp?: boolean;
  memo?: string;
  zkOnlySign?: boolean;
  sendAction?: string;
}

interface V1Wallet {
  mnemonic?: string;
  accounts: any[];
  currentAddress?: string;
}

type V1Vault = V1Wallet[];

type VaultData = Vault | V1Vault | null;


interface SortedAccountList {
  allList: AccountInfo[];
  commonList: AccountInfo[];
  watchList: AccountInfo[];
}



// ============================================
// Vault Helper Functions
// ============================================

/**
 * Check vault version
 */
const getVaultVersion = (data: VaultData): "v1" | "v3" | null => {
  if (!data) return null;
  if (isModernVault(data)) return "v3";
  if (isLegacyVault(data)) return "v1";
  return null;
};

const cloneVaultData = <T>(data: T): T => {
  if (data === null || data === undefined) return data;
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(data);
    } catch {
      // Fallback for environments/data that cannot be structured-cloned.
    }
  }
  return JSON.parse(JSON.stringify(data));
};

/**
 * Get all accounts from vault (V1 & V3 compatible)
 */
const getAllAccountsFromVault = (
  data: VaultData,
  options?: { includePrivateKey?: boolean }
): AccountInfo[] => {
  if (!data) return [];
  const includePrivateKey = !!options?.includePrivateKey;

  if (isModernVault(data)) {
    // V3: collect accounts from all keyrings
    const accounts: AccountInfo[] = [];
    const typeIndexCounters: Record<string, number> = {
      [ACCOUNT_TYPE.WALLET_INSIDE]: 0,
      [ACCOUNT_TYPE.WALLET_OUTSIDE]: 0,
      [ACCOUNT_TYPE.WALLET_LEDGER]: 0,
      [ACCOUNT_TYPE.WALLET_WATCH]: 0,
    };

    data.keyrings.forEach((keyring) => {
      keyring.accounts.forEach((acc: any) => {
        const accountType = keyringTypeToAccountType(keyring.type);
        typeIndexCounters[accountType] = (typeIndexCounters[accountType] ?? 0) + 1;

        accounts.push({
          address: acc.address,
          accountName: acc.name,
          type: accountType,
          hdPath: acc.hdIndex,
          ...(includePrivateKey ? { privateKey: acc.privateKey } : {}),
          keyringId: keyring.id,
          keyringType: keyring.type,
          typeIndex: typeIndexCounters[accountType],
        });
      });
    });
    return accounts;
  }

  // V1: clone and optionally strip encrypted privateKey.
  const legacyAccounts = data[0]?.accounts || [];
  return legacyAccounts.map((acc: any) => {
    const cloned = { ...acc };
    if (!includePrivateKey) delete cloned.privateKey;
    return cloned;
  });
};

/**
 * Get mnemonic from vault (V1 & V3 compatible)
 */
const getMnemonicFromVault = (
  data: VaultData,
  preferredKeyringId?: string | null
): string | null => {
  if (!data) return null;

  if (isModernVault(data)) {
    // Prefer explicit keyring (current account), then current keyring, then fallback.
    if (preferredKeyringId) {
      const preferredKeyring = data.keyrings.find((kr) => kr.id === preferredKeyringId) as any;
      if (preferredKeyring?.type === KEYRING_TYPE.HD && preferredKeyring?.mnemonic) {
        return preferredKeyring.mnemonic;
      }
    }

    const currentKeyring = data.keyrings.find((kr) => kr.id === data.currentKeyringId) as any;
    if (currentKeyring?.type === KEYRING_TYPE.HD && currentKeyring?.mnemonic) {
      return currentKeyring.mnemonic;
    }

    // Fallback for legacy/currentKeyringId-missing states
    const hdKeyring = data.keyrings.find((kr) => kr.type === KEYRING_TYPE.HD) as any;
    return hdKeyring?.mnemonic || null;
  }

  // V1: return mnemonic from first wallet
  return (data as any)[0]?.mnemonic || null;
};

/**
 * Get current address from vault (V1 & V3 compatible)
 */
const getCurrentAddressFromVault = (data: VaultData): string | null => {
  if (!data) return null;

  if (isModernVault(data)) {
    const currentKeyring =
      data.keyrings.find((kr) => kr.id === data.currentKeyringId) ||
      data.keyrings[0];
    return (
      currentKeyring?.currentAddress || currentKeyring?.accounts?.[0]?.address || null
    );
  }

  return (data as any)[0]?.currentAddress || null;
};

const STATUS = {
  TX_STATUS_PENDING: "PENDING",
  TX_STATUS_INCLUDED: "INCLUDED",
  TX_STATUS_UNKNOWN: "UNKNOWN",
};

const default_account_name = "Account 1";
const FETCH_TYPE_QA = "Berkeley-QA";

const shuffleWords = (words: string[]): string[] => {
  const list = [...words];
  for (let i = list.length - 1; i > 0; i--) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    const randomIndex = buf[0]! % (i + 1);
    const current = list[i] ?? "";
    list[i] = list[randomIndex] ?? "";
    list[randomIndex] = current;
  }
  return list;
};

class APIService {
  activeTimer: ReturnType<typeof setTimeout> | null = null;
  private txTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private authOpLock: Promise<void> = Promise.resolve();

  constructor() {
    this.activeTimer = null;
  }

  getStore = (): any => memStore.getState();

  private _requireCryptoKey(): CryptoKey {
    const key = this.getStore().cryptoKey;
    if (!key) throw new Error("Wallet is locked: cryptoKey not available");
    return key;
  }

  private async _deriveCryptoKeyFromPassword(password: string): Promise<CryptoKey | null> {
    if (!password) return null;
    let vaultSalt = this.getStore().vaultSalt;
    if (!vaultSalt) {
      const storedSalt = await get("vaultSalt");
      vaultSalt = typeof storedSalt?.vaultSalt === "string" ? storedSalt.vaultSalt : "";
    }
    if (!vaultSalt) return null;
    const derived = await encryptUtils.deriveSessionKey(password, vaultSalt);
    return derived.key;
  }

  private async _requireOrDeriveCryptoKey(password?: string): Promise<CryptoKey> {
    const key = this.getStore().cryptoKey;
    if (key) return key;
    if (password) {
      const derivedKey = await this._deriveCryptoKeyFromPassword(password);
      if (derivedKey) return derivedKey;
    }
    throw new Error("Wallet is locked: cryptoKey not available");
  }

  private async _withAuthOperationLock<T>(fn: () => Promise<T>): Promise<T> {
    const previous = this.authOpLock;
    let release: () => void = () => {};
    this.authOpLock = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await fn();
    } finally {
      release();
    }
  }

  private _requireStringInnerSecret(value: unknown): string {
    if (typeof value !== "string") {
      throw new Error("Invalid inner secret payload type");
    }
    return value;
  }

  /**
   * Decrypt inner-secret payloads with backward compatibility.
   * - v3 payload: decrypt via session CryptoKey.
   * - legacy payload (v1/v2): decrypt via password when available.
   */
  private _getEncryptedMnemonicForAccount(data: any, account: { keyringId?: string }): string | null {
    if (isModernVault(data) && account.keyringId) {
      const keyring = data.keyrings.find((kr: any) => kr.id === account.keyringId);
      const mnemonic = (keyring as any)?.mnemonic || null;
      if (mnemonic) return mnemonic;
    }
    return getMnemonicFromVault(data) || null;
  }

  private async _decryptInnerSecret(ciphertext: string, password?: string, preVerifiedKey?: CryptoKey): Promise<string> {
    if (this._isV3Encrypted(ciphertext)) {
      const cryptoKey = preVerifiedKey || await this._requireOrDeriveCryptoKey(password);
      const decrypted = await encryptUtils.decryptWithCryptoKey(cryptoKey, ciphertext);
      return this._requireStringInnerSecret(decrypted);
    }
    if (password) {
      const decrypted = await encryptUtils.decrypt(password, ciphertext);
      return this._requireStringInnerSecret(decrypted);
    }
    throw new Error("Legacy inner secret requires password");
  }

  resetWallet = async () => {
    if (this.activeTimer) clearTimeout(this.activeTimer);
    this.activeTimer = null;
    for (const timer of this.txTimers.values()) clearTimeout(timer);
    this.txTimers.clear();
    this._clearVolatileMnemonic();
    this.setPopupIcon(false);
    // resetWallet clears account identity entirely (unlike lock(), which keeps address)
    memStore.reset();
    await removeValue(["keyringData", "vaultSalt", "pendingCreateMnemonic"]);
  };

  setPopupIcon = (isUnlocked: boolean) => {
    const icons: Record<number, string> = [16, 32, 48, 128].reduce((res: Record<number, string>, size) => {
      res[size] = isUnlocked
        ? `img/logo/${size}.png`
        : `img/logo/${size}_lock.png`;
      return res;
    }, {});
    const action = getExtensionAction();
    return action.setIcon({ path: icons });
  };

  getCreateFlowState = async (): Promise<{
    hasExistingWallet: boolean;
    isUnlocked: boolean;
  }> => {
    const existingVault = await get("keyringData");
    const hasExistingWallet = !!existingVault?.keyringData;
    const isUnlocked = !!this.getStore().isUnlocked;
    return { hasExistingWallet, isUnlocked };
  };

  getCreateMnemonic = async (isNewMne: boolean): Promise<string> => {
    let storedMne = this.getStore().mne;
    if (!storedMne) {
      const pending = await get("pendingCreateMnemonic");
      if (pending?.pendingCreateMnemonic) {
        storedMne = pending.pendingCreateMnemonic;
        memStore.setMnemonic(storedMne);
      }
    }
    
    if (isNewMne && !storedMne) {
      const cryptoKey = this.getStore().cryptoKey;
      if (!cryptoKey) return "";

      const mne = parseMnemonicWords(generateMne()).join(" ");
      if (!mne) return "";
      const encrypted = await encryptUtils.encryptWithCryptoKey(cryptoKey, mne);
      memStore.setMnemonic(encrypted);
      if (this.getStore().data) {
        await save({ pendingCreateMnemonic: encrypted });
      }
      return mne;
    }

    if (!storedMne) return "";
    try {
      const cryptoKey = this._requireCryptoKey();
      const decrypted = await encryptUtils.decryptWithCryptoKey(cryptoKey, storedMne);
      return parseMnemonicWords(this._requireStringInnerSecret(decrypted)).join(" ");
    } catch {
      return "";
    }
  };

  getCreateMnemonicChallenge = async (): Promise<{ words?: string[] } | ErrorResult> => {
    let storedMne = this.getStore().mne;
    if (!storedMne) {
      const pending = await get("pendingCreateMnemonic");
      if (pending?.pendingCreateMnemonic) {
        storedMne = pending.pendingCreateMnemonic;
        memStore.setMnemonic(storedMne);
      }
    }
    if (!storedMne) {
      return { error: "tryAgain", type: "local" };
    }
    try {
      const cryptoKey = this._requireCryptoKey();
      const decrypted = await encryptUtils.decryptWithCryptoKey(cryptoKey, storedMne);
      const words = parseMnemonicWords(this._requireStringInnerSecret(decrypted));
      if (words.length === 0) {
        return { error: "tryAgain", type: "local" };
      }
      return { words: shuffleWords(words) };
    } catch {
      return { error: "tryAgain", type: "local" };
    }
  };

  clearCreateMnemonic = async (): Promise<{ success: boolean }> => {
    this._clearVolatileMnemonic();
    await removeValue("pendingCreateMnemonic");
    return { success: true };
  };

  confirmCreateMnemonic = async (selectedWords: string[]): Promise<any> => {
    if (!Array.isArray(selectedWords)) {
      return { error: "seed_error", type: "local" };
    }

    return this._withAuthOperationLock(async () => {
    let storedMne = this.getStore().mne;
    if (!storedMne) {
      const pending = await get("pendingCreateMnemonic");
      if (pending?.pendingCreateMnemonic) {
        storedMne = pending.pendingCreateMnemonic;
        memStore.setMnemonic(storedMne);
      }
    }
    if (!storedMne) {
      return { error: "mnemonicLost", type: "local" };
    }

    try {
      const cryptoKey = this._requireCryptoKey();
      const decrypted = await encryptUtils.decryptWithCryptoKey(cryptoKey, storedMne);
      const sourceWords = parseMnemonicWords(this._requireStringInnerSecret(decrypted));
      const selectedList = selectedWords
        .map((word) => (typeof word === "string" ? word.trim() : ""))
        .filter(Boolean);

      const isMatch =
        sourceWords.length > 0 &&
        selectedList.length === sourceWords.length &&
        selectedList.every((word, index) => word === sourceWords[index]);

      if (!isMatch) {
        return { error: "seed_error", type: "local" };
      }

      const mnemonic = sourceWords.join(" ");

      const existingData = this.getStore().data;
      const result = await this.createAccount(mnemonic);

      if (result?.error) {
        memStore.setMnemonic(storedMne);
        if (existingData) {
          await save({ pendingCreateMnemonic: storedMne });
        }
      } else {
        this._clearVolatileMnemonic();
      }
      return result;
    } catch (error) {
      console.error("[confirmCreateMnemonic] Error:", error);
      return { error: "tryAgain", type: "local" };
    }
    });
  };

  private _clearVolatileMnemonic(): void {
    memStore.setMnemonic("");
  }

  filterCurrentAccount = (accountList: AccountInfo[], currentAddress: string): AccountInfo | undefined => {
    return accountList.find((acc: AccountInfo) => acc.address === currentAddress);
  };

  initAppLocalConfig = async (): Promise<number> => {
    const result = await get("autoLockTime");
    const storedValue = result?.autoLockTime;
    // Handle both formats: number or {value: number}
    if (typeof storedValue === 'number') {
      return storedValue;
    } else if (storedValue && typeof storedValue === 'object' && 'value' in storedValue) {
      return (storedValue as { value: number }).value;
    }
    return LOCK_TIME_DEFAULT;
  };

  async submitPassword(password: string, options: Record<string, unknown> = {}) {
    return this._withAuthOperationLock(async () => {
      const encryptedVault = await get("keyringData");
      if (!encryptedVault?.keyringData) {
        return { error: "passwordError", type: "local" };
      }

      try {
        // Check if vault is already in v3 CryptoKey format
        const storedSalt = await get("vaultSalt");
        let vaultPayload: any;
        try {
          vaultPayload = JSON.parse(encryptedVault.keyringData);
        } catch (parseError) {
          console.error("[aurowallet apiservice] submitPassword invalid keyringData JSON:", parseError);
          return { error: "passwordError", type: "local" };
        }
        const isV3Format = vaultPayload.version === ENCRYPT_VERSION_CRYPTOKEY && storedSalt?.vaultSalt;

        let vaultData: any;
        let version = "v1";
        let didMigrate = false;
        let cryptoKey: CryptoKey | null = null;
        let vaultSalt = "";
        let persistPayload: { keyringData: string; vaultSalt: string } | null = null;

        if (isV3Format) {
          // === Fast path: v3 CryptoKey format ===
          vaultSalt = storedSalt.vaultSalt;
          const derived = await encryptUtils.deriveSessionKey(password, vaultSalt);
          cryptoKey = derived.key;
          vaultData = await encryptUtils.decryptWithCryptoKey(cryptoKey, encryptedVault.keyringData);

          // If a legacy structure was wrapped in v3 encryption, normalize and upgrade now.
          if (isLegacyVault(vaultData)) {
            const migrateResult = await this.migrateData(
              password,
              cloneVaultData(vaultData),
              true
            );
            vaultData = migrateResult.data;
            version = migrateResult.version;
            const hasLegacyInnerSecrets = this._hasLegacyInnerSecrets(vaultData);

            if (hasLegacyInnerSecrets) {
              vaultData = await this._migrateInnerSecretsToCryptoKey(
                vaultData,
                password,
                cryptoKey
              );
              didMigrate = true;
            }

            if (isModernVault(vaultData)) {
              if (vaultData.version < VAULT_VERSION) {
                vaultData.version = VAULT_VERSION;
              }
              version = "v3";
              const encryptedData = await encryptUtils.encryptWithCryptoKey(cryptoKey, vaultData);
              persistPayload = { keyringData: encryptedData, vaultSalt };
              didMigrate = true;
            } else {
              version = "v1";
              if (hasLegacyInnerSecrets) {
                const encryptedData = await encryptUtils.encryptWithCryptoKey(cryptoKey, vaultData);
                persistPayload = { keyringData: encryptedData, vaultSalt };
              }
            }
          } else {
            version = getVaultVersion(vaultData) || "v3";
            const hasLegacyInnerSecrets = this._hasLegacyInnerSecrets(vaultData);
            if (hasLegacyInnerSecrets) {
              vaultData = await this._migrateInnerSecretsToCryptoKey(
                vaultData,
                password,
                cryptoKey
              );
              didMigrate = true;
            }

            if (isModernVault(vaultData)) {
              if (vaultData.version < VAULT_VERSION) {
                vaultData.version = VAULT_VERSION;
                didMigrate = true;
              }
              if (hasLegacyInnerSecrets || didMigrate) {
                const encryptedData = await encryptUtils.encryptWithCryptoKey(cryptoKey, vaultData);
                persistPayload = { keyringData: encryptedData, vaultSalt };
              }
            }
          }
        } else {
          // === Migration path: old format (v1/v2 encrypted blobs) ===
          let vault = await encryptUtils.decrypt(
            password,
            encryptedVault.keyringData
          );

          // Execute data migration (encryption format upgrade + V3 structure upgrade)
          const migrateResult = await this.migrateData(password, vault, true);
          vaultData = migrateResult.data;
          version = migrateResult.version;
          didMigrate = migrateResult.didMigrate;

          // Derive session CryptoKey with new or existing vaultSalt
          vaultSalt = storedSalt?.vaultSalt || '';
          if (!vaultSalt) {
            const derived = await encryptUtils.deriveSessionKey(password);
            cryptoKey = derived.key;
            vaultSalt = derived.salt;
          } else {
            const derived = await encryptUtils.deriveSessionKey(password, vaultSalt);
            cryptoKey = derived.key;
          }

          // Re-encrypt inner secrets (mnemonics, private keys) with CryptoKey
          vaultData = await this._migrateInnerSecretsToCryptoKey(
            vaultData,
            password,
            cryptoKey
          );

          // Ensure vault data version is bumped to VAULT_VERSION (3)
          if (isModernVault(vaultData) && vaultData.version < VAULT_VERSION) {
            vaultData.version = VAULT_VERSION;
          }

          // Re-encrypt outer vault with CryptoKey (v3 format)
          const encryptedData = await encryptUtils.encryptWithCryptoKey(cryptoKey, vaultData);

          didMigrate = true;
          persistPayload = { keyringData: encryptedData, vaultSalt };
        }

        // Fail closed on unexpected/corrupted vault structure.
        version = getVaultVersion(vaultData) || version || "v1";
        if (isModernVault(vaultData)) {
          const validation = validateVault(vaultData);
          if (!validation.valid) {
            throw new Error("Invalid modern vault structure");
          }
        } else if (!isLegacyVault(vaultData)) {
          throw new Error("Invalid vault data structure");
        }

        // Persist only after validation succeeds.
        if (persistPayload) {
          await save(persistPayload);
        }

        // Get current account based on version
        let currentAddress, currentAccount;

        if (version === "v3") {
          currentAddress = this.getCurrentAddressFromModernVault(vaultData as Vault);
          currentAccount = this.getCurrentAccountFromModernVault(
            vaultData as Vault,
            currentAddress || ""
          );
        } else {
          currentAddress = (vaultData as any)[0]?.currentAddress;
          currentAccount = this.filterCurrentAccount(
            (vaultData as any)[0]?.accounts || [],
            currentAddress
          );
        }

        const autoLockTime = await this.initAppLocalConfig();
        if (!cryptoKey || !vaultSalt) {
          throw new Error("Missing session CryptoKey or vaultSalt after unlock");
        }
        memStore.unlock({
          cryptoKey,
          vaultSalt,
          data: vaultData as any,
          currentAccount: this.getAccountWithoutPrivate(currentAccount || {} as AccountInfo),
          autoLockTime,
        });

        this.setPopupIcon(true);
        sendMsg({
          type: FROM_BACK_TO_RECORD,
          action: WORKER_ACTIONS.SET_LOCK,
          payload: true as any,
        });

        // Return account info with version and migration status for dev mode
        const result = this.getAccountWithoutPrivate(currentAccount || {} as AccountInfo);
        result.vaultVersion = version;
        result.didMigrate = didMigrate;
        return result;
      } catch (error) {
        console.error("[aurowallet apiservice] submitPassword error:", error);
        return { error: "passwordError", type: "local" };
      }
    });
  }

  /**
   * Check if an encrypted string is already in v3 CryptoKey format.
   * Used for idempotency: if a prior migration attempt re-encrypted some
   * secrets but crashed before saving the outer vault, retrying must not
   * attempt to password-decrypt already-v3 data.
   */
  private _isV3Encrypted(encrypted: string): boolean {
    try {
      return JSON.parse(encrypted).version === ENCRYPT_VERSION_CRYPTOKEY;
    } catch {
      return false;
    }
  }

  private async _migrateInnerSecretsToCryptoKey(
    vaultData: any,
    password: string,
    cryptoKey: CryptoKey
  ): Promise<any> {
    const workingVaultData = cloneVaultData(vaultData);
    const updates: Array<{ target: any; key: string; value: string }> = [];

    if (isModernVault(workingVaultData)) {
      for (const keyring of workingVaultData.keyrings) {
        const kr = keyring as any;
        if (kr.mnemonic && !this._isV3Encrypted(kr.mnemonic)) {
          const mne = this._requireStringInnerSecret(
            await encryptUtils.decrypt(password, kr.mnemonic)
          );
          const encrypted = await encryptUtils.encryptWithCryptoKey(cryptoKey, mne);
          updates.push({ target: kr, key: 'mnemonic', value: encrypted });
        }
        for (const acc of keyring.accounts) {
          const a = acc as any;
          if (a.privateKey && !this._isV3Encrypted(a.privateKey)) {
            const pk = this._requireStringInnerSecret(
              await encryptUtils.decrypt(password, a.privateKey)
            );
            const encrypted = await encryptUtils.encryptWithCryptoKey(cryptoKey, pk);
            updates.push({ target: a, key: 'privateKey', value: encrypted });
          }
        }
      }
    } else if (Array.isArray(workingVaultData)) {
      for (const wallet of workingVaultData) {
        if (wallet.mnemonic && !this._isV3Encrypted(wallet.mnemonic)) {
          const mne = this._requireStringInnerSecret(
            await encryptUtils.decrypt(password, wallet.mnemonic)
          );
          const encrypted = await encryptUtils.encryptWithCryptoKey(cryptoKey, mne);
          updates.push({ target: wallet, key: 'mnemonic', value: encrypted });
        }
        for (const acc of wallet.accounts || []) {
          if (acc.privateKey && !this._isV3Encrypted(acc.privateKey)) {
            const pk = this._requireStringInnerSecret(
              await encryptUtils.decrypt(password, acc.privateKey)
            );
            const encrypted = await encryptUtils.encryptWithCryptoKey(cryptoKey, pk);
            updates.push({ target: acc, key: 'privateKey', value: encrypted });
          }
        }
      }
    }

    // Phase 2: All operations succeeded — apply updates atomically.
    for (const { target, key, value } of updates) {
      target[key] = value;
    }
    return workingVaultData;
  }

  private _getPasswordProbeCiphertext(vaultData: VaultData): string | null {
    if (!vaultData) return null;

    if (isModernVault(vaultData)) {
      for (const keyring of vaultData.keyrings) {
        const kr = keyring as any;
        if (kr.type === KEYRING_TYPE.HD && typeof kr.mnemonic === "string") {
          return kr.mnemonic;
        }
        for (const account of keyring.accounts) {
          const acc = account as any;
          if (typeof acc.privateKey === "string") return acc.privateKey;
        }
      }
      return null;
    }

    if (Array.isArray(vaultData)) {
      for (const wallet of vaultData) {
        if (typeof wallet?.mnemonic === "string") return wallet.mnemonic;
        for (const account of wallet?.accounts || []) {
          if (typeof account?.privateKey === "string") return account.privateKey;
        }
      }
    }

    return null;
  }

  private _hasLegacyInnerSecrets(vaultData: VaultData): boolean {
    if (!vaultData) return false;

    if (isModernVault(vaultData)) {
      for (const keyring of vaultData.keyrings) {
        const kr = keyring as any;
        if (typeof kr.mnemonic === "string" && !this._isV3Encrypted(kr.mnemonic)) {
          return true;
        }
        for (const account of keyring.accounts) {
          const acc = account as any;
          if (typeof acc.privateKey === "string" && !this._isV3Encrypted(acc.privateKey)) {
            return true;
          }
        }
      }
      return false;
    }

    if (Array.isArray(vaultData)) {
      for (const wallet of vaultData) {
        if (typeof wallet?.mnemonic === "string" && !this._isV3Encrypted(wallet.mnemonic)) {
          return true;
        }
        for (const account of wallet?.accounts || []) {
          if (typeof account?.privateKey === "string" && !this._isV3Encrypted(account.privateKey)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Get current address from modern (multi-keyring) vault
   */
  getCurrentAddressFromModernVault(vault: Vault): string | null {
    if (!vault || !vault.keyrings) return null;

    // Find current keyring
    const currentKeyring =
      vault.keyrings.find((kr) => kr.id === vault.currentKeyringId) ||
      vault.keyrings[0];

    if (!currentKeyring) return null;

    // Return current address or first account address
    return (
      currentKeyring.currentAddress || currentKeyring.accounts?.[0]?.address || null
    );
  }

  /**
   * Get current account from modern (multi-keyring) vault
   */
  getCurrentAccountFromModernVault(vault: Vault, currentAddress: string): AccountInfo | null {
    if (!vault || !vault.keyrings || !currentAddress) return null;

    for (const keyring of vault.keyrings) {
      const account = keyring.accounts.find(
        (acc) => acc.address === currentAddress
      );
      if (account) {
        // Convert to UI expected format
        return {
          address: account.address,
          accountName: account.name,
          type: keyringTypeToAccountType(keyring.type),
          hdPath: (account as any).hdIndex,
          keyringId: keyring.id,
        };
      }
    }
    return null;
  }

  /**
   * Data migration: encryption format upgrade + V3 structure upgrade
   * Strategy: modern vault returns directly, V1 upgrades with validation, keeps V1 on failure
   * Core principle: mnemonic/private key must never be lost
   */
  async migrateData(password: string, vault: any, skipSave = false): Promise<MigrateResult> {
    let didMigrate = false;
    // 1. Return modern vault directly
    if (isModernVault(vault)) {
      return { data: vault, version: "v3", didMigrate: false };
    }
    if (!Array.isArray(vault)) {
      return { data: vault, version: "v1", didMigrate: false };
    }

    // 2. V1: upgrade encryption format
    const migrateCheck = (dataStr: any): boolean => {
      try {
        const ver = JSON.parse(dataStr).version;
        return dataStr && ver !== 2 && ver !== 3;
      } catch (e) {
        return false;
      }
    };

    const migrateEncryption = async (data: any, key: string): Promise<void> => {
      if (migrateCheck(data[key])) {
        data[key] = await encryptUtils.encrypt(
          password,
          await encryptUtils.decrypt(password, data[key])
        );
        didMigrate = true;
      }
    };

    for (let i = 0; i < vault.length; i++) {
      let wallet = vault[i];
      await migrateEncryption(wallet, "mnemonic");
      for (let j = 0; j < wallet.accounts.length; j++) {
        let account = wallet.accounts[j];
        await migrateEncryption(account, "privateKey");
      }
    }

    // 3. Structure upgrade: V1 legacy -> V3 modern
    if (isLegacyVault(vault)) {

      const { vault: modernVault, migrated } = normalizeVault(vault);

      if (migrated) {
        const validation = validateVault(modernVault);
        if (!validation.valid) {
          if (didMigrate && !skipSave) {
            const encryptData = await encryptUtils.encrypt(password, vault);
            await save({ keyringData: encryptData });
          }
          return { data: vault, version: "v1", didMigrate };
        }

        const originalCount = vault.reduce(
          (sum, w) => sum + (w.accounts?.length || 0),
          0
        );
        const migratedCount = modernVault.keyrings.reduce(
          (sum, kr) => sum + kr.accounts.length,
          0
        );
        if (originalCount !== migratedCount) {
          if (didMigrate && !skipSave) {
            const encryptData = await encryptUtils.encrypt(password, vault);
            await save({ keyringData: encryptData });
          }
          return { data: vault, version: "v1", didMigrate };
        }

        const originalMnemonics = vault
          .filter((w: any) => w.mnemonic)
          .map((w: any) => w.mnemonic);
        const migratedMnemonics = modernVault.keyrings
          .filter((kr: any) => kr.mnemonic)
          .map((kr: any) => kr.mnemonic);
        if (originalMnemonics.length !== migratedMnemonics.length) {
          if (didMigrate && !skipSave) {
            const encryptData = await encryptUtils.encrypt(password, vault);
            await save({ keyringData: encryptData });
          }
          return { data: vault, version: "v1", didMigrate };
        }

        // All validations passed, save V3
        if (!skipSave) {
          const encryptedModern = await encryptUtils.encrypt(password, modernVault);
          await save({ keyringData: encryptedModern });
        }
        return { data: modernVault, version: "v3", didMigrate: true };
      }
    }

    // 4. Only encryption format upgrade, save and return V1
    if (didMigrate && !skipSave) {
      const encryptData = await encryptUtils.encrypt(password, vault);
      await save({ keyringData: encryptData });
    }

    return { data: vault, version: "v1", didMigrate };
  }

  private async _checkPasswordCore(password: string): Promise<boolean> {
    try {
      let encryptedVault: Record<string, any> | null = null;
      let encryptedPayloadVersion: number | null = null;
      let vaultSalt = this.getStore().vaultSalt;
      if (!vaultSalt) {
        const storedSalt = await get("vaultSalt");
        vaultSalt = typeof storedSalt?.vaultSalt === "string" ? storedSalt.vaultSalt : "";
      }
      if (vaultSalt) {
        const { key } = await encryptUtils.deriveSessionKey(password, vaultSalt);

        const probeCiphertext = this._getPasswordProbeCiphertext(this.getStore().data);
        if (probeCiphertext && this._isV3Encrypted(probeCiphertext)) {
          await encryptUtils.decryptWithCryptoKey(key, probeCiphertext);
          return true;
        }

        encryptedVault = await get("keyringData");
        if (!encryptedVault?.keyringData) return false;

        try {
          const payload = JSON.parse(encryptedVault.keyringData);
          if (typeof payload?.version === "number") {
            encryptedPayloadVersion = payload.version;
          }
        } catch {
          encryptedPayloadVersion = null;
        }

        // Verify v3 payloads via CryptoKey path.
        if (encryptedPayloadVersion === ENCRYPT_VERSION_CRYPTOKEY) {
          await encryptUtils.decryptWithCryptoKey(key, encryptedVault.keyringData);
          return true;
        }
      }

      // Legacy fallback (outer vault is still password-encrypted v1/v2).
      if (!encryptedVault) {
        encryptedVault = await get("keyringData");
      }
      if (!encryptedVault?.keyringData) return false;
      if (encryptedPayloadVersion === null) {
        try {
          const payload = JSON.parse(encryptedVault.keyringData);
          if (typeof payload?.version === "number") {
            encryptedPayloadVersion = payload.version;
          }
        } catch {
          encryptedPayloadVersion = null;
        }
      }
      if (encryptedPayloadVersion === ENCRYPT_VERSION_CRYPTOKEY) {
        return false;
      }
      await encryptUtils.decrypt(password, encryptedVault.keyringData);
      return true;
    } catch {
      return false;
    }
  }

  async checkPassword(password: string): Promise<boolean> {
    return this._withAuthOperationLock(() => this._checkPasswordCore(password));
  }
  private async _checkPasswordAndGetKeyCore(password: string): Promise<CryptoKey | null> {
    try {
      let vaultSalt = this.getStore().vaultSalt;
      if (!vaultSalt) {
        const storedSalt = await get("vaultSalt");
        vaultSalt = typeof storedSalt?.vaultSalt === "string" ? storedSalt.vaultSalt : "";
      }

      if (vaultSalt) {
        const { key } = await encryptUtils.deriveSessionKey(password, vaultSalt);

        const probeCiphertext = this._getPasswordProbeCiphertext(this.getStore().data);
        if (probeCiphertext && this._isV3Encrypted(probeCiphertext)) {
          await encryptUtils.decryptWithCryptoKey(key, probeCiphertext);
          return key;
        }

        const encryptedVault = await get("keyringData");
        if (encryptedVault?.keyringData) {
          let payloadVersion: number | null = null;
          try {
            const parsed = JSON.parse(encryptedVault.keyringData);
            if (typeof parsed?.version === "number") payloadVersion = parsed.version;
          } catch { /* ignore parse errors */ }
          if (payloadVersion === ENCRYPT_VERSION_CRYPTOKEY) {
            await encryptUtils.decryptWithCryptoKey(key, encryptedVault.keyringData);
            return key;
          }

          try {
            await encryptUtils.decrypt(password, encryptedVault.keyringData);
            return key;
          } catch {
            return null;
          }
        }

        return null; 
      }

      return null;
    } catch {
      return null;
    }
  }

  private async _checkPasswordAndGetKey(password: string): Promise<CryptoKey | null> {
    return this._withAuthOperationLock(() => this._checkPasswordAndGetKeyCore(password));
  }

  setLastActiveTime() {
    const rawAutoLockTime = this.getStore().autoLockTime;
    let timeoutMs: number;
    if (typeof rawAutoLockTime === 'number') {
      timeoutMs = rawAutoLockTime;
    } else if (rawAutoLockTime && typeof rawAutoLockTime === 'object' && 'value' in rawAutoLockTime) {
      timeoutMs = (rawAutoLockTime as {value: number}).value;
    } else {
      timeoutMs = LOCK_TIME_DEFAULT;
    }
    
    let localData = this.getStore().data;
    let isUnlocked = this.getStore().isUnlocked;
    if (localData && isUnlocked) {
      if (this.activeTimer) {
        clearTimeout(this.activeTimer);
      }
      if (timeoutMs <= 0) {
        return;
      }
      this.activeTimer = setTimeout(() => {
        this.setUnlockedStatus(false).catch((err) => {
          console.error("[setLastActiveTime] lock failed:", err);
        });
      }, timeoutMs);
    }
  }
  async updateLockTime(autoLockTime: number | { value: number }): Promise<void> {
    // Extract value if passed as object {value: number}
    const timeValue = typeof autoLockTime === 'object' && autoLockTime?.value !== undefined 
      ? autoLockTime.value 
      : autoLockTime;
    memStore.updateState({ autoLockTime: timeValue as number });
    await save({ autoLockTime: timeValue });
  }
  getCurrentAutoLockTime() {
    return this.getStore().autoLockTime;
  }
  setUnlockedStatus = async (status: boolean): Promise<void> => {
    if (!status) {
      this._clearVolatileMnemonic();
      await removeValue("pendingCreateMnemonic");
      memStore.lock();
    }

    sendMsg({
      type: FROM_BACK_TO_RECORD,
      action: WORKER_ACTIONS.SET_LOCK,
      payload: status as any,
    });

    this.setPopupIcon(status);
  };
  getCurrentAccount = async () => {
    let initStatus = false;
    let localAccount = await get("keyringData");
    let currentAccount = this.getStore().currentAccount;
    let isUnlocked = this.getStore().isUnlocked;

    // Check if keyringData actually exists (not just empty object from storage)
    const hasKeyringData = localAccount && localAccount.keyringData;

    // Handle case when vault is cleared (no current account or empty object)
    if (!currentAccount || !currentAccount.address) {
      let iconStatus = !initStatus || isUnlocked;
      this.setPopupIcon(iconStatus);
      return {
        isUnlocked,
        localAccount: hasKeyringData ? { keyringData: "keyringData" } : null,
      };
    }

    if (hasKeyringData) {
      initStatus = true;
      currentAccount = {
        ...currentAccount,
        localAccount: { keyringData: "keyringData" },
      };
    }
    currentAccount = { ...currentAccount, isUnlocked };
    let iconStatus = !initStatus || isUnlocked;
    this.setPopupIcon(iconStatus);
    return this.getAccountWithoutPrivate(currentAccount);
  };

  getCurrentAccountAddress = () => {
    const currentAccount = this.getStore().currentAccount;
    return currentAccount?.address ?? "";
  };
  createPwd = async (password: string): Promise<void> => {
    return this._withAuthOperationLock(async () => {
      this._clearVolatileMnemonic();
      const existingVault = await get("keyringData");
      if (existingVault?.keyringData) {
        throw new Error("vaultAlreadyExists");
      }

      const derived = await encryptUtils.deriveSessionKey(password);
      const cryptoKey = derived.key;
      const vaultSalt = derived.salt;

      // Persist vaultSalt (needed to re-derive CryptoKey on next unlock)
      await save({ vaultSalt });

      memStore.updateState({ cryptoKey, vaultSalt, isUnlocked: true });
    });
  };
  createAccount = async (mnemonic: string): Promise<any> => {
    try {
      this._clearVolatileMnemonic();
      const cryptoKey = this.getStore().cryptoKey;
      if (!cryptoKey) {
        return { error: "walletNotReady", type: "local" };
      }
      const existingData = this.getStore().data;

      // If modern vault already exists, add new HD keyring instead of creating new vault
      if (isModernVault(existingData)) {
        const hdResult: any = await this.addHDKeyring(mnemonic);
        return hdResult?.error ? hdResult : hdResult?.account ?? hdResult;
      }

      // Create new modern vault for first-time wallet creation
      let wallet = importWalletByMnemonic(mnemonic);
      let mnemonicEn = await encryptUtils.encryptWithCryptoKey(cryptoKey, mnemonic);

      const newKeyring = createHDKeyring(getDefaultHDWalletName(1), mnemonicEn);
      newKeyring.accounts.push({
        address: wallet.pubKey,
        hdIndex: 0,
        name: default_account_name,
      });
      newKeyring.nextHdIndex = 1;
      newKeyring.currentAddress = wallet.pubKey;

      // V3 vault structure with nextWalletIndex for tracking default names
      const data = {
        version: VAULT_VERSION,
        keyrings: [newKeyring],
        currentKeyringId: newKeyring.id,
        nextWalletIndex: 2, // Next wallet will be "Wallet 2"
      };

      const currentAccount = {
        address: wallet.pubKey,
        type: ACCOUNT_TYPE.WALLET_INSIDE,
        hdPath: 0,
        accountName: default_account_name,
        typeIndex: 1,
        keyringId: newKeyring.id,
      };

      let encryptData = await encryptUtils.encryptWithCryptoKey(cryptoKey, data);
      await save({ keyringData: encryptData });
      await removeValue("pendingCreateMnemonic");
      memStore.updateState({ data, currentAccount });
      await this.setUnlockedStatus(true);
      return this.getAccountWithoutPrivate(currentAccount);
    } catch (error) {
      console.error("[createAccount] Error:", error);
      return { error: "createFailed", type: "local" };
    }
  };
  getLedgerAccountIndex = () => {
    const state = this.getStore();
    const data = state.data;

    // V1 & V3 compatible
    const allAccounts = getAllAccountsFromVault(data) || [];
    const ledgerList = allAccounts.filter(
      (acc) => acc.type === ACCOUNT_TYPE.WALLET_LEDGER
    );
    return ledgerList.length;
  };
  getLockStatus = () => {
    const isUnlocked = memStore.getState().isUnlocked;
    const data = memStore.getState().data;

    // Only return unlocked if there's actually a wallet with data
    // This prevents password from being "valid" when wallet creation wasn't completed
    const hasWallet =
      data &&
      (isModernVault(data)
        ? data.keyrings.length > 0
        : Array.isArray(data) && !!(data[0]?.mnemonic || data[0]?.accounts?.length));

    return isUnlocked && hasWallet;
  };

  fetchTransactionStatus = (paymentId: string, hash: string, gqlUrl?: string): void => {
    this.baseTransactionStatus(getTxStatus, paymentId, hash, gqlUrl);
  };

  fetchQAnetTransactionStatus = (paymentId: string, hash: string, gqlUrl?: string): void => {
    this.baseTransactionStatus(getQATxStatus, paymentId, hash, gqlUrl);
  };

  private static readonly MAX_TX_POLL_RETRIES = 720; // 720 * 5s = 1 hour max

  baseTransactionStatus = (method: (id: string, url?: string) => Promise<any>, paymentId: string, hash: string, gqlUrl?: string, retryCount = 0): void => {
    if (retryCount >= APIService.MAX_TX_POLL_RETRIES) {
      this._clearTxTimer(paymentId);
      return;
    }
    method(paymentId, gqlUrl)
      .then((data) => {
        if (data?.transactionStatus === STATUS.TX_STATUS_INCLUDED) {
          browser.runtime.sendMessage({
            type: FROM_BACK_TO_RECORD,
            action: TX_SUCCESS,
            hash,
          });
          this.notification(hash);
          this._clearTxTimer(paymentId);
        } else if (data?.transactionStatus === STATUS.TX_STATUS_UNKNOWN) {
          this._clearTxTimer(paymentId);
        } else {
          const timer = setTimeout(() => {
            this.baseTransactionStatus(method, paymentId, hash, gqlUrl, retryCount + 1);
          }, 5000);
          this._setTxTimer(paymentId, timer);
        }
      })
      .catch(() => {
        const timer = setTimeout(() => {
          this.baseTransactionStatus(method, paymentId, hash, gqlUrl, retryCount + 1);
        }, 5000);
        this._setTxTimer(paymentId, timer);
      });
  };

  private _setTxTimer(paymentId: string, timer: ReturnType<typeof setTimeout>): void {
    const existing = this.txTimers.get(paymentId);
    if (existing) {
      clearTimeout(existing);
    }
    this.txTimers.set(paymentId, timer);
  }

  private _clearTxTimer(paymentId: string): void {
    const existing = this.txTimers.get(paymentId);
    if (existing) {
      clearTimeout(existing);
      this.txTimers.delete(paymentId);
    }
  }

  private notificationListenerRegistered = false;

  notification = async (hash: string): Promise<void> => {
    let netConfig = await getCurrentNodeConfig();
    if (browser.notifications && !this.notificationListenerRegistered) {
      this.notificationListenerRegistered = true;
      browser.notifications.onClicked.addListener(async (clickId) => {
        const config = await getCurrentNodeConfig();
        const url = config.explorer + "/tx/" + clickId;
        browser.tabs.create({ url });
      });
    }
    const i18nLanguage = i18n.language;
    const localLanguage = await extGetLocal(LANGUAGE_CONFIG);
    if (localLanguage !== i18nLanguage) {
      changeLanguage(localLanguage as string);
    }
    let title = i18n.t("notificationTitle");
    let message = i18n.t("notificationContent");
    browser.notifications
      .create(hash, {
        title: title,
        message: message,
        iconUrl: "/img/logo/128.png",
        type: "basic",
      });
    return;
  };
  getAccountWithoutPrivate = (account: any): AccountInfo => {
    let newAccount = { ...account };
    delete newAccount.privateKey;
    return newAccount;
  };
  _checkWalletRepeat = (accounts: any[], address: string): { error?: string; type?: string } => {
    let isRepeat = accounts.some((item: any) => item.address === address);
    if (isRepeat) {
      return { error: "importRepeat", type: "local" };
    }
    return {};
  };
  _findWalletIndex = (accounts: any[], type: string): number => {
    return accounts.filter((item: any) => item.type === type).length;
  };
  getAllAccount = () => {
    let data = this.getStore().data;
    if (!data) {
      return {
        accounts: { allList: [], commonList: [], watchList: [] },
        currentAddress: "",
      };
    }

    // V1 & V3 compatible
    const accounts = getAllAccountsFromVault(data);
    if (accounts.length === 0) {
      return {
        accounts: { allList: [], commonList: [], watchList: [] },
        currentAddress: "",
      };
    }

    let accountList = this.accountSort(accounts);
    let currentAccount = this.getStore().currentAccount;
    return {
      accounts: accountList,
      currentAddress:
        currentAccount?.address || getCurrentAddressFromVault(data),
    };
  };

  // ============================================
  // Multi-Wallet Methods
  // ============================================

  /**
   * Get all keyrings sorted by creation time for UI display
   * Each keyring represents a wallet group in the Wallet Management page
   */
  getKeyringsList = () => {
    const data = this.getStore().data;

    if (!data || !isModernVault(data)) {
      return { keyrings: [], currentKeyringId: null };
    }

    const sortedKeyrings = sortKeyringsByCreatedAt(data.keyrings);

    // Map keyrings to UI format
    let hdCounter = 0;
    const keyringsForUI = sortedKeyrings.map((keyring) => {
      if (keyring.type === KEYRING_TYPE.HD) hdCounter++;
      // Fallback name for keyrings without a name (migration from older versions)
      let displayName = keyring.name;
      if (!displayName) {
        if (keyring.type === KEYRING_TYPE.HD) {
          displayName = `Wallet ${hdCounter}`;
        } else if (keyring.type === KEYRING_TYPE.IMPORTED) {
          displayName = "Imported Wallet";
        } else if (keyring.type === KEYRING_TYPE.LEDGER) {
          displayName = "Hardware Wallet";
        }
      }

      return {
        id: keyring.id,
        type: keyring.type,
        name: displayName,
        createdAt: keyring.createdAt,
        accountCount: keyring.accounts.length,
        currentAddress: keyring.currentAddress,
        // Only HD keyrings can add new accounts
        canAddAccount: keyring.type === KEYRING_TYPE.HD,
        accounts: keyring.accounts.map((acc) => ({
          address: acc.address,
          name: acc.name,
          hdIndex: (acc as any).hdIndex,
          type: keyringTypeToAccountType(keyring.type),
        })),
      };
    });

    return {
      keyrings: keyringsForUI,
      currentKeyringId: data.currentKeyringId,
    };
  };

  /**
   * Add a new HD wallet (keyring) with its own mnemonic
   * This creates a completely new wallet group
   */
  addHDKeyring = async (mnemonic: string, walletName?: string): Promise<{ keyring?: { id: string; name: string; type: string }; account?: AccountInfo } | ErrorResult> => {
    try {
      let data = this.getStore().data;
      const cryptoKey = this.getStore().cryptoKey;
      if (!cryptoKey) {
        return { error: "walletNotReady", type: "local" };
      }

      if (!isModernVault(data)) {
        return { error: "upgradeRequired", type: "local" };
      }

      const workingData = cloneVaultData(data);
      if (!isModernVault(workingData)) {
        return { error: "upgradeRequired", type: "local" };
      }

      // Generate wallet name if not provided using nextWalletIndex (never decreases)
      const walletIndex = workingData.nextWalletIndex || countHDKeyrings(workingData) + 1;
      const name = walletName || `Wallet ${walletIndex}`;

      // Encrypt mnemonic
      const encryptedMnemonic = await encryptUtils.encryptWithCryptoKey(cryptoKey, mnemonic);

      // Create new HD keyring
      const newKeyring = createHDKeyring(name, encryptedMnemonic);

      // Derive first account
      const wallet = importWalletByMnemonic(mnemonic, 0);

      // Check for duplicate address
      const allAccounts = getAllAccountsFromVault(workingData);
      const existingAccount = allAccounts.find(
        (acc) => acc.address === wallet.pubKey
      );
      if (existingAccount) {
        return {
          error: "repeatTip",
          type: "local",
          existingAccount: {
            address: existingAccount.address,
            accountName: existingAccount.name || existingAccount.accountName,
          },
        };
      }

      // Increment nextWalletIndex only when keyring creation can proceed.
      workingData.nextWalletIndex = walletIndex + 1;

      newKeyring.accounts.push({
        address: wallet.pubKey,
        hdIndex: 0,
        name: "Account 1",
      });
      newKeyring.nextHdIndex = 1;
      newKeyring.currentAddress = wallet.pubKey;

      // Add to vault
      workingData.keyrings.push(newKeyring);
      workingData.currentKeyringId = newKeyring.id;

      // Save
      const encryptData = await encryptUtils.encryptWithCryptoKey(cryptoKey, workingData);
      await save({ keyringData: encryptData });
      await removeValue("pendingCreateMnemonic");

      // Update current account
      const currentAccount = {
        address: wallet.pubKey,
        accountName: "Account 1",
        type: ACCOUNT_TYPE.WALLET_INSIDE,
        hdPath: 0,
        keyringId: newKeyring.id,
      };

      memStore.updateState({ data: workingData, currentAccount });

      return {
        keyring: {
          id: newKeyring.id,
          name: newKeyring.name,
          type: newKeyring.type,
        },
        account: this.getAccountWithoutPrivate(currentAccount),
      };
    } catch (error) {
      console.error("[addHDKeyring] Error:", error);
      return { error: "createFailed", type: "local" };
    }
  };

  /**
   * Rename a keyring (wallet group)
   */
  renameKeyring = async (keyringId: string, newName: string): Promise<{ success?: boolean; keyring?: { id: string; name: string } } | ErrorResult> => {
    try {
      let data = this.getStore().data;

      if (!isModernVault(data)) {
        return { error: "upgradeRequired", type: "local" };
      }

      const workingData = cloneVaultData(data);
      if (!isModernVault(workingData)) {
        return { error: "upgradeRequired", type: "local" };
      }

      const keyring = workingData.keyrings.find((kr) => kr.id === keyringId);
      if (!keyring) {
        return { error: "keyringNotFound", type: "local" };
      }

      keyring.name = newName;

      const encryptData = await encryptUtils.encryptWithCryptoKey(
        this._requireCryptoKey(),
        workingData
      );
      await save({ keyringData: encryptData });
      memStore.updateState({ data: workingData });

      return { success: true, keyring: { id: keyring.id, name: keyring.name } };
    } catch (error) {
      return { error: "renameFailed", type: "local" };
    }
  };

  /**
   * Get mnemonic for a specific HD keyring
   */
  getKeyringMnemonic = async (keyringId: string, password: string): Promise<{ mnemonic?: string } | ErrorResult> => {
    const verifiedKey = await this._checkPasswordAndGetKey(password);
    if (!verifiedKey) {
      return { error: "passwordError", type: "local" };
    }

    const data = this.getStore().data;
    if (!isModernVault(data)) {
      return { error: "upgradeRequired", type: "local" };
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

    const mnemonic = this._requireStringInnerSecret(
      await encryptUtils.decryptWithCryptoKey(verifiedKey, keyring.mnemonic)
    );
    return { mnemonic };
  };

  /**
   * Delete a keyring (wallet group)
   * Requires password verification for security
   * If deleting the last keyring, clears vault and returns isLastKeyring: true
   */
  deleteKeyring = async (keyringId: string, password: string): Promise<{ success?: boolean; isLastKeyring?: boolean; currentAccount?: AccountInfo | null } | ErrorResult> => {
    return this._withAuthOperationLock(async () => {
      try {
        const cryptoKey = await this._checkPasswordAndGetKeyCore(password);
        if (!cryptoKey) {
          return { error: "passwordError", type: "local" };
        }

        let data = this.getStore().data;

        if (!isModernVault(data)) {
          return { error: "upgradeRequired", type: "local" };
        }

        const workingData = cloneVaultData(data);
        if (!isModernVault(workingData)) {
          return { error: "upgradeRequired", type: "local" };
        }

        const keyringIndex = workingData.keyrings.findIndex((kr) => kr.id === keyringId);
        if (keyringIndex === -1) {
          return { error: "keyringNotFound", type: "local" };
        }

        // If deleting the last keyring, clear the vault entirely
        if (workingData.keyrings.length === 1) {
          await this.resetWallet();
          return { success: true, isLastKeyring: true };
        }

        // Remove the keyring
        workingData.keyrings.splice(keyringIndex, 1);

        // Update currentKeyringId and current account if the deleted keyring was current
        let currentAccount = this.getStore().currentAccount || {};
        if (workingData.currentKeyringId === keyringId) {
          workingData.currentKeyringId = workingData.keyrings[0]!.id;
          const newCurrentKeyring = workingData.keyrings.find(
            (kr) => kr.id === workingData.currentKeyringId
          );
          if (newCurrentKeyring && newCurrentKeyring.accounts.length > 0) {
            const firstAccount = newCurrentKeyring.accounts[0]!;
            newCurrentKeyring.currentAddress = firstAccount.address;
            currentAccount = {
              address: firstAccount.address,
              accountName: firstAccount.name,
              type: keyringTypeToAccountType(newCurrentKeyring.type),
              hdPath: (firstAccount as any).hdIndex,
              keyringId: newCurrentKeyring.id,
            };
          }
        }

        // Save (after updating currentKeyringId and currentAddress)
        const encryptData = await encryptUtils.encryptWithCryptoKey(cryptoKey, workingData);
        await save({ keyringData: encryptData });

        memStore.updateState({ data: workingData, currentAccount });

        return {
          success: true,
          currentAccount: this.getAccountWithoutPrivate(currentAccount),
        };
      } catch (error) {
        console.error("[deleteKeyring] Error:", error);
        return { error: "deleteFailed", type: "local" };
      }
    });
  };

  /**
   * Add account to a specific HD keyring
   */
  addAccountToKeyring = async (keyringId: string, accountName?: string): Promise<{ account?: AccountInfo } | ErrorResult> => {
    try {
      let data = this.getStore().data;
      const cryptoKey = this.getStore().cryptoKey;
      if (!cryptoKey) {
        return { error: "walletNotReady", type: "local" };
      }

      if (!isModernVault(data)) {
        return { error: "upgradeRequired", type: "local" };
      }

      const workingData = cloneVaultData(data);
      if (!isModernVault(workingData)) {
        return { error: "upgradeRequired", type: "local" };
      }

      const keyring = workingData.keyrings.find((kr) => kr.id === keyringId);
      if (!keyring) {
        return { error: "keyringNotFound", type: "local" };
      }

      if (keyring.type !== KEYRING_TYPE.HD) {
        return { error: "cannotAddToNonHD", type: "local" };
      }

      // Derive next account
      const mnemonic = this._requireStringInnerSecret(
        await encryptUtils.decryptWithCryptoKey(cryptoKey, keyring.mnemonic)
      );
      const nextIndex = keyring.nextHdIndex || keyring.accounts.length;
      const wallet = importWalletByMnemonic(mnemonic, nextIndex);

      // Check for duplicate
      const allAccounts = getAllAccountsFromVault(workingData);
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
      workingData.currentKeyringId = keyringId;

      // Save
      const encryptData = await encryptUtils.encryptWithCryptoKey(cryptoKey, workingData);
      await save({ keyringData: encryptData });

      const currentAccount = {
        address: wallet.pubKey,
        accountName: name,
        type: ACCOUNT_TYPE.WALLET_INSIDE,
        hdPath: nextIndex,
        keyringId: keyringId,
      };

      memStore.updateState({ data: workingData, currentAccount });

      return { account: this.getAccountWithoutPrivate(currentAccount) };
    } catch (error) {
      console.error("[addAccountToKeyring] Error:", error);
      return { error: "addFailed", type: "local" };
    }
  };

  /**
   * Get current vault version (v1 or v3)
   * Used by UI to check if vault upgrade is needed before multi-wallet operations
   */
  getVaultVersion = () => {
    const data = this.getStore().data;
    return { version: getVaultVersion(data) };
  };

  /**
   * Try to upgrade vault from v1 to v3
   * Returns success status and any error message
   */
  tryUpgradeVault = async () => {
    return this._withAuthOperationLock(async () => {
      try {
        const data = this.getStore().data;
        const cryptoKey = this.getStore().cryptoKey;

        if (!data) {
          return { success: false, error: "noVaultData", type: "local" };
        }
        if (!cryptoKey) {
          return { success: false, error: "walletNotReady", type: "local" };
        }

        // Already V3
        if (isModernVault(data)) {
          const workingData = cloneVaultData(data);
          if (!isModernVault(workingData)) {
            return { success: false, error: "upgradeFailed", type: "local" };
          }
          // Ensure version field is up to date
          if (workingData.version < VAULT_VERSION) {
            workingData.version = VAULT_VERSION;
            const encryptData = await encryptUtils.encryptWithCryptoKey(cryptoKey, workingData);
            await save({ keyringData: encryptData });
            memStore.updateState({ data: workingData });
          }
          return { success: true, version: "v3" };
        }

        // Try to migrate
        const { vault: normalizedData } = normalizeVault(cloneVaultData(data));

        if (!isModernVault(normalizedData)) {
          return { success: false, error: "upgradeFailed", type: "local" };
        }

        for (const keyring of normalizedData.keyrings) {
          const kr = keyring as any;
          if (kr.mnemonic && !this._isV3Encrypted(kr.mnemonic)) {
            return { success: false, error: "innerSecretsNotMigrated", type: "local" };
          }
          for (const account of keyring.accounts) {
            const acc = account as any;
            if (acc.privateKey && !this._isV3Encrypted(acc.privateKey)) {
              return { success: false, error: "innerSecretsNotMigrated", type: "local" };
            }
          }
        }

        normalizedData.version = VAULT_VERSION;

        // Validate the migrated data
        const validation = validateVault(normalizedData);
        if (!validation.valid) {
          return { success: false, error: "validationFailed", type: "local" };
        }

        // Save upgraded data
        const encryptData = await encryptUtils.encryptWithCryptoKey(cryptoKey, normalizedData);
        await save({ keyringData: encryptData });

        // Update memory store
        memStore.updateState({ data: normalizedData });

        return { success: true, version: "v3" };
      } catch (error) {
        return { success: false, error: "upgradeFailed", type: "local" };
      }
    });
  };

  accountSort = (accountList: AccountInfo[]): SortedAccountList => {
    let newList = accountList;
    let createList: AccountInfo[] = [],
      importList: AccountInfo[] = [],
      ledgerList: AccountInfo[] = [],
      watchList: AccountInfo[] = [];
    newList.forEach((item) => {
      let newItem = this.getAccountWithoutPrivate(item);
      switch (newItem.type) {
        case ACCOUNT_TYPE.WALLET_INSIDE:
          createList.push(newItem);
          break;
        case ACCOUNT_TYPE.WALLET_OUTSIDE:
          importList.push(newItem);
          break;
        case ACCOUNT_TYPE.WALLET_LEDGER:
          ledgerList.push(newItem);
          break;
        case ACCOUNT_TYPE.WALLET_WATCH:
          watchList.push(newItem);
          break;
        default:
          break;
      }
    });

    let commonList = [...createList, ...importList, ...ledgerList];
    return { allList: [...commonList, ...watchList], commonList, watchList };
  };
  addHDNewAccount = async (accountName: string): Promise<AccountInfo | ErrorResult | undefined> => {
    try {
      const data = this.getStore().data;
      const version = getVaultVersion(data);

      if (version === "v3") {
        // V3: add account in HD keyring
        return this._addHDNewAccountModern(data, accountName);
      }
      if (!version) {
        return { error: "invalidVault", type: "local" };
      }

      // V1: legacy logic
      const workingLegacyData = cloneVaultData(data);
      let accounts = workingLegacyData[0].accounts;

      let createList = accounts.filter((item: any, index: any) => {
        return item.type === ACCOUNT_TYPE.WALLET_INSIDE;
      });
      if (createList.length === 0) {
        return { error: "noHDAccounts", type: "local" };
      }

      const validHdPaths = createList
        .map((item: any) => item.hdPath)
        .filter((idx: any): idx is number => typeof idx === "number" && Number.isFinite(idx));
      let lastHdIndex =
        validHdPaths.length > 0
          ? Math.max(...validHdPaths) + 1
          : createList.length;
      const validTypeIndexes = createList
        .map((item: any) => item.typeIndex)
        .filter((idx: any): idx is number => typeof idx === "number" && Number.isFinite(idx));
      let typeIndex =
        validTypeIndexes.length > 0
          ? Math.max(...validTypeIndexes) + 1
          : createList.length + 1;

      let mnemonicEn = workingLegacyData[0].mnemonic;
      if (!this._isV3Encrypted(mnemonicEn)) {
        return { error: "innerSecretsNotMigrated", type: "local" };
      }
      let mnemonic = await this._decryptInnerSecret(mnemonicEn);
      let wallet = importWalletByMnemonic(mnemonic, lastHdIndex);
      let priKeyEncrypt = await encryptUtils.encryptWithCryptoKey(
        this._requireCryptoKey(),
        wallet.priKey
      );

      let sameIndex = -1;
      let sameAccount: any = {};
      for (let index = 0; index < accounts.length; index++) {
        const tempAccount = accounts[index];
        if (tempAccount.address === wallet.pubKey) {
          sameIndex = index;
          sameAccount = tempAccount;
        }
      }

      if (sameIndex !== -1) {
        let backAccount = {
          accountName: sameAccount.accountName,
          address: sameAccount.address,
        };
        let error = {
          error: "importRepeat",
          type: "local",
          account: backAccount,
        };
        return error;
      }

      let account = {
        address: wallet.pubKey,
        privateKey: priKeyEncrypt,
        type: ACCOUNT_TYPE.WALLET_INSIDE,
        hdPath: lastHdIndex,
        accountName,
        typeIndex: typeIndex,
      };

      workingLegacyData[0].currentAddress = account.address;
      workingLegacyData[0].accounts.push(account);
      let encryptData = await encryptUtils.encryptWithCryptoKey(
        this._requireCryptoKey(),
        workingLegacyData
      );

      await save({ keyringData: encryptData });
      memStore.updateState({ data: workingLegacyData, currentAccount: this.getAccountWithoutPrivate(account) });
      return this.getAccountWithoutPrivate(account);
    } catch (error) {
      console.error("[addHDNewAccount] Error:", error);
      return { error: "addFailed", type: "local" };
    }
  };

  // V3: add HD account
  _addHDNewAccountModern = async (data: any, accountName: string): Promise<AccountInfo | ErrorResult> => {
    const workingData = cloneVaultData(data);
    // Find current HD keyring (use currentKeyringId, fallback to first HD keyring)
    let hdKeyring = null;
    if (workingData.currentKeyringId) {
      hdKeyring = workingData.keyrings.find(
        (kr: any) => kr.id === workingData.currentKeyringId && kr.type === KEYRING_TYPE.HD
      );
    }
    // Fallback to first HD keyring if current is not HD or not found
    if (!hdKeyring) {
      hdKeyring = workingData.keyrings.find((kr: any) => kr.type === KEYRING_TYPE.HD);
    }
    if (!hdKeyring) {
      return { error: "noHDKeyring", type: "local" };
    }

    // Get next HD index
    const hdKr = hdKeyring as any;
    const nextHdIndex = hdKr.nextHdIndex || hdKeyring.accounts.length;

    // Decrypt mnemonic and derive new account
    const mnemonic = this._requireStringInnerSecret(
      await encryptUtils.decryptWithCryptoKey(
        this._requireCryptoKey(),
        hdKr.mnemonic
      )
    );
    const wallet = importWalletByMnemonic(mnemonic, nextHdIndex);

    // Check for duplicate
    const allAccounts = getAllAccountsFromVault(workingData);
    const existingAccount = allAccounts.find(
      (acc) => acc.address === wallet.pubKey
    );
    if (existingAccount) {
      return {
        error: "importRepeat",
        type: "local",
        account: {
          accountName: existingAccount.accountName,
          address: existingAccount.address,
        },
      };
    }

    // Modern vault HD accounts don't store private keys
    const newAccount = {
      address: wallet.pubKey,
      name: accountName,
      hdIndex: nextHdIndex,
    };

    // Update keyring
    hdKeyring.accounts.push(newAccount);
    hdKeyring.nextHdIndex = nextHdIndex + 1;
    hdKeyring.currentAddress = newAccount.address;
    workingData.currentKeyringId = hdKeyring.id;

    // Save
    const encryptData = await encryptUtils.encryptWithCryptoKey(
      this._requireCryptoKey(),
      workingData
    );

    // Convert to UI format
    const accountForUI = {
      address: newAccount.address,
      accountName: newAccount.name,
      type: ACCOUNT_TYPE.WALLET_INSIDE,
      hdPath: (newAccount as any).hdIndex,
      keyringId: hdKeyring.id,
    };

    await save({ keyringData: encryptData });
    memStore.updateState({ data: workingData, currentAccount: accountForUI });
    return this.getAccountWithoutPrivate(accountForUI);
  };
  addImportAccount = async (privateKey: string, accountName: string): Promise<any> => {
    try {
      if (!this.getStore().cryptoKey) {
        return { error: "walletNotReady", type: "local" };
      }
      let wallet = await importWalletByPrivateKey(privateKey);
      let data = this.getStore().data;
      const version = getVaultVersion(data);

      // For first-time import or V3 vault, use V3 logic
      if (version === "v3" || !data) {
        // Create new V3 vault if no data exists
        if (!data) {
          data = createEmptyVault();
        }
        return this._addImportAccountModern(data, wallet, accountName);
      }
      if (!version) {
        return { error: "invalidVault", type: "local" };
      }

      // V1: legacy logic
      const workingLegacyData = cloneVaultData(data);
      let accounts = workingLegacyData[0].accounts;
      let error = this._checkWalletRepeat(accounts, wallet.pubKey);
      if (error.error) {
        return error as any;
      }
      let typeIndex = this._findWalletIndex(
        accounts,
        ACCOUNT_TYPE.WALLET_OUTSIDE
      );

      let priKeyEncrypt = await encryptUtils.encryptWithCryptoKey(
        this._requireCryptoKey(),
        wallet.priKey
      );
      const account = {
        address: wallet.pubKey,
        privateKey: priKeyEncrypt,
        type: ACCOUNT_TYPE.WALLET_OUTSIDE,
        accountName,
        typeIndex,
      };
      workingLegacyData[0].currentAddress = account.address;
      workingLegacyData[0].accounts.push(account);
      let encryptData = await encryptUtils.encryptWithCryptoKey(
        this._requireCryptoKey(),
        workingLegacyData
      );

      await save({ keyringData: encryptData });
      memStore.updateState({ data: workingLegacyData, currentAccount: this.getAccountWithoutPrivate(account) });
      return this.getAccountWithoutPrivate(account);
    } catch (error) {
      if (error instanceof Error && error.message.includes("cryptoKey")) {
        return { error: "walletNotReady", type: "local" };
      }
      return { error: "privateError", type: "local" };
    }
  };

  // V3: import private key account
  _addImportAccountModern = async (data: any, wallet: any, accountName: string): Promise<AccountInfo | ErrorResult> => {
    const workingData = cloneVaultData(data);
    // Check for duplicate
    const allAccounts = getAllAccountsFromVault(workingData);
    const existingAccount = allAccounts.find(
      (acc) => acc.address === wallet.pubKey
    );
    if (existingAccount) {
      return {
        error: "importRepeat",
        type: "local",
        existingAccount: {
          address: existingAccount.address,
          accountName: existingAccount.name || existingAccount.accountName,
        },
      };
    }

    // Encrypt private key
    const priKeyEncrypt = await encryptUtils.encryptWithCryptoKey(
      this._requireCryptoKey(),
      wallet.priKey
    );

    // Find or create imported keyring
    let importedKeyring = workingData.keyrings.find(
      (kr: any) => kr.type === KEYRING_TYPE.IMPORTED
    );
    if (!importedKeyring) {
      importedKeyring = {
        id: generateUUID(),
        type: KEYRING_TYPE.IMPORTED,
        name: "Imported",
        accounts: [],
        currentAddress: "",
        createdAt: Date.now(),
      };
      workingData.keyrings.push(importedKeyring);
    }

    // Generate default name if not provided
    const importedCount = importedKeyring.accounts.length + 1;
    const finalAccountName = accountName || `Imported ${importedCount}`;

    // Add account
    const newAccount = {
      address: wallet.pubKey,
      name: finalAccountName,
      privateKey: priKeyEncrypt,
    };
    importedKeyring.accounts.push(newAccount);
    importedKeyring.currentAddress = newAccount.address;
    workingData.currentKeyringId = importedKeyring.id;

    // Save
    const encryptData = await encryptUtils.encryptWithCryptoKey(
      this._requireCryptoKey(),
      workingData
    );

    const accountForUI = {
      address: newAccount.address,
      accountName: newAccount.name,
      type: ACCOUNT_TYPE.WALLET_OUTSIDE,
      keyringId: importedKeyring.id,
    };

    await save({ keyringData: encryptData });
    memStore.updateState({ data: workingData, currentAccount: accountForUI });
    return this.getAccountWithoutPrivate(accountForUI);
  };
  addAccountByKeyStore = async (keystore: string, password: string, accountName: string): Promise<AccountInfo | ErrorResult> => {
    try {
      let wallet: any = await importWalletByKeystore(keystore, password);
      if (wallet.error) {
        return wallet;
      }
      let currentAccount = await this.addImportAccount(
        wallet.priKey,
        accountName
      );
      return currentAccount;
    } catch (error) {
      return { error: "importFailed", type: "local" };
    }
  };
  addLedgerAccount = async (address: string, accountName: string, ledgerPathAccountIndex: number): Promise<AccountInfo | ErrorResult> => {
    try {
      if (!this.getStore().cryptoKey) {
        return { error: "walletNotReady", type: "local" };
      }
      let data = this.getStore().data;
      const version = getVaultVersion(data);

      // For first-time Ledger setup or V3 vault, use V3 logic
      if (version === "v3" || !data) {
        // Create new V3 vault if no data exists
        if (!data) {
          data = createEmptyVault();
        }
        return this._addLedgerAccountModern(
          data,
          address,
          accountName,
          ledgerPathAccountIndex
        );
      }
      if (!version) {
        return { error: "invalidVault", type: "local" };
      }

      // V1: legacy logic
      const workingLegacyData = cloneVaultData(data);
      let accounts = workingLegacyData[0].accounts;
      let error = this._checkWalletRepeat(accounts, address);
      if (error.error) {
        return error as any;
      }
      let typeIndex = this._findWalletIndex(
        accounts,
        ACCOUNT_TYPE.WALLET_LEDGER
      );

      const account = {
        address: address,
        type: ACCOUNT_TYPE.WALLET_LEDGER,
        accountName,
        hdPath: ledgerPathAccountIndex,
        typeIndex,
      };
      workingLegacyData[0].currentAddress = account.address;
      workingLegacyData[0].accounts.push(account);
      let encryptData = await encryptUtils.encryptWithCryptoKey(
        this._requireCryptoKey(),
        workingLegacyData
      );

      await save({ keyringData: encryptData });
      memStore.updateState({ data: workingLegacyData, currentAccount: account });
      return this.getAccountWithoutPrivate(account);
    } catch (error) {
      if (error instanceof Error && error.message.includes("cryptoKey")) {
        return { error: "walletNotReady", type: "local" };
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { error: errorMessage || "Import failed" };
    }
  };

  // V3: add Ledger account
  _addLedgerAccountModern = async (
    data: any,
    address: string,
    accountName: string,
    ledgerPathAccountIndex: number
  ): Promise<AccountInfo | ErrorResult> => {
    const workingData = cloneVaultData(data);
    const allAccounts = getAllAccountsFromVault(workingData);
    const existingAccount = allAccounts.find((acc) => acc.address === address);
    if (existingAccount) {
      return {
        error: "importRepeat",
        type: "local",
        existingAccount: {
          address: existingAccount.address,
          accountName: existingAccount.name || existingAccount.accountName,
        },
      };
    }

    let ledgerKeyring = workingData.keyrings.find(
      (kr: any) => kr.type === KEYRING_TYPE.LEDGER
    );
    if (!ledgerKeyring) {
      ledgerKeyring = {
        id: generateUUID(),
        type: KEYRING_TYPE.LEDGER,
        name: "Ledger",
        accounts: [],
        currentAddress: "",
        createdAt: Date.now(),
      };
      workingData.keyrings.push(ledgerKeyring);
    }

    // Generate default name if not provided
    const ledgerCount = ledgerKeyring.accounts.length + 1;
    const finalAccountName = accountName || `Ledger ${ledgerCount}`;

    const newAccount = {
      address: address,
      name: finalAccountName,
      hdIndex: ledgerPathAccountIndex,
    };
    ledgerKeyring.accounts.push(newAccount);
    ledgerKeyring.currentAddress = newAccount.address;
    workingData.currentKeyringId = ledgerKeyring.id;

    const encryptData = await encryptUtils.encryptWithCryptoKey(
      this._requireCryptoKey(),
      workingData
    );
    const accountForUI = {
      address: newAccount.address,
      accountName: newAccount.name,
      type: ACCOUNT_TYPE.WALLET_LEDGER,
      hdPath: (newAccount as any).hdIndex,
      keyringId: ledgerKeyring.id,
    };

    await save({ keyringData: encryptData });
    memStore.updateState({ data: workingData, currentAccount: accountForUI });
    return this.getAccountWithoutPrivate(accountForUI);
  };
  setCurrentAccount = async (address: string): Promise<{ accountList: SortedAccountList; currentAccount: AccountInfo; currentAddress: string }> => {
    try {
      const data = this.getStore().data;
      const version = getVaultVersion(data);

      if (version === "v3") {
        return this._setCurrentAccountModern(data, address);
      }

      // V1: legacy logic
      const workingLegacyData = cloneVaultData(data);
      let accounts = workingLegacyData[0].accounts;
      let currentAccount = {};
      for (let index = 0; index < accounts.length; index++) {
        let account = accounts[index];
        if (account.address === address) {
          currentAccount = account;
          workingLegacyData[0].currentAddress = address;

          let encryptData = await encryptUtils.encryptWithCryptoKey(
            this._requireCryptoKey(),
            workingLegacyData
          );
          await save({ keyringData: encryptData });
          // Store account without privateKey in memStore to avoid leaking
          // encrypted secrets into in-memory state
          memStore.updateState({ data: workingLegacyData, currentAccount: this.getAccountWithoutPrivate(account) });
          break;
        }
      }

      let accountList = this.accountSort(workingLegacyData[0].accounts);
      return {
        accountList: accountList,
        currentAccount: this.getAccountWithoutPrivate(currentAccount),
        currentAddress: address,
      };
    } catch (error) {
      console.error("[setCurrentAccount] Error:", error);
      return { accountList: { allList: [], commonList: [], watchList: [] }, currentAccount: {} as AccountInfo, currentAddress: address };
    }
  };

  // V3: set current account
  _setCurrentAccountModern = async (data: any, address: string): Promise<{ accountList: SortedAccountList; currentAccount: AccountInfo; currentAddress: string }> => {
    try {
      const workingData = cloneVaultData(data);
      let currentAccount = null;

      for (const keyring of workingData.keyrings) {
        const account = keyring.accounts.find((acc: any) => acc.address === address);
        if (account) {
          keyring.currentAddress = address;
          workingData.currentKeyringId = keyring.id;
          currentAccount = {
            address: account.address,
            accountName: account.name,
            type: keyringTypeToAccountType(keyring.type),
            hdPath: (account as any).hdIndex,
            keyringId: keyring.id,
          };
          break;
        }
      }

      if (currentAccount) {
        const encryptData = await encryptUtils.encryptWithCryptoKey(
          this._requireCryptoKey(),
          workingData
        );
        await save({ keyringData: encryptData });
        memStore.updateState({ data: workingData, currentAccount });
      }

      const allAccounts = getAllAccountsFromVault(workingData);
      const accountList = this.accountSort(allAccounts);
      return {
        accountList: accountList,
        currentAccount: this.getAccountWithoutPrivate(currentAccount || {}),
        currentAddress: address,
      };
    } catch (error) {
      console.error("[_setCurrentAccountModern] Error:", error);
      return { accountList: { allList: [], commonList: [], watchList: [] }, currentAccount: {} as AccountInfo, currentAddress: address };
    }
  };
  changeAccountName = async (address: string, accountName: string): Promise<{ account: AccountInfo }> => {
    try {
      const data = this.getStore().data;
      const version = getVaultVersion(data);

      if (version === "v3") {
        return this._changeAccountNameModern(data, address, accountName);
      }

      // V1: legacy logic
      const workingLegacyData = cloneVaultData(data);
      let accounts = workingLegacyData[0].accounts;
      let account: AccountInfo | undefined;
      for (let index = 0; index < accounts.length; index++) {
        if (accounts[index].address === address) {
          workingLegacyData[0].accounts[index].accountName = accountName;
          account = accounts[index];
          let encryptData = await encryptUtils.encryptWithCryptoKey(
            this._requireCryptoKey(),
            workingLegacyData
          );
          await save({ keyringData: encryptData });
          const current = this.getStore().currentAccount;
          if (current?.address === address) {
            memStore.updateState({ data: workingLegacyData, currentAccount: { ...current, accountName } });
          } else {
            memStore.updateState({ data: workingLegacyData });
          }
          break;
        }
      }
      if (!account) {
        return { account: {} as AccountInfo };
      }
      let newAccount = this.getAccountWithoutPrivate(account);
      return { account: newAccount };
    } catch (error) {
      console.error("[changeAccountName] Error:", error);
      return { account: {} as AccountInfo };
    }
  };

  // V3: change account name
  _changeAccountNameModern = async (data: any, address: string, accountName: string): Promise<{ account: AccountInfo }> => {
    try {
      const workingData = cloneVaultData(data);
      let account = null;
      for (const keyring of workingData.keyrings) {
        const acc = keyring.accounts.find((a: any) => a.address === address);
        if (acc) {
          acc.name = accountName;
          account = {
            address: acc.address,
            accountName: acc.name,
            type: keyringTypeToAccountType(keyring.type),
            hdPath: (acc as any).hdIndex,
          };
          break;
        }
      }

      if (account) {
        const encryptData = await encryptUtils.encryptWithCryptoKey(
          this._requireCryptoKey(),
          workingData
        );
        await save({ keyringData: encryptData });
        const current = this.getStore().currentAccount;
        if (current?.address === address) {
          memStore.updateState({ data: workingData, currentAccount: { ...current, accountName } });
        } else {
          memStore.updateState({ data: workingData });
        }
      }

      return { account: this.getAccountWithoutPrivate(account || {}) };
    } catch (error) {
      console.error("[_changeAccountNameModern] Error:", error);
      return { account: {} as AccountInfo };
    }
  };
  deleteAccount = async (address: string, password: string): Promise<AccountInfo | ErrorResult | { isReset: boolean }> => {
    return this._withAuthOperationLock(async () => {
      try {
        const data = this.getStore().data;
        const version = getVaultVersion(data);

        if (version === "v3") {
          return this._deleteAccountModern(data, address, password);
        }

        // V1: legacy logic
        const workingLegacyData = cloneVaultData(data);
        let accounts = workingLegacyData[0].accounts;
        let deleteAccount = accounts.filter((item: any, index: any) => {
          return item.address === address;
        });
        deleteAccount = deleteAccount.length > 0 ? deleteAccount[0] : {};
        let canDelete = false;
        if (
          deleteAccount &&
          (deleteAccount.type === ACCOUNT_TYPE.WALLET_WATCH ||
            deleteAccount.type === ACCOUNT_TYPE.WALLET_LEDGER)
        ) {
          canDelete = true;
        } else {
          let isCorrect = await this._checkPasswordCore(password);
          if (isCorrect) {
            canDelete = true;
          }
        }
        if (canDelete) {
          accounts = accounts.filter((item: any, index: any) => {
            return item.address !== address;
          });
          if (accounts.length === 0) {
            await this.resetWallet();
            return { isReset: true };
          }
          let currentAccount = this.getStore().currentAccount;
          if (address === currentAccount.address) {
            currentAccount = this.getAccountWithoutPrivate(accounts[0]);
            workingLegacyData[0].currentAddress = currentAccount.address;
          }
          workingLegacyData[0].accounts = accounts;
          let encryptData = await encryptUtils.encryptWithCryptoKey(
            this._requireCryptoKey(),
            workingLegacyData
          );
          await save({ keyringData: encryptData });
          memStore.updateState({ data: workingLegacyData, currentAccount });
          return this.getAccountWithoutPrivate(currentAccount);
        } else {
          return { error: "passwordError", type: "local" };
        }
      } catch (error) {
        console.error("[deleteAccount] Error:", error);
        return { error: "deleteFailed", type: "local" };
      }
    });
  };

  _deleteAccountModern = async (data: any, address: string, password: string): Promise<AccountInfo | ErrorResult | { isReset: boolean }> => {
    try {
      const workingData = cloneVaultData(data);
      // Find account to delete
      let targetKeyring = null;
      let targetAccount = null;

      for (const keyring of workingData.keyrings) {
        const acc = keyring.accounts.find((a: any) => a.address === address);
        if (acc) {
          targetKeyring = keyring;
          targetAccount = {
            ...acc,
            type: keyringTypeToAccountType(keyring.type),
          };
          break;
        }
      }

      if (!targetAccount) {
        return { error: "accountNotFound", type: "local" };
      }

      // Check if can delete
      let canDelete = false;
      if (
        targetAccount.type === ACCOUNT_TYPE.WALLET_WATCH ||
        targetAccount.type === ACCOUNT_TYPE.WALLET_LEDGER
      ) {
        canDelete = true;
      } else {
        canDelete = await this._checkPasswordCore(password);
      }

      if (!canDelete) {
        return { error: "passwordError", type: "local" };
      }

      // Remove account from keyring
      targetKeyring.accounts = targetKeyring.accounts.filter(
        (a: any) => a.address !== address
      );

      // Keep keyring-level currentAddress valid when deleting a non-current-global account.
      if (
        targetKeyring.accounts.length > 0 &&
        targetKeyring.currentAddress === address
      ) {
        targetKeyring.currentAddress = targetKeyring.accounts[0].address;
      }

      // If keyring is empty, remove keyring
      const wasCurrentKeyring = workingData.currentKeyringId === targetKeyring.id;
      if (targetKeyring.accounts.length === 0) {
        workingData.keyrings = workingData.keyrings.filter((kr: any) => kr.id !== targetKeyring.id);
      }

      if (workingData.keyrings.length === 0) {
        await this.resetWallet();
        return { isReset: true };
      }

      // Update current account
      let currentAccount = this.getStore().currentAccount || {};
      const deletedCurrentAccount = address === currentAccount.address;

      // Need to update current account if:
      // 1. Deleted account was the current account, OR
      // 2. Current keyring was removed (deleted the last account in current keyring)
      if (deletedCurrentAccount || (wasCurrentKeyring && targetKeyring.accounts.length === 0)) {
        const allAccounts = getAllAccountsFromVault(workingData);
        if (allAccounts.length > 0) {
          const firstAcc = allAccounts[0]!;
          currentAccount = {
            address: firstAcc.address,
            accountName: firstAcc.accountName,
            type: firstAcc.type,
            hdPath: firstAcc.hdPath,
            keyringId: firstAcc.keyringId,
          };
          // Update currentKeyringId and currentAddress
          for (const keyring of workingData.keyrings) {
            if (keyring.accounts.find((a: any) => a.address === firstAcc.address)) {
              workingData.currentKeyringId = keyring.id;
              keyring.currentAddress = firstAcc.address;
              break;
            }
          }
        } else {
          currentAccount = {};
        }
      }

      const encryptData = await encryptUtils.encryptWithCryptoKey(
        this._requireCryptoKey(),
        workingData
      );
      await save({ keyringData: encryptData });
      memStore.updateState({ data: workingData, currentAccount });
      return this.getAccountWithoutPrivate(currentAccount);
    } catch (error) {
      console.error("[_deleteAccountModern] Error:", error);
      return { error: "deleteFailed", type: "local" };
    }
  };
  getMnemonic = async (pwd: string): Promise<string | ErrorResult> => {
    try {
      const verifiedKey = await this._checkPasswordAndGetKey(pwd);
      if (!verifiedKey) {
        return { error: "passwordError", type: "local" };
      }
      let data = this.getStore().data;
      const currentAccount = this.getStore().currentAccount;
      const preferredKeyringId =
        isModernVault(data) && currentAccount?.keyringId
          ? String(currentAccount.keyringId)
          : null;
      // V1 & V3 compatible
      let mnemonicEn = getMnemonicFromVault(data, preferredKeyringId);
      if (!mnemonicEn) {
        return { error: "noMnemonic", type: "local" };
      }
      let mnemonic = await this._decryptInnerSecret(mnemonicEn, pwd, verifiedKey);
      return mnemonic;
    } catch (error) {
      console.error("[getMnemonic] Error:", error);
      return { error: "decryptFailed", type: "local" };
    }
  };
  updateSecPassword = async (oldPwd: string, pwd: string): Promise<{ code?: number } | ErrorResult> => {
    return this._withAuthOperationLock(async () => {
      try {
        const oldVerifiedKey = await this._checkPasswordAndGetKeyCore(oldPwd);
        if (!oldVerifiedKey) {
          return { error: "passwordError", type: "local" };
        }

        let data = this.getStore().data;
        const version = getVaultVersion(data);

        if (version === "v3") {
          return await this._updateSecPasswordModern(data, pwd, undefined, oldVerifiedKey);
        }

        // V1: legacy logic - decrypt with old CryptoKey, re-encrypt with new CryptoKey
        // Uses two-phase pattern: collect all re-encrypted values first, then apply.
        const workingLegacyData = cloneVaultData(data);
        let accounts = workingLegacyData[0].accounts;
        let mnemonicEn = workingLegacyData[0].mnemonic;
        let mnemonic = await this._decryptInnerSecret(mnemonicEn, oldPwd, oldVerifiedKey);

        // Derive new CryptoKey from new password
        const derived = await encryptUtils.deriveSessionKey(pwd);
        const newCryptoKey = derived.key;
        const newVaultSalt = derived.salt;

        // Phase 1: Re-encrypt all secrets into temporary structures.
        // If any operation fails, data is untouched.
        const newMnemonic = await encryptUtils.encryptWithCryptoKey(newCryptoKey, mnemonic);
        let currentAccount = this.getStore().currentAccount;
        let newAccounts = [];
        for (let index = 0; index < accounts.length; index++) {
          const account = accounts[index];
          let privateKeyEn = account.privateKey;
          let newPrivateKey;
          if (privateKeyEn) {
            const pk = await this._decryptInnerSecret(privateKeyEn, oldPwd, oldVerifiedKey);
            newPrivateKey = await encryptUtils.encryptWithCryptoKey(newCryptoKey, pk);
          }
          let newAccount = { ...account };
          if (newPrivateKey) {
            newAccount.privateKey = newPrivateKey;
          }
          newAccounts.push(newAccount);
        }

        // Phase 2: All operations succeeded — apply updates atomically.
        workingLegacyData[0].accounts = newAccounts;
        workingLegacyData[0].mnemonic = newMnemonic;

        // Try to normalize to modern vault after password rotation.
        let dataToSave: any = workingLegacyData;
        const normalized = normalizeVault(workingLegacyData);
        if (normalized.migrated) {
          const validation = validateVault(normalized.vault);
          if (validation.valid) {
            dataToSave = normalized.vault;
            const migratedCurrentAddress =
              currentAccount?.address || this.getCurrentAddressFromModernVault(dataToSave);
            const migratedCurrentAccount = this.getCurrentAccountFromModernVault(
              dataToSave,
              migratedCurrentAddress || ""
            );
            currentAccount = this.getAccountWithoutPrivate(
              migratedCurrentAccount || currentAccount || {}
            );
          }
        }

        let encryptData = await encryptUtils.encryptWithCryptoKey(newCryptoKey, dataToSave);

        await save({ keyringData: encryptData, vaultSalt: newVaultSalt });
        memStore.updateState({
          data: dataToSave,
          cryptoKey: newCryptoKey,
          vaultSalt: newVaultSalt,
          currentAccount: this.getAccountWithoutPrivate(currentAccount || {}),
        });
        return { code: 0 };
      } catch (error) {
        return { error: "passwordError", type: "local" };
      }
    });
  };

  _updateSecPasswordModern = async (data: any, pwd: string, oldPwd?: string, preVerifiedKey?: CryptoKey): Promise<{ code?: number } | ErrorResult> => {
    try {
      const oldCryptoKey = preVerifiedKey || await this._requireOrDeriveCryptoKey(oldPwd);
      const workingData = cloneVaultData(data);
      let currentAccount = this.getStore().currentAccount;

      // Derive new CryptoKey from new password
      const derived = await encryptUtils.deriveSessionKey(pwd);
      const newCryptoKey = derived.key;
      const newVaultSalt = derived.salt;

      // Phase 1: Decrypt all secrets and re-encrypt with new key into a temporary list.
      // If any operation fails, data is untouched.
      const updates: Array<{ target: any; key: string; value: string }> = [];

      for (const keyring of workingData.keyrings) {
        const kr = keyring as any;
        if (kr.mnemonic) {
          if (!this._isV3Encrypted(kr.mnemonic)) {
            return { error: "innerSecretsNotMigrated", type: "local" };
          }
          const mnemonic = this._requireStringInnerSecret(
            await encryptUtils.decryptWithCryptoKey(oldCryptoKey, kr.mnemonic)
          );
          const encrypted = await encryptUtils.encryptWithCryptoKey(newCryptoKey, mnemonic);
          updates.push({ target: kr, key: 'mnemonic', value: encrypted });
        }

        for (const account of keyring.accounts) {
          const acc = account as any;
          if (acc.privateKey) {
            if (!this._isV3Encrypted(acc.privateKey)) {
              return { error: "innerSecretsNotMigrated", type: "local" };
            }
            const privateKey = this._requireStringInnerSecret(
              await encryptUtils.decryptWithCryptoKey(
                oldCryptoKey,
                acc.privateKey
              )
            );
            const encrypted = await encryptUtils.encryptWithCryptoKey(newCryptoKey, privateKey);
            updates.push({ target: acc, key: 'privateKey', value: encrypted });
          }
        }
      }

      // Phase 2: All operations succeeded — apply updates atomically.
      for (const { target, key, value } of updates) {
        target[key] = value;
      }

      const encryptData = await encryptUtils.encryptWithCryptoKey(newCryptoKey, workingData);

      const currentAddress = currentAccount?.address || this.getCurrentAddressFromModernVault(workingData);
      const resolvedCurrentAccount = this.getCurrentAccountFromModernVault(
        workingData,
        currentAddress || ""
      );
      currentAccount = this.getAccountWithoutPrivate(
        resolvedCurrentAccount || currentAccount || {}
      );

      await save({ keyringData: encryptData, vaultSalt: newVaultSalt });
      memStore.updateState({
        data: workingData,
        cryptoKey: newCryptoKey,
        vaultSalt: newVaultSalt,
        currentAccount,
      });
      return { code: 0 };
    } catch (error) {
      console.error("[_updateSecPasswordModern] Error:", error);
      return { error: "passwordError", type: "local" };
    }
  };
  getPrivateKey = async (address: string, pwd: string): Promise<string | ErrorResult> => {
    try {
      const verifiedKey = await this._checkPasswordAndGetKey(pwd);
      if (!verifiedKey) {
        return { error: "passwordError", type: "local" };
      }
      let data = this.getStore().data;
      const accounts = getAllAccountsFromVault(data, { includePrivateKey: true });
      const targetAccount = accounts.find((acc) => acc.address === address);

      if (!targetAccount) {
        return { error: "accountNotFound", type: "local" };
      }

      // V3 HD accounts derive private key from mnemonic
      if (
        !targetAccount.privateKey &&
        targetAccount.type === ACCOUNT_TYPE.WALLET_INSIDE
      ) {
        const mnemonicEn = this._getEncryptedMnemonicForAccount(data, targetAccount);
        if (mnemonicEn) {
          const mnemonic = await this._decryptInnerSecret(mnemonicEn, pwd, verifiedKey);
          const wallet = importWalletByMnemonic(
            mnemonic,
            targetAccount.hdPath || 0
          );
          return wallet.priKey;
        }
        return { error: "noPrivateKey", type: "local" };
      }

      if (!targetAccount.privateKey) {
        return { error: "noPrivateKey", type: "local" };
      }
      const privateKey = await this._decryptInnerSecret(targetAccount.privateKey as string, pwd, verifiedKey);
      return privateKey;
    } catch (error) {
      console.error("[getPrivateKey] Error:", error);
      return { error: "decryptFailed", type: "local" };
    }
  };
  getCurrentPrivateKey = async () => {
    try {
      let currentAccount = this.getStore().currentAccount;
      this._requireCryptoKey();
      let data = this.getStore().data;

      // HD accounts (WALLET_INSIDE): derive private key from mnemonic
      if (currentAccount.type === ACCOUNT_TYPE.WALLET_INSIDE) {
        const mnemonicEn = this._getEncryptedMnemonicForAccount(data, currentAccount);
        if (mnemonicEn) {
          const mnemonic = await this._decryptInnerSecret(mnemonicEn);
          const wallet = importWalletByMnemonic(
            mnemonic,
            currentAccount.hdPath || 0
          );
          return wallet.priKey;
        }
        return null;
      }

      // Imported accounts: look up encrypted privateKey from vault data
      // (memStore.currentAccount does not carry privateKey)
      const allAccounts = getAllAccountsFromVault(data, { includePrivateKey: true });
      const vaultAccount = allAccounts.find(acc => acc.address === currentAccount.address);
      if (!vaultAccount?.privateKey) {
        return null;
      }

      const privateKey = await this._decryptInnerSecret(vaultAccount.privateKey);
      return privateKey;
    } catch (error) {
      console.error("[getCurrentPrivateKey] Error:", error);
      return null;
    }
  };

  postStakeTx = async (data: any, signature: any): Promise<any> => {
    let stakeRes: any = await sendStakeTx(data, signature).catch((error: any) => error);
    let delegation =
      (stakeRes.sendDelegation && stakeRes.sendDelegation.delegation) || {};
    if (delegation.hash && delegation.id) {
      this.checkTxStatus(delegation.id, delegation.hash);
    }
    return { ...stakeRes };
  };
  postPaymentTx = async (data: any, signature: any): Promise<any> => {
    let sendRes: any = await sendTx(data, signature).catch((error: any) => error);
    let payment = (sendRes.sendPayment && sendRes.sendPayment.payment) || {};
    if (payment.hash && payment.id) {
      this.checkTxStatus(payment.id, payment.hash);
    }
    return { ...sendRes };
  };
  postZkTx = async (signedTx: any): Promise<any> => {
    let sendPartyRes: any = await sendParty(
      signedTx.data?.zkappCommand
    ).catch((error: any) => error);
    if (!sendPartyRes.error) {
      let partyRes = sendPartyRes?.sendZkapp?.zkapp || {};
      if (partyRes.id && partyRes.hash) {
        this.checkTxStatus(partyRes.id, partyRes.hash, FETCH_TYPE_QA);
      }
      return { ...partyRes };
    } else {
      return sendPartyRes;
    }
  };

  sendTransaction = async (params: TransactionParams): Promise<any> => {
    try {
      let nextParams = { ...params };
      let privateKey: string | null = await this.getCurrentPrivateKey();
      if (!privateKey) {
        return { error: "privateKeyUnavailable" };
      }
      if (params.isSpeedUp) {
        nextParams.memo = decodeMemo(params.memo as string);
      }
      let signedTx: any = await signTransaction(privateKey, nextParams as any);
      privateKey = null;
      if (signedTx.error) {
        return { error: signedTx.error };
      }
      if (nextParams.zkOnlySign) {
        return signedTx.data;
      }
      const sendAction = params.sendAction;
      switch (sendAction) {
        case DAppActions.mina_signMessage:
          return signedTx;
        case DAppActions.mina_sendPayment:
          const sendRes = await this.postPaymentTx(
            signedTx.data,
            signedTx.signature
          );
          return sendRes;
        case DAppActions.mina_sendStakeDelegation:
          const stakeRes = await this.postStakeTx(
            signedTx.data,
            signedTx.signature
          );
          return stakeRes;
        case DAppActions.mina_sendTransaction:
          const sendPartyRes = await this.postZkTx(signedTx);
          return sendPartyRes;
        default:
          return { error: "not support" };
      }
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  };
  checkTxStatus = async (paymentId: string, hash: string, type?: string): Promise<void> => {
    if (!paymentId || !hash) {
      return;
    }
    this._clearTxTimer(paymentId);
    // Capture the current network GQL URL at the time of the request,
    // so polling continues to use this URL even if the user switches networks.
    const netConfig = await getCurrentNodeConfig();
    if (isZekoNet(netConfig.networkID)) {
      return;
    }
    const gqlUrl = netConfig.url || undefined;
    if (type === FETCH_TYPE_QA) {
      this.fetchQAnetTransactionStatus(paymentId, hash, gqlUrl);
    } else {
      this.fetchTransactionStatus(paymentId, hash, gqlUrl);
    }
  };

  signFields = async (params: Record<string, unknown>): Promise<any> => {
    let privateKey: string | null = await this.getCurrentPrivateKey();
    if (!privateKey) {
      return { error: "privateKeyUnavailable" };
    }
    let signedResult: any = await signFieldsMessage(privateKey, params as any);
    privateKey = null;
    if (signedResult.error) {
      return { error: signedResult.error };
    }
    return signedResult;
  };

  createNullifierByApi = async (params: Record<string, unknown>): Promise<any> => {
    let privateKey: string | null = await this.getCurrentPrivateKey();
    if (!privateKey) {
      return { error: "privateKeyUnavailable" };
    }
    let createResult: any = await createNullifier(privateKey, params as any);
    privateKey = null;
    if (createResult.error) {
      return { error: createResult.error };
    }
    return createResult;
  };
  storePrivateCredential = async (address: string, credential: unknown): Promise<void> => {
    const nextCredential = {
      address,
      credentialId: crypto.randomUUID(),
      credential: { credential, type: "private-credential" },
    };
    await storeCredential(nextCredential);
  };

  getPrivateCredential = async (address: string): Promise<any[]> => {
    const credentials = await searchCredential({
      address,
      query: { type: "private-credential" },
      props: [],
    });
    return credentials.map((c: any) => {
      if (!c) return c;
      const { type, ...rest } = c;
      return rest;
    });
  };

  getCredentialIdList = async (address: string): Promise<string[]> => {
    const { credentials } = await getStoredCredentials();
    return Object.keys(credentials[address] || {});
  };

  getTargetCredential = async (address: string, credentialId: string): Promise<unknown> => {
    return await getCredentialById(address, credentialId);
  };

  removeTargetCredential = async (address: string, credentialId: string): Promise<boolean> => {
    try {
      await removeCredential(address, credentialId);
      return true;
    } catch {
      return false;
    }
  };
}

const apiService = new APIService();
export default apiService;
