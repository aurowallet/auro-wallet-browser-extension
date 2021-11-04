import BigNumber from "bignumber.js";
import validUrl from 'valid-url';
import {cointypes} from '../../config';
/**
 * 地址截取
 * @param {*} address
 */
export function addressSlice(address,sliceLength = 10) {
    if (address) {
        return `${address.slice(0, sliceLength)}...${address.slice(-sliceLength)}`
    }
    return address

}

/**
 * 去掉科学计数法
 * @param {*} num_str
 */
function toNonExponential(num_str) {
    num_str = num_str.toString();
    if (num_str.indexOf("+") != -1) {
        num_str = num_str.replace("+", "");
    }
    if (num_str.indexOf("E") != -1 || num_str.indexOf("e") != -1) {
        var resValue = "",
            power = "",
            result = null,
            dotIndex = 0,
            resArr = [],
            sym = "";
        var numStr = num_str.toString();
        if (numStr[0] == "-") {
            numStr = numStr.substr(1);
            sym = "-";
        }
        if (numStr.indexOf("E") != -1 || numStr.indexOf("e") != -1) {
            var regExp = new RegExp(
                "^(((\\d+.?\\d+)|(\\d+))[Ee]{1}((-(\\d+))|(\\d+)))$",
                "ig"
            );
            result = regExp.exec(numStr);
            if (result != null) {
                resValue = result[2];
                power = result[5];
                result = null;
            }
            if (!resValue && !power) {
                return false;
            }
            dotIndex = resValue.indexOf(".") == -1 ? 0 : resValue.indexOf(".");
            resValue = resValue.replace(".", "");
            resArr = resValue.split("");
            if (Number(power) >= 0) {
                var subres = resValue.substr(dotIndex);
                power = Number(power);
                for (var i = 0; i <= power - subres.length; i++) {
                    resArr.push("0");
                }
                if (power - subres.length < 0) {
                    resArr.splice(dotIndex + power, 0, ".");
                }
            } else {
                power = power.replace("-", "");
                power = Number(power);
                for (var i = 0; i < power - dotIndex; i++) {
                    resArr.unshift("0");
                }
                var n = power - dotIndex >= 0 ? 1 : -(power - dotIndex);
                resArr.splice(n, 0, ".");
            }
        }
        resValue = resArr.join("");

        return sym + resValue;
    } else {
        return num_str;
    }
}
/**
 * 精度换算
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
 * 展示金额转换。默认4位小数
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
 * 去掉字符串前后空格
 * @param {*} str
 */
export function trimSpace(str) {
    let res = str.replace(/(^\s*)|(\s*$)/g, "")
    res = res.replace(/[\r\n]/g, "")
    return res
}

/**
 * 校验地址是否有效
 * @param {*} url
 */
export function urlValid(url) {
    if (validUrl.isWebUri(url)) {
        return true
    }
    return false
}


/**
 * 判断是不是数字
 * @param n
 * @param includeE 是否认为科学计数法也算作数字 默认不算
 */
export function isNumber(n, includeE = false) {
    let isNum = !!String(n).match(/^\d+\.?(?:\.\d+)?$/);
    if (!isNum && includeE) {
        return !!String(n).match(/^\d+e(-)?\d+$/);
    }
    return isNum;
}

/**
 * 校验是否是大于0 的整数
 * @param {*} n 
 * @param {*} includeE 
 * @returns 
 */
export function isTrueNumber(n) {
    let isNum = !!String(n).match(/^([1-9][0-9]*)$/);
    return isNum;
}
  
/**
 * 校验用户名长度 默认16位
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
 * 复制文本
 */
export function copyText(text){
    return navigator.clipboard.writeText(text)
      .catch((error) => { alert(`Copy failed! ${error}`) })
}

/**
 * 分割特殊文本
 * @returns 
 */
export function specialSplit(str) {
    let startStr = '[['
    let endStr = "]]"
    let list = []
    var index = str.indexOf(startStr); 
    let lastIndex = -endStr.length
    let specialIndex = -1
    while (index !== -1) {
        list.push({
            type:"common",
            showStr : str.slice(lastIndex+endStr.length,index)
        })
        lastIndex = str.indexOf(endStr,index);
        list.push({
            type:"special",
            showStr : str.slice(index+startStr.length,lastIndex),
            specialIndex:++specialIndex
        })
        index = str.indexOf(startStr, index + 1);
        if(index === -1){
            let showStr = str.slice(lastIndex+endStr.length)
            if(!!showStr){
                list.push({
                    type:"common",
                    showStr : showStr
                })
            }
        }
    }
    return list
}
/**
 * 处理 staking list 的数据
 */
export function parseStakingList(stakingListFromServer){
    return stakingListFromServer.map(node => {
        return {
          nodeAddress: node.public_key,
          nodeName: node.identity_name,
          totalStake: getAmountForUI(node.stake),
          delegations: node.delegations,
        };
      })
}