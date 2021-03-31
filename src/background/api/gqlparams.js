/**
 * 返回地址余额
 */
export function getBalanceBody(publicKey) {
  return `
  query MyQuery {
    account(publicKey: "${publicKey}") {
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
 * @param {*} from
 * @param {*} limit
 * @param {*} sortBy
 */
export function getTxHistoryBody(from = "B62qqVN4og5PTPL1vgn5t9LH2oXooy3VqSRzXC6BUQmBWM2pZU6xABE", limit = 20, sortBy = "DATETIME_DESC") {
  return `
  query MyQuery {
    transactions(limit: ${limit}, sortBy: ${sortBy}, query: {from: "${from}"}) {
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


export function getTxStatusBody(paymentId) {
  return `
  query MyQuery {
    transactionStatus(payment: "${paymentId}")
  }
  `
}



export function getStackTxSend(input, signature) {
  let fee = input.fee
  let to = input.to
  let from = input.from
  let nonce = input.nonce
  let memo = input.memo || ""
  let validUntil = input.validUntil
  let field = signature.field || ""
  let rawSignature = signature.rawSignature || ""
  let scalar = signature.scalar || ""
  return (`
mutation MyMutation {
  sendDelegation(
    input: {
      fee: "${fee}",
      to: "${to}",
      from: "${from}",
      memo: "${memo}",
      nonce: "${nonce}",
      validUntil: "${validUntil}"
    }, 
    signature: {
      `+
    (field ? `field: "${field}",
      scalar: "${scalar}",` : "")
    + (rawSignature ? `rawSignature: "${rawSignature}",` : "")+
    `
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

/**
 *
 * @param {*} from
 * @param {*} limit
 * @param {*} sortBy
 */
export function getTxSend(input, signature) {
  let fee = input.fee
  let amount = input.amount
  let to = input.to
  let from = input.from
  let nonce = input.nonce
  let memo = input.memo || ""
  let validUntil = input.validUntil

  let field = signature.field || ""
  let rawSignature = signature.rawSignature || ""
  let scalar = signature.scalar || ""
  return (`
mutation MyMutation {
  sendPayment(
    input: {
      fee: "${fee}",
      amount: "${amount}",
      to: "${to}",
      from: "${from}",
      memo: "${memo}",
      nonce: "${nonce}",
      validUntil: "${validUntil}"
    }, 
    signature: {
      `+
      (field ? `field: "${field}",
        scalar: "${scalar}",` : "")
      + (rawSignature ? `rawSignature: "${rawSignature}",` : "")+
      `
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


export function getPendingTxBody(publicKey) {
  return `
  query MyQuery {
    pooledUserCommands(publicKey: "${publicKey}") {
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

function balanceBodyBase(address){
  return `
  ${address}: accounts (publicKey: "${address}") {
    balance {
      total
    }
  }
  `
}

export function getBalanceBatchBody(addressList){
  let realList = []
  if(!Array.isArray(addressList)){
    realList.push(addressList)
  }else{
    realList = addressList
  }
  let realBody = realList.map((address)=>balanceBodyBase(address))
  return`
  query MyQuery {
    ${realBody}
  }
  `
}