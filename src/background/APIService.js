import { DAppActions } from "@aurowallet/mina-provider";
import i18n from "i18next";
import { LANGUAGE_CONFIG } from "../constant/storageKey";
import { changeLanguage } from "../i18n";
import { extGetLocal } from "./extensionStorage";
import { createNullifier, signFieldsMessage, signTransaction } from "./lib";

import browser from "webextension-polyfill";
import { LOCK_TIME_DEFAULT } from "../constant";
import { ACCOUNT_TYPE } from "../constant/commonType";
import {
  FROM_BACK_TO_RECORD,
  TX_SUCCESS,
  WORKER_ACTIONS,
} from "../constant/msgTypes";
import "../i18n";
import {
  getCurrentNodeConfig,
  getExtensionAction,
} from "../utils/browserUtils";
import { sendMsg } from "../utils/commonMsg";
import { decodeMemo } from "../utils/utils";
import {
  getQATxStatus,
  getTxStatus,
  sendParty,
  sendStakeTx,
  sendTx,
} from "./api";
import {
  get,
  getCredentialById,
  getStoredCredentials,
  removeCredential,
  removeValue,
  save,
  searchCredential,
  storeCredential,
} from "./storageService";

import { memStore } from "@/store";

import {
  generateMne,
  importWalletByKeystore,
  importWalletByMnemonic,
  importWalletByPrivateKey,
} from "./accountService";

// Import vault migration utilities
import { isLegacyVault, isV2Vault, KEYRING_TYPE } from "../constant/vaultTypes";
import { normalizeVault, validateVault } from "./vaultMigration";

const encryptUtils = require("../utils/encryptUtils").default;

// ============================================
// V2 Vault Helper Functions
// ============================================

/**
 * check vault version
 */
const getVaultVersion = (data) => {
  if (!data) return null;
  if (isV2Vault(data)) return "v2";
  if (Array.isArray(data)) return "v1";
  return null;
};

/**
 * get all vault accounts( v1 & v2)
 */
const getAllAccountsFromVault = (data) => {
  if (!data) return [];

  if (isV2Vault(data)) {
    const accounts = [];
    const typeIndexCounters = {
      [ACCOUNT_TYPE.WALLET_INSIDE]: 0,
      [ACCOUNT_TYPE.WALLET_OUTSIDE]: 0,
      [ACCOUNT_TYPE.WALLET_LEDGER]: 0,
      [ACCOUNT_TYPE.WALLET_WATCH]: 0,
    };

    data.keyrings.forEach((keyring) => {
      keyring.accounts.forEach((acc) => {
        const accountType = keyringTypeToAccountType(keyring.type);
        typeIndexCounters[accountType]++;

        accounts.push({
          address: acc.address,
          accountName: acc.name,
          type: accountType,
          hdPath: acc.hdIndex,
          privateKey: acc.privateKey,
          keyringId: keyring.id,
          keyringType: keyring.type,
          typeIndex: typeIndexCounters[accountType],
        });
      });
    });
    return accounts;
  }

  return data[0]?.accounts || [];
};

/**
 * get mnemonic from vault (compatible with v1 and v2)
 */
const getMnemonicFromVault = (data) => {
  if (!data) return null;

  if (isV2Vault(data)) {
    const hdKeyring = data.keyrings.find((kr) => kr.type === KEYRING_TYPE.HD);
    return hdKeyring?.mnemonic || null;
  }

  return data[0]?.mnemonic || null;
};

/**
 * get current address from vault (compatible with v1 and v2)
 */
const getCurrentAddressFromVault = (data) => {
  if (!data) return null;

  if (isV2Vault(data)) {
    const currentKeyring =
      data.keyrings.find((kr) => kr.id === data.currentKeyringId) ||
      data.keyrings[0];
    return (
      currentKeyring?.currentAddress || currentKeyring?.accounts?.[0]?.address
    );
  }

  return data[0]?.currentAddress || null;
};

/**
 * keyring type to account type
 */
const keyringTypeToAccountType = (keyringType) => {
  const typeMap = {
    [KEYRING_TYPE.HD]: ACCOUNT_TYPE.WALLET_INSIDE,
    [KEYRING_TYPE.IMPORTED]: ACCOUNT_TYPE.WALLET_OUTSIDE,
    [KEYRING_TYPE.LEDGER]: ACCOUNT_TYPE.WALLET_LEDGER,
    [KEYRING_TYPE.WATCH]: ACCOUNT_TYPE.WALLET_WATCH,
  };
  return typeMap[keyringType] || ACCOUNT_TYPE.WALLET_INSIDE;
};

const STATUS = {
  TX_STATUS_PENDING: "PENDING",
  TX_STATUS_INCLUDED: "INCLUDED",
  TX_STATUS_UNKNOWN: "UNKNOWN",
};

const default_account_name = "Account 1";
const FETCH_TYPE_QA = "Berkeley-QA";

class APIService {
  constructor() {
    this.activeTimer = null;
    this.timer = null;
  }

  getStore = () => memStore.getState();

  resetWallet = () => {
    if (this.activeTimer) clearTimeout(this.activeTimer);
    this.setPopupIcon(false);
    memStore.lock();
  };

  setPopupIcon = (isUnlocked) => {
    const icons = [16, 32, 48, 128].reduce((res, size) => {
      res[size] = isUnlocked
        ? `img/logo/${size}.png`
        : `img/logo/${size}_lock.png`;
      return res;
    }, {});
    const action = getExtensionAction();
    return action.setIcon({ path: icons });
  };

  getCreateMnemonic = (isNewMne) => {
    if (isNewMne) {
      const mne = generateMne();
      memStore.setMnemonic(mne);
      return mne;
    }
    return this.getStore().mne || "";
  };

  filterCurrentAccount = (accountList, currentAddress) => {
    return accountList.find((acc) => acc.address === currentAddress);
  };

  initAppLocalConfig = async () => {
    const result = await get("autoLockTime");
    return result?.autoLockTime || LOCK_TIME_DEFAULT;
  };

  async submitPassword(password) {
    const encryptedVault = await get("keyringData");
    if (!encryptedVault?.keyringData) {
      return { error: "passwordError", type: "local" };
    }

    try {
      let vault = await encryptUtils.decrypt(
        password,
        encryptedVault.keyringData
      );

      const {
        data: vaultData,
        version,
        didMigrate,
      } = await this.migrateData(password, vault);

      // Get current account info based on version
      let currentAddress, currentAccount;

      if (version === "v2") {
        // V2: get current account from keyrings
        currentAddress = this.getCurrentAddressFromV2(vaultData);
        currentAccount = this.getCurrentAccountFromV2(
          vaultData,
          currentAddress
        );
      } else {
        // V1: legacy logic
        currentAddress = vaultData[0]?.currentAddress;
        currentAccount = this.filterCurrentAccount(
          vaultData[0]?.accounts || [],
          currentAddress
        );
      }

      const autoLockTime = await this.initAppLocalConfig();
      memStore.unlock({
        password,
        data: vaultData,
        currentAccount,
        autoLockTime,
        vaultVersion: version,
      });

      this.setPopupIcon(true);
      sendMsg({
        type: FROM_BACK_TO_RECORD,
        action: WORKER_ACTIONS.SET_LOCK,
        payload: true,
      });

      const result = this.getAccountWithoutPrivate(currentAccount);
      result.vaultVersion = version;
      result.didMigrate = didMigrate;
      return result;
    } catch (error) {
      console.error("[aurowallet apiservice] submitPassword error:", error);
      return { error: "passwordError", type: "local" };
    }
  }

  /**
   * get current address from v2 vault
   */
  getCurrentAddressFromV2(vault) {
    if (!vault || !vault.keyrings) return null;

    const currentKeyring =
      vault.keyrings.find((kr) => kr.id === vault.currentKeyringId) ||
      vault.keyrings[0];

    if (!currentKeyring) return null;

    return (
      currentKeyring.currentAddress || currentKeyring.accounts?.[0]?.address
    );
  }

  /**
   * Get current account from V2 vault
   */
  getCurrentAccountFromV2(vault, currentAddress) {
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
        };
      }
    }
    return null;
  }

  keyringTypeToAccountType(keyringType) {
    const typeMap = {
      hd: ACCOUNT_TYPE.WALLET_INSIDE,
      imported: ACCOUNT_TYPE.WALLET_OUTSIDE,
      ledger: ACCOUNT_TYPE.WALLET_LEDGER,
      watch: ACCOUNT_TYPE.WALLET_WATCH,
    };
    return typeMap[keyringType] || ACCOUNT_TYPE.WALLET_INSIDE;
  }
  /**
   * Data migration: encryption format upgrade + V2 structure upgrade
   * Strategy: V2 returns directly, V1 upgrades with validation, keeps V1 on failure
   * Core principle: mnemonic/private key must never be lost
   */
  async migrateData(password, vault) {
    let didMigrate = false;

    // 1. Return V2 directly
    if (isV2Vault(vault)) {
      return { data: vault, version: "v2", didMigrate: false };
    }

    // 2. V1: upgrade encryption format
    const migrateCheck = (dataStr) => {
      try {
        return dataStr && JSON.parse(dataStr).version !== 2;
      } catch (e) {
        return false;
      }
    };

    const migrateEncryption = async (data, key) => {
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

    // 3. V2 structure upgrade: V1 -> V2
    if (isLegacyVault(vault)) {
      const { vault: v2Vault, migrated } = normalizeVault(vault);

      if (migrated) {
        const validation = validateVault(v2Vault);
        if (!validation.valid) {
          if (didMigrate) {
            const encryptData = await encryptUtils.encrypt(password, vault);
            await removeValue("keyringData");
            await save({ keyringData: encryptData });
          }
          return { data: vault, version: "v1", didMigrate };
        }

        const originalCount = vault.reduce(
          (sum, w) => sum + (w.accounts?.length || 0),
          0
        );
        const migratedCount = v2Vault.keyrings.reduce(
          (sum, kr) => sum + kr.accounts.length,
          0
        );
        if (originalCount !== migratedCount) {
          if (didMigrate) {
            const encryptData = await encryptUtils.encrypt(password, vault);
            await removeValue("keyringData");
            await save({ keyringData: encryptData });
          }
          return { data: vault, version: "v1", didMigrate };
        }

        const originalMnemonics = vault
          .filter((w) => w.mnemonic)
          .map((w) => w.mnemonic);
        const migratedMnemonics = v2Vault.keyrings
          .filter((kr) => kr.mnemonic)
          .map((kr) => kr.mnemonic);
        if (originalMnemonics.length !== migratedMnemonics.length) {
          if (didMigrate) {
            const encryptData = await encryptUtils.encrypt(password, vault);
            await removeValue("keyringData");
            await save({ keyringData: encryptData });
          }
          return { data: vault, version: "v1", didMigrate };
        }

        // All validations passed, save V2
        const encryptedV2 = await encryptUtils.encrypt(password, v2Vault);
        await removeValue("keyringData");
        await save({ keyringData: encryptedV2 });
        return { data: v2Vault, version: "v2", didMigrate: true };
      }
    }

    // 4. Only encryption format upgrade, save and return V1
    if (didMigrate) {
      const encryptData = await encryptUtils.encrypt(password, vault);
      await removeValue("keyringData");
      await save({ keyringData: encryptData });
    }

    return { data: vault, version: "v1", didMigrate };
  }

  checkPassword(password) {
    return this.getStore().password === password;
  }

  setLastActiveTime() {
    const timeoutMinutes = this.getStore().autoLockTime;
    let localData = this.getStore().data;
    let isUnlocked = this.getStore().isUnlocked;
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
  async updateLockTime(autoLockTime) {
    memStore.updateState({ autoLockTime: autoLockTime });
    await save({ autoLockTime: autoLockTime });
  }
  getCurrentAutoLockTime() {
    return this.getStore().autoLockTime;
  }
  setUnlockedStatus = (status) => {
    if (!status) {
      memStore.lock();
    }

    sendMsg({
      type: FROM_BACK_TO_RECORD,
      action: WORKER_ACTIONS.SET_LOCK,
      payload: status,
    });

    this.setPopupIcon(status);
  };
  getCurrentAccount = async () => {
    let initStatus = false;
    let localAccount = await get("keyringData");
    let currentAccount = this.getStore().currentAccount;
    let isUnlocked = this.getStore().isUnlocked;
    if (localAccount && localAccount.keyringData) {
      initStatus = true;
      currentAccount.localAccount = {
        keyringData: "keyringData",
      };
    }
    currentAccount.isUnlocked = isUnlocked;
    let iconStatus = !initStatus || isUnlocked;
    this.setPopupIcon(iconStatus);
    return this.getAccountWithoutPrivate(currentAccount);
  };

  getCurrentAccountAddress = () => {
    let currentAccount = this.getStore().currentAccount;
    return currentAccount.address;
  };
  createPwd = (password) => {
    memStore.updateState({ password, isUnlocked: true });
  };
  createAccount = async (mnemonic) => {
    memStore.updateState({ mne: "" });
    let wallet = importWalletByMnemonic(mnemonic);
    let priKeyEncrypt = await encryptUtils.encrypt(
      this.getStore().password,
      wallet.priKey
    );
    const account = {
      address: wallet.pubKey,
      privateKey: priKeyEncrypt,
      type: ACCOUNT_TYPE.WALLET_INSIDE,
      hdPath: wallet.hdIndex,
      accountName: default_account_name,
      typeIndex: 1,
    };

    let mnemonicEn = await encryptUtils.encrypt(
      this.getStore().password,
      mnemonic
    );

    let keyringData = [];
    let data = {
      mnemonic: mnemonicEn,
      accounts: [],
      currentAddress: account.address,
    };
    data.accounts.push(account);
    keyringData.push(data);
    let encryptData;

    encryptData = await encryptUtils.encrypt(
      this.getStore().password,
      keyringData
    );
    memStore.updateState({ data: keyringData, currentAccount: account });
    save({ keyringData: encryptData });
    this.setUnlockedStatus(true);
    return this.getAccountWithoutPrivate(account);
  };
  getLedgerAccountIndex = () => {
    const state = this.getStore();
    const data = state.data;

    const allAccounts = getAllAccountsFromVault(data) || [];
    const ledgerList = allAccounts.filter(
      (acc) => acc.type === ACCOUNT_TYPE.WALLET_LEDGER
    );
    return ledgerList.length;
  };
  getLockStatus = () => {
    return memStore.getState().isUnlocked;
  };

  fetchTransactionStatus = (paymentId, hash) => {
    this.baseTransactionStatus(getTxStatus, paymentId, hash);
  };

  fetchQAnetTransactionStatus = (paymentId, hash) => {
    this.baseTransactionStatus(getQATxStatus, paymentId, hash);
  };

  baseTransactionStatus = (method, paymentId, hash) => {
    method(paymentId)
      .then((data) => {
        if (data?.transactionStatus === STATUS.TX_STATUS_INCLUDED) {
          browser.runtime.sendMessage({
            type: FROM_BACK_TO_RECORD,
            action: TX_SUCCESS,
            hash,
          });
          this.notification(hash);
          if (this.timer) clearTimeout(this.timer);
        } else if (data?.transactionStatus === STATUS.TX_STATUS_UNKNOWN) {
          if (this.timer) clearTimeout(this.timer);
        } else {
          this.timer = setTimeout(() => {
            this.baseTransactionStatus(method, paymentId, hash);
          }, 5000);
        }
      })
      .catch((err) => {
        this.timer = setTimeout(() => {
          this.baseTransactionStatus(method, paymentId, hash);
        }, 5000);
      });
  };

  notification = async (hash) => {
    let netConfig = await getCurrentNodeConfig();
    let myNotificationID;
    browser.notifications &&
      browser.notifications.onClicked.addListener(function (clickId) {
        if (myNotificationID === clickId) {
          let url = netConfig.explorer + "/tx/" + clickId;
          browser.tabs.create({ url: url });
        }
      });
    const i18nLanguage = i18n.language;
    const localLanguage = await extGetLocal(LANGUAGE_CONFIG);
    if (localLanguage !== i18nLanguage) {
      changeLanguage(localLanguage);
    }
    let title = i18n.t("notificationTitle");
    let message = i18n.t("notificationContent");
    browser.notifications
      .create(hash, {
        title: title,
        message: message,
        iconUrl: "/img/logo/128.png",
        type: "basic",
      })
      .then((notificationItem) => {
        myNotificationID = notificationItem;
      });
    return;
  };
  getAccountWithoutPrivate = (account) => {
    let newAccount = { ...account };
    delete newAccount.privateKey;
    return newAccount;
  };
  getAllAccount = () => {
    let data = this.getStore().data;
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

    let accountList = this.accountSort(accounts);
    let currentAccount = this.getStore().currentAccount;
    return {
      accounts: accountList,
      currentAddress:
        currentAccount?.address || getCurrentAddressFromVault(data),
    };
  };
  accountSort = (accountList) => {
    let newList = accountList;
    let createList = [],
      importList = [],
      ledgerList = [],
      watchList = [];
    newList.filter((item, index) => {
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
  addHDNewAccount = async (accountName) => {
    let data = this.getStore().data;
    const version = getVaultVersion(data);

    if (version === "v2") {
      // V2: add account in HD keyring
      return this._addHDNewAccountV2(data, accountName);
    }

    // V1: legacy logic
    let accounts = data[0].accounts;

    let createList = accounts.filter((item, index) => {
      return item.type === ACCOUNT_TYPE.WALLET_INSIDE;
    });
    if (createList.length > 0) {
      let maxHdIndex = createList[createList.length - 1].hdPath;
      let lastHdIndex = maxHdIndex + 1;
      let typeIndex = createList[createList.length - 1].typeIndex + 1;

      let mnemonicEn = data[0].mnemonic;
      let mnemonic = await encryptUtils.decrypt(
        this.getStore().password,
        mnemonicEn
      );
      let wallet = importWalletByMnemonic(mnemonic, lastHdIndex);
      let priKeyEncrypt = await encryptUtils.encrypt(
        this.getStore().password,
        wallet.priKey
      );

      let sameIndex = -1;
      let sameAccount = {};
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

      data[0].currentAddress = account.address;
      data[0].accounts.push(account);
      let encryptData = await encryptUtils.encrypt(
        this.getStore().password,
        data
      );

      memStore.updateState({ data: data, currentAccount: account });
      save({ keyringData: encryptData });
      return this.getAccountWithoutPrivate(account);
    }
  };

  // V2: add HD account
  _addHDNewAccountV2 = async (data, accountName) => {
    const hdKeyring = data.keyrings.find((kr) => kr.type === KEYRING_TYPE.HD);
    if (!hdKeyring) {
      return { error: "noHDKeyring", type: "local" };
    }

    const nextHdIndex = hdKeyring.nextHdIndex || hdKeyring.accounts.length;

    const mnemonic = await encryptUtils.decrypt(
      this.getStore().password,
      hdKeyring.mnemonic
    );
    const wallet = importWalletByMnemonic(mnemonic, nextHdIndex);

    const allAccounts = getAllAccountsFromVault(data);
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

    const newAccount = {
      address: wallet.pubKey,
      name: accountName,
      hdIndex: nextHdIndex,
    };

    hdKeyring.accounts.push(newAccount);
    hdKeyring.nextHdIndex = nextHdIndex + 1;
    hdKeyring.currentAddress = newAccount.address;

    const encryptData = await encryptUtils.encrypt(
      this.getStore().password,
      data
    );

    const accountForUI = {
      address: newAccount.address,
      accountName: newAccount.name,
      type: ACCOUNT_TYPE.WALLET_INSIDE,
      hdPath: newAccount.hdIndex,
    };

    memStore.updateState({ data: data, currentAccount: accountForUI });
    save({ keyringData: encryptData });
    return this.getAccountWithoutPrivate(accountForUI);
  };
  _checkWalletRepeat(accounts, address) {
    let error = {};
    for (let index = 0; index < accounts.length; index++) {
      const account = accounts[index];
      if (account.address === address) {
        error = { error: "importRepeat", type: "local" };
        break;
      }
    }
    return error;
  }
  _findWalletIndex(accounts, type) {
    let importList = accounts.filter((item, index) => {
      return item.type === type;
    });
    let typeIndex = "";
    if (importList.length === 0) {
      typeIndex = 1;
    } else {
      typeIndex = importList[importList.length - 1].typeIndex + 1;
    }
    return typeIndex;
  }
  /**
   *  import private key
   */
  addImportAccount = async (privateKey, accountName) => {
    try {
      let wallet = await importWalletByPrivateKey(privateKey);
      let data = this.getStore().data;
      const version = getVaultVersion(data);

      if (version === "v2") {
        return this._addImportAccountV2(data, wallet, accountName);
      }

      // V1: legacy logic
      let accounts = data[0].accounts;
      let error = this._checkWalletRepeat(accounts, wallet.pubKey);
      if (error.error) {
        return error;
      }
      let typeIndex = this._findWalletIndex(
        accounts,
        ACCOUNT_TYPE.WALLET_OUTSIDE
      );

      let priKeyEncrypt = await encryptUtils.encrypt(
        this.getStore().password,
        wallet.priKey
      );
      const account = {
        address: wallet.pubKey,
        privateKey: priKeyEncrypt,
        type: ACCOUNT_TYPE.WALLET_OUTSIDE,
        accountName,
        typeIndex,
      };
      data[0].currentAddress = account.address;
      data[0].accounts.push(account);
      let encryptData = await encryptUtils.encrypt(
        this.getStore().password,
        data
      );

      memStore.updateState({ data: data, currentAccount: account });
      save({ keyringData: encryptData });
      return this.getAccountWithoutPrivate(account);
    } catch (error) {
      return { error: "privateError", type: "local" };
    }
  };

  // V2: import private key account
  _addImportAccountV2 = async (data, wallet, accountName) => {
    const allAccounts = getAllAccountsFromVault(data);
    const existingAccount = allAccounts.find(
      (acc) => acc.address === wallet.pubKey
    );
    if (existingAccount) {
      return { error: "importRepeat", type: "local" };
    }

    const priKeyEncrypt = await encryptUtils.encrypt(
      this.getStore().password,
      wallet.priKey
    );

    let importedKeyring = data.keyrings.find(
      (kr) => kr.type === KEYRING_TYPE.IMPORTED
    );
    if (!importedKeyring) {
      importedKeyring = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        type: KEYRING_TYPE.IMPORTED,
        name: "Imported",
        accounts: [],
        currentAddress: null,
      };
      data.keyrings.push(importedKeyring);
    }

    const newAccount = {
      address: wallet.pubKey,
      name: accountName,
      privateKey: priKeyEncrypt,
    };
    importedKeyring.accounts.push(newAccount);
    importedKeyring.currentAddress = newAccount.address;
    data.currentKeyringId = importedKeyring.id;

    const encryptData = await encryptUtils.encrypt(
      this.getStore().password,
      data
    );

    const accountForUI = {
      address: newAccount.address,
      accountName: newAccount.name,
      type: ACCOUNT_TYPE.WALLET_OUTSIDE,
      privateKey: priKeyEncrypt,
    };

    memStore.updateState({ data: data, currentAccount: accountForUI });
    save({ keyringData: encryptData });
    return this.getAccountWithoutPrivate(accountForUI);
  };
  /**
   * import keystore
   * @param {*} keystore
   * @param {*} password
   * @param {*} accountName
   * @returns
   */
  addAccountByKeyStore = async (keystore, password, accountName) => {
    let wallet = await importWalletByKeystore(keystore, password);
    if (wallet.error) {
      return wallet;
    }
    let currentAccount = await this.addImportAccount(
      wallet.priKey,
      accountName
    );
    return currentAccount;
  };
  /**
   * import ledger wallet
   */
  addLedgerAccount = async (address, accountName, ledgerPathAccountIndex) => {
    try {
      let data = this.getStore().data;
      const version = getVaultVersion(data);

      if (version === "v2") {
        return this._addLedgerAccountV2(
          data,
          address,
          accountName,
          ledgerPathAccountIndex
        );
      }

      // V1: legacy logic
      let accounts = data[0].accounts;
      let error = this._checkWalletRepeat(accounts, address);
      if (error.error) {
        return error;
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
      data[0].currentAddress = account.address;
      data[0].accounts.push(account);
      let encryptData = await encryptUtils.encrypt(
        this.getStore().password,
        data
      );

      memStore.updateState({ data: data, currentAccount: account });
      save({ keyringData: encryptData });
      return this.getAccountWithoutPrivate(account);
    } catch (error) {
      return { error: JSON.stringify(error) };
    }
  };

  // V2: add Ledger account
  _addLedgerAccountV2 = async (
    data,
    address,
    accountName,
    ledgerPathAccountIndex
  ) => {
    const allAccounts = getAllAccountsFromVault(data);
    if (allAccounts.find((acc) => acc.address === address)) {
      return { error: "importRepeat", type: "local" };
    }

    let ledgerKeyring = data.keyrings.find(
      (kr) => kr.type === KEYRING_TYPE.LEDGER
    );
    if (!ledgerKeyring) {
      ledgerKeyring = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        type: KEYRING_TYPE.LEDGER,
        name: "Ledger",
        accounts: [],
        currentAddress: null,
      };
      data.keyrings.push(ledgerKeyring);
    }

    const newAccount = {
      address: address,
      name: accountName,
      hdIndex: ledgerPathAccountIndex,
    };
    ledgerKeyring.accounts.push(newAccount);
    ledgerKeyring.currentAddress = newAccount.address;
    data.currentKeyringId = ledgerKeyring.id;

    const encryptData = await encryptUtils.encrypt(
      this.getStore().password,
      data
    );
    const accountForUI = {
      address: newAccount.address,
      accountName: newAccount.name,
      type: ACCOUNT_TYPE.WALLET_LEDGER,
      hdPath: newAccount.hdIndex,
    };

    memStore.updateState({ data: data, currentAccount: accountForUI });
    save({ keyringData: encryptData });
    return this.getAccountWithoutPrivate(accountForUI);
  };
  setCurrentAccount = async (address) => {
    let data = this.getStore().data;
    const version = getVaultVersion(data);

    if (version === "v2") {
      return this._setCurrentAccountV2(data, address);
    }

    // V1: legacy logic
    let accounts = data[0].accounts;
    let currentAccount = {};
    for (let index = 0; index < accounts.length; index++) {
      let account = accounts[index];
      if (account.address === address) {
        currentAccount = account;
        data[0].currentAddress = address;

        let encryptData = await encryptUtils.encrypt(
          this.getStore().password,
          data
        );
        memStore.updateState({ data: data, currentAccount: account });
        save({ keyringData: encryptData });
      }
    }

    let accountList = this.accountSort(data[0].accounts);
    return {
      accountList: accountList,
      currentAccount: this.getAccountWithoutPrivate(currentAccount),
      currentAddress: address,
    };
  };

  // V2: set current account
  _setCurrentAccountV2 = async (data, address) => {
    let currentAccount = null;

    for (const keyring of data.keyrings) {
      const account = keyring.accounts.find((acc) => acc.address === address);
      if (account) {
        keyring.currentAddress = address;
        data.currentKeyringId = keyring.id;
        currentAccount = {
          address: account.address,
          accountName: account.name,
          type: keyringTypeToAccountType(keyring.type),
          hdPath: account.hdIndex,
          privateKey: account.privateKey,
        };
        break;
      }
    }

    if (currentAccount) {
      const encryptData = await encryptUtils.encrypt(
        this.getStore().password,
        data
      );
      memStore.updateState({ data: data, currentAccount });
      save({ keyringData: encryptData });
    }

    const allAccounts = getAllAccountsFromVault(data);
    const accountList = this.accountSort(allAccounts);
    return {
      accountList: accountList,
      currentAccount: this.getAccountWithoutPrivate(currentAccount || {}),
      currentAddress: address,
    };
  };
  changeAccountName = async (address, accountName) => {
    let data = this.getStore().data;
    const version = getVaultVersion(data);

    if (version === "v2") {
      return this._changeAccountNameV2(data, address, accountName);
    }

    // V1: legacy logic
    let accounts = data[0].accounts;
    let account;
    for (let index = 0; index < accounts.length; index++) {
      account = accounts[index];
      if (account.address === address) {
        data[0].accounts[index].accountName = accountName;
        account = accounts[index];
        let encryptData = await encryptUtils.encrypt(
          this.getStore().password,
          data
        );
        memStore.updateState({ data: data });
        save({ keyringData: encryptData });
        break;
      }
    }
    let newAccount = this.getAccountWithoutPrivate(account);
    return { account: newAccount };
  };

  // V2: change account name
  _changeAccountNameV2 = async (data, address, accountName) => {
    let account = null;
    for (const keyring of data.keyrings) {
      const acc = keyring.accounts.find((a) => a.address === address);
      if (acc) {
        acc.name = accountName;
        account = {
          address: acc.address,
          accountName: acc.name,
          type: keyringTypeToAccountType(keyring.type),
          hdPath: acc.hdIndex,
        };
        break;
      }
    }

    if (account) {
      const encryptData = await encryptUtils.encrypt(
        this.getStore().password,
        data
      );
      memStore.updateState({ data: data });
      save({ keyringData: encryptData });
    }

    return { account: this.getAccountWithoutPrivate(account || {}) };
  };
  deleteAccount = async (address, password) => {
    let data = this.getStore().data;
    const version = getVaultVersion(data);

    if (version === "v2") {
      return this._deleteAccountV2(data, address, password);
    }

    // V1: legacy logic
    let accounts = data[0].accounts;
    let deleteAccount = accounts.filter((item, index) => {
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
      let isCorrect = this.checkPassword(password);
      if (isCorrect) {
        canDelete = true;
      }
    }
    if (canDelete) {
      accounts = accounts.filter((item, index) => {
        return item.address !== address;
      });
      let currentAccount = this.getStore().currentAccount;
      if (address === currentAccount.address) {
        currentAccount = accounts[0];
        data[0].currentAddress = currentAccount.address;
      }
      data[0].accounts = accounts;
      let encryptData = await encryptUtils.encrypt(
        this.getStore().password,
        data
      );
      memStore.updateState({ data: data, currentAccount });
      save({ keyringData: encryptData });
      return this.getAccountWithoutPrivate(currentAccount);
    } else {
      return { error: "passwordError", type: "local" };
    }
  };

  // V2: delete account
  _deleteAccountV2 = async (data, address, password) => {
    let targetKeyring = null;
    let targetAccount = null;

    for (const keyring of data.keyrings) {
      const acc = keyring.accounts.find((a) => a.address === address);
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

    let canDelete = false;
    if (
      targetAccount.type === ACCOUNT_TYPE.WALLET_WATCH ||
      targetAccount.type === ACCOUNT_TYPE.WALLET_LEDGER
    ) {
      canDelete = true;
    } else {
      canDelete = this.checkPassword(password);
    }

    if (!canDelete) {
      return { error: "passwordError", type: "local" };
    }

    targetKeyring.accounts = targetKeyring.accounts.filter(
      (a) => a.address !== address
    );

    if (targetKeyring.accounts.length === 0) {
      data.keyrings = data.keyrings.filter((kr) => kr.id !== targetKeyring.id);
    }

    let currentAccount = this.getStore().currentAccount;

    if (address === currentAccount.address) {
      const allAccounts = getAllAccountsFromVault(data);
      if (allAccounts.length > 0) {
        const firstAcc = allAccounts[0];
        currentAccount = {
          address: firstAcc.address,
          accountName: firstAcc.accountName,
          type: firstAcc.type,
          hdPath: firstAcc.hdPath,
        };
        for (const keyring of data.keyrings) {
          if (keyring.accounts.find((a) => a.address === firstAcc.address)) {
            data.currentKeyringId = keyring.id;
            keyring.currentAddress = firstAcc.address;
            break;
          }
        }
      } else {
        currentAccount = {};
      }
    }

    const encryptData = await encryptUtils.encrypt(
      this.getStore().password,
      data
    );
    memStore.updateState({ data: data, currentAccount });
    save({ keyringData: encryptData });
    return this.getAccountWithoutPrivate(currentAccount);
  };
  getMnemonic = async (pwd) => {
    let isCorrect = this.checkPassword(pwd);
    if (isCorrect) {
      let data = this.getStore().data;
      let mnemonicEn = getMnemonicFromVault(data);
      if (!mnemonicEn) {
        return { error: "noMnemonic", type: "local" };
      }
      let mnemonic = await encryptUtils.decrypt(
        this.getStore().password,
        mnemonicEn
      );
      return mnemonic;
    } else {
      return { error: "passwordError", type: "local" };
    }
  };
  updateSecPassword = async (oldPwd, pwd) => {
    try {
      let isCorrect = this.checkPassword(oldPwd);
      if (isCorrect) {
        let data = this.getStore().data;
        const version = getVaultVersion(data);

        if (version === "v2") {
          return this._updateSecPasswordV2(data, oldPwd, pwd);
        }

        // V1: legacy logic
        let accounts = data[0].accounts;
        let mnemonicEn = data[0].mnemonic;
        let mnemonic = await encryptUtils.decrypt(oldPwd, mnemonicEn);
        mnemonic = await encryptUtils.encrypt(pwd, mnemonic);
        let currentAccount = this.getStore().currentAccount;
        let newAccounts = [];
        for (let index = 0; index < accounts.length; index++) {
          const account = accounts[index];
          let privateKeyEn = account.privateKey;
          let privateKey;
          if (privateKeyEn) {
            privateKey = await encryptUtils.decrypt(oldPwd, privateKeyEn);
            privateKey = await encryptUtils.encrypt(pwd, privateKey);
            if (currentAccount.address === account.address) {
              currentAccount.privateKey = privateKey;
            }
          }
          let newAccount = { ...account };
          if (privateKey) {
            newAccount.privateKey = privateKey;
          }
          newAccounts.push(newAccount);
        }
        data[0].accounts = newAccounts;
        data[0].mnemonic = mnemonic;

        let encryptData = await encryptUtils.encrypt(pwd, data);
        memStore.updateState({ password: pwd, currentAccount });
        await removeValue("keyringData");
        await save({ keyringData: encryptData });
        return { code: 0 };
      } else {
        return { error: "passwordError", type: "local" };
      }
    } catch (error) {
      return { error: "passwordError", type: "local" };
    }
  };

  // V2: update password
  _updateSecPasswordV2 = async (data, oldPwd, pwd) => {
    let currentAccount = this.getStore().currentAccount;

    for (const keyring of data.keyrings) {
      if (keyring.mnemonic) {
        const mnemonic = await encryptUtils.decrypt(oldPwd, keyring.mnemonic);
        keyring.mnemonic = await encryptUtils.encrypt(pwd, mnemonic);
      }

      for (const account of keyring.accounts) {
        if (account.privateKey) {
          const privateKey = await encryptUtils.decrypt(
            oldPwd,
            account.privateKey
          );
          account.privateKey = await encryptUtils.encrypt(pwd, privateKey);
          if (currentAccount.address === account.address) {
            currentAccount.privateKey = account.privateKey;
          }
        }
      }
    }

    const encryptData = await encryptUtils.encrypt(pwd, data);
    memStore.updateState({ password: pwd, currentAccount });
    await removeValue("keyringData");
    await save({ keyringData: encryptData });
    return { code: 0 };
  };
  getPrivateKey = async (address, pwd) => {
    let isCorrect = this.checkPassword(pwd);
    if (isCorrect) {
      let data = this.getStore().data;
      const accounts = getAllAccountsFromVault(data);
      const targetAccount = accounts.find((acc) => acc.address === address);

      if (!targetAccount) {
        return { error: "accountNotFound", type: "local" };
      }

      // V2 HD accounts derive private key from mnemonic
      if (
        !targetAccount.privateKey &&
        targetAccount.type === ACCOUNT_TYPE.WALLET_INSIDE
      ) {
        const mnemonicEn = getMnemonicFromVault(data);
        if (mnemonicEn) {
          const mnemonic = await encryptUtils.decrypt(pwd, mnemonicEn);
          const wallet = importWalletByMnemonic(
            mnemonic,
            targetAccount.hdPath || 0
          );
          return wallet.priKey;
        }
        return { error: "noPrivateKey", type: "local" };
      }

      const privateKey = await encryptUtils.decrypt(
        pwd,
        targetAccount.privateKey
      );
      return privateKey;
    } else {
      return { error: "passwordError", type: "local" };
    }
  };
  getCurrentPrivateKey = async () => {
    let currentAccount = this.getStore().currentAccount;
    let password = this.getStore().password;
    let data = this.getStore().data;

    // V2 HD accounts derive private key from mnemonic
    if (
      !currentAccount.privateKey &&
      currentAccount.type === ACCOUNT_TYPE.WALLET_INSIDE
    ) {
      const mnemonicEn = getMnemonicFromVault(data);
      if (mnemonicEn) {
        const mnemonic = await encryptUtils.decrypt(password, mnemonicEn);
        const wallet = importWalletByMnemonic(
          mnemonic,
          currentAccount.hdPath || 0
        );
        return wallet.priKey;
      }
      return null;
    }

    const privateKey = await encryptUtils.decrypt(
      password,
      currentAccount.privateKey
    );
    return privateKey;
  };

  postStakeTx = async (data, signature) => {
    let stakeRes = await sendStakeTx(data, signature).catch((error) => error);
    let delegation =
      (stakeRes.sendDelegation && stakeRes.sendDelegation.delegation) || {};
    if (delegation.hash && delegation.id) {
      this.checkTxStatus(delegation.id, delegation.hash);
    }
    return { ...stakeRes };
  };
  postPaymentTx = async (data, signature) => {
    let sendRes = await sendTx(data, signature).catch((error) => error);
    let payment = (sendRes.sendPayment && sendRes.sendPayment.payment) || {};
    if (payment.hash && payment.id) {
      this.checkTxStatus(payment.id, payment.hash);
    }
    return { ...sendRes };
  };
  postZkTx = async (signedTx) => {
    let sendPartyRes = await sendParty(
      signedTx.data.zkappCommand,
      signedTx.signature
    ).catch((error) => error);
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

  sendTransaction = async (params) => {
    try {
      let nextParams = { ...params };
      const privateKey = await this.getCurrentPrivateKey();
      if (params.isSpeedUp) {
        nextParams.memo = decodeMemo(params.memo);
      }
      let signedTx = await signTransaction(privateKey, nextParams);
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
      return { error: err };
    }
  };
  checkTxStatus = (paymentId, hash, type) => {
    if (type === FETCH_TYPE_QA) {
      this.fetchQAnetTransactionStatus(paymentId, hash);
    } else {
      this.fetchTransactionStatus(paymentId, hash);
    }
  };

  signFields = async (params) => {
    const privateKey = await this.getCurrentPrivateKey();
    let signedResult = await signFieldsMessage(privateKey, params);
    if (signedResult.error) {
      return { error: signedResult.error };
    }
    return signedResult;
  };

  createNullifierByApi = async (params) => {
    const privateKey = await this.getCurrentPrivateKey();
    let createResult = await createNullifier(privateKey, params);
    if (createResult.error) {
      return { error: createResult.error };
    }
    return createResult;
  };
  storePrivateCredential = async (address, credential) => {
    const nextCredential = {
      address,
      credentialId: crypto.randomUUID(),
      credential: { credential, type: "private-credential" },
    };
    await storeCredential(nextCredential);
  };

  getPrivateCredential = async (address) => {
    const credentials = await searchCredential({
      address,
      query: { type: "private-credential" },
      props: [],
    });
    return credentials.map((c) => {
      if (!c) return c;
      const { type, ...rest } = c;
      return rest;
    });
  };

  getCredentialIdList = async (address) => {
    const { credentials } = await getStoredCredentials();
    return Object.keys(credentials[address] || {});
  };

  getTargetCredential = async (address, credentialId) => {
    return await getCredentialById(address, credentialId);
  };

  removeTargetCredential = async (address, credentialId) => {
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
