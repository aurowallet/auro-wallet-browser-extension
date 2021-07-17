import { EXPLORER_URL, LOCK_TIME } from '../../config';
import { FROM_BACK_TO_RECORD, SET_LOCK, TX_SUCCESS } from '../constant/types';
import { getLanguage } from '../i18n';
import { getTxStatus, sendStakeTx, sendTx } from './api';
import { signPayment, stakePayment } from './lib';
import { get, removeValue, save } from './storageService';
import { ACCOUNT_TYPE } from "../constant/walletType"
import extension from 'extensionizer'

const ObservableStore = require('obs-store')
const { importWalletByMnemonic, importWalletByPrivateKey, importWalletByKeystore, generateMne } = require('./accountService')
const encryptUtils = require('../utils/encryptUtils').default

const STATUS = {
    TX_STATUS_PENDING: "PENDING",
    TX_STATUS_INCLUDED: "INCLUDED",
    TX_STATUS_UNKNOWN: "UNKNOWN"
}


const default_account_name = "Account 1"
class APIService {
    constructor() {
        this.memStore = new ObservableStore({
            isUnlocked: false,
            data: '',
            password: '',
            currentAccount: {},
            mne: ""
        })
    }
    getStore = () => {
        return this.memStore.getState()
    };
    getCreateMnemonic = (isNewMne) => {
        if (isNewMne) {
            let mnemonic = generateMne()
            this.memStore.updateState({ mne: mnemonic })
            return mnemonic
        } else {
            let mne = this.getStore().mne
            if (mne) {
                return mne
            } else {
                let mnemonic = generateMne()
                this.memStore.updateState({ mne: mnemonic })
                return mnemonic
            }
        }
    }
    filterCurrentAccount = (accountList, currentAddress) => {
        for (let index = 0; index < accountList.length; index++) {
            const account = accountList[index];
            if (account.address === currentAddress) {
                return account
            }
        }
    }
    async submitPassword(password) {
        let encryptedVault = await get("keyringData")
        try {
            let vault = await encryptUtils.decrypt(password, encryptedVault.keyringData)
            await this.migrateDate(password, vault)
            let currentAddress = vault[0].currentAddress
            let currentAccount = this.filterCurrentAccount(vault[0].accounts, currentAddress)
            this.memStore.updateState({
                data: vault,
                isUnlocked: true,
                password,
                currentAccount
            })
            return this.getAccountWithoutPrivate(currentAccount)
        } catch (error) {
            return { error: 'passwordError', type: "local" }
        }
    };
    async migrateDate(password, vault) {
        let didMigrated = false

        const migrateCheck = (dataStr) => {
            try {
                return dataStr && JSON.parse(dataStr).version !== 2
            } catch (e) {
                return false
            }
        }

        const migrate = async (data, key) => {
            if (migrateCheck(data[key])) {
                data[key] = await encryptUtils.encrypt(password, await encryptUtils.decrypt(password, data[key]))
                didMigrated = true
            }
        }

        for(let i = 0; i < vault.length; i++) {
            let wallet = vault[0];
            await migrate(wallet, 'mnemonic')
            for(let j = 0; j < wallet.accounts.length; j++) {
                let account = wallet.accounts[j]
                await migrate(account, 'privateKey')
            }
        }
        if (didMigrated) {
            let encryptData = await encryptUtils.encrypt(password, vault)
            await removeValue("keyringData")
            await save({ keyringData: encryptData })
        }
    }
    checkPassword(password) {
        return this.getStore().password === password
    }
    setLastActiveTime() {
        const timeoutMinutes = LOCK_TIME
        let localData = this.getStore().data
        let isUnlocked = this.getStore().isUnlocked
        if (localData && isUnlocked) {
            if (this.activeTimer) {
                clearTimeout(this.activeTimer)
            }
            if (!timeoutMinutes) {
                return
            }

            this.activeTimer = setTimeout(() => {
                this.setUnlockedStatus(false)
            }, timeoutMinutes * 60 * 1000)
        }

    }
    setUnlockedStatus(status) {
        let account = this.memStore.getState().currentAccount
        if (!status) {
            this.memStore.updateState({
                currentAccount: { ...account },
                password: ""
            })
            extension.runtime.sendMessage({
                type: FROM_BACK_TO_RECORD,
                action: SET_LOCK,
            });
        }
        this.memStore.updateState({ isUnlocked: status })
    };
    getCurrentAccount = async () => {
        let localAccount = await get("keyringData")
        let currentAccount = this.getStore().currentAccount
        let isUnlocked = this.getStore().isUnlocked
        if (localAccount && localAccount.keyringData) {
            currentAccount.localAccount = {
                keyringData: "keyringData"
            }
        }
        currentAccount.isUnlocked = isUnlocked
        return currentAccount
    };
    createPwd = (password) => {
        this.memStore.updateState({ password })
    }
    createAccount = async (mnemonic) => {
        this.memStore.updateState({ mne: "" })
        let wallet = await importWalletByMnemonic(mnemonic)
        let priKeyEncrypt = await encryptUtils.encrypt(this.getStore().password, wallet.priKey)
        const account = {
            address: wallet.pubKey,
            privateKey: priKeyEncrypt,
            type: ACCOUNT_TYPE.WALLET_INSIDE,
            hdPath: wallet.hdIndex,
            accountName: default_account_name,
            typeIndex: 1
        }

        let mnemonicEn = await encryptUtils.encrypt(this.getStore().password, mnemonic)

        let keyringData = []
        let data = {
            mnemonic: mnemonicEn,
            accounts: [],
            currentAddress: account.address
        }
        data.accounts.push(account)
        keyringData.push(data)
        let encryptData

        encryptData = await encryptUtils.encrypt(this.getStore().password, keyringData)
        this.memStore.updateState({ data: keyringData })
        save({ keyringData: encryptData })
        this.memStore.updateState({ currentAccount: account })
        this.setUnlockedStatus(true)

        return this.getAccountWithoutPrivate(account)
    }
    getAllAccount = () => {
        let data = this.getStore().data
        let accountList = data[0].accounts
        accountList = accountList.map((item, index) => {
            let newItem = this.getAccountWithoutPrivate(item)
            return newItem
        })
        let currentAccount = this.getStore().currentAccount
        return {
            accounts: accountList,
            currentAddress: currentAccount.address
        }
    }
    addHDNewAccount = async (accountName) => {
        let data = this.getStore().data
        let accounts = data[0].accounts

        let createList = accounts.filter((item, index) => {
            return item.type === ACCOUNT_TYPE.WALLET_INSIDE
        })
        if (createList.length > 0) {
            let maxHdIndex = createList[createList.length - 1].hdPath
            let lastHdIndex = maxHdIndex + 1
            let typeIndex = createList[createList.length - 1].typeIndex + 1

            let mnemonicEn = data[0].mnemonic
            let mnemonic = await encryptUtils.decrypt(this.getStore().password, mnemonicEn)
            let wallet = await importWalletByMnemonic(mnemonic, lastHdIndex)

            let priKeyEncrypt = await encryptUtils.encrypt(this.getStore().password, wallet.priKey)

            const account = {
                address: wallet.pubKey,
                privateKey: priKeyEncrypt,
                type: ACCOUNT_TYPE.WALLET_INSIDE,
                hdPath: lastHdIndex,
                accountName,
                typeIndex: typeIndex
            }
            data[0].currentAddress = account.address
            data[0].accounts.push(account)
            let encryptData = await encryptUtils.encrypt(this.getStore().password, data)

            this.memStore.updateState({ data: data })
            save({ keyringData: encryptData })
            this.memStore.updateState({ currentAccount: account })
            return this.getAccountWithoutPrivate(account)
        }
    };
    _checkWalletRepeat(accounts, address) {
        let error = {}
        for (let index = 0; index < accounts.length; index++) {
            const account = accounts[index];
            if (account.address === address) {
                error = { "error": 'improtRepeat', type: "local" }
                break
            }
        }
        return error;
    }
    _findWalletIndex(accounts, type) {
        let importList = accounts.filter((item, index) => {
            return item.type === type
        })
        let typeIndex = ""
        if (importList.length === 0) {
            typeIndex = 1
        } else {
            typeIndex = importList[importList.length - 1].typeIndex + 1
        }
        return typeIndex;
    }
    /**
     *  私钥导入
     */
    addImportAccount = async (privateKey, accountName) => {
        try {
            let wallet = importWalletByPrivateKey(privateKey)

            let data = this.getStore().data
            let accounts = data[0].accounts
            let error = this._checkWalletRepeat(accounts, wallet.pubKey);
            if (error.error) {
                return error
            }
            let typeIndex = this._findWalletIndex(accounts, ACCOUNT_TYPE.WALLET_OUTSIDE);

            let priKeyEncrypt = await encryptUtils.encrypt(this.getStore().password, wallet.priKey)
            const account = {
                address: wallet.pubKey,
                privateKey: priKeyEncrypt,
                type: ACCOUNT_TYPE.WALLET_OUTSIDE,//"outside",
                accountName,
                typeIndex
            }
            data[0].currentAddress = account.address
            data[0].accounts.push(account)
            let encryptData = await encryptUtils.encrypt(this.getStore().password, data)

            this.memStore.updateState({ data: data })
            save({ keyringData: encryptData })
            this.memStore.updateState({ currentAccount: account })
            return this.getAccountWithoutPrivate(account)
        } catch (error) {
            return { "error": "privateError", type: "local" }
        }

    }
    /**
     * 通过keystore导入钱包
     * @param {*} keystore
     * @param {*} password 
     * @param {*} accountName 
     * @returns 
     */
    addAccountByKeyStore = async (keystore, password, accountName) => {
        let wallet = await importWalletByKeystore(keystore, password)
        if (wallet.error) {
            return wallet
        }
        let currentAccount = await this.addImportAccount(wallet.priKey, accountName)
        return currentAccount
    }
    addWatchModeAccount = async (address, accountName) => {
        try {
            let data = this.getStore().data
            let accounts = data[0].accounts
            let error = this._checkWalletRepeat(accounts, address);
            if (error.error) {
                return error
            }
            let typeIndex = this._findWalletIndex(accounts, ACCOUNT_TYPE.WALLET_WATCH);
            const account = {
                address: address,
                type: ACCOUNT_TYPE.WALLET_WATCH,
                accountName,
                typeIndex
            }
            data[0].currentAddress = account.address
            data[0].accounts.push(account)
            let encryptData = await encryptUtils.encrypt(this.getStore().password, data)

            this.memStore.updateState({ data: data })
            save({ keyringData: encryptData })
            this.memStore.updateState({ currentAccount: account })
            return this.getAccountWithoutPrivate(account)
        } catch (error) {
            return { "error": JSON.stringify(error) }
        }
    }
    /**
     * 导入ledger钱包
     */
    addLedgerAccount = async (address, accountName, ledgerPathAccountIndex) => {
        try {
            let data = this.getStore().data
            let accounts = data[0].accounts
            let error = this._checkWalletRepeat(accounts, address);
            if (error.error) {
                return error
            }
            let typeIndex = this._findWalletIndex(accounts, ACCOUNT_TYPE.WALLET_LEDGER);

            const account = {
                address: address,
                type: ACCOUNT_TYPE.WALLET_LEDGER,
                accountName,
                hdPath: ledgerPathAccountIndex,
                typeIndex
            }
            data[0].currentAddress = account.address
            data[0].accounts.push(account)
            let encryptData = await encryptUtils.encrypt(this.getStore().password, data)

            this.memStore.updateState({ data: data })
            save({ keyringData: encryptData })
            this.memStore.updateState({ currentAccount: account })
            return this.getAccountWithoutPrivate(account)
        } catch (error) {
            return { "error": JSON.stringify(error) }
        }
    }
    /**
     * 设置当前账户
     */
    setCurrentAccount = async (address) => {
        let data = this.getStore().data
        let accounts = data[0].accounts
        let currentAccount = {}
        for (let index = 0; index < accounts.length; index++) {
            let account = accounts[index];
            if (account.address === address) {
                currentAccount = account
                data[0].currentAddress = address

                let encryptData = await encryptUtils.encrypt(this.getStore().password, data)
                this.memStore.updateState({ data: data })
                save({ keyringData: encryptData })
                this.memStore.updateState({ currentAccount: account })
            }
        }
        let accountList = data[0].accounts
        accountList = accountList.map((item, index) => {
            return this.getAccountWithoutPrivate(item)
        })
        return {
            accountList: accountList,
            currentAccount: this.getAccountWithoutPrivate(currentAccount),
            currentAddress: address
        }
    }
    changeAccountName = async (address, accountName) => {
        let data = this.getStore().data
        let accounts = data[0].accounts
        let account
        for (let index = 0; index < accounts.length; index++) {
            account = accounts[index];
            if (account.address === address) {
                data[0].accounts[index].accountName = accountName
                account = accounts[index]
                let encryptData = await encryptUtils.encrypt(this.getStore().password, data)
                this.memStore.updateState({ data: data })
                save({ keyringData: encryptData })
                break
            }
        }
        let newAccount = this.getAccountWithoutPrivate(account)
        return { account: newAccount }
    }
    deleteAccount = async (address, password) => {
        let isCorrect = this.checkPassword(password)
        if (isCorrect) {
            let data = this.getStore().data
            let accounts = data[0].accounts
            accounts = accounts.filter((item, index) => {
                return item.address !== address
            })
            let currentAccount = this.getStore().currentAccount
            if (address === currentAccount.address) {
                currentAccount = accounts[0]
                data[0].currentAddress = currentAccount.address
            }
            data[0].accounts = accounts
            let encryptData = await encryptUtils.encrypt(this.getStore().password, data)
            this.memStore.updateState({ data: data, currentAccount })
            save({ keyringData: encryptData })
            return this.getAccountWithoutPrivate(currentAccount)
        } else {
            return { error: 'passwordError', type: "local" }
        }
    }
    getMnemonic = async (pwd) => {
        let isCorrect = this.checkPassword(pwd)
        if (isCorrect) {
            let data = this.getStore().data
            let mnemonicEn = data[0].mnemonic
            let mnemonic = await encryptUtils.decrypt(this.getStore().password, mnemonicEn)
            return mnemonic
        } else {
            return { error: 'passwordError', type: "local" }
        }
    }
    updateSecPassword = async (oldPwd, pwd) => {
        try {
            let isCorrect = this.checkPassword(oldPwd)
            if (isCorrect) {
                let data = this.getStore().data

                let accounts = data[0].accounts

                let mnemonicEn = data[0].mnemonic
                let mnemonic = await encryptUtils.decrypt(oldPwd, mnemonicEn)
                mnemonic = await encryptUtils.encrypt(pwd, mnemonic)
                let newAccounts = []
                for (let index = 0; index < accounts.length; index++) {
                    const account = accounts[index];
                    let privateKeyEn = account.privateKey
                    let privateKey = await encryptUtils.decrypt(oldPwd, privateKeyEn)
                    privateKey = await encryptUtils.encrypt(pwd, privateKey)
                    let newAccount = {
                        ...account,
                        privateKey,
                    }
                    newAccounts.push(newAccount)
                }
                data[0].accounts = newAccounts
                data[0].mnemonic = mnemonic

                let encryptData = await encryptUtils.encrypt(pwd, data)
                this.memStore.updateState({ password: pwd })
                await removeValue("keyringData")
                await save({ keyringData: encryptData })
                return { code: 0 }
            } else {
                return { error: 'passwordError', type: "local" }
            }
        } catch (error) {
            return { error: 'passwordError', type: "local" }
        }

    }
    getPrivateKey = async (address, pwd) => {
        let isCorrect = this.checkPassword(pwd)
        if (isCorrect) {
            let data = this.getStore().data
            let accounts = data[0].accounts
            accounts = accounts.filter((item, index) => {
                return item.address === address
            })
            let nowAccount = accounts[0]
            const privateKey = await encryptUtils.decrypt(pwd, nowAccount.privateKey)
            return privateKey
        } else {
            return { error: 'passwordError', type: "local" }
        }
    }
    getCurrentPrivateKey = async () => {
        let currentAccount = this.getStore().currentAccount
        let password = this.getStore().password
        const privateKey = await encryptUtils.decrypt(password, currentAccount.privateKey)
        return privateKey
    }
    getAccountWithoutPrivate = (account) => {
        let newAccount = { ...account }
        delete newAccount.privateKey;
        return newAccount
    }
    sendTransaction = async (params) => {
        try {
            let fromAddress = params.fromAddress
            let toAddress = params.toAddress
            let amount = params.amount
            let fee = params.fee
            let nonce = params.nonce
            let memo = params.memo
            const privateKey = await this.getCurrentPrivateKey()
            let signedTx = signPayment(privateKey, fromAddress, toAddress, amount, fee, nonce, memo)
            if (signedTx.error) {
                return { error: signedTx.error }
            }
            let postRes = await sendTx(signedTx.payload, signedTx.signature).catch(error => { error })
            return { ...postRes }
        } catch (err) {
            return { error: err }
        }
    }
    sendStakTransaction = async (params) => {
        try {
            let { fromAddress, toAddress, fee, nonce, memo } = params;
            const privateKey = await this.getCurrentPrivateKey()
            let signedTx = stakePayment(privateKey, fromAddress, toAddress, fee, nonce, memo)
            if (signedTx.error) {
                return { error: signedTx.error }
            }
            let postRes = await sendStakeTx(signedTx.payload, signedTx.signature).catch(error => { error })
            return { ...postRes }
        } catch (err) {
            return { error: err }
        }
    }

    notification = (hash) => {
        let id = hash
        extension.notifications &&
            extension.notifications.onClicked.addListener(function (id) {
                let url = EXPLORER_URL + id
                extension.tabs.create({ url: url });
            });
        let title = getLanguage('notificationTitle')
        let message = getLanguage('notificationContent')
        extension.notifications.create(id, {
            title: title,
            message: message,
            iconUrl: '/img/128.png',
            type: 'basic'
        });
        return
    }
    checkTxStatus = (paymentId, hash) => {
        this.fetchTransactionStatus(paymentId, hash)
    }
    fetchTransactionStatus = (paymentId, hash) => {
        getTxStatus(paymentId).then((data) => {
            if (data && data.transactionStatus && (
                (data.transactionStatus === STATUS.TX_STATUS_INCLUDED
                    || data.transactionStatus === STATUS.TX_STATUS_UNKNOWN)
            )) {
                extension.runtime.sendMessage({
                    type: FROM_BACK_TO_RECORD,
                    action: TX_SUCCESS,
                });
                this.notification(hash)
                if (this.timer) {
                    clearTimeout(this.timer);
                    this.timer = null;
                }
            } else {
                this.timer = setTimeout(() => {
                    this.fetchTransactionStatus(paymentId, hash);
                }, 5000);
            }
        }).catch((error) => {
            this.timer = setTimeout(() => {
                this.fetchTransactionStatus(paymentId, hash);
            }, 5000);
        })
    }
}

const apiService = new APIService();
export default apiService;
