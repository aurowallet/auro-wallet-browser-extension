export const WALLET_CREATE_PWD = "WALLET_CREATE_PWD";

export const WALLET_NEW_HD_ACCOUNT = "WALLET_NEW_HD_ACCOUNT";


export const WALLET_GET_CURRENT_ACCOUNT = "WALLET_GET_CURRENT_ACCOUNT";


export const WALLET_SET_UNLOCKED_STATUS = "WALLET_SET_UNLOCKED_STATUS";


export const WALLET_APP_SUBMIT_PWD = "WALLET_APP_SUBMIT_PWD";

/**
 * 获取所有账户
 */
export const WALLET_GET_ALL_ACCOUNT = "WALLET_GET_ALL_ACCOUNT";


/**
 * 创建账户
 */
export const WALLET_CREATE_HD_ACCOUNT = "WALLET_CREATE_HD_ACCOUNT";



/**
 * 导入账户
 */
export const WALLET_IMPORT_HD_ACCOUNT = "WALLET_IMPORT_HD_ACCOUNT";

/**
 * 更改当前账户
 */
export const WALLET_CHANGE_CURRENT_ACCOUNT = "WALLET_CHANGE_CURRENT_ACCOUNT";

/**
 * 更改用户名
 */
export const WALLET_CHANGE_ACCOUNT_NAME = "WALLET_CHANGE_ACCOUNT_NAME";

/**
 * 删除账户
 */
export const WALLET_CHANGE_DELETE_ACCOUNT = "WALLET_CHANGE_DELETE_ACCOUNT";

/**
 * 校验密码
 */
export const WALLET_CHECKOUT_PASSWORD = "WALLET_CHECKOUT_PASSWORD";


/**
 * 获取助记词
 */
export const WALLET_GET_MNE = "WALLET_GET_MNE";


/**
 * 获取私钥
 */
export const WALLET_GET_PRIVATE_KEY = "WALLET_GET_PRIVATE_KEY";


/**
 * 更改安全密码
 */
export const WALLET_CHANGE_SEC_PASSWORD = "WALLET_CHANGE_SEC_PASSWORD"


/**
 * 获取当前的私钥
 */
export const WALLET_GET_CURRENT_PRIVATE_KEY = "WALLET_GET_CURRENT_PRIVATE_KEY"


/**
 * 发送交易
 */
export const WALLET_SEND_TRANSTRACTION = "WALLET_SEND_TRANSTRACTION"

/**
 * send message transaction
 */
export const WALLET_SEND_MESSAGE_TRANSTRACTION = "WALLET_SEND_MESSAGE_TRANSTRACTION"

/**
 * 发送质押交易
 */
export const WALLET_SEND_STAKE_TRANSTRACTION = "WALLET_SEND_STAKE_TRANSTRACTION"

/**
 * 查询质押状态
 */
export const WALLET_CHECK_TX_STATUS = "WALLET_CHECK_TX_STATUS"

/**
 * 导入ledger钱包
 */
export const WALLET_IMPORT_LEDGER = "WALLET_IMPORT_LEDGER"

/**
 * 导入watch mode钱包
 */
export const WALLET_IMPORT_WATCH_MODE = "WALLET_IMPORT_WATCH_MODE"


/**
* 导入keystore钱包
*/
export const WALLET_IMPORT_KEY_STORE = "WALLET_IMPORT_KEY_STORE"



/**
 * 后台生成助记词
 */
export const WALLET_GET_CREATE_MNEMONIC = "WALLET_GET_CREATE_MNEMONIC"


/**
 * 更新最后活跃时间
 */
export const WALLET_RESET_LAST_ACTIVE_TIME = "WALLET_RESET_LAST_ACTIVE_TIME"


export const WALLET_UPDATE_LOCK_TIME = "WALLET_UPDATE_LOCK_TIME"

export const WALLET_GET_LOCK_TIME = "WALLET_GET_LOCK_TIME"


// ====================================================================================bottom back to popup

/**
 * 后台向转账页发送消息
 */
export const FROM_BACK_TO_RECORD = "FROM_BACK_TO_RECORD"

/**
 * 转账有结果
 */
export const TX_SUCCESS = "TX_SUCCESS"

/**
 * 进入锁定页面
 */
export const SET_LOCK = "SET_LOCK"


/**
 * LEDGER 连接成功
 * @type {string}
 */
export const LEDGER_CONNECTED_SUCCESSFULLY = 'LEDGER_CONNECTED_SUCCESSFULLY';


/**
 * 删除观察账户
 */
 export const WALLET_DELETE_WATCH_ACCOUNT = "WALLET_DELETE_WATCH_ACCOUNT";

/**
 * 清除账户
 */
 export const RESET_WALLET = "RESET_WALLET"


 /**
 * get dapp sign params
 */
export const GET_SIGN_PARAMS = "GET_SIGN_PARAMS"


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
 * get current web connect status
 */
export const DAPP_GET_CONNECT_STATUS = "DAPP_GET_CONNECT_STATUS"

/**
 * disconnect web site
 */
export const DAPP_DISCONNECT_SITE = "DAPP_DISCONNECT_SITE"


/**
 * delect account all connect   / when delete account
 */
export const DAPP_DELETE_ACCOUNT_CONNECT_HIS = "DAPP_DELETE_ACCOUNT_CONNECT_HIS"


/**
 * when change current account  update dapp connecting account
 */
export const DAPP_CHANGE_CONNECTING_ADDRESS = "DAPP_CHANGE_CONNECTING_ADDRESS"


/**
 * get current open window
 */
export const DAPP_GET_CURRENT_OPEN_WINDOW = "DAPP_GET_CURRENT_OPEN_WINDOW"


/**
 * when dapp close window send message to fronted
 */
export const DAPP_CLOSE_POPUP_WINDOW = "DAPP_CLOSE_POPUP_WINDOW"


/**
 * when change current network  update dapp connecting status
 */
 export const DAPP_CHANGE_NETWORK = "DAPP_CHANGE_NETWORK"


/** Berkeley qa net sign   */
export const QA_SIGN_TRANSTRACTION = "QA_SIGN_TRANSTRACTION"
 export const DAPP_CONNECTION_LIST = "DAPP_CONNECTION_LIST"
