/**
 * return account balance
 */
export function getBalanceBody() {
  return `query accountBalance($publicKey: PublicKey!) {
    account(publicKey: $publicKey) {
      balance {
        total
      },
      nonce
      inferredNonce
      delegate
      publicKey
    }
  }
  
  `
}


export function getTxStatusBody() {
  return `
  query txStatus($paymentId:ID! ) {
    transactionStatus(payment: $paymentId)
  }
  `
}

function getStakeTxSendWithRawSignature() {
  return (`
mutation stakeTx($fee:UInt64!, 
$to: PublicKey!, $from: PublicKey!, $nonce:UInt32, $memo: String,
$validUntil: UInt32,$rawSignature: String) {
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
mutation stakeTx($fee:UInt64!,
$to: PublicKey!, $from: PublicKey!, $nonce:UInt32, $memo: String,
$validUntil: UInt32, $scalar: String, $field: String) {
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
mutation sendTx($fee:UInt64!, $amount:UInt64!,
$to: PublicKey!, $from: PublicKey!, $nonce:UInt32, $memo: String,
$validUntil: UInt32,$rawSignature: String!
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
mutation sendTx($fee:UInt64!, $amount:UInt64!,
$to: PublicKey!, $from: PublicKey!, $nonce:UInt32, $memo: String,
$validUntil: UInt32,$scalar: String!, $field: String!
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
  query pendingTx($publicKey: PublicKey) {
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
    publicKey
  }
  `
}

export function getBalanceBatchBody(addressArrayLength){
  const variablesDeclare = new Array(addressArrayLength).fill(null).map((_, i)=>`$account${i}:PublicKey!`).join(',')
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
  query blockInfo($stateHash: String) {
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
  query delegationInfo($publicKey: PublicKey!) {
    account(publicKey: $publicKey) {
        delegate
      }
    }
  `
}


export function getPartyBody(){
  return `
  mutation sendZkapp($zkappCommandInput:ZkappCommandInput!){
    sendZkapp(input: {
      zkappCommand: $zkappCommandInput
    }) {
      zkapp {
        hash
        id
        zkappCommand {
          memo
        }
      }
    }
  }
  `
}

/**
 * return tx history
 */
 export function getTxHistoryBody() {
  return `query txHistory($publicKey: String,$limit:Int) {
    transactions(limit: $limit, sortBy: DATETIME_DESC, query: {
      canonical: true,
      OR: [{
        to: $publicKey
      }, {
        from: $publicKey
      }]
    }) {
      fee
      from
      to
      nonce
      amount
      memo
      hash
      kind
      dateTime
      failureReason
    }
  }
  `
}



/**
 * return deletion total
 */
 export function getDeletionTotalBody() {
  return `query delegationTotals($publicKey: String,$epoch:Int) {
    stake(query: {epoch: $epoch, public_key: $publicKey}) {
      delegationTotals {
        countDelegates
        totalDelegated
      }
    }
  }
  
  `
}

export function getQATxStatusBody() {
  return `
  query txStatus($zkappTransaction:ID) {
    transactionStatus(zkappTransaction: $zkappTransaction)
  }
  `
}


export function getZkAppTransactionListBody() {
  return `
  query zkApps($publicKey: String,$limit:Int) {
    zkapps(limit: $limit, query: {
      zkappCommand: {feePayer: 
      {body: {publicKey: $publicKey}}}}, sortBy: DATETIME_DESC) {
        hash
    dateTime
    failureReason {
      failures
    }
    zkappCommand {
      feePayer {
        authorization
        body {
          nonce
          publicKey
          fee
        }
      }
      memo
      accountUpdates {
        body {
          publicKey
          
        }
      }
    }
    }
  }
  `
}

export function getPendingZkAppTxBody() {
  return `
  query pendingZkTx($publicKey: PublicKey) {
    pooledZkappCommands(publicKey: $publicKey) {
      hash
      failureReason {
        index
        failures
      }
      zkappCommand {
        feePayer {
          body {
            publicKey
            fee
            validUntil
            nonce
          }
          authorization
        }
        accountUpdates {
          body {
            publicKey
            tokenId
            update {
              appState
              delegate
              verificationKey {
                data
                hash
              }
              permissions {
                editState
                access
                send
                receive
                setDelegate
                setPermissions
                setVerificationKey {
                  auth
                  txnVersion
                }
                setZkappUri
                editActionState
                setTokenSymbol
                incrementNonce
                setVotingFor
                setTiming
              }
              zkappUri
              tokenSymbol
              timing {
                initialMinimumBalance
                cliffTime
                cliffAmount
                vestingPeriod
                vestingIncrement
              }
              votingFor
            }
            balanceChange {
              magnitude
              sgn
            }
            incrementNonce
            events
            actions
            callData
            callDepth
            preconditions {
              network {
                snarkedLedgerHash
                blockchainLength {
                  lower
                  upper
                }
                minWindowDensity {
                  lower
                  upper
                }
                totalCurrency {
                  lower
                  upper
                }
                globalSlotSinceGenesis {
                  lower
                  upper
                }
                stakingEpochData {
                  ledger {
                    hash
                    totalCurrency {
                      lower
                      upper
                    }
                  }
                  seed
                  startCheckpoint
                  lockCheckpoint
                  epochLength {
                    lower
                    upper
                  }
                }
                nextEpochData {
                  ledger {
                    hash
                    totalCurrency {
                      lower
                      upper
                    }
                  }
                  seed
                  startCheckpoint
                  lockCheckpoint
                  epochLength {
                    lower
                    upper
                  }
                }
              }
              account {
                balance {
                  lower
                  upper
                }
                nonce {
                  lower
                  upper
                }
                receiptChainHash
                delegate
                state
                actionState
                provedState
                isNew
              }
              validWhile {
                lower
                upper
              }
            }
            useFullCommitment
            implicitAccountCreationFee
            mayUseToken {
              parentsOwnToken
              inheritFromParent
            }
            authorizationKind {
              isSigned
              isProved
              verificationKeyHash
            }
          }
          authorization {
            proof
            signature
          }
        }
        memo
      }
    }
  }
  `
}
 
export function getFetchAccountBody(){
  return `
  query account($publicKey: PublicKey!,$tokenId:TokenId) {
    account(publicKey: $publicKey, token: $tokenId) {
      publicKey
      token
      nonce
      balance {
        total
      }
      tokenSymbol
      receiptChainHash
      timing {
        initialMinimumBalance
        cliffTime
        cliffAmount
        vestingPeriod
        vestingIncrement
      }
      permissions {
        editState
        access
        send
        receive
        setDelegate
        setPermissions
        setVerificationKey
        setZkappUri
        editActionState
        setTokenSymbol
        incrementNonce
        setVotingFor
        setTiming
      }
      delegateAccount {
        publicKey
      }
      votingFor
      zkappState
      verificationKey {
        verificationKey
        hash
      }
      actionState
      provedState
      zkappUri
    }
  }
  
  `;
}


/**
 * get networkID body
 * @returns 
 */
export function getNetworkIDBody() {
  return `
  query myQuery {
    networkID
  }
  `
}