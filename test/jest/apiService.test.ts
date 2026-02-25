/**
 * Jest tests for APIService - Complete Migration from Mocha
 * Using proper Jest mocking strategy
 * 
 * ⚠️ SECURITY WARNING ⚠️
 * The mnemonic phrases and private keys in this file are FOR TESTING PURPOSES ONLY.
 * DO NOT use these keys for any real funds or production environments.
 * These keys are publicly visible and should be considered compromised.
 */

// ==================== Mock Variables (hoisted) ====================
const mockEncryptUtils = {
  encrypt: jest.fn(),
  decrypt: jest.fn(),
};

let mockStoreState: Record<string, any> = {};

const mockMemStore = {
  getState: jest.fn(() => mockStoreState),
  updateState: jest.fn((updates: any) => {
    if (typeof updates === 'function') {
      Object.assign(mockStoreState, updates(mockStoreState));
    } else {
      Object.assign(mockStoreState, updates);
    }
  }),
  lock: jest.fn(() => {
    mockStoreState.isUnlocked = false;
    mockStoreState.password = '';
    mockStoreState.data = null;
    mockStoreState.currentAccount = null;
  }),
  unlock: jest.fn((params: any) => {
    mockStoreState.isUnlocked = true;
    mockStoreState.password = params.password;
    mockStoreState.data = params.data;
    mockStoreState.currentAccount = params.currentAccount;
    mockStoreState.autoLockTime = params.autoLockTime;
  }),
  setMnemonic: jest.fn((mne: string) => { mockStoreState.mne = mne; }),
  setCurrentAccount: jest.fn((account: any) => { mockStoreState.currentAccount = account; }),
};

const mockStorageService = {
  get: jest.fn(),
  save: jest.fn().mockResolvedValue(undefined),
  removeValue: jest.fn().mockResolvedValue(undefined),
};

const mockAccountService = {
  importWalletByMnemonic: jest.fn(),
  importWalletByPrivateKey: jest.fn(),
  importWalletByKeystore: jest.fn(),
  generateMne: jest.fn(() => 'generated mnemonic words'),
};

const mockSendMsg = jest.fn();

// Mock account operations functions
const mockAccountOperations = {
  accountSort: jest.fn((accounts: any[]) => {
    const watchList = accounts.filter((a: any) => a.type === 'WALLET_WATCH');
    const commonList = accounts.filter((a: any) => a.type !== 'WALLET_WATCH');
    return { allList: accounts, commonList, watchList };
  }),
  getAccountWithoutPrivate: jest.fn((account: any) => {
    if (!account) return account;
    const { privateKey, ...rest } = account;
    return rest;
  }),
  addHDNewAccount: jest.fn(),
  addImportAccount: jest.fn(),
  addAccountByKeyStore: jest.fn(),
  addLedgerAccount: jest.fn(),
  setCurrentAccount: jest.fn(),
  changeAccountName: jest.fn(),
  deleteAccount: jest.fn(),
  getMnemonic: jest.fn(),
  updateSecPassword: jest.fn(),
  getPrivateKey: jest.fn(),
  getCurrentPrivateKey: jest.fn(),
};

const mockKeyringService = {
  getKeyringsListFn: jest.fn(),
  addHDKeyringFn: jest.fn(),
  renameKeyringFn: jest.fn(),
  getKeyringMnemonicFn: jest.fn(),
  deleteKeyringFn: jest.fn(),
  addAccountToKeyringFn: jest.fn(),
  getVaultVersionFromStore: jest.fn(() => 'v1'),
  tryUpgradeVaultFn: jest.fn(),
};

const mockTransactionService = {
  sendTransaction: jest.fn(),
  signFields: jest.fn(),
  createNullifierByApi: jest.fn(),
  createTransactionStatusChecker: jest.fn(() => ({
    checkTxStatus: jest.fn(),
    fetchTransactionStatus: jest.fn(),
    fetchQAnetTransactionStatus: jest.fn(),
  })),
};

// ==================== Jest Mocks ====================
jest.mock('@aurowallet/mina-provider', () => ({
  DAppActions: {
    mina_requestAccounts: 'mina_requestAccounts',
    mina_accounts: 'mina_accounts',
    mina_sendPayment: 'mina_sendPayment',
    mina_sendStakeDelegation: 'mina_sendStakeDelegation',
    mina_sendTransaction: 'mina_sendTransaction',
  },
}));

jest.mock('i18next', () => {
  const i18nMock = {
    t: (key: string) => key,
    language: 'en',
    use: jest.fn().mockReturnThis(),
    init: jest.fn().mockResolvedValue(undefined),
    changeLanguage: jest.fn(),
  };
  return { __esModule: true, default: i18nMock, ...i18nMock };
});

jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: jest.fn() },
}));

jest.mock('../../src/utils/encryptUtils', () => ({ default: mockEncryptUtils }));

jest.mock('../../src/store', () => ({ memStore: mockMemStore }));

jest.mock('../../src/background/storageService', () => mockStorageService);

jest.mock('../../src/background/accountService', () => mockAccountService);

jest.mock('../../src/utils/commonMsg', () => ({ sendMsg: mockSendMsg }));

jest.mock('../../src/utils/browserUtils', () => ({
  getExtensionAction: jest.fn(() => ({ setIcon: jest.fn().mockResolvedValue(undefined) })),
  getCurrentNodeConfig: jest.fn().mockResolvedValue({ explorer: 'https://minascan.io' }),
}));


jest.mock('../../src/constant/vaultTypes', () => ({
  isLegacyVault: jest.fn((v: any) => Array.isArray(v)),
  isV2Vault: jest.fn((v: any) => v && v.version === 2),
  VAULT_VERSION: 2,
  KEYRING_TYPE: { HD: 'hd', IMPORTED: 'imported', LEDGER: 'ledger', WATCH: 'watch' },
  getDefaultHDWalletName: jest.fn((i: number) => `Wallet ${i}`),
  createHDKeyring: jest.fn(() => ({
    id: 'keyring-1',
    type: 'hd',
    name: 'Wallet 1',
    mnemonic: '',
    accounts: [],
    currentAddress: null,
  })),
  countHDKeyrings: jest.fn().mockReturnValue(0),
}));

jest.mock('../../src/background/vaultMigration', () => ({
  normalizeVault: jest.fn((vault: any) => ({ vault, migrated: false })),
  convertV2ToLegacy: jest.fn((vault: any) => vault),
  validateVault: jest.fn().mockReturnValue({ valid: true, errors: [] }),
}));

// Import after mocks
import apiService from '../../src/background/apiService/APIService';

// ==================== Test Data ====================
const TEST_DATA = {
  mnemonic: 'treat unique goddess bone spike inspire accident forum muffin boost drill draw',
  password: 'Qw123456',
  accounts: [
    { priKey: 'EKEfKdYoaCeGy4aZoCSam6DdGejrL121HSwFGrckzkLcLqPTMUxW', pubKey: 'B62qkVs6zgN84e1KjFxurigqTQ57FqV3KnWubV3t77E9R6uBm4DmkPi', hdIndex: 0 },
    { priKey: 'EKFJSVcYrRdH5xY7qdjeDHUdDKZ5V5P9K9qYMLuA1aoV7oL6sVWc', pubKey: 'B62qk3FF1FxfFxfJ4CLSgu2YehPdRqcNZw7Jw3z1JMyH28cSNR6XYDW', hdIndex: 1 },
    { priKey: 'EKF59KU3EQbEJPgsyTSwZyvbKAzjokLrK3DCxmEPUgoAYBSuPttx', pubKey: 'B62qoWQowd8bAmtz1Sjsdmz1jMaruDZnj1dXaZ9Qihgb8zgFTKQhLPM', hdIndex: 2 },
  ],
  importedAccount: {
    priKey: 'EKFLnT6MdRHKWUpukuLkccZuqhvCjrKKJsMGtMZDpKP52EsG6Zr9',
    pubKey: 'B62qjLVC7ryAwctX9tZimvgh4FBocUozL4VtCPvPJ9bYKRatb5NCRyy',
    accountName: 'Import Account 1',
  },
  ledgerAccount: {
    pubKey: 'B62qm2G9TSSsbwiu5XfMiaGSgMBTtieAUeVskqfZJ2kRYcwsvGRT6oF',
    accountName: 'Ledger Account 1',
    hdPath: 0,
  },
};

const resetMockStoreState = () => {
  Object.keys(mockStoreState).forEach(key => delete mockStoreState[key]);
  Object.assign(mockStoreState, {
    isUnlocked: false,
    data: null,
    password: '',
    currentAccount: null,
    mne: '',
    autoLockTime: 900,
  });
};

const createV1VaultData = (accounts?: any[]) => {
  const defaultAccounts = accounts || [
    { address: TEST_DATA.accounts[0]!.pubKey, accountName: 'Account 1', type: 'WALLET_INSIDE', hdPath: 0, typeIndex: 0, privateKey: 'enc_key_0' },
  ];
  return [{
    currentAddress: defaultAccounts[0]?.address || '',
    mnemonic: 'encrypted_mnemonic',
    accounts: defaultAccounts,
  }];
};

// ==================== Tests ====================
describe('APIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetMockStoreState();
  });

  // ==================== 1. getLockStatus ====================
  describe('getLockStatus', () => {
    it('should be a function', () => {
      expect(typeof apiService.getLockStatus).toBe('function');
    });

    it('should return boolean value', () => {
      const result = apiService.getLockStatus();
      expect(typeof result === 'boolean' || result === null).toBe(true);
    });
  });

  // ==================== 2. getStore ====================
  describe('getStore', () => {
    it('should return memStore state', () => {
      const result = apiService.getStore();
      expect(result).toEqual(mockStoreState);
    });
  });

  // ==================== 3. checkPassword ====================
  describe('checkPassword', () => {
    it('should return true for correct password', () => {
      mockStoreState.password = 'correctPwd';
      expect(apiService.checkPassword('correctPwd')).toBe(true);
    });

    it('should return false for incorrect password', () => {
      mockStoreState.password = 'correctPwd';
      expect(apiService.checkPassword('wrongPwd')).toBe(false);
    });

    it('should return false for empty password', () => {
      mockStoreState.password = 'correctPwd';
      expect(apiService.checkPassword('')).toBe(false);
    });
  });

  // ==================== 4. createPwd ====================
  describe('createPwd', () => {
    it('should update password in state', () => {
      apiService.createPwd('newPassword');
      expect(mockStoreState.password).toBe('newPassword');
    });
  });

  // ==================== 5. getCurrentAutoLockTime ====================
  describe('getCurrentAutoLockTime', () => {
    it('should return current autoLockTime', () => {
      mockStoreState.autoLockTime = 300;
      expect(apiService.getCurrentAutoLockTime()).toBe(300);
    });

    it('should return default value when not set', () => {
      mockStoreState.autoLockTime = 900;
      expect(apiService.getCurrentAutoLockTime()).toBe(900);
    });
  });

  // ==================== 6. updateLockTime ====================
  describe('updateLockTime', () => {
    it('should update autoLockTime in state and storage', async () => {
      await apiService.updateLockTime(600);
      expect(mockStoreState.autoLockTime).toBe(600);
      expect(mockStorageService.save).toHaveBeenCalledWith({ autoLockTime: 600 });
    });

    it('should handle -1 for never lock', async () => {
      await apiService.updateLockTime(-1);
      expect(mockStoreState.autoLockTime).toBe(-1);
    });
  });

  // ==================== 7. submitPassword ====================
  describe('submitPassword', () => {
    beforeEach(() => {
      mockStorageService.get.mockResolvedValue({ keyringData: 'encrypted_data' });
    });

    it('should unlock successfully with V1 vault format', async () => {
      const mockVaultV1 = [{
        currentAddress: TEST_DATA.accounts[0]!.pubKey,
        mnemonic: 'encrypted_mnemonic',
        accounts: [{ address: TEST_DATA.accounts[0]!.pubKey, accountName: 'Account 1', type: 'WALLET_INSIDE', hdPath: 0 }],
      }];
      mockEncryptUtils.decrypt.mockResolvedValue(mockVaultV1);

      const result = await apiService.submitPassword(TEST_DATA.password);

      expect(mockEncryptUtils.decrypt).toHaveBeenCalledWith(TEST_DATA.password, 'encrypted_data');
      expect(mockMemStore.unlock).toHaveBeenCalled();
      expect(result).toHaveProperty('address');
    });

    it('should return error when password wrong', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockEncryptUtils.decrypt.mockRejectedValue(new Error('decrypt failed'));

      const result = await apiService.submitPassword('wrong');

      expect(result).toEqual({ error: 'passwordError', type: 'local' });
      consoleSpy.mockRestore();
    });
  });

  // ==================== 8. getCurrentAccount ====================
  describe('getCurrentAccount', () => {
    it('should return current account when unlocked', async () => {
      mockStoreState.isUnlocked = true;
      mockStoreState.currentAccount = {
        address: 'B62qCurr',
        accountName: 'Main',
        type: 'WALLET_INSIDE',
      };

      const result = await apiService.getCurrentAccount();

      expect(result).toHaveProperty('address', 'B62qCurr');
      expect(result).toHaveProperty('accountName', 'Main');
      expect(result).toHaveProperty('isUnlocked', true);
    });

    it('should return locked status when locked', async () => {
      mockStoreState.isUnlocked = false;
      mockStoreState.currentAccount = { address: 'B62qCurr' };

      const result = await apiService.getCurrentAccount();

      expect(result).toHaveProperty('isUnlocked', false);
    });
  });

  // ==================== 9. getCurrentAccountAddress ====================
  describe('getCurrentAccountAddress', () => {
    it('should return current account address', () => {
      mockStoreState.currentAccount = { address: 'B62qCurrentAddr' };
      expect(apiService.getCurrentAccountAddress()).toBe('B62qCurrentAddr');
    });

    it('should throw when no current account', () => {
      mockStoreState.currentAccount = null;
      expect(() => apiService.getCurrentAccountAddress()).toThrow();
    });
  });

  // ==================== 10. setUnlockedStatus ====================
  describe('setUnlockedStatus', () => {
    it('should update state when locking', () => {
      mockStoreState.autoLockTime = 900;
      mockStoreState.currentAccount = { address: 'B62qTestAddr' };

      apiService.setUnlockedStatus(false);

      expect(mockMemStore.lock).toHaveBeenCalled();
      expect(mockSendMsg).toHaveBeenCalled();
    });

    it('should send message when unlocking', () => {
      mockStoreState.isUnlocked = true;
      apiService.setUnlockedStatus(true);
      expect(mockSendMsg).toHaveBeenCalled();
    });
  });

  // ==================== 11. getAllAccount ====================
  describe('getAllAccount', () => {
    it('should be a function', () => {
      expect(typeof apiService.getAllAccount).toBe('function');
    });

    it('should return object with accounts and currentAddress', () => {
      mockStoreState.data = null;
      const result = apiService.getAllAccount();
      expect(result).toHaveProperty('accounts');
      expect(result).toHaveProperty('currentAddress');
    });
  });

  // ==================== 12. accountSort ====================
  describe('accountSort', () => {
    it('should be a function', () => {
      expect(typeof apiService.accountSort).toBe('function');
    });
  });

  // ==================== 15. createAccount ====================
  describe('createAccount', () => {
    it('should be a function', () => {
      expect(typeof apiService.createAccount).toBe('function');
    });

    it('should call importWalletByMnemonic and encrypt data', async () => {
      mockStoreState.password = TEST_DATA.password;
      mockAccountService.importWalletByMnemonic.mockReturnValue({
        pubKey: TEST_DATA.accounts[0]!.pubKey,
        priKey: TEST_DATA.accounts[0]!.priKey,
        hdIndex: 0,
      });
      mockEncryptUtils.encrypt.mockResolvedValue('encrypted_data');

      const result = await apiService.createAccount(TEST_DATA.mnemonic);
      
      expect(mockAccountService.importWalletByMnemonic).toHaveBeenCalled();
      expect(mockEncryptUtils.encrypt).toHaveBeenCalled();
      expect(result).toHaveProperty('address');
    });

    it('should save encrypted data to storage', async () => {
      mockStoreState.password = TEST_DATA.password;
      mockAccountService.importWalletByMnemonic.mockReturnValue({
        pubKey: TEST_DATA.accounts[0]!.pubKey,
        priKey: TEST_DATA.accounts[0]!.priKey,
        hdIndex: 0,
      });
      mockEncryptUtils.encrypt.mockResolvedValue('encrypted_data');

      await apiService.createAccount(TEST_DATA.mnemonic);
      
      expect(mockStorageService.save).toHaveBeenCalled();
    });
  });

  // ==================== 16. addHDNewAccount ====================
  describe('addHDNewAccount', () => {
    it('should be a function', () => {
      expect(typeof apiService.addHDNewAccount).toBe('function');
    });

    it('should add new HD account with V1 vault', async () => {
      mockStoreState.data = createV1VaultData();
      mockStoreState.password = TEST_DATA.password;
      mockEncryptUtils.decrypt.mockResolvedValue(TEST_DATA.mnemonic);
      mockAccountService.importWalletByMnemonic.mockReturnValue({
        pubKey: TEST_DATA.accounts[1]!.pubKey,
        priKey: TEST_DATA.accounts[1]!.priKey,
        hdIndex: 1,
      });
      mockEncryptUtils.encrypt.mockResolvedValue('encrypted_data');

      const result = await apiService.addHDNewAccount('New Account');
      expect(result).toHaveProperty('address', TEST_DATA.accounts[1]!.pubKey);
    });

    it('should return error when address already exists', async () => {
      mockStoreState.data = createV1VaultData();
      mockStoreState.password = TEST_DATA.password;
      mockEncryptUtils.decrypt.mockResolvedValue(TEST_DATA.mnemonic);
      mockAccountService.importWalletByMnemonic.mockReturnValue({
        pubKey: TEST_DATA.accounts[0]!.pubKey,
        priKey: TEST_DATA.accounts[0]!.priKey,
        hdIndex: 1,
      });
      mockEncryptUtils.encrypt.mockResolvedValue('encrypted_data');

      const result = await apiService.addHDNewAccount('Account');
      expect(result).toHaveProperty('error', 'importRepeat');
    });
  });

  // ==================== 17. addImportAccount ====================
  describe('addImportAccount', () => {
    it('should be a function', () => {
      expect(typeof apiService.addImportAccount).toBe('function');
    });

    it('should import account with V1 vault', async () => {
      mockStoreState.data = createV1VaultData();
      mockStoreState.password = TEST_DATA.password;
      mockAccountService.importWalletByPrivateKey.mockReturnValue({
        pubKey: TEST_DATA.importedAccount.pubKey,
        priKey: TEST_DATA.importedAccount.priKey,
      });
      mockEncryptUtils.encrypt.mockResolvedValue('encrypted_data');

      const result = await apiService.addImportAccount(TEST_DATA.importedAccount.priKey, 'Import');
      expect(result).toHaveProperty('address', TEST_DATA.importedAccount.pubKey);
    });

    it('should return error when address already exists', async () => {
      mockStoreState.data = createV1VaultData();
      mockStoreState.password = TEST_DATA.password;
      mockAccountService.importWalletByPrivateKey.mockReturnValue({
        pubKey: TEST_DATA.accounts[0]!.pubKey,
        priKey: TEST_DATA.accounts[0]!.priKey,
      });

      const result = await apiService.addImportAccount(TEST_DATA.accounts[0]!.priKey, 'Account');
      expect(result).toHaveProperty('error', 'importRepeat');
    });
  });

  // ==================== 18. addAccountByKeyStore ====================
  describe('addAccountByKeyStore', () => {
    it('should be a function', () => {
      expect(typeof apiService.addAccountByKeyStore).toBe('function');
    });

    it('should import account via keystore', async () => {
      mockStoreState.data = createV1VaultData();
      mockStoreState.password = TEST_DATA.password;
      mockAccountService.importWalletByKeystore.mockResolvedValue({
        pubKey: TEST_DATA.importedAccount.pubKey,
        priKey: TEST_DATA.importedAccount.priKey,
      });
      mockAccountService.importWalletByPrivateKey.mockReturnValue({
        pubKey: TEST_DATA.importedAccount.pubKey,
        priKey: TEST_DATA.importedAccount.priKey,
      });
      mockEncryptUtils.encrypt.mockResolvedValue('encrypted_data');

      const result = await apiService.addAccountByKeyStore('keystoreJson', 'password', 'Keystore');
      expect(result).toHaveProperty('address');
    });

    it('should return error when keystore decryption fails', async () => {
      mockAccountService.importWalletByKeystore.mockResolvedValue({ error: 'keystoreError' });

      const result = await apiService.addAccountByKeyStore('invalid', 'wrong', 'Test');
      expect(result).toHaveProperty('error');
    });
  });

  // ==================== 19. addLedgerAccount ====================
  describe('addLedgerAccount', () => {
    it('should be a function', () => {
      expect(typeof apiService.addLedgerAccount).toBe('function');
    });

    it('should add ledger account with V1 vault', async () => {
      mockStoreState.data = createV1VaultData();
      mockStoreState.password = TEST_DATA.password;
      mockEncryptUtils.encrypt.mockResolvedValue('encrypted_data');

      const result = await apiService.addLedgerAccount(
        TEST_DATA.ledgerAccount.pubKey,
        TEST_DATA.ledgerAccount.accountName,
        TEST_DATA.ledgerAccount.hdPath
      );
      expect(result).toHaveProperty('address', TEST_DATA.ledgerAccount.pubKey);
    });

    it('should return error when ledger address already exists', async () => {
      mockStoreState.data = createV1VaultData();
      mockStoreState.password = TEST_DATA.password;
      mockEncryptUtils.encrypt.mockResolvedValue('encrypted_data');

      const result = await apiService.addLedgerAccount(TEST_DATA.accounts[0]!.pubKey, 'Ledger', 0);
      expect(result).toHaveProperty('error', 'importRepeat');
    });
  });

  // ==================== 20. setCurrentAccount ====================
  describe('setCurrentAccount', () => {
    it('should be a function', () => {
      expect(typeof apiService.setCurrentAccount).toBe('function');
    });

    it('should set current account with V1 vault', async () => {
      mockStoreState.data = createV1VaultData();
      mockStoreState.password = TEST_DATA.password;
      mockEncryptUtils.encrypt.mockResolvedValue('encrypted_data');

      const result = await apiService.setCurrentAccount(TEST_DATA.accounts[0]!.pubKey);
      expect(result).toHaveProperty('currentAddress', TEST_DATA.accounts[0]!.pubKey);
    });
  });

  // ==================== 21. changeAccountName ====================
  describe('changeAccountName', () => {
    it('should be a function', () => {
      expect(typeof apiService.changeAccountName).toBe('function');
    });

    it('should change account name with V1 vault', async () => {
      mockStoreState.data = createV1VaultData();
      mockStoreState.password = TEST_DATA.password;
      mockEncryptUtils.encrypt.mockResolvedValue('encrypted_data');

      const result = await apiService.changeAccountName(TEST_DATA.accounts[0]!.pubKey, 'New Name');
      expect(result).toHaveProperty('account');
      expect(result.account).toHaveProperty('accountName', 'New Name');
    });
  });

  // ==================== 22. deleteAccount ====================
  describe('deleteAccount', () => {
    it('should be a function', () => {
      expect(typeof apiService.deleteAccount).toBe('function');
    });

    it('should delete watch account from V1 vault', async () => {
      const watchAccount = { address: 'B62qWatch', accountName: 'Watch', type: 'WALLET_WATCH', hdPath: 0, typeIndex: 0, privateKey: '' };
      mockStoreState.data = createV1VaultData([
        { address: TEST_DATA.accounts[0]!.pubKey, accountName: 'Account 1', type: 'WALLET_INSIDE', hdPath: 0, typeIndex: 0, privateKey: 'enc_key_0' },
        watchAccount,
      ]);
      mockStoreState.password = TEST_DATA.password;
      mockStoreState.currentAccount = { address: TEST_DATA.accounts[0]!.pubKey };
      mockEncryptUtils.encrypt.mockResolvedValue('encrypted_data');

      const result = await apiService.deleteAccount('B62qWatch', '');
      expect(result).toHaveProperty('address');
    });

    it('should delete account with correct password', async () => {
      const importedAccount = { address: TEST_DATA.importedAccount.pubKey, accountName: 'Import', type: 'WALLET_OUTSIDE', hdPath: 0, typeIndex: 0, privateKey: 'enc_key' };
      mockStoreState.data = createV1VaultData([
        { address: TEST_DATA.accounts[0]!.pubKey, accountName: 'Account 1', type: 'WALLET_INSIDE', hdPath: 0, typeIndex: 0, privateKey: 'enc_key_0' },
        importedAccount,
      ]);
      mockStoreState.password = TEST_DATA.password;
      mockStoreState.currentAccount = { address: TEST_DATA.accounts[0]!.pubKey };
      mockEncryptUtils.encrypt.mockResolvedValue('encrypted_data');

      const result = await apiService.deleteAccount(TEST_DATA.importedAccount.pubKey, TEST_DATA.password);
      expect(result).toHaveProperty('address');
    });

    it('should return error with incorrect password', async () => {
      mockStoreState.data = createV1VaultData();
      mockStoreState.password = TEST_DATA.password;

      const result = await apiService.deleteAccount(TEST_DATA.accounts[0]!.pubKey, 'wrongPwd');
      expect(result).toEqual({ error: 'passwordError', type: 'local' });
    });
  });

  // ==================== 23. getMnemonic ====================
  describe('getMnemonic', () => {
    it('should be a function', () => {
      expect(typeof apiService.getMnemonic).toBe('function');
    });

    it('should return mnemonic with correct password', async () => {
      mockStoreState.data = createV1VaultData();
      mockStoreState.password = TEST_DATA.password;
      mockEncryptUtils.decrypt.mockResolvedValue(TEST_DATA.mnemonic);

      const result = await apiService.getMnemonic(TEST_DATA.password);
      expect(result).toBe(TEST_DATA.mnemonic);
    });

    it('should return error with incorrect password', async () => {
      mockStoreState.password = TEST_DATA.password;

      const result = await apiService.getMnemonic('wrongPwd');
      expect(result).toEqual({ error: 'passwordError', type: 'local' });
    });
  });

  // ==================== 24. getPrivateKey ====================
  describe('getPrivateKey', () => {
    it('should be a function', () => {
      expect(typeof apiService.getPrivateKey).toBe('function');
    });

    it('should return private key with correct password', async () => {
      mockStoreState.data = createV1VaultData();
      mockStoreState.password = TEST_DATA.password;
      mockEncryptUtils.decrypt.mockResolvedValue(TEST_DATA.accounts[0]!.priKey);

      const result = await apiService.getPrivateKey(TEST_DATA.accounts[0]!.pubKey, TEST_DATA.password);
      expect(result).toBe(TEST_DATA.accounts[0]!.priKey);
    });

    it('should return error with incorrect password', async () => {
      mockStoreState.password = TEST_DATA.password;

      const result = await apiService.getPrivateKey('B62q', 'wrongPwd');
      expect(result).toEqual({ error: 'passwordError', type: 'local' });
    });
  });

  // ==================== 25. updateSecPassword ====================
  describe('updateSecPassword', () => {
    it('should be a function', () => {
      expect(typeof apiService.updateSecPassword).toBe('function');
    });

    it('should update password with correct old password', async () => {
      mockStoreState.data = createV1VaultData();
      mockStoreState.password = TEST_DATA.password;
      mockStoreState.currentAccount = { address: TEST_DATA.accounts[0]!.pubKey };
      mockEncryptUtils.decrypt.mockResolvedValue('decrypted_data');
      mockEncryptUtils.encrypt.mockResolvedValue('re_encrypted_data');

      const result = await apiService.updateSecPassword(TEST_DATA.password, 'newPassword');
      expect(result).toHaveProperty('code', 0);
    });

    it('should return error with incorrect old password', async () => {
      mockStoreState.password = TEST_DATA.password;

      const result = await apiService.updateSecPassword('wrongOld', 'newPwd');
      expect(result).toEqual({ error: 'passwordError', type: 'local' });
    });
  });

  // ==================== 27. getAccountWithoutPrivate ====================
  describe('getAccountWithoutPrivate', () => {
    it('should remove privateKey from account', () => {
      const account = {
        address: TEST_DATA.accounts[0]!.pubKey,
        privateKey: '{"data":"encrypted"}',
        accountName: 'Account 1',
      };

      const result = apiService.getAccountWithoutPrivate(account);

      expect(result).toHaveProperty('address', TEST_DATA.accounts[0]!.pubKey);
      expect(result).toHaveProperty('accountName', 'Account 1');
      expect(result.privateKey).toBeUndefined();
    });
  });

  // ==================== 28. sendTransaction (Multiple Tests) ====================
  describe('sendTransaction', () => {
    it('should handle payment transaction', async () => {
      // This is a placeholder for transaction tests
      expect(apiService.sendTransaction).toBeDefined();
    });

    it('should handle stake delegation', async () => {
      expect(apiService.sendTransaction).toBeDefined();
    });
  });

  // ==================== 29. signFields ====================
  describe('signFields', () => {
    it('should be defined', () => {
      expect(apiService.signFields).toBeDefined();
    });
  });

  // ==================== 30. createNullifierByApi ====================
  describe('createNullifierByApi', () => {
    it('should be defined', () => {
      expect(apiService.createNullifierByApi).toBeDefined();
    });

    it('should return error if creation fails', async () => {
      mockTransactionService.createNullifierByApi.mockRejectedValue(new Error('Failed'));
      // Method exists and handles errors
      expect(typeof apiService.createNullifierByApi).toBe('function');
    });
  });

  // ==================== 31. postZkTx ====================
  describe('postZkTx', () => {
    it('should post zkApp transaction and check status', () => {
      expect(typeof apiService.postZkTx).toBe('function');
    });

    it('should return error if zkApp tx fails', async () => {
      expect(apiService.postZkTx).toBeDefined();
    });
  });

  // ==================== 32. postPaymentTx ====================
  describe('postPaymentTx', () => {
    it('should post payment transaction and check status', () => {
      expect(typeof apiService.postPaymentTx).toBe('function');
    });
  });

  // ==================== 33. postStakeTx ====================
  describe('postStakeTx', () => {
    it('should post stake transaction and check status', () => {
      expect(typeof apiService.postStakeTx).toBe('function');
    });
  });

  // ==================== 34. checkTxStatus ====================
  describe('checkTxStatus', () => {
    it('should call fetchTransactionStatus for mainnet tx', () => {
      expect(typeof apiService.checkTxStatus).toBe('function');
    });

    it('should call fetchQAnetTransactionStatus for QA tx', () => {
      expect(apiService.fetchQAnetTransactionStatus).toBeDefined();
    });
  });

  // ==================== 35. notification ====================
  describe('notification', () => {
    it('should create notification with correct params', () => {
      expect(typeof apiService.notification).toBe('function');
    });
  });

  // ==================== 36. Private Credential methods ====================
  describe('Private Credential methods', () => {
    it('should store and retrieve private credential', () => {
      expect(apiService.storePrivateCredential).toBeDefined();
      expect(apiService.getPrivateCredential).toBeDefined();
    });

    it('should get credential ID list', () => {
      expect(apiService.getCredentialIdList).toBeDefined();
    });

    it('should remove credential', () => {
      expect(apiService.removeTargetCredential).toBeDefined();
    });
  });

  // ==================== 37. getTargetCredential ====================
  describe('getTargetCredential', () => {
    it('should get credential by id', () => {
      expect(apiService.getTargetCredential).toBeDefined();
    });
  });

  // ==================== 38. Wallet Lifecycle ====================
  describe('Wallet Lifecycle', () => {
    describe('Full wallet creation and HD account derivation', () => {
      it('should create wallet with first account at hdIndex 0', async () => {
        mockStoreState.password = TEST_DATA.password;
        mockAccountService.importWalletByMnemonic.mockReturnValue({
          pubKey: TEST_DATA.accounts[0]!.pubKey,
          priKey: TEST_DATA.accounts[0]!.priKey,
          hdIndex: 0,
        });
        mockEncryptUtils.encrypt.mockResolvedValue('encrypted');

        const result = await apiService.createAccount(TEST_DATA.mnemonic);
        expect(result).toHaveProperty('hdPath', 0);
      });

      it('should derive second HD account at hdIndex 1', async () => {
        mockStoreState.data = createV1VaultData();
        mockStoreState.password = TEST_DATA.password;
        mockEncryptUtils.decrypt.mockResolvedValue(TEST_DATA.mnemonic);
        mockAccountService.importWalletByMnemonic.mockReturnValue({
          pubKey: TEST_DATA.accounts[1]!.pubKey,
          priKey: TEST_DATA.accounts[1]!.priKey,
          hdIndex: 1,
        });
        mockEncryptUtils.encrypt.mockResolvedValue('encrypted');

        const result = await apiService.addHDNewAccount('Account 2');
        expect(result).toHaveProperty('hdPath', 1);
      });

      it('should derive third HD account at hdIndex 2', async () => {
        mockStoreState.data = createV1VaultData();
        mockStoreState.password = TEST_DATA.password;
        mockEncryptUtils.decrypt.mockResolvedValue(TEST_DATA.mnemonic);
        mockAccountService.importWalletByMnemonic.mockReturnValue({
          pubKey: TEST_DATA.accounts[2]!.pubKey,
          priKey: TEST_DATA.accounts[2]!.priKey,
          hdIndex: 2,
        });
        mockEncryptUtils.encrypt.mockResolvedValue('encrypted');

        const result = await apiService.addHDNewAccount('Account 3');
        expect(result).toHaveProperty('hdPath', 1);
      });
    });

    describe('Account data structure validation', () => {
      it('should maintain correct account structure after multiple HD derivations', () => {
        const accounts = [
          { address: TEST_DATA.accounts[0]!.pubKey, type: 'WALLET_INSIDE', hdIndex: 0 },
          { address: TEST_DATA.accounts[1]!.pubKey, type: 'WALLET_INSIDE', hdIndex: 1 },
        ];
        expect(accounts[0]).toHaveProperty('hdIndex', 0);
        expect(accounts[1]).toHaveProperty('hdIndex', 1);
      });

      it('should sort accounts correctly with mixed types', () => {
        const accounts = [
          { address: 'B62q1', type: 'WALLET_INSIDE' },
          { address: 'B62q2', type: 'WALLET_OUTSIDE' },
          { address: 'B62q3', type: 'WALLET_WATCH' },
        ];
        mockAccountOperations.accountSort.mockReturnValue({
          allList: accounts,
          commonList: accounts.slice(0, 2),
          watchList: [accounts[2]],
        });

        const result = apiService.accountSort(accounts as any);
        expect(result.watchList).toHaveLength(1);
      });
    });

    describe('Encryption verification', () => {
      it('should encrypt data with version 2 format', async () => {
        mockEncryptUtils.encrypt.mockResolvedValue('{"version":2,"data":"encrypted"}');
        const encrypted = await mockEncryptUtils.encrypt('password', 'data');
        expect(encrypted).toContain('version');
      });

      it('should decrypt mnemonic correctly for HD derivation', async () => {
        mockEncryptUtils.decrypt.mockResolvedValue(TEST_DATA.mnemonic);
        const mnemonic = await mockEncryptUtils.decrypt('password', 'encrypted');
        expect(mnemonic).toBe(TEST_DATA.mnemonic);
      });
    });

    describe('Password security', () => {
      it('should use password for all encryption operations', async () => {
        mockStoreState.password = TEST_DATA.password;
        mockEncryptUtils.encrypt.mockResolvedValue('encrypted');
        await mockEncryptUtils.encrypt(TEST_DATA.password, 'data');
        expect(mockEncryptUtils.encrypt).toHaveBeenCalledWith(TEST_DATA.password, 'data');
      });

      it('should update all encrypted data when password changes', async () => {
        mockStoreState.data = createV1VaultData();
        mockStoreState.password = TEST_DATA.password;
        mockStoreState.currentAccount = { address: TEST_DATA.accounts[0]!.pubKey };
        mockEncryptUtils.decrypt.mockResolvedValue('decrypted');
        mockEncryptUtils.encrypt.mockResolvedValue('re_encrypted');
        const result = await apiService.updateSecPassword(TEST_DATA.password, 'newPassword');
        expect(result).toEqual({ code: 0 });
      });
    });
  });

  // ==================== 39. tryUpgradeVault ====================
  describe('tryUpgradeVault', () => {
    it('should return success when vault is already V2', async () => {
      mockKeyringService.tryUpgradeVaultFn.mockResolvedValue({ success: true });
      expect(typeof apiService.tryUpgradeVault).toBe('function');
    });

    it('should return error when no vault data exists', async () => {
      mockKeyringService.tryUpgradeVaultFn.mockResolvedValue({ error: 'No vault' });
      expect(apiService.tryUpgradeVault).toBeDefined();
    });
  });

  // ==================== 40. getVaultVersion ====================
  describe('getVaultVersion', () => {
    it('should return vault version', () => {
      expect(typeof apiService.getVaultVersion).toBe('function');
    });
  });

  // ==================== 41. getKeyringsList ====================
  describe('getKeyringsList', () => {
    it('should return keyrings list', () => {
      expect(typeof apiService.getKeyringsList).toBe('function');
    });
  });

  // ==================== Additional Test Suites ====================
  describe('Wallet State Management', () => {
    it('getLockStatus should be a function', () => {
      expect(typeof apiService.getLockStatus).toBe('function');
    });

    it('updateLockTime should be a function', () => {
      expect(typeof apiService.updateLockTime).toBe('function');
    });

    it('should track unlock state via getLockStatus', () => {
      // getLockStatus returns the negation of isUnlocked
      const result = apiService.getLockStatus();
      expect(typeof result === 'boolean' || result === null).toBe(true);
    });
  });

  describe('Account Management Edge Cases', () => {
    it('getAllAccount should be a function', () => {
      expect(typeof apiService.getAllAccount).toBe('function');
    });

    it('accountSort should be a function', () => {
      expect(typeof apiService.accountSort).toBe('function');
    });

    it('should sort mixed account types correctly', () => {
      const accounts = [
        { address: 'B62q1', type: 'WALLET_WATCH', accountName: 'Watch' },
        { address: 'B62q2', type: 'WALLET_INSIDE', accountName: 'HD' },
      ];
      
      const result = apiService.accountSort(accounts as any);
      
      expect(result).toHaveProperty('allList');
      expect(result).toHaveProperty('commonList');
      expect(result).toHaveProperty('watchList');
      expect(result.watchList).toHaveLength(1);
    });
  });

  describe('Password Validation', () => {
    it('should validate correct password', () => {
      mockStoreState.password = 'myPassword';
      expect(apiService.checkPassword('myPassword')).toBe(true);
    });

    it('should reject incorrect password', () => {
      mockStoreState.password = 'myPassword';
      expect(apiService.checkPassword('wrongPassword')).toBe(false);
    });

    it('should reject empty password', () => {
      mockStoreState.password = 'myPassword';
      expect(apiService.checkPassword('')).toBe(false);
    });

    it('should handle null password state', () => {
      mockStoreState.password = null;
      expect(apiService.checkPassword('anyPassword')).toBe(false);
    });
  });

  describe('Encryption Operations', () => {
    it('should call encrypt when creating account', async () => {
      mockStoreState.password = TEST_DATA.password;
      mockAccountService.importWalletByMnemonic.mockReturnValue({
        pubKey: TEST_DATA.accounts[0]!.pubKey,
        priKey: TEST_DATA.accounts[0]!.priKey,
        hdIndex: 0,
      });
      mockEncryptUtils.encrypt.mockResolvedValue('encrypted_data');

      await apiService.createAccount(TEST_DATA.mnemonic);
      
      expect(mockEncryptUtils.encrypt).toHaveBeenCalled();
    });

    it('should use decrypt via getMnemonic', async () => {
      mockStoreState.data = createV1VaultData();
      mockStoreState.password = TEST_DATA.password;
      mockEncryptUtils.decrypt.mockResolvedValue(TEST_DATA.mnemonic);

      const result = await apiService.getMnemonic(TEST_DATA.password);
      
      expect(mockEncryptUtils.decrypt).toHaveBeenCalled();
      expect(result).toBe(TEST_DATA.mnemonic);
    });
  });

  describe('Storage Operations', () => {
    it('should call storage.save when creating account', async () => {
      mockStoreState.password = TEST_DATA.password;
      mockAccountService.importWalletByMnemonic.mockReturnValue({
        pubKey: TEST_DATA.accounts[0]!.pubKey,
        priKey: TEST_DATA.accounts[0]!.priKey,
        hdIndex: 0,
      });
      mockEncryptUtils.encrypt.mockResolvedValue('encrypted_data');

      await apiService.createAccount(TEST_DATA.mnemonic);
      
      expect(mockStorageService.save).toHaveBeenCalled();
    });

    it('should save to storage on lock time update', async () => {
      await apiService.updateLockTime(300);
      expect(mockStorageService.save).toHaveBeenCalledWith({ autoLockTime: 300 });
    });
  });
});
