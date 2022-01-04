import BigNumber from "bignumber.js";
import { cointypes } from '../../../config';
import { getLanguage } from '../../i18n';
import { getCurrentNetConfig, getRealErrorMsg } from '../../utils/utils';
import { NET_CONFIG_TYPE } from '../../constant/walletType';

async function getSignClient(){
    let netConfig = getCurrentNetConfig()
    let netType = ''
    const { default: Client } = await import('mina-signer')
    if(netConfig.netType){
      netType = netConfig.netType
    }
    let client
    if(netType === NET_CONFIG_TYPE.Devnet){
        client = new Client({ network: "testnet" });
    }else{
        client = new Client({ network: "mainnet" });
    }
    return client
}

/**
 * 获取签名交易
 * @param {*} privateKey
 * @param {*} fromAddress
 * @param {*} toAddress
 * @param {*} amount
 * @param {*} fee
 * @param {*} nonce
 * @param {*} memo
 */
export async  function signPayment(privateKey, fromAddress, toAddress, amount, fee, nonce, memo) {
    let signedPayment
    try {
        let signClient = await getSignClient()
        let decimal = new BigNumber(10).pow(cointypes.decimals)
        let sendFee = new BigNumber(fee).multipliedBy(decimal).toNumber()
        let sendAmount = new BigNumber(amount).multipliedBy(decimal).toNumber()
        signedPayment = signClient.signPayment({
            to: toAddress,
            from: fromAddress,
            amount: sendAmount,
            fee: sendFee,
            nonce: nonce,
            memo
        }, privateKey)
    } catch (err) {
        let errorMessage = getRealErrorMsg(err)||getLanguage("buildFailed")
        signedPayment = { error: { message: errorMessage } }
    }
    return signedPayment
}

export async function stakePayment(privateKey, fromAddress, toAddress, fee, nonce, memo) {
    let signedStakingPayment
    try {
        let signClient = await getSignClient()
        let decimal = new BigNumber(10).pow(cointypes.decimals)
        let sendFee = new BigNumber(fee).multipliedBy(decimal).toNumber()
        signedStakingPayment = signClient.signStakeDelegation({
            to: toAddress,
            from: fromAddress,
            fee: sendFee,
            nonce: nonce,
            memo,
        }, privateKey);
    } catch (error) {
        signedStakingPayment = { error: { message: getLanguage("buildFailed") } }
    }
    return signedStakingPayment
}


/**
 * build transaction body
 * @param {*} privateKey 
 * @param {*} fromAddress 
 * @param {*} message
 * @returns
 */
export async function signMessagePayment(privateKey, fromAddress, message) {
    let signedResult
    try {
        let keys = {
            privateKey: privateKey,
            publicKey: fromAddress
        }
        let signClient = await getSignClient()
        signedResult = signClient.signMessage(message, keys)
        signedResult = signedResult.signature
    } catch (error) {
        signedResult = { error: { message: getLanguage("buildFailed") } }
    }
    return signedResult
}


export async function verifyMessage(publicKey, signature, payload) {
    let verifyResult
    try {
        let realMessage = {
            data:{
                message: payload,
                publicKey: publicKey
            },
            signature:{
                signature:signature,
                signer: publicKey,
                string: payload
            }
        }
        let signClient = await getSignClient()
        verifyResult = signClient.verifyMessage(realMessage)
    } catch (error) {
        verifyResult = { error: { message: "verify failed" } }
    }
    return verifyResult
}
