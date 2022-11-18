import { BASE_INFO_URL, TX_LIST_LENGTH } from "../../../config";
import { LOCAL_BASE_INFO, LOCAL_CACHE_KEYS, NETWORK_ID_AND_TYPE } from "../../constant/storageKey";
import { getCurrentNetConfig, parseStakingList } from "../../utils/utils";
import { saveLocal } from "../localStorage";
import { commonFetch, startFetchMyMutation, startFetchMyQuery } from "../request";
import { getBalanceBatchBody, getBalanceBody, getBlockInfoBody, getChainIdBody, getDaemonStatusBody, getDelegationInfoBody, getDeletionTotalBody, getPartyBody, getPendingTxBody, getPendingZkAppTxBody, getStakeTxSend, getTxHistoryBody, getTxSend, getTxStatusBody, getZkAppTransactionListBody } from './gqlparams';

/**
* get balance
*/
export async function getBalance(address) {
  let txBody = getBalanceBody()
  let result = await startFetchMyQuery(
    txBody,
    {
      requestType: "extensionAccountInfo",
      publicKey: address
    }
  ).catch((error) => error)
  let account = result.account || {}
  saveLocal(LOCAL_CACHE_KEYS.ACCOUNT_BALANCE, JSON.stringify({ [address]: account }))
  if(result.error){
    account.error = result.error
  }
  return account
}
/**
* get txStatus 
* @param {*} paymentId
*/
export async function getTxStatus(paymentId) {
  let txBody = getTxStatusBody()
  let result = await startFetchMyQuery(txBody, { paymentId })
  return result
}
export async function getQATxStatus(zkappTransaction) { 
  let txBody = getQATxStatusBody()
  let result = await startFetchMyQuery(txBody, { zkappTransaction })
  return result
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
  }
  if (includeAmount) {
    variables.amount = payload.amount
  }
  if (isRawSignature) {
    variables.rawSignature = signature.rawSignature
  } else {
    variables.field = signature.field
    variables.scalar = signature.scalar
  }
  for (let pro in variables) {
    variables[pro] = String(typeof variables[pro] === "undefined" ? "" : variables[pro])
  }
  return variables
}
/**
* send transaction 
*/
export async function sendTx(payload, signature) {
  const variables = _getGQLVariables(payload, signature, true)
  let txBody = getTxSend(!!variables.rawSignature)
  let res = await startFetchMyMutation('sendTx', txBody, variables)
  return res
}
/**
* send staking
*/
export async function sendStakeTx(payload, signature) {
  const variables = _getGQLVariables(payload, signature, false)
  let txBody = getStakeTxSend(!!variables.rawSignature)
  let res = await startFetchMyMutation('stakeTx', txBody, variables);
  return res
}

 
/**
* send zk transaction 
*/
export async function sendParty(sendJson) {
  let txBody = getPartyBody()
  const variables = {
    zkappCommandInput:JSON.parse(sendJson)
  }
  let res = await startFetchMyMutation('sendZkapp',txBody,variables)
  return res
}

/**
* get daemon status
* @returns {Promise<{error: *}>}
*/
export async function fetchDaemonStatus() {
  const query = getDaemonStatusBody()
  let res = await startFetchMyQuery(query, {});
  let daemonStatus = res.daemonStatus || {}
  saveLocal(LOCAL_CACHE_KEYS.DAEMON_STATUS, JSON.stringify(daemonStatus))
  return daemonStatus;
}
/**
* get current block info
* @param {*} stateHash
* @returns
*/
export async function fetchBlockInfo(stateHash) {
  const query = getBlockInfoBody()
  let res = await startFetchMyQuery(query, { stateHash });
  let block = res.block || {}
  saveLocal(LOCAL_CACHE_KEYS.BLOCK_INFO, JSON.stringify(block))
  return block;
}

/**
* get delegation info
* @param {*} publicKey
* @returns
*/
export async function fetchDelegationInfo(publicKey) {
  const query = getDelegationInfoBody()
  let res = await startFetchMyQuery(query, { requestType: "extensionAccountInfo", publicKey });
  let account = res.account || {}
  saveLocal(LOCAL_CACHE_KEYS.DELEGATION_INFO, JSON.stringify({ [publicKey]: account }))
  return account;
}

export async function fetchStakingList() {
  let netConfig = getCurrentNetConfig()
  let baseUrl = netConfig.txUrl
  if (!baseUrl) {
    return []
  }
  const data = await commonFetch(baseUrl + '/validators').catch(() => [])
  const stakingList = parseStakingList(data)
  saveLocal(LOCAL_CACHE_KEYS.STAKING_LIST, JSON.stringify(stakingList))
  return stakingList;
}

/**
* get recommond fee
*/
export async function getFeeRecom() {
  let feeUrl = BASE_INFO_URL + "minter_fee.json"
  const result = await commonFetch(feeUrl).catch(err => [])
  return result
}


/**
* get about page base info 
*/
export async function getBaseInfo() {
  let feeUrl = BASE_INFO_URL + "about_us.json"
  let baseInfo = await commonFetch(feeUrl).catch(error => {
    return error
  })
  let data 
  if (baseInfo.changelog) {
    saveLocal(LOCAL_BASE_INFO, JSON.stringify(baseInfo))
    data = baseInfo 
  }
  return data
}



/**
* get transaction history
* @param {*} address
* @param {*} limit
* @returns
*/
export async function getTransactionList(address, limit = TX_LIST_LENGTH) {
  let netConfig = getCurrentNetConfig()
  let baseUrl = netConfig.txUrl
  let txUrl = baseUrl + "/transactions?account=" + address
  if (limit) {
    txUrl += "&limit=" + limit
  }
  let txList = await commonFetch(txUrl).catch(() => [])
  saveLocal(LOCAL_CACHE_KEYS.TRANSACTION_HISTORY, JSON.stringify({ [address]: txList }))
  return { txList, address }
}

/**
* get pending transation in gql
* @param {*} address
* @returns
*/
export async function getPendingTxList(address) {
  let txBody = getPendingTxBody()
  let result = await startFetchMyQuery(
    txBody,
    {
      requestType: "extensionAccountInfo",
      publicKey: address
    }).catch(() => [])
  let list = result.pooledUserCommands || []
  saveLocal(LOCAL_CACHE_KEYS.PENDING_TRANSACTION_HISTORY, JSON.stringify({ [address]: list }))
  return { txList: list, address }
}

/**
* get balance in batch
*/
export async function getBalanceBatch(addressList) {
  let realList = []
  if (!Array.isArray(addressList)) {
    realList.push(addressList)
  } else {
    realList = addressList
  }
  const variables = {}
  realList.forEach((address, i) => {
    variables[`account${i}`] = address
  })
  let txBody = getBalanceBatchBody(realList.length)
  let result = await startFetchMyQuery(txBody, variables).catch(() => { })
  let addressBalances = {}
  if (result) {
    realList.forEach((address, i) => {
      if (result[`account${i}`]) {
        addressBalances[address] = result[`account${i}`]
      }
    })
  }
  return addressBalances
}

/**
 * get node chain id
 * @param {*} gqlUrl 
 * @returns 
 */
export async function getNodeChainId(gqlUrl) {
  let txBody = getChainIdBody()
  let result = await startFetchMyQuery(
    txBody,
    {},
    gqlUrl,
  ).catch((err) => err)
  return result
}
/**
* get currency
* @param {*} currency 
* @returns 
*/
export async function getCurrencyPrice(currency) {
  let netConfig = getCurrentNetConfig()
  let priceUrl = netConfig.txUrl + "/prices?currency=" + currency
  let data = await commonFetch(priceUrl).catch(() => { })
  let price = data?.data || 0
  saveLocal(LOCAL_CACHE_KEYS.COIN_PRICE, JSON.stringify({ price }))
  return price
}


export async function getNetworkList() {
  let networkUrl = BASE_INFO_URL + "network_list.json"
  let result = await commonFetch(networkUrl).catch(error => [])
  if (result.length > 0) {
    saveLocal(NETWORK_ID_AND_TYPE, JSON.stringify(result))
  }
  return result
}

/** request gql transaction */
export async function getGqlTxHistory(address,limit){
  let netConfig = getCurrentNetConfig()
  let gqlTxUrl = netConfig.gqlTxUrl
  if (!gqlTxUrl) {
    return []
  }
  let txBody = getTxHistoryBody()
  let result = await startFetchMyQuery(
    txBody,
    {
      requestType: "extensionAccountInfo",
      publicKey: address,
      limit:limit||20
    },
    gqlTxUrl,
  ).catch((error) => error)
  let list = result.transactions  || []
  saveLocal(LOCAL_CACHE_KEYS.TRANSACTION_HISTORY, JSON.stringify({ [address]: list }))
  return list
}


/**
 * get vaildator detail by id
 * @param {*} id 
 * @returns 
 */
 export async function fetchValidatorDetail(publicKey,epoch) {
  let netConfig = getCurrentNetConfig()
  let gqlTxUrl = netConfig.gqlTxUrl
  if (!gqlTxUrl) {
    return {}
  }
  const query = getDeletionTotalBody()
  let res = await startFetchMyQuery(query, 
    { 
      requestType: "extensionAccountInfo", 
      publicKey,
      epoch
     },
     gqlTxUrl
     );
  let validatorDetail = {}
  if(res.stake){
    validatorDetail = res.stake.delegationTotals || {}
  }
  saveLocal(LOCAL_CACHE_KEYS.VALIDATOR_DETAIL, JSON.stringify(validatorDetail))
  return validatorDetail;
}

/** request gql transaction */
export async function getZkAppTxHistory(address,limit){
  let netConfig = getCurrentNetConfig()
  let gqlTxUrl = netConfig.gqlTxUrl
  if (!gqlTxUrl) {
    return []
  }
  let txBody = getZkAppTransactionListBody()
  let result = await startFetchMyQuery(
    txBody,
    {
      requestType: "extensionAccountInfo",
      publicKey: address,
      limit:limit||20
    },
    gqlTxUrl,
  ).catch((error) => error)
  let list = result.zkapps  || []
  saveLocal(LOCAL_CACHE_KEYS.ZKAPP_TX_LIST, JSON.stringify({ [address]: list }))
  return list
}


export async function getZkAppPendingTx(address,limit){
  let netConfig = getCurrentNetConfig()
  let gqlTxUrl = netConfig.url
  if (!gqlTxUrl) {
    return []
  }
  if(gqlTxUrl.indexOf("graphql")!==-1){
    gqlTxUrl.substring(gqlTxUrl.indexOf("graphql"))
  }
  let txBody = getPendingZkAppTxBody()
  let result = await startFetchMyQuery(
    txBody,
    {
      requestType: "extensionAccountInfo",
      publicKey: address,
      limit:limit||20
    },
    gqlTxUrl,
  ).catch((error) => error)
  let list = result.pooledZkappCommands  || []
  saveLocal(LOCAL_CACHE_KEYS.ZKAPP_PENDING_TX_LIST, JSON.stringify({ [address]: list }))
  return list
}
