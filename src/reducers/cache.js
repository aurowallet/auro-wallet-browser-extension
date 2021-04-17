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
 * 更新隐私协议页面来源
 */
 const UPDATE_PROTOCOL_FROM = "UPDATE_PROTOCOL_FROM"

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

export function updateProtocolFrom(protocolFromRoute) {
    return {
        type: UPDATE_PROTOCOL_FROM,
        protocolFromRoute
    };
}
const initState = {
    fromType: '',
    accountCount: "",
    accountInfo: {},
    welcomeNextRoute: "",
    homeBottomType:"BOTTOM_TYPE_LOADING",
    protocolFromRoute:""
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
        case UPDATE_PROTOCOL_FROM:
            return{
                ...state,
                protocolFromRoute: action.protocolFromRoute,
            }
        default:
            return state;
    }
};

export default cacheReducer;
