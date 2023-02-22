import { cointypes, TX_LIST_LENGTH } from "../../config";
import { amountDecimals } from "../utils/utils";

const CHANGE_ACCOUNT_TX_HISTORY = "CHANGE_ACCOUNT_TX_HISTORY"

const UPDATE_CURRENT_ACCOUNT = "UPDATE_CURRENT_ACCOUNT"

const INIT_CURRENT_ACCOUNT = "INIT_CURRENT_ACCOUNT"

const UPDATE_NET_ACCOUNT = "UPDATE_NET_ACCOUNT"


const UPDATE_NET_HOME_REFRESH = "UPDATE_NET_HOME_REFRESH"


const UPDATE_STAKING_DATA = "UPDATE_STAKING_DATA"

const UPDATE_ACCOUNT_LIST_BALANCE = "UPDATE_ACCOUNT_LIST_BALANCE"

export function updateAccountTx(txList, txPendingList,zkAppList,zkPendingList) {
    return {
        type: CHANGE_ACCOUNT_TX_HISTORY,
        txList,
        txPendingList,
        zkAppList,
        zkPendingList
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
export function updateNetAccount(account, isCache) {
    return {
        type: UPDATE_NET_ACCOUNT,
        account,
        isCache
    };
}

export function updateShouldRequest(shouldRefresh, isSilent) {
    return {
        type: UPDATE_NET_HOME_REFRESH,
        shouldRefresh,
        isSilent
    };
}


export function updateStakingRefresh(shouldRefresh) {
    return {
        type: UPDATE_STAKING_DATA,
        shouldRefresh,
    };
}

export function updateAccountList(list) {
    return {
        type: UPDATE_ACCOUNT_LIST_BALANCE,
        list
    };
}

export const ACCOUNT_BALANCE_CACHE_STATE = {
    INIT_STATE: "INIT_STATE",
    USING_CACHE: "USING_CACHE",
    NEW_STATE: "NEW_STATE"
}

const initState = {
    txList: [],
    currentAccount: {},
    netAccount: {},
    balance: "0.0000",
    nonce: "",
    shouldRefresh: false,
    homeBottomType: "",
    isAccountCache: ACCOUNT_BALANCE_CACHE_STATE.INIT_STATE,
    stakingLoadingRefresh: false,
    accountBalanceMap:{}
};

function pendingTx(txList) {
    let newList = []
    for (let index = 0; index < txList.length; index++) {
        const detail = txList[index];
        newList.push({
            "id": detail.id,
            "hash": detail.hash,
            "kind": detail.kind,
            "dateTime": detail.time,
            "from": detail.from,
            "to": detail.to,
            "amount": detail.amount,
            "fee": detail.fee,
            "nonce": detail.nonce,
            "memo": detail.memo,
            "status": "PENDING",
            timestamp : new Date(detail.time).getTime()
        })
    }
    return newList
}

function getZkOtherAccount (zkApp){
    let accountUpdates = zkApp.zkappCommand.accountUpdates
    if(Array.isArray(accountUpdates) && accountUpdates.length > 0){
        return accountUpdates[0]?.body?.publicKey
    }
    return ""
}
function zkAppFormat(zkAppList,isPending=false){
    let newList = []
    for (let index = 0;  index < zkAppList.length; index++) {
        const zkApp = zkAppList[index];
        let status = isPending ?  "PENDING":zkApp.failureReason ? "failed":"applied"
        newList.push({
            "id": "",
            "hash": zkApp.hash,
            "kind": "ZKAPP",
            "dateTime": zkApp.dateTime||"",
            "from": zkApp.zkappCommand.feePayer.body.publicKey,
            "to": getZkOtherAccount(zkApp),
            "amount": "0",
            "fee": zkApp.zkappCommand.feePayer.body.fee,
            "nonce": zkApp.zkappCommand.feePayer.body.nonce,
            "memo": zkApp.zkappCommand.memo,
            "status":  status,
            type:"zkApp",
            body:zkApp,
            timestamp : isPending ? "": new Date(zkApp.dateTime).getTime()
        })
    }
    return newList
}
function commonHistoryFormat(list){
    return  list.map((item)=>{
        item.timestamp = new Date(item.dateTime).getTime()
        return item
    })
}
const accountInfo = (state = initState, action) => {
    switch (action.type) {
        case CHANGE_ACCOUNT_TX_HISTORY:
            let txList = action.txList
            let txPendingList = action.txPendingList || []
            let zkAppList = action.zkAppList || []
            let zkPendingList = action.zkPendingList || []

            txPendingList = txPendingList.reverse()
            txPendingList = pendingTx(txPendingList)
            zkAppList = zkAppFormat(zkAppList)
            zkPendingList = zkAppFormat(zkPendingList,true)
            
            txList = commonHistoryFormat(txList)

            const commonList = [...txList,...zkAppList]
            commonList.sort((a,b)=>b.timestamp-a.timestamp)

            const commonPendingList = [...txPendingList,...zkPendingList]
            commonPendingList.sort((a,b)=>b.nonce-a.nonce)
            let newList = [...commonPendingList,...commonList]
            if (newList.length > 0) {
                newList.push({
                    showExplorer: true
                })
            }
            return {
                ...state,
                txList: newList
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
                shouldRefresh: true,
            }
        case INIT_CURRENT_ACCOUNT:
            return {
                ...state,
                currentAccount: action.account,
            }
        case UPDATE_NET_ACCOUNT:
            let netAccount = action.account
            let balance = amountDecimals(netAccount.balance?.total||0, cointypes.decimals)
            let nonce = netAccount.nonce
            let inferredNonce = netAccount.inferredNonce

            let isAccountCache
            let cacheState = state.isAccountCache
            if (action.isCache && cacheState !== ACCOUNT_BALANCE_CACHE_STATE.NEW_STATE) {
                isAccountCache = ACCOUNT_BALANCE_CACHE_STATE.USING_CACHE
            } else {
                isAccountCache = ACCOUNT_BALANCE_CACHE_STATE.NEW_STATE
            }
            return {
                ...state,
                netAccount: netAccount,
                balance,
                nonce,
                inferredNonce,
                isAccountCache,
            }
        case UPDATE_NET_HOME_REFRESH:
            let isSilent = action.isSilent
            let shouldRefresh = action.shouldRefresh
            if (isSilent) {
                return {
                    ...state,
                    shouldRefresh: shouldRefresh,
                }
            }
            let newState = {}
            if (shouldRefresh) {
                newState = {
                    netAccount: {},
                    balance: "0.0000",
                    nonce: "",
                    txList: [],
                }
            }
            return {
                ...state,
                shouldRefresh: shouldRefresh,
                ...newState
            }
        case UPDATE_STAKING_DATA:
            return {
                ...state,
                stakingLoadingRefresh: action.shouldRefresh
            }
        case UPDATE_ACCOUNT_LIST_BALANCE:
            return {
                ...state,
                accountBalanceMap: action.list
            }
        default:
            return state;
    }
};

export default accountInfo;
