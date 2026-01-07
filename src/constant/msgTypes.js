export const WALLET_CREATE_PWD = "WALLET_CREATE_PWD";

export const WALLET_NEW_HD_ACCOUNT = "WALLET_NEW_HD_ACCOUNT";


export const WALLET_GET_CURRENT_ACCOUNT = "WALLET_GET_CURRENT_ACCOUNT";


export const WALLET_SET_UNLOCKED_STATUS = "WALLET_SET_UNLOCKED_STATUS";


export const WALLET_APP_SUBMIT_PWD = "WALLET_APP_SUBMIT_PWD";

/**
 * Get all accounts
 */
export const WALLET_GET_ALL_ACCOUNT = "WALLET_GET_ALL_ACCOUNT";


/**
 * create Account
 */
export const WALLET_CREATE_HD_ACCOUNT = "WALLET_CREATE_HD_ACCOUNT";



/**
 * import account
 */
export const WALLET_IMPORT_HD_ACCOUNT = "WALLET_IMPORT_HD_ACCOUNT";

/**
 * Change current account
 */
export const WALLET_CHANGE_CURRENT_ACCOUNT = "WALLET_CHANGE_CURRENT_ACCOUNT";

/**
 * change username
 */
export const WALLET_CHANGE_ACCOUNT_NAME = "WALLET_CHANGE_ACCOUNT_NAME";

/**
 * delete account
 */
export const WALLET_CHANGE_DELETE_ACCOUNT = "WALLET_CHANGE_DELETE_ACCOUNT";

/**
 * check password
 */
export const WALLET_CHECKOUT_PASSWORD = "WALLET_CHECKOUT_PASSWORD";


/**
 * get mnemonic
 */
export const WALLET_GET_MNE = "WALLET_GET_MNE";


/**
 * get private key
 */
export const WALLET_GET_PRIVATE_KEY = "WALLET_GET_PRIVATE_KEY";


/**
 * 更改安全密码
 */
export const WALLET_CHANGE_SEC_PASSWORD = "WALLET_CHANGE_SEC_PASSWORD"


/**
 * sign fields
 */
export const WALLET_SEND_FIELDS_MESSAGE_TRANSACTION = "WALLET_SEND_FIELDS_MESSAGE_TRANSACTION"

/**
 * Query stake status
 */
export const WALLET_CHECK_TX_STATUS = "WALLET_CHECK_TX_STATUS"

/**
 * Import ledger wallet
 */
export const WALLET_IMPORT_LEDGER = "WALLET_IMPORT_LEDGER"

/**
* Import keystore wallet
*/
export const WALLET_IMPORT_KEY_STORE = "WALLET_IMPORT_KEY_STORE"



/**
 * generate mnemonic
 */
export const WALLET_GET_CREATE_MNEMONIC = "WALLET_GET_CREATE_MNEMONIC"


/**
 * Update last active time
 */
export const WALLET_RESET_LAST_ACTIVE_TIME = "WALLET_RESET_LAST_ACTIVE_TIME"


export const WALLET_UPDATE_LOCK_TIME = "WALLET_UPDATE_LOCK_TIME"

export const WALLET_GET_LOCK_TIME = "WALLET_GET_LOCK_TIME"


// ====================================================================================bottom back to popup

/**
 * Send a message to the transfer page
 */
export const FROM_BACK_TO_RECORD = "FROM_BACK_TO_RECORD"

/**
 * Transfer results
 */
export const TX_SUCCESS = "TX_SUCCESS"

/**
 * go to lock page
 */
export const SET_LOCK = "SET_LOCK"


/**
 * LEDGER connection succeeded
 * @type {string}
 */
export const LEDGER_CONNECTED_SUCCESSFULLY = 'LEDGER_CONNECTED_SUCCESSFULLY';


/**
 * delete watch account
 */
 export const WALLET_DELETE_WATCH_ACCOUNT = "WALLET_DELETE_WATCH_ACCOUNT";

/**
 * clear account
 */
 export const RESET_WALLET = "RESET_WALLET"


 /**
 * get dapp sign params
 */
export const GET_SIGN_PARAMS_BY_ID = "GET_SIGN_PARAMS_BY_ID"


 /**
 * get dapp sign params
 */
export const GET_SIGN_PARAMS = "GET_SIGN_PARAMS"

 /**
 * get dapp approve params
 */
 export const GET_APPROVE_PARAMS = "GET_APPROVE_PARAMS"


/**
 * get dapp approve account
 */
export const DAPP_GET_CURRENT_ACCOUNT_CONNECT_STATUS = "DAPP_GET_CURRENT_ACCOUNT_CONNECT_STATUS"


/**
 * dapp send transaction
 */
export const DAPP_ACTION_SEND_TRANSACTION = "DAPP_ACTION_SEND_TRANSACTION"


export const DAPP_ACTION_SIGN_MESSAGE = "DAPP_ACTION_SIGN_MESSAGE"


/**
 * dapp get account 
 */
export const DAPP_ACTION_GET_ACCOUNT = "DAPP_ACTION_GET_ACCOUNT"

/**
 * dapp close window 
 */
export const DAPP_ACTION_CLOSE_WINDOW = "DAPP_ACTION_CLOSE_WINDOW"

/**
 * disconnect web site
 */
export const DAPP_DISCONNECT_SITE = "DAPP_DISCONNECT_SITE"


/**
 * delete account all connect   / when delete account
 */
export const DAPP_DELETE_ACCOUNT_CONNECT_HIS = "DAPP_DELETE_ACCOUNT_CONNECT_HIS"


/**
 * when change current account  update dapp connecting account
 */
export const DAPP_CHANGE_CONNECTING_ADDRESS = "DAPP_CHANGE_CONNECTING_ADDRESS"




/**
 * when dapp close window send message to fronted
 */
export const DAPP_CLOSE_POPUP_WINDOW = "DAPP_CLOSE_POPUP_WINDOW"


/**
 * when change current network  update dapp connecting status
 */
 export const DAPP_CHANGE_NETWORK = "DAPP_CHANGE_NETWORK"


 export const DAPP_CONNECTION_LIST = "DAPP_CONNECTION_LIST"


 /** Berkeley qa net sign   */
export const QA_SIGN_TRANSACTION = "QA_SIGN_TRANSACTION"

/** get app lock status */
export const GET_WALLET_LOCK_STATUS = "GET_WALLET_LOCK_STATUS"


/** get ledger account number */
export const GET_LEDGER_ACCOUNT_NUMBER = "GET_LEDGER_ACCOUNT_NUMBER"
/**
 * switch chain
 */
export const DAPP_ACTION_SWITCH_CHAIN = "DAPP_ACTION_SWITCH_CHAIN"

/** cancel all pending zk tx */
export const DAPP_ACTION_CANCEL_ALL = "DAPP_ACTION_CANCEL_ALL"

/** DAPP createNullifier event */
export const DAPP_ACTION_CREATE_NULLIFIER = "DAPP_ACTION_CREATE_NULLIFIER"

/** extension createNullifier event */
export const WALLET_SEND_NULLIFIER = "WALLET_SEND_NULLIFIER"


export const POPUP_ACTIONS = {
    INIT_APPROVE_LIST : "INIT_APPROVE_LIST",
    POPUP_NOTIFICATION: "POPUP_NOTIFICATION",
    GET_ALL_PENDING_ZK:"POPUP_GET_ALL_PENDING_ZK"
}


export const WORKER_ACTIONS = {
    BUILD_TOKEN_SEND:"WORKER_BUILD_TOKEN_SEND",
    APPROVE:"WORKER_APPROVE",
    SIGN_ZK:"WORKER_SIGN_ZK",

    SET_LOCK:"WORKER_SET_LOCK"
}

export const ACCOUNT_ACTIONS = {
    REFRESH_CURRENT_ACCOUNT:"REFRESH_CURRENT_ACCOUNT"
}


export const CredentialMsg = {
    ID_LIST: "Credential_id_list",
    target_credential:"target_credential",
    remove_credential_detail:"remove_credential_detail",
    store_credential:"store_credential",
    get_credentials:"get_credentials",
}
export const DAPP_ACTION_STORE_CREDENTIAL = "DAPP_ACTION_STORE_CREDENTIAL"
export const DAPP_ACTION_REQUEST_PRESENTATION = "DAPP_ACTION_REQUEST_PRESENTATION"

// ============================================
// Multi-Wallet Message Types
// ============================================

/** Get all keyrings (wallet groups) sorted by creation time */
export const WALLET_GET_KEYRINGS_LIST = "WALLET_GET_KEYRINGS_LIST"

/** Add a new HD wallet with its own mnemonic */
export const WALLET_ADD_HD_KEYRING = "WALLET_ADD_HD_KEYRING"

/** Rename a keyring (wallet group) */
export const WALLET_RENAME_KEYRING = "WALLET_RENAME_KEYRING"

/** Get mnemonic for a specific HD keyring */
export const WALLET_GET_KEYRING_MNEMONIC = "WALLET_GET_KEYRING_MNEMONIC"

/** Delete a keyring (wallet group) */
export const WALLET_DELETE_KEYRING = "WALLET_DELETE_KEYRING"

/** Add account to a specific HD keyring */
export const WALLET_ADD_ACCOUNT_TO_KEYRING = "WALLET_ADD_ACCOUNT_TO_KEYRING"

/** Get current vault version (v1 or v2) */
export const WALLET_GET_VAULT_VERSION = "WALLET_GET_VAULT_VERSION"

/** Try to upgrade vault from v1 to v2 */
export const WALLET_TRY_UPGRADE_VAULT = "WALLET_TRY_UPGRADE_VAULT"