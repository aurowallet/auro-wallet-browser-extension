import { NetworkID_MAP } from "@/constant/network";
import { BASE_INFO_URL, TokenBuildUrl } from "../../../config";
import { DEFAULT_TX_REQUEST_LENGTH, ZK_DEFAULT_TOKEN_ID } from "../../constant";
import {
  LOCAL_BASE_INFO,
  LOCAL_CACHE_KEYS,
  RECOMMEND_FEE,
  SCAM_LIST,
  SUPPORT_TOKEN_LIST,
} from "../../constant/storageKey";
import { getCurrentNodeConfig } from "../../utils/browserUtils";
import { getReadableNetworkId, parseStakingList } from "../../utils/utils";

import { saveLocal } from "../localStorage";
import {
  commonFetch,
  postRequest,
  startFetchMyMutation,
  startFetchMyQuery,
} from "../request";
import {
  getAllTransactionListBody,
  getBalanceBatchBody,
  getBlockInfoBody,
  getDaemonStatusBody,
  getDelegationInfoBody,
  getFetchAccountBody,
  getNetworkIDBody,
  getPartyBody,
  getPendingTxBody,
  getPendingZkAppTxBody,
  getQATxStatusBody,
  getStakeTxSend,
  getTokenInfoBodyV2,
  getTokenQueryBody,
  getTokenStateBody,
  getTxHistoryBody,
  getTxSend,
  getTxStatusBody,
  getZekoFeeBody,
  getZkAppTransactionListBody,
} from "./gqlparams";

/**
 * get txStatus
 * @param {*} paymentId
 */
export async function getTxStatus(paymentId) {
  let txBody = getTxStatusBody();
  let result = await startFetchMyQuery(txBody, { paymentId });
  return result;
}
export async function getQATxStatus(zkappTransaction) {
  let txBody = getQATxStatusBody();
  let result = await startFetchMyQuery(txBody, { zkappTransaction });
  return result;
}

function _getGQLVariables(payload, signature, includeAmount = true) {
  let isRawSignature = !!signature.rawSignature;
  let variables = {
    fee: payload.fee,
    to: payload.to,
    from: payload.from,
    nonce: payload.nonce,
    memo: payload.memo || "",
    validUntil: payload.validUntil,
  };
  if (includeAmount) {
    variables.amount = payload.amount;
  }
  if (isRawSignature) {
    variables.rawSignature = signature.rawSignature;
  } else {
    variables.field = signature.field;
    variables.scalar = signature.scalar;
  }
  for (let pro in variables) {
    variables[pro] = String(
      typeof variables[pro] === "undefined" ? "" : variables[pro]
    );
  }
  return variables;
}
/**
 * send transaction
 */
export async function sendTx(payload, signature) {
  const variables = _getGQLVariables(payload, signature, true);
  let txBody = getTxSend(!!variables.rawSignature);
  let res = await startFetchMyMutation(txBody, variables);
  return res;
}
/**
 * send staking
 */
export async function sendStakeTx(payload, signature) {
  const variables = _getGQLVariables(payload, signature, false);
  let txBody = getStakeTxSend(!!variables.rawSignature);
  let res = await startFetchMyMutation(txBody, variables);
  return res;
}

/**
 * send zk transaction
 */
export async function sendParty(sendJson) {
  let txBody = getPartyBody();
  const variables = {
    zkappCommandInput: sendJson,
  };
  let res = await startFetchMyMutation(txBody, variables);
  return res;
}

/**
 * get daemon status
 * @returns {Promise<{error: *}>}
 */
export async function fetchDaemonStatus() {
  const query = getDaemonStatusBody();
  let res = await startFetchMyQuery(query, {});
  let daemonStatus = res.daemonStatus || {};
  saveLocal(LOCAL_CACHE_KEYS.DAEMON_STATUS, JSON.stringify(daemonStatus));
  return daemonStatus;
}
/**
 * get current block info
 * @param {*} stateHash
 * @returns
 */
export async function fetchBlockInfo(stateHash) {
  const query = getBlockInfoBody();
  let res = await startFetchMyQuery(query, { stateHash });
  let block = res.block || {};
  saveLocal(LOCAL_CACHE_KEYS.BLOCK_INFO, JSON.stringify(block));
  return block;
}

/**
 * get delegation info
 * @param {*} publicKey
 * @returns
 */
export async function fetchDelegationInfo(publicKey) {
  const query = getDelegationInfoBody();
  let res = await startFetchMyQuery(query, { publicKey });
  let account = res.account || {};
  saveLocal(
    LOCAL_CACHE_KEYS.DELEGATION_INFO,
    JSON.stringify({ [publicKey]: account })
  );
  return account;
}

export async function fetchStakingList() {
  let netConfig = await getCurrentNodeConfig();
  if (netConfig.networkID !== NetworkID_MAP.mainnet) {
    return [];
  }
  const data = await commonFetch(BASE_INFO_URL + "/validators").catch(() => []);
  const stakingList = parseStakingList(data);
  saveLocal(LOCAL_CACHE_KEYS.STAKING_LIST, JSON.stringify(stakingList));
  return stakingList;
}

/**
 * get recommend fee
 */
export async function getRecommendFee() {
  let feeUrl = BASE_INFO_URL + "/minter_fee.json";
  const result = await commonFetch(feeUrl).catch((err) => []);
  if (Array.isArray(result) && result.length > 0) {
    saveLocal(RECOMMEND_FEE, JSON.stringify(result));
  }
  return result;
}

/**
 * get about page base info
 */
export async function getBaseInfo() {
  let feeUrl = BASE_INFO_URL + "/about_us.json";
  let baseInfo = await commonFetch(feeUrl).catch((error) => {
    return error;
  });
  let data;
  if (baseInfo.changelog) {
    saveLocal(LOCAL_BASE_INFO, JSON.stringify(baseInfo));
    data = baseInfo;
  }
  return data;
}

/**
 * get pending transaction in gql
 * @param {*} address
 * @returns
 */
export async function getPendingTxList(address) {
  let txBody = getPendingTxBody();
  let result = await startFetchMyQuery(txBody, {
    publicKey: address,
  }).catch((error) => error);
  if (result.error) {
    throw new Error(String(result.error));
  }
  let list = result.pooledUserCommands || [];
  return { txList: list, address };
}

/**
 * get balance in batch
 */
export async function getBalanceBatch(addressList) {
  let realList = [];
  if (!Array.isArray(addressList)) {
    realList.push(addressList);
  } else {
    realList = addressList;
  }
  const variables = {};
  realList.forEach((address, i) => {
    variables[`account${i}`] = address;
  });
  let txBody = getBalanceBatchBody(realList.length);
  let result = await startFetchMyQuery(txBody, variables).catch(() => {});
  let addressBalances = {};
  if (result) {
    realList.forEach((address, i) => {
      if (result[`account${i}`]) {
        addressBalances[address] = result[`account${i}`];
      }
    });
  }
  return addressBalances;
}

/**
 * get node networkID
 * @param {*} gqlUrl
 * @returns
 */
export async function getNodeNetworkID(gqlUrl) {
  let body = getNetworkIDBody();
  let result = await startFetchMyQuery(body, {}, gqlUrl).catch((err) => err);
  return result;
}
/**
 * get currency
 * @param {*} currency
 * @returns
 */
export async function getCurrencyPrice(currency) {
  let netConfig = await getCurrentNodeConfig();
  if (netConfig.networkID !== NetworkID_MAP.mainnet) {
    return {};
  }
  let priceUrl =
    BASE_INFO_URL + "/prices?currency=" + encodeURIComponent(currency);
  let data = await commonFetch(priceUrl).catch(() => {});
  let price = data?.data || 0;
  let tokenPrice = {};
  tokenPrice[ZK_DEFAULT_TOKEN_ID] = price;
  saveLocal(LOCAL_CACHE_KEYS.COIN_PRICE, JSON.stringify(tokenPrice));
  return tokenPrice;
}

/** request gql transaction */
export async function getTxHistory(address, limit) {
  let netConfig = await getCurrentNodeConfig();
  let gqlTxUrl = netConfig.gqlTxUrl;
  if (!gqlTxUrl) {
    return [];
  }
  let txBody = getTxHistoryBody();
  let result = await startFetchMyQuery(
    txBody,
    {
      publicKey: address,
      limit: limit || DEFAULT_TX_REQUEST_LENGTH,
    },
    gqlTxUrl
  ).catch((error) => error);
  if (result.error) {
    throw new Error(String(result.error));
  }
  let txList = result?.transactions || [];
  return { txList, address };
}

/** request gql transaction */
export async function getZkAppTxHistory(address, tokenId, limit) {
  let netConfig = await getCurrentNodeConfig();
  let gqlTxUrl = netConfig.gqlTxUrl;
  if (!gqlTxUrl) {
    return [];
  }
  const nextTokenId = tokenId == ZK_DEFAULT_TOKEN_ID ? "" : tokenId;
  let txBody = getZkAppTransactionListBody();
  let result = await startFetchMyQuery(
    txBody,
    {
      publicKey: address,
      tokenId: nextTokenId,
      limit: limit || DEFAULT_TX_REQUEST_LENGTH,
    },
    gqlTxUrl
  ).catch((error) => error);
  if (result.error) {
    throw new Error(String(result.error));
  }
  let txList = result?.zkapps || [];
  return { txList, address, tokenId };
}
/**
 * get full type transaction, contains payment, delegation,zkapp,
 * @param {*} address
 * @param {*} tokenId
 * @param {*} limit
 * @returns
 */
export async function getAllTxHistory(address, tokenId, limit) {
  let netConfig = await getCurrentNodeConfig();
  let gqlTxUrl = netConfig.gqlTxUrl;
  if (!gqlTxUrl) {
    return [];
  }
  const nextTokenId = tokenId == ZK_DEFAULT_TOKEN_ID ? "" : tokenId;
  let txBody = getAllTransactionListBody();
  let result = await startFetchMyQuery(
    txBody,
    {
      publicKey: address,
      tokenId: nextTokenId,
      limit: limit || DEFAULT_TX_REQUEST_LENGTH,
    },
    gqlTxUrl
  ).catch((error) => error);

  if (result.error) {
    throw new Error(String(result.error));
  }
  let txList = result?.fullTransactions || [];
  return { txList, address, tokenId };
}

export async function getZkAppPendingTx(address, limit) {
  let netConfig = await getCurrentNodeConfig();
  let gqlTxUrl = netConfig.url;
  if (!gqlTxUrl) {
    return [];
  }
  if (gqlTxUrl.indexOf("graphql") !== -1) {
    gqlTxUrl.substring(gqlTxUrl.indexOf("graphql"));
  }
  let txBody = getPendingZkAppTxBody();
  let result = await startFetchMyQuery(
    txBody,
    {
      publicKey: address,
      limit: limit || 20,
    },
    gqlTxUrl
  ).catch((error) => error);
  if (result.error) {
    throw new Error(String(result.error));
  }
  let txList = result.pooledZkappCommands || [];
  return { txList, address };
}

/**
 * get scam list
 */
export async function getScamList() {
  let feeUrl = BASE_INFO_URL + "/scam_list";
  const result = await commonFetch(feeUrl).catch((err) => []);
  if (Array.isArray(result) && result.length > 0) {
    saveLocal(SCAM_LIST, JSON.stringify(result));
  }
  return result;
}

export async function getAccountInfo(address, tokenId) {
  let accountBody = getFetchAccountBody();
  let queryParams = {
    publicKey: address,
  };
  if (tokenId) {
    queryParams.tokenId = tokenId;
  }
  let result = await startFetchMyQuery(accountBody, queryParams).catch(
    (error) => error
  );
  if (result?.error) {
    return { error: result.error };
  }
}
export async function buildTokenBody(params) {
  const requestUrl = TokenBuildUrl + "/tokenbuild";
  const timeout = 3 * 60 * 1000;
  const result = await postRequest(requestUrl, params, timeout).catch(
    (err) => err
  );
  return result;
}
export async function getAllTokenAssets(address) {
  let txBody = getTokenQueryBody();
  let result = await startFetchMyQuery(txBody, {
    publicKey: address,
  }).catch((error) => error);
  if (result?.error) {
    result.error = result.error;
  }
  return result;
}

export async function getAllTokenInfoV2(tokenIds) {
  try {
    const tokenBody = getTokenInfoBodyV2(tokenIds);
    const result = await startFetchMyQuery(tokenBody, {}).catch(
      (error) => error
    );
    return result;
  } catch (error) {
    console.error("Error fetching token info:", error);
    return { error: error.message };
  }
}

export async function getTokenState(address, tokenId) {
  let txBody = getTokenStateBody();
  let result = await startFetchMyQuery(txBody, {
    publicKey: address,
    tokenId,
  }).catch((error) => error);
  return result;
}

/**
 * get token info
 */
export async function fetchSupportTokenInfo() {
  let netConfig = await getCurrentNodeConfig();
  const readableNetworkId = getReadableNetworkId(netConfig.networkID);
  const requestUrl =
    BASE_INFO_URL +
    "/tokenInfo?networkId=" +
    encodeURIComponent(readableNetworkId);
  const data = await commonFetch(requestUrl).catch(() => []);
  if (data.length > 0) {
    saveLocal(
      SUPPORT_TOKEN_LIST + "_" + readableNetworkId,
      JSON.stringify(data)
    );
  }
  return data;
}

/**
 * get zeko recommend fee
 */
export async function getZekoNetFee(weight = 1) {
  let queryBody = getZekoFeeBody();
  let result = await startFetchMyQuery(queryBody, {
    weight: weight,
  }).catch((error) => error);
  let feePerWeightUnit = result?.feePerWeightUnit;
  return feePerWeightUnit;
}
