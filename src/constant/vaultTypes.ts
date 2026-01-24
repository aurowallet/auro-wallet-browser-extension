/**
 * Multi-Keyring Vault Types (Optimized)
 *
 * - HD Keyring: stores mnemonic only, private keys derived on-demand
 * - Imported Keyring: single group for all imported private key accounts
 * - Ledger Keyring: single group for all hardware wallet accounts
 * - Watch Keyring: single group for all watch-only addresses
 */

// ============ Constants ============

export const VAULT_VERSION = 2;

export const KEYRING_TYPE = {
  HD: "hd",
  IMPORTED: "imported",
  LEDGER: "ledger",
  WATCH: "watch",
} as const;

export type KeyringType = (typeof KEYRING_TYPE)[keyof typeof KEYRING_TYPE];

export const KEYRING_DEFAULT_NAME = {
  HD: "Wallet",
  IMPORTED: "Imported Wallet",
  LEDGER: "Hardware Wallet",
  WATCH: "Watch",
} as const;

// ============ Interfaces ============

export interface HDAccount {
  address: string;
  hdIndex: number;
  name: string;
}

export interface ImportedAccount {
  address: string;
  privateKey: string;
  name: string;
}

export interface LedgerAccount {
  address: string;
  hdIndex: number;
  name: string;
}

export interface WatchAccount {
  address: string;
  name: string;
}

export interface BaseKeyring {
  id: string;
  type: KeyringType;
  name: string;
  createdAt: number;
  currentAddress: string;
}

export interface HDKeyring extends BaseKeyring {
  type: typeof KEYRING_TYPE.HD;
  mnemonic: string;
  nextHdIndex: number;
  accounts: HDAccount[];
}

export interface ImportedKeyring extends BaseKeyring {
  type: typeof KEYRING_TYPE.IMPORTED;
  accounts: ImportedAccount[];
}

export interface LedgerKeyring extends BaseKeyring {
  type: typeof KEYRING_TYPE.LEDGER;
  accounts: LedgerAccount[];
}

export interface WatchKeyring extends BaseKeyring {
  type: typeof KEYRING_TYPE.WATCH;
  accounts: WatchAccount[];
}

export type Keyring = HDKeyring | ImportedKeyring | LedgerKeyring | WatchKeyring;

export interface Vault {
  version: number;
  currentKeyringId: string;
  keyrings: Keyring[];
  nextWalletIndex: number;
}

// ============ Functions ============

export function getDefaultHDWalletName(index: number): string {
  return `${KEYRING_DEFAULT_NAME.HD} ${index}`;
}

export function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function createEmptyVault(): Vault {
  return {
    version: VAULT_VERSION,
    currentKeyringId: "",
    keyrings: [],
    nextWalletIndex: 1,
  };
}

export function createHDKeyring(name: string, encryptedMnemonic: string): HDKeyring {
  return {
    id: generateUUID(),
    type: KEYRING_TYPE.HD,
    name,
    mnemonic: encryptedMnemonic,
    nextHdIndex: 0,
    createdAt: Date.now(),
    accounts: [],
    currentAddress: "",
  };
}

export function createImportedKeyring(
  name: string = KEYRING_DEFAULT_NAME.IMPORTED
): ImportedKeyring {
  return {
    id: generateUUID(),
    type: KEYRING_TYPE.IMPORTED,
    name,
    createdAt: Date.now(),
    accounts: [],
    currentAddress: "",
  };
}

export function createLedgerKeyring(name: string = "Hardware Wallet"): LedgerKeyring {
  return {
    id: generateUUID(),
    type: KEYRING_TYPE.LEDGER,
    name,
    createdAt: Date.now(),
    accounts: [],
    currentAddress: "",
  };
}

export function createWatchKeyring(name: string = "Watch"): WatchKeyring {
  return {
    id: generateUUID(),
    type: KEYRING_TYPE.WATCH,
    name,
    createdAt: Date.now(),
    accounts: [],
    currentAddress: "",
  };
}

export function sortKeyringsByCreatedAt(keyrings: Keyring[]): Keyring[] {
  return [...keyrings].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}

export function countHDKeyrings(vault: Vault): number {
  return vault.keyrings.filter((kr) => kr.type === KEYRING_TYPE.HD).length;
}

export function isLegacyVault(data: unknown): boolean {
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

export function isV2Vault(data: unknown): data is Vault {
  return (
    data !== null &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    (data as Vault).version === VAULT_VERSION &&
    Array.isArray((data as Vault).keyrings)
  );
}
