/**
 * Vault Migration & Types Test Suite
 * 
 * Pure tests without browser extension dependencies
 * Tests use real test data with password "Aa111111"
 */

import { expect } from "chai";

// Import pure vault utilities (no browser dependencies)
import {
  convertV2ToLegacy,
  findAccountByAddress,
  getCurrentAccount,
  getCurrentKeyring,
  migrateToV2,
  normalizeVault,
  validateVault
} from "../../src/background/vaultMigration.js";

import {
  countHDKeyrings,
  KEYRING_TYPE,
  sortKeyringsByCreatedAt,
  VAULT_VERSION,
  createEmptyVault,
  createHDKeyring,
  generateUUID,
  isLegacyVault,
  isV2Vault
} from "../../src/constant/vaultTypes.js";

import { ACCOUNT_TYPE } from "../../src/constant/commonType.js";

// Import encryption utilities
const encryptUtils = require("../../src/utils/encryptUtils").default;

// Test password from 测试数据.md
const TEST_PASSWORD = "Aa111111";


// Sample legacy data structure (what old wallet stores)
const sampleLegacyData = [
  {
    mnemonic: "encrypted_mnemonic_placeholder",
    accounts: [
      {
        address: "B62qjLVC7ryAwctX9tZimvgh4FBocUozL4VtCPvPJ9bYKRatb5NCRyy",
        privateKey: "encrypted_private_key_1",
        type: ACCOUNT_TYPE.WALLET_INSIDE,
        hdPath: 0,
        accountName: "Account 1",
        typeIndex: 1,
      },
      {
        address: "B62qkhhWkJdZx9MAZHd67VqBAX7FVbzSizqsFYqMKvQu4kPNyFxxCmB",
        privateKey: "encrypted_private_key_2",
        type: ACCOUNT_TYPE.WALLET_OUTSIDE,
        accountName: "Imported 1",
        typeIndex: 1,
      },
      {
        address: "B62qledger...",
        type: ACCOUNT_TYPE.WALLET_LEDGER,
        hdPath: 0,
        accountName: "Ledger 1",
        typeIndex: 1,
      },
    ],
    currentAddress: "B62qjLVC7ryAwctX9tZimvgh4FBocUozL4VtCPvPJ9bYKRatb5NCRyy",
  },
];

// ============================================
// VAULT TYPES TESTS
// ============================================

describe("Vault Types", () => {
  describe("generateUUID", () => {
    it("should generate unique UUIDs", () => {
      const uuids = new Set();
      for (let i = 0; i < 100; i++) {
        uuids.add(generateUUID());
      }
      expect(uuids.size).to.equal(100);
    });
  });

  describe("isLegacyVault", () => {
    it("should return true for legacy v1 format", () => {
      expect(isLegacyVault(sampleLegacyData)).to.be.true;
    });

    it("should return false for v2 format", () => {
      const v2Data = { version: 2, currentKeyringId: "uuid", keyrings: [] };
      expect(isLegacyVault(v2Data)).to.be.false;
    });

    it("should return false for empty/null", () => {
      expect(isLegacyVault([])).to.be.false;
      expect(isLegacyVault(null)).to.be.false;
    });
  });

  describe("isV2Vault", () => {
    it("should return true for valid v2 vault", () => {
      const v2Data = { version: 2, currentKeyringId: "uuid", keyrings: [] };
      expect(isV2Vault(v2Data)).to.be.true;
    });

    it("should return false for legacy format", () => {
      expect(isV2Vault(sampleLegacyData)).to.be.false;
    });
  });

  describe("createHDKeyring", () => {
    it("should create HD keyring with nextHdIndex", () => {
      const keyring = createHDKeyring("Test Wallet", "encrypted_mnemonic");
      expect(keyring.id).to.be.a("string");
      expect(keyring.type).to.equal(KEYRING_TYPE.HD);
      expect(keyring.name).to.equal("Test Wallet");
      expect(keyring.mnemonic).to.equal("encrypted_mnemonic");
      expect(keyring.nextHdIndex).to.equal(0);
      expect(keyring.accounts).to.be.an("array").that.is.empty;
    });

    it("should create HD keyring with createdAt timestamp", () => {
      const before = Date.now();
      const keyring = createHDKeyring("Test Wallet", "encrypted_mnemonic");
      const after = Date.now();
      
      expect(keyring.createdAt).to.be.a("number");
      expect(keyring.createdAt).to.be.at.least(before);
      expect(keyring.createdAt).to.be.at.most(after);
    });
  });

  describe("countHDKeyrings", () => {
    it("should count HD keyrings in vault", () => {
      const vault = migrateToV2(sampleLegacyData);
      const count = countHDKeyrings(vault);
      expect(count).to.be.at.least(1);
    });

    it("should return 0 for empty vault", () => {
      const vault = createEmptyVault();
      const count = countHDKeyrings(vault);
      expect(count).to.equal(0);
    });
  });

  describe("sortKeyringsByCreatedAt", () => {
    it("should sort keyrings by creation time (oldest first)", () => {
      const keyrings = [
        { id: "1", createdAt: 3000, type: KEYRING_TYPE.HD },
        { id: "2", createdAt: 1000, type: KEYRING_TYPE.HD },
        { id: "3", createdAt: 2000, type: KEYRING_TYPE.IMPORTED },
      ];
      
      const sorted = sortKeyringsByCreatedAt(keyrings);
      
      expect(sorted[0].id).to.equal("2");
      expect(sorted[1].id).to.equal("3");
      expect(sorted[2].id).to.equal("1");
    });

    it("should handle keyrings without createdAt", () => {
      const keyrings = [
        { id: "1", type: KEYRING_TYPE.HD },
        { id: "2", createdAt: 1000, type: KEYRING_TYPE.HD },
      ];
      
      const sorted = sortKeyringsByCreatedAt(keyrings);
      expect(sorted).to.have.length(2);
    });
  });
});

// ============================================
// VAULT MIGRATION TESTS
// ============================================

describe("Vault Migration", () => {
  describe("migrateToV2", () => {
    it("should migrate legacy data to v2 format", () => {
      const vault = migrateToV2(sampleLegacyData);

      expect(vault.version).to.equal(VAULT_VERSION);
      expect(vault.keyrings).to.be.an("array");
      expect(vault.currentKeyringId).to.be.a("string");
    });

    it("should separate accounts by type into different keyrings", () => {
      const vault = migrateToV2(sampleLegacyData);

      // Should have separate keyrings for HD, Imported, Ledger
      const hdKeyrings = vault.keyrings.filter(kr => kr.type === KEYRING_TYPE.HD);
      const importedKeyrings = vault.keyrings.filter(kr => kr.type === KEYRING_TYPE.IMPORTED);
      const ledgerKeyrings = vault.keyrings.filter(kr => kr.type === KEYRING_TYPE.LEDGER);

      expect(hdKeyrings.length).to.be.at.least(1);
      expect(importedKeyrings.length).to.be.at.least(1);
      expect(ledgerKeyrings.length).to.be.at.least(1);
    });

    it("should NOT store privateKey for HD accounts", () => {
      const vault = migrateToV2(sampleLegacyData);
      const hdKeyring = vault.keyrings.find(kr => kr.type === KEYRING_TYPE.HD);

      hdKeyring.accounts.forEach(account => {
        expect(account.privateKey).to.be.undefined;
        expect(account.hdIndex).to.be.a("number");
      });
    });

    it("should store privateKey for imported accounts", () => {
      const vault = migrateToV2(sampleLegacyData);
      const importedKeyring = vault.keyrings.find(kr => kr.type === KEYRING_TYPE.IMPORTED);

      importedKeyring.accounts.forEach(account => {
        expect(account.privateKey).to.be.a("string");
      });
    });

    it("should handle empty legacy data", () => {
      const vault = migrateToV2([]);
      expect(vault.version).to.equal(VAULT_VERSION);
      expect(vault.keyrings).to.be.empty;
    });
  });

  describe("convertV2ToLegacy", () => {
    it("should convert v2 vault back to legacy format", () => {
      const vault = migrateToV2(sampleLegacyData);
      const legacy = convertV2ToLegacy(vault);

      expect(legacy).to.be.an("array");
      expect(legacy.length).to.equal(1);
      expect(legacy[0]).to.have.property("mnemonic");
      expect(legacy[0]).to.have.property("accounts");
      expect(legacy[0]).to.have.property("currentAddress");
    });

    it("should preserve account count in round-trip", () => {
      const vault = migrateToV2(sampleLegacyData);
      const legacy = convertV2ToLegacy(vault);

      expect(legacy[0].accounts.length).to.equal(sampleLegacyData[0].accounts.length);
    });
  });

  describe("normalizeVault", () => {
    it("should not migrate already v2 vault", () => {
      const v2Vault = createEmptyVault();
      v2Vault.currentKeyringId = "test";

      const { vault, migrated } = normalizeVault(v2Vault);
      expect(migrated).to.be.false;
      expect(vault).to.deep.equal(v2Vault);
    });

    it("should migrate legacy vault and flag as migrated", () => {
      const { vault, migrated } = normalizeVault(sampleLegacyData);
      expect(migrated).to.be.true;
      expect(vault.version).to.equal(VAULT_VERSION);
    });
  });

  describe("findAccountByAddress", () => {
    it("should find account across keyrings", () => {
      const vault = migrateToV2(sampleLegacyData);
      const result = findAccountByAddress(vault, "B62qjLVC7ryAwctX9tZimvgh4FBocUozL4VtCPvPJ9bYKRatb5NCRyy");

      expect(result).to.not.be.null;
      expect(result.account.address).to.equal("B62qjLVC7ryAwctX9tZimvgh4FBocUozL4VtCPvPJ9bYKRatb5NCRyy");
    });

    it("should return null for non-existent address", () => {
      const vault = migrateToV2(sampleLegacyData);
      const result = findAccountByAddress(vault, "B62qnonexistent...");
      expect(result).to.be.null;
    });
  });

  describe("getCurrentKeyring", () => {
    it("should return current keyring", () => {
      const vault = migrateToV2(sampleLegacyData);
      const keyring = getCurrentKeyring(vault);

      expect(keyring).to.not.be.null;
      expect(keyring.id).to.equal(vault.currentKeyringId);
    });
  });

  describe("getCurrentAccount", () => {
    it("should return current account from current keyring", () => {
      const vault = migrateToV2(sampleLegacyData);
      const account = getCurrentAccount(vault);

      expect(account).to.not.be.null;
      expect(account.address).to.be.a("string");
    });
  });

  describe("validateVault", () => {
    it("should validate correct vault structure", () => {
      const vault = migrateToV2(sampleLegacyData);
      const { valid, errors } = validateVault(vault);

      expect(valid).to.be.true;
      expect(errors).to.be.empty;
    });

    it("should detect missing keyring ID", () => {
      const vault = migrateToV2(sampleLegacyData);
      vault.keyrings[0].id = "";
      const { valid, errors } = validateVault(vault);

      expect(valid).to.be.false;
      expect(errors.some(e => e.includes("missing ID"))).to.be.true;
    });
  });
});

// ============================================
// ENCRYPTION / DECRYPTION TESTS (with real data)
// ============================================

// Import all 6 test cases
const { testCases } = require("../data/vault_test_data.js");

describe("Encryption Integration", () => {
  // Use imported test data for all 6 cases
  const encryptedData1 = testCases[0].data;
  const encryptedData6 = testCases[5].data;

  // ============================================
  // TEST ALL 6 CASES - Decrypt and verify account counts
  // ============================================
  describe("decrypt all 6 test cases", () => {
    testCases.forEach((testCase, index) => {
      it(`should decrypt ${testCase.name}`, async () => {
        const decrypted = await encryptUtils.decrypt(TEST_PASSWORD, testCase.data);

        expect(decrypted).to.be.an("array");
        expect(decrypted.length).to.equal(1);
        expect(decrypted[0]).to.have.property("mnemonic");
        expect(decrypted[0]).to.have.property("accounts");

        // Count accounts by type
        const accounts = decrypted[0].accounts;
        const hdCount = accounts.filter(a => a.type === ACCOUNT_TYPE.WALLET_INSIDE).length;
        const importedCount = accounts.filter(a => a.type === ACCOUNT_TYPE.WALLET_OUTSIDE).length;
        const ledgerCount = accounts.filter(a => a.type === ACCOUNT_TYPE.WALLET_LEDGER).length;

        console.log(`[Test] ${testCase.name}: HD=${hdCount}, Imported=${importedCount}, Ledger=${ledgerCount}`);

        // Verify expected counts
        expect(hdCount).to.equal(testCase.hd, `Expected ${testCase.hd} HD accounts`);
        expect(importedCount).to.equal(testCase.imported, `Expected ${testCase.imported} imported accounts`);
        expect(ledgerCount).to.equal(testCase.ledger, `Expected ${testCase.ledger} ledger accounts`);

        // Verify address format
        accounts.forEach(acc => {
          expect(acc.address.substring(0, 4)).to.equal("B62q");
        });
      });
    });
  });

  // ============================================
  // TEST ALL 6 CASES - Full migration flow
  // ============================================
  describe("migrate all 6 test cases to V2", () => {
    testCases.forEach((testCase, index) => {
      it(`should migrate ${testCase.name} to V2`, async () => {
        // 1. Decrypt
        const decrypted = await encryptUtils.decrypt(TEST_PASSWORD, testCase.data);
        expect(isLegacyVault(decrypted)).to.be.true;

        // 2. Migrate
        const { vault, migrated } = normalizeVault(decrypted);
        expect(migrated).to.be.true;
        expect(vault.version).to.equal(VAULT_VERSION);

        // 3. Validate
        const { valid, errors } = validateVault(vault);
        if (!valid) console.log(`[Test] ${testCase.name} validation errors:`, errors);
        expect(valid).to.be.true;

        // 4. Verify keyring counts
        const hdKeyring = vault.keyrings.find(kr => kr.type === KEYRING_TYPE.HD);
        const importedKeyring = vault.keyrings.find(kr => kr.type === KEYRING_TYPE.IMPORTED);
        const ledgerKeyring = vault.keyrings.find(kr => kr.type === KEYRING_TYPE.LEDGER);

        if (testCase.hd > 0) {
          expect(hdKeyring).to.exist;
          expect(hdKeyring.accounts.length).to.equal(testCase.hd);
          // HD accounts should NOT have privateKey stored
          hdKeyring.accounts.forEach(acc => {
            expect(acc.privateKey).to.be.undefined;
          });
        }

        if (testCase.imported > 0) {
          expect(importedKeyring).to.exist;
          expect(importedKeyring.accounts.length).to.equal(testCase.imported);
          // Imported accounts SHOULD have privateKey stored
          importedKeyring.accounts.forEach(acc => {
            expect(acc.privateKey).to.be.a("string");
          });
        }

        if (testCase.ledger > 0) {
          expect(ledgerKeyring).to.exist;
          expect(ledgerKeyring.accounts.length).to.equal(testCase.ledger);
        }

        console.log(`[Test] ${testCase.name} migrated successfully`);
      });
    });
  });

  describe("full migration flow", () => {
    it("should decrypt -> migrate -> validate for test case 1", async () => {
      // 1. Decrypt
      const decrypted = await encryptUtils.decrypt(TEST_PASSWORD, encryptedData1);
      expect(isLegacyVault(decrypted)).to.be.true;

      // 2. Migrate
      const { vault, migrated } = normalizeVault(decrypted);
      expect(migrated).to.be.true;
      expect(vault.version).to.equal(VAULT_VERSION);

      // 3. Validate
      const { valid, errors } = validateVault(vault);
      expect(valid).to.be.true;

      // 4. Verify HD account has NO privateKey stored
      const hdKeyring = vault.keyrings.find(kr => kr.type === KEYRING_TYPE.HD);
      expect(hdKeyring).to.exist;
      expect(hdKeyring.accounts[0].privateKey).to.be.undefined;
      expect(hdKeyring.accounts[0].hdIndex).to.equal(0);

      // 5. Verify mnemonic preserved
      expect(hdKeyring.mnemonic).to.be.a("string");
    });

    it("should decrypt -> migrate -> validate for test case 6 (mixed types)", async () => {
      // 1. Decrypt
      const decrypted = await encryptUtils.decrypt(TEST_PASSWORD, encryptedData6);

      // 2. Migrate
      const { vault, migrated } = normalizeVault(decrypted);
      expect(migrated).to.be.true;

      // 3. Validate
      const { valid, errors } = validateVault(vault);
      if (!valid) console.log("Validation errors:", errors);
      expect(valid).to.be.true;

      // 4. Should have separate keyrings for each type
      const keyringTypes = vault.keyrings.map(kr => kr.type);
      expect(keyringTypes).to.include(KEYRING_TYPE.HD);
    });

    it("should re-encrypt migrated vault", async () => {
      // 1. Decrypt
      const decrypted = await encryptUtils.decrypt(TEST_PASSWORD, encryptedData1);

      // 2. Migrate
      const { vault } = normalizeVault(decrypted);

      // 3. Re-encrypt with same password
      const reEncrypted = await encryptUtils.encrypt(TEST_PASSWORD, vault);
      expect(reEncrypted).to.be.a("string");

      // 4. Decrypt again and verify
      const decrypted2 = await encryptUtils.decrypt(TEST_PASSWORD, reEncrypted);
      expect(decrypted2.version).to.equal(VAULT_VERSION);
      expect(decrypted2.keyrings).to.be.an("array");
    });
  });

  describe("backward compatibility (convertV2ToLegacy)", () => {
    it("should convert migrated vault back to legacy format for memStore", async () => {
      // 1. Decrypt
      const decrypted = await encryptUtils.decrypt(TEST_PASSWORD, encryptedData1);

      // 2. Migrate
      const { vault } = normalizeVault(decrypted);

      // 3. Convert back to legacy
      const legacy = convertV2ToLegacy(vault);

      expect(legacy).to.be.an("array");
      expect(legacy[0]).to.have.property("mnemonic");
      expect(legacy[0]).to.have.property("accounts");
      expect(legacy[0]).to.have.property("currentAddress");
      expect(legacy[0].accounts[0]).to.have.property("accountName");
    });
  });
});
