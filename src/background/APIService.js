import { EXPLORER_URL } from '../../config';
import { FROM_BACK_TO_RECORD, TX_SUCCESS } from '../constant/types';
import { getLanguage } from '../i18n';
import { getTxStatus, sendStackTx, sendTx } from './api';
import { signPayment, stakePayment } from './lib';
import { get, removeValue, save } from './storageService';
import {ACCOUNT_TYPE} from "../constant/walletType"

const ObservableStore = require('obs-store')
const { importWalletByMnemonic, importWalletByPrivateKey, importWalletByKeystore } = require('./accountService')
const encryptUtils = require('browser-passworder')

const STATUS = {
    TX_STATUS_PENDING: "TX_STATUS_PENDING",
    TX_STATUS_INCLUDED: "TX_STATUS_INCLUDED",
    TX_STATUS_UNKNOWN: "TX_STATUS_UNKNOWN"
}


const default_account_name = "Account 1"
class APIService {
    constructor() {
        this.memStore = new ObservableStore({
            isUnlocked: false,//需要处理一下，输完密码就解锁，还是备份完助记词在解锁
            data: '',
            password: '',
            currentAccount: {},
        })
    }
    getStore = () => {
        return this.memStore.getState()
    };
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
            const vault = await encryptUtils.decrypt(password, encryptedVault.keyringData)
            let currentAddress = vault[0].currentAddress
            let currentAccount = this.filterCurrentAccount(vault[0].accounts, currentAddress)
            this.memStore.updateState({
                data: vault, isUnlocked: true, password,
                currentAccount
            })
            return this.getAccountWithoutPrivate(currentAccount)
        } catch (error) {
            return { error: 'passwordError',type:"local" }
        }
    };
    checkPassword(password) {
        return this.getStore().password === password
    }
    setUnlockedStatus(status) {
        let account = this.memStore.getState().currentAccount
        if (!status) {//如果是已锁定，则把私钥和助记词清除
            this.memStore.updateState({ currentAccount: { ...account } })
        }
        this.memStore.updateState({ isUnlocked: status })
    };
    getCurrentAccount = async () => {
        // 先去拿账户,有账户，
        // 则去判断是否需要锁定
        // 无账户，则直接进入欢迎页
        let localAccount = await get("keyringData")//保存在本地插件存储
        // 如果有，说明有账户,则直接返回账户
        // 如果没有，则查看是否处于锁定
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
    createAccount = async (mnemonic) => {//创建钱包是不要wallet的
        let wallet = await importWalletByMnemonic(mnemonic)
        let priKeyEncrypt = await encryptUtils.encrypt(this.getStore().password, wallet.priKey)
        const account = {
            address: wallet.pubKey,
            privateKey: priKeyEncrypt,//wallet.priKey,
            type: ACCOUNT_TYPE.WALLET_INSIDE,//"import",
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
        save({ keyringData: encryptData })//保存在本地插件存储
        // 在保存一下在 本地存储
        this.memStore.updateState({ currentAccount: account })
        // this.memStore.updateState({ isUnlocked: true })
        this.setUnlockedStatus(true)

        return this.getAccountWithoutPrivate(account)
    }
    //做一下处理
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
        // 先根据助记词生成私钥
        // 然后将地址加密
        let data = this.getStore().data
        let accounts = data[0].accounts

        let createList = accounts.filter((item, index) => {
            return item.type === ACCOUNT_TYPE.WALLET_INSIDE//"import"
        })
        if (createList.length > 0) {
            // 轮训拿到所有的index
            let maxHdIndex = createList[createList.length - 1].hdPath
            let lastHdIndex = maxHdIndex + 1
            let typeIndex = createList[createList.length - 1].typeIndex + 1

            let mnemonicEn = data[0].mnemonic
            let mnemonic = await encryptUtils.decrypt(this.getStore().password, mnemonicEn)
            let wallet = await importWalletByMnemonic(mnemonic, lastHdIndex)

            let priKeyEncrypt = await encryptUtils.encrypt(this.getStore().password, wallet.priKey)

            const account = {
                address: wallet.pubKey,
                privateKey: priKeyEncrypt,//wallet.priKey,
                type: ACCOUNT_TYPE.WALLET_INSIDE,//"import",
                hdPath: lastHdIndex,
                accountName,
                typeIndex: typeIndex
            }
            data[0].currentAddress = account.address
            data[0].accounts.push(account)
            let encryptData = await encryptUtils.encrypt(this.getStore().password, data)

            this.memStore.updateState({ data: data })
            save({ keyringData: encryptData })//保存在本地插件存储
            // 在保存一下在 本地存储
            this.memStore.updateState({ currentAccount: account })
            return this.getAccountWithoutPrivate(account)
        }
    };
    /**
     *  私钥导入
     */
    addImportAccount = async (privateKey, accountName) => {
        try {
            let wallet = importWalletByPrivateKey(privateKey)

            let data = this.getStore().data
            let accounts = data[0].accounts
            let error = {}

            for (let index = 0; index < accounts.length; index++) {
                const account = accounts[index];
                if (account.address === wallet.pubKey) {
                    error = { "error": 'improtRepeat',type:"local" }
                    break
                }
            }
            if (error.error) {
                return error
            }
            let importList = accounts.filter((item, index) => {
                return item.type === ACCOUNT_TYPE.WALLET_OUTSIDE//"import"
            })
            let typeIndex = ""
            if (importList.length == 0) {
                typeIndex = 1
            } else {
                typeIndex = importList[importList.length - 1].typeIndex + 1
            }

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
            save({ keyringData: encryptData })//保存在本地插件存储
            // 在保存一下在 本地存储
            this.memStore.updateState({ currentAccount: account })
            return this.getAccountWithoutPrivate(account)
        } catch (error) {
            return { "error": "privateError" ,type:"local"}
        }

    }
    /**
     * 通过keystore导入钱包
     * @param {*} keypair 
     * @param {*} password 
     * @param {*} accountName 
     * @returns 
     */
    addAccountByKeyStore = async(keystore,password,accountName)=>{
        let wallet = await importWalletByKeystore(keystore,password)
        if(wallet.error){
            return wallet
        }
        let currentAccount = await this.addImportAccount(wallet.priKey,accountName)
        return currentAccount
    }
    /**
     * 导入ledger钱包
     */
    addLedgerAccount = async (address, accountName)=>{
        try {
            let data = this.getStore().data
            let accounts = data[0].accounts
            let error = {}

            for (let index = 0; index < accounts.length; index++) {
                const account = accounts[index];
                if (account.address === address) {
                    error = { "error": 'improtRepeat',type:"local" }
                    break
                }
            }
            if (error.error) {
                return error
            }
            let ledgerList = accounts.filter((item, index) => {
                return item.type === ACCOUNT_TYPE.WALLET_LEDGER//"import"
            })
            let typeIndex = ""
            if (ledgerList.length == 0) {
                typeIndex = 1
            } else {
                typeIndex = ledgerList[ledgerList.length - 1].typeIndex + 1
            }

            const account = {
                address: address,
                type: ACCOUNT_TYPE.WALLET_LEDGER,//"outside",
                accountName,
                typeIndex
            }
            data[0].currentAddress = account.address
            data[0].accounts.push(account)
            let encryptData = await encryptUtils.encrypt(this.getStore().password, data)

            this.memStore.updateState({ data: data })
            save({ keyringData: encryptData })//保存在本地插件存储
            // 在保存一下在 本地存储
            this.memStore.updateState({ currentAccount: account })
            return this.getAccountWithoutPrivate(account)
        } catch (error) {
            return { "error": JSON.stringify(error)}
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
                save({ keyringData: encryptData })//保存在本地插件存储
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
        // 先查找到修改的账户
        // 修改用户名
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
                save({ keyringData: encryptData })//保存在本地插件存储
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

            let currentAccount = accounts[0]
            data[0].currentAddress = currentAccount.address

            data[0].accounts = accounts
            let encryptData = await encryptUtils.encrypt(this.getStore().password, data)
            this.memStore.updateState({ data: data, currentAccount })
            save({ keyringData: encryptData })//保存在本地插件存储
            return this.getAccountWithoutPrivate(currentAccount)//{accountList:data[0].accounts}
        } else {
            return { error: 'passwordError' ,type:"local"}
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
            return { error: 'passwordError',type:"local" }
        }
    }
    updateSecPassword = async (oldPwd, pwd) => {
        // 先解开之前的加密数据
        // 将原先的加密数据重新加密存储
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
                    //用旧密码加密的私钥
                    let privateKeyEn = account.privateKey
                    //用旧密码 解密私钥
                    let privateKey = await encryptUtils.decrypt(oldPwd, privateKeyEn)
                    // 用新密码加密私钥
                    privateKey = await encryptUtils.encrypt(pwd, privateKey)
                    //更新数组数据
                    let newAccount = {
                        ...account,
                        privateKey,
                    }
                    newAccounts.push(newAccount)
                }
                data[0].accounts = newAccounts
                data[0].mnemonic = mnemonic

                // 修改密码。本地保存的私钥，重新加密 TODO
                let encryptData = await encryptUtils.encrypt(pwd, data)
                this.memStore.updateState({ password: pwd })
                await removeValue("keyringData")
                await save({ keyringData: encryptData })
                return { code: 0 }
            } else {
                return { error: 'passwordError',type:"local" }
            }
        } catch (error) {
            return { error: 'passwordError',type:"local" }
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
            return { error: 'passwordError',type:"local" }
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
            // let detail = postRes.sendPayment && postRes.sendPayment.payment || {}
            // if(detail.id){
            //     this.notification(detail.id,detail.from)
            // }
            return { ...postRes }
        } catch (err) {
            return { error: err }
        }
    }
    sendStackTransaction = async (params) => {
        try {
            let { fromAddress, toAddress, fee, nonce, memo } = params;
            const privateKey = await this.getCurrentPrivateKey()
            let signedTx = stakePayment(privateKey, fromAddress, toAddress, fee, nonce, memo)
            if (signedTx.error) {
                return { error: signedTx.error }
            }
            let postRes = await sendStackTx(signedTx.payload, signedTx.signature).catch(error => { error })
            // let detail = postRes.sendDelegation && postRes.sendDelegation.delegation || {}
            // if(detail.from){
            //     this.notification(detail.id,detail.from)
            // }
            return { ...postRes }
        } catch (err) {
            return { error: err }
        }
    }

    notification = (hash) => {
        let id = hash
        chrome.notifications &&
            chrome.notifications.onClicked.addListener(function (id) {
                let url = EXPLORER_URL + id
                window.open(url);
            });
        let title = getLanguage('notificationTitle')
        let message = getLanguage('notificationContent')
        chrome.notifications.create(id, {
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
            // 只要不是pending，就继续请求
            // 不然就设置最终状态
            if (data && data.transactionStatus && (
                (data.transactionStatus === STATUS.TX_STATUS_INCLUDED
                    || data.transactionStatus === STATUS.TX_STATUS_UNKNOWN)
            )) {
                chrome.runtime.sendMessage({
                    type: FROM_BACK_TO_RECORD,
                    action: TX_SUCCESS,
                });
                this.notification(hash)
            } else {
                this.timer = setTimeout(() => {
                    this.fetchTransactionStatus(paymentId, hash);
                }, 5000);
            }
        }).catch((error) => {
            console.log('fetchTransactionStatus=error', error)
            this.timer = setTimeout(() => {
                this.fetchTransactionStatus(paymentId, hash);
            }, 5000);
        })
    }
}

const apiService = new APIService();
export default apiService;
