/**
 * Multi-Keyring Vault Types (Optimized)
 * 
 * - HD Keyring: stores mnemonic only, private keys derived on-demand
 *   - Each HD wallet is independent with its own mnemonic
 * - Imported Keyring: single group for all imported private key accounts
 * - Ledger Keyring: single group for all hardware wallet accounts
 * - Watch Keyring: single group for all watch-only addresses
 * 
 * Sorting: keyrings are sorted by createdAt timestamp
 */

/** Vault version constant */
export const VAULT_VERSION = 2;

export const KEYRING_TYPE = {
  HD: "hd",                    // HD wallet from mnemonic
  IMPORTED: "imported",        // Imported private key
  LEDGER: "ledger",           // Hardware wallet
  WATCH: "watch",             // Watch-only address
};

/** Default keyring names (for non-i18n contexts like migration) */
export const KEYRING_DEFAULT_NAME = {
  HD: "Wallet",                // Will be appended with index, e.g., "Wallet 1"
  IMPORTED: "Imported Wallet",
  LEDGER: "Hardware Wallet",
  WATCH: "Watch",
};

/**
 * Get default HD wallet name with index
 * @param {number} index - Wallet index (1-based)
 * @returns {string}
 */
export function getDefaultHDWalletName(index) {
  return `${KEYRING_DEFAULT_NAME.HD} ${index}`;
}

/**
 * Generate a UUID v4
 * @returns {string} UUID string
 */
export function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Optimized Vault Structure (Multi-Wallet):
 * 
 * {
 *   version: 2,
 *   currentKeyringId: "uuid",
 *   keyrings: [
 *     {
 *       // HD Keyring - each is an independent wallet with its own mnemonic
 *       id: "uuid",
 *       type: "hd",
 *       name: "Wallet 1",
 *       mnemonic: "encrypted_mnemonic",
 *       nextHdIndex: 2,
 *       createdAt: 1704067200000,  // Timestamp for sorting
 *       accounts: [
 *         { address: "B62q...", hdIndex: 0, name: "Account 1" },
 *         { address: "B62q...", hdIndex: 1, name: "Account 2" },
 *       ],
 *       currentAddress: "B62q..."
 *     },
 *     {
 *       // Another HD Keyring (different mnemonic)
 *       id: "uuid2",
 *       type: "hd",
 *       name: "Wallet 2",
 *       mnemonic: "another_encrypted_mnemonic",
 *       nextHdIndex: 1,
 *       createdAt: 1704153600000,
 *       accounts: [...],
 *       currentAddress: "B62q..."
 *     },
 *     {
 *       // Imported Keyring - SINGLE group for all imported accounts
 *       id: "uuid",
 *       type: "imported",
 *       name: "Imported Wallet",
 *       createdAt: 1704240000000,
 *       accounts: [
 *         { address: "B62q...", privateKey: "encrypted_key", name: "Imported 1" }
 *       ],
 *       currentAddress: "B62q..."
 *     },
 *     {
 *       // Ledger Keyring - SINGLE group for all hardware accounts
 *       id: "uuid",
 *       type: "ledger",
 *       name: "Hardware Wallet",
 *       createdAt: 1704326400000,
 *       accounts: [
 *         { address: "B62q...", hdIndex: 0, name: "Ledger 1" }
 *       ],
 *       currentAddress: "B62q..."
 *     }
 *   ]
 * }
 * 
 * Sorting: keyrings are displayed in order of createdAt timestamp
 * - Each HD wallet is its own group (can have multiple HD keyrings)
 * - Only ONE imported keyring for all private key imports
 * - Only ONE ledger keyring for all hardware wallet accounts
 */

/**
 * Create a new empty vault structure
 * @returns {Object}
 */
export function createEmptyVault() {
  return {
    version: VAULT_VERSION,
    currentKeyringId: "",
    keyrings: [],
    nextWalletIndex: 1,  // Tracks next default wallet name number (never decreases)
  };
}

/**
 * Create a new HD keyring (mnemonic-based)
 * Private keys are NOT stored - derived on-demand from mnemonic
 * 
 * @param {string} name - Keyring name
 * @param {string} encryptedMnemonic - Encrypted mnemonic
 * @returns {Object}
 */
export function createHDKeyring(name, encryptedMnemonic) {
  return {
    id: generateUUID(),
    type: KEYRING_TYPE.HD,
    name,
    mnemonic: encryptedMnemonic,
    nextHdIndex: 0,
    createdAt: Date.now(),  // Timestamp for sorting
    accounts: [],
    currentAddress: "",
  };
}

/**
 * Create an Imported keyring (for private key imports)
 * These accounts MUST store encrypted private keys
 * Note: There should be only ONE imported keyring in the vault
 * 
 * @param {string} name - Keyring name
 * @returns {Object}
 */
export function createImportedKeyring(name = KEYRING_DEFAULT_NAME.IMPORTED) {
  return {
    id: generateUUID(),
    type: KEYRING_TYPE.IMPORTED,
    name,
    createdAt: Date.now(),
    accounts: [],
    currentAddress: "",
  };
}

/**
 * Create a Ledger keyring
 * Note: There should be only ONE ledger keyring in the vault
 * @param {string} name - Keyring name
 * @returns {Object}
 */
export function createLedgerKeyring(name = "Hardware Wallet") {
  return {
    id: generateUUID(),
    type: KEYRING_TYPE.LEDGER,
    name,
    createdAt: Date.now(),
    accounts: [],
    currentAddress: "",
  };
}

/**
 * Create a Watch-only keyring
 * @param {string} name - Keyring name
 * @returns {Object}
 */
export function createWatchKeyring(name = "Watch") {
  return {
    id: generateUUID(),
    type: KEYRING_TYPE.WATCH,
    name,
    createdAt: Date.now(),
    accounts: [],
    currentAddress: "",
  };
}

/**
 * Sort keyrings by creation time
 * @param {Array} keyrings - Array of keyrings
 * @returns {Array} Sorted keyrings
 */
export function sortKeyringsByCreatedAt(keyrings) {
  return [...keyrings].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}

/**
 * Count HD keyrings in vault
 * @param {Object} vault - V2 vault structure
 * @returns {number} Number of HD keyrings
 */
export function countHDKeyrings(vault) {
  return vault.keyrings.filter(kr => kr.type === KEYRING_TYPE.HD).length;
}

/**
 * Check if data is legacy v1 format
 * @param {any} data - Decrypted vault data
 * @returns {boolean}
 */
export function isLegacyVault(data) {
  if (!Array.isArray(data)) return false;
  if (data.length === 0) return false;
  const firstItem = data[0];
  return (
    firstItem &&
    typeof firstItem === "object" &&
    ("mnemonic" in firstItem || "accounts" in firstItem) &&
    "currentAddress" in firstItem
  );
}

/**
 * Check if data is v2 vault format
 * @param {any} data - Decrypted vault data
 * @returns {boolean}
 */
export function isV2Vault(data) {
  return (
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    data.version === VAULT_VERSION &&
    Array.isArray(data.keyrings)
  );
}
