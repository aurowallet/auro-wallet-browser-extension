/**
 * Vault Migration Service (Optimized)
 * - HD accounts: no private key stored, derived on-demand
 * - Imported accounts: store encrypted private key
 * - Ledger/Watch: no private key
 */

import { ACCOUNT_TYPE } from "../constant/commonType";
import {
  KEYRING_TYPE,
  VAULT_VERSION,
  createEmptyVault,
  createHDKeyring,
  createImportedKeyring,
  createLedgerKeyring,
  createWatchKeyring,
  isLegacyVault,
  isV2Vault,
  sortKeyringsByCreatedAt,
} from "../constant/vaultTypes";

// Migration logging utility - disable in production
const MIGRATION_LOG_ENABLED = process.env.NODE_ENV === "development";
const migrationLog = {
  info: (msg) => MIGRATION_LOG_ENABLED && console.log("[Migration]", msg),
  warn: (msg) => console.warn("[Migration]", msg),
  error: (msg, err) => console.error("[Migration]", msg, err?.message || ""),
};

/**
 * Migrate legacy v1 data to optimized v2 vault structure
 *
 * Key changes for multi-wallet support:
 * - Each HD wallet becomes its own keyring (with unique mnemonic)
 * - All imported accounts merged into ONE "Imported Wallet" keyring
 * - All ledger accounts merged into ONE "Hardware Wallet" keyring
 * - All watch accounts merged into ONE "Watch" keyring
 * - Keyrings sorted by creation time
 *
 * @param {Array} legacyData - Legacy keyring data array
 * @returns {Object} V2 vault structure
 */
export function migrateToV2(legacyData) {
  migrationLog.info("Starting migration from legacy to V2");

  if (!Array.isArray(legacyData) || legacyData.length === 0) {
    migrationLog.warn("Empty or invalid legacy data, returning empty vault");
    return createEmptyVault();
  }

  migrationLog.info(
    "Found " + legacyData.length + " legacy wallet(s) to migrate"
  );
  const vault = createEmptyVault();

  // Single keyrings for imported/ledger/watch (shared across all legacy wallets)
  let sharedImportedKeyring = null;
  let sharedLedgerKeyring = null;
  let sharedWatchKeyring = null;
  let baseTime = Date.now();

  legacyData.forEach((legacyWallet, walletIndex) => {
    const result = migrateLegacyWallet(
      legacyWallet,
      walletIndex,
      baseTime,
      sharedImportedKeyring,
      sharedLedgerKeyring,
      sharedWatchKeyring
    );

    // Add HD keyring (each wallet has its own)
    if (result.hdKeyring) {
      vault.keyrings.push(result.hdKeyring);
      // Set first HD keyring as current
      if (!vault.currentKeyringId) {
        vault.currentKeyringId = result.hdKeyring.id;
      }
    }

    // Update shared keyrings references
    if (result.importedKeyring) {
      if (!sharedImportedKeyring) {
        sharedImportedKeyring = result.importedKeyring;
        vault.keyrings.push(sharedImportedKeyring);
      }
    }
    if (result.ledgerKeyring) {
      if (!sharedLedgerKeyring) {
        sharedLedgerKeyring = result.ledgerKeyring;
        vault.keyrings.push(sharedLedgerKeyring);
      }
    }
    if (result.watchKeyring) {
      if (!sharedWatchKeyring) {
        sharedWatchKeyring = result.watchKeyring;
        vault.keyrings.push(sharedWatchKeyring);
      }
    }
  });

  // Sort keyrings by creation time
  vault.keyrings = sortKeyringsByCreatedAt(vault.keyrings);

  migrationLog.info(
    "Migration complete: " + vault.keyrings.length + " keyring(s)"
  );
  return vault;
}

/**
 * Migrate a single legacy wallet to keyrings
 *
 * Multi-wallet migration strategy:
 * - HD accounts: create a NEW keyring for this wallet's mnemonic
 * - Imported/Ledger/Watch: add to SHARED keyring (passed in)
 *
 * @param {Object} legacyWallet - Legacy wallet object
 * @param {number} walletIndex - Index in the original array
 * @param {number} baseTime - Base timestamp for ordering
 * @param {Object|null} sharedImportedKeyring - Existing imported keyring
 * @param {Object|null} sharedLedgerKeyring - Existing ledger keyring
 * @param {Object|null} sharedWatchKeyring - Existing watch keyring
 * @returns {Object} { hdKeyring, importedKeyring, ledgerKeyring, watchKeyring }
 */
function migrateLegacyWallet(
  legacyWallet,
  walletIndex,
  baseTime,
  sharedImportedKeyring,
  sharedLedgerKeyring,
  sharedWatchKeyring
) {
  const walletName = `Wallet ${walletIndex + 1}`;
  let result = {
    hdKeyring: null,
    importedKeyring: sharedImportedKeyring,
    ledgerKeyring: sharedLedgerKeyring,
    watchKeyring: sharedWatchKeyring,
  };

  // Group accounts by type
  const hdAccounts = [];
  const importedAccounts = [];
  const ledgerAccounts = [];
  const watchAccounts = [];

  (legacyWallet.accounts || []).forEach((acc) => {
    switch (acc.type) {
      case ACCOUNT_TYPE.WALLET_INSIDE:
        hdAccounts.push(acc);
        break;
      case ACCOUNT_TYPE.WALLET_OUTSIDE:
        importedAccounts.push(acc);
        break;
      case ACCOUNT_TYPE.WALLET_LEDGER:
        ledgerAccounts.push(acc);
        break;
      case ACCOUNT_TYPE.WALLET_WATCH:
        watchAccounts.push(acc);
        break;
    }
  });

  if (legacyWallet.mnemonic && hdAccounts.length > 0) {
    const hdKeyring = createHDKeyring(walletName, legacyWallet.mnemonic);
    hdKeyring.createdAt = baseTime + walletIndex;

    let maxHdIndex = -1;
    hdAccounts.forEach((acc) => {
      const hdIndex = acc.hdPath ?? 0;
      maxHdIndex = Math.max(maxHdIndex, hdIndex);

      hdKeyring.accounts.push({
        address: acc.address,
        hdIndex: hdIndex,
        name: acc.accountName || `Account ${hdIndex + 1}`,
      });
    });

    hdKeyring.nextHdIndex = maxHdIndex + 1;
    hdKeyring.currentAddress =
      legacyWallet.currentAddress || hdAccounts[0]?.address || "";
    result.hdKeyring = hdKeyring;
  }

  if (importedAccounts.length > 0) {
    if (!result.importedKeyring) {
      result.importedKeyring = createImportedKeyring();
      result.importedKeyring.createdAt = baseTime + 1000; // After first HD wallet
    }

    importedAccounts.forEach((acc) => {
      result.importedKeyring.accounts.push({
        address: acc.address,
        privateKey: acc.privateKey,
        name: acc.accountName || "Imported",
      });
    });

    if (!result.importedKeyring.currentAddress) {
      result.importedKeyring.currentAddress = importedAccounts[0].address;
    }
  }

  // Add ledger accounts to SHARED ledger keyring
  if (ledgerAccounts.length > 0) {
    if (!result.ledgerKeyring) {
      result.ledgerKeyring = createLedgerKeyring();
      result.ledgerKeyring.createdAt = baseTime + 2000;
    }

    ledgerAccounts.forEach((acc) => {
      result.ledgerKeyring.accounts.push({
        address: acc.address,
        hdIndex: acc.hdPath ?? 0,
        name: acc.accountName || "Ledger",
      });
    });

    if (!result.ledgerKeyring.currentAddress) {
      result.ledgerKeyring.currentAddress = ledgerAccounts[0].address;
    }
  }

  // Add watch accounts to SHARED watch keyring
  if (watchAccounts.length > 0) {
    if (!result.watchKeyring) {
      result.watchKeyring = createWatchKeyring("Watch");
      result.watchKeyring.createdAt = baseTime + 3000;
    }

    watchAccounts.forEach((acc) => {
      result.watchKeyring.accounts.push({
        address: acc.address,
        name: acc.accountName || "Watch",
      });
    });

    if (!result.watchKeyring.currentAddress) {
      result.watchKeyring.currentAddress = watchAccounts[0].address;
    }
  }

  return result;
}

/**
 * Convert v2 vault back to legacy format for backward compatibility
 * Used by memStore for UI compatibility
 *
 * @param {Object} vault - V2 vault structure
 * @returns {Array} Legacy format data
 */
export function convertV2ToLegacy(vault) {
  if (!vault || !vault.keyrings || vault.keyrings.length === 0) {
    return [];
  }

  // Group keyrings back into a single wallet structure for legacy compatibility
  const legacyWallet = {
    accounts: [],
    currentAddress: "",
    mnemonic: "",
  };

  let typeIndexCounters = {
    [ACCOUNT_TYPE.WALLET_INSIDE]: 0,
    [ACCOUNT_TYPE.WALLET_OUTSIDE]: 0,
    [ACCOUNT_TYPE.WALLET_LEDGER]: 0,
    [ACCOUNT_TYPE.WALLET_WATCH]: 0,
  };

  vault.keyrings.forEach((keyring) => {
    // Get mnemonic from first HD keyring
    if (
      keyring.type === KEYRING_TYPE.HD &&
      keyring.mnemonic &&
      !legacyWallet.mnemonic
    ) {
      legacyWallet.mnemonic = keyring.mnemonic;
    }

    keyring.accounts.forEach((account) => {
      const accountType = keyringTypeToAccountType(keyring.type);
      typeIndexCounters[accountType]++;

      const legacyAccount = {
        address: account.address,
        type: accountType,
        accountName: account.name,
        typeIndex: typeIndexCounters[accountType],
      };

      // Add hdPath for HD and Ledger accounts
      if (typeof account.hdIndex === "number") {
        legacyAccount.hdPath = account.hdIndex;
      }

      // Add privateKey only for imported accounts
      if (account.privateKey) {
        legacyAccount.privateKey = account.privateKey;
      }

      legacyWallet.accounts.push(legacyAccount);
    });

    // Set current address from current keyring
    if (vault.currentKeyringId === keyring.id && keyring.currentAddress) {
      legacyWallet.currentAddress = keyring.currentAddress;
    }
  });

  // Fallback for current address
  if (!legacyWallet.currentAddress && legacyWallet.accounts.length > 0) {
    legacyWallet.currentAddress = legacyWallet.accounts[0].address;
  }

  return [legacyWallet];
}

/**
 * Map keyring type to legacy account type
 */
function keyringTypeToAccountType(keyringType) {
  switch (keyringType) {
    case KEYRING_TYPE.HD:
      return ACCOUNT_TYPE.WALLET_INSIDE;
    case KEYRING_TYPE.IMPORTED:
      return ACCOUNT_TYPE.WALLET_OUTSIDE;
    case KEYRING_TYPE.LEDGER:
      return ACCOUNT_TYPE.WALLET_LEDGER;
    case KEYRING_TYPE.WATCH:
      return ACCOUNT_TYPE.WALLET_WATCH;
    default:
      return ACCOUNT_TYPE.WALLET_INSIDE;
  }
}

/**
 * Detect vault format and return normalized v2 structure
 * @param {any} data - Decrypted vault data (could be v1 or v2)
 * @returns {{ vault: Object, migrated: boolean }} V2 vault and migration flag
 */
export function normalizeVault(data) {
  if (isV2Vault(data)) {
    return { vault: data, migrated: false };
  }

  if (isLegacyVault(data)) {
    return { vault: migrateToV2(data), migrated: true };
  }

  console.warn("[vaultMigration] Unknown vault format, creating empty vault");
  return { vault: createEmptyVault(), migrated: true };
}

/**
 * Find account by address across all keyrings
 * @param {Object} vault - V2 vault structure
 * @param {string} address - Account address to find
 * @returns {{ keyring: Object, account: Object } | null}
 */
export function findAccountByAddress(vault, address) {
  for (const keyring of vault.keyrings) {
    const account = keyring.accounts.find((acc) => acc.address === address);
    if (account) {
      return { keyring, account };
    }
  }
  return null;
}

/**
 * Find keyring by ID
 * @param {Object} vault - V2 vault structure
 * @param {string} keyringId - Keyring ID to find
 * @returns {Object | null}
 */
export function findKeyringById(vault, keyringId) {
  return vault.keyrings.find((kr) => kr.id === keyringId) || null;
}

/**
 * Get current keyring from vault
 * @param {Object} vault - V2 vault structure
 * @returns {Object | null}
 */
export function getCurrentKeyring(vault) {
  if (!vault.currentKeyringId) {
    return vault.keyrings[0] || null;
  }
  return findKeyringById(vault, vault.currentKeyringId);
}

/**
 * Get current account from vault
 * @param {Object} vault - V2 vault structure
 * @returns {Object | null}
 */
export function getCurrentAccount(vault) {
  const keyring = getCurrentKeyring(vault);
  if (!keyring) return null;

  if (!keyring.currentAddress) {
    return keyring.accounts[0] || null;
  }

  return (
    keyring.accounts.find((acc) => acc.address === keyring.currentAddress) ||
    keyring.accounts[0] ||
    null
  );
}

/**
 * Validate vault structure integrity
 * @param {Object} vault - V2 vault structure
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateVault(vault) {
  const errors = [];

  if (!vault || typeof vault !== "object") {
    errors.push("Vault is not an object");
    return { valid: false, errors };
  }

  if (vault.version !== VAULT_VERSION) {
    errors.push(`Invalid vault version: ${vault.version}`);
  }

  if (!Array.isArray(vault.keyrings)) {
    errors.push("Keyrings is not an array");
    return { valid: false, errors };
  }

  vault.keyrings.forEach((keyring, kIndex) => {
    if (!keyring.id) {
      errors.push(`Keyring ${kIndex} missing ID`);
    }
    if (!keyring.type) {
      errors.push(`Keyring ${kIndex} missing type`);
    }
    if (!Array.isArray(keyring.accounts)) {
      errors.push(`Keyring ${kIndex} accounts is not an array`);
    } else {
      keyring.accounts.forEach((account, aIndex) => {
        if (!account.address) {
          errors.push(`Keyring ${kIndex} Account ${aIndex} missing address`);
        }
        // HD accounts need hdIndex
        if (
          keyring.type === KEYRING_TYPE.HD &&
          typeof account.hdIndex !== "number"
        ) {
          errors.push(`Keyring ${kIndex} Account ${aIndex} missing hdIndex`);
        }
        // Imported accounts need privateKey
        if (keyring.type === KEYRING_TYPE.IMPORTED && !account.privateKey) {
          errors.push(`Keyring ${kIndex} Account ${aIndex} missing privateKey`);
        }
      });
    }
  });

  return { valid: errors.length === 0, errors };
}
