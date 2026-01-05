/**
 * Multi-Keyring Vault Types (Optimized)
 * 
 * Design follows MetaMask pattern:
 * - HD Keyring: stores mnemonic only, private keys derived on-demand
 * - Simple Key Pair: stores private keys (only for imported accounts)
 * - Ledger/Watch: no private key storage
 */

/** Vault version constant */
export const VAULT_VERSION = 2;

/** Keyring types (following MetaMask naming) */
export const KEYRING_TYPE = {
  HD: "hd",                    // HD wallet from mnemonic
  IMPORTED: "imported",        // Imported private key
  LEDGER: "ledger",           // Hardware wallet
  WATCH: "watch",             // Watch-only address
};

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
 * Optimized Vault Structure:
 * 
 * {
 *   version: 2,
 *   currentKeyringId: "uuid",
 *   keyrings: [
 *     {
 *       // HD Keyring - private keys derived from mnemonic on-demand
 *       id: "uuid",
 *       type: "hd",
 *       name: "Wallet 1",
 *       mnemonic: "encrypted_mnemonic",
 *       nextHdIndex: 2,  // Next index to derive (tracks how many HD accounts)
 *       accounts: [
 *         { address: "B62q...", hdIndex: 0, name: "Account 1" },
 *         { address: "B62q...", hdIndex: 1, name: "Account 2" },
 *       ],
 *       currentAddress: "B62q..."
 *     },
 *     {
 *       // Imported Keyring - must store private keys
 *       id: "uuid",
 *       type: "imported",
 *       name: "Imported",
 *       accounts: [
 *         { address: "B62q...", privateKey: "encrypted_key", name: "Imported 1" }
 *       ],
 *       currentAddress: "B62q..."
 *     },
 *     {
 *       // Ledger Keyring
 *       id: "uuid",
 *       type: "ledger",
 *       name: "Ledger",
 *       accounts: [
 *         { address: "B62q...", hdIndex: 0, name: "Ledger 1" }
 *       ],
 *       currentAddress: "B62q..."
 *     },
 *     {
 *       // Watch Keyring
 *       id: "uuid",
 *       type: "watch",
 *       name: "Watch",
 *       accounts: [
 *         { address: "B62q...", name: "Watch 1" }
 *       ],
 *       currentAddress: "B62q..."
 *     }
 *   ]
 * }
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
    nextHdIndex: 0,        // Tracks next derivation index
    accounts: [],          // HD accounts don't store private keys
    currentAddress: "",
  };
}

/**
 * Create an Imported keyring (for private key imports)
 * These accounts MUST store encrypted private keys
 * 
 * @param {string} name - Keyring name
 * @returns {Object}
 */
export function createImportedKeyring(name) {
  return {
    id: generateUUID(),
    type: KEYRING_TYPE.IMPORTED,
    name,
    accounts: [],
    currentAddress: "",
  };
}

/**
 * Create a Ledger keyring
 * @param {string} name - Keyring name
 * @returns {Object}
 */
export function createLedgerKeyring(name) {
  return {
    id: generateUUID(),
    type: KEYRING_TYPE.LEDGER,
    name,
    accounts: [],
    currentAddress: "",
  };
}

/**
 * Create a Watch-only keyring
 * @param {string} name - Keyring name
 * @returns {Object}
 */
export function createWatchKeyring(name) {
  return {
    id: generateUUID(),
    type: KEYRING_TYPE.WATCH,
    name,
    accounts: [],
    currentAddress: "",
  };
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
