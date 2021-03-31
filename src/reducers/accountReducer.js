import { cointypes, TX_LIST_LENGTH } from "../../config";
import { amountDecimals } from "../utils/utils";

const CHANGE_ACCOUNT_TX_HISTORY = "CHANGE_ACCOUNT_TX_HISTORY"
const UPDATE_MNE = "UPDATE_MNE"
const UPDATE_CURRENT_ACCOUNT = "UPDATE_CURRENT_ACCOUNT"

const UPDATE_NET_ACCOUNT = "UPDATE_NET_ACCOUNT"


const UPDATE_NET_HOME_REFRESH = "UPDATE_NET_HOME_REFRESH"

export function updateAccountTx(txList,txPendingList) {
    return {
        type: CHANGE_ACCOUNT_TX_HISTORY,
        txList,
        txPendingList
    };
}

export function updateMne(mnemonic) {
    return {
        type: UPDATE_MNE,
        mnemonic
    };
}

export function updateCurrentAccount(account) {
    return {
        type: UPDATE_CURRENT_ACCOUNT,
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
    mnemonic: "",
    currentAccount: {},
    netAccount: {},
    balance: "0.0000",
    nonce: "",
    shouldRefresh:true
};

function pendingTx(txList){
    let newList = []
    for (let index = 0; index < txList.length; index++) {
        const detail = txList[index];
        newList.push({
            "id":detail.id,
            "hash":detail.hash,
            "type":detail.kind,
            "time":"Nonce: "+ detail.nonce,
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
            // txList = resultTx(txList)
            return {
                ...state,
                txList:[...txPendingList,...txList]
            };
        case UPDATE_MNE:
            let mnemonic = action.mnemonic
            return {
                ...state,
                mnemonic
            };
        case UPDATE_CURRENT_ACCOUNT:
            let account = action.account
            return {
                ...state,
                currentAccount: account,
                shouldRefresh:true
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
        default:
            return state;
    }
};

export default accountInfo;
