import { FALLBACK_MESSAGE, errorValues } from "@/constant/dappError";
import { sha256 } from "@noble/hashes/sha256";
import { utf8ToBytes } from "@noble/hashes/utils";
import BigNumber from "bignumber.js";
import bs58check from "bs58check";
import validUrl from "valid-url";
import { MAIN_COIN_CONFIG } from "../constant";

/**
 * address slice
 * @param {*} address
 */
export function addressSlice(address, sliceLength = 10, lastLength = "") {
  if (address) {
    let realLastLength = lastLength ? lastLength : sliceLength;
    return `${address.slice(0, sliceLength)}...${address.slice(
      -realLastLength
    )}`;
  }
  return address;
}

/**
 * name slice
 * @param {*} name
 */
export function showNameSlice(name, sliceLength = 8) {
  if (name && name.length > sliceLength) {
    return `${name.slice(0, sliceLength)}...`;
  }
  return name;
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
  // if decimal bigger than 100 , use 0
  let nextDecimals = decimal;
  if (BigNumber(nextDecimals).gt(100)) {
    nextDecimals = 0;
  }
  let realBalance = new BigNumber(amount)
    .dividedBy(new BigNumber(10).pow(nextDecimals))
    .toString();
  return realBalance;
}

export function getBalanceForUI(balance, decimal = 0, fixed = 4) {
  try {
    let nextBalance = amountDecimals(balance, decimal);
    if (isNaN(parseFloat(nextBalance)) || nextBalance === 0) {
      return "0.00";
    }
    let showBalance = new BigNumber(nextBalance)
      .toFixed(Number(fixed), 1)
      .toString();
    return toNonExponential(showBalance);
  } catch (error) {
    // for decimal error
    return balance;
  }
}

export function getAmountForUI(
  rawAmount,
  decimal = MAIN_COIN_CONFIG.decimals,
  fixed = 2
) {
  return new BigNumber(rawAmount)
    .dividedBy(new BigNumber(10).pow(decimal))
    .toFormat(fixed, BigNumber.ROUND_DOWN, {
      groupSeparator: ",",
      groupSize: 3,
      decimalSeparator: ".",
    });
}

/**
 * Remove spaces before and after a string
 * @param {*} str
 */
export function trimSpace(str) {
  if (typeof str !== "string") {
    return str;
  }
  let res = str.replace(/(^\s*)|(\s*$)/g, "");
  res = res.replace(/[\r\n]/g, "");
  return res;
}

/**
 * Check if the address is valid
 * @param {*} url
 */
export function urlValid(url) {
  if (validUrl.isWebUri(url)) {
    return true;
  }
  return false;
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
 * check if number is natural number
 * @param {*} n
 * @returns
 */
export function isNaturalNumber(n) {
  let isNum = !!String(n).match(/^([0]|[1-9][0-9]*)$/);
  return isNum;
}

export function getCharLength(name) {
  let realLength = 0;
  let len = name.length;
  let charCode = -1;
  for (let i = 0; i < len; i++) {
    charCode = name.charCodeAt(i);
    if (charCode >= 0 && charCode <= 128) {
      realLength += 1;
    } else {
      realLength += 2;
    }
  }
  return realLength;
}

/**
 * Check username length default 16 digits
 * @param {*} name
 * @param {*} defaultLength
 */
export function nameLengthCheck(name, defaultLength = 16) {
  let realLength = getCharLength(name);
  if (realLength > defaultLength) {
    return false;
  }
  return true;
}

export function getOriginFromUrl(url) {
  try {
    if (!url) {
      return "";
    }
    var origin = new URL(url).origin;
    return origin;
  } catch (error) {
    return url;
  }
}
/**
 * get params from input url
 * @param {*} url
 * @returns
 */
export function getQueryStringArgs(queryUrl = "") {
  let paramSplit = queryUrl.split("?");
  let paramUrl = "";
  if (paramSplit.length > 1) {
    paramUrl = paramSplit[1];
  }
  let params = new URLSearchParams(paramUrl);
  let args = {};
  for (const [key, value] of params) {
    args[key] = value;
  }
  return args;
}

/**
 * Return errors for processing transfers, etc.
 * @param {*} error
 * @returns
 */
export function getRealErrorMsg(error) {
  let errorMessage = "";
  try {
    if (error.message) {
      errorMessage = error.message;
    }
    if (Array.isArray(error) && error.length > 0) {
      // postError
      errorMessage = error[0].message;
      // buildError
      if (!errorMessage && error.length > 1) {
        errorMessage = error[1].c;
      }
    }
    if (typeof error === "string") {
      let lastErrorIndex = error.lastIndexOf("Error:");
      if (lastErrorIndex !== -1) {
        errorMessage = error.slice(lastErrorIndex);
      } else {
        errorMessage = error;
      }
    }
  } catch (error) {}
  return errorMessage;
}

/**
 * Process staking list data
 */
export function parseStakingList(stakingListFromServer) {
  return stakingListFromServer.map((node) => {
    return {
      nodeAddress: node.public_key,
      nodeName: node.identity_name,
      totalStake: getAmountForUI(node.stake, MAIN_COIN_CONFIG.decimals, 0),
      delegations: node.delegations,
      icon: node.validator_logo || "",
    };
  });
}

/**
 * get local time from utc time
 * @param {*} time
 * @returns
 */
export function getShowTime(time, needParse = false) {
  try {
    if (!time) {
      return "date-time";
    }
    let nextTime = time;
    if (typeof time === "string" && needParse) {
      nextTime = parseInt(time);
    }
    const date = new Date(nextTime);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day} ${hour}:${minute}`;
  } catch (error) {
    return time;
  }
}

/**
 * get different from deletedAccountApproved to newAccountApproved
 * @param {*} deletedAccountApproved
 * @param {*} newAccountApproved
 * @returns
 */
export function getArrayDiff(deletedAccountApproved, newAccountApproved) {
  let list = [];
  for (let index = 0; index < deletedAccountApproved.length; index++) {
    const deletedConnectedUrl = deletedAccountApproved[index];
    if (newAccountApproved.indexOf(deletedConnectedUrl) === -1) {
      list.push(deletedConnectedUrl);
    }
  }
  return list;
}

export function exportFile(data, fileName) {
  const streamData = new Blob([data], { type: "application/octet-stream" });
  if (window.navigator && window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveOrOpenBlob(streamData, fileName);
  } else {
    const link = document.createElement("a");
    link.download = fileName;
    link.style.display = "none";
    link.href = window.URL.createObjectURL(streamData);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function decodeMemo(encode) {
  try {
    const encoded = bs58check.decode(encode);
    const res = encoded.slice(3, 3 + encoded[2]).toString("utf-8");
    return res;
  } catch (error) {
    return encode;
  }
}

export function getTimeGMT(time) {
  try {
    let date = new Date(time).toString();
    let gmtIndex = date.indexOf("GMT");
    let str = date.slice(gmtIndex, gmtIndex + 8);
    return str;
  } catch (error) {
    return time;
  }
}

export function numberFormat(str) {
  return str.replace(/[^\d^\.]+/g, "").replace(/\.{2,}/, "");
}

/** check url is exist in netConfig */
export function checkNodeExist(allNodeList, url) {
  let sameIndex = -1;
  let config;
  for (let index = 0; index < allNodeList.length; index++) {
    const nodeItem = allNodeList[index];
    if (nodeItem.url === url) {
      sameIndex = index;
      config = nodeItem;
      break;
    }
  }
  return { index: sameIndex, config };
}

export function getMessageFromCode(code, fallbackMessage = FALLBACK_MESSAGE) {
  const codeString = code.toString();
  const message = errorValues[codeString]?.message;
  if (message) {
    return message;
  }
  return fallbackMessage;
}

export function checkValidStrInList(list) {
  return list.filter((element) => {
    return typeof element === "string" && element.trim() !== "";
  });
}

/**
 * @param {*} netToken
 * @param {*} localToken
 */
export function mergeLocalConfigToNetToken(newTokens, localTokens) {
  const tokenMap = new Map();

  localTokens.forEach((token) => {
    tokenMap.set(token.tokenId, token);
  });

  return newTokens.map((token) => {
    const localToken = tokenMap.get(token.tokenId);
    if (localToken) {
      return {
        ...token,
        localConfig: localToken.localConfig ?? {},
      };
    } else {
      return token;
    }
  });
}
export function getReadableNetworkId(networkId) {
  return networkId.replace(/:/g, "_");
}

export const createCredentialHash = (credential) => {
  const { metadata: _, ...credentialWithoutMetadata } = credential;

  function sortObject(obj) {
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
      return obj;
    }
    const sorted = {};
    Object.keys(obj)
      .sort()
      .forEach((key) => {
        sorted[key] = sortObject(obj[key]);
      });
    return sorted;
  }
  const normalized = sortObject(credentialWithoutMetadata);
  const stableString = JSON.stringify(normalized);
  const bytes = utf8ToBytes(stableString);
  const hash = sha256(bytes);
  return Array.from(hash)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

export function getCredentialDisplayData(data) {
  const result = {};
  for (const [key, value] of Object.entries(data)) {
    try {
      if (typeof value === "string") {
        result[key] = value;
      } else if (
        value &&
        typeof value === "object" &&
        "magnitude" in value &&
        "sgn" in value
      ) {
        const sign = value.sgn === "Positive" ? 1 : -1;
        result[key] = sign * parseInt(value.magnitude);
      } else {
        result[key] = JSON.stringify(value);
      }
      if (key === "expiresAt") {
        result[key] = getShowTime(value, true);
      }
    } catch (e) {
      result[key] = "";
    }
  }
  return result;
}

/**
 * for revoke permissions
 * @param {*} data
 * @param {*} urlToRemove
 * @returns
 */
export function removeUrlFromArrays(data, urlToRemove) {
  const filteredData = {};
  for (const key in data) {
    // Filter out the specified URL and any undefined/null elements
    filteredData[key] = data[key].filter(
      (url) => url !== undefined && url !== null && url !== urlToRemove
    );
  }
  return filteredData;
}

/**
 * Check if the address is valid
 * @param {*} address
 */
export function addressValid(address) {
  try {
    if (!address.toLowerCase().startsWith("b62")) {
      return false;
    }
    const decodedAddress = bs58check.decode(address).toString("hex");
    return !!decodedAddress && decodedAddress.length === 72;
  } catch (ex) {
    return false;
  }
}
export const PasswordValidationList = [
  {
    text: "passwordRequires",
    expression: /^.{8,32}$/,
    bool: false,
  },
  {
    text: "atLeastOneUppercaseLetter",
    expression: /[A-Z]+/,
    bool: false,
  },
  {
    text: "atLeastOneLowercaseLetter",
    expression: /[a-z]+/,
    bool: false,
  },
  {
    text: "atLeastOneNumber",
    expression: /[0-9]+/,
    bool: false,
  },
];

export const validatePassword = (password) => {
  return PasswordValidationList.map((rule) => ({
    ...rule,
    bool: rule.expression.test(password),
  }));
};
