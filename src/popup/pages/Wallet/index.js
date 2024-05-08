import BigNumber from 'bignumber.js';
import cls from "classnames";
import extensionizer from "extensionizer";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Trans } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { MAIN_COIN_CONFIG } from '../../../constant';
import { getBalance, getCurrencyPrice, getGqlTxHistory, getPendingTxList, getZkAppPendingTx, getZkAppTxHistory } from "../../../background/api";
import { extSaveLocal } from "../../../background/extensionStorage";
import { NET_WORK_CONFIG } from '../../../constant/storageKey';
import { DAPP_DISCONNECT_SITE, DAPP_GET_CONNECT_STATUS, WALLET_GET_ALL_ACCOUNT } from '../../../constant/msgTypes';
import { NET_CONFIG_TYPE } from '../../../constant/network';
import { ACCOUNT_BALANCE_CACHE_STATE, updateAccountTx, updateNetAccount, updateShouldRequest, updateStakingRefresh } from "../../../reducers/accountReducer";
import { setAccountInfo, updateCurrentPrice } from "../../../reducers/cache";
import { updateNetConfig } from "../../../reducers/network";
import { sendMsg } from '../../../utils/commonMsg';
import { addressSlice, clearLocalCache, copyText, getAmountForUI, getDisplayAmount, getNetTypeNotSupportHistory, getOriginFromUrl, isNaturalNumber, isNumber, sendNetworkChangeMsg } from "../../../utils/utils";
import Clock from '../../component/Clock';
import { PopupModal } from '../../component/PopupModal';
import Toast from "../../component/Toast";
import { LoadingView, NoBalanceDetail, UnknownInfoView } from './component/StatusView';
import TxListView from './component/TxListView';
import styles from "./index.module.scss";
import NetworkSelect from '../Networks/NetworkSelect';

const Wallet = ({ }) => {

  const history = useHistory()
  const dispatch = useDispatch()
  const accountInfo = useSelector(state => state.accountInfo)
  const netConfig = useSelector(state => state.network)

  const [watchModalStatus, setWatchModalStatus] = useState(false)

  const toSetting = useCallback(() => {
    history.push("setting")
  }, [])

  const toManagePage = useCallback(() => {
    history.push("account_manage")
  }, [])

  const onCloseWatchModal = useCallback(() => {
    setWatchModalStatus(false)
  }, [])
  const onWatchModalConfirm = useCallback(() => {
    onCloseWatchModal()
    toManagePage()
  }, [])

  const checkLocalWatchWallet = useCallback(() => {
    sendMsg({
      action: WALLET_GET_ALL_ACCOUNT,
    }, (account) => {
      let watchList = account.accounts.watchList
      if (watchList.length > 0) {
        setWatchModalStatus(true)
      }
    })
  }, [])


  const onChangeOption = useCallback(async (option) => {
    const { currentConfig, currentNetConfig, netList } = netConfig
    if (option.value !== currentConfig.url) {
      let newConfig = {}
      for (let index = 0; index < netList.length; index++) {
        const config = netList[index];
        if (config.url === option.value) {
          newConfig = config
          break
        }
      }
      let config = {
        ...currentNetConfig,
        currentConfig: newConfig
      }
      await extSaveLocal(NET_WORK_CONFIG, config)
      dispatch(updateNetConfig(config))
      dispatch(updateStakingRefresh(true))

      dispatch(updateShouldRequest(true))
      sendNetworkChangeMsg(newConfig) 
      clearLocalCache()
    }

  }, [netConfig])

  useEffect(() => {
    checkLocalWatchWallet()
  }, [])

  return (<div className={styles.container}>
    <div className={styles.toolbarContainer}>
      <div className={styles.toolBar}>
        <img src='/img/menu.svg' className={styles.menuIcon} onClick={toSetting} />
        <NetworkSelect/>
        <img src="/img/wallet.svg" className={styles.walletIcon} onClick={toManagePage} />
      </div>
    </div>
    <div className={styles.walletContent}>
      <WalletInfo />
      <WalletDetail />
    </div>
    <PopupModal
      title={i18n.t('watchModeDeleteBtn')}
      leftBtnContent={i18n.t('cancel')}
      rightBtnContent={i18n.t("deleteTag")}
      onLeftBtnClick={onCloseWatchModal}
      onRightBtnClick={onWatchModalConfirm}
      rightBtnStyle={styles.watchModalRightBtn}
      componentContent={
        <p className={styles.confirmContent}>
          <Trans
            i18nKey={i18n.t('watchModeDeleteTip')}
            components={{
              red: <span className={styles.tipsSpecial} />,
            }}
          />
        </p>
      }
      modalVisible={watchModalStatus} />
  </div>)
}
export default Wallet


const WalletInfo = () => {
  const accountInfo = useSelector(state => state.accountInfo)
  const cache = useSelector(state => state.cache)
  const currencyConfig = useSelector(state => state.currencyConfig)
  const netConfig = useSelector(state => state.network)

  const dispatch = useDispatch()
  const history = useHistory()

  const [currentAccount, setCurrentAccount] = useState(accountInfo.currentAccount)
  const [dappConnectStatus, setDappConnectStatus] = useState(false)
  const [dappIcon, setDappIcon] = useState("/img/dappUnConnect.svg")

  const [dappModalStatus, setDappModalStatus] = useState(false)
  const [siteUrl, setSiteUrl] = useState('')

  const {
    dappModalContent,
    leftBtnContent,
    rightBtnContent
  } = useMemo(() => {
    let dappModalContent = dappConnectStatus ? i18n.t('walletConnected') : i18n.t('noAccountConnect')
    let leftBtnContent = dappConnectStatus ? i18n.t('cancel') : ""
    let rightBtnContent = dappConnectStatus ? i18n.t('disconnect') : i18n.t('ok')

    return {
      dappModalContent,
      leftBtnContent,
      rightBtnContent
    }
  }, [dappConnectStatus])

  const {
    accountName,
    deleText,
    showAddress,
    balance,
    showSmallBalanceClass,
    unitBalance,
    showCurrency,
    isCache,
    showTip
  } = useMemo(() => {
    let netAccount = accountInfo.netAccount
    let balance = accountInfo.balance || "0.00"
    balance = getDisplayAmount(balance)

    let showSmallBalanceClass = (balance + "").length >= 14

    let accountName = currentAccount?.accountName

    let delegateState = netAccount?.delegate && netAccount?.delegate !== currentAccount.address
    let deleText = delegateState ? i18n.t("delegated") : i18n.t("undelegated")

    let showAddress = addressSlice(currentAccount.address)

    let unitBalance = "--"
    if (cache.currentPrice) {
      unitBalance = new BigNumber(cache.currentPrice).multipliedBy(balance).toString()
      unitBalance = currencyConfig.currentCurrency.symbol + ' ' + getAmountForUI(unitBalance,0,2)
    }
    // format
    balance = new BigNumber(balance).toFormat()

    const netType = netConfig.currentConfig?.netType
    let showCurrency = netType == NET_CONFIG_TYPE.Mainnet

    let isCache = accountInfo.isAccountCache === ACCOUNT_BALANCE_CACHE_STATE.USING_CACHE
 
    let showTip = dappConnectStatus ? i18n.t("dappConnect") : i18n.t("dappDisconnect")
    return {
      accountName,
      deleText,
      showAddress,
      balance,
      showSmallBalanceClass,
      unitBalance,
      showCurrency,
      isCache,
      showTip
    }
  }, [currentAccount, i18n, cache, currencyConfig, netConfig, accountInfo, dappConnectStatus])

  const onCopyAddress = useCallback(() => {
    copyText(currentAccount.address).then(() => {
      Toast.info(i18n.t('copySuccess'))
    })
  }, [currentAccount])


  const toAccountInfo = useCallback(() => {
    dispatch(setAccountInfo(currentAccount))
    history.push("account_info")
  }, [currentAccount])

  const toSend = useCallback(() => {
    history.push("send_page")
  }, [])
  const toReceive = useCallback(() => {
    history.push("receive_page")
  }, [])
  const toStaking = useCallback(() => {
    history.push("staking")
  }, [])

  const getDappConnect = useCallback(() => {
    extensionizer.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      let url = tabs[0]?.url || ""
      let origin = getOriginFromUrl(url)
      setSiteUrl(origin)
      sendMsg({
        action: DAPP_GET_CONNECT_STATUS,
        payload: {
          siteUrl: origin,
          address: currentAccount.address
        }
      }, (isConnected) => {
        setDappConnectStatus(isConnected)
      })
    });
  }, [currentAccount])

  const setDappDisconnect = useCallback(() => {
    sendMsg({
      action: DAPP_DISCONNECT_SITE,
      payload: {
        siteUrl: siteUrl,
        address: currentAccount.address
      }
    }, (status) => {
      if (status) {
        setDappConnectStatus(false)
        onCloseDappModal()
        Toast.info(i18n.t('disconnectSuccess'))
      } else {
        Toast.info(i18n.t('disconnectFailed'))
      }
    })
  }, [currentAccount, siteUrl])

  const onShowDappModal = useCallback(() => {
    setDappModalStatus(true)
  }, [])
  const onCloseDappModal = useCallback(() => {
    setDappModalStatus(false)
  }, [])



  const onClickDappConfirm = useCallback(() => {
    if (!dappConnectStatus) {
      onCloseDappModal()
    } else {
      setDappDisconnect()
    }
  }, [dappConnectStatus])


  useEffect(() => {
    setDappIcon(dappConnectStatus ? "/img/dappConnected.svg" : "/img/dappUnConnect.svg")
  }, [dappConnectStatus])
  useEffect(() => {
    setCurrentAccount(accountInfo.currentAccount)
    getDappConnect()
  }, [accountInfo.currentAccount])


  const fetchPrice = useCallback(async (currency) => {
    let currentConfig = netConfig.currentConfig
    if (currentConfig.netType == NET_CONFIG_TYPE.Mainnet) {
      let lastCurrency = currencyConfig.currentCurrency
      if (currency) {
        lastCurrency = currency
      }
      let price = await getCurrencyPrice(lastCurrency.key)
      if (isNumber(price)) {
        dispatch(updateCurrentPrice(price))
      }
    }
  }, [netConfig, currencyConfig])

  const fetchAccountData = useCallback(() => {
    let address = currentAccount.address
    getBalance(address).then((account) => {
      if (account.publicKey) {
        dispatch(updateNetAccount(account))
      } else if (account.error) {
        Toast.info(i18n.t('nodeError'))
      }
    })
  }, [i18n, currentAccount])

  useEffect(() => {
    fetchAccountData()
  }, [netConfig.currentConfig.netType, fetchAccountData])
 
  useEffect(()=>{
    fetchPrice()
  },[currencyConfig.currentCurrency,netConfig.currentConfig.netType])
  return (
    <>
      <div className={styles.walletInfoContainer}>
        <img src='/img/walletBg.svg' className={styles.walletBg} />
        <div className={styles.walletInfoTopContainer}>
          <div className={styles.walletInfoTopLeftContainer}>
            <div className={styles.walletInfoLeftTop}>
              <p className={styles.accountName}>{accountName}</p>
              <div className={styles.accountStatus}>{deleText}</div>
              <div className={styles.dappContainer}>
                <img src={dappIcon} className={styles.dappConnectIcon} onClick={onShowDappModal} />
                <div className={styles.baseTipContainer}>
                  <span className={styles.baseTip}>{showTip}</span>
                </div>
                
              </div>
            </div>
            <div className={styles.walletInfoLeftBottom} onClick={onCopyAddress}>
              <p className={styles.accountAddress}>{showAddress}</p>
            </div>
          </div>
          <div className={styles.dappConnectContainer} onClick={toAccountInfo}>
            <img src="/img/pointMenu.svg" />
          </div>
        </div>
        <div className={styles.assetsContainer}>
          <div className={styles.amountNumberContainer}>
            <p className={cls(styles.amountNumber, {
              [styles.balanceSizeMine]: showSmallBalanceClass,
              [styles.cacheBalance]: isCache
            })}>
              {balance}
            </p>
            <span className={cls(styles.amountSymbol, {
              [styles.cacheBalance]: isCache
            })}>{MAIN_COIN_CONFIG.symbol}</span>
          </div>
          <p className={cls(styles.amountValue,{
            [styles.fontHolder]:!showCurrency
          })}>{unitBalance}</p>
        </div>

        <div className={styles.btnGroup}>
          <p className={cls(styles.btn, styles.sendBtn)} onClick={toSend}>{i18n.t('send')}</p>
          <div className={cls(styles.hr, styles.sendBtnLine)} />
          <p className={cls(styles.btn, styles.receiveBtn)} onClick={toReceive}>{i18n.t('receive')}</p>
          <div className={cls(styles.hr, styles.receiveBtnLine)} />
          <p className={cls(styles.btn, styles.stakingBtn)} onClick={toStaking}>{i18n.t('staking')}</p>
        </div>
      </div>
      <PopupModal 
        title={siteUrl}
        leftBtnContent={leftBtnContent}
        rightBtnContent={rightBtnContent}
        onLeftBtnClick={onCloseDappModal}
        onRightBtnClick={onClickDappConfirm}
        content={dappModalContent}
        modalVisible={dappModalStatus} />
    </>
  )
}


const WalletDetail = () => {
  const dispatch = useDispatch()
  const isMounted = useRef(true);

  const netConfig = useSelector(state => state.network)
  const accountInfo = useSelector(state => state.accountInfo)
  const shouldRefresh = useSelector(state => state.accountInfo.shouldRefresh)
  const inferredNonce = useSelector(
    (state) => state.accountInfo.netAccount.inferredNonce
  );

  const netType = useMemo(()=>{
    return netConfig?.currentConfig?.netType
  },[netConfig])

  const [currentAccount, setCurrentAccount] = useState(accountInfo.currentAccount)
  const [historyList, setHistoryList] = useState(accountInfo.txList)
  const [showHistoryStatus, setShowHistoryStatus] = useState(()=>{
    let status
    if (getNetTypeNotSupportHistory(netType)) {
      status = false
    } else {
      status = true
    }
    return status
  })
  const [historyRefreshing, setHistoryRefreshing] = useState(false)

  const [loadingStatus, setLoadingStatus] = useState(false)

  const isFirstRequest = useRef(historyList.length===0);
 
  const requestHistory = useCallback(async (silent = false, address = currentAccount.address) => {
    if (!getNetTypeNotSupportHistory(netType)) {
      if (isFirstRequest.current && !silent) {
        setLoadingStatus(true)
      }
      let pendingTxList = getPendingTxList(address)
      let gqlTxList = getGqlTxHistory(address)
      let zkAppTxList = getZkAppTxHistory(address)
      let getZkAppPending = getZkAppPendingTx(address)
      await Promise.all([gqlTxList,pendingTxList,zkAppTxList,getZkAppPending]).then((data) => {
        let newList = data[0]
        let txPendingData = data[1]
        let zkApp = data[2]
        let txPendingList = txPendingData.txList
        let zkPendingList = data[3]
        dispatch(updateAccountTx(newList,txPendingList,zkApp,zkPendingList))
      }).catch((err) => {
      }).finally(() => {
        if (isMounted.current) {
          setHistoryRefreshing(false)
          isFirstRequest.current = false
          dispatch(updateShouldRequest(false))
          setLoadingStatus(false)
        }
      })
    }

  }, [currentAccount.address, netType])


  useEffect(() => {
    if (showHistoryStatus) {
      requestHistory(true)
    }
  }, [showHistoryStatus])

  useEffect(() => {
    setHistoryList(accountInfo.txList)
  }, [accountInfo.txList])

  const onClickRefresh = useCallback(() => {
    setHistoryRefreshing(true)
    requestHistory(true)
  }, [requestHistory])



  useEffect(() => {
    if (getNetTypeNotSupportHistory(netType)) {
      setShowHistoryStatus(false)
      setLoadingStatus(false)
      isFirstRequest.current = false
    } else {
      setShowHistoryStatus(true)
    }
  }, [netType])


  useEffect(() => {
    if (shouldRefresh && !getNetTypeNotSupportHistory(netType)) {
      setLoadingStatus(true)
      setShowHistoryStatus(true)
      requestHistory()
    }
  }, [shouldRefresh,netType])

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  

  let childView =(<></>)
  if(loadingStatus){
    childView = <LoadingView/>
  }else{
    if(historyList.length !== 0){
      childView = <TxListView
                    history={historyList}
                    onClickRefresh={onClickRefresh}
                    historyRefreshing={historyRefreshing}
                    showHistoryStatus={showHistoryStatus}
                  />
    }else{
        if(isNaturalNumber(inferredNonce)){
          childView =  <UnknownInfoView/>
        }else{
          childView = <NoBalanceDetail />
        }
    }
  }
  return (<div className={styles.walletDetail}>
    {childView}
    <Clock schemeEvent={() => { requestHistory(true) }} />
  </div>)
}