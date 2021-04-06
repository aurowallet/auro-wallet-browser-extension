import assert from 'assert'
import accountData from "../data/account_service_test.json"
import * as Account from "../../src/background/accountService"

describe('Account Util Test', function () {
    let mnemonic = "strike robot soon rug census all intact oil turtle burst into habit"

    describe('generate Mnemonic', function () {
        it('generate & validate mnemonic', async function () {
            let mne = Account.generateMne()
            let result = Account.validateMnemonic(mne)
            assert.ok(result)
        })
    })

    describe('import Wallet By Mnemonic', function () {
        it('importWalletByMnemonic', async function () {
            let account = await Account.importWalletByMnemonic(mnemonic)
            assert.strictEqual(
                JSON.stringify(account),
                JSON.stringify(accountData.importWalletByMnemonic)
            );
        })
    })

    describe('import Wallet', function () {
        it('importWalletByKeystore', async function () {
            let account = await Account.importWalletByKeystore(
                JSON.stringify(accountData.importWalletByKeystore.keystore),
                accountData.importWalletByKeystore.password)
            assert.strictEqual(
                JSON.stringify(account),
                JSON.stringify(accountData.importWalletByKeystore.result)
            );
        })
        it('importWalletByPrivateKey', async function () {
            let account = await Account.importWalletByPrivateKey(accountData.importWalletByPrivateKey.privateKey)
            assert.strictEqual(
                JSON.stringify(account),
                JSON.stringify(accountData.importWalletByPrivateKey.result)
            );
        })
    })

})