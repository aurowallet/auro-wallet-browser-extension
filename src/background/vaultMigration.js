/**
 * Vault Migration Service (Optimized)
 * 
 * Follows MetaMask pattern:
 * - HD accounts: no private key stored, derived on-demand
 * - Imported accounts: store encrypted private key
 * - Ledger/Watch: no private key
 */

import { ACCOUNT_TYPE } from "../constant/commonType";
import {
  VAULT_VERSION,
  KEYRING_TYPE,
  isLegacyVault,
  isV2Vault,
  createEmptyVault,
  createHDKeyring,
  createImportedKeyring,
  createLedgerKeyring,
  createWatchKeyring,
} from "../constant/vaultTypes";

// Migration logging utility - disable in production
const MIGRATION_LOG_ENABLED = process.env.NODE_ENV === 'development';
const migrationLog = {
  info: (msg) => MIGRATION_LOG_ENABLED && console.log('[Migration]', msg),
  warn: (msg) => console.warn('[Migration]', msg),
  error: (msg, err) => console.error('[Migration]', msg, err?.message || ''),
};

/**
 * Migrate legacy v1 data to optimized v2 vault structure
 * 
 * Key change: HD accounts no longer store private keys
 * Private keys are derived on-demand from mnemonic
 * 
 * @param {Array} legacyData - Legacy keyring data array
 * @returns {Object} V2 vault structure
 */
export function migrateToV2(legacyData) {
  migrationLog.info('Starting migration from legacy to V2');
  
  if (!Array.isArray(legacyData) || legacyData.length === 0) {
    migrationLog.warn('Empty or invalid legacy data, returning empty vault');
    return createEmptyVault();
  }

  migrationLog.info('Found ' + legacyData.length + ' legacy wallet(s) to migrate');
  const vault = createEmptyVault();

  legacyData.forEach((legacyWallet, walletIndex) => {
    const keyrings = migrateLegacyWallet(legacyWallet, walletIndex);
    vault.keyrings.push(...keyrings);

    // Set first keyring as current
    if (walletIndex === 0 && keyrings.length > 0) {
      vault.currentKeyringId = keyrings[0].id;
    }
  });

  migrationLog.info('Migration complete: ' + vault.keyrings.length + ' keyring(s)');
  return vault;
}

/**
 * Migrate a single legacy wallet to multiple keyrings by account type
 * 
 * Legacy structure mixed all account types in one wallet.
 * New structure separates them into typed keyrings.
 * 
 * @param {Object} legacyWallet - Legacy wallet object
 * @param {number} walletIndex - Index in the original array
 * @returns {Object[]} Array of keyrings
 */
function migrateLegacyWallet(legacyWallet, walletIndex) {
  const keyrings = [];
  const walletName = `Wallet ${walletIndex + 1}`;

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

  // Create HD Keyring (if mnemonic exists)
  if (legacyWallet.mnemonic && hdAccounts.length > 0) {
    const hdKeyring = createHDKeyring(walletName, legacyWallet.mnemonic);
    
    // Find max hdIndex to set nextHdIndex
    let maxHdIndex = -1;
    hdAccounts.forEach((acc) => {
      const hdIndex = acc.hdPath ?? 0;
      maxHdIndex = Math.max(maxHdIndex, hdIndex);
      
      // HD accounts don't store private keys (derived on-demand)
      hdKeyring.accounts.push({
        address: acc.address,
        hdIndex: hdIndex,
        name: acc.accountName || `Account ${hdIndex + 1}`,
      });
    });
    
    hdKeyring.nextHdIndex = maxHdIndex + 1;
    hdKeyring.currentAddress = legacyWallet.currentAddress || hdAccounts[0]?.address || "";
    keyrings.push(hdKeyring);
  }

  // Create Imported Keyring (if imported accounts exist)
  if (importedAccounts.length > 0) {
    const importedKeyring = createImportedKeyring(`${walletName} - Imported`);
    
    importedAccounts.forEach((acc) => {
      // Imported accounts MUST store private keys
      importedKeyring.accounts.push({
        address: acc.address,
        privateKey: acc.privateKey,
        name: acc.accountName || "Imported",
      });
    });
    
    importedKeyring.currentAddress = importedAccounts[0].address;
    keyrings.push(importedKeyring);
  }

  // Create Ledger Keyring (if ledger accounts exist)
  if (ledgerAccounts.length > 0) {
    const ledgerKeyring = createLedgerKeyring(`${walletName} - Ledger`);
    
    ledgerAccounts.forEach((acc) => {
      ledgerKeyring.accounts.push({
        address: acc.address,
        hdIndex: acc.hdPath ?? 0,
        name: acc.accountName || "Ledger",
      });
    });
    
    ledgerKeyring.currentAddress = ledgerAccounts[0].address;
    keyrings.push(ledgerKeyring);
  }

  // Create Watch Keyring (if watch accounts exist)
  if (watchAccounts.length > 0) {
    const watchKeyring = createWatchKeyring(`${walletName} - Watch`);
    
    watchAccounts.forEach((acc) => {
      watchKeyring.accounts.push({
        address: acc.address,
        name: acc.accountName || "Watch",
      });
    });
    
    watchKeyring.currentAddress = watchAccounts[0].address;
    keyrings.push(watchKeyring);
  }

  return keyrings;
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
    if (keyring.type === KEYRING_TYPE.HD && keyring.mnemonic && !legacyWallet.mnemonic) {
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

  return keyring.accounts.find((acc) => acc.address === keyring.currentAddress) 
    || keyring.accounts[0] 
    || null;
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
        if (keyring.type === KEYRING_TYPE.HD && typeof account.hdIndex !== "number") {
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

