import { LOCK_TIME_DEFAULT } from '../constant';
import { FROM_BACK_TO_RECORD, SET_LOCK, TX_SUCCESS, WORKER_ACTIONS } from '../constant/msgTypes';
import '../i18n';
import { getQATxStatus, getTxStatus, sendParty, sendStakeTx, sendTx } from './api';
import { createNullifier, signFieldsMessage, signMessagePayment, signPayment, signTransaction, stakePayment } from './lib';
import { get, getCredentialById, getStoredCredentials, removeCredential, removeValue, save, searchCredential, storeCredential } from './storageService';
import { ACCOUNT_TYPE } from '../constant/commonType';
import browser from 'webextension-polyfill';
import { decodeMemo } from '../utils/utils';
import { getExtensionAction,getCurrentNodeConfig } from '../utils/browserUtils';
import i18n from "i18next"
import { DAppActions } from '@aurowallet/mina-provider';
import { changeLanguage } from '../i18n';
import { extGetLocal } from './extensionStorage';
import { LANGUAGE_CONFIG } from '../constant/storageKey';
import { sendMsg } from '../utils/commonMsg';

const ObservableStore = require('obs-store')
const { importWalletByMnemonic, importWalletByPrivateKey, importWalletByKeystore, generateMne } = require('./accountService')
const encryptUtils = require('../utils/encryptUtils').default

const STATUS = {
    TX_STATUS_PENDING: "PENDING",
    TX_STATUS_INCLUDED: "INCLUDED",
    TX_STATUS_UNKNOWN: "UNKNOWN"
}


const default_account_name = "Account 1"
const FETCH_TYPE_QA = "Berkeley-QA"

class APIService {
    constructor() {
        this.memStore = new ObservableStore(this.initLockedState())
    }
    initLockedState=()=>{
        return {
          isUnlocked: false,
          data: '',
          password: '',
          currentAccount: {},
          mne: "",
          autoLockTime:LOCK_TIME_DEFAULT
        };
      }
    initAppLocalConfig=async()=>{
        const {autoLockTime} = await get("autoLockTime")
        return autoLockTime||LOCK_TIME_DEFAULT
    }

    getStore = () => {
        return this.memStore.getState()
    };
    resetWallet=()=>{
        if (this.activeTimer) {
            clearTimeout(this.activeTimer)
        }
        this.setPopupIcon(true)
        this.memStore.putState(this.initLockedState())
        return
    }
    setPopupIcon = (
        isUnlocked,
      ) => {
        const icons = [16, 32, 48, 128].reduce((res, size) => {
          if (!isUnlocked) {
            res[size] = `img/logo/${size}_lock.png`;
          } else {
            res[size] = `img/logo/${size}.png`;
          }
          return res;
        }, {});
        const action = getExtensionAction()
        return action.setIcon({
          path: icons,
        });
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
                return ""
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
            let autoLockTime = await this.initAppLocalConfig()
            this.memStore.updateState({
                data: vault,
                isUnlocked: true,
                password,
                currentAccount,
                autoLockTime,
            })
            this.setPopupIcon(true)
            sendMsg({
                type: FROM_BACK_TO_RECORD,
                action: WORKER_ACTIONS.SET_LOCK,
                payload:true
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
            let wallet = vault[i];
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
        const timeoutMinutes = this.getStore().autoLockTime
        let localData = this.getStore().data
        let isUnlocked = this.getStore().isUnlocked
        if (localData && isUnlocked) {
            if (this.activeTimer) {
                clearTimeout(this.activeTimer)
            }
            if(timeoutMinutes === -1){
                return
            }
            if (!timeoutMinutes) {
                return
            }
            
            this.activeTimer = setTimeout(() => {
                this.setUnlockedStatus(false)
            }, timeoutMinutes)
        }

    }
    async updateLockTime(autoLockTime){
        this.memStore.updateState({autoLockTime:autoLockTime})
        await save({ autoLockTime: autoLockTime })
    }
    getCurrentAutoLockTime(){
        return this.getStore().autoLockTime
    } 
    setUnlockedStatus(status) {
        if (!status) {
            let nextState = this.initLockedState()
            nextState.autoLockTime = this.getStore().autoLockTime
            nextState.currentAccount.address = this.getCurrentAccountAddress()
            this.memStore.updateState(nextState)
        }
        sendMsg({
            type: FROM_BACK_TO_RECORD,
            action: WORKER_ACTIONS.SET_LOCK,
            payload:status
        })
        this.memStore.updateState({ isUnlocked: status })
        this.setPopupIcon(status)
    };
    getCurrentAccount = async () => {
        let initStatus = false
        let localAccount = await get("keyringData")
        let currentAccount = this.getStore().currentAccount
        let isUnlocked = this.getStore().isUnlocked
        if (localAccount && localAccount.keyringData) {
            initStatus = true
            currentAccount.localAccount = {
                keyringData: "keyringData"
            }
        }
        currentAccount.isUnlocked = isUnlocked
        let iconStatus = !initStatus || isUnlocked;
        this.setPopupIcon(iconStatus)
        return this.getAccountWithoutPrivate(currentAccount)
    };
    
    getCurrentAccountAddress = () => {
        let currentAccount = this.getStore().currentAccount
        return currentAccount.address 
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
        let accountList = this.accountSort(data[0].accounts)

        let currentAccount = this.getStore().currentAccount
        return {
            accounts: accountList,
            currentAddress: currentAccount.address 
        }
    }
    accountSort = (accountList) => {
        let newList = accountList
        let createList=[],importList=[],ledgerList=[],watchList = []
        newList.filter((item, index) => {
            let newItem = this.getAccountWithoutPrivate(item)
            switch (newItem.type) {
                case ACCOUNT_TYPE.WALLET_INSIDE:
                    createList.push(newItem)
                    break;
                case ACCOUNT_TYPE.WALLET_OUTSIDE:
                    importList.push(newItem)
                    break;
                case ACCOUNT_TYPE.WALLET_LEDGER:
                    ledgerList.push(newItem)
                    break;
                case ACCOUNT_TYPE.WALLET_WATCH:
                    watchList.push(newItem)
                    break;
                default:
                    break;
            }
        })
       
        let commonList = [...createList, ...importList,...ledgerList]
        return {allList:[...commonList,...watchList],commonList,watchList}
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


            let sameIndex = -1
            let sameAccount = {}
            for (let index = 0; index < accounts.length; index++) {
                const tempAccount = accounts[index];
                if (tempAccount.address === wallet.pubKey) {
                    sameIndex = index
                    sameAccount = tempAccount
                }
            }

            if(sameIndex !== -1){
                let backAccount = {
                    accountName:sameAccount.accountName,
                    address:sameAccount.address
                }
                let error = { "error": 'importRepeat', type: "local",account:backAccount }
                return error
            }
            
            let account = {
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
                error = { "error": 'importRepeat', type: "local" }
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
            let wallet = await importWalletByPrivateKey(privateKey)

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
        let accountList = this.accountSort(data[0].accounts)
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
        let data = this.getStore().data
        let accounts = data[0].accounts
        let deleteAccount = accounts.filter((item, index) => {
            return item.address === address
        })
        deleteAccount = deleteAccount.length>0 ?deleteAccount[0]:{}
        let canDelete = false
        if(deleteAccount && (deleteAccount.type === ACCOUNT_TYPE.WALLET_WATCH||deleteAccount.type === ACCOUNT_TYPE.WALLET_LEDGER)){
            canDelete = true
        }else{
            let isCorrect = this.checkPassword(password)
            if(isCorrect){
                canDelete = true
            }
        }
        if(canDelete){
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
        }else{
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
                let currentAccount = this.getStore().currentAccount
                let newAccounts = []
                for (let index = 0; index < accounts.length; index++) {
                    const account = accounts[index];
                    let privateKeyEn = account.privateKey
                    let privateKey
                    if(privateKeyEn){
                        privateKey = await encryptUtils.decrypt(oldPwd, privateKeyEn)
                        privateKey = await encryptUtils.encrypt(pwd, privateKey)
                        if(currentAccount.address === account.address){
                            currentAccount.privateKey = privateKey
                        }
                    }
                    let newAccount = {
                        ...account,
                    }
                   if(privateKey){
                    newAccount.privateKey = privateKey
                   }
                    newAccounts.push(newAccount)
                }
                data[0].accounts = newAccounts
                data[0].mnemonic = mnemonic

                let encryptData = await encryptUtils.encrypt(pwd, data)
                this.memStore.updateState({ password: pwd,currentAccount })
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
    sendLegacyPayment = async (params) => {
        try {
            let fromAddress = params.fromAddress
            let toAddress = params.toAddress
            let amount = params.amount
            let fee = params.fee
            let nonce = params.nonce
            let memo = params.memo
            const isSpeedUp = params.isSpeedUp
            if(isSpeedUp){
                memo = decodeMemo(params.memo)
            }
            const privateKey = await this.getCurrentPrivateKey()
            let signedTx = await signPayment(privateKey, fromAddress, toAddress, amount, fee, nonce, memo)
            if (signedTx.error) {
                return { error: signedTx.error }
            }
            let postRes = await sendTx(signedTx.data, signedTx.signature).catch(error => { error })
            let payment = postRes.sendPayment && postRes.sendPayment.payment || {}
            if (payment.hash && payment.id) {
                this.checkTxStatus(payment.id,payment.hash)
            }
            return { ...postRes }
        } catch (err) {
            return { error: err }
        }
    }
    signMessage = async(params) => {
        try {
            let message = params.message
            const privateKey = await this.getCurrentPrivateKey()
            let signedTx = await signMessagePayment(privateKey,message)
            if (signedTx.error) {
                return { error: signedTx.error }
            }
            return signedTx
        } catch (err) {
            return { error: err }
        }
    }
    sendLegacyStakeDelegation = async (params) => {
        try {
            let { fromAddress, toAddress, fee, nonce,isSpeedUp } = params;
            let memo = params.memo
            if(isSpeedUp){
                memo = decodeMemo(params.memo)
            }
            const privateKey = await this.getCurrentPrivateKey()
            let signedTx = await stakePayment(privateKey, fromAddress, toAddress, fee, nonce, memo)
            if (signedTx.error) {
                return { error: signedTx.error }
            }
            let postRes = await sendStakeTx(signedTx.data, signedTx.signature).catch(error => { error })
            let delegation = postRes.sendDelegation && postRes.sendDelegation.delegation || {}
            if (delegation.hash && delegation.id) {
                this.checkTxStatus(delegation.id,delegation.hash)
            }
            return { ...postRes }
        } catch (err) {
            return { error: err }
        }
    }
    postStakeTx = async(data,signature)=>{
        let stakeRes = await sendStakeTx(data, signature).catch(error =>  error )
        let delegation = stakeRes.sendDelegation && stakeRes.sendDelegation.delegation || {}
        if (delegation.hash && delegation.id) {
            this.checkTxStatus(delegation.id,delegation.hash)
        }
        return { ...stakeRes }
    }
    postPaymentTx = async(data,signature)=>{
        let sendRes = await sendTx(data, signature).catch(error => error )
        let payment = sendRes.sendPayment && sendRes.sendPayment.payment || {}
        if (payment.hash && payment.id) {
            this.checkTxStatus(payment.id,payment.hash)
        }
        return { ...sendRes }
    }
    postZkTx = async (signedTx)=>{
        let sendPartyRes = await sendParty(signedTx.data.zkappCommand, signedTx.signature).catch(error =>  error )
        if(!sendPartyRes.error){
            let partyRes = sendPartyRes?.sendZkapp?.zkapp || {}
            if ( partyRes.id && partyRes.hash ) {
                this.checkTxStatus(partyRes.id,partyRes.hash,FETCH_TYPE_QA)
            }
            return { ...partyRes }
        }else{
            return sendPartyRes
        }
    }

    sendTransaction= async (params) => {
        try {
            let nextParams = { ...params }
            const privateKey = await this.getCurrentPrivateKey()
            if(params.isSpeedUp){
                nextParams.memo = decodeMemo(params.memo)
            }
            let signedTx = await signTransaction(privateKey,nextParams)
            if (signedTx.error) {
                return { error: signedTx.error }
            }
            if(nextParams.zkOnlySign){
                return signedTx.data
            }
            const sendAction = params.sendAction
            switch (sendAction) {
                case DAppActions.mina_signMessage:
                    return signedTx;
                case DAppActions.mina_sendPayment:
                    const sendRes = await this.postPaymentTx(signedTx.data, signedTx.signature)
                    return sendRes
                case DAppActions.mina_sendStakeDelegation:
                    const stakeRes = await this.postStakeTx(signedTx.data, signedTx.signature)
                    return stakeRes
                case DAppActions.mina_sendTransaction:
                    const sendPartyRes = await this.postZkTx(signedTx)
                    return sendPartyRes
                default:
                    return {error:"not support"}
            }
        } catch (err) {
            return { error: err }
        }

    }
    
    signFields=async(params)=>{
        const privateKey = await this.getCurrentPrivateKey()
        let signedResult = await signFieldsMessage(privateKey,params)
        if (signedResult.error) {
            return { error: signedResult.error }
        }
        return signedResult
    }

    createNullifierByApi=async(params)=>{
        const privateKey = await this.getCurrentPrivateKey()
        let createResult = await createNullifier(privateKey,params)
        if (createResult.error) {
            return { error: createResult.error }
        }
        return createResult
    }
    notification = async (hash) => {
        let netConfig = await getCurrentNodeConfig()
        let myNotificationID
        browser.notifications &&
        browser.notifications.onClicked.addListener(function (clickId) {
                if(myNotificationID === clickId){
                    let url = netConfig.explorer +"/tx/"+ clickId
                    browser.tabs.create({ url: url });
                }
            });
        const i18nLanguage = i18n.language
        const localLanguage = await extGetLocal(LANGUAGE_CONFIG)
        if(localLanguage !== i18nLanguage){
            changeLanguage(localLanguage)
        }
        let title = i18n.t('notificationTitle')
        let message = i18n.t('notificationContent')
        browser.notifications.create(hash,{
            title: title,
            message: message,
            iconUrl: '/img/logo/128.png',
            type: 'basic'
        }).then((notificationItem)=>{
            myNotificationID = notificationItem
        });
        return
    }
    checkTxStatus = (paymentId, hash,type) => {
        if(type === FETCH_TYPE_QA){
            this.fetchQAnetTransactionStatus(paymentId, hash)
        }else{
            this.fetchTransactionStatus(paymentId, hash)
        }
        
    }
    fetchQAnetTransactionStatus = (paymentId, hash) => {
        this.baseTransactionStatus(getQATxStatus,paymentId, hash)
    }
    fetchTransactionStatus = (paymentId, hash) => {
        this.baseTransactionStatus(getTxStatus,paymentId, hash)
    }
    baseTransactionStatus= (method,paymentId, hash) => {
        method(paymentId).then((data) => {
            if (data && data.transactionStatus && (
                (data.transactionStatus === STATUS.TX_STATUS_INCLUDED)
            )) {
                browser.runtime.sendMessage({
                    type: FROM_BACK_TO_RECORD,
                    action: TX_SUCCESS,
                    hash:hash
                });
                this.notification(hash)
                if (this.timer) {
                    clearTimeout(this.timer);
                    this.timer = null;
                }
            } else if(data && data.transactionStatus && (
                (data.transactionStatus === STATUS.TX_STATUS_UNKNOWN))){
                if (this.timer) {
                    clearTimeout(this.timer);
                    this.timer = null;
                }
            }else {
                this.timer = setTimeout(() => {
                    this.baseTransactionStatus(method,paymentId, hash);
                }, 5000);
            }
        }).catch((error) => {
            this.timer = setTimeout(() => {
                this.baseTransactionStatus(method,paymentId, hash);
            }, 5000);
        })
    }
    getLockStatus=()=>{
        return this.getStore().isUnlocked
    }
    getLedgerAccountIndex= ()=>{
        const allAccount = this.getAllAccount()
        const ledgerList = allAccount.accounts.allList.filter((account)=>{
            return account.type === ACCOUNT_TYPE.WALLET_LEDGER
        })
        return ledgerList.length
    }
    storePrivateCredential= async (address,credential) => {
        const nextCredential = {
                address,
                credentialId: crypto.randomUUID(),
                credential: {
                    credential,
                    type: "private-credential",
                },
        }
        await storeCredential(nextCredential)
        return ;
      }
    getPrivateCredential= async (address) => {
        const credentials = await searchCredential({
            address,
            query: { type: "private-credential" },
            props: [],
        })
        
        const filterCre = credentials.map((credential) => {
            if (!credential) return credential
            const { type, ...credentialWithoutType } = credential
            return credentialWithoutType
        })
        return filterCre
    }
    getCredentialIdList = async (address) => {
        const { credentials } = await getStoredCredentials();
        const addressCredentials = credentials[address] || {};
        return Object.keys(addressCredentials);
      };
    getTargetCredential = async (address,credentialId)=>{
        const credential = await getCredentialById(address,credentialId)
        return credential;
    }
    removeTargetCredential = async (address,credentialId)=>{
        try {
            await removeCredential(address,credentialId)    
            return true
        } catch (error) {
            return false
        }
    }
}

const apiService = new APIService();
export default apiService;