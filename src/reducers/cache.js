/**
 * Change wallet name
 */
const CHANGE_ACCOUNT_NAME = "CHANGE_ACCOUNT_NAME"

/**
 * Enter the user details interface
 */
const SET_ACCOUNT_INFO = "SET_ACCOUNT_INFO"

/**
 *  Update the next level routing of the welcome screen
 */
const SET_WELCOME_NEXT_ROUTE = "SET_WELCOME_NEXT_ROUTE"


/**
 * Update Account Name page source
 */
const UPDATE_ACCOUNT_TYPE_FROM = "UPDATE_ACCOUNT_TYPE_FROM"



/**
 * Update the basic information
 */
const UPDATE_EXTENSION_BASE_INFO = "UPDATE_EXTENSION_BASE_INFO"


const UPDATE_ADDRESS_DETAIL = "UPDATE_ADDRESS_DETAIL"

const UPDATE_ADDRESS_BOOK_FROM = "UPDATE_ADDRESS_BOOK_FROM"


const UPDATE_CURRENT_PRICE = "UPDATE_CURRENT_PRICE"

const UPDATE_DAPP_ACCOUNT_LIST = "UPDATE_DAPP_ACCOUNT_LIST"


const UPDATE_ACCOUNT_BALANCE_LIST = "UPDATE_ACCOUNT_BALANCE_LIST"

export const UPDATE_DAPP_CURRENT_OPEN_WINDOW = "UPDATE_DAPP_CURRENT_OPEN_WINDOW"

export function updateCurrentPrice(price) {
    return {
        type: UPDATE_CURRENT_PRICE,
        price
    };
}


export function updateAddressDetail(addressDetail) {
    return {
        type: UPDATE_ADDRESS_DETAIL,
        addressDetail
    };
}

export function updateAddressBookFrom(from) {
    return {
        type: UPDATE_ADDRESS_BOOK_FROM,
        from
    }
}
/**
 * update wallet info
 */
export function updateExtensionBaseInfo(data) {
    return {
        type: UPDATE_EXTENSION_BASE_INFO,
        data
    };
}


/**
 * update account name 
 */
export function setChangeAccountName(data) {
    return {
        type: CHANGE_ACCOUNT_NAME,
        data
    };
}

export function setAccountInfo(info) {
    return {
        type: SET_ACCOUNT_INFO,
        info
    };
}
/**
 * update welcome next route 
 * @param {*} info 
 */
export function setWelcomeNextRoute(nextRoute) {
    return {
        type: SET_WELCOME_NEXT_ROUTE,
        nextRoute
    };
}

export function updateAccoutType(fromType) {
    return {
        type: UPDATE_ACCOUNT_TYPE_FROM,
        fromType
    };
}



export function updateDappSelectList(selectList) {
    return {
        type: UPDATE_DAPP_ACCOUNT_LIST,
        selectList
    }
}

/**
 * update dapp opened window
 * @param {*} dappWindow
 * @returns
 */
export function updateDAppOpenWindow(dappWindow) {
    return {
        type: UPDATE_DAPP_CURRENT_OPEN_WINDOW,
        dappWindow
    }
}


export function updateAccountBalanceList(accountDetail) {
    return {
        type: UPDATE_ACCOUNT_BALANCE_LIST,
        accountDetail
    }
}

const initState = {
    fromType: '',
    accountCount: "",
    accountInfo: {},
    welcomeNextRoute: "",

    changelog: "",
    changelog_app: "",
    followus: [],
    gitReponame: "",
    gitReponame_app: "",
    privacy_policy: "",
    privacy_policy_cn: "",
    staking_guide: "",
    staking_guide_cn: "",
    terms_and_contions: "",
    terms_and_contions_cn: "",

    addressDetail: {},
    addressBookFrom: "",
    currentPrice: "",
    dappAccountList: [],


    dappWindow: {},
    accountBalanceList: {},
};

const cacheReducer = (state = initState, action) => {
    switch (action.type) {
        case CHANGE_ACCOUNT_NAME:
            let data = action.data
            return {
                ...state,
                accountCount: data.accountCount,
            };
        case SET_ACCOUNT_INFO:
            let accountInfo = action.info
            return {
                ...state,
                accountInfo
            };
        case SET_WELCOME_NEXT_ROUTE:
            let nextRoute = action.nextRoute
            return {
                ...state,
                welcomeNextRoute: nextRoute
            }
        case UPDATE_ACCOUNT_TYPE_FROM:
            return {
                ...state,
                fromType: action.fromType,
            }
        case UPDATE_EXTENSION_BASE_INFO:
            return {
                ...state,

                changelog: action.data.changelog,
                changelog_app: action.data.changelog_app,
                followus: action.data.followus,
                gitReponame: action.data.gitReponame,
                gitReponame_app: action.data.gitReponame_app,
                privacy_policy: action.data.privacy_policy,
                privacy_policy_cn: action.data.privacy_policy_cn,
                staking_guide: action.data.staking_guide,
                staking_guide_cn: action.data.staking_guide_cn,
                terms_and_contions: action.data.terms_and_contions,
                terms_and_contions_cn: action.data.terms_and_contions_cn,
                graphql_api:action.data.graphql_api,
            }
        case UPDATE_ADDRESS_DETAIL:
            return {
                ...state,
                addressDetail: action.addressDetail
            };
        case UPDATE_ADDRESS_BOOK_FROM:
            return {
                ...state,
                addressBookFrom: action.from
            };

        case UPDATE_CURRENT_PRICE:
            return {
                ...state,
                currentPrice: action.price
            };
        case UPDATE_DAPP_ACCOUNT_LIST:
            return {
                ...state,
                dappAccountList: action.selectList,
            }
        case UPDATE_DAPP_CURRENT_OPEN_WINDOW:
            return {
                ...state,
                dappWindow: action.dappWindow,
            }
        case UPDATE_ACCOUNT_BALANCE_LIST:
            let accountBalanceDetail = action.accountDetail
            let accountList = { ...state.accountBalanceList }
            let keys = Object.keys(accountBalanceDetail)
            for (let index = 0; index < keys.length; index++) {
                const key = keys[index];
                const detail = accountBalanceDetail[key]
                accountList[detail.publicKey] = detail
            }
            return {
                ...state,
                accountBalanceList: accountList
            }
        default:
            return state;
    }
};

export default cacheReducer;
