export function getTxStatusBody(): string {
  return `
  query txStatus($paymentId:ID! ) {
    transactionStatus(payment: $paymentId)
  }
  `;
}

function getStakeTxSendWithRawSignature(): string {
  return `
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
`;
}

function getStakeTxSendWithScalarField(): string {
  return `
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
`;
}

/**
 * get delegation mutation body, for ledger and common account
 * @param {*} isRawSignature
 * @returns
 */
export function getStakeTxSend(isRawSignature: boolean): string {
  if (isRawSignature) {
    return getStakeTxSendWithRawSignature();
  } else {
    return getStakeTxSendWithScalarField();
  }
}

function getTxSendWithRawSignature(): string {
  return `
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
`;
}

function getTxSendWithScalarField(): string {
  return `
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
`;
}

/**
 * get payment mutation body, for ledger and common account
 * @param {*} isRawSignature
 */
export function getTxSend(isRawSignature: boolean): string {
  if (isRawSignature) {
    return getTxSendWithRawSignature();
  } else {
    return getTxSendWithScalarField();
  }
}

/**
 * get pending transaction, payment, delegation
 * @returns
 */
export function getPendingTxBody(): string {
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
  `;
}

function balanceBodyBase(index: number): string {
  return `
  account${index}: account (publicKey: $account${index}) {
    balance {
      total
    }
    publicKey
  }
  `;
}

/**
 * get account balance for batch request
 * @param {*} addressArrayLength
 * @returns
 */
export function getBalanceBatchBody(addressArrayLength: number): string {
  const variablesDeclare = new Array(addressArrayLength)
    .fill(null)
    .map((_, i) => `$account${i}:PublicKey!`)
    .join(",");
  const addressesQueryContent = new Array(addressArrayLength)
    .fill(null)
    .map((_, index) => balanceBodyBase(index));
  return `
  query batchBalance(${variablesDeclare}) {
    ${addressesQueryContent}
  }
  `;
}

/**
 * get daemon epoch and slot info
 * @returns
 */
export function getDaemonStatusBody(): string {
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
  `;
}

/**
 * get current block info
 * @returns
 */
export function getBlockInfoBody(): string {
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
  `;
}

/**
 * get delegation state by publicKey
 * @returns
 */
export function getDelegationInfoBody(): string {
  return `
  query delegationInfo($publicKey: PublicKey!) {
    account(publicKey: $publicKey) {
        delegate
      }
    }
  `;
}

/**
 * get zkApp mutation body
 * @returns
 */
export function getPartyBody(): string {
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
  `;
}

/**
 * get transaction history
 * archive node
 * @returns
 */
export function getTxHistoryBody(): string {
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
  `;
}

/**
 * get zkApp transaction status
 * @returns
 */
export function getQATxStatusBody(): string {
  return `
  query txStatus($zkappTransaction:ID) {
    transactionStatus(zkappTransaction: $zkappTransaction)
  }
  `;
}

/**
 * get zkApp transaction
 * archive node
 * @returns
 */
export function getZkAppTransactionListBody(): string {
  return `
  query zkApps($publicKey: String,$limit:Int,$tokenId: String) {
    zkapps(limit: $limit, query: {
      publicKey: $publicKey,tokenId:$tokenId}, sortBy: DATETIME_DESC) {
        hash
    dateTime
    failureReason {
      index
      failures
    }
    zkappCommand {
      feePayer {
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
         	tokenId 
          balanceChange{
            magnitude
            sgn
          }
          update{
            appState
            tokenSymbol
            zkappUri
          }
        }
      }
    }
    }
  }
  `;
}

/**
 * get pending tx history by publicKey
 * @returns
 */
export function getPendingZkAppTxBody(): string {
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
  `;
}

export function getFetchAccountBody(): string {
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
export function getNetworkIDBody(): string {
  return `
  query myQuery {
    networkID
  }
  `;
}

/**
 * get all token assets by publicKey
 * @returns
 */
export function getTokenQueryBody(): string {
  return `
  query tokenQueryBody($publicKey: PublicKey!) {
    accounts(publicKey: $publicKey) {
      balance {
        total
        liquid
      }
      inferredNonce
      delegateAccount {
        publicKey
      }
      tokenId
      publicKey
      zkappUri
    }
  }
  `;
}

/**
 * get token info by tokenIds
 * @param {*} tokenIds
 * @returns
 */
export function getTokenInfoBodyV2(tokenIds: string[]): string {
  const queryFields = tokenIds
    .map((tokenId) => {
      return `
      ${tokenId}: tokenOwner(tokenId: "${tokenId}") {
        publicKey
        tokenSymbol
        zkappState
      }
    `;
    })
    .join("\n");

  return `
    query {
      ${queryFields}
    }
  `;
}

/**
 * get token state between token and account
 * @returns
 */
export function getTokenStateBody(): string {
  return `
  query tokenState($publicKey: PublicKey!,$tokenId: TokenId!) {
    account(publicKey: $publicKey, token: $tokenId) {
      balance {
        total
      }
    }
  }
  `;
}

export function getAllTransactionListBody(): string {
  return `
  query fetchTxListQuery($publicKey: String,$limit:Int,$tokenId: String) {
  fullTransactions(
    limit: $limit
    query: {
      publicKey: $publicKey,
    tokenId:$tokenId}
  ) {
    nonce
    timestamp
    kind
    body {
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
    zkAppBody {
       hash
    dateTime
    failureReasons {
      index
      failures
    }
    zkappCommand {
      feePayer {
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
         	tokenId 
          balanceChange{
            magnitude
            sgn
          }
          update{
            appState
            tokenSymbol
            zkappUri
          }
        }
      }
    }
    }
  }
}
  `;
}

export function getZekoFeeBody(): string {
  return `
  query FeePerWeight($weight: Int!) { feePerWeightUnit(weight: $weight) }
  `;
}
