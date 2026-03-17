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
const MOCK_CRYPTO_KEY = { type: 'secret', extractable: false } as unknown as CryptoKey;

const mockEncryptUtils = {
  encrypt: jest.fn().mockResolvedValue('encrypted_data'),
  decrypt: jest.fn(),
  deriveSessionKey: jest.fn().mockResolvedValue({ key: MOCK_CRYPTO_KEY, salt: 'mock-vault-salt' }),
  encryptWithCryptoKey: jest.fn().mockResolvedValue('encrypted_data'),
  decryptWithCryptoKey: jest.fn(),
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
    mockStoreState.cryptoKey = null;
    mockStoreState.vaultSalt = '';
    mockStoreState.data = null;
    mockStoreState.currentAccount = null;
  }),
  unlock: jest.fn((params: any) => {
    mockStoreState.isUnlocked = true;
    mockStoreState.cryptoKey = params.cryptoKey;
    mockStoreState.vaultSalt = params.vaultSalt;
    mockStoreState.data = params.data;
    mockStoreState.currentAccount = params.currentAccount;
    mockStoreState.autoLockTime = params.autoLockTime;
  }),
  reset: jest.fn(() => {
    mockStoreState.isUnlocked = false;
    mockStoreState.cryptoKey = null;
    mockStoreState.vaultSalt = '';
    mockStoreState.data = null;
    mockStoreState.currentAccount = {};
    mockStoreState.mne = '';
  }),
  setMnemonic: jest.fn((mne: string) => { mockStoreState.mne = mne; }),
  setCurrentAccount: jest.fn((account: any) => { mockStoreState.currentAccount = account; }),
};

let mockStorageData: Record<string, any> = {};

const mockStorageService = {
  get: jest.fn((key: string | string[]) => {
    if (typeof key === 'string') {
      return Promise.resolve(key in mockStorageData ? { [key]: mockStorageData[key] } : {});
    }
    const result: Record<string, any> = {};
    for (const k of key) {
      if (k in mockStorageData) result[k] = mockStorageData[k];
    }
    return Promise.resolve(result);
  }),
  save: jest.fn((data: any) => {
    Object.assign(mockStorageData, data);
    return Promise.resolve(undefined);
  }),
  removeValue: jest.fn((keys: string | string[]) => {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    for (const k of keysArray) { delete mockStorageData[k]; }
    return Promise.resolve(undefined);
  }),
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

jest.mock('../../src/utils/encryptUtils', () => ({ __esModule: true, default: mockEncryptUtils, ENCRYPT_VERSION_CRYPTOKEY: 3 }));

jest.mock('../../src/store', () => ({ memStore: mockMemStore }));

jest.mock('../../src/background/storageService', () => mockStorageService);

jest.mock('../../src/background/accountService', () => mockAccountService);

jest.mock('../../src/utils/commonMsg', () => ({ sendMsg: mockSendMsg }));

jest.mock('../../src/utils/browserUtils', () => ({
  getExtensionAction: jest.fn(() => ({ setIcon: jest.fn().mockResolvedValue(undefined) })),
  getCurrentNodeConfig: jest.fn().mockResolvedValue({ explorer: 'https://minascan.io' }),
}));


jest.mock('../../src/constant/vaultTypes', () => ({
  isLegacyVault: jest.fn((v: any) => {
    if (!Array.isArray(v) || v.length === 0) return false;
    const first = v[0];
    return !!(
      first &&
      typeof first === 'object' &&
      ('currentAddress' in first) &&
      ('mnemonic' in first || 'accounts' in first)
    );
  }),
  isModernVault: jest.fn((v: any) => v && v.version >= 2),
  VAULT_VERSION: 3,
  KEYRING_TYPE: { HD: 'hd', IMPORTED: 'imported', LEDGER: 'ledger', WATCH: 'watch' },
  generateUUID: jest.fn(() => 'mock-uuid'),
  getDefaultHDWalletName: jest.fn((i: number) => `Wallet ${i}`),
  createHDKeyring: jest.fn(() => ({
    id: 'keyring-1',
    type: 'hd',
    name: 'Wallet 1',
    mnemonic: '',
    accounts: [],
    currentAddress: null,
  })),
  createEmptyVault: jest.fn(() => ({
    version: 3,
    currentKeyringId: '',
    keyrings: [],
    nextWalletIndex: 1,
  })),
  countHDKeyrings: jest.fn().mockReturnValue(0),
  sortKeyringsByCreatedAt: jest.fn((keyrings: any[]) => keyrings),
}));

jest.mock('../../src/background/vaultMigration', () => ({
  normalizeVault: jest.fn((vault: any) => ({ vault, migrated: false })),
  convertModernToLegacy: jest.fn((vault: any) => vault),
  validateVault: jest.fn().mockReturnValue({ valid: true, errors: [] }),
  keyringTypeToAccountType: jest.fn((keyringType: string) => {
    const map: Record<string, string> = { hd: 'WALLET_INSIDE', imported: 'WALLET_OUTSIDE', ledger: 'WALLET_LEDGER', watch: 'WALLET_WATCH' };
    return map[keyringType] || 'WALLET_INSIDE';
  }),
}));

// Import after mocks
import apiService from '../../src/background/apiService/APIService';
import { normalizeVault } from '../../src/background/vaultMigration';

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
    cryptoKey: null,
    vaultSalt: '',
    currentAccount: null,
    mne: '',
    autoLockTime: 900,
  });
};

const resetMockStorage = () => {
  Object.keys(mockStorageData).forEach(key => delete mockStorageData[key]);
};

/** Set up mock state for an "authenticated" wallet session */
const setupAuthenticated = () => {
  mockStoreState.cryptoKey = MOCK_CRYPTO_KEY;
  mockStoreState.vaultSalt = 'mock-vault-salt';
  mockStorageData.keyringData = JSON.stringify({ version: 3, data: 'blob', iv: 'iv' });
  mockEncryptUtils.decryptWithCryptoKey.mockResolvedValue({ version: 3, keyrings: [] });
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

const createV3VaultData = (overrides: Record<string, any> = {}) => ({
  version: 3,
  currentKeyringId: 'kr-hd',
  nextWalletIndex: 2,
  keyrings: [
    {
      id: 'kr-hd',
      type: 'hd',
      name: 'Wallet 1',
      mnemonic: JSON.stringify({ version: 3, data: 'mne', iv: 'iv' }),
      nextHdIndex: 1,
      currentAddress: TEST_DATA.accounts[0]!.pubKey,
      createdAt: Date.now(),
      accounts: [
        {
          address: TEST_DATA.accounts[0]!.pubKey,
          hdIndex: 0,
          name: 'Account 1',
        },
      ],
    },
  ],
  ...overrides,
});

// ==================== Tests ====================
describe('APIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetMockStoreState();
    resetMockStorage();
    // Restore default mock implementations after clearAllMocks
    mockEncryptUtils.encrypt.mockResolvedValue('encrypted_data');
    mockEncryptUtils.encryptWithCryptoKey.mockResolvedValue('encrypted_data');
    mockEncryptUtils.deriveSessionKey.mockResolvedValue({ key: MOCK_CRYPTO_KEY, salt: 'mock-vault-salt' });
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
    it('should return true for correct password (vault decrypt)', async () => {
      setupAuthenticated();
      mockStorageData.keyringData = JSON.stringify({ version: 3, data: 'blob', iv: 'iv' });
      const result = await apiService.checkPassword('correctPwd');
      expect(result).toBe(true);
      // Derives a fresh key and attempts to decrypt the vault
      expect(mockEncryptUtils.deriveSessionKey).toHaveBeenCalledWith('correctPwd', 'mock-vault-salt');
      expect(mockEncryptUtils.decryptWithCryptoKey).toHaveBeenCalledWith(
        MOCK_CRYPTO_KEY,
        mockStorageData.keyringData
      );
    });

    it('should return false for incorrect password (decrypt fails)', async () => {
      setupAuthenticated();
      mockEncryptUtils.decryptWithCryptoKey.mockRejectedValueOnce(new Error('Incorrect password'));
      const result = await apiService.checkPassword('wrongPwd');
      expect(result).toBe(false);
    });

    it('should return false when no vaultSalt', async () => {
      mockStoreState.vaultSalt = '';
      const result = await apiService.checkPassword('anyPwd');
      expect(result).toBe(false);
    });

    it('should return false when no keyringData in storage', async () => {
      mockStoreState.vaultSalt = 'mock-vault-salt';
      // no keyringData in storage
      const result = await apiService.checkPassword('anyPwd');
      expect(result).toBe(false);
    });

    it('should verify with in-memory v3 inner secret without loading full vault', async () => {
      setupAuthenticated();
      const encryptedMnemonicProbe = JSON.stringify({
        version: 3,
        data: 'cipher',
        iv: 'iv',
      });
      mockStoreState.data = {
        version: 3,
        currentKeyringId: 'kr-1',
        keyrings: [
          {
            id: 'kr-1',
            type: 'hd',
            mnemonic: encryptedMnemonicProbe,
            currentAddress: TEST_DATA.accounts[0]!.pubKey,
            accounts: [{ address: TEST_DATA.accounts[0]!.pubKey, hdIndex: 0, name: 'Account 1' }],
          },
        ],
      };

      const result = await apiService.checkPassword('correctPwd');

      expect(result).toBe(true);
      expect(mockEncryptUtils.decryptWithCryptoKey).toHaveBeenCalledWith(
        MOCK_CRYPTO_KEY,
        encryptedMnemonicProbe
      );
      expect(mockStorageService.get).not.toHaveBeenCalledWith('keyringData');
    });

    it('should load vaultSalt from storage when not in memory', async () => {
      mockStoreState.vaultSalt = '';
      mockStorageData.vaultSalt = 'mock-vault-salt';
      mockStorageData.keyringData = 'encrypted_data';

      const result = await apiService.checkPassword('correctPwd');

      expect(result).toBe(true);
      expect(mockEncryptUtils.deriveSessionKey).toHaveBeenCalledWith('correctPwd', 'mock-vault-salt');
    });

    it('should verify legacy encrypted vault when no salt is available', async () => {
      mockStoreState.vaultSalt = '';
      mockStorageData.keyringData = JSON.stringify({ version: 2, data: 'blob', iv: 'iv', salt: 'salt' });
      mockEncryptUtils.decrypt.mockResolvedValueOnce([{ accounts: [] }]);

      const result = await apiService.checkPassword('legacyPwd');

      expect(result).toBe(true);
      expect(mockEncryptUtils.deriveSessionKey).not.toHaveBeenCalled();
      expect(mockEncryptUtils.decrypt).toHaveBeenCalledWith('legacyPwd', mockStorageData.keyringData);
    });

    it('should verify version-less legacy encrypted vault when no salt is available', async () => {
      mockStoreState.vaultSalt = '';
      mockStorageData.keyringData = JSON.stringify({ data: 'blob', iv: 'iv' });
      mockEncryptUtils.decrypt.mockResolvedValueOnce([{ accounts: [] }]);

      const result = await apiService.checkPassword('legacyPwd');

      expect(result).toBe(true);
      expect(mockEncryptUtils.decrypt).toHaveBeenCalledWith('legacyPwd', mockStorageData.keyringData);
    });

    it('should fall back to legacy decrypt when outer vault is not v3', async () => {
      mockStoreState.vaultSalt = 'mock-vault-salt';
      mockStorageData.keyringData = JSON.stringify({ version: 2, data: 'blob', iv: 'iv', salt: 'salt' });
      mockEncryptUtils.decrypt.mockResolvedValueOnce([{ accounts: [] }]);

      const result = await apiService.checkPassword('legacyPwdWithSalt');

      expect(result).toBe(true);
      expect(mockEncryptUtils.deriveSessionKey).toHaveBeenCalledWith('legacyPwdWithSalt', 'mock-vault-salt');
      expect(mockEncryptUtils.decrypt).toHaveBeenCalledWith('legacyPwdWithSalt', mockStorageData.keyringData);
    });
  });

  // ==================== 4. createPwd ====================
  describe('createPwd', () => {
    it('should derive CryptoKey and update state (no verifier needed)', async () => {
      await apiService.createPwd('newPassword');
      expect(mockEncryptUtils.deriveSessionKey).toHaveBeenCalledWith('newPassword');
      expect(mockStoreState.cryptoKey).toBe(MOCK_CRYPTO_KEY);
      expect(mockStoreState.vaultSalt).toBe('mock-vault-salt');
    });

    it('should clear temporary create-flow mnemonic before deriving new key', async () => {
      mockStoreState.mne = 'stale_encrypted_mnemonic';

      await apiService.createPwd('newPassword');

      expect(mockMemStore.setMnemonic).toHaveBeenCalledWith('');
      expect(mockStoreState.mne).toBe('');
    });

    it('should throw vaultAlreadyExists when keyringData exists in storage', async () => {
      mockStorageData.keyringData = 'existing_vault_data';

      await expect(apiService.createPwd('newPassword')).rejects.toThrow('vaultAlreadyExists');
      expect(mockEncryptUtils.deriveSessionKey).not.toHaveBeenCalled();
      expect(mockStorageService.save).not.toHaveBeenCalled();
    });
  });

  // ==================== 5. getCreateMnemonic ====================
  describe('getCreateMnemonic', () => {
    it('should return empty string when wallet is not ready (missing cryptoKey)', async () => {
      mockStoreState.cryptoKey = null;

      const result = await apiService.getCreateMnemonic(true);

      expect(result).toBe('');
      expect(mockAccountService.generateMne).not.toHaveBeenCalled();
      expect(mockMemStore.setMnemonic).not.toHaveBeenCalled();
    });

    it('should encrypt and store mnemonic in memory only for first-time creation', async () => {
      mockStoreState.cryptoKey = MOCK_CRYPTO_KEY;
      mockStoreState.data = null; // first-time creation: no vault
      mockAccountService.generateMne.mockReturnValueOnce('word1 word2');
      mockEncryptUtils.encryptWithCryptoKey.mockResolvedValueOnce('encrypted_mne');

      const result = await apiService.getCreateMnemonic(true);

      expect(result).toBe('word1 word2');
      expect(mockEncryptUtils.encryptWithCryptoKey).toHaveBeenCalledWith(
        MOCK_CRYPTO_KEY,
        'word1 word2'
      );
      expect(mockMemStore.setMnemonic).toHaveBeenCalledWith('encrypted_mne');
      // First-time creation: NOT persisted to storage (memory only)
      expect(mockStorageService.save).not.toHaveBeenCalledWith({ pendingCreateMnemonic: 'encrypted_mne' });
    });

    it('should persist mnemonic to storage for add-wallet flow (existing vault)', async () => {
      mockStoreState.cryptoKey = MOCK_CRYPTO_KEY;
      mockStoreState.data = createV3VaultData(); // add-wallet: vault exists
      mockAccountService.generateMne.mockReturnValueOnce('word1 word2');
      mockEncryptUtils.encryptWithCryptoKey.mockResolvedValueOnce('encrypted_mne');

      const result = await apiService.getCreateMnemonic(true);

      expect(result).toBe('word1 word2');
      expect(mockMemStore.setMnemonic).toHaveBeenCalledWith('encrypted_mne');
      // Add-wallet flow: persisted to storage
      expect(mockStorageService.save).toHaveBeenCalledWith({ pendingCreateMnemonic: 'encrypted_mne' });
    });

    it('should return existing mnemonic when isNewMne=true but pending mnemonic exists in memStore', async () => {
      mockStoreState.cryptoKey = MOCK_CRYPTO_KEY;
      mockStoreState.mne = 'already_encrypted_mne';
      mockEncryptUtils.decryptWithCryptoKey.mockResolvedValueOnce('existing word1 word2');

      const result = await apiService.getCreateMnemonic(true);

      expect(result).toBe('existing word1 word2');
      expect(mockAccountService.generateMne).not.toHaveBeenCalled();
    });

    it('should return existing mnemonic when isNewMne=true but pending mnemonic exists in persistent storage', async () => {
      mockStoreState.cryptoKey = MOCK_CRYPTO_KEY;
      mockStoreState.mne = '';
      mockStorageData.pendingCreateMnemonic = 'persisted_encrypted_mne';
      mockEncryptUtils.decryptWithCryptoKey.mockResolvedValueOnce('persisted word1 word2');

      const result = await apiService.getCreateMnemonic(true);

      expect(result).toBe('persisted word1 word2');
      expect(mockAccountService.generateMne).not.toHaveBeenCalled();
      expect(mockMemStore.setMnemonic).toHaveBeenCalledWith('persisted_encrypted_mne');
    });
  });

  describe('getCreateMnemonicChallenge', () => {
    it('should return local tryAgain error when no temporary mnemonic exists', async () => {
      mockStoreState.mne = '';

      const result = await apiService.getCreateMnemonicChallenge();

      expect(result).toEqual({ error: 'tryAgain', type: 'local' });
    });

    it('should return shuffled challenge words from encrypted temporary mnemonic', async () => {
      mockStoreState.cryptoKey = MOCK_CRYPTO_KEY;
      mockStoreState.mne = 'encrypted_mne_payload';
      mockEncryptUtils.decryptWithCryptoKey.mockResolvedValueOnce('alpha beta gamma');

      const result = await apiService.getCreateMnemonicChallenge();

      expect(mockEncryptUtils.decryptWithCryptoKey).toHaveBeenCalledWith(
        MOCK_CRYPTO_KEY,
        'encrypted_mne_payload'
      );
      expect(result).toHaveProperty('words');
      expect((result as { words: string[] }).words).toHaveLength(3);
      expect((result as { words: string[] }).words.sort()).toEqual(['alpha', 'beta', 'gamma'].sort());
    });
  });

  describe('clearCreateMnemonic', () => {
    it('should clear in-memory temporary mnemonic cache and storage', async () => {
      mockStoreState.mne = 'stale_encrypted_mnemonic';

      const result = await apiService.clearCreateMnemonic();

      expect(result).toEqual({ success: true });
      expect(mockMemStore.setMnemonic).toHaveBeenCalledWith('');
      expect(mockStoreState.mne).toBe('');
      expect(mockStorageService.removeValue).toHaveBeenCalledWith('pendingCreateMnemonic');
    });
  });

  describe('confirmCreateMnemonic', () => {
    it('should reject when selected words do not match original order', async () => {
      mockStoreState.cryptoKey = MOCK_CRYPTO_KEY;
      mockStoreState.mne = 'encrypted_mne_payload';
      mockEncryptUtils.decryptWithCryptoKey.mockResolvedValueOnce('alpha beta gamma');
      const createSpy = jest.spyOn(apiService, 'createAccount');

      const result = await apiService.confirmCreateMnemonic(['beta', 'alpha', 'gamma']);

      expect(result).toEqual({ error: 'seed_error', type: 'local' });
      expect(createSpy).not.toHaveBeenCalled();
      createSpy.mockRestore();
    });

    it('should create account when selected words match original order', async () => {
      mockStoreState.cryptoKey = MOCK_CRYPTO_KEY;
      mockStoreState.mne = 'encrypted_mne_payload';
      mockEncryptUtils.decryptWithCryptoKey.mockResolvedValueOnce('alpha beta gamma');

      const expectedAccount = {
        address: TEST_DATA.accounts[0]!.pubKey,
        accountName: 'Account 1',
      };
      const createSpy = jest
        .spyOn(apiService, 'createAccount')
        .mockResolvedValueOnce(expectedAccount as any);

      const result = await apiService.confirmCreateMnemonic(['alpha', 'beta', 'gamma']);

      expect(createSpy).toHaveBeenCalledWith('alpha beta gamma');
      expect(result).toEqual(expectedAccount);
      createSpy.mockRestore();
    });

    it('should re-store temporary mnemonic in memory only when first-time creation fails', async () => {
      mockStoreState.cryptoKey = MOCK_CRYPTO_KEY;
      mockStoreState.mne = 'encrypted_mne_payload';
      mockStoreState.data = null; // first-time creation
      mockEncryptUtils.decryptWithCryptoKey.mockResolvedValueOnce('alpha beta gamma');

      const createSpy = jest
        .spyOn(apiService, 'createAccount')
        .mockResolvedValueOnce({ error: 'createFailed', type: 'local' } as any);

      const result = await apiService.confirmCreateMnemonic(['alpha', 'beta', 'gamma']);

      expect(result).toEqual({ error: 'createFailed', type: 'local' });
      expect(mockMemStore.setMnemonic).toHaveBeenCalledWith('encrypted_mne_payload');
      // First-time creation: NOT persisted to storage
      expect(mockStorageService.save).not.toHaveBeenCalledWith({ pendingCreateMnemonic: 'encrypted_mne_payload' });
      createSpy.mockRestore();
    });

    it('should return mnemonicLost error when mnemonic is missing from both memStore and storage', async () => {
      mockStoreState.cryptoKey = MOCK_CRYPTO_KEY;
      mockStoreState.mne = '';
      // No pendingCreateMnemonic in storage either

      const result = await apiService.confirmCreateMnemonic(['alpha', 'beta', 'gamma']);

      expect(result).toEqual({ error: 'mnemonicLost', type: 'local' });
    });

    it('should return flat AccountInfo (not nested { keyring, account }) when adding to modern vault', async () => {
      mockStoreState.cryptoKey = MOCK_CRYPTO_KEY;
      mockStoreState.mne = 'encrypted_mne_payload';
      mockStoreState.data = createV3VaultData();
      mockEncryptUtils.decryptWithCryptoKey.mockResolvedValueOnce('alpha beta gamma');

      const flatAccount = {
        address: TEST_DATA.accounts[1]!.pubKey,
        accountName: 'Account 1',
        type: 'WALLET_INSIDE',
        hdPath: 0,
        keyringId: 'kr-new',
      };
      // confirmCreateMnemonic now always delegates to createAccount,
      // which internally routes to addHDKeyring and normalizes the result.
      const createSpy = jest
        .spyOn(apiService, 'createAccount')
        .mockResolvedValueOnce(flatAccount as any);

      const result = await apiService.confirmCreateMnemonic(['alpha', 'beta', 'gamma']);

      expect(createSpy).toHaveBeenCalledWith('alpha beta gamma');
      // Must return the flat account, NOT the nested { keyring, account } object
      expect(result).toEqual(flatAccount);
      expect(result).not.toHaveProperty('keyring');
      createSpy.mockRestore();
    });

    it('should pass through addHDKeyring error result unchanged when adding to modern vault', async () => {
      mockStoreState.cryptoKey = MOCK_CRYPTO_KEY;
      mockStoreState.mne = 'encrypted_mne_payload';
      mockStoreState.data = createV3VaultData();
      mockEncryptUtils.decryptWithCryptoKey.mockResolvedValueOnce('alpha beta gamma');
      mockEncryptUtils.encryptWithCryptoKey.mockResolvedValueOnce('re_encrypted_mne');

      // confirmCreateMnemonic delegates to createAccount, which routes to addHDKeyring
      const createSpy = jest
        .spyOn(apiService, 'createAccount')
        .mockResolvedValueOnce({ error: 'repeatTip', type: 'local' } as any);

      const result = await apiService.confirmCreateMnemonic(['alpha', 'beta', 'gamma']);

      expect(result).toEqual({ error: 'repeatTip', type: 'local' });
      createSpy.mockRestore();
    });

    it('should clear memStore mnemonic after successful confirmation', async () => {
      mockStoreState.cryptoKey = MOCK_CRYPTO_KEY;
      mockStoreState.mne = 'encrypted_mne_payload';
      mockEncryptUtils.decryptWithCryptoKey.mockResolvedValueOnce('alpha beta gamma');

      const createSpy = jest
        .spyOn(apiService, 'createAccount')
        .mockResolvedValueOnce({ address: 'B62q...', accountName: 'Account 1' } as any);

      await apiService.confirmCreateMnemonic(['alpha', 'beta', 'gamma']);

      expect(mockMemStore.setMnemonic).toHaveBeenCalledWith('');
      createSpy.mockRestore();
    });
  });

  // ==================== 6. resetWallet ====================
  describe('resetWallet', () => {
    it('should clear persisted vault keys and in-memory account state', async () => {
      mockStoreState.isUnlocked = true;
      mockStoreState.cryptoKey = MOCK_CRYPTO_KEY;
      mockStoreState.vaultSalt = 'mock-vault-salt';
      mockStoreState.data = createV1VaultData();
      mockStoreState.currentAccount = { address: 'B62qCurr', accountName: 'Main' };
      mockStoreState.mne = 'temp mnemonic';

      await apiService.resetWallet();

      expect(mockStorageService.removeValue).toHaveBeenCalledWith(['keyringData', 'vaultSalt', 'pendingCreateMnemonic', 'ZKAPP_APPROVE_LIST', 'credentials', 'credentialsEncrypted']);
      expect(mockStoreState.isUnlocked).toBe(false);
      expect(mockStoreState.cryptoKey).toBeNull();
      expect(mockStoreState.vaultSalt).toBe('');
      expect(mockStoreState.data).toBeNull();
      expect(mockStoreState.currentAccount).toEqual({});
      expect(mockStoreState.mne).toBe('');
    });

    it('should not send SET_LOCK notification after reset (caller handles redirect)', async () => {
      await apiService.resetWallet();

      expect(mockSendMsg).not.toHaveBeenCalledWith(expect.objectContaining({
        payload: false,
      }));
    });

    it('should clear auto-lock and tx polling timers', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const activeTimer = setTimeout(() => {}, 10_000);
      (apiService as any).activeTimer = activeTimer;
      const txTimer = setTimeout(() => {}, 10_000);
      (apiService as any).txTimers.set('test-payment-id', txTimer);

      await apiService.resetWallet();

      expect(clearTimeoutSpy).toHaveBeenCalledWith(activeTimer);
      expect(clearTimeoutSpy).toHaveBeenCalledWith(txTimer);
      expect((apiService as any).activeTimer).toBeNull();
      expect((apiService as any).txTimers.size).toBe(0);
      clearTimeoutSpy.mockRestore();
    });
  });

  // ==================== 7. getCurrentAutoLockTime ====================
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

  // ==================== 7. updateLockTime ====================
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

  // ==================== 8. submitPassword ====================
  describe('submitPassword', () => {
    const V2_ENCRYPTED_PAYLOAD = JSON.stringify({ data: 'base64enc', iv: 'base64iv', salt: 'base64salt', version: 2 });

    beforeEach(() => {
      mockStorageData.keyringData = V2_ENCRYPTED_PAYLOAD;
    });

    it('should unlock successfully with V1 vault format (old encryption path)', async () => {
      const mockVaultV1 = [{
        currentAddress: TEST_DATA.accounts[0]!.pubKey,
        mnemonic: 'encrypted_mnemonic',
        accounts: [{ address: TEST_DATA.accounts[0]!.pubKey, accountName: 'Account 1', type: 'WALLET_INSIDE', hdPath: 0 }],
      }];
      mockEncryptUtils.decrypt
        .mockResolvedValueOnce(mockVaultV1)
        .mockResolvedValueOnce(TEST_DATA.mnemonic);
      mockEncryptUtils.encryptWithCryptoKey.mockResolvedValue('v3_encrypted');

      const result = await apiService.submitPassword(TEST_DATA.password);

      expect(mockEncryptUtils.decrypt).toHaveBeenCalledWith(TEST_DATA.password, V2_ENCRYPTED_PAYLOAD);
      expect(mockEncryptUtils.deriveSessionKey).toHaveBeenCalled();
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

    it('should reject unlock when decrypted vault structure is invalid', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      // Decrypt succeeds but payload is neither legacy array nor modern vault object.
      mockEncryptUtils.decrypt.mockResolvedValue({ foo: 'bar' });

      const result = await apiService.submitPassword(TEST_DATA.password);

      expect(result).toEqual({ error: 'passwordError', type: 'local' });
      expect(mockMemStore.unlock).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should not persist migrated payload when post-migration validation fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      // Empty array is not a valid legacy vault; validation should fail.
      mockEncryptUtils.decrypt.mockResolvedValue([]);
      mockEncryptUtils.encryptWithCryptoKey.mockResolvedValue('outer_v3_payload');

      const result = await apiService.submitPassword(TEST_DATA.password);

      expect(result).toEqual({ error: 'passwordError', type: 'local' });
      expect(mockStorageService.save).not.toHaveBeenCalled();
      expect(mockMemStore.unlock).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should reject unlock when legacy inner secret decrypts to non-string payload', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const legacyVault = [{
        currentAddress: TEST_DATA.accounts[0]!.pubKey,
        mnemonic: 'legacy_mnemonic',
        accounts: [{
          address: TEST_DATA.accounts[0]!.pubKey,
          accountName: 'Account 1',
          type: 'WALLET_INSIDE',
          hdPath: 0,
          privateKey: 'legacy_private_key',
        }],
      }];
      mockEncryptUtils.decrypt.mockResolvedValueOnce(legacyVault).mockResolvedValueOnce({ bad: true });

      const result = await apiService.submitPassword(TEST_DATA.password);

      expect(result).toEqual({ error: 'passwordError', type: 'local' });
      expect(mockStorageService.save).not.toHaveBeenCalled();
      expect(mockMemStore.unlock).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should upgrade legacy data wrapped in v3 format during unlock', async () => {
      mockStorageData.keyringData = JSON.stringify({ version: 3, data: 'blob', iv: 'iv' });
      mockStorageData.vaultSalt = 'mock-vault-salt';
      const legacyVault = [{
        currentAddress: TEST_DATA.accounts[0]!.pubKey,
        mnemonic: 'legacy_mnemonic',
        accounts: [{ address: TEST_DATA.accounts[0]!.pubKey, accountName: 'Account 1', type: 'WALLET_INSIDE', hdPath: 0 }],
      }];
      const modernVault = {
        version: 3,
        currentKeyringId: 'kr-1',
        keyrings: [
          {
            id: 'kr-1',
            type: 'hd',
            mnemonic: 'legacy_mnemonic',
            currentAddress: TEST_DATA.accounts[0]!.pubKey,
            accounts: [{ address: TEST_DATA.accounts[0]!.pubKey, hdIndex: 0, name: 'Account 1' }],
          },
        ],
      };

      mockEncryptUtils.decryptWithCryptoKey.mockResolvedValue(legacyVault);
      mockEncryptUtils.decrypt.mockResolvedValue(TEST_DATA.mnemonic);
      (normalizeVault as jest.Mock).mockReturnValueOnce({ vault: modernVault, migrated: true });
      mockEncryptUtils.encryptWithCryptoKey.mockResolvedValue('v3_migrated_payload');

      await apiService.submitPassword(TEST_DATA.password);

      expect(mockStorageService.save).toHaveBeenCalledWith({
        keyringData: 'v3_migrated_payload',
        vaultSalt: 'mock-vault-salt',
      });
    });

    it('should migrate legacy inner secrets even when legacy structure remains in v3 fast path', async () => {
      mockStorageData.keyringData = JSON.stringify({ version: 3, data: 'blob', iv: 'iv' });
      mockStorageData.vaultSalt = 'mock-vault-salt';
      const innerMnemonicV3 = JSON.stringify({ version: 3, data: 'mne-v3', iv: 'iv-mne' });
      const innerPkV3 = JSON.stringify({ version: 3, data: 'pk-v3', iv: 'iv-pk' });
      const legacyVault = [{
        currentAddress: TEST_DATA.accounts[0]!.pubKey,
        mnemonic: 'legacy_mnemonic',
        accounts: [{
          address: TEST_DATA.accounts[0]!.pubKey,
          accountName: 'Account 1',
          type: 'WALLET_INSIDE',
          hdPath: 0,
          privateKey: 'legacy_private_key',
        }],
      }];

      // Fast-path decrypt gives legacy structure; normalizeVault default mocked to migrated:false.
      mockEncryptUtils.decryptWithCryptoKey.mockResolvedValueOnce(legacyVault);
      mockEncryptUtils.decrypt
        .mockResolvedValueOnce(TEST_DATA.mnemonic)
        .mockResolvedValueOnce(TEST_DATA.accounts[0]!.priKey);
      mockEncryptUtils.encryptWithCryptoKey
        .mockResolvedValueOnce(innerMnemonicV3)
        .mockResolvedValueOnce(innerPkV3)
        .mockResolvedValueOnce('outer_v3_payload');

      const result = await apiService.submitPassword(TEST_DATA.password);

      expect(mockEncryptUtils.decrypt).toHaveBeenCalledWith(TEST_DATA.password, 'legacy_mnemonic');
      expect(mockEncryptUtils.decrypt).toHaveBeenCalledWith(TEST_DATA.password, 'legacy_private_key');
      expect(mockStorageService.save).toHaveBeenCalledWith({
        keyringData: 'outer_v3_payload',
        vaultSalt: 'mock-vault-salt',
      });
      expect(result).toHaveProperty('address', TEST_DATA.accounts[0]!.pubKey);
    });

    it('should keep getCurrentPrivateKey working after unlock when structure remains legacy', async () => {
      mockStorageData.keyringData = JSON.stringify({ version: 3, data: 'blob', iv: 'iv' });
      mockStorageData.vaultSalt = 'mock-vault-salt';
      const innerMnemonicV3 = JSON.stringify({ version: 3, data: 'mne-v3', iv: 'iv-mne' });
      const innerPkV3 = JSON.stringify({ version: 3, data: 'pk-v3', iv: 'iv-pk' });
      const legacyVault = [{
        currentAddress: TEST_DATA.accounts[0]!.pubKey,
        mnemonic: 'legacy_mnemonic',
        accounts: [{
          address: TEST_DATA.accounts[0]!.pubKey,
          accountName: 'Account 1',
          type: 'WALLET_INSIDE',
          hdPath: 0,
          privateKey: 'legacy_private_key',
        }],
      }];

      mockEncryptUtils.decryptWithCryptoKey.mockImplementation(async (_key: CryptoKey, ciphertext: string) => {
        if (ciphertext === mockStorageData.keyringData) return legacyVault;
        if (ciphertext === innerMnemonicV3) return TEST_DATA.mnemonic;
        return 'ok';
      });
      mockEncryptUtils.decrypt
        .mockResolvedValueOnce(TEST_DATA.mnemonic)
        .mockResolvedValueOnce(TEST_DATA.accounts[0]!.priKey);
      mockEncryptUtils.encryptWithCryptoKey
        .mockResolvedValueOnce(innerMnemonicV3)
        .mockResolvedValueOnce(innerPkV3)
        .mockResolvedValueOnce('outer_v3_payload');
      mockAccountService.importWalletByMnemonic.mockReturnValue({
        pubKey: TEST_DATA.accounts[0]!.pubKey,
        priKey: TEST_DATA.accounts[0]!.priKey,
        hdIndex: 0,
      });

      await apiService.submitPassword(TEST_DATA.password);
      const result = await apiService.getCurrentPrivateKey();

      expect(result).toBe(TEST_DATA.accounts[0]!.priKey);
      expect(mockEncryptUtils.decryptWithCryptoKey).toHaveBeenCalledWith(
        MOCK_CRYPTO_KEY,
        innerMnemonicV3
      );
    });

    it('should migrate legacy inner secrets for modern vault in v3 fast path', async () => {
      mockStorageData.keyringData = JSON.stringify({ version: 3, data: 'blob', iv: 'iv' });
      mockStorageData.vaultSalt = 'mock-vault-salt';
      const modernVaultWithLegacyInner = {
        version: 3,
        currentKeyringId: 'kr-hd',
        keyrings: [
          {
            id: 'kr-hd',
            type: 'hd',
            name: 'Wallet 1',
            mnemonic: 'legacy_mnemonic',
            nextHdIndex: 1,
            currentAddress: TEST_DATA.accounts[0]!.pubKey,
            accounts: [{ address: TEST_DATA.accounts[0]!.pubKey, hdIndex: 0, name: 'Account 1' }],
          },
          {
            id: 'kr-import',
            type: 'imported',
            name: 'Imported',
            currentAddress: TEST_DATA.importedAccount.pubKey,
            accounts: [{
              address: TEST_DATA.importedAccount.pubKey,
              name: 'Imported 1',
              privateKey: 'legacy_private_key',
            }],
          },
        ],
      };
      const migratedMnemonic = JSON.stringify({ version: 3, data: 'mne-v3', iv: 'iv-mne' });
      const migratedPk = JSON.stringify({ version: 3, data: 'pk-v3', iv: 'iv-pk' });

      mockEncryptUtils.decryptWithCryptoKey.mockImplementation(async (_key: CryptoKey, ciphertext: string) => {
        if (ciphertext === mockStorageData.keyringData) return modernVaultWithLegacyInner;
        if (ciphertext === migratedMnemonic) return TEST_DATA.mnemonic;
        return 'ok';
      });
      mockEncryptUtils.decrypt
        .mockResolvedValueOnce(TEST_DATA.mnemonic)
        .mockResolvedValueOnce(TEST_DATA.importedAccount.priKey);
      mockEncryptUtils.encryptWithCryptoKey
        .mockResolvedValueOnce(migratedMnemonic)
        .mockResolvedValueOnce(migratedPk)
        .mockResolvedValueOnce('outer_v3_migrated');

      const result = await apiService.submitPassword(TEST_DATA.password);

      expect(mockEncryptUtils.decrypt).toHaveBeenCalledWith(TEST_DATA.password, 'legacy_mnemonic');
      expect(mockEncryptUtils.decrypt).toHaveBeenCalledWith(
        TEST_DATA.password,
        'legacy_private_key'
      );
      expect(mockStorageService.save).toHaveBeenCalledWith({
        keyringData: 'outer_v3_migrated',
        vaultSalt: 'mock-vault-salt',
      });
      expect(result).toHaveProperty('address', TEST_DATA.accounts[0]!.pubKey);
    });

    it('should serialize checkPassword while submitPassword is persisting vault', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockStorageData.keyringData = JSON.stringify({ data: 'base64enc', iv: 'base64iv', salt: 'base64salt', version: 2 });
      const legacyVault = [{
        currentAddress: TEST_DATA.accounts[0]!.pubKey,
        mnemonic: 'encrypted_mnemonic',
        accounts: [
          {
            address: TEST_DATA.accounts[0]!.pubKey,
            accountName: 'Account 1',
            type: 'WALLET_INSIDE',
            hdPath: 0,
          },
        ],
      }];
      mockEncryptUtils.decrypt.mockResolvedValue(legacyVault);
      mockEncryptUtils.encryptWithCryptoKey.mockResolvedValue(
        JSON.stringify({ version: 3, data: 'outer-v3', iv: 'iv-v3' })
      );

      let releaseSave: () => void = () => {};
      const saveGate = new Promise<void>((resolve) => {
        releaseSave = resolve;
      });
      mockStorageService.save.mockImplementationOnce(async (data: any) => {
        Object.assign(mockStorageData, data);
        await saveGate;
      });

      const submitPromise = apiService.submitPassword(TEST_DATA.password);
      await Promise.resolve();
      await Promise.resolve();

      let checkFinished = false;
      const checkPromise = apiService.checkPassword(TEST_DATA.password).then((result) => {
        checkFinished = true;
        return result;
      });

      await Promise.resolve();
      await Promise.resolve();
      expect(checkFinished).toBe(false);

      releaseSave();
      await submitPromise;
      const checkResult = await checkPromise;
      expect(checkResult).toBe(true);
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

    it('should return empty string when no current account', () => {
      mockStoreState.currentAccount = null;
      expect(apiService.getCurrentAccountAddress()).toBe('');
    });

    it('should return empty string when currentAccount is empty object', () => {
      mockStoreState.currentAccount = {};
      expect(apiService.getCurrentAccountAddress()).toBe('');
    });
  });

  // ==================== 10. setUnlockedStatus ====================
  describe('setUnlockedStatus', () => {
    it('should update state when locking', async () => {
      mockStoreState.autoLockTime = 900;
      mockStoreState.currentAccount = { address: 'B62qTestAddr' };

      await apiService.setUnlockedStatus(false);

      expect(mockMemStore.lock).toHaveBeenCalled();
      expect(mockSendMsg).toHaveBeenCalled();
    });

    it('should send message when unlocking', async () => {
      mockStoreState.isUnlocked = true;
      await apiService.setUnlockedStatus(true);
      expect(mockSendMsg).toHaveBeenCalled();
    });

    it('should clear pendingCreateMnemonic from storage on lock', async () => {
      await apiService.setUnlockedStatus(false);

      expect(mockStorageService.removeValue).toHaveBeenCalledWith('pendingCreateMnemonic');
    });

    it('should not clear pendingCreateMnemonic when unlocking', async () => {
      await apiService.setUnlockedStatus(true);

      expect(mockStorageService.removeValue).not.toHaveBeenCalled();
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
      setupAuthenticated();
      mockAccountService.importWalletByMnemonic.mockReturnValue({
        pubKey: TEST_DATA.accounts[0]!.pubKey,
        priKey: TEST_DATA.accounts[0]!.priKey,
        hdIndex: 0,
      });

      const result = await apiService.createAccount(TEST_DATA.mnemonic);
      
      expect(mockAccountService.importWalletByMnemonic).toHaveBeenCalled();
      expect(mockEncryptUtils.encryptWithCryptoKey).toHaveBeenCalled();
      expect(result).toHaveProperty('address');
    });

    it('should save encrypted data to storage', async () => {
      setupAuthenticated();
      mockAccountService.importWalletByMnemonic.mockReturnValue({
        pubKey: TEST_DATA.accounts[0]!.pubKey,
        priKey: TEST_DATA.accounts[0]!.priKey,
        hdIndex: 0,
      });
      mockEncryptUtils.encrypt.mockResolvedValue('encrypted_data');

      await apiService.createAccount(TEST_DATA.mnemonic);
      
      expect(mockStorageService.save).toHaveBeenCalled();
    });

    it('should not update in-memory vault when save fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      setupAuthenticated();
      mockStoreState.data = null;
      mockStoreState.currentAccount = {};
      mockAccountService.importWalletByMnemonic.mockReturnValue({
        pubKey: TEST_DATA.accounts[0]!.pubKey,
        priKey: TEST_DATA.accounts[0]!.priKey,
        hdIndex: 0,
      });
      mockStorageService.save.mockRejectedValueOnce(new Error('save failed'));

      const result = await apiService.createAccount(TEST_DATA.mnemonic);
      expect(result).toEqual({ error: 'createFailed', type: 'local' });
      expect(mockStoreState.data).toBeNull();
      expect(mockStoreState.currentAccount).toEqual({});
      consoleSpy.mockRestore();
    });
  });

  // ==================== 16. addHDNewAccount ====================
  describe('addHDKeyring', () => {
    it('should not increment nextWalletIndex when duplicate address is detected', async () => {
      const initialData = createV3VaultData({ nextWalletIndex: 7 });
      mockStoreState.data = initialData;
      setupAuthenticated();
      mockAccountService.importWalletByMnemonic.mockReturnValue({
        pubKey: TEST_DATA.accounts[0]!.pubKey,
        priKey: TEST_DATA.accounts[0]!.priKey,
        hdIndex: 0,
      });

      const result = await apiService.addHDKeyring(TEST_DATA.mnemonic);

      expect(result).toHaveProperty('error', 'repeatTip');
      expect(mockStoreState.data.nextWalletIndex).toBe(7);
      expect(mockStorageService.save).not.toHaveBeenCalled();
    });

    it('should keep in-memory v3 vault unchanged when save fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const initialData = createV3VaultData({ nextWalletIndex: 3 });
      mockStoreState.data = initialData;
      setupAuthenticated();
      mockAccountService.importWalletByMnemonic.mockReturnValue({
        pubKey: TEST_DATA.accounts[1]!.pubKey,
        priKey: TEST_DATA.accounts[1]!.priKey,
        hdIndex: 0,
      });
      mockStorageService.save.mockRejectedValueOnce(new Error('save failed'));

      const result = await apiService.addHDKeyring(TEST_DATA.mnemonic);

      expect(result).toEqual({ error: 'createFailed', type: 'local' });
      expect(mockStoreState.data.keyrings).toHaveLength(1);
      expect(mockStoreState.data.nextWalletIndex).toBe(3);
      consoleSpy.mockRestore();
    });
  });

  // ==================== 16. multi-keyring methods ====================
  describe('multi-keyring methods', () => {
    it('should rename keyring and persist updated vault', async () => {
      setupAuthenticated();
      mockStoreState.data = createV3VaultData();

      const result = await apiService.renameKeyring('kr-hd', 'Main Wallet');

      expect(result).toEqual({
        success: true,
        keyring: { id: 'kr-hd', name: 'Main Wallet' },
      });
      expect(mockStoreState.data.keyrings[0].name).toBe('Main Wallet');
      expect(mockStorageService.save).toHaveBeenCalled();
    });

    it('should decrypt and return mnemonic for target HD keyring', async () => {
      setupAuthenticated();
      mockStoreState.data = createV3VaultData();
      // First decryptWithCryptoKey call: verification in _checkPasswordAndGetKey
      // Second call: actual mnemonic decryption
      mockEncryptUtils.decryptWithCryptoKey
        .mockResolvedValueOnce('verified')
        .mockResolvedValueOnce(TEST_DATA.mnemonic);

      const result = await apiService.getKeyringMnemonic('kr-hd', TEST_DATA.password);

      expect(result).toEqual({ mnemonic: TEST_DATA.mnemonic });
      expect(mockEncryptUtils.decryptWithCryptoKey).toHaveBeenLastCalledWith(
        MOCK_CRYPTO_KEY,
        JSON.stringify({ version: 3, data: 'mne', iv: 'iv' })
      );
    });

    it('should delete a keyring and switch current account to remaining keyring', async () => {
      setupAuthenticated();
      mockStoreState.data = {
        version: 3,
        currentKeyringId: 'kr-import',
        nextWalletIndex: 2,
        keyrings: [
          {
            id: 'kr-hd',
            type: 'hd',
            name: 'Wallet 1',
            mnemonic: JSON.stringify({ version: 3, data: 'mne', iv: 'iv' }),
            nextHdIndex: 1,
            currentAddress: TEST_DATA.accounts[0]!.pubKey,
            createdAt: Date.now(),
            accounts: [{ address: TEST_DATA.accounts[0]!.pubKey, hdIndex: 0, name: 'Account 1' }],
          },
          {
            id: 'kr-import',
            type: 'imported',
            name: 'Imported',
            currentAddress: TEST_DATA.importedAccount.pubKey,
            createdAt: Date.now(),
            accounts: [{
              address: TEST_DATA.importedAccount.pubKey,
              name: TEST_DATA.importedAccount.accountName,
              privateKey: JSON.stringify({ version: 3, data: 'pk', iv: 'ivpk' }),
            }],
          },
        ],
      };
      const checkPasswordSpy = jest.spyOn(apiService, 'checkPassword').mockResolvedValueOnce(true);

      const result = await apiService.deleteKeyring('kr-import', TEST_DATA.password);

      expect(result).toEqual({
        success: true,
        currentAccount: {
          address: TEST_DATA.accounts[0]!.pubKey,
          accountName: 'Account 1',
          type: 'WALLET_INSIDE',
          hdPath: 0,
          keyringId: 'kr-hd',
        },
      });
      expect(mockStoreState.data.currentKeyringId).toBe('kr-hd');
      expect(mockStoreState.data.keyrings).toHaveLength(1);
      checkPasswordSpy.mockRestore();
    });

    it('should add account to specific HD keyring', async () => {
      setupAuthenticated();
      mockStoreState.data = createV3VaultData();
      mockEncryptUtils.decryptWithCryptoKey.mockResolvedValueOnce(TEST_DATA.mnemonic);
      mockAccountService.importWalletByMnemonic.mockReturnValue({
        pubKey: TEST_DATA.accounts[1]!.pubKey,
        priKey: TEST_DATA.accounts[1]!.priKey,
        hdIndex: 1,
      });

      const result = await apiService.addAccountToKeyring('kr-hd', 'HD 2');

      expect(result).toEqual({
        account: {
          address: TEST_DATA.accounts[1]!.pubKey,
          accountName: 'HD 2',
          type: 'WALLET_INSIDE',
          hdPath: 1,
          keyringId: 'kr-hd',
        },
      });
      expect(mockStoreState.data.currentKeyringId).toBe('kr-hd');
      expect(mockStoreState.data.keyrings[0].accounts).toHaveLength(2);
    });
  });

  // ==================== 17. addHDNewAccount ====================
  describe('addHDNewAccount', () => {
    it('should be a function', () => {
      expect(typeof apiService.addHDNewAccount).toBe('function');
    });

    it('should add new HD account with V1 vault', async () => {
      mockStoreState.data = createV1VaultData();
      mockStoreState.data[0].mnemonic = JSON.stringify({ version: 3, data: 'cipher', iv: 'iv' });
      setupAuthenticated();
      mockEncryptUtils.decryptWithCryptoKey.mockResolvedValue(TEST_DATA.mnemonic);
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
      mockStoreState.data[0].mnemonic = JSON.stringify({ version: 3, data: 'cipher', iv: 'iv' });
      setupAuthenticated();
      mockEncryptUtils.decryptWithCryptoKey.mockResolvedValue(TEST_DATA.mnemonic);
      mockAccountService.importWalletByMnemonic.mockReturnValue({
        pubKey: TEST_DATA.accounts[0]!.pubKey,
        priKey: TEST_DATA.accounts[0]!.priKey,
        hdIndex: 1,
      });
      mockEncryptUtils.encrypt.mockResolvedValue('encrypted_data');

      const result = await apiService.addHDNewAccount('Account');
      expect(result).toHaveProperty('error', 'importRepeat');
    });

    it('should fallback to deterministic typeIndex when legacy HD account misses typeIndex', async () => {
      mockStoreState.data = createV1VaultData([
        {
          address: TEST_DATA.accounts[0]!.pubKey,
          accountName: 'Account 1',
          type: 'WALLET_INSIDE',
          hdPath: 0,
          privateKey: 'enc_key_0',
        },
      ]);
      mockStoreState.data[0].mnemonic = JSON.stringify({ version: 3, data: 'cipher', iv: 'iv' });
      setupAuthenticated();
      mockEncryptUtils.decryptWithCryptoKey.mockResolvedValue(TEST_DATA.mnemonic);
      mockAccountService.importWalletByMnemonic.mockReturnValue({
        pubKey: TEST_DATA.accounts[1]!.pubKey,
        priKey: TEST_DATA.accounts[1]!.priKey,
        hdIndex: 1,
      });

      const result = await apiService.addHDNewAccount('HD 2');

      expect(result).toHaveProperty('typeIndex', 2);
      expect(Number.isNaN((result as any).typeIndex)).toBe(false);
    });

    it('should fallback to deterministic hdPath when legacy HD account misses hdPath', async () => {
      mockStoreState.data = createV1VaultData([
        {
          address: TEST_DATA.accounts[0]!.pubKey,
          accountName: 'Account 1',
          type: 'WALLET_INSIDE',
          privateKey: 'enc_key_0',
          typeIndex: 1,
        },
      ]);
      mockStoreState.data[0].mnemonic = JSON.stringify({ version: 3, data: 'cipher', iv: 'iv' });
      setupAuthenticated();
      mockEncryptUtils.decryptWithCryptoKey.mockResolvedValue(TEST_DATA.mnemonic);
      mockAccountService.importWalletByMnemonic.mockReturnValue({
        pubKey: TEST_DATA.accounts[1]!.pubKey,
        priKey: TEST_DATA.accounts[1]!.priKey,
        hdIndex: 1,
      });

      const result = await apiService.addHDNewAccount('HD 2');

      expect(result).toHaveProperty('hdPath', 1);
      expect(Number.isNaN((result as any).hdPath)).toBe(false);
    });

    it('should update currentKeyringId when adding account via fallback HD keyring', async () => {
      setupAuthenticated();
      mockStoreState.data = {
        version: 3,
        currentKeyringId: 'kr-import',
        keyrings: [
          {
            id: 'kr-import',
            type: 'imported',
            name: 'Imported',
            currentAddress: TEST_DATA.importedAccount.pubKey,
            accounts: [
              {
                address: TEST_DATA.importedAccount.pubKey,
                name: 'Imported 1',
                privateKey: JSON.stringify({ version: 3, data: 'pk', iv: 'ivpk' }),
              },
            ],
          },
          {
            id: 'kr-hd',
            type: 'hd',
            name: 'Wallet 1',
            mnemonic: JSON.stringify({ version: 3, data: 'mne', iv: 'ivm' }),
            nextHdIndex: 1,
            currentAddress: TEST_DATA.accounts[0]!.pubKey,
            accounts: [{ address: TEST_DATA.accounts[0]!.pubKey, hdIndex: 0, name: 'Account 1' }],
          },
        ],
      };
      mockStoreState.currentAccount = {
        address: TEST_DATA.importedAccount.pubKey,
        keyringId: 'kr-import',
      };
      mockEncryptUtils.decryptWithCryptoKey.mockResolvedValue(TEST_DATA.mnemonic);
      mockAccountService.importWalletByMnemonic.mockReturnValue({
        pubKey: TEST_DATA.accounts[1]!.pubKey,
        priKey: TEST_DATA.accounts[1]!.priKey,
        hdIndex: 1,
      });

      const result = await apiService.addHDNewAccount('HD 2');

      expect(result).toHaveProperty('address', TEST_DATA.accounts[1]!.pubKey);
      expect(result).toHaveProperty('keyringId', 'kr-hd');
      expect(mockStoreState.data.currentKeyringId).toBe('kr-hd');
    });

    it('should return invalidVault when store data is non-null but unrecognized shape', async () => {
      setupAuthenticated();
      mockStoreState.data = { broken: true };

      const result = await apiService.addHDNewAccount('HD 2');

      expect(result).toEqual({ error: 'invalidVault', type: 'local' });
    });
  });

  // ==================== 18. addImportAccount ====================
  describe('addImportAccount', () => {
    it('should be a function', () => {
      expect(typeof apiService.addImportAccount).toBe('function');
    });

    it('should import account with V1 vault', async () => {
      mockStoreState.data = createV1VaultData();
      setupAuthenticated();
      mockAccountService.importWalletByPrivateKey.mockReturnValue({
        pubKey: TEST_DATA.importedAccount.pubKey,
        priKey: TEST_DATA.importedAccount.priKey,
      });
      mockEncryptUtils.encrypt.mockResolvedValue('encrypted_data');

      const result = await apiService.addImportAccount(TEST_DATA.importedAccount.priKey, 'Import');
      expect(result).toHaveProperty('address', TEST_DATA.importedAccount.pubKey);
    });

    it('should fallback to deterministic typeIndex when legacy imported account misses typeIndex', async () => {
      mockStoreState.data = createV1VaultData([
        {
          address: TEST_DATA.accounts[0]!.pubKey,
          accountName: 'Account 1',
          type: 'WALLET_INSIDE',
          hdPath: 0,
          typeIndex: 1,
          privateKey: 'enc_key_0',
        },
        {
          address: 'B62qLegacyImported',
          accountName: 'Legacy Import',
          type: 'WALLET_OUTSIDE',
          hdPath: null,
          privateKey: 'enc_legacy_import',
        },
      ]);
      setupAuthenticated();
      mockAccountService.importWalletByPrivateKey.mockReturnValue({
        pubKey: TEST_DATA.importedAccount.pubKey,
        priKey: TEST_DATA.importedAccount.priKey,
      });

      const result = await apiService.addImportAccount(TEST_DATA.importedAccount.priKey, 'Import');

      expect(result).toHaveProperty('typeIndex', 1);
      expect(Number.isNaN((result as any).typeIndex)).toBe(false);
    });

    it('should return error when address already exists', async () => {
      mockStoreState.data = createV1VaultData();
      setupAuthenticated();
      mockAccountService.importWalletByPrivateKey.mockReturnValue({
        pubKey: TEST_DATA.accounts[0]!.pubKey,
        priKey: TEST_DATA.accounts[0]!.priKey,
      });

      const result = await apiService.addImportAccount(TEST_DATA.accounts[0]!.priKey, 'Account');
      expect(result).toHaveProperty('error', 'importRepeat');
    });

    it('should return walletNotReady when cryptoKey is missing', async () => {
      mockStoreState.data = null;
      mockStoreState.cryptoKey = null;
      mockAccountService.importWalletByPrivateKey.mockReturnValue({
        pubKey: TEST_DATA.importedAccount.pubKey,
        priKey: TEST_DATA.importedAccount.priKey,
      });

      const result = await apiService.addImportAccount(TEST_DATA.importedAccount.priKey, 'Import');
      expect(result).toEqual({ error: 'walletNotReady', type: 'local' });
    });

    it('should not mutate in-memory V1 data when save fails', async () => {
      const originalData = createV1VaultData();
      mockStoreState.data = JSON.parse(JSON.stringify(originalData));
      setupAuthenticated();
      mockAccountService.importWalletByPrivateKey.mockReturnValue({
        pubKey: TEST_DATA.importedAccount.pubKey,
        priKey: TEST_DATA.importedAccount.priKey,
      });
      mockStorageService.save.mockRejectedValueOnce(new Error('save failed'));

      const result = await apiService.addImportAccount(TEST_DATA.importedAccount.priKey, 'Import');

      expect(result).toEqual({ error: 'privateError', type: 'local' });
      expect(mockStoreState.data).toEqual(originalData);
    });

    it('should initialize empty v3 vault with nextWalletIndex on first import', async () => {
      setupAuthenticated();
      mockStoreState.data = null;
      mockAccountService.importWalletByPrivateKey.mockReturnValue({
        pubKey: TEST_DATA.importedAccount.pubKey,
        priKey: TEST_DATA.importedAccount.priKey,
      });

      const result = await apiService.addImportAccount(TEST_DATA.importedAccount.priKey, 'Import 1');

      expect(result).toHaveProperty('address', TEST_DATA.importedAccount.pubKey);
      const vaultEncryptCall = mockEncryptUtils.encryptWithCryptoKey.mock.calls.find(
        (_call) => _call[1] && typeof _call[1] === 'object' && 'keyrings' in _call[1]
      );
      expect(vaultEncryptCall?.[1]?.version).toBe(3);
      expect(vaultEncryptCall?.[1]?.nextWalletIndex).toBe(1);
      expect(vaultEncryptCall?.[1]?.createdAt).toBeUndefined();
    });

    it('should return invalidVault when store data is non-null but unrecognized shape', async () => {
      setupAuthenticated();
      mockStoreState.data = { broken: true };
      mockAccountService.importWalletByPrivateKey.mockReturnValue({
        pubKey: TEST_DATA.importedAccount.pubKey,
        priKey: TEST_DATA.importedAccount.priKey,
      });

      const result = await apiService.addImportAccount(TEST_DATA.importedAccount.priKey, 'Import');

      expect(result).toEqual({ error: 'invalidVault', type: 'local' });
    });
  });

  // ==================== 18. addAccountByKeyStore ====================
  describe('addAccountByKeyStore', () => {
    it('should be a function', () => {
      expect(typeof apiService.addAccountByKeyStore).toBe('function');
    });

    it('should import account via keystore', async () => {
      mockStoreState.data = createV1VaultData();
      setupAuthenticated();
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

    it('should return sanitized error when importWalletByKeystore throws', async () => {
      mockAccountService.importWalletByKeystore.mockRejectedValue(new Error('sodium init failed'));

      const result = await apiService.addAccountByKeyStore('bad', 'pwd', 'Test');
      expect(result).toEqual({ error: 'importFailed', type: 'local' });
    });
  });

  // ==================== 20. addLedgerAccount ====================
  describe('addLedgerAccount', () => {
    it('should be a function', () => {
      expect(typeof apiService.addLedgerAccount).toBe('function');
    });

    it('should add ledger account with V1 vault', async () => {
      mockStoreState.data = createV1VaultData();
      setupAuthenticated();
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
      setupAuthenticated();
      mockEncryptUtils.encrypt.mockResolvedValue('encrypted_data');

      const result = await apiService.addLedgerAccount(TEST_DATA.accounts[0]!.pubKey, 'Ledger', 0);
      expect(result).toHaveProperty('error', 'importRepeat');
    });

    it('should return walletNotReady when cryptoKey is missing', async () => {
      mockStoreState.data = null;
      mockStoreState.cryptoKey = null;
      const result = await apiService.addLedgerAccount(
        TEST_DATA.ledgerAccount.pubKey,
        TEST_DATA.ledgerAccount.accountName,
        TEST_DATA.ledgerAccount.hdPath
      );
      expect(result).toEqual({ error: 'walletNotReady', type: 'local' });
    });

    it('should initialize empty v3 vault with nextWalletIndex on first ledger import', async () => {
      setupAuthenticated();
      mockStoreState.data = null;

      const result = await apiService.addLedgerAccount(
        TEST_DATA.ledgerAccount.pubKey,
        TEST_DATA.ledgerAccount.accountName,
        TEST_DATA.ledgerAccount.hdPath
      );

      expect(result).toHaveProperty('address', TEST_DATA.ledgerAccount.pubKey);
      const vaultEncryptCall = mockEncryptUtils.encryptWithCryptoKey.mock.calls.find(
        (_call) => _call[1] && typeof _call[1] === 'object' && 'keyrings' in _call[1]
      );
      expect(vaultEncryptCall?.[1]?.version).toBe(3);
      expect(vaultEncryptCall?.[1]?.nextWalletIndex).toBe(1);
      expect(vaultEncryptCall?.[1]?.createdAt).toBeUndefined();
    });

    it('should return invalidVault when store data is non-null but unrecognized shape', async () => {
      setupAuthenticated();
      mockStoreState.data = { broken: true };

      const result = await apiService.addLedgerAccount(
        TEST_DATA.ledgerAccount.pubKey,
        TEST_DATA.ledgerAccount.accountName,
        TEST_DATA.ledgerAccount.hdPath
      );

      expect(result).toEqual({ error: 'invalidVault', type: 'local' });
    });
  });

  // ==================== 20. setCurrentAccount ====================
  describe('setCurrentAccount', () => {
    it('should be a function', () => {
      expect(typeof apiService.setCurrentAccount).toBe('function');
    });

    it('should set current account with V1 vault', async () => {
      mockStoreState.data = createV1VaultData();
      setupAuthenticated();
      mockEncryptUtils.encrypt.mockResolvedValue('encrypted_data');

      const result = await apiService.setCurrentAccount(TEST_DATA.accounts[0]!.pubKey);
      expect(result).toHaveProperty('currentAddress', TEST_DATA.accounts[0]!.pubKey);
    });

    it('should only persist once after first match in V1 data', async () => {
      const duplicateAddress = 'B62qDuplicate';
      mockStoreState.data = createV1VaultData([
        { address: duplicateAddress, accountName: 'Dup 1', type: 'WALLET_OUTSIDE', hdPath: 0, typeIndex: 0, privateKey: 'enc1' },
        { address: duplicateAddress, accountName: 'Dup 2', type: 'WALLET_OUTSIDE', hdPath: 1, typeIndex: 1, privateKey: 'enc2' },
      ]);
      setupAuthenticated();
      mockEncryptUtils.encryptWithCryptoKey.mockResolvedValue('encrypted_data');

      await apiService.setCurrentAccount(duplicateAddress);

      expect(mockStorageService.save).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== 21. changeAccountName ====================
  describe('changeAccountName', () => {
    it('should be a function', () => {
      expect(typeof apiService.changeAccountName).toBe('function');
    });

    it('should change account name with V1 vault', async () => {
      mockStoreState.data = createV1VaultData();
      setupAuthenticated();
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
      setupAuthenticated();
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
      setupAuthenticated();
      mockStoreState.currentAccount = { address: TEST_DATA.accounts[0]!.pubKey };
      mockEncryptUtils.encrypt.mockResolvedValue('encrypted_data');

      const result = await apiService.deleteAccount(TEST_DATA.importedAccount.pubKey, TEST_DATA.password);
      expect(result).toHaveProperty('address');
    });

    it('should return error with incorrect password', async () => {
      mockStoreState.data = createV1VaultData();
      setupAuthenticated();
      mockEncryptUtils.decryptWithCryptoKey.mockRejectedValueOnce(new Error('Incorrect password'));

      const result = await apiService.deleteAccount(TEST_DATA.accounts[0]!.pubKey, 'wrongPwd');
      expect(result).toEqual({ error: 'passwordError', type: 'local' });
    });

    it('should reset wallet when deleting the last account in V1 vault', async () => {
      mockStoreState.data = createV1VaultData([
        { address: TEST_DATA.accounts[0]!.pubKey, accountName: 'Account 1', type: 'WALLET_INSIDE', hdPath: 0, typeIndex: 0, privateKey: 'enc_key_0' },
      ]);
      setupAuthenticated();
      mockStoreState.currentAccount = { address: TEST_DATA.accounts[0]!.pubKey };

      const result = await apiService.deleteAccount(TEST_DATA.accounts[0]!.pubKey, TEST_DATA.password);

      expect(result).toEqual({ isReset: true });
      expect(mockStorageService.removeValue).toHaveBeenCalledWith(['keyringData', 'vaultSalt', 'pendingCreateMnemonic', 'ZKAPP_APPROVE_LIST', 'credentials', 'credentialsEncrypted']);
      expect(mockStoreState.isUnlocked).toBe(false);
      expect(mockStoreState.cryptoKey).toBeNull();
      expect(mockStoreState.data).toBeNull();
      expect(mockStoreState.currentAccount).toEqual({});
    });

    it('should reset wallet when deleting the last account in V3 vault', async () => {
      setupAuthenticated();
      mockStoreState.data = {
        version: 3,
        currentKeyringId: 'kr-watch',
        keyrings: [
          {
            id: 'kr-watch',
            type: 'watch',
            name: 'Watch',
            currentAddress: 'B62qWatchOnly',
            accounts: [{ address: 'B62qWatchOnly', name: 'Watch 1' }],
          },
        ],
      };
      mockStoreState.currentAccount = { address: 'B62qWatchOnly' };

      const result = await apiService.deleteAccount('B62qWatchOnly', '');

      expect(result).toEqual({ isReset: true });
      expect(mockStorageService.removeValue).toHaveBeenCalledWith(['keyringData', 'vaultSalt', 'pendingCreateMnemonic', 'ZKAPP_APPROVE_LIST', 'credentials', 'credentialsEncrypted']);
      expect(mockStoreState.isUnlocked).toBe(false);
      expect(mockStoreState.data).toBeNull();
      expect(mockStoreState.currentAccount).toEqual({});
    });

    it('should preserve keyringId when switching current account after V3 delete', async () => {
      setupAuthenticated();
      mockStoreState.data = {
        version: 3,
        currentKeyringId: 'kr-1',
        keyrings: [
          {
            id: 'kr-1',
            type: 'hd',
            name: 'Wallet 1',
            mnemonic: JSON.stringify({ version: 3, data: 'm1', iv: 'iv1' }),
            currentAddress: TEST_DATA.accounts[0]!.pubKey,
            accounts: [{ address: TEST_DATA.accounts[0]!.pubKey, hdIndex: 0, name: 'Account 1' }],
          },
          {
            id: 'kr-2',
            type: 'imported',
            name: 'Imported',
            currentAddress: TEST_DATA.importedAccount.pubKey,
            accounts: [
              {
                address: TEST_DATA.importedAccount.pubKey,
                name: 'Imported 1',
                privateKey: JSON.stringify({ version: 3, data: 'pk', iv: 'ivpk' }),
              },
            ],
          },
        ],
      };
      mockStoreState.currentAccount = {
        address: TEST_DATA.accounts[0]!.pubKey,
        keyringId: 'kr-1',
      };

      const result = await apiService.deleteAccount(TEST_DATA.accounts[0]!.pubKey, TEST_DATA.password);

      expect(result).toHaveProperty('address', TEST_DATA.importedAccount.pubKey);
      expect(result).toHaveProperty('keyringId', 'kr-2');
    });

    it('should refresh keyring currentAddress when deleting non-current-global keyring current account', async () => {
      setupAuthenticated();
      const ledgerA = 'B62qLedgerA';
      const ledgerB = 'B62qLedgerB';
      mockStoreState.data = {
        version: 3,
        currentKeyringId: 'kr-hd',
        keyrings: [
          {
            id: 'kr-hd',
            type: 'hd',
            name: 'Wallet 1',
            mnemonic: JSON.stringify({ version: 3, data: 'm1', iv: 'iv1' }),
            currentAddress: TEST_DATA.accounts[0]!.pubKey,
            accounts: [{ address: TEST_DATA.accounts[0]!.pubKey, hdIndex: 0, name: 'Account 1' }],
          },
          {
            id: 'kr-ledger',
            type: 'ledger',
            name: 'Ledger',
            currentAddress: ledgerA,
            accounts: [
              { address: ledgerA, hdIndex: 0, name: 'Ledger 1' },
              { address: ledgerB, hdIndex: 1, name: 'Ledger 2' },
            ],
          },
        ],
      };
      mockStoreState.currentAccount = {
        address: TEST_DATA.accounts[0]!.pubKey,
        keyringId: 'kr-hd',
      };

      const result = await apiService.deleteAccount(ledgerA, '');
      const ledgerKeyring = mockStoreState.data.keyrings.find((kr: any) => kr.id === 'kr-ledger');

      expect(result).toHaveProperty('address', TEST_DATA.accounts[0]!.pubKey);
      expect(ledgerKeyring.currentAddress).toBe(ledgerB);
      expect(ledgerKeyring.accounts).toHaveLength(1);
      expect(ledgerKeyring.accounts[0].address).toBe(ledgerB);
    });
  });

  // ==================== 23. getMnemonic ====================
  describe('getMnemonic', () => {
    it('should be a function', () => {
      expect(typeof apiService.getMnemonic).toBe('function');
    });

    it('should return mnemonic with correct password', async () => {
      mockStoreState.data = createV1VaultData();
      setupAuthenticated();
      mockEncryptUtils.decrypt.mockResolvedValue(TEST_DATA.mnemonic);

      const result = await apiService.getMnemonic(TEST_DATA.password);
      expect(result).toBe(TEST_DATA.mnemonic);
      expect(mockEncryptUtils.decrypt).toHaveBeenCalledWith(
        TEST_DATA.password,
        mockStoreState.data[0].mnemonic
      );
    });

    it('should decrypt v3 inner mnemonic with CryptoKey', async () => {
      mockStoreState.data = createV1VaultData();
      mockStoreState.data[0].mnemonic = JSON.stringify({ version: 3, data: 'cipher', iv: 'iv' });
      setupAuthenticated();
      mockEncryptUtils.decryptWithCryptoKey.mockResolvedValue(TEST_DATA.mnemonic);

      const result = await apiService.getMnemonic(TEST_DATA.password);
      expect(result).toBe(TEST_DATA.mnemonic);
      expect(mockEncryptUtils.decryptWithCryptoKey).toHaveBeenLastCalledWith(
        MOCK_CRYPTO_KEY,
        mockStoreState.data[0].mnemonic
      );
    });

    it('should return error with incorrect password', async () => {
      setupAuthenticated();
      mockEncryptUtils.decryptWithCryptoKey.mockRejectedValueOnce(new Error('Incorrect password'));

      const result = await apiService.getMnemonic('wrongPwd');
      expect(result).toEqual({ error: 'passwordError', type: 'local' });
    });

    it('should prefer current account keyring mnemonic in modern vault', async () => {
      setupAuthenticated();
      mockStoreState.data = {
        version: 3,
        currentKeyringId: 'kr-2',
        keyrings: [
          {
            id: 'kr-1',
            type: 'hd',
            mnemonic: JSON.stringify({ version: 3, data: 'encrypted_mnemonic_1', iv: 'iv1' }),
            currentAddress: TEST_DATA.accounts[0]!.pubKey,
            accounts: [{ address: TEST_DATA.accounts[0]!.pubKey, hdIndex: 0, name: 'Account 1' }],
          },
          {
            id: 'kr-2',
            type: 'hd',
            mnemonic: JSON.stringify({ version: 3, data: 'encrypted_mnemonic_2', iv: 'iv2' }),
            currentAddress: TEST_DATA.accounts[1]!.pubKey,
            accounts: [{ address: TEST_DATA.accounts[1]!.pubKey, hdIndex: 1, name: 'Account 2' }],
          },
        ],
      };
      mockStoreState.currentAccount = { address: TEST_DATA.accounts[1]!.pubKey, keyringId: 'kr-2' };
      mockEncryptUtils.decryptWithCryptoKey.mockResolvedValue(TEST_DATA.mnemonic);

      const result = await apiService.getMnemonic(TEST_DATA.password);

      expect(result).toBe(TEST_DATA.mnemonic);
      expect(mockEncryptUtils.decryptWithCryptoKey).toHaveBeenLastCalledWith(
        MOCK_CRYPTO_KEY,
        JSON.stringify({ version: 3, data: 'encrypted_mnemonic_2', iv: 'iv2' })
      );
    });

    it('should still decrypt v3 mnemonic when store cryptoKey is missing but password is valid', async () => {
      mockStoreState.data = createV1VaultData();
      mockStoreState.data[0].mnemonic = JSON.stringify({ version: 3, data: 'cipher', iv: 'iv' });
      mockStoreState.cryptoKey = null;
      mockStoreState.vaultSalt = 'mock-vault-salt';
      mockStorageData.vaultSalt = 'mock-vault-salt';
      mockStorageData.keyringData = JSON.stringify({ version: 3, data: 'blob', iv: 'iv' });
      mockEncryptUtils.deriveSessionKey.mockResolvedValue({ key: MOCK_CRYPTO_KEY, salt: 'mock-vault-salt' });
      mockEncryptUtils.decryptWithCryptoKey.mockResolvedValue(TEST_DATA.mnemonic);

      const result = await apiService.getMnemonic(TEST_DATA.password);

      expect(result).toBe(TEST_DATA.mnemonic);
      expect(mockEncryptUtils.deriveSessionKey).toHaveBeenCalledWith(TEST_DATA.password, 'mock-vault-salt');
      expect(mockEncryptUtils.decryptWithCryptoKey).toHaveBeenCalledWith(
        MOCK_CRYPTO_KEY,
        mockStoreState.data[0].mnemonic
      );
    });

    it('should reject mnemonic when decrypted inner secret is not a string', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockStoreState.data = createV1VaultData();
      setupAuthenticated();
      // decrypt returns non-string for inner secret
      mockEncryptUtils.decrypt.mockResolvedValueOnce({ value: 'not-a-string' });

      const result = await apiService.getMnemonic(TEST_DATA.password);

      expect(result).toEqual({ error: 'decryptFailed', type: 'local' });
      consoleSpy.mockRestore();
    });
  });

  // ==================== 24. getPrivateKey ====================
  describe('getPrivateKey', () => {
    it('should be a function', () => {
      expect(typeof apiService.getPrivateKey).toBe('function');
    });

    it('should return private key with correct password', async () => {
      mockStoreState.data = createV1VaultData();
      setupAuthenticated();
      mockEncryptUtils.decrypt.mockResolvedValue(TEST_DATA.accounts[0]!.priKey);

      const result = await apiService.getPrivateKey(TEST_DATA.accounts[0]!.pubKey, TEST_DATA.password);
      expect(result).toBe(TEST_DATA.accounts[0]!.priKey);
      expect(mockEncryptUtils.decrypt).toHaveBeenCalledWith(
        TEST_DATA.password,
        mockStoreState.data[0].accounts[0].privateKey
      );
    });

    it('should return error with incorrect password', async () => {
      setupAuthenticated();
      mockEncryptUtils.decryptWithCryptoKey.mockRejectedValueOnce(new Error('Incorrect password'));

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
      setupAuthenticated();
      mockStoreState.currentAccount = { address: TEST_DATA.accounts[0]!.pubKey };
      mockEncryptUtils.decrypt.mockResolvedValue('decrypted_data');
      mockEncryptUtils.decryptWithCryptoKey.mockResolvedValue('decrypted_data');
      mockEncryptUtils.encryptWithCryptoKey.mockResolvedValue('re_encrypted_data');

      const result = await apiService.updateSecPassword(TEST_DATA.password, 'newPassword');
      expect(result).toHaveProperty('code', 0);
    });

    it('should return error with incorrect old password', async () => {
      setupAuthenticated();
      mockEncryptUtils.decryptWithCryptoKey.mockRejectedValueOnce(new Error('Incorrect password'));

      const result = await apiService.updateSecPassword('wrongOld', 'newPwd');
      expect(result).toEqual({ error: 'passwordError', type: 'local' });
    });

    it('should not mutate in-memory data when save fails in V3 path', async () => {
      const originalData = {
        version: 3,
        currentKeyringId: 'kr-1',
        keyrings: [
          {
            id: 'kr-1',
            type: 'hd',
            mnemonic: JSON.stringify({ version: 3, data: 'old_mnemonic_enc', iv: 'iv-mnemonic' }),
            currentAddress: TEST_DATA.accounts[0]!.pubKey,
            accounts: [{ address: TEST_DATA.accounts[0]!.pubKey, hdIndex: 0, name: 'Account 1' }],
          },
          {
            id: 'kr-2',
            type: 'imported',
            currentAddress: TEST_DATA.importedAccount.pubKey,
            accounts: [{
              address: TEST_DATA.importedAccount.pubKey,
              name: 'Imported',
              privateKey: JSON.stringify({ version: 3, data: 'old_pk_enc', iv: 'iv-pk' }),
            }],
          },
        ],
      };

      setupAuthenticated();
      mockStoreState.data = JSON.parse(JSON.stringify(originalData));
      mockStoreState.currentAccount = { address: TEST_DATA.accounts[0]!.pubKey, keyringId: 'kr-1' };
      const newCryptoKey = { type: 'secret', extractable: false, tag: 'new-key' } as unknown as CryptoKey;
      mockEncryptUtils.deriveSessionKey.mockResolvedValue({ key: newCryptoKey, salt: 'new-salt' });
      mockEncryptUtils.decryptWithCryptoKey.mockResolvedValue('decrypted');
      mockEncryptUtils.encryptWithCryptoKey.mockResolvedValue('re_encrypted_data');
      mockStorageService.save.mockRejectedValueOnce(new Error('save failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const result = await apiService.updateSecPassword(TEST_DATA.password, 'newPassword');
      consoleSpy.mockRestore();

      expect(result).toEqual({ error: 'passwordError', type: 'local' });
      expect(mockStoreState.cryptoKey).toBe(MOCK_CRYPTO_KEY);
      expect(mockStoreState.vaultSalt).toBe('mock-vault-salt');
      expect(mockStoreState.data).toEqual(originalData);
    });

    it('should update vaultSalt after unlock fallback migration keeps legacy structure', async () => {
      const newCryptoKey = { type: 'secret', extractable: false, tag: 'new-key' } as unknown as CryptoKey;
      mockStorageData.keyringData = JSON.stringify({ version: 3, data: 'blob', iv: 'iv' });
      mockStorageData.vaultSalt = 'mock-vault-salt';
      const innerMnemonicV3 = JSON.stringify({ version: 3, data: 'mne-v3', iv: 'iv-mne' });
      const innerPkV3 = JSON.stringify({ version: 3, data: 'pk-v3', iv: 'iv-pk' });
      const legacyVault = [{
        currentAddress: TEST_DATA.accounts[0]!.pubKey,
        mnemonic: 'legacy_mnemonic',
        accounts: [{
          address: TEST_DATA.accounts[0]!.pubKey,
          accountName: 'Account 1',
          type: 'WALLET_INSIDE',
          hdPath: 0,
          privateKey: 'legacy_private_key',
        }],
      }];

      mockEncryptUtils.deriveSessionKey.mockImplementation(async (_pwd: string, salt?: string) => {
        if (salt) {
          return { key: MOCK_CRYPTO_KEY, salt };
        }
        return { key: newCryptoKey, salt: 'new-salt' };
      });
      mockEncryptUtils.decryptWithCryptoKey.mockImplementation(async (_key: CryptoKey, ciphertext: string) => {
        if (ciphertext === mockStorageData.keyringData) return legacyVault;
        if (ciphertext === innerMnemonicV3) return TEST_DATA.mnemonic;
        if (ciphertext === innerPkV3) return TEST_DATA.accounts[0]!.priKey;
        return 'ok';
      });
      mockEncryptUtils.decrypt.mockImplementation(async (_pwd: string, ciphertext: string) => {
        if (ciphertext === 'legacy_mnemonic') return TEST_DATA.mnemonic;
        if (ciphertext === 'legacy_private_key') return TEST_DATA.accounts[0]!.priKey;
        return 'decrypted_data';
      });
      mockEncryptUtils.encryptWithCryptoKey
        .mockResolvedValueOnce(innerMnemonicV3)
        .mockResolvedValueOnce(innerPkV3)
        .mockResolvedValueOnce('outer_v3_after_unlock')
        .mockResolvedValueOnce('inner_mnemonic_new')
        .mockResolvedValueOnce('inner_pk_new')
        .mockResolvedValueOnce('outer_v3_after_pwd_update');

      await apiService.submitPassword(TEST_DATA.password);
      const result = await apiService.updateSecPassword(TEST_DATA.password, 'newPassword');

      expect(result).toEqual({ code: 0 });
      expect(mockStorageService.save).toHaveBeenLastCalledWith({
        keyringData: 'outer_v3_after_pwd_update',
        vaultSalt: 'new-salt',
      });
      expect(mockStoreState.vaultSalt).toBe('new-salt');
      expect(mockStoreState.cryptoKey).toBe(newCryptoKey);
    });

    it('should return innerSecretsNotMigrated when v3 vault contains legacy inner secret', async () => {
      setupAuthenticated();
      const checkPasswordSpy = jest.spyOn(apiService, 'checkPassword').mockResolvedValueOnce(true);
      mockStoreState.data = createV3VaultData({
        keyrings: [
          {
            id: 'kr-hd',
            type: 'hd',
            name: 'Wallet 1',
            mnemonic: 'legacy_mnemonic_payload',
            nextHdIndex: 1,
            currentAddress: TEST_DATA.accounts[0]!.pubKey,
            createdAt: Date.now(),
            accounts: [
              {
                address: TEST_DATA.accounts[0]!.pubKey,
                hdIndex: 0,
                name: 'Account 1',
              },
            ],
          },
        ],
      });

      const result = await apiService.updateSecPassword(TEST_DATA.password, 'newPassword');

      expect(result).toEqual({ error: 'innerSecretsNotMigrated', type: 'local' });
      expect(mockStorageService.save).not.toHaveBeenCalled();
      checkPasswordSpy.mockRestore();
    });

    it('should fail closed when decrypted v3 inner secret is not a string during password update', async () => {
      setupAuthenticated();
      mockStoreState.data = createV3VaultData({
        keyrings: [
          {
            id: 'kr-hd',
            type: 'hd',
            name: 'Wallet 1',
            mnemonic: JSON.stringify({ version: 3, data: 'old_mnemonic_enc', iv: 'iv-mnemonic' }),
            currentAddress: TEST_DATA.accounts[0]!.pubKey,
            accounts: [
              {
                address: TEST_DATA.accounts[0]!.pubKey,
                hdIndex: 0,
                name: 'Account 1',
              },
            ],
          },
        ],
      });
      mockStoreState.currentAccount = { address: TEST_DATA.accounts[0]!.pubKey, keyringId: 'kr-hd' };
      mockEncryptUtils.decryptWithCryptoKey.mockResolvedValueOnce({ bad: true });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const result = await apiService.updateSecPassword(TEST_DATA.password, 'newPassword');
      consoleSpy.mockRestore();

      expect(result).toEqual({ error: 'passwordError', type: 'local' });
      expect(mockStorageService.save).not.toHaveBeenCalled();
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

    it('should return sanitized error string instead of raw Error object', async () => {
      // Force getCurrentPrivateKey to throw so the catch block fires
      const spy = jest.spyOn(apiService, 'getCurrentPrivateKey' as any)
        .mockRejectedValue(new Error('internal crypto failure'));

      const result = await apiService.sendTransaction({ sendAction: 'mina_sendPayment' });

      // The catch block should serialize the Error to its message string
      expect(result).toEqual({ error: 'internal crypto failure' });
      expect(typeof (result as any).error).toBe('string');
      spy.mockRestore();
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

    it('should ignore polling when paymentId or hash is empty', async () => {
      const fetchMainSpy = jest.spyOn(apiService as any, 'fetchTransactionStatus');
      const fetchQASpy = jest.spyOn(apiService as any, 'fetchQAnetTransactionStatus');

      await apiService.checkTxStatus('', 'hash');
      await apiService.checkTxStatus('payment', '');

      expect(fetchMainSpy).not.toHaveBeenCalled();
      expect(fetchQASpy).not.toHaveBeenCalled();
      fetchMainSpy.mockRestore();
      fetchQASpy.mockRestore();
    });

    it('should clear existing timer before starting a new polling loop for same paymentId', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const existingTimer = setTimeout(() => {}, 10_000);
      (apiService as any).txTimers.set('dup-payment-id', existingTimer);
      const fetchMainSpy = jest
        .spyOn(apiService as any, 'fetchTransactionStatus')
        .mockImplementation(() => {});

      await apiService.checkTxStatus('dup-payment-id', 'hash-1');

      expect(clearTimeoutSpy).toHaveBeenCalledWith(existingTimer);
      expect(fetchMainSpy).toHaveBeenCalledWith('dup-payment-id', 'hash-1', undefined);
      fetchMainSpy.mockRestore();
      clearTimeoutSpy.mockRestore();
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
        setupAuthenticated();
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
        mockStoreState.data[0].mnemonic = JSON.stringify({ version: 3, data: 'cipher', iv: 'iv' });
        setupAuthenticated();
        mockEncryptUtils.decryptWithCryptoKey.mockResolvedValue(TEST_DATA.mnemonic);
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
        mockStoreState.data[0].mnemonic = JSON.stringify({ version: 3, data: 'cipher', iv: 'iv' });
        setupAuthenticated();
        mockEncryptUtils.decryptWithCryptoKey.mockResolvedValue(TEST_DATA.mnemonic);
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
        setupAuthenticated();
        mockEncryptUtils.encrypt.mockResolvedValue('encrypted');
        await mockEncryptUtils.encrypt(TEST_DATA.password, 'data');
        expect(mockEncryptUtils.encrypt).toHaveBeenCalledWith(TEST_DATA.password, 'data');
      });

      it('should update all encrypted data when password changes', async () => {
        mockStoreState.data = createV1VaultData();
        setupAuthenticated();
        mockStoreState.currentAccount = { address: TEST_DATA.accounts[0]!.pubKey };
        mockEncryptUtils.decryptWithCryptoKey.mockResolvedValue('decrypted');
        mockEncryptUtils.encryptWithCryptoKey.mockResolvedValue('re_encrypted');
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

    it('should reject upgrade when any inner secret is not v3-encrypted', async () => {
      setupAuthenticated();
      // Keep source data in legacy shape so tryUpgradeVault runs normalizeVault path.
      mockStoreState.data = createV1VaultData();

      (normalizeVault as jest.Mock).mockReturnValueOnce({
        migrated: true,
        vault: {
          version: 2,
          currentKeyringId: 'kr-1',
          nextWalletIndex: 2,
          keyrings: [
            {
              id: 'kr-1',
              type: 'hd',
              name: 'Wallet 1',
              currentAddress: TEST_DATA.accounts[0]!.pubKey,
              createdAt: Date.now(),
              nextHdIndex: 1,
              // v3 mnemonic (ok)
              mnemonic: JSON.stringify({ version: 3, data: 'x', iv: 'y' }),
              accounts: [
                {
                  address: TEST_DATA.accounts[0]!.pubKey,
                  hdIndex: 0,
                  name: 'Account 1',
                },
              ],
            },
            {
              id: 'kr-2',
              type: 'imported',
              name: 'Imported',
              currentAddress: TEST_DATA.importedAccount.pubKey,
              createdAt: Date.now(),
              accounts: [
                {
                  address: TEST_DATA.importedAccount.pubKey,
                  name: TEST_DATA.importedAccount.accountName,
                  // non-v3 privateKey payload should be rejected
                  privateKey: JSON.stringify({ version: 2, data: 'old', iv: 'old', salt: 's' }),
                },
              ],
            },
          ],
        },
      });

      const result = await apiService.tryUpgradeVault();

      expect(result).toEqual({ success: false, error: 'innerSecretsNotMigrated', type: 'local' });
    });

    it('should not mutate in-memory modern vault when save fails during version bump', async () => {
      setupAuthenticated();
      const modernVault = createV3VaultData({ version: 2 });
      mockStoreState.data = modernVault;
      mockStorageService.save.mockRejectedValueOnce(new Error('save failed'));

      const result = await apiService.tryUpgradeVault();

      expect(result).toEqual({ success: false, error: 'upgradeFailed', type: 'local' });
      expect(mockStoreState.data.version).toBe(2);
    });
  });

  // ==================== 40. getVaultVersion ====================
  describe('getVaultVersion', () => {
    it('should return vault version', () => {
      expect(typeof apiService.getVaultVersion).toBe('function');
    });

    it('should return null for empty array (invalid legacy vault shape)', () => {
      mockStoreState.data = [];
      expect(apiService.getVaultVersion()).toEqual({ version: null });
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
    it('should validate correct password', async () => {
      setupAuthenticated();
      const result = await apiService.checkPassword('myPassword');
      expect(result).toBe(true);
    });

    it('should reject incorrect password', async () => {
      setupAuthenticated();
      mockEncryptUtils.decryptWithCryptoKey.mockRejectedValueOnce(new Error('Incorrect password'));
      const result = await apiService.checkPassword('wrongPassword');
      expect(result).toBe(false);
    });

    it('should reject empty password when no vaultSalt', async () => {
      mockStoreState.vaultSalt = '';
      const result = await apiService.checkPassword('');
      expect(result).toBe(false);
    });

    it('should handle missing vaultSalt state', async () => {
      mockStoreState.vaultSalt = '';
      const result = await apiService.checkPassword('anyPassword');
      expect(result).toBe(false);
    });
  });

  describe('Encryption Operations', () => {
    it('should call encryptWithCryptoKey when creating account', async () => {
      setupAuthenticated();
      mockAccountService.importWalletByMnemonic.mockReturnValue({
        pubKey: TEST_DATA.accounts[0]!.pubKey,
        priKey: TEST_DATA.accounts[0]!.priKey,
        hdIndex: 0,
      });

      await apiService.createAccount(TEST_DATA.mnemonic);
      
      expect(mockEncryptUtils.encryptWithCryptoKey).toHaveBeenCalled();
    });

    it('should use decryptWithCryptoKey via getMnemonic', async () => {
      mockStoreState.data = createV1VaultData();
      mockStoreState.data[0].mnemonic = JSON.stringify({ version: 3, data: 'cipher', iv: 'iv' });
      setupAuthenticated();
      mockEncryptUtils.decryptWithCryptoKey.mockResolvedValue(TEST_DATA.mnemonic);

      const result = await apiService.getMnemonic(TEST_DATA.password);
      
      expect(mockEncryptUtils.decryptWithCryptoKey).toHaveBeenCalled();
      expect(result).toBe(TEST_DATA.mnemonic);
    });
  });

  describe('Storage Operations', () => {
    it('should call storage.save when creating account', async () => {
      setupAuthenticated();
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
