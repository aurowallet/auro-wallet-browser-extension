import "../test_help";
import assert from 'assert'
import * as AccountSign from "../../src/background/lib"
import accountSignData from "../data/sign_test.json"


describe('Sign Util Test', function () {
    it('sign transaction payment', async function () {
        let signResult = AccountSign.signPayment(
            accountSignData.signPayment.privateKey,
            accountSignData.signPayment.fromAddress,
            accountSignData.signPayment.toAddress,
            accountSignData.signPayment.amount,
            accountSignData.signPayment.fee,
            accountSignData.signPayment.nonce,
            accountSignData.signPayment.memo
        )
        assert.strictEqual(
            JSON.stringify(signResult),
            JSON.stringify(accountSignData.signPayment.result)
        );
    })
    it('sign staking payment', async function () {
        let signStakingResult = AccountSign.stakePayment(
            accountSignData.stakePayment.privateKey,
            accountSignData.stakePayment.fromAddress,
            accountSignData.stakePayment.toAddress,
            accountSignData.stakePayment.fee,
            accountSignData.stakePayment.nonce,
            accountSignData.stakePayment.memo
        )
        assert.strictEqual(
            JSON.stringify(signStakingResult),
            JSON.stringify(accountSignData.stakePayment.result)
        );
    })

})