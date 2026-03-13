/**
 * Vault Migration & Types Test Suite - Migrated from Mocha to Jest
 */
import {
  convertModernToLegacy,
  findAccountByAddress,
  getCurrentAccount,
  getCurrentKeyring,
  migrateToModern,
  normalizeVault,
  validateVault
} from '@/background/vaultMigration';

import {
  countHDKeyrings,
  KEYRING_TYPE,
  sortKeyringsByCreatedAt,
  VAULT_VERSION,
  createEmptyVault,
  createHDKeyring,
  generateUUID,
  isLegacyVault,
  isModernVault
} from '@/constant/vaultTypes';

import { ACCOUNT_TYPE } from '@/constant/commonType';
import encryptUtils from '@/utils/encryptUtils';

const TEST_PASSWORD = 'Aa111111';

const sampleLegacyData = [
  {
    mnemonic: 'encrypted_mnemonic_placeholder',
    accounts: [
      {
        address: 'B62qjLVC7ryAwctX9tZimvgh4FBocUozL4VtCPvPJ9bYKRatb5NCRyy',
        privateKey: 'encrypted_private_key_1',
        type: ACCOUNT_TYPE.WALLET_INSIDE,
        hdPath: 0,
        accountName: 'Account 1',
        typeIndex: 1,
      },
      {
        address: 'B62qkhhWkJdZx9MAZHd67VqBAX7FVbzSizqsFYqMKvQu4kPNyFxxCmB',
        privateKey: 'encrypted_private_key_2',
        type: ACCOUNT_TYPE.WALLET_OUTSIDE,
        accountName: 'Imported 1',
        typeIndex: 1,
      },
      {
        address: 'B62qledger...',
        type: ACCOUNT_TYPE.WALLET_LEDGER,
        hdPath: 0,
        accountName: 'Ledger 1',
        typeIndex: 1,
      },
    ],
    currentAddress: 'B62qjLVC7ryAwctX9tZimvgh4FBocUozL4VtCPvPJ9bYKRatb5NCRyy',
  },
];

describe('Vault Types', () => {
  describe('generateUUID', () => {
    it('should generate unique UUIDs', () => {
      const uuids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        uuids.add(generateUUID());
      }
      expect(uuids.size).toBe(100);
    });
  });

  describe('isLegacyVault', () => {
    it('should return true for legacy v1 format', () => {
      expect(isLegacyVault(sampleLegacyData)).toBe(true);
    });

    it('should return false for v2 format', () => {
      const v2Data = { version: 2, currentKeyringId: 'uuid', keyrings: [] };
      expect(isLegacyVault(v2Data)).toBe(false);
    });

    it('should return false for empty/null', () => {
      expect(isLegacyVault([])).toBe(false);
      expect(isLegacyVault(null)).toBe(false);
    });
  });

  describe('isModernVault', () => {
    it('should return true for valid v2 vault', () => {
      const v2Data = { version: 2, currentKeyringId: 'uuid', keyrings: [] };
      expect(isModernVault(v2Data)).toBe(true);
    });

    it('should return false for legacy format', () => {
      expect(isModernVault(sampleLegacyData)).toBe(false);
    });
  });

  describe('createHDKeyring', () => {
    it('should create HD keyring with nextHdIndex', () => {
      const keyring = createHDKeyring('Test Wallet', 'encrypted_mnemonic');
      expect(typeof keyring.id).toBe('string');
      expect(keyring.type).toBe(KEYRING_TYPE.HD);
      expect(keyring.name).toBe('Test Wallet');
      expect(keyring.mnemonic).toBe('encrypted_mnemonic');
      expect(keyring.nextHdIndex).toBe(0);
      expect(keyring.accounts).toEqual([]);
    });

    it('should create HD keyring with createdAt timestamp', () => {
      const before = Date.now();
      const keyring = createHDKeyring('Test Wallet', 'encrypted_mnemonic');
      const after = Date.now();

      expect(typeof keyring.createdAt).toBe('number');
      expect(keyring.createdAt).toBeGreaterThanOrEqual(before);
      expect(keyring.createdAt).toBeLessThanOrEqual(after);
    });
  });

  describe('countHDKeyrings', () => {
    it('should count HD keyrings in vault', () => {
      const vault = migrateToModern(sampleLegacyData);
      const count = countHDKeyrings(vault);
      expect(count).toBeGreaterThanOrEqual(1);
    });

    it('should return 0 for empty vault', () => {
      const vault = createEmptyVault();
      const count = countHDKeyrings(vault);
      expect(count).toBe(0);
    });
  });

  describe('sortKeyringsByCreatedAt', () => {
    it('should sort keyrings by creation time (oldest first)', () => {
      const keyrings = [
        { id: '1', createdAt: 3000, type: KEYRING_TYPE.HD },
        { id: '2', createdAt: 1000, type: KEYRING_TYPE.HD },
        { id: '3', createdAt: 2000, type: KEYRING_TYPE.IMPORTED },
      ] as any[];

      const sorted = sortKeyringsByCreatedAt(keyrings);

      expect(sorted[0]!.id).toBe('2');
      expect(sorted[1]!.id).toBe('3');
      expect(sorted[2]!.id).toBe('1');
    });

    it('should handle keyrings without createdAt', () => {
      const keyrings = [
        { id: '1', type: KEYRING_TYPE.HD },
        { id: '2', createdAt: 1000, type: KEYRING_TYPE.HD },
      ] as any[];

      const sorted = sortKeyringsByCreatedAt(keyrings);
      expect(sorted).toHaveLength(2);
    });
  });
});

describe('Vault Migration', () => {
  describe('migrateToModern', () => {
    it('should migrate legacy data to v2 format', () => {
      const vault = migrateToModern(sampleLegacyData);

      expect(vault.version).toBe(VAULT_VERSION);
      expect(Array.isArray(vault.keyrings)).toBe(true);
      expect(typeof vault.currentKeyringId).toBe('string');
    });

    it('should separate accounts by type into different keyrings', () => {
      const vault = migrateToModern(sampleLegacyData);

      const hdKeyrings = vault.keyrings.filter(kr => kr.type === KEYRING_TYPE.HD);
      const importedKeyrings = vault.keyrings.filter(kr => kr.type === KEYRING_TYPE.IMPORTED);
      const ledgerKeyrings = vault.keyrings.filter(kr => kr.type === KEYRING_TYPE.LEDGER);

      expect(hdKeyrings.length).toBeGreaterThanOrEqual(1);
      expect(importedKeyrings.length).toBeGreaterThanOrEqual(1);
      expect(ledgerKeyrings.length).toBeGreaterThanOrEqual(1);
    });

    it('should NOT store privateKey for HD accounts', () => {
      const vault = migrateToModern(sampleLegacyData);
      const hdKeyring = vault.keyrings.find(kr => kr.type === KEYRING_TYPE.HD);

      hdKeyring?.accounts.forEach((account: { privateKey?: string; hdIndex?: number }) => {
        expect(account.privateKey).toBeUndefined();
        expect(typeof account.hdIndex).toBe('number');
      });
    });

    it('should store privateKey for imported accounts', () => {
      const vault = migrateToModern(sampleLegacyData);
      const importedKeyring = vault.keyrings.find(kr => kr.type === KEYRING_TYPE.IMPORTED);

      importedKeyring?.accounts.forEach(account => {
        expect(typeof account.privateKey).toBe('string');
      });
    });

    it('should handle empty legacy data', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const vault = migrateToModern([]);
      expect(vault.version).toBe(VAULT_VERSION);
      expect(vault.keyrings).toHaveLength(0);
      warnSpy.mockRestore();
    });
  });

  describe('convertModernToLegacy', () => {
    it('should convert v2 vault back to legacy format', () => {
      const vault = migrateToModern(sampleLegacyData);
      const legacy = convertModernToLegacy(vault);

      expect(Array.isArray(legacy)).toBe(true);
      expect(legacy.length).toBe(1);
      expect(legacy[0]).toHaveProperty('mnemonic');
      expect(legacy[0]).toHaveProperty('accounts');
      expect(legacy[0]).toHaveProperty('currentAddress');
    });

    it('should preserve account count in round-trip', () => {
      const vault = migrateToModern(sampleLegacyData);
      const legacy = convertModernToLegacy(vault);

      expect((legacy[0] as { accounts: unknown[] }).accounts.length).toBe((sampleLegacyData[0] as { accounts: unknown[] }).accounts.length);
    });
  });

  describe('normalizeVault', () => {
    it('should not migrate already v2 vault', () => {
      const v2Vault = createEmptyVault();
      v2Vault.currentKeyringId = 'test';

      const { vault, migrated } = normalizeVault(v2Vault);
      expect(migrated).toBe(false);
      expect(vault).toEqual(v2Vault);
    });

    it('should migrate legacy vault and flag as migrated', () => {
      const { vault, migrated } = normalizeVault(sampleLegacyData);
      expect(migrated).toBe(true);
      expect(vault.version).toBe(VAULT_VERSION);
    });
  });

  describe('findAccountByAddress', () => {
    it('should find account across keyrings', () => {
      const vault = migrateToModern(sampleLegacyData);
      const result = findAccountByAddress(vault, 'B62qjLVC7ryAwctX9tZimvgh4FBocUozL4VtCPvPJ9bYKRatb5NCRyy');

      expect(result).not.toBeNull();
      expect(result?.account.address).toBe('B62qjLVC7ryAwctX9tZimvgh4FBocUozL4VtCPvPJ9bYKRatb5NCRyy');
    });

    it('should return null for non-existent address', () => {
      const vault = migrateToModern(sampleLegacyData);
      const result = findAccountByAddress(vault, 'B62qnonexistent...');
      expect(result).toBeNull();
    });
  });

  describe('getCurrentKeyring', () => {
    it('should return current keyring', () => {
      const vault = migrateToModern(sampleLegacyData);
      const keyring = getCurrentKeyring(vault);

      expect(keyring).not.toBeNull();
      expect(keyring?.id).toBe(vault.currentKeyringId);
    });
  });

  describe('getCurrentAccount', () => {
    it('should return current account from current keyring', () => {
      const vault = migrateToModern(sampleLegacyData);
      const account = getCurrentAccount(vault);

      expect(account).not.toBeNull();
      expect(typeof account?.address).toBe('string');
    });
  });

  describe('validateVault', () => {
    it('should validate correct vault structure', () => {
      const vault = migrateToModern(sampleLegacyData);
      const { valid, errors } = validateVault(vault);

      expect(valid).toBe(true);
      expect(errors).toHaveLength(0);
    });

    it('should detect missing keyring ID', () => {
      const vault = migrateToModern(sampleLegacyData);
      vault.keyrings[0]!.id = '';
      const { valid, errors } = validateVault(vault);

      expect(valid).toBe(false);
      expect(errors.some(e => e.includes('missing ID'))).toBe(true);
    });
  });
});

// Encryption tests with real data
const { testCases } = require('../data/vault_test_data.js');

describe('Encryption Integration', () => {
  describe('decrypt all 6 test cases', () => {
    testCases.forEach((testCase: any, index: number) => {
      it(`should decrypt ${testCase.name}`, async () => {
        const decrypted = await encryptUtils.decrypt(TEST_PASSWORD, testCase.data);

        expect(Array.isArray(decrypted)).toBe(true);
        expect((decrypted as unknown[]).length).toBe(1);
        expect((decrypted as any[])[0]).toHaveProperty('mnemonic');
        expect((decrypted as any[])[0]).toHaveProperty('accounts');

        const accounts = (decrypted as any[])[0].accounts;
        const hdCount = accounts.filter((a: any) => a.type === ACCOUNT_TYPE.WALLET_INSIDE).length;
        const importedCount = accounts.filter((a: any) => a.type === ACCOUNT_TYPE.WALLET_OUTSIDE).length;
        const ledgerCount = accounts.filter((a: any) => a.type === ACCOUNT_TYPE.WALLET_LEDGER).length;

        expect(hdCount).toBe(testCase.hd);
        expect(importedCount).toBe(testCase.imported);
        expect(ledgerCount).toBe(testCase.ledger);

        accounts.forEach((acc: any) => {
          expect(acc.address.substring(0, 4)).toBe('B62q');
        });
      });
    });
  });

  describe('migrate all 6 test cases to V2', () => {
    testCases.forEach((testCase: any, index: number) => {
      it(`should migrate ${testCase.name} to V2`, async () => {
        const decrypted = await encryptUtils.decrypt(TEST_PASSWORD, testCase.data);
        expect(isLegacyVault(decrypted)).toBe(true);

        const { vault, migrated } = normalizeVault(decrypted);
        expect(migrated).toBe(true);
        expect(vault.version).toBe(VAULT_VERSION);

        const { valid, errors } = validateVault(vault);
        expect(valid).toBe(true);

        const hdKeyring = vault.keyrings.find(kr => kr.type === KEYRING_TYPE.HD);
        const importedKeyring = vault.keyrings.find(kr => kr.type === KEYRING_TYPE.IMPORTED);
        const ledgerKeyring = vault.keyrings.find(kr => kr.type === KEYRING_TYPE.LEDGER);

        if (testCase.hd > 0) {
          expect(hdKeyring).toBeDefined();
          expect(hdKeyring?.accounts.length).toBe(testCase.hd);
          hdKeyring?.accounts.forEach((acc: unknown) => {
            expect((acc as { privateKey?: string }).privateKey).toBeUndefined();
          });
        }

        if (testCase.imported > 0) {
          expect(importedKeyring).toBeDefined();
          expect(importedKeyring?.accounts.length).toBe(testCase.imported);
          importedKeyring?.accounts.forEach((acc: { privateKey?: string }) => {
            expect(typeof acc.privateKey).toBe('string');
          });
        }

        if (testCase.ledger > 0) {
          expect(ledgerKeyring).toBeDefined();
          expect(ledgerKeyring?.accounts.length).toBe(testCase.ledger);
        }
      });
    });
  });

  describe('full migration flow', () => {
    it('should re-encrypt migrated vault', async () => {
      const decrypted = await encryptUtils.decrypt(TEST_PASSWORD, testCases[0].data);
      const { vault } = normalizeVault(decrypted);
      const reEncrypted = await encryptUtils.encrypt(TEST_PASSWORD, vault);
      expect(typeof reEncrypted).toBe('string');

      const decrypted2 = await encryptUtils.decrypt(TEST_PASSWORD, reEncrypted) as { version: string; keyrings: unknown[] };
      expect(decrypted2.version).toBe(VAULT_VERSION);
      expect(Array.isArray(decrypted2.keyrings)).toBe(true);
    });
  });

  describe('backward compatibility (convertModernToLegacy)', () => {
    it('should convert migrated vault back to legacy format', async () => {
      const decrypted = await encryptUtils.decrypt(TEST_PASSWORD, testCases[0].data);
      const { vault } = normalizeVault(decrypted);
      const legacy = convertModernToLegacy(vault);

      expect(Array.isArray(legacy)).toBe(true);
      expect(legacy[0]).toHaveProperty('mnemonic');
      expect(legacy[0]).toHaveProperty('accounts');
      expect(legacy[0]).toHaveProperty('currentAddress');
      expect((legacy[0] as { accounts: unknown[] }).accounts[0]).toHaveProperty('accountName');
    });
  });
});
