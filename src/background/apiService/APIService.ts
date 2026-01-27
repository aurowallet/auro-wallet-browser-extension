import { DAppActions } from "@aurowallet/mina-provider";
import browser from "webextension-polyfill";
import type { TxPayload, Signature, SignedTransaction } from "./transactionService";

import { LOCK_TIME_DEFAULT } from "../../constant";
import { ACCOUNT_TYPE } from "../../constant/commonType";
import { FROM_BACK_TO_RECORD, WORKER_ACTIONS } from "../../constant/msgTypes";
import { getExtensionAction } from "../../utils/browserUtils";
import { sendMsg } from "../../utils/commonMsg";
import { get, removeValue, save } from "../storageService";

import { memStore } from "@/store";

import { generateMne, importWalletByMnemonic } from "../accountService";

// Import vault types and helpers
import {
  createHDKeyring,
  isLegacyVault,
  isV2Vault,
  KEYRING_TYPE,
  getDefaultHDWalletName,
} from "../../constant/vaultTypes";
import { normalizeVault, validateVault } from "../vaultMigration";

// Import modular services
import {
  getAllAccountsFromVault,
  getMnemonicFromVault,
  getCurrentAddressFromVault,
  getVaultVersion,
  keyringTypeToAccountType,
  DEFAULT_ACCOUNT_NAME,
  AccountInfo,
  VaultData,
  V2Vault,
} from "./vaultHelpers";

import {
  getKeyringsList as getKeyringsListFn,
  addHDKeyring as addHDKeyringFn,
  renameKeyring as renameKeyringFn,
  getKeyringMnemonic as getKeyringMnemonicFn,
  deleteKeyring as deleteKeyringFn,
  addAccountToKeyring as addAccountToKeyringFn,
  getVaultVersionFromStore,
  tryUpgradeVault as tryUpgradeVaultFn,
} from "./keyringService";

import {
  accountSort,
  getAccountWithoutPrivate,
  addHDNewAccount as addHDNewAccountFn,
  addImportAccount as addImportAccountFn,
  addAccountByKeyStore as addAccountByKeyStoreFn,
  addLedgerAccount as addLedgerAccountFn,
  setCurrentAccount as setCurrentAccountFn,
  changeAccountName as changeAccountNameFn,
  deleteAccount as deleteAccountFn,
  getMnemonic as getMnemonicFn,
  updateSecPassword as updateSecPasswordFn,
  getPrivateKey as getPrivateKeyFn,
  getCurrentPrivateKey as getCurrentPrivateKeyFn,
} from "./accountOperations";

import {
  createTransactionStatusChecker,
  createNotification,
  sendTransaction as sendTransactionFn,
  signFields as signFieldsFn,
  createNullifierByApi as createNullifierByApiFn,
} from "./transactionService";

import {
  storePrivateCredential,
  getPrivateCredential,
  getCredentialIdList,
  getTargetCredential,
  removeTargetCredential,
} from "./credentialService";

const encryptUtils = require("../../utils/encryptUtils").default;

// ============================================
// APIService Class
// ============================================

class APIService {
  private activeTimer: ReturnType<typeof setTimeout> | null = null;
  private timer: { current: ReturnType<typeof setTimeout> | null } = { current: null };
  private txStatusChecker: ReturnType<typeof createTransactionStatusChecker>;

  constructor() {
    this.txStatusChecker = createTransactionStatusChecker(
      this.timer,
      this.notification.bind(this)
    );
  }

  getStore = () => memStore.getState();

  resetWallet = () => {
    if (this.activeTimer) clearTimeout(this.activeTimer);
    this.setPopupIcon(false);
    memStore.lock();
  };

  setPopupIcon = (isUnlocked: boolean) => {
    const icons = [16, 32, 48, 128].reduce((res: Record<number, string>, size) => {
      res[size] = isUnlocked
        ? `img/logo/${size}.png`
        : `img/logo/${size}_lock.png`;
      return res;
    }, {});
    const action = getExtensionAction();
    return action.setIcon({ path: icons });
  };

  getCreateMnemonic = (isNewMne: boolean): string => {
    if (isNewMne) {
      const mne = generateMne();
      memStore.setMnemonic(mne);
      return mne;
    }
    return this.getStore().mne || "";
  };

  filterCurrentAccount = (accountList: AccountInfo[], currentAddress: string): AccountInfo | undefined => {
    return accountList.find((acc) => acc.address === currentAddress);
  };

  initAppLocalConfig = async (): Promise<number> => {
    const result = await get("autoLockTime") as { autoLockTime?: number } | null;
    return result?.autoLockTime || LOCK_TIME_DEFAULT;
  };

  async submitPassword(password: string, _options: Record<string, unknown> = {}) {
    const encryptedVault = await get("keyringData");
    if (!encryptedVault?.keyringData) {
      return { error: "passwordError", type: "local" };
    }

    try {
      const vault = await encryptUtils.decrypt(
        password,
        encryptedVault.keyringData
      );

      // Execute data migration
      const {
        data: vaultData,
        version,
        didMigrate,
      } = await this.migrateData(password, vault);

      // Get current account based on version
      let currentAddress: string | null;
      let currentAccount: AccountInfo | null | undefined;

      if (version === "v2") {
        currentAddress = this.getCurrentAddressFromV2(vaultData as V2Vault);
        currentAccount = this.getCurrentAccountFromV2(
          vaultData as V2Vault,
          currentAddress
        );
      } else {
        currentAddress = (vaultData as any[])[0]?.currentAddress;
        currentAccount = this.filterCurrentAccount(
          (vaultData as any[])[0]?.accounts || [],
          currentAddress || ""
        );
      }

      const autoLockTime = await this.initAppLocalConfig();
      memStore.unlock({
        password,
        data: vaultData as VaultData | null,
        currentAccount: currentAccount || undefined,
        autoLockTime,
      });

      this.setPopupIcon(true);
      sendMsg({
        type: FROM_BACK_TO_RECORD,
        action: WORKER_ACTIONS.SET_LOCK,
        payload: { isUnlocked: true },
      });

      const result = this.getAccountWithoutPrivate(currentAccount || ({} as AccountInfo));
      (result as any).vaultVersion = version;
      (result as any).didMigrate = didMigrate;
      return result;
    } catch (error) {
      console.error("[aurowallet apiservice] submitPassword error:", error);
      return { error: "passwordError", type: "local" };
    }
  }

  getCurrentAddressFromV2(vault: V2Vault): string | null {
    if (!vault || !vault.keyrings) return null;

    const currentKeyring =
      vault.keyrings.find((kr) => kr.id === vault.currentKeyringId) ||
      vault.keyrings[0];

    if (!currentKeyring) return null;

    return (
      currentKeyring.currentAddress || currentKeyring.accounts?.[0]?.address || null
    );
  }

  getCurrentAccountFromV2(vault: V2Vault, currentAddress: string | null): AccountInfo | null {
    if (!vault || !vault.keyrings || !currentAddress) return null;

    for (const keyring of vault.keyrings) {
      const account = keyring.accounts.find(
        (acc) => acc.address === currentAddress
      );
      if (account) {
        return {
          address: account.address,
          accountName: account.name,
          type: this.keyringTypeToAccountType(keyring.type),
          hdPath: account.hdIndex,
          keyringId: keyring.id,
        };
      }
    }
    return null;
  }

  keyringTypeToAccountType(keyringType: string): string {
    const typeMap: Record<string, string> = {
      hd: ACCOUNT_TYPE.WALLET_INSIDE,
      imported: ACCOUNT_TYPE.WALLET_OUTSIDE,
      ledger: ACCOUNT_TYPE.WALLET_LEDGER,
      watch: ACCOUNT_TYPE.WALLET_WATCH,
    };
    return typeMap[keyringType] || ACCOUNT_TYPE.WALLET_INSIDE;
  }

  async migrateData(password: string, vault: VaultData) {
    let didMigrate = false;
    
    // 1. Return V2 directly
    if (isV2Vault(vault)) {
      return { data: vault, version: "v2" as const, didMigrate: false };
    }

    // 2. V1: upgrade encryption format
    const migrateCheck = (dataStr: string) => {
      try {
        return dataStr && JSON.parse(dataStr).version !== 2;
      } catch (e) {
        return false;
      }
    };

    const migrateEncryption = async (data: any, key: string) => {
      if (migrateCheck(data[key])) {
        data[key] = await encryptUtils.encrypt(
          password,
          await encryptUtils.decrypt(password, data[key])
        );
        didMigrate = true;
      }
    };

    const v1Vault = vault as any[];
    for (let i = 0; i < v1Vault.length; i++) {
      const wallet = v1Vault[i];
      await migrateEncryption(wallet, "mnemonic");
      for (let j = 0; j < wallet.accounts.length; j++) {
        const account = wallet.accounts[j];
        await migrateEncryption(account, "privateKey");
      }
    }

    // 3. V2 structure upgrade: V1 -> V2
    if (isLegacyVault(v1Vault)) {
      const { vault: v2Vault, migrated } = normalizeVault(v1Vault);

      if (migrated) {
        const validation = validateVault(v2Vault);
        if (!validation.valid) {
          if (didMigrate) {
            const encryptData = await encryptUtils.encrypt(password, v1Vault);
            await removeValue("keyringData");
            await save({ keyringData: encryptData });
          }
          return { data: v1Vault, version: "v1" as const, didMigrate };
        }

        const originalCount = v1Vault.reduce(
          (sum, w) => sum + (w.accounts?.length || 0),
          0
        );
        const migratedCount = (v2Vault as V2Vault).keyrings.reduce(
          (sum, kr) => sum + kr.accounts.length,
          0
        );
        if (originalCount !== migratedCount) {
          if (didMigrate) {
            const encryptData = await encryptUtils.encrypt(password, v1Vault);
            await removeValue("keyringData");
            await save({ keyringData: encryptData });
          }
          return { data: v1Vault, version: "v1" as const, didMigrate };
        }

        const originalMnemonics = v1Vault
          .filter((w) => w.mnemonic)
          .map((w) => w.mnemonic);
        const migratedMnemonics = (v2Vault as V2Vault).keyrings
          .filter((kr) => kr.mnemonic)
          .map((kr) => kr.mnemonic);
        if (originalMnemonics.length !== migratedMnemonics.length) {
          if (didMigrate) {
            const encryptData = await encryptUtils.encrypt(password, v1Vault);
            await removeValue("keyringData");
            await save({ keyringData: encryptData });
          }
          return { data: v1Vault, version: "v1" as const, didMigrate };
        }

        // All validations passed, save V2
        const encryptedV2 = await encryptUtils.encrypt(password, v2Vault);
        await removeValue("keyringData");
        await save({ keyringData: encryptedV2 });
        return { data: v2Vault, version: "v2" as const, didMigrate: true };
      }
    }

    // 4. Only encryption format upgrade, save and return V1
    if (didMigrate) {
      const encryptData = await encryptUtils.encrypt(password, v1Vault);
      await removeValue("keyringData");
      await save({ keyringData: encryptData });
    }

    return { data: v1Vault, version: "v1" as const, didMigrate };
  }

  checkPassword(password: string): boolean {
    return this.getStore().password === password;
  }

  setLastActiveTime() {
    const timeoutMinutes = this.getStore().autoLockTime;
    const localData = this.getStore().data;
    const isUnlocked = this.getStore().isUnlocked;
    if (localData && isUnlocked) {
      if (this.activeTimer) {
        clearTimeout(this.activeTimer);
      }
      if (timeoutMinutes === -1) {
        return;
      }
      if (!timeoutMinutes) {
        return;
      }
      this.activeTimer = setTimeout(() => {
        this.setUnlockedStatus(false);
      }, timeoutMinutes);
    }
  }

  async updateLockTime(autoLockTime: number) {
    memStore.updateState({ autoLockTime });
    await save({ autoLockTime });
  }

  getCurrentAutoLockTime(): number {
    return this.getStore().autoLockTime;
  }

  setUnlockedStatus = (status: boolean) => {
    if (!status) {
      memStore.lock();
    }

    sendMsg({
      type: FROM_BACK_TO_RECORD,
      action: WORKER_ACTIONS.SET_LOCK,
      payload: { isUnlocked: status },
    });

    this.setPopupIcon(status);
  };

  getCurrentAccount = async () => {
    let initStatus = false;
    const localAccount = await get("keyringData");
    const currentAccount = this.getStore().currentAccount;
    const isUnlocked = this.getStore().isUnlocked;

    // Handle case when vault is cleared
    if (!currentAccount) {
      const iconStatus = !initStatus || isUnlocked;
      this.setPopupIcon(iconStatus);
      return {
        isUnlocked,
        localAccount: localAccount ? { keyringData: "keyringData" } : null,
      };
    }

    if (localAccount && localAccount.keyringData) {
      initStatus = true;
      (currentAccount as any).localAccount = {
        keyringData: "keyringData",
      };
    }
    (currentAccount as any).isUnlocked = isUnlocked;
    const iconStatus = !initStatus || isUnlocked;
    this.setPopupIcon(iconStatus);
    return this.getAccountWithoutPrivate(currentAccount);
  };

  getCurrentAccountAddress = (): string => {
    const currentAccount = this.getStore().currentAccount;
    return currentAccount?.address || "";
  };

  createPwd = (password: string) => {
    memStore.updateState({ password, isUnlocked: true });
  };

  createAccount = async (mnemonic: string) => {
    memStore.updateState({ mne: "" });
    const password = this.getStore().password;
    const existingData = this.getStore().data;

    // If V2 vault already exists, add new HD keyring
    if (isV2Vault(existingData)) {
      return this.addHDKeyring(mnemonic);
    }

    // Create new V2 vault for first-time wallet creation
    const wallet = importWalletByMnemonic(mnemonic);
    const mnemonicEn = await encryptUtils.encrypt(password, mnemonic);

    const newKeyring = createHDKeyring(getDefaultHDWalletName(1), mnemonicEn);
    newKeyring.accounts.push({
      address: wallet.pubKey,
      hdIndex: 0,
      name: DEFAULT_ACCOUNT_NAME,
    });
    newKeyring.nextHdIndex = 1;
    newKeyring.currentAddress = wallet.pubKey;

    const data: V2Vault = {
      version: 2,
      keyrings: [newKeyring],
      currentKeyringId: newKeyring.id,
      nextWalletIndex: 2,
    };

    const currentAccount: AccountInfo = {
      address: wallet.pubKey,
      type: ACCOUNT_TYPE.WALLET_INSIDE,
      hdPath: 0,
      accountName: DEFAULT_ACCOUNT_NAME,
      typeIndex: 1,
      keyringId: newKeyring.id,
    };

    const encryptData = await encryptUtils.encrypt(password, data);
    memStore.updateState({ data, currentAccount });
    save({ keyringData: encryptData });
    this.setUnlockedStatus(true);
    return this.getAccountWithoutPrivate(currentAccount);
  };

  getLedgerAccountIndex = (): number => {
    const state = this.getStore();
    const data = state.data;
    const allAccounts = getAllAccountsFromVault(data) || [];
    const ledgerList = allAccounts.filter(
      (acc) => acc.type === ACCOUNT_TYPE.WALLET_LEDGER
    );
    return ledgerList.length;
  };

  getLockStatus = (): boolean => {
    const isUnlocked = memStore.getState().isUnlocked;
    const data = memStore.getState().data as { version?: number; keyrings?: unknown[] } | unknown[] | null;

    const hasWallet =
      data &&
      (((data as { version?: number; keyrings?: unknown[] }).version === 2 && (data as { keyrings?: unknown[] }).keyrings && (data as { keyrings?: unknown[] }).keyrings!.length > 0) ||
        ((data as { version?: number }).version !== 2 && (data as { mnemonic?: string }[])[0]?.mnemonic));

    return isUnlocked && !!hasWallet;
  };

  getAccountWithoutPrivate = (account: AccountInfo): AccountInfo => {
    return getAccountWithoutPrivate(account);
  };

  getAllAccount = () => {
    const data = this.getStore().data;
    if (!data) {
      return {
        accounts: { allList: [], commonList: [], watchList: [] },
        currentAddress: "",
      };
    }

    const accounts = getAllAccountsFromVault(data);
    if (accounts.length === 0) {
      return {
        accounts: { allList: [], commonList: [], watchList: [] },
        currentAddress: "",
      };
    }

    const accountList = accountSort(accounts);
    const currentAccount = this.getStore().currentAccount;
    return {
      accounts: accountList,
      currentAddress:
        currentAccount?.address || getCurrentAddressFromVault(data),
    };
  };

  // ============================================
  // Multi-Wallet Methods (delegated to keyringService)
  // ============================================

  getKeyringsList = () => getKeyringsListFn(this.getStore);

  addHDKeyring = async (mnemonic: string, walletName?: string) =>
    addHDKeyringFn(mnemonic, walletName, this.getStore);

  renameKeyring = async (keyringId: string, newName: string) =>
    renameKeyringFn(keyringId, newName, this.getStore);

  getKeyringMnemonic = async (keyringId: string, password: string) =>
    getKeyringMnemonicFn(keyringId, password, this.checkPassword.bind(this), this.getStore);

  deleteKeyring = async (keyringId: string, password: string) =>
    deleteKeyringFn(keyringId, password, this.checkPassword.bind(this), this.getStore);

  addAccountToKeyring = async (keyringId: string, accountName?: string) =>
    addAccountToKeyringFn(keyringId, accountName, this.getStore);

  getVaultVersion = () => getVaultVersionFromStore(this.getStore);

  tryUpgradeVault = async () => tryUpgradeVaultFn(this.getStore);

  // ============================================
  // Account Operations (delegated to accountOperations)
  // ============================================

  accountSort = (accountList: AccountInfo[]) => accountSort(accountList);

  addHDNewAccount = async (accountName: string) =>
    addHDNewAccountFn(accountName, this.getStore);

  addImportAccount = async (privateKey: string, accountName: string) =>
    addImportAccountFn(privateKey, accountName, this.getStore);

  addAccountByKeyStore = async (keystore: string, password: string, accountName: string) =>
    addAccountByKeyStoreFn(keystore, password, accountName, this.getStore);

  addLedgerAccount = async (address: string, accountName: string, ledgerPathAccountIndex: number) =>
    addLedgerAccountFn(address, accountName, ledgerPathAccountIndex, this.getStore);

  setCurrentAccount = async (address: string) =>
    setCurrentAccountFn(address, this.getStore);

  changeAccountName = async (address: string, accountName: string) =>
    changeAccountNameFn(address, accountName, this.getStore);

  deleteAccount = async (address: string, password: string) =>
    deleteAccountFn(address, password, this.checkPassword.bind(this), this.getStore);

  getMnemonic = async (pwd: string) =>
    getMnemonicFn(pwd, this.checkPassword.bind(this), this.getStore);

  updateSecPassword = async (oldPwd: string, pwd: string) =>
    updateSecPasswordFn(oldPwd, pwd, this.checkPassword.bind(this), this.getStore);

  getPrivateKey = async (address: string, pwd: string) =>
    getPrivateKeyFn(address, pwd, this.checkPassword.bind(this), this.getStore);

  getCurrentPrivateKey = async () =>
    getCurrentPrivateKeyFn(this.getStore);

  // ============================================
  // Transaction Operations (delegated to transactionService)
  // ============================================

  notification = async (hash: string) => createNotification(hash);

  fetchTransactionStatus = (paymentId: string, hash: string) =>
    this.txStatusChecker.fetchTransactionStatus(paymentId, hash);

  fetchQAnetTransactionStatus = (paymentId: string, hash: string) =>
    this.txStatusChecker.fetchQAnetTransactionStatus(paymentId, hash);

  checkTxStatus = (paymentId: string, hash: string, type?: string) =>
    this.txStatusChecker.checkTxStatus(paymentId, hash, type);

  postStakeTx = async (data: unknown, signature: unknown) => {
    const { postStakeTx } = await import("./transactionService");
    return postStakeTx(
      data as TxPayload,
      signature as Signature,
      this.txStatusChecker.checkTxStatus
    );
  };

  postPaymentTx = async (data: unknown, signature: unknown) => {
    const { postPaymentTx } = await import("./transactionService");
    return postPaymentTx(
      data as TxPayload,
      signature as Signature,
      this.txStatusChecker.checkTxStatus
    );
  };

  postZkTx = async (signedTx: SignedTransaction) => {
    const { postZkTx } = await import("./transactionService");
    return postZkTx(signedTx, this.txStatusChecker.checkTxStatus);
  };

  sendTransaction = async (params: any) =>
    sendTransactionFn(
      params,
      this.getCurrentPrivateKey.bind(this),
      this.txStatusChecker.checkTxStatus
    );

  signFields = async (params: unknown) =>
    signFieldsFn(params, this.getCurrentPrivateKey.bind(this));

  createNullifierByApi = async (params: unknown) =>
    createNullifierByApiFn(params, this.getCurrentPrivateKey.bind(this));

  // ============================================
  // Credential Operations (delegated to credentialService)
  // ============================================

  storePrivateCredential = storePrivateCredential;
  getPrivateCredential = getPrivateCredential;
  getCredentialIdList = getCredentialIdList;
  getTargetCredential = getTargetCredential;
  removeTargetCredential = removeTargetCredential;
}

const apiService = new APIService();
export default apiService;
