import * as CodaSDK from '@o1labs/client-sdk';
import BigNumber from "bignumber.js";
import { cointypes } from '../../../config';
import { getLanguage } from '../../i18n';

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
export function signPayment(privateKey, fromAddress, toAddress, amount, fee, nonce, memo) {
    let signedPayment
    try {
        let keys = {
            privateKey: privateKey,
            publicKey: fromAddress
        }
        let decimal = new BigNumber(10).pow(cointypes.decimals)
        let sendFee = new BigNumber(fee).multipliedBy(decimal).toNumber()
        let sendAmount = new BigNumber(amount).multipliedBy(decimal).toNumber()
        signedPayment = CodaSDK.signPayment({
            to: toAddress,
            from: keys.publicKey,
            amount: sendAmount,
            fee: sendFee,
            nonce: nonce,
            memo
        }, keys)
    } catch (error) {
        signedPayment = { error: { message: getLanguage("buildFailed") } }
    }
    return signedPayment
}

export function stakePayment(privateKey, fromAddress, toAddress, fee, nonce, memo) {
    let signedStakingPayment
    try {


        let keys = {
            privateKey: privateKey,
            publicKey: fromAddress
        }
        let decimal = new BigNumber(10).pow(cointypes.decimals)
        let sendFee = new BigNumber(fee).multipliedBy(decimal).toNumber()
        signedStakingPayment = CodaSDK.signStakeDelegation({
            to: toAddress,
            from: keys.publicKey,
            fee: sendFee,
            nonce: nonce,
            memo,
            // validUntil,
        }, keys);
    } catch (error) {
        signedStakingPayment = { error: { message: getLanguage("buildFailed") } }
    }
    return signedStakingPayment
}
