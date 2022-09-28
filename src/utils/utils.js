import BigNumber from "bignumber.js";
import validUrl from 'valid-url';
import { cointypes } from '../../config';
import { getLocal } from "../background/localStorage";
import { NET_WORK_CONFIG } from "../constant/storageKey";
import { DAPP_CHANGE_NETWORK } from "../constant/types";
import { NET_CONFIG_NOT_SUPPORT_STAKING, NET_CONFIG_NOT_SUPPORT_TX_HISTORY } from "../constant/walletType";
import { sendMsg } from "./commonMsg";
/**
 * address slice
 * @param {*} address
 */
export function addressSlice(address, sliceLength = 10,lastLength = "") {
    if (address) {
        let realLastLength = lastLength ? lastLength :sliceLength
        return `${address.slice(0, sliceLength)}...${address.slice(-realLastLength)}`
    }
    return address
}

/**
 * name slice
 * @param {*} name
 */
 export function showNameSlice(name, sliceLength = 8) {
    if (name && (name.length > sliceLength)) {
        return `${name.slice(0, sliceLength)}...`
    }
    return name
}

/**
 * remove scientific notation
 * @param {*} num_str
 */
export function toNonExponential(ExpNumber) {
    const num = new BigNumber(ExpNumber);
    return num.toFixed();
}
/**
 * Precision conversion
 * @param {*} amount
 * @param {*} decimal
 */
export function amountDecimals(amount, decimal = 0) {
    let realBalance = new BigNumber(amount)
        .dividedBy(new BigNumber(10).pow(decimal))
        .toString();
    return realBalance;
}

/**
 * Impression amount conversion. 4 decimal places by default
 * @param {*} number
 * @param {*} fixed
 */
export function getDisplayAmount(number, fixed = 4) {
    if (isNaN(parseFloat(number)) || number === 0) {
        return '0.00';
    }
    let showAmount = new BigNumber(number).toFixed(fixed, 1).toString()
    return toNonExponential(showAmount)
}

export function getAmountDisplay(amount, decimal = 0, fixed = 4) {
    return getDisplayAmount(amountDecimals(amount, decimal), fixed)
}
export function getAmountForUI(rawAmount, decimal = cointypes.decimals) {
    return new BigNumber(rawAmount)
        .dividedBy(new BigNumber(10).pow(decimal))
        .toFormat(2,
            BigNumber.ROUND_DOWN,
            {
                groupSeparator: ',',
                groupSize: 3,
                decimalSeparator: '.',
            });
}



/**
 * Remove spaces before and after a string
 * @param {*} str
 */
export function trimSpace(str) {
    if (typeof str !== 'string') {
        return str
    }
    let res = str.replace(/(^\s*)|(\s*$)/g, "")
    res = res.replace(/[\r\n]/g, "")
    return res
}

/**
 * Check if the address is valid
 * @param {*} url
 */
export function urlValid(url) {
    if (validUrl.isWebUri(url)) {
        return true
    }
    return false
}


/**
 * determine whether it is a number
 * @param n
 * @param includeE Whether to consider scientific notation to count as a number Default not to
 */
export function isNumber(n, includeE = false) {
    let isNum = !!String(n).match(/^\d+(?:\.\d*)?$/);
    if (!isNum && includeE) {
        return !!String(n).match(/^\d+e(-)?\d+$/);
    }
    return isNum;
}

/**
 * Check if it is an integer greater than 0
 * @param {*} n 
 * @param {*} includeE 
 * @returns 
 */
export function isTrueNumber(n) {
    let isNum = !!String(n).match(/^([1-9][0-9]*)$/);
    return isNum;
}

/**
 * Check username length default 16 digits
 * @param {*} name
 * @param {*} defaultLength
 */
export function nameLengthCheck(name, defaultLength = 16) {
    let realLength = 0
    let len = name.length
    let charCode = -1;
    for (let i = 0; i < len; i++) {
        charCode = name.charCodeAt(i);
        if (charCode >= 0 && charCode <= 128) {
            realLength += 1;
        } else {
            realLength += 2;
        }
    }
    if (realLength > defaultLength) {
        return false
    }
    return true;
}

/**
 * copy text
 */
export function copyText(text) {
    return navigator.clipboard.writeText(text)
        .catch((error) => { alert(`Copy failed! ${error}`) })
}

/**
 * format connectAccount
 * @param {*} account 
 * @returns 
 */
export function connectAccountDataFilter(account) {
    return {
        address: account.address,
        accountName: account.accountName,
        type: account.type,
        isConnected: account.isConnected,
        isConnecting: account.isConnecting,
    }
}

export function getOriginFromUrl(url) {
    if(!url){
        return ""
    }
    var origin = new URL(url).origin;
    return origin
}
/**
 * get params from input url
 * @param {*} url
 * @returns
 */
export function getQueryStringArgs(queryUrl = "") {
    let paramSplit = queryUrl.split("?")
    let paramUrl = ''
    if (paramSplit.length > 1) {
        paramUrl = paramSplit[1]
    }
    let params = new URLSearchParams(paramUrl);
    let args = {};
    for (const [key, value] of params) {
        args[key] = value
    }
    return args;
}

export function getCurrentNetConfig() {
    let localNetConfig = getLocal(NET_WORK_CONFIG)
    if (localNetConfig) {
        localNetConfig = JSON.parse(localNetConfig)
        return localNetConfig.currentConfig
    }
    return {}
}
/**
 * Return errors for processing transfers, etc.
 * @param {*} error 
 * @returns 
 */
export function getRealErrorMsg(error) {
    let errorMessage = ""
    try {
        if (error.message) {
            errorMessage = error.message
        }
        if (Array.isArray(error) && error.length > 0) {
            // postError
            errorMessage = error[0].message
            // buildError
            if(!errorMessage && error.length > 1){
                errorMessage = error[1].c
            }
        }
        if (typeof error === 'string') {
            let lastErrorIndex = error.lastIndexOf("Error:")
            if (lastErrorIndex !== -1) {
                errorMessage = error.slice(lastErrorIndex)
            } else {
                errorMessage = error
            }
        }
    } catch (error) {
    }
    return errorMessage
}

/**
 * Process staking list data
 */
export function parseStakingList(stakingListFromServer) {
    return stakingListFromServer.map(node => {
        return {
            nodeAddress: node.public_key,
            nodeName: node.identity_name,
            totalStake: getAmountForUI(node.stake),
            delegations: node.delegations,
        };
    })
}


/**
 * send network change message 
 * @param {*} netConfig 
 */
export function sendNetworkChangeMsg(netConfig) {
    if (netConfig.netType) {
        sendMsg({
            action: DAPP_CHANGE_NETWORK,
            payload: {
                netConfig: netConfig
            }
        }, () => { })
    }
}

/**
 * get local time from utc time
 * @param {*} time 
 * @returns 
 */
export function getShowTime(time) {
    try {
        const lang = navigator.language || navigator.languages[0];
        let date = new Date(time)
        let timeDate = date.toLocaleString(lang, {
            // timeZone: 'Europe/Moscow',
            hourCycle: 'h23',
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
        return timeDate.replaceAll("/", "-")
    } catch (error) {
        return time
    }
}

/**
 * get different from deletedAccountApproved to newAccountApproved
 * @param {*} deletedAccountApproved 
 * @param {*} newAccountApproved 
 * @returns 
 */
export function getArrayDiff(deletedAccountApproved,newAccountApproved){
    let list = []
    for (let index = 0; index < deletedAccountApproved.length; index++) {
      const deletedConnetedUrl = deletedAccountApproved[index];
      if(newAccountApproved.indexOf(deletedConnetedUrl) === -1){
        list.push(deletedConnetedUrl)
      }
    }
    return list
}


/** not support transaction history */
export function getNetTypeNotSupportHistory(netType){
    return NET_CONFIG_NOT_SUPPORT_TX_HISTORY.indexOf(netType) !== -1
}

/** not support stake   */
export function getNetTypeNotSupportStaking(netType){
    return NET_CONFIG_NOT_SUPPORT_STAKING.indexOf(netType) !== -1
}


export function exportFile(data, fileName) {
    const streamData = new Blob([data], { type: 'application/octet-stream' });
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(streamData, fileName);
    } else {
      const link = document.createElement('a');
      link.download = fileName;
      link.style.display = 'none';
      link.href = window.URL.createObjectURL(streamData);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }