/**
 * Common type definitions for Auro Wallet
 */

// ============ Helper Type ============
type ValueOf<T> = T[keyof T];

// ============ Error Types ============

export const ERROR_TYPE = {
  CancelRequest: "Cancel Request",
} as const;

export type ErrorType = ValueOf<typeof ERROR_TYPE>;

// ============ Ledger Status ============

export const LEDGER_STATUS = {
  READY: "READY",
  LEDGER_DISCONNECT: "LEDGER_DISCONNECT",
  LEDGER_CONNECT_APP_NOT_OPEN: "LEDGER_CONNECT_APP_NOT_OPEN",
} as const;

export type LedgerStatusType = ValueOf<typeof LEDGER_STATUS>;

// ============ Ledger Page Type ============

export const LEDGER_PAGE_TYPE = {
  permissionGrant: "permissionGrant",
} as const;

export type LedgerPageType = ValueOf<typeof LEDGER_PAGE_TYPE>;

// ============ Account Name From Type ============

export const ACCOUNT_NAME_FROM_TYPE = {
  OUTSIDE: "OUTSIDE",
  LEDGER: "LEDGER",
  INSIDE: "INSIDE",
  KEYPAIR: "KEYPAIR",
  WATCHMODE: "WATCHMODE",
} as const;

export type AccountNameFromType = ValueOf<typeof ACCOUNT_NAME_FROM_TYPE>;

// ============ Security Password Type ============

export const SEC_FROM_TYPE = {
  /** delete account key */
  SEC_DELETE_ACCOUNT: "SEC_DELETE_ACCOUNT",
  /** show private key */
  SEC_SHOW_PRIVATE_KEY: "SEC_SHOW_PRIVATE_KEY",
  /** show mnemonic */
  SEC_SHOW_MNEMONIC: "SEC_SHOW_MNEMONIC",
} as const;

export type SecFromType = ValueOf<typeof SEC_FROM_TYPE>;

// ============ Account Type ============

export const ACCOUNT_TYPE = {
  WALLET_INSIDE: "WALLET_INSIDE",
  WALLET_OUTSIDE: "WALLET_OUTSIDE",
  WALLET_LEDGER: "WALLET_LEDGER",
  WALLET_WATCH: "WALLET_WATCH",
} as const;

export type AccountType = ValueOf<typeof ACCOUNT_TYPE>;

// ============ Wallet Connect Type ============

export const WALLET_CONNECT_TYPE = {
  WALLET_APP_CONNECT: "WALLET_APP_CONNECT",
  CONTENT_SCRIPT: "mina-contentscript",
} as const;

export type WalletConnectType = ValueOf<typeof WALLET_CONNECT_TYPE>;

// ============ Wallet Create Type ============

export const WALLET_CREATE_TYPE = {
  restore: "restore",
  create: "create",
  ledger: "ledger",
} as const;

export type WalletCreateType = ValueOf<typeof WALLET_CREATE_TYPE>;

// ============ Popup Channel Keys ============

export const POPUP_CHANNEL_KEYS = {
  popup: "aurowalletPopup",
  welcome: "aurowalletWelcome",
} as const;

export type PopupChannelKey = ValueOf<typeof POPUP_CHANNEL_KEYS>;
