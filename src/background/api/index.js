/**
 * 所有的网络请求在这里进行
 */

import { BASE_INFO_URL, GQL_URL, TRANSACTION_URL, TX_LIST_LENGTH } from "../../../config";
import { commonFetch, startFetchMyMutation, startFetchMyQuery } from "../request";
import { getBalanceBody, getStakeTxSend, getTxHistoryBody, getTxSend, getTxStatusBody ,getPendingTxBody, getBalanceBatchBody, getDaemonStatusBody, getBlockInfoBody, getDelegationInfoBody} from './gqlparams';

/**
 * 获取余额
 */
export async function getBalance(address) {
  let txBody = getBalanceBody(address)
  let result = await startFetchMyQuery(txBody, GQL_URL,"extensionAccountInfo").catch((err)=>err)
  return {address,account:result}
}
/**
 * 获取交易状态
 * @param {*} paymentId
 */
export async function getTxStatus(paymentId) {
  let txBody = getTxStatusBody(paymentId)
  let result = await startFetchMyQuery(txBody, GQL_URL)
  return result
}

/**
 * 转账
 */
export async function sendTx(payload,signature){
  let txBody =  getTxSend(payload,signature)
  let res = await startFetchMyMutation(txBody, GQL_URL);
  return res
}
/**
 * 质押
 */
export async function sendStakeTx(payload,signature){
  let txBody =  getStakeTxSend(payload,signature)
  let res = await startFetchMyMutation(txBody, GQL_URL);
  return res
}


/**
 * 请求链上基础信息，如块高，epoch时间
 * @returns {Promise<{error: *}>}
 */
export async function fetchDaemonStatus() {
  const query = getDaemonStatusBody()
  let res = await startFetchMyQuery(query, GQL_URL);
  return res;
}

export async function fetchBlockInfo(stateHash) {
  const query = getBlockInfoBody(stateHash)
  let res = await startFetchMyQuery(query, GQL_URL);
  return res;
}

export async function fetchDelegationInfo(publicKey) {
  const query = getDelegationInfoBody(publicKey)
  let res = await startFetchMyQuery(query, GQL_URL,"extensionAccountInfo");
  return res;
}

export async function fetchValidatorDetail(id) {
  const data = await commonFetch( `${TRANSACTION_URL}/validators/${id}`)
  return data;
}
export async function fetchStakingList() {
  const data = await commonFetch(TRANSACTION_URL+'/validators')
  return data;
}

export async function sendPayment(payload, signature) {
  const mutation = getTxSend(payload, signature)
  let res = await startFetchMyMutation(mutation, GQL_URL)
  return res;
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
export async function getAboutInfo(){
  let feeUrl = BASE_INFO_URL+"about_us.json"
  let result = await commonFetch(feeUrl).catch(error=>{
   return error
  })
  return result
}



/**
 * 交易记录
 * @param {*} address
 * @returns
 */
export async function getTransactionList(address){
  let txUrl = TRANSACTION_URL+ "/transactions?account="+address +"&limit="+TX_LIST_LENGTH//TRANSACTION_URL+address
  let txList = await commonFetch(txUrl).catch(()=>[])
   return {txList,address}

}

/**
 * 获取pending交易记录
 * @param {*} address
 * @returns
 */
export async function getPendingTxList(address){
  let txBody = getPendingTxBody(address)
  let result = await startFetchMyQuery(txBody, GQL_URL,"extensionAccountInfo").catch(()=>[])
  let list =  result.pooledUserCommands ||[]
  return {txList:list,address}
}

/**
 * 获取余额
 */
 export async function getBalanceBatch(addressList) {
  let txBody = getBalanceBatchBody(addressList)
  let result = await startFetchMyQuery(txBody, GQL_URL).catch(()=>{})
  return result
}

