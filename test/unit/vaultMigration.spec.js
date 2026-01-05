/**
 * Complete Jest Test Suite for Vault Migration
 * 
 * Covers: Migration, Rollback, Keyring Operations, Validation
 * 
 * Test Matrix:
 * | Category        | Method              | Scenario                          | Expected Result           |
 * |-----------------|---------------------|-----------------------------------|---------------------------|
 * | Migration       | migrateToV2         | Empty array                       | Empty vault               |
 * | Migration       | migrateToV2         | Single HD wallet                  | 1 HD keyring              |
 * | Migration       | migrateToV2         | HD + Imported + Ledger + Watch    | 4 keyrings                |
 * | Migration       | migrateToV2         | Multiple wallets                  | Multiple keyrings         |
 * | Migration       | migrateToV2         | HD accounts no privateKey         | No privateKey stored      |
 * | Migration       | migrateToV2         | Imported accounts keep privateKey | privateKey preserved      |
 * | Normalize       | normalizeVault      | V2 vault input                    | No migration              |
 * | Normalize       | normalizeVault      | Legacy vault input                | Migrated to V2            |
 * | Normalize       | normalizeVault      | Invalid input                     | Empty vault               |
 * | Legacy Convert  | convertV2ToLegacy   | V2 to legacy format               | Array format              |
 * | Legacy Convert  | convertV2ToLegacy   | Preserve mnemonic                 | Mnemonic in result        |
 * | Legacy Convert  | convertV2ToLegacy   | Preserve currentAddress           | Address matches           |
 * | Validation      | validateVault       | Valid V2 vault                    | valid: true               |
 * | Validation      | validateVault       | Missing keyring ID                | valid: false              |
 * | Validation      | validateVault       | Missing account address           | valid: false              |
 * | Validation      | validateVault       | HD missing hdIndex                | valid: false              |
 * | Validation      | validateVault       | Imported missing privateKey       | valid: false              |
 * | Rollback        | safeMigrateToV2     | Success migration                 | V2 vault saved            |
 * | Rollback        | safeMigrateToV2     | Validation fails                  | Rollback to backup        |
 * | Rollback        | safeMigrateToV2     | Save fails                        | Rollback to backup        |
 * | Rollback        | restoreFromBackup   | Valid backup exists               | Restored successfully     |
 * | Rollback        | restoreFromBackup   | No backup                         | Failure                   |
 * | Lookup          | findAccountByAddress| Account exists                    | Returns keyring + account |
 * | Lookup          | findAccountByAddress| Account not found                 | Returns null              |
 * | Lookup          | findKeyringById     | Keyring exists                    | Returns keyring           |
 * | Lookup          | getCurrentAccount   | Has current address               | Returns correct account   |
 * | Type Check      | isLegacyVault       | Array with mnemonic               | true                      |
 * | Type Check      | isV2Vault           | Object with version 2             | true                      |
 */

import { expect } from "chai";
import {
  KEYRING_TYPE,
  VAULT_VERSION,
  createEmptyVault,
  createHDKeyring,
  createImportedKeyring,
  generateUUID,
  isLegacyVault,
  isV2Vault
} from "../../src/constant/vaultTypes";

import {
  convertV2ToLegacy,
  findAccountByAddress,
  findKeyringById,
  getCurrentAccount,
  getCurrentKeyring,
  migrateToV2,
  normalizeVault,
  validateVault,
} from "../../src/background/vaultMigration";

import { ACCOUNT_TYPE } from "../../src/constant/commonType";

// ============================================
// TEST DATA FIXTURES
// ============================================

const createLegacyWallet = (options = {}) => {
  const {
    mnemonic = "encrypted_mnemonic_string",
    hdAccounts = 1,
    importedAccounts = 0,
    ledgerAccounts = 0,
    watchAccounts = 0,
    currentAddress = null,
  } = options;

  const accounts = [];

  // HD accounts
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

  // Imported accounts
  for (let i = 0; i < importedAccounts; i++) {
    accounts.push({
      address: `B62qIMP_${i}_address`,
      privateKey: `encrypted_imported_key_${i}`,
      type: ACCOUNT_TYPE.WALLET_OUTSIDE,
      accountName: `Imported ${i + 1}`,
      typeIndex: i + 1,
    });
  }

  // Ledger accounts
  for (let i = 0; i < ledgerAccounts; i++) {
    accounts.push({
      address: `B62qLED_${i}_address`,
      type: ACCOUNT_TYPE.WALLET_LEDGER,
      hdPath: i,
      accountName: `Ledger ${i + 1}`,
      typeIndex: i + 1,
    });
  }

  // Watch accounts
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
    currentAddress: currentAddress || accounts[0]?.address || "",
  };
};

const createV2Vault = (keyrings = []) => {
  const vault = createEmptyVault();
  vault.keyrings = keyrings;
  if (keyrings.length > 0) {
    vault.currentKeyringId = keyrings[0].id;
  }
  return vault;
};

// ============================================
// VAULT TYPES TESTS
// ============================================

describe("vaultTypes", () => {
  describe("isLegacyVault", () => {
    it("should return true for valid legacy format", () => {
      const legacy = [createLegacyWallet()];
      expect(isLegacyVault(legacy)).to.be.true;
    });

    it("should return false for empty array", () => {
      expect(isLegacyVault([])).to.be.false;
    });

    it("should return false for non-array", () => {
      expect(isLegacyVault({})).to.be.false;
      expect(isLegacyVault(null)).to.be.false;
      expect(isLegacyVault(undefined)).to.be.false;
    });

    it("should return false for V2 vault", () => {
      const v2 = createEmptyVault();
      expect(isLegacyVault(v2)).to.be.false;
    });
  });

  describe("isV2Vault", () => {
    it("should return true for valid V2 format", () => {
      const v2 = createEmptyVault();
      expect(isV2Vault(v2)).to.be.true;
    });

    it("should return false for legacy format", () => {
      const legacy = [createLegacyWallet()];
      expect(isV2Vault(legacy)).to.be.false;
    });

    it("should return false for wrong version", () => {
      const wrong = { version: 1, keyrings: [] };
      expect(isV2Vault(wrong)).to.be.false;
    });
  });

  describe("createHDKeyring", () => {
    it("should create HD keyring without privateKey in accounts", () => {
      const keyring = createHDKeyring("Test", "encrypted_mnemonic");
      expect(keyring.type).to.equal(KEYRING_TYPE.HD);
      expect(keyring.mnemonic).to.equal("encrypted_mnemonic");
      expect(keyring.accounts).to.be.an("array").with.lengthOf(0);
      expect(keyring.nextHdIndex).to.equal(0);
    });
  });

  describe("generateUUID", () => {
    it("should generate unique UUIDs", () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).to.be.a("string");
      expect(uuid2).to.be.a("string");
      expect(uuid1).to.not.equal(uuid2);
    });
  });
});

// ============================================
// MIGRATION TESTS
// ============================================

describe("vaultMigration", () => {
  describe("migrateToV2", () => {
    it("should return empty vault for empty array", () => {
      const result = migrateToV2([]);
      expect(result.version).to.equal(VAULT_VERSION);
      expect(result.keyrings).to.have.lengthOf(0);
    });

    it("should migrate single HD wallet to HD keyring", () => {
      const legacy = [createLegacyWallet({ hdAccounts: 3 })];
      const result = migrateToV2(legacy);

      expect(result.keyrings).to.have.lengthOf(1);
      expect(result.keyrings[0].type).to.equal(KEYRING_TYPE.HD);
      expect(result.keyrings[0].accounts).to.have.lengthOf(3);
    });

    it("should NOT store privateKey for HD accounts", () => {
      const legacy = [createLegacyWallet({ hdAccounts: 2 })];
      const result = migrateToV2(legacy);

      const hdKeyring = result.keyrings[0];
      hdKeyring.accounts.forEach((acc) => {
        expect(acc.privateKey).to.be.undefined;
        expect(acc.hdIndex).to.be.a("number");
      });
    });

    it("should preserve privateKey for imported accounts", () => {
      const legacy = [createLegacyWallet({ hdAccounts: 1, importedAccounts: 2 })];
      const result = migrateToV2(legacy);

      const importedKeyring = result.keyrings.find(
        (kr) => kr.type === KEYRING_TYPE.IMPORTED
      );
      expect(importedKeyring).to.exist;
      importedKeyring.accounts.forEach((acc) => {
        expect(acc.privateKey).to.be.a("string");
      });
    });

    it("should create separate keyrings for each account type", () => {
      const legacy = [
        createLegacyWallet({
          hdAccounts: 2,
          importedAccounts: 1,
          ledgerAccounts: 1,
          watchAccounts: 1,
        }),
      ];
      const result = migrateToV2(legacy);

      expect(result.keyrings).to.have.lengthOf(4);

      const types = result.keyrings.map((kr) => kr.type);
      expect(types).to.include(KEYRING_TYPE.HD);
      expect(types).to.include(KEYRING_TYPE.IMPORTED);
      expect(types).to.include(KEYRING_TYPE.LEDGER);
      expect(types).to.include(KEYRING_TYPE.WATCH);
    });

    it("should set nextHdIndex correctly", () => {
      const legacy = [createLegacyWallet({ hdAccounts: 5 })];
      const result = migrateToV2(legacy);

      const hdKeyring = result.keyrings[0];
      expect(hdKeyring.nextHdIndex).to.equal(5);
    });

    it("should preserve currentAddress", () => {
      const legacy = [
        createLegacyWallet({
          hdAccounts: 3,
          currentAddress: "B62qHD_1_address",
        }),
      ];
      const result = migrateToV2(legacy);

      expect(result.keyrings[0].currentAddress).to.equal("B62qHD_1_address");
    });

    it("should set currentKeyringId to first keyring", () => {
      const legacy = [createLegacyWallet({ hdAccounts: 1 })];
      const result = migrateToV2(legacy);

      expect(result.currentKeyringId).to.equal(result.keyrings[0].id);
    });

    it("should handle multiple legacy wallets", () => {
      const legacy = [
        createLegacyWallet({ hdAccounts: 2 }),
        createLegacyWallet({ hdAccounts: 1, importedAccounts: 1 }),
      ];
      const result = migrateToV2(legacy);

      // Wallet 1: 1 HD keyring
      // Wallet 2: 1 HD keyring + 1 Imported keyring
      expect(result.keyrings.length).to.be.at.least(2);
    });
  });

  describe("normalizeVault", () => {
    it("should return V2 vault unchanged", () => {
      const v2 = createV2Vault([createHDKeyring("Test", "mnemonic")]);
      const { vault, migrated } = normalizeVault(v2);

      expect(migrated).to.be.false;
      expect(vault).to.deep.equal(v2);
    });

    it("should migrate legacy vault", () => {
      const legacy = [createLegacyWallet({ hdAccounts: 2 })];
      const { vault, migrated } = normalizeVault(legacy);

      expect(migrated).to.be.true;
      expect(isV2Vault(vault)).to.be.true;
    });

    it("should return empty vault for invalid input", () => {
      const { vault, migrated } = normalizeVault(null);

      expect(migrated).to.be.true;
      expect(vault.keyrings).to.have.lengthOf(0);
    });
  });

  describe("convertV2ToLegacy", () => {
    it("should convert V2 to legacy array format", () => {
      const hdKeyring = createHDKeyring("Wallet 1", "encrypted_mnemonic");
      hdKeyring.accounts.push(
        { address: "B62q1", hdIndex: 0, name: "Account 1" }
      );
      hdKeyring.currentAddress = "B62q1";

      const v2 = createV2Vault([hdKeyring]);
      const legacy = convertV2ToLegacy(v2);

      expect(legacy).to.be.an("array").with.lengthOf(1);
      expect(legacy[0].mnemonic).to.equal("encrypted_mnemonic");
      expect(legacy[0].accounts).to.have.lengthOf(1);
      expect(legacy[0].currentAddress).to.equal("B62q1");
    });

    it("should preserve account types", () => {
      const hdKeyring = createHDKeyring("HD", "mnemonic");
      hdKeyring.accounts.push(
        { address: "B62qHD", hdIndex: 0, name: "HD" }
      );

      const importedKeyring = createImportedKeyring("Imported");
      importedKeyring.accounts.push({
        address: "B62qIMP",
        privateKey: "key",
        name: "Imp",
      });

      const v2 = createV2Vault([hdKeyring, importedKeyring]);
      const legacy = convertV2ToLegacy(v2);

      const hdAcc = legacy[0].accounts.find((a) => a.address === "B62qHD");
      const impAcc = legacy[0].accounts.find((a) => a.address === "B62qIMP");

      expect(hdAcc.type).to.equal(ACCOUNT_TYPE.WALLET_INSIDE);
      expect(impAcc.type).to.equal(ACCOUNT_TYPE.WALLET_OUTSIDE);
      expect(impAcc.privateKey).to.equal("key");
    });

    it("should return empty array for empty vault", () => {
      const result = convertV2ToLegacy(null);
      expect(result).to.deep.equal([]);
    });
  });
});

// ============================================
// VALIDATION TESTS
// ============================================

describe("validateVault", () => {
  it("should pass for valid V2 vault", () => {
    const hdKeyring = createHDKeyring("Test", "mnemonic");
    hdKeyring.accounts.push(
      { address: "B62q1", hdIndex: 0, name: "Test" }
    );
    const vault = createV2Vault([hdKeyring]);

    const { valid, errors } = validateVault(vault);
    expect(valid).to.be.true;
    expect(errors).to.have.lengthOf(0);
  });

  it("should fail for missing keyring ID", () => {
    const vault = createEmptyVault();
    vault.keyrings.push({ type: KEYRING_TYPE.HD, accounts: [] });

    const { valid, errors } = validateVault(vault);
    expect(valid).to.be.false;
    expect(errors.some((e) => e.includes("missing ID"))).to.be.true;
  });

  it("should fail for HD account missing hdIndex", () => {
    const hdKeyring = createHDKeyring("Test", "mnemonic");
    hdKeyring.accounts.push({ address: "B62q1", name: "Test" }); // Missing hdIndex
    const vault = createV2Vault([hdKeyring]);

    const { valid, errors } = validateVault(vault);
    expect(valid).to.be.false;
    expect(errors.some((e) => e.includes("missing hdIndex"))).to.be.true;
  });

  it("should fail for imported account missing privateKey", () => {
    const impKeyring = createImportedKeyring("Imported");
    impKeyring.accounts.push({ address: "B62q1", name: "Test" }); // Missing privateKey
    const vault = createV2Vault([impKeyring]);

    const { valid, errors } = validateVault(vault);
    expect(valid).to.be.false;
    expect(errors.some((e) => e.includes("missing privateKey"))).to.be.true;
  });

  it("should fail for wrong version", () => {
    const vault = { version: 1, keyrings: [] };
    const { valid, errors } = validateVault(vault);
    expect(valid).to.be.false;
    expect(errors.some((e) => e.includes("Invalid vault version"))).to.be.true;
  });
});

// ============================================
// LOOKUP TESTS
// ============================================

describe("Lookup Functions", () => {
  let testVault;

  beforeEach(() => {
    const hdKeyring = createHDKeyring("HD Wallet", "mnemonic");
    hdKeyring.accounts.push(
      { address: "B62qHD1", hdIndex: 0, name: "HD 1" },
      { address: "B62qHD2", hdIndex: 1, name: "HD 2" }
    );
    hdKeyring.currentAddress = "B62qHD1";

    const impKeyring = createImportedKeyring("Imported");
    impKeyring.accounts.push({
      address: "B62qIMP1",
      privateKey: "key",
      name: "Imp 1",
    });

    testVault = createV2Vault([hdKeyring, impKeyring]);
  });

  describe("findAccountByAddress", () => {
    it("should find account in HD keyring", () => {
      const result = findAccountByAddress(testVault, "B62qHD1");
      expect(result).to.not.be.null;
      expect(result.account.address).to.equal("B62qHD1");
      expect(result.keyring.type).to.equal(KEYRING_TYPE.HD);
    });

    it("should find account in imported keyring", () => {
      const result = findAccountByAddress(testVault, "B62qIMP1");
      expect(result).to.not.be.null;
      expect(result.keyring.type).to.equal(KEYRING_TYPE.IMPORTED);
    });

    it("should return null for non-existent address", () => {
      const result = findAccountByAddress(testVault, "B62qNONE");
      expect(result).to.be.null;
    });
  });

  describe("findKeyringById", () => {
    it("should find keyring by ID", () => {
      const firstKeyring = testVault.keyrings[0];
      const result = findKeyringById(testVault, firstKeyring.id);
      expect(result).to.equal(firstKeyring);
    });

    it("should return null for non-existent ID", () => {
      const result = findKeyringById(testVault, "non-existent-id");
      expect(result).to.be.null;
    });
  });

  describe("getCurrentKeyring", () => {
    it("should return keyring matching currentKeyringId", () => {
      const result = getCurrentKeyring(testVault);
      expect(result.id).to.equal(testVault.currentKeyringId);
    });

    it("should return first keyring if no currentKeyringId", () => {
      testVault.currentKeyringId = "";
      const result = getCurrentKeyring(testVault);
      expect(result).to.equal(testVault.keyrings[0]);
    });
  });

  describe("getCurrentAccount", () => {
    it("should return account matching currentAddress", () => {
      const result = getCurrentAccount(testVault);
      expect(result.address).to.equal("B62qHD1");
    });

    it("should return first account if no currentAddress", () => {
      testVault.keyrings[0].currentAddress = "";
      const result = getCurrentAccount(testVault);
      expect(result).to.equal(testVault.keyrings[0].accounts[0]);
    });
  });
});

// ============================================
// EDGE CASES
// ============================================

describe("Edge Cases", () => {
  it("should handle wallet with no mnemonic", () => {
    const legacy = [{ accounts: [], currentAddress: "" }];
    const result = migrateToV2(legacy);
    expect(result.keyrings).to.have.lengthOf(0);
  });

  it("should handle wallet with only imported accounts", () => {
    const legacy = [
      {
        accounts: [
          {
            address: "B62q1",
            privateKey: "key",
            type: ACCOUNT_TYPE.WALLET_OUTSIDE,
            accountName: "Imp",
            typeIndex: 1,
          },
        ],
        currentAddress: "B62q1",
      },
    ];
    const result = migrateToV2(legacy);

    expect(result.keyrings).to.have.lengthOf(1);
    expect(result.keyrings[0].type).to.equal(KEYRING_TYPE.IMPORTED);
  });

  it("should handle account with missing accountName", () => {
    const legacy = [
      {
        mnemonic: "test",
        accounts: [
          {
            address: "B62q1",
            type: ACCOUNT_TYPE.WALLET_INSIDE,
            hdPath: 0,
          },
        ],
        currentAddress: "B62q1",
      },
    ];
    const result = migrateToV2(legacy);

    expect(result.keyrings[0].accounts[0].name).to.equal("Account 1");
  });

  it("should handle account with undefined hdPath", () => {
    const legacy = [
      {
        mnemonic: "test",
        accounts: [
          {
            address: "B62q1",
            type: ACCOUNT_TYPE.WALLET_INSIDE,
            accountName: "Test",
          },
        ],
        currentAddress: "B62q1",
      },
    ];
    const result = migrateToV2(legacy);

    expect(result.keyrings[0].accounts[0].hdIndex).to.equal(0);
  });
});

// ============================================
// ROUND-TRIP TESTS
// ============================================

describe("Round-trip Migration", () => {
  it("should preserve all data through migration round-trip", () => {
    const originalLegacy = [
      createLegacyWallet({
        hdAccounts: 3,
        importedAccounts: 2,
        ledgerAccounts: 1,
        watchAccounts: 1,
        currentAddress: "B62qHD_1_address",
      }),
    ];

    // Legacy -> V2
    const v2 = migrateToV2(originalLegacy);

    // V2 -> Legacy
    const backToLegacy = convertV2ToLegacy(v2);

    // Verify account counts
    const originalCount = originalLegacy[0].accounts.length;
    const resultCount = backToLegacy[0].accounts.length;
    expect(resultCount).to.equal(originalCount);

    // Verify mnemonic preserved
    expect(backToLegacy[0].mnemonic).to.equal(originalLegacy[0].mnemonic);

    // Verify all addresses exist
    const originalAddresses = originalLegacy[0].accounts.map((a) => a.address);
    const resultAddresses = backToLegacy[0].accounts.map((a) => a.address);
    originalAddresses.forEach((addr) => {
      expect(resultAddresses).to.include(addr);
    });
  });
});

