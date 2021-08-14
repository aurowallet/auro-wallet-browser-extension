/**
 * 更改钱包名称
 */
const CHANGE_ACCOUNT_NAME = "CHANGE_ACCOUNT_NAME"

/**
 * 进入用户详情界面
 */
const SET_ACCOUNT_INFO = "SET_ACCOUNT_INFO"

/**
 *  更新欢迎界面的下一层路由
 */
const SET_WELCOME_NEXT_ROUTE = "SET_WELCOME_NEXT_ROUTE"


/**
 *  首页底部的type
 */
 const SET_HOME_BOTTOM_TYPE = "SET_HOME_BOTTOM_TYPE"

/**
 * 更新账户名称页面来源
 */
 const UPDATE_ACCOUNT_TYPE_FROM = "UPDATE_ACCOUNT_TYPE_FROM"



/**
 * 更新一些插件的基础信息
 */
 const UPDATE_EXTENSION_BASE_INFO = "UPDATE_EXTENSION_BASE_INFO"


 const UPDATE_ADDRESS_DETAIL = "UPDATE_ADDRESS_DETAIL"

 const UPDATE_ADDRESS_BOOK_FROM = "UPDATE_ADDRESS_BOOK_FROM"


 const UPDATE_CURRENT_PRICE = "UPDATE_CURRENT_PRICE"

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
 * 更改钱包名称
 */
 export function updateExtensionBaseInfo(data) {
    return {
        type: UPDATE_EXTENSION_BASE_INFO,
        data
    };
}


/**
 * 更改钱包名称
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
 * 更新欢迎界面的下一层路由
 * @param {*} info 
 */
export function setWelcomeNextRoute(nextRoute) {
    return {
        type: SET_WELCOME_NEXT_ROUTE,
        nextRoute
    };
}
export function setBottomType(bottomType) {
    return {
        type: SET_HOME_BOTTOM_TYPE,
        bottomType
    };
}

export function updateAccoutType(fromType) {
    return {
        type: UPDATE_ACCOUNT_TYPE_FROM,
        fromType
    };
}

const initState = {
    fromType: '',
    accountCount: "",
    accountInfo: {},
    welcomeNextRoute: "",
    homeBottomType:"BOTTOM_TYPE_LOADING",

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
    currentPrice:""
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
        case SET_HOME_BOTTOM_TYPE:
            let bottomType = action.bottomType
            return {
                ...state,
                homeBottomType: bottomType
            }
        case UPDATE_ACCOUNT_TYPE_FROM:
            return{
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
        default:
            return state;
    }
};

export default cacheReducer;
