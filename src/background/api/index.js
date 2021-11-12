/**
 * 所有的网络请求在这里进行
 */

import { BASE_INFO_URL, TRANSACTION_URL, TX_LIST_LENGTH } from "../../../config";
import { LOCAL_CACHE_KEYS } from "../../constant/storageKey";
import { parseStakingList } from "../../utils/utils";
import { saveLocal } from "../localStorage";
import { commonFetch, startFetchMyMutation, startFetchMyQuery } from "../request";
import { getBalanceBody, getStakeTxSend, getTxHistoryBody, getTxSend, getTxStatusBody ,getPendingTxBody, getBalanceBatchBody, getDaemonStatusBody, getBlockInfoBody, getDelegationInfoBody, getNodeVersionBody} from './gqlparams';

/**
 * 获取余额
 */
export async function getBalance(address) {
  let txBody = getBalanceBody()
  let result = await startFetchMyQuery(
      txBody,
      {
        requestType: "extensionAccountInfo",
        publicKey: address
      }
  ).catch((err)=>err)
  let localAccount = result.account
  saveLocal(LOCAL_CACHE_KEYS.ACCOUNT_BALANCE,JSON.stringify({[address]:localAccount}))
  return {address,account:result}
}
/**
 * 获取交易状态
 * @param {*} paymentId
 */
export async function getTxStatus(paymentId) {
  let txBody = getTxStatusBody()
  let result = await startFetchMyQuery(txBody,{ paymentId })
  return result
}

/**
 * 获取交易记录
 */
export async function getTxHistory(address) {
  let txBody = getTxHistoryBody()
  let res = await startFetchMyQuery(
      txBody,
      {
        from: address,
        limit: 20,
        sortBy: 'DATETIME_DESC'
      })
  return res
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
    variables[pro] = String(typeof variables[pro] === "undefined" ?  "" : variables[pro])
  }
  return variables
}
/**
 * 转账
 */
export async function sendTx(payload,signature){
  const variables = _getGQLVariables(payload, signature, true)
  let txBody =  getTxSend(!!variables.rawSignature)
  let res = await startFetchMyMutation('sendTx', txBody, variables)
  return res
}
/**
 * 质押
 */
export async function sendStakeTx(payload,signature){
  const variables = _getGQLVariables(payload, signature, false)
  let txBody =  getStakeTxSend(!!variables.rawSignature)
  let res = await startFetchMyMutation('stakeTx', txBody, variables);
  return res
}


/**
 * 请求链上基础信息，如块高，epoch时间
 * @returns {Promise<{error: *}>}
 */
export async function fetchDaemonStatus() {
  const query = getDaemonStatusBody()
  let res = await startFetchMyQuery(query, {});
  let daemonStatus = res.daemonStatus || {}
  saveLocal(LOCAL_CACHE_KEYS.DAEMON_STATUS,JSON.stringify(daemonStatus))
  return res;
}
/**
 * 当前块的信息
 * @param {*} stateHash 
 * @returns 
 */
export async function fetchBlockInfo(stateHash) {
  const query = getBlockInfoBody()
  let res = await startFetchMyQuery(query, {stateHash});
  let block = res.block||{}
  saveLocal(LOCAL_CACHE_KEYS.BLOCK_INFO,JSON.stringify(block))
  return res;
}

/**
 * 当前质押的节点地址
 * @param {*} publicKey 
 * @returns 
 */
export async function fetchDelegationInfo(publicKey) {
  const query = getDelegationInfoBody()
  let res = await startFetchMyQuery(query, { requestType: "extensionAccountInfo", publicKey });
  let account = res.account || {}
  saveLocal(LOCAL_CACHE_KEYS.DELEGATION_INFO,JSON.stringify({[publicKey]:account}))
  return res;
}

export async function fetchValidatorDetail(id) {
  const data = await commonFetch( `${TRANSACTION_URL}/validators/${id}`)
  let validatorDetail = data?.validator||"";
  saveLocal(LOCAL_CACHE_KEYS.VALIDATOR_DETAIL,JSON.stringify(validatorDetail))
  return data;
}
export async function fetchStakingList() {
  const data = await commonFetch(TRANSACTION_URL+'/validators').catch(()=>[])
  const stakingList = parseStakingList(data)
  saveLocal(LOCAL_CACHE_KEYS.STAKING_LIST,JSON.stringify(stakingList))
  return stakingList;
}

/**
 * 获取手续费推荐
 */
export async function getFeeRecom(){
  let feeUrl = BASE_INFO_URL+"minter_fee.json"
  const result = await commonFetch(feeUrl).catch(err=>[])
  return result
}


/**
 * 获取关于页面信息
 */
export async function getBaseInfo(){
  let feeUrl = BASE_INFO_URL+"about_us.json"
  let result = await commonFetch(feeUrl).catch(error=>{
   return error
  })
  return result
}



/**
 * 交易记录
 * @param {*} address
 * @param {*} limit
 * @returns
 */
export async function getTransactionList(address, limit = TX_LIST_LENGTH){
  let txUrl = TRANSACTION_URL+ "/transactions?account="+address//TRANSACTION_URL+address
  if (limit) {
    txUrl += "&limit=" + limit
  }
  let txList = await commonFetch(txUrl).catch(()=>[])
  saveLocal(LOCAL_CACHE_KEYS.TRANSACTION_HISTORY,JSON.stringify({[address]:txList}))
   return {txList,address}
}

/**
 * 获取pending交易记录
 * @param {*} address
 * @returns
 */
export async function getPendingTxList(address){
  let txBody = getPendingTxBody()
  let result = await startFetchMyQuery(
      txBody,
      {
        requestType: "extensionAccountInfo",
        publicKey: address
      }).catch(()=>[])
  let list =  result.pooledUserCommands ||[]
  saveLocal(LOCAL_CACHE_KEYS.PENDING_TRANSACTION_HISTORY,JSON.stringify({[address]:list}))
  return {txList:list,address}
}

/**
 * 获取余额
 */
 export async function getBalanceBatch(addressList) {
  let realList = []
  if(!Array.isArray(addressList)){
    realList.push(addressList)
  }else{
    realList = addressList
  }
  const variables = {}
  realList.forEach((address, i)=>{
    variables[`account${i}`] = address
  })
  let txBody = getBalanceBatchBody(realList.length)
  let result = await startFetchMyQuery(txBody, variables).catch(()=>{})
  let addressBalances = {}
  if (result) {
    realList.forEach((address, i)=>{
      if (result[`account${i}`]) {
        addressBalances[address] = result[`account${i}`]
      }
    })
  }
  return addressBalances
}

/**
 * 获取 node version
 * @param {*} gqlUrl 
 * @returns 
 */
 export async function getNodeVersion(gqlUrl) {
  let txBody = getNodeVersionBody()
  let result = await startFetchMyQuery(
      txBody,
      {},
      gqlUrl,
  ).catch((err)=>err)
  return result
}

/**
 * 获取当前价格
 * @param {*} currency 
 * @returns 
 */
 export async function getCurrencyPrice(currency){
  let priceUrl = TRANSACTION_URL+ "/prices?currency="+currency
  let data = await commonFetch(priceUrl).catch(()=>{})
  let price = data?.data || 0 
  saveLocal(LOCAL_CACHE_KEYS.COIN_PRICE,JSON.stringify({price}))
  return price
}
