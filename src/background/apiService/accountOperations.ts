import { ACCOUNT_TYPE } from "../../constant/commonType";
import { isV2Vault, KEYRING_TYPE } from "../../constant/vaultTypes";
import { memStore } from "@/store";
import { removeValue, save } from "../storageService";
import {
  importWalletByMnemonic,
  importWalletByPrivateKey,
  importWalletByKeystore,
} from "../accountService";
import {
  getAllAccountsFromVault,
  getMnemonicFromVault,
  getVaultVersion,
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

export interface AccountOperationResult {
  error?: string;
  type?: string;
  account?: AccountInfo;
  accountList?: SortedAccountList;
  currentAccount?: AccountInfo;
  currentAddress?: string;
  code?: number;
  existingAccount?: {
    address: string;
    accountName?: string;
  };
}

export interface SortedAccountList {
  allList: AccountInfo[];
  commonList: AccountInfo[];
  watchList: AccountInfo[];
}

type GetStoreFn = () => {
  data: VaultData | null;
  password: string;
  currentAccount: AccountInfo | null | { address?: string; [key: string]: unknown };
};

type CheckPasswordFn = (pwd: string) => boolean;

// ============================================
// Helper Functions
// ============================================

export const getAccountWithoutPrivate = (account: AccountInfo): AccountInfo => {
  const newAccount = { ...account };
  delete newAccount.privateKey;
  return newAccount;
};

export const accountSort = (accountList: AccountInfo[]): SortedAccountList => {
  const createList: AccountInfo[] = [];
  const importList: AccountInfo[] = [];
  const ledgerList: AccountInfo[] = [];
  const watchList: AccountInfo[] = [];

  accountList.forEach((item) => {
    const newItem = getAccountWithoutPrivate(item);
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

  const commonList = [...createList, ...importList, ...ledgerList];
  return { allList: [...commonList, ...watchList], commonList, watchList };
};

const checkWalletRepeat = (
  accounts: AccountInfo[],
  address: string
): { error?: string; type?: string } => {
  for (const account of accounts) {
    if (account.address === address) {
      return { error: "importRepeat", type: "local" };
    }
  }
  return {};
};

const findWalletIndex = (accounts: AccountInfo[], type: string): number => {
  const importList = accounts.filter((item) => item.type === type);
  if (importList.length === 0) {
    return 1;
  }
  return (importList[importList.length - 1]?.typeIndex || 0) + 1;
};

// ============================================
// HD Account Operations
// ============================================

export const addHDNewAccount = async (
  accountName: string,
  getStore: GetStoreFn
): Promise<AccountOperationResult> => {
  const data = getStore().data;
  const version = getVaultVersion(data);

  if (version === "v2") {
    return addHDNewAccountV2(data as V2Vault, accountName, getStore);
  }

  // V1: legacy logic
  const v1Data = data as any[];
  const accounts = v1Data[0].accounts;

  const createList = accounts.filter(
    (item: AccountInfo) => item.type === ACCOUNT_TYPE.WALLET_INSIDE
  );
  
  if (createList.length > 0) {
    const maxHdIndex = createList[createList.length - 1].hdPath;
    const lastHdIndex = maxHdIndex + 1;
    const typeIndex = createList[createList.length - 1].typeIndex + 1;

    const mnemonicEn = v1Data[0].mnemonic;
    const mnemonic = await encryptUtils.decrypt(getStore().password, mnemonicEn);
    const wallet = importWalletByMnemonic(mnemonic, lastHdIndex);
    const priKeyEncrypt = await encryptUtils.encrypt(
      getStore().password,
      wallet.priKey
    );

    let sameIndex = -1;
    let sameAccount: AccountInfo | null = null;
    for (let index = 0; index < accounts.length; index++) {
      const tempAccount = accounts[index];
      if (tempAccount.address === wallet.pubKey) {
        sameIndex = index;
        sameAccount = tempAccount;
      }
    }

    if (sameIndex !== -1 && sameAccount) {
      return {
        error: "importRepeat",
        type: "local",
        account: {
          accountName: sameAccount.accountName,
          address: sameAccount.address,
        } as AccountInfo,
      };
    }

    const account: AccountInfo = {
      address: wallet.pubKey,
      privateKey: priKeyEncrypt,
      type: ACCOUNT_TYPE.WALLET_INSIDE,
      hdPath: lastHdIndex,
      accountName,
      typeIndex,
    };

    v1Data[0].currentAddress = account.address;
    v1Data[0].accounts.push(account);
    const encryptData = await encryptUtils.encrypt(getStore().password, v1Data);

    memStore.updateState({ data: v1Data, currentAccount: account });
    save({ keyringData: encryptData });
    return getAccountWithoutPrivate(account) as AccountOperationResult;
  }
  
  return { error: "noHDAccounts", type: "local" };
};

const addHDNewAccountV2 = async (
  data: V2Vault,
  accountName: string,
  getStore: GetStoreFn
): Promise<AccountOperationResult> => {
  // Find current HD keyring
  let hdKeyring: V2Keyring | undefined;
  if (data.currentKeyringId) {
    hdKeyring = data.keyrings.find(
      (kr) => kr.id === data.currentKeyringId && kr.type === KEYRING_TYPE.HD
    );
  }
  // Fallback to first HD keyring
  if (!hdKeyring) {
    hdKeyring = data.keyrings.find((kr) => kr.type === KEYRING_TYPE.HD);
  }
  if (!hdKeyring) {
    return { error: "noHDKeyring", type: "local" };
  }

  const nextHdIndex = hdKeyring.nextHdIndex || hdKeyring.accounts.length;

  const mnemonic = await encryptUtils.decrypt(
    getStore().password,
    hdKeyring.mnemonic
  );
  const wallet = importWalletByMnemonic(mnemonic, nextHdIndex);

  // Check for duplicate
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
      } as AccountInfo,
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

  const encryptData = await encryptUtils.encrypt(getStore().password, data);

  const accountForUI: AccountInfo = {
    address: newAccount.address,
    accountName: newAccount.name,
    type: ACCOUNT_TYPE.WALLET_INSIDE,
    hdPath: newAccount.hdIndex,
    keyringId: hdKeyring.id,
  };

  memStore.updateState({ data, currentAccount: accountForUI });
  save({ keyringData: encryptData });
  return getAccountWithoutPrivate(accountForUI) as AccountOperationResult;
};

// ============================================
// Import Account Operations
// ============================================

export const addImportAccount = async (
  privateKey: string,
  accountName: string,
  getStore: GetStoreFn
): Promise<AccountOperationResult> => {
  try {
    const wallet = await importWalletByPrivateKey(privateKey);
    const data = getStore().data;
    const version = getVaultVersion(data);

    if (version === "v2") {
      return addImportAccountV2(data as V2Vault, wallet, accountName, getStore);
    }

    // V1: legacy logic
    const v1Data = data as any[];
    const accounts = v1Data[0].accounts;
    const error = checkWalletRepeat(accounts, wallet.pubKey);
    if (error.error) {
      return error;
    }
    const typeIndex = findWalletIndex(accounts, ACCOUNT_TYPE.WALLET_OUTSIDE);

    const priKeyEncrypt = await encryptUtils.encrypt(
      getStore().password,
      wallet.priKey
    );
    const account: AccountInfo = {
      address: wallet.pubKey,
      privateKey: priKeyEncrypt,
      type: ACCOUNT_TYPE.WALLET_OUTSIDE,
      accountName,
      typeIndex,
    };
    v1Data[0].currentAddress = account.address;
    v1Data[0].accounts.push(account);
    const encryptData = await encryptUtils.encrypt(getStore().password, v1Data);

    memStore.updateState({ data: v1Data, currentAccount: account });
    save({ keyringData: encryptData });
    return getAccountWithoutPrivate(account) as AccountOperationResult;
  } catch (error) {
    return { error: "privateError", type: "local" };
  }
};

const addImportAccountV2 = async (
  data: V2Vault,
  wallet: { pubKey: string; priKey: string },
  accountName: string,
  getStore: GetStoreFn
): Promise<AccountOperationResult> => {
  const allAccounts = getAllAccountsFromVault(data);
  const existingAccount = allAccounts.find(
    (acc) => acc.address === wallet.pubKey
  );
  if (existingAccount) {
    return {
      error: "importRepeat",
      type: "local",
      existingAccount: {
        address: existingAccount.address || '',
        accountName: existingAccount.name || existingAccount.accountName,
      },
    };
  }

  const priKeyEncrypt = await encryptUtils.encrypt(
    getStore().password,
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
      currentAddress: undefined,
      createdAt: Date.now(),
    };
    data.keyrings.push(importedKeyring);
  }

  const importedCount = importedKeyring.accounts.length + 1;
  const finalAccountName = accountName || `Imported ${importedCount}`;

  const newAccount = {
    address: wallet.pubKey,
    name: finalAccountName,
    privateKey: priKeyEncrypt,
  };
  importedKeyring.accounts.push(newAccount);
  importedKeyring.currentAddress = newAccount.address;
  data.currentKeyringId = importedKeyring.id;

  const encryptData = await encryptUtils.encrypt(getStore().password, data);

  const accountForUI: AccountInfo = {
    address: newAccount.address,
    accountName: newAccount.name,
    type: ACCOUNT_TYPE.WALLET_OUTSIDE,
    privateKey: priKeyEncrypt,
    keyringId: importedKeyring.id,
  };

  memStore.updateState({ data, currentAccount: accountForUI });
  save({ keyringData: encryptData });
  return getAccountWithoutPrivate(accountForUI) as AccountOperationResult;
};

export const addAccountByKeyStore = async (
  keystore: string,
  password: string,
  accountName: string,
  getStore: GetStoreFn
): Promise<AccountOperationResult> => {
  const wallet = await importWalletByKeystore(keystore, password) as any;
  if (wallet.error) {
    return { error: wallet.error, type: "local" };
  }
  return await addImportAccount(wallet.priKey, accountName, getStore);
};

// ============================================
// Ledger Account Operations
// ============================================

export const addLedgerAccount = async (
  address: string,
  accountName: string,
  ledgerPathAccountIndex: number,
  getStore: GetStoreFn
): Promise<AccountOperationResult> => {
  try {
    const data = getStore().data;
    const version = getVaultVersion(data);

    if (version === "v2") {
      return addLedgerAccountV2(
        data as V2Vault,
        address,
        accountName,
        ledgerPathAccountIndex,
        getStore
      );
    }

    // V1: legacy logic
    const v1Data = data as any[];
    const accounts = v1Data[0].accounts;
    const error = checkWalletRepeat(accounts, address);
    if (error.error) {
      return error;
    }
    const typeIndex = findWalletIndex(accounts, ACCOUNT_TYPE.WALLET_LEDGER);

    const account: AccountInfo = {
      address,
      type: ACCOUNT_TYPE.WALLET_LEDGER,
      accountName,
      hdPath: ledgerPathAccountIndex,
      typeIndex,
    };
    v1Data[0].currentAddress = account.address;
    v1Data[0].accounts.push(account);
    const encryptData = await encryptUtils.encrypt(getStore().password, v1Data);

    memStore.updateState({ data: v1Data, currentAccount: account });
    save({ keyringData: encryptData });
    return getAccountWithoutPrivate(account) as AccountOperationResult;
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};

const addLedgerAccountV2 = async (
  data: V2Vault,
  address: string,
  accountName: string,
  ledgerPathAccountIndex: number,
  getStore: GetStoreFn
): Promise<AccountOperationResult> => {
  const allAccounts = getAllAccountsFromVault(data);
  const existingAccount = allAccounts.find((acc) => acc.address === address);
  if (existingAccount) {
    return {
      error: "importRepeat",
      type: "local",
      existingAccount: {
        address: existingAccount.address || '',
        accountName: existingAccount.name || existingAccount.accountName,
      },
    };
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
      currentAddress: undefined,
      createdAt: Date.now(),
    };
    data.keyrings.push(ledgerKeyring);
  }

  const ledgerCount = ledgerKeyring.accounts.length + 1;
  const finalAccountName = accountName || `Ledger ${ledgerCount}`;

  const newAccount = {
    address,
    name: finalAccountName,
    hdIndex: ledgerPathAccountIndex,
  };
  ledgerKeyring.accounts.push(newAccount);
  ledgerKeyring.currentAddress = newAccount.address;
  data.currentKeyringId = ledgerKeyring.id;

  const encryptData = await encryptUtils.encrypt(getStore().password, data);
  const accountForUI: AccountInfo = {
    address: newAccount.address,
    accountName: newAccount.name,
    type: ACCOUNT_TYPE.WALLET_LEDGER,
    hdPath: newAccount.hdIndex,
    keyringId: ledgerKeyring.id,
  };

  memStore.updateState({ data, currentAccount: accountForUI });
  save({ keyringData: encryptData });
  return getAccountWithoutPrivate(accountForUI) as AccountOperationResult;
};

// ============================================
// Set Current Account
// ============================================

export const setCurrentAccount = async (
  address: string,
  getStore: GetStoreFn
): Promise<AccountOperationResult> => {
  const data = getStore().data;
  const version = getVaultVersion(data);

  if (version === "v2") {
    return setCurrentAccountV2(data as V2Vault, address, getStore);
  }

  // V1: legacy logic
  const v1Data = data as any[];
  const accounts = v1Data[0].accounts;
  let currentAccount: AccountInfo = {} as AccountInfo;
  
  for (let index = 0; index < accounts.length; index++) {
    const account = accounts[index];
    if (account.address === address) {
      currentAccount = account;
      v1Data[0].currentAddress = address;

      const encryptData = await encryptUtils.encrypt(getStore().password, v1Data);
      memStore.updateState({ data: v1Data, currentAccount: account });
      save({ keyringData: encryptData });
    }
  }

  const accountList = accountSort(v1Data[0].accounts);
  return {
    accountList,
    currentAccount: getAccountWithoutPrivate(currentAccount),
    currentAddress: address,
  };
};

const setCurrentAccountV2 = async (
  data: V2Vault,
  address: string,
  getStore: GetStoreFn
): Promise<AccountOperationResult> => {
  let currentAccount: AccountInfo | null = null;

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
        keyringId: keyring.id,
      };
      break;
    }
  }

  if (currentAccount) {
    const encryptData = await encryptUtils.encrypt(getStore().password, data);
    memStore.updateState({ data, currentAccount });
    save({ keyringData: encryptData });
  }

  const allAccounts = getAllAccountsFromVault(data);
  const accountList = accountSort(allAccounts);
  return {
    accountList,
    currentAccount: getAccountWithoutPrivate(currentAccount || ({} as AccountInfo)),
    currentAddress: address,
  };
};

// ============================================
// Change Account Name
// ============================================

export const changeAccountName = async (
  address: string,
  accountName: string,
  getStore: GetStoreFn
): Promise<AccountOperationResult> => {
  const data = getStore().data;
  const version = getVaultVersion(data);

  if (version === "v2") {
    return changeAccountNameV2(data as V2Vault, address, accountName, getStore);
  }

  // V1: legacy logic
  const v1Data = data as any[];
  const accounts = v1Data[0].accounts;
  let account: AccountInfo | undefined;
  
  for (let index = 0; index < accounts.length; index++) {
    account = accounts[index];
    if (account && account.address === address) {
      v1Data[0].accounts[index].accountName = accountName;
      account = accounts[index];
      const encryptData = await encryptUtils.encrypt(getStore().password, v1Data);
      memStore.updateState({ data: v1Data });
      save({ keyringData: encryptData });
      break;
    }
  }
  
  const newAccount = getAccountWithoutPrivate(account || ({} as AccountInfo));
  return { account: newAccount };
};

const changeAccountNameV2 = async (
  data: V2Vault,
  address: string,
  accountName: string,
  getStore: GetStoreFn
): Promise<AccountOperationResult> => {
  let account: AccountInfo | null = null;
  
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
    const encryptData = await encryptUtils.encrypt(getStore().password, data);
    memStore.updateState({ data });
    save({ keyringData: encryptData });
  }

  return { account: getAccountWithoutPrivate(account || ({} as AccountInfo)) };
};

// ============================================
// Delete Account
// ============================================

export const deleteAccount = async (
  address: string,
  password: string,
  checkPasswordFn: CheckPasswordFn,
  getStore: GetStoreFn
): Promise<AccountOperationResult> => {
  const data = getStore().data;
  const version = getVaultVersion(data);

  if (version === "v2") {
    return deleteAccountV2(data as V2Vault, address, password, checkPasswordFn, getStore);
  }

  // V1: legacy logic
  const v1Data = data as any[];
  let accounts = v1Data[0].accounts;
  let deleteAccountItem = accounts.filter(
    (item: AccountInfo) => item.address === address
  );
  deleteAccountItem = deleteAccountItem.length > 0 ? deleteAccountItem[0] : {};
  
  let canDelete = false;
  if (
    deleteAccountItem &&
    (deleteAccountItem.type === ACCOUNT_TYPE.WALLET_WATCH ||
      deleteAccountItem.type === ACCOUNT_TYPE.WALLET_LEDGER)
  ) {
    canDelete = true;
  } else {
    canDelete = checkPasswordFn(password);
  }
  
  if (canDelete) {
    accounts = accounts.filter(
      (item: AccountInfo) => item.address !== address
    );
    let currentAccount = getStore().currentAccount;
    if (currentAccount && address === currentAccount.address) {
      currentAccount = accounts[0];
      v1Data[0].currentAddress = currentAccount?.address;
    }
    v1Data[0].accounts = accounts;
    const encryptData = await encryptUtils.encrypt(getStore().password, v1Data);
    memStore.updateState({ data: v1Data, currentAccount: currentAccount ?? undefined });
    save({ keyringData: encryptData });
    return getAccountWithoutPrivate((currentAccount || { address: '', type: '' }) as AccountInfo) as AccountOperationResult;
  } else {
    return { error: "passwordError", type: "local" };
  }
};

const deleteAccountV2 = async (
  data: V2Vault,
  address: string,
  password: string,
  checkPasswordFn: CheckPasswordFn,
  getStore: GetStoreFn
): Promise<AccountOperationResult> => {
  // Find account to delete
  let targetKeyring: V2Keyring | null = null;
  let targetAccount: AccountInfo | null = null;

  for (const keyring of data.keyrings) {
    const acc = keyring.accounts.find((a) => a.address === address);
    if (acc) {
      targetKeyring = keyring;
      targetAccount = {
        ...acc,
        type: keyringTypeToAccountType(keyring.type),
      } as AccountInfo;
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
    canDelete = checkPasswordFn(password);
  }

  if (!canDelete) {
    return { error: "passwordError", type: "local" };
  }

  // Remove account from keyring
  if (targetKeyring) {
    targetKeyring.accounts = targetKeyring.accounts.filter(
      (a) => a.address !== address
    );

    // If keyring is empty, remove keyring
    if (targetKeyring.accounts.length === 0) {
      data.keyrings = data.keyrings.filter((kr) => kr.id !== targetKeyring!.id);
    }
  }

  // Update current account
  let currentAccount = getStore().currentAccount;

  if (currentAccount && address === currentAccount.address) {
    const allAccounts = getAllAccountsFromVault(data);
    const firstAcc = allAccounts[0];
    if (allAccounts.length > 0 && firstAcc) {
      currentAccount = {
        address: firstAcc.address,
        accountName: firstAcc.accountName,
        type: firstAcc.type,
        hdPath: firstAcc.hdPath,
      };
      // Update currentKeyringId and currentAddress
      for (const keyring of data.keyrings) {
        if (keyring.accounts.find((a) => a.address === firstAcc.address)) {
          data.currentKeyringId = keyring.id;
          keyring.currentAddress = firstAcc.address;
          break;
        }
      }
    } else {
      currentAccount = {} as AccountInfo;
    }
  }

  const encryptData = await encryptUtils.encrypt(getStore().password, data);
  memStore.updateState({ data, currentAccount: currentAccount ?? undefined });
  save({ keyringData: encryptData });
  return getAccountWithoutPrivate((currentAccount || { address: '', type: '' }) as AccountInfo) as AccountOperationResult;
};

// ============================================
// Get/Update Password Related Operations
// ============================================

export const getMnemonic = async (
  pwd: string,
  checkPasswordFn: CheckPasswordFn,
  getStore: GetStoreFn
): Promise<string | { error: string; type: string }> => {
  const isCorrect = checkPasswordFn(pwd);
  if (isCorrect) {
    const data = getStore().data;
    const mnemonicEn = getMnemonicFromVault(data);
    if (!mnemonicEn) {
      return { error: "noMnemonic", type: "local" };
    }
    const mnemonic = await encryptUtils.decrypt(getStore().password, mnemonicEn);
    return mnemonic;
  } else {
    return { error: "passwordError", type: "local" };
  }
};

export const updateSecPassword = async (
  oldPwd: string,
  pwd: string,
  checkPasswordFn: CheckPasswordFn,
  getStore: GetStoreFn
): Promise<{ code?: number; error?: string; type?: string }> => {
  try {
    const isCorrect = checkPasswordFn(oldPwd);
    if (isCorrect) {
      const data = getStore().data;
      const version = getVaultVersion(data);

      if (version === "v2") {
        return updateSecPasswordV2(data as V2Vault, oldPwd, pwd, getStore);
      }

      // V1: legacy logic
      const v1Data = data as any[];
      const accounts = v1Data[0].accounts;
      let mnemonicEn = v1Data[0].mnemonic;
      let mnemonic = await encryptUtils.decrypt(oldPwd, mnemonicEn);
      mnemonic = await encryptUtils.encrypt(pwd, mnemonic);
      let currentAccount = getStore().currentAccount;
      const newAccounts = [];
      
      for (let index = 0; index < accounts.length; index++) {
        const account = accounts[index];
        let privateKeyEn = account.privateKey;
        let privateKey;
        if (privateKeyEn) {
          privateKey = await encryptUtils.decrypt(oldPwd, privateKeyEn);
          privateKey = await encryptUtils.encrypt(pwd, privateKey);
          if (currentAccount && currentAccount.address === account.address) {
            currentAccount.privateKey = privateKey;
          }
        }
        const newAccount = { ...account };
        if (privateKey) {
          newAccount.privateKey = privateKey;
        }
        newAccounts.push(newAccount);
      }
      v1Data[0].accounts = newAccounts;
      v1Data[0].mnemonic = mnemonic;

      const encryptData = await encryptUtils.encrypt(pwd, v1Data);
      memStore.updateState({ password: pwd, currentAccount: currentAccount ?? undefined });
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

const updateSecPasswordV2 = async (
  data: V2Vault,
  oldPwd: string,
  pwd: string,
  getStore: GetStoreFn
): Promise<{ code?: number; error?: string; type?: string }> => {
  let currentAccount = getStore().currentAccount;

  // Re-encrypt sensitive data in all keyrings
  for (const keyring of data.keyrings) {
    // Re-encrypt mnemonic
    if (keyring.mnemonic) {
      const mnemonic = await encryptUtils.decrypt(oldPwd, keyring.mnemonic);
      keyring.mnemonic = await encryptUtils.encrypt(pwd, mnemonic);
    }

    // Re-encrypt private keys (only imported accounts have private keys)
    for (const account of keyring.accounts) {
      if (account.privateKey) {
        const privateKey = await encryptUtils.decrypt(oldPwd, account.privateKey);
        account.privateKey = await encryptUtils.encrypt(pwd, privateKey);
        if (currentAccount && currentAccount.address === account.address) {
          currentAccount.privateKey = account.privateKey;
        }
      }
    }
  }

  const encryptData = await encryptUtils.encrypt(pwd, data);
  memStore.updateState({ password: pwd, currentAccount: currentAccount ?? undefined });
  await removeValue("keyringData");
  await save({ keyringData: encryptData });
  return { code: 0 };
};

// ============================================
// Get Private Key
// ============================================

export const getPrivateKey = async (
  address: string,
  pwd: string,
  checkPasswordFn: CheckPasswordFn,
  getStore: GetStoreFn
): Promise<string | { error: string; type: string }> => {
  const isCorrect = checkPasswordFn(pwd);
  if (isCorrect) {
    const data = getStore().data;
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
      let mnemonicEn: string | null = null;

      // V2: get mnemonic from the correct keyring
      if (isV2Vault(data) && targetAccount.keyringId) {
        const keyring = (data as V2Vault).keyrings.find(
          (kr) => kr.id === targetAccount.keyringId
        );
        mnemonicEn = keyring?.mnemonic || null;
      }

      // Fallback to getMnemonicFromVault for V1 or if keyringId not found
      if (!mnemonicEn) {
        mnemonicEn = getMnemonicFromVault(data);
      }

      if (mnemonicEn) {
        const mnemonic = await encryptUtils.decrypt(pwd, mnemonicEn);
        const wallet = importWalletByMnemonic(mnemonic, targetAccount.hdPath || 0);
        return wallet.priKey;
      }
      return { error: "noPrivateKey", type: "local" };
    }

    const privateKey = await encryptUtils.decrypt(pwd, targetAccount.privateKey);
    return privateKey;
  } else {
    return { error: "passwordError", type: "local" };
  }
};

export const getCurrentPrivateKey = async (
  getStore: GetStoreFn
): Promise<string | null> => {
  const currentAccount = getStore().currentAccount;
  const password = getStore().password;
  const data = getStore().data;

  if (!currentAccount) return null;

  // V2 HD accounts derive private key from mnemonic
  if (
    !currentAccount.privateKey &&
    currentAccount.type === ACCOUNT_TYPE.WALLET_INSIDE
  ) {
    let mnemonicEn: string | null = null;

    // V2: get mnemonic from the correct keyring
    if (isV2Vault(data) && currentAccount.keyringId) {
      const keyring = (data as V2Vault).keyrings.find(
        (kr) => kr.id === currentAccount.keyringId
      );
      mnemonicEn = keyring?.mnemonic || null;
    }

    // Fallback to getMnemonicFromVault for V1 or if keyringId not found
    if (!mnemonicEn) {
      mnemonicEn = getMnemonicFromVault(data);
    }

    if (mnemonicEn) {
      const mnemonic = await encryptUtils.decrypt(password, mnemonicEn);
      const wallet = importWalletByMnemonic(mnemonic, (currentAccount.hdPath || 0) as number);
      return wallet.priKey;
    }
    return null;
  }

  const privateKey = await encryptUtils.decrypt(password, currentAccount.privateKey);
  return privateKey;
};
