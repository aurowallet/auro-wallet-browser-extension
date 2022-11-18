import BigNumber from 'bignumber.js';
import cls from "classnames";
import extensionizer from "extensionizer";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Trans } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { cointypes } from '../../../../config';
import { getBalance, getCurrencyPrice, getGqlTxHistory, getPendingTxList, getTransactionList, getZkAppPendingTx, getZkAppTxHistory } from "../../../background/api";
import { saveLocal } from '../../../background/localStorage';
import { NET_WORK_CONFIG } from '../../../constant/storageKey';
import { DAPP_DISCONNECT_SITE, DAPP_GET_CONNECT_STATUS, WALLET_GET_ALL_ACCOUNT } from '../../../constant/types';
import { NET_CONFIG_TYPE } from '../../../constant/walletType';
import { ACCOUNT_BALANCE_CACHE_STATE, updateAccountTx, updateNetAccount, updateShouldRequest, updateStakingRefresh } from "../../../reducers/accountReducer";
import { setAccountInfo, updateCurrentPrice } from "../../../reducers/cache";
import { updateNetConfig } from "../../../reducers/network";
import { openTab, sendMsg } from '../../../utils/commonMsg';
import { addressSlice, amountDecimals, copyText, getDisplayAmount, getNetTypeNotSupportHistory, getOriginFromUrl, getShowTime, isNumber, sendNetworkChangeMsg } from "../../../utils/utils";
import Clock from '../../component/Clock';
import { PopupModal } from '../../component/PopupModal';
import Select from '../../component/Select';
import Toast from "../../component/Toast";
import styles from "./index.module.scss";

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


  const onChangeOption = useCallback((option) => {
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
      saveLocal(NET_WORK_CONFIG, JSON.stringify(config))
      dispatch(updateNetConfig(config))
      dispatch(updateStakingRefresh(true))

      dispatch(updateShouldRequest(true))
      sendNetworkChangeMsg(newConfig)
    }

  }, [netConfig])

  useEffect(() => {
    checkLocalWatchWallet()
  }, [])

  return (<div className={styles.container}>
    <div className={styles.toolbarContainer}>
      <div className={styles.toolBar}>
        <img src='/img/menu.svg' className={styles.menuIcon} onClick={toSetting} />
        <Select
          value={netConfig.currentConfig.url}
          optionList={netConfig.netSelectList}
          onChange={onChangeOption}
        />
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
      rightBtnContent={i18n.t("delete")}
      onLeftBtnClick={onCloseWatchModal}
      onRightBtnClick={onWatchModalConfirm}
      rightBtnStyle={styles.watchModalRightBtn}
      componentContent={
        <p className={styles.confirmContent}>
          <Trans
            i18nKey={i18n.t('watchModeDeleteTip')}
            components={{
              red: <span className={styles.tipsSpical} />,
            }}
          />
        </p>
      }
      modalVisable={watchModalStatus} />
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
      unitBalance = currencyConfig.currentCurrency.symbol + ' ' + getDisplayAmount(unitBalance, 2)
    }

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
    fetchPrice()
  }, [i18n, currentAccount, fetchPrice])

  useEffect(() => {
    fetchAccountData()
  }, [netConfig.currentConfig.netType, fetchAccountData])
 
  useEffect(()=>{
    fetchPrice()
  },[currencyConfig.currentCurrency])
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
              <div className={styles.copyConatiner}>
                <img src="/img/icon_copy_homepage_address.svg" />
              </div>
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
            })}>{cointypes.symbol}</span>
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
        modalVisable={dappModalStatus} />
    </>
  )
}


const WalletDetail = () => {
  const dispatch = useDispatch()

  const netConfig = useSelector(state => state.network)
  const accountInfo = useSelector(state => state.accountInfo)
  const shouldRefresh = useSelector(state => state.accountInfo.shouldRefresh)

  const [currentAccount, setCurrentAccount] = useState(accountInfo.currentAccount)
  const [historyList, setHistoryList] = useState(accountInfo.txList)
  const [showHistoryStatus, setShowHistoryStatus] = useState(()=>{
    let status
    let netType = netConfig?.currentConfig?.netType
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
    let netType = netConfig?.currentConfig?.netType
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
        setHistoryRefreshing(false)
        isFirstRequest.current = false
        dispatch(updateShouldRequest(false))
        setLoadingStatus(false)
      })
    }

  }, [currentAccount.address, netConfig])


  useEffect(() => {
    if (showHistoryStatus) {
      requestHistory(true)
    }
  }, [showHistoryStatus, requestHistory])


  useEffect(() => {
    setHistoryList(accountInfo.txList)
  }, [accountInfo.txList])

  const onClickRefesh = useCallback(() => {
    setHistoryRefreshing(true)
    requestHistory(true)
  }, [requestHistory])


  const [showNoBalanceView, setShowNoBalanceView] = useState(false)


  useEffect(() => {
    let netType = netConfig?.currentConfig?.netType
    if (getNetTypeNotSupportHistory(netType)) {
      setShowHistoryStatus(false)
      setLoadingStatus(false)
    } else {
      setShowHistoryStatus(true)
    }
  }, [netConfig.currentConfig.netType, requestHistory])


  useEffect(() => {
    let netType = netConfig?.currentConfig?.netType
    if (shouldRefresh && !getNetTypeNotSupportHistory(netType)) {
      setLoadingStatus(true)
      setShowHistoryStatus(true)
      requestHistory()
    }
  }, [shouldRefresh])

  useEffect(() => {
    let netType = netConfig?.currentConfig?.netType
    if (getNetTypeNotSupportHistory(netType)) {
      isFirstRequest.current = false
    }
  }, [])

  useEffect(() => {
    if (historyList.length === 0 && !loadingStatus && showHistoryStatus) {
      setShowNoBalanceView(true)
    } else {
      setShowNoBalanceView(false)
    }
  }, [historyList, showHistoryStatus, loadingStatus])

  let childView =(<></>)
  if(showNoBalanceView){
    childView = <NoBalanceDetail /> 
  }else{// 
    if(loadingStatus){
      childView = <LoadingView/>
    }else {
      if(historyList.length !== 0){
        childView = <TxListView
        history={historyList}
        onClickRefesh={onClickRefesh}
        historyRefreshing={historyRefreshing}
        showHistoryStatus={showHistoryStatus}
      />
      }else{
        childView =  <EmptyView/>
      }
    }

  }
  return (<div className={styles.walletDetail}>
    {childView}
    <Clock schemeEvent={() => { requestHistory(true) }} />
  </div>)
}
/**
 * 
 * @param {*} showEmpty 
 * @param {*} showEmpty
 * @returns 
 */
const TxListView = ({
  history = [],
  showHistoryStatus = false,
  historyRefreshing = false,
  onClickRefesh = () => { }
}) => {
  const accountInfo = useSelector(state => state.accountInfo)
  const netConfig = useSelector(state => state.network)

  const onGoExplorer = useCallback(() => {
    let currentConfig = netConfig.currentConfig
    let url = currentConfig.explorer + "/wallet/" + accountInfo.currentAccount.address
    openTab(url)
  }, [netConfig, accountInfo])

  return (<div className={cls(styles.historyContainer,styles.holderContainer)}>
    <HistoryHeader showHistoryStatus={showHistoryStatus} historyRefreshing={historyRefreshing} onClickRefesh={onClickRefesh}/>
      <div className={styles.listContainer}>
        {history.map((item, index) => {
          if (item.showExplorer) {
            return (<div key={index} className={styles.explorerContainer}>
              <div className={styles.explorerContent} onClick={onGoExplorer}>
                <p className={styles.explorerTitle}>{i18n.t('goToExplorer')}</p>
                <img src="/img/icon_link.svg" className={styles.iconLink} />
              </div>
            </div>)
          }
          return <TxItem txData={item} key={index} currentAccount={accountInfo.currentAccount} />
        })}
      </div> 
  </div>)
}
const HistoryHeader=({historyRefreshing,onClickRefesh,showHistoryStatus})=>{
  return (
    <div className={styles.historyHead}>
      <span className={styles.historyTitle}>{i18n.t("history")}</span>
      {showHistoryStatus && <div className={cls(styles.refreshContainer,{
        [styles.refresh]: historyRefreshing
      })} onClick={onClickRefesh}>
        <img src="/img/refresh.svg"  className={styles.refreshIcon}/>
      </div>
      }
    </div>
  )
}
const LoadingView=()=>{
  return(
    <div className={cls(styles.historyContainer,styles.loadingOuterContainer)}>
      <HistoryHeader showHistoryStatus={false}/>
      <div className={styles.loadingCon}>
        <img className={styles.refreshLoading} src="/img/loading_purple.svg" />
        <p className={styles.loadingContent}>
          {i18n.t('loading') + "..."}
        </p>
      </div>
    </div>
  )
}
const EmptyView = ()=>{
  return (<div className={styles.historyContainer}>
    <div className={styles.historyHead}>
      <span className={styles.historyTitle}>{i18n.t("history")}</span>
    </div>
      <div className={styles.emptyContainer}>
        <img src="/img/icon_empty.svg" className={styles.emptyIcon} />
        <span className={styles.emptyContent}>
          {i18n.t('unknownInfo')}
        </span>
      </div>
  </div>)
}
const NoBalanceDetail = () => {
  return (<div className={styles.noBalanceContainer}>
    <div className={styles.noBalanceTopContainer}>
      <img src="/img/reminder.svg" className={styles.reminderIcon} />
      <p className={styles.reminderTitle}>
        {i18n.t('reminder')}
      </p>
    </div>
    <p className={styles.reminderContent}>
      {i18n.t('notActiveAccountTip')}
    </p>
  </div>)
}

const TX_STATUS = {
  PENDING: "PENDING",
  SUCCESS: "applied",
  FAILED: "failed",
}

const TxItem = ({ txData, currentAccount }) => {
  const {
    statusIcon,
    showAddress,
    timeInfo,
    amount,
    statusText,
    statusStyle,
    showPendTx
  } = useMemo(() => {
    let isReceive = true
    let statusIcon, showAddress, timeInfo, amount, statusText, statusStyle = ''


    if (txData.kind.toLowerCase() === "payment") {
      isReceive = txData.to.toLowerCase() === currentAccount.address.toLowerCase()
      statusIcon = isReceive ? "/img/tx_receive.svg" : "/img/tx_send.svg"
    } else if(txData.kind.toLowerCase() === "zkapp"){
      isReceive = false
      statusIcon = "/img/tx_history_zkapp.svg"
    }else {
      statusIcon = "/img/tx_pending.svg"
    }

    showAddress = addressSlice(isReceive ? txData.from : txData.to, 8)
    showAddress = !showAddress ? txData.kind.toUpperCase() : showAddress

    timeInfo = txData.status === TX_STATUS.PENDING ? "Nonce " + txData.nonce : getShowTime(txData.dateTime)


    amount = amountDecimals(txData.amount, cointypes.decimals)
    amount = getDisplayAmount(amount, 2)
    amount = isReceive ? "+" + amount : "-" + amount

    if(txData.kind.toLowerCase() === "zkapp"){
      amount = "0"
    }

    let showPendTx = false

    if(txData.status === TX_STATUS.PENDING){
      statusStyle = styles.itemStatus_Pending
      showPendTx = true
      statusText = i18n.t(txData.status && txData.status.toUpperCase()) 
    }else{
      if(txData.failureReason){
        statusStyle = styles.itemStatus_Failed
        statusText = i18n.t("FAILED")
      }else{
        statusStyle = styles.itemStatus_Success
        statusText = i18n.t("APPLIED")
      }
    }

    return {
      statusIcon,
      showAddress,
      timeInfo,
      amount,
      statusText,
      statusStyle,
      showPendTx
    }
  }, [txData, i18n])

  const history = useHistory()
  const onToDetail = useCallback(() => {
    history.push({
      pathname: '/record_page',
      params: { txDetail: txData }
    })
  }, [txData])

  return (<div className={cls(styles.itemContainer, {
    [styles.pendingCls]: showPendTx
  })} onClick={onToDetail}>
    <div className={styles.itemLeftContainer}>
      <img src={statusIcon} className={styles.txStatusIcon} />
      <div className={styles.itemAccount}>
        <p className={styles.itemAccountAddress}>{showAddress}</p>
        <p className={styles.itemAccountInfo}>{timeInfo}</p>
      </div>
    </div>
    <div className={styles.itemRightContainer}>
      <p className={styles.itemAmount}> {amount} </p>
      <div className={cls(styles.itemStatus, statusStyle)}>
        {statusText}
      </div>
    </div>
  </div>)
}