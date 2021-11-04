import { cointypes, TX_LIST_LENGTH } from "../../config";
import { amountDecimals } from "../utils/utils";

const CHANGE_ACCOUNT_TX_HISTORY = "CHANGE_ACCOUNT_TX_HISTORY"

const UPDATE_CURRENT_ACCOUNT = "UPDATE_CURRENT_ACCOUNT"

const INIT_CURRENT_ACCOUNT = "INIT_CURRENT_ACCOUNT"

const UPDATE_NET_ACCOUNT = "UPDATE_NET_ACCOUNT"


const UPDATE_NET_HOME_REFRESH = "UPDATE_NET_HOME_REFRESH"

/**
 *  首页底部的type
 */
 const SET_HOME_BOTTOM_TYPE = "SET_HOME_BOTTOM_TYPE"

 export function setBottomType(bottomType) {
    return {
        type: SET_HOME_BOTTOM_TYPE,
        bottomType
    };
}

export function updateAccountTx(txList,txPendingList) {
    return {
        type: CHANGE_ACCOUNT_TX_HISTORY,
        txList,
        txPendingList
    };
}

export function updateCurrentAccount(account) {
    return {
        type: UPDATE_CURRENT_ACCOUNT,
        account
    };
}

export function initCurrentAccount(account) {
    return {
        type: INIT_CURRENT_ACCOUNT,
        account
    };
}
export function updateNetAccount(account) {
    return {
        type: UPDATE_NET_ACCOUNT,
        account
    };
}

export function updateShouldRequest(shouldRefresh) {
    return {
        type: UPDATE_NET_HOME_REFRESH,
        shouldRefresh
    };
}
const initState = {
    txList: [],
    currentAccount: {},
    netAccount: {},
    balance: "0.0000",
    nonce: "",
    shouldRefresh:true,
    homeBottomType:""
};

function pendingTx(txList){
    let newList = []
    for (let index = 0; index < txList.length; index++) {
        const detail = txList[index];
        newList.push({
            "id":detail.id,
            "hash":detail.hash,
            "type":detail.kind,
            "time":detail.time,
            "sender":detail.from,
            "receiver":detail.to,
            "amount":detail.amount,
            "fee":detail.fee,
            "nonce":detail.nonce,
            "memo":detail.memo,
            "status":"PENDING",
        })
    }
    return newList
}

function resultTx(txList){
    let newList = []
    for (let index = 0; index < txList.length; index++) {
        const detail = txList[index];
        newList.push({
            ...detail,
            "status":detail.status && detail.status.toUpperCase(),
        })
    }
    return newList
}

const accountInfo = (state = initState, action) => {
    switch (action.type) {
        case CHANGE_ACCOUNT_TX_HISTORY:
            let txList = action.txList
            let txPendingList = action.txPendingList||[]
            if(txList.length>=TX_LIST_LENGTH){
                txList.push({
                    showExplorer:true
                })
            }
            txPendingList = txPendingList.reverse()
            txPendingList = pendingTx(txPendingList)
            let newList = [...txPendingList,...txList]
            return {
                ...state,
                txList:newList
            };
        case UPDATE_CURRENT_ACCOUNT:
            let account = action.account
            return {
                ...state,
                currentAccount: account,
                balance: "0.0000",
                txList: [],
                netAccount: {},
                nonce: "",
                shouldRefresh:true,
                homeBottomType:"BOTTOM_TYPE_LOADING"
            }
        case INIT_CURRENT_ACCOUNT:
            return {
                ...state,
                currentAccount: action.account,
            }
        case UPDATE_NET_ACCOUNT:
            let netAccount = action.account
            let balance = amountDecimals(netAccount.balance.total, cointypes.decimals)
            let nonce = netAccount.nonce
            let inferredNonce = netAccount.inferredNonce
            return {
                ...state,
                netAccount: netAccount,
                balance,
                nonce,
                inferredNonce,
            }
        case UPDATE_NET_HOME_REFRESH:
            let newState={}
            if(action.shouldRefresh){
                newState={
                    netAccount: {},
                    balance: "0.0000",
                    nonce: "",
                    txList:[]
                }
            }
            return {
                ...state,
                shouldRefresh:action.shouldRefresh,
               ...newState
            }
        case SET_HOME_BOTTOM_TYPE:
            let bottomType = action.bottomType
            return {
                ...state,
                homeBottomType: bottomType
            }
        default:
            return state;
    }
};

export default accountInfo;
