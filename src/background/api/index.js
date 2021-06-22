/**
 * 所有的网络请求在这里进行
 */

import { BASE_INFO_URL, GQL_URL, TRANSACTION_URL, TX_LIST_LENGTH } from "../../../config";
import { commonFetch, startFetchMyMutation, startFetchMyQuery } from "../request";
import { getBalanceBody, getStackTxSend, getTxHistoryBody, getTxSend, getTxStatusBody ,getPendingTxBody, getBalanceBatchBody} from './gqlparams';

/**
 * 获取余额
 */
export async function getBalance(address) {
  let txBody = getBalanceBody(address)
  let result = await startFetchMyQuery(txBody, GQL_URL)
  return result
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
 * 获取交易记录
 */
export async function getTxHistory(address) {
  let txBody = getTxHistoryBody(address)
  let res = await startFetchMyQuery(txBody, GQL_URL)
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
}
/**
 * 转账
 */
export async function sendTx(payload,signature){
  const variables = _getGQLVariables(payload, signature, true)
  let txBody =  getTxSend(!!variables.rawSignature)
  let res = await startFetchMyMutation(txBody, GQL_URL, variables);
  return res
}
/**
 * 质押
 */
export async function sendStackTx(payload,signature){
  const variables = _getGQLVariables(payload, signature, false)
  let txBody =  getStackTxSend(!!variables.rawSignature)
  let res = await startFetchMyMutation(txBody, GQL_URL, variables);
  return res
}


/**
 * 请求链上基础信息，如块高，epoch时间
 * @returns {Promise<{error: *}>}
 */
export async function fetchDaemonStatus() {
  const query = `
  query MyQuery {
    daemonStatus {
      stateHash
      blockchainLength
      consensusConfiguration {
        epochDuration
        slotDuration
        slotsPerEpoch
      }
    }
  }
  `;
  let res = await startFetchMyQuery(query, GQL_URL);
  return res;
}

export async function fetchBlockInfo(stateHash) {
  const query = `query MyQuery {
    block(stateHash: "${stateHash}") {
      protocolState {
        consensusState {
          epoch
          slot
        }
      }
    }
  }`

  let res = await startFetchMyQuery(query, GQL_URL);
  return res;
}

export async function fetchDelegationInfo(publicKey) {
  const query = `query MyQuery {
  account(publicKey: "${publicKey}") {
      delegate
    }
  }
  `;
// /validators/
  let res = await startFetchMyQuery(query, GQL_URL);
  return res;
}

export async function fetchValidatorDetail(id) {
  const data = await fetch( `${TRANSACTION_URL}/validators/${id}`).then((res)=>res.json())
  return data;
}
export async function fetchStakingList() {
  const data = await fetch(TRANSACTION_URL+'/validators').then((res)=>res.json())
  return data;
}

/**
 * 获取手续费推荐
 */
export async function getFeeRecom(){
  let feeUrl = BASE_INFO_URL+"minter_fee.json"
  const result = await fetch(feeUrl).then((res)=>res.json()).catch(err=>[])
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
  let txList = await commonFetch(txUrl).catch(error=>{
    return {error}
   })
   if(txList.error){
    return []
   }
   return txList

}

/**
 * 获取pending交易记录
 * @param {*} address
 * @returns
 */
export async function getPendingTxList(address){
  let txBody = getPendingTxBody(address)
  let result = await startFetchMyQuery(txBody, GQL_URL)
  let list =  result.pooledUserCommands ||[]
  return list
}

/**
 * 获取余额
 */
 export async function getBalanceBatch(addressList) {
  let txBody = getBalanceBatchBody(addressList)
  let result = await startFetchMyQuery(txBody, GQL_URL)
  return result
}

