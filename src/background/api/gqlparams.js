/**
 * 返回地址余额
 */
export function getBalanceBody() {
  return `query accountBalance($publicKey: String!) {
    account(publicKey: $publicKey) {
      balance {
        total
      },
      nonce
      inferredNonce
      delegate
    }
  }
  
  `
}
/**
 * 获取交易记录
 */
export function getTxHistoryBody() {
  return `
  query txHistory($limit: Int!, $sortBy: String!, $from: String!) {
    transactions(limit: $limit, sortBy: $sortBy, query: {from: $from}) {
      fee
      canonical
      from
      to
      nonce
      amount
      memo
      hash
      kind
      dateTime
      blockHeight
    }
  }
  `
}


export function getTxStatusBody() {
  return `
  query txStatus($paymentId:String! ) {
    transactionStatus(payment: $paymentId)
  }
  `
}

function getStakeTxSendWithRawSignature() {
  return (`
mutation stakeTx($fee:String!, $amount:String!, 
$to: String!, $from: String!, $nonce:String!, $memo: String!,
$validUntil: String!,$rawSignature: String) {
  sendDelegation(
    input: {
      fee: $fee,
      to: $to,
      from: $from,
      memo: $memo,
      nonce: $nonce,
      validUntil: $validUntil
    }, 
    signature: {rawSignature: $rawSignature}) {
    delegation {
      amount
      fee
      feeToken
      from
      hash
      id
      isDelegation
      memo
      nonce
      kind
      to
    }
  }
}
`)
}

function getStakeTxSendWithScalarField() {
  return (`
mutation stakeTx($fee:String!, $amount:String!, 
$to: String!, $from: String!, $nonce:String!, $memo: String!,
$validUntil: String!, $scalar: String, $field: String) {
  sendDelegation(
    input: {
      fee: $fee,
      to: $to,
      from: $from,
      memo: $memo,
      nonce: $nonce,
      validUntil: $validUntil
    }, 
    signature: {
    field: $field, scalar: $scalar
    }) {
    delegation {
      amount
      fee
      feeToken
      from
      hash
      id
      isDelegation
      memo
      nonce
      kind
      to
    }
  }
}
`)
}

export function getStakeTxSend(isRawSignature) {
  if (isRawSignature) {
    return getStakeTxSendWithRawSignature()
  } else {
    return getStakeTxSendWithScalarField()
  }
}

function getTxSendWithRawSignature() {
  return (`
mutation sendTx($fee:String!, $amount:String!,
$to: String!, $from: String!, $nonce:String!, $memo: String!,
$validUntil: String!,$rawSignature: String!
) {
  sendPayment(
    input: {
      fee: $fee,
      amount: $amount,
      to: $to,
      from: $from,
      memo: $memo,
      nonce: $nonce,
      validUntil: $validUntil
    }, 
    signature: {
      rawSignature: $rawSignature
    }) {
    payment {
      amount
      fee
      feeToken
      from
      hash
      id
      isDelegation
      memo
      nonce
      kind
      to
    }
  }
}
`)
}
function getTxSendWithScalarField() {
  return (`
mutation sendTx($fee:String!, $amount:String!,
$to: String!, $from: String!, $nonce:String!, $memo: String!,
$validUntil: String!,$scalar: String!, $field: String!
) {
  sendPayment(
    input: {
      fee: $fee,
      amount: $amount,
      to: $to,
      from: $from,
      memo: $memo,
      nonce: $nonce,
      validUntil: $validUntil
    }, 
    signature: {
      field: $field, scalar: $scalar
    }) {
    payment {
      amount
      fee
      feeToken
      from
      hash
      id
      isDelegation
      memo
      nonce
      kind
      to
    }
  }
}
`)
}
/**
 *
 * @param {*} isRawSignature
 */
export function getTxSend(isRawSignature) {
  if (isRawSignature) {
    return getTxSendWithRawSignature()
  } else {
    return getTxSendWithScalarField()
  }
}


export function getPendingTxBody() {
  return `
  query pengdingTx($publicKey: String!) {
    pooledUserCommands(publicKey: $publicKey) {
      id
      nonce
      memo
      isDelegation
      kind
      hash
      from
      feeToken
      fee
      amount
      to
    }
  }
  `
}

function balanceBodyBase(index){
  return `
  account${index}: account (publicKey: $account${index}) {
    balance {
      total
    }
  }
  `
}

export function getBalanceBatchBody(addressArrayLength){
  const variablesDeclare = new Array(addressArrayLength).fill(null).map((_, i)=>`$account${i}:String!`).join(',')
  const addressesQueryContent = new Array(addressArrayLength).fill(null).map((address, index)=>balanceBodyBase(index))
  return`
  query batchBalance(${variablesDeclare}) {
    ${addressesQueryContent}
  }
  `
}


export function getDaemonStatusBody(){
  return `
  query daemonStatus {
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
  `
}
export function  getBlockInfoBody(){
  return `
  query blockInfo($stateHash: String!) {
    block(stateHash: $stateHash) {
      protocolState {
        consensusState {
          epoch
          slot
        }
      }
    }
  }
  `
}

export function getDelegationInfoBody(){
  return `
  query delegationInfo($publicKey: String!) {
    account(publicKey: $publicKey) {
        delegate
      }
    }
  `
}

/**
 * 返回节点版本
 */
 export function getNodeVersionBody() {
  return `
  query nodeVersion {
    version
  }
  `
}