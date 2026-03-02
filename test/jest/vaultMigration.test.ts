/**
 * Vault Migration Test Suite - Migrated from Mocha to Jest
 */
import {
  KEYRING_TYPE,
  VAULT_VERSION,
  createEmptyVault,
  createHDKeyring,
  createImportedKeyring,
  generateUUID,
  isLegacyVault,
  isModernVault
} from '@/constant/vaultTypes';

import {
  convertV2ToLegacy,
  findAccountByAddress,
  findKeyringById,
  getCurrentAccount,
  getCurrentKeyring,
  migrateToV2,
  normalizeVault,
  validateVault,
} from '@/background/vaultMigration';

import { ACCOUNT_TYPE } from '@/constant/commonType';

// Helper to create legacy wallet
const createLegacyWallet = (options: any = {}) => {
  const {
    mnemonic = 'encrypted_mnemonic_string',
    hdAccounts = 1,
    importedAccounts = 0,
    ledgerAccounts = 0,
    watchAccounts = 0,
    currentAddress = null,
  } = options;

  const accounts: any[] = [];

  for (let i = 0; i < hdAccounts; i++) {
    accounts.push({
      address: `B62qHD_${i}_address`,
      privateKey: `encrypted_private_key_${i}`,
      type: ACCOUNT_TYPE.WALLET_INSIDE,
      hdPath: i,
      accountName: `Account ${i + 1}`,
      typeIndex: i + 1,
    });
  }

  for (let i = 0; i < importedAccounts; i++) {
    accounts.push({
      address: `B62qIMP_${i}_address`,
      privateKey: `encrypted_imported_key_${i}`,
      type: ACCOUNT_TYPE.WALLET_OUTSIDE,
      accountName: `Imported ${i + 1}`,
      typeIndex: i + 1,
    });
  }

  for (let i = 0; i < ledgerAccounts; i++) {
    accounts.push({
      address: `B62qLED_${i}_address`,
      type: ACCOUNT_TYPE.WALLET_LEDGER,
      hdPath: i,
      accountName: `Ledger ${i + 1}`,
      typeIndex: i + 1,
    });
  }

  for (let i = 0; i < watchAccounts; i++) {
    accounts.push({
      address: `B62qWAT_${i}_address`,
      type: ACCOUNT_TYPE.WALLET_WATCH,
      accountName: `Watch ${i + 1}`,
      typeIndex: i + 1,
    });
  }

  return {
    mnemonic,
    accounts,
    currentAddress: currentAddress || accounts[0]?.address || '',
  };
};

const createV2Vault = (keyrings: any[] = []) => {
  const vault = createEmptyVault();
  vault.keyrings = keyrings;
  if (keyrings.length > 0) {
    vault.currentKeyringId = keyrings[0].id;
  }
  return vault;
};

describe('vaultTypes', () => {
  describe('isLegacyVault', () => {
    it('should return true for valid legacy format', () => {
      const legacy = [createLegacyWallet()];
      expect(isLegacyVault(legacy)).toBe(true);
    });

    it('should return false for empty array', () => {
      expect(isLegacyVault([])).toBe(false);
    });

    it('should return false for non-array', () => {
      expect(isLegacyVault({})).toBe(false);
      expect(isLegacyVault(null)).toBe(false);
      expect(isLegacyVault(undefined)).toBe(false);
    });

    it('should return false for V2 vault', () => {
      const v2 = createEmptyVault();
      expect(isLegacyVault(v2)).toBe(false);
    });
  });

  describe('isModernVault', () => {
    it('should return true for valid V2 format', () => {
      const v2 = createEmptyVault();
      expect(isModernVault(v2)).toBe(true);
    });

    it('should return false for legacy format', () => {
      const legacy = [createLegacyWallet()];
      expect(isModernVault(legacy)).toBe(false);
    });

    it('should return false for wrong version', () => {
      const wrong = { version: 1, keyrings: [] };
      expect(isModernVault(wrong)).toBe(false);
    });
  });

  describe('createHDKeyring', () => {
    it('should create HD keyring without privateKey in accounts', () => {
      const keyring = createHDKeyring('Test', 'encrypted_mnemonic');
      expect(keyring.type).toBe(KEYRING_TYPE.HD);
      expect(keyring.mnemonic).toBe('encrypted_mnemonic');
      expect(keyring.accounts).toHaveLength(0);
      expect(keyring.nextHdIndex).toBe(0);
    });
  });

  describe('generateUUID', () => {
    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(typeof uuid1).toBe('string');
      expect(typeof uuid2).toBe('string');
      expect(uuid1).not.toBe(uuid2);
    });
  });
});

describe('vaultMigration', () => {
  describe('migrateToV2', () => {
    it('should return empty vault for empty array', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const result = migrateToV2([]);
      expect(result.version).toBe(VAULT_VERSION);
      expect(result.keyrings).toHaveLength(0);
      warnSpy.mockRestore();
    });

    it('should migrate single HD wallet to HD keyring', () => {
      const legacy = [createLegacyWallet({ hdAccounts: 3 })];
      const result = migrateToV2(legacy);

      expect(result.keyrings).toHaveLength(1);
      expect(result.keyrings[0]!.type).toBe(KEYRING_TYPE.HD);
      expect(result.keyrings[0]!.accounts).toHaveLength(3);
    });

    it('should NOT store privateKey for HD accounts', () => {
      const legacy = [createLegacyWallet({ hdAccounts: 2 })];
      const result = migrateToV2(legacy);

      const hdKeyring = result.keyrings[0]!;
      hdKeyring.accounts.forEach((acc: any) => {
        expect(acc.privateKey).toBeUndefined();
        expect(typeof acc.hdIndex).toBe('number');
      });
    });

    it('should preserve privateKey for imported accounts', () => {
      const legacy = [createLegacyWallet({ hdAccounts: 1, importedAccounts: 2 })];
      const result = migrateToV2(legacy);

      const importedKeyring = result.keyrings.find(
        (kr: any) => kr.type === KEYRING_TYPE.IMPORTED
      );
      expect(importedKeyring).toBeDefined();
      importedKeyring?.accounts.forEach((acc: any) => {
        expect(typeof acc.privateKey).toBe('string');
      });
    });

    it('should create separate keyrings for each account type', () => {
      const legacy = [
        createLegacyWallet({
          hdAccounts: 2,
          importedAccounts: 1,
          ledgerAccounts: 1,
          watchAccounts: 1,
        }),
      ];
      const result = migrateToV2(legacy);

      expect(result.keyrings).toHaveLength(4);

      const types = result.keyrings.map((kr: any) => kr.type);
      expect(types).toContain(KEYRING_TYPE.HD);
      expect(types).toContain(KEYRING_TYPE.IMPORTED);
      expect(types).toContain(KEYRING_TYPE.LEDGER);
      expect(types).toContain(KEYRING_TYPE.WATCH);
    });

    it('should set nextHdIndex correctly', () => {
      const legacy = [createLegacyWallet({ hdAccounts: 5 })];
      const result = migrateToV2(legacy);

      const hdKeyring = result.keyrings[0] as { nextHdIndex?: number };
      expect(hdKeyring!.nextHdIndex).toBe(5);
    });

    it('should preserve currentAddress', () => {
      const legacy = [
        createLegacyWallet({
          hdAccounts: 3,
          currentAddress: 'B62qHD_1_address',
        }),
      ];
      const result = migrateToV2(legacy);

      expect(result.keyrings[0]!.currentAddress).toBe('B62qHD_1_address');
    });

    it('should set currentKeyringId to first keyring', () => {
      const legacy = [createLegacyWallet({ hdAccounts: 1 })];
      const result = migrateToV2(legacy);

      expect(result.currentKeyringId).toBe(result.keyrings[0]!.id);
    });
  });

  describe('normalizeVault', () => {
    it('should return V2 vault unchanged', () => {
      const v2 = createV2Vault([createHDKeyring('Test', 'mnemonic')]);
      const { vault, migrated } = normalizeVault(v2);

      expect(migrated).toBe(false);
      expect(vault).toEqual(v2);
    });

    it('should migrate legacy vault', () => {
      const legacy = [createLegacyWallet({ hdAccounts: 2 })];
      const { vault, migrated } = normalizeVault(legacy);

      expect(migrated).toBe(true);
      expect(isModernVault(vault)).toBe(true);
    });

    it('should return empty vault for invalid input', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const { vault, migrated } = normalizeVault(null);

      expect(migrated).toBe(true);
      expect(vault.keyrings).toHaveLength(0);
      warnSpy.mockRestore();
    });
  });

  describe('convertV2ToLegacy', () => {
    it('should convert V2 to legacy array format', () => {
      const hdKeyring = createHDKeyring('Wallet 1', 'encrypted_mnemonic');
      hdKeyring.accounts.push(
        { address: 'B62q1', hdIndex: 0, name: 'Account 1' } as any
      );
      hdKeyring.currentAddress = 'B62q1';

      const v2 = createV2Vault([hdKeyring]);
      const legacy = convertV2ToLegacy(v2);

      expect(Array.isArray(legacy)).toBe(true);
      expect(legacy).toHaveLength(1);
      expect(legacy[0]!.mnemonic).toBe('encrypted_mnemonic');
      expect(legacy[0]!.accounts).toHaveLength(1);
      expect(legacy[0]!.currentAddress).toBe('B62q1');
    });

    it('should preserve account types', () => {
      const hdKeyring = createHDKeyring('HD', 'mnemonic');
      hdKeyring.accounts.push(
        { address: 'B62qHD', hdIndex: 0, name: 'HD' } as any
      );

      const importedKeyring = createImportedKeyring('Imported');
      importedKeyring.accounts.push({
        address: 'B62qIMP',
        privateKey: 'key',
        name: 'Imp',
      } as any);

      const v2 = createV2Vault([hdKeyring, importedKeyring]);
      const legacy = convertV2ToLegacy(v2);

      const hdAcc = (legacy[0] as { accounts: any[] }).accounts.find((a: any) => a.address === 'B62qHD');
      const impAcc = (legacy[0] as { accounts: any[] }).accounts.find((a: any) => a.address === 'B62qIMP');

      expect(hdAcc!.type).toBe(ACCOUNT_TYPE.WALLET_INSIDE);
      expect(impAcc!.type).toBe(ACCOUNT_TYPE.WALLET_OUTSIDE);
      expect(impAcc!.privateKey).toBe('key');
    });

    it('should return empty array for empty vault', () => {
      const result = convertV2ToLegacy(null as any);
      expect(result).toEqual([]);
    });
  });
});

describe('validateVault', () => {
  it('should pass for valid V2 vault', () => {
    const hdKeyring = createHDKeyring('Test', 'mnemonic');
    hdKeyring.accounts.push(
      { address: 'B62q1', hdIndex: 0, name: 'Test' } as any
    );
    const vault = createV2Vault([hdKeyring]);

    const { valid, errors } = validateVault(vault);
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  it('should allow modern vault version 2', () => {
    const hdKeyring = createHDKeyring('Test', 'mnemonic');
    hdKeyring.accounts.push(
      { address: 'B62q1', hdIndex: 0, name: 'Test' } as any
    );
    const vault = createV2Vault([hdKeyring]);
    vault.version = 2;

    const { valid, errors } = validateVault(vault);
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  it('should fail for missing keyring ID', () => {
    const vault = createEmptyVault();
    vault.keyrings.push({ type: KEYRING_TYPE.HD, accounts: [] } as any);

    const { valid, errors } = validateVault(vault);
    expect(valid).toBe(false);
    expect(errors.some((e: string) => e.includes('missing ID'))).toBe(true);
  });

  it('should fail for HD account missing hdIndex', () => {
    const hdKeyring = createHDKeyring('Test', 'mnemonic');
    hdKeyring.accounts.push({ address: 'B62q1', name: 'Test' } as any);
    const vault = createV2Vault([hdKeyring]);

    const { valid, errors } = validateVault(vault);
    expect(valid).toBe(false);
    expect(errors.some((e: string) => e.includes('missing hdIndex'))).toBe(true);
  });

  it('should fail for imported account missing privateKey', () => {
    const impKeyring = createImportedKeyring('Imported');
    impKeyring.accounts.push({ address: 'B62q1', name: 'Test' } as any);
    const vault = createV2Vault([impKeyring]);

    const { valid, errors } = validateVault(vault);
    expect(valid).toBe(false);
    expect(errors.some((e: string) => e.includes('missing privateKey'))).toBe(true);
  });

  it('should fail for wrong version', () => {
    const vault = { version: 1, keyrings: [] } as any;
    const { valid, errors } = validateVault(vault);
    expect(valid).toBe(false);
    expect(errors.some((e: string) => e.includes('Invalid vault version'))).toBe(true);
  });
});

describe('Lookup Functions', () => {
  let testVault: any;

  beforeEach(() => {
    const hdKeyring = createHDKeyring('HD Wallet', 'mnemonic');
    hdKeyring.accounts.push(
      { address: 'B62qHD1', hdIndex: 0, name: 'HD 1' } as any,
      { address: 'B62qHD2', hdIndex: 1, name: 'HD 2' } as any
    );
    hdKeyring.currentAddress = 'B62qHD1';

    const impKeyring = createImportedKeyring('Imported');
    impKeyring.accounts.push({
      address: 'B62qIMP1',
      privateKey: 'key',
      name: 'Imp 1',
    } as any);

    testVault = createV2Vault([hdKeyring, impKeyring]);
  });

  describe('findAccountByAddress', () => {
    it('should find account in HD keyring', () => {
      const result = findAccountByAddress(testVault, 'B62qHD1');
      expect(result).not.toBeNull();
      expect(result?.account.address).toBe('B62qHD1');
      expect(result?.keyring.type).toBe(KEYRING_TYPE.HD);
    });

    it('should find account in imported keyring', () => {
      const result = findAccountByAddress(testVault, 'B62qIMP1');
      expect(result).not.toBeNull();
      expect(result?.keyring.type).toBe(KEYRING_TYPE.IMPORTED);
    });

    it('should return null for non-existent address', () => {
      const result = findAccountByAddress(testVault, 'B62qNONE');
      expect(result).toBeNull();
    });
  });

  describe('findKeyringById', () => {
    it('should find keyring by ID', () => {
      const firstKeyring = testVault.keyrings[0];
      const result = findKeyringById(testVault, firstKeyring.id);
      expect(result).toBe(firstKeyring);
    });

    it('should return null for non-existent ID', () => {
      const result = findKeyringById(testVault, 'non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('getCurrentKeyring', () => {
    it('should return keyring matching currentKeyringId', () => {
      const result = getCurrentKeyring(testVault);
      expect(result?.id).toBe(testVault.currentKeyringId);
    });

    it('should return first keyring if no currentKeyringId', () => {
      testVault.currentKeyringId = '';
      const result = getCurrentKeyring(testVault);
      expect(result).toBe(testVault.keyrings[0]);
    });
  });

  describe('getCurrentAccount', () => {
    it('should return account matching currentAddress', () => {
      const result = getCurrentAccount(testVault);
      expect(result?.address).toBe('B62qHD1');
    });

    it('should return first account if no currentAddress', () => {
      testVault.keyrings[0].currentAddress = '';
      const result = getCurrentAccount(testVault);
      expect(result).toBe(testVault.keyrings[0].accounts[0]);
    });
  });
});

describe('Edge Cases', () => {
  it('should handle wallet with no mnemonic', () => {
    const legacy = [{ accounts: [], currentAddress: '' }];
    const result = migrateToV2(legacy as any);
    expect(result.keyrings).toHaveLength(0);
  });

  it('should handle wallet with only imported accounts', () => {
    const legacy = [
      {
        accounts: [
          {
            address: 'B62q1',
            privateKey: 'key',
            type: ACCOUNT_TYPE.WALLET_OUTSIDE,
            accountName: 'Imp',
            typeIndex: 1,
          },
        ],
        currentAddress: 'B62q1',
      },
    ];
    const result = migrateToV2(legacy as any);

    expect(result.keyrings).toHaveLength(1);
    expect(result.keyrings[0]!.type).toBe(KEYRING_TYPE.IMPORTED);
  });

  it('should handle account with missing accountName', () => {
    const legacy = [
      {
        mnemonic: 'test',
        accounts: [
          {
            address: 'B62q1',
            type: ACCOUNT_TYPE.WALLET_INSIDE,
            hdPath: 0,
          },
        ],
        currentAddress: 'B62q1',
      },
    ];
    const result = migrateToV2(legacy as any);

    expect(result.keyrings[0]!.accounts[0]!.name).toBe('Account 1');
  });
});

describe('Round-trip Migration', () => {
  it('should preserve all data through migration round-trip', () => {
    const originalLegacy = [
      createLegacyWallet({
        hdAccounts: 3,
        importedAccounts: 2,
        ledgerAccounts: 1,
        watchAccounts: 1,
        currentAddress: 'B62qHD_1_address',
      }),
    ];

    const v2 = migrateToV2(originalLegacy as any);
    const backToLegacy = convertV2ToLegacy(v2);

    const originalCount = (originalLegacy[0] as { accounts: unknown[] }).accounts.length;
    const resultCount = (backToLegacy[0] as { accounts: unknown[] }).accounts.length;
    expect(resultCount).toBe(originalCount);

    expect(backToLegacy[0]!.mnemonic).toBe(originalLegacy[0]!.mnemonic);

    const originalAddresses = (originalLegacy[0] as { accounts: any[] }).accounts.map((a: any) => a.address);
    const resultAddresses = (backToLegacy[0] as { accounts: any[] }).accounts.map((a: any) => a.address);
    originalAddresses.forEach((addr: string) => {
      expect(resultAddresses).toContain(addr);
    });
  });
});
