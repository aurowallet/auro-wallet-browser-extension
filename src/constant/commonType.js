/** error type */
export const ERROR_TYPE = {
  CancelRequest: "Cancel Request",
};

/**
 * ledger connect status
 */
export const LEDGER_STATUS = {
  READY: "READY",
  LEDGER_DISCONNECT: "LEDGER_DISCONNECT",
  LEDGER_CONNECT_APP_NOT_OPEN: "LEDGER_CONNECT_APP_NOT_OPEN",
};

/** ledger page type */
export const LEDGER_PAGE_TYPE = {
  permissionGrant: "permissionGrant",
};

/** account name from page type */
export const ACCOUNT_NAME_FROM_TYPE = {
  OUTSIDE: "OUTSIDE",
  LEDGER: "LEDGER",
  INSIDE: "INSIDE",
  KEYPAIR: "KEYPAIR",
  WATCHMODE: "WATCHMODE",
};

/**
 * security pwd type
 */
export const SEC_FROM_TYPE = {
  /** delete account key */
  SEC_DELETE_ACCOUNT: "SEC_DELETE_ACCOUNT",
  /** show private key */
  SEC_SHOW_PRIVATE_KEY: "SEC_SHOW_PRIVATE_KEY",
  /** show mnemonic */
  SEC_SHOW_MNEMONIC: "SEC_SHOW_MNEMONIC",
};

/** account type */
export const ACCOUNT_TYPE = {
  WALLET_INSIDE: "WALLET_INSIDE",
  WALLET_OUTSIDE: "WALLET_OUTSIDE",
  WALLET_LEDGER: "WALLET_LEDGER",
  WALLET_WATCH: "WALLET_WATCH",
};

/** wallet connect dapp type */
export const WALLET_CONNECT_TYPE = {
  WALLET_APP_CONNECT: "WALLET_APP_CONNECT",
  CONTENT_SCRIPT: "mina-contentscript",
};

export const WALLET_CREATE_TYPE = {
  restore: "restore",
  create: "create",
};
