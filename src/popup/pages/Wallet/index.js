import BigNumber from 'bignumber.js';
import cx from "classnames";
import React from "react";
import { connect } from "react-redux";
import goNext from "../../../assets/images/goNext.png";
import homeNoTx from "../../../assets/images/homeNoTx.png";
import home_logo from "../../../assets/images/transparentLogo.png";
import home_wallet from "../../../assets/images/home_wallet.png";
import pointNormal from "../../../assets/images/pointNormal.png";

import reminder from "../../../assets/images/reminder.png";
import txArrow from "../../../assets/images/txArrow.png";
import { fetchDaemonStatus, getBalance, getCurrencyPrice, getPendingTxList, getTransactionList } from "../../../background/api";
import { cointypes, EXPLORER_URL } from '../../../../config';
import { getLanguage } from "../../../i18n";
import { ACCOUNT_BALANCE_CACHE_STATE, setBottomType, updateAccountTx, updateNetAccount, updateShouldRequest } from "../../../reducers/accountReducer";
import { setAccountInfo, updateCurrentPrice } from "../../../reducers/cache";
import { NET_CONFIG_DEFAULT } from "../../../reducers/network";
import { openTab, sendMsg } from '../../../utils/commonMsg';
import { addressSlice, amountDecimals, copyText, getDisplayAmount, isNumber } from "../../../utils/utils";
import Button from "../../component/Button";
import Toast from "../../component/Toast";
import "./index.scss";


import txReceive from "../../../assets/images/txReceive.png";
import txSend from "../../../assets/images/txSend.png";
import txCommonType from "../../../assets/images/txCommonType.png";
import loadingCommon from "../../../assets/images/loadingCommon.gif";
import refreshIcon from "../../../assets/images/refresh.svg";
import { ERROR_TYPE } from '../../../constant/errType';
import Clock from '../../component/Clock';
import { WALLET_GET_ALL_ACCOUNT } from '../../../constant/types';
import ConfirmModal from '../../component/ConfirmModal';
import { Trans } from 'react-i18next';
import { getLocal, saveLocal } from '../../../background/localStorage';
import { WATCH_MODE_TIP_SHOW } from '../../../constant/storageKey';
import { ACCOUNT_TYPE } from '../../../constant/walletType';


const BOTTOM_TYPE = {
  BOTTOM_TYPE_NOT_DEFAULT: "BOTTOM_TYPE_NOT_DEFAULT", // 不是默认节点
  BOTTOM_TYPE_SHOW_TX: "BOTTOM_TYPE_SHOW_TX",  // 展示交易记录
  BOTTOM_TYPE_SHOW_REMINDER: "BOTTOM_TYPE_SHOW_REMINDER",  //展示没有交易记录，
  BOTTOM_TYPE_LOADING: "BOTTOM_TYPE_LOADING",// 展示loading
}

const STATUS = {
  TX_STATUS_PENDING: "PENDING",
  TX_STATUS_SUCCESS: "applied",
  TX_STATUS_FAILED: "failed",
}

class Wallet extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      balance: "0.0000",
      txList: props.txList,
      bottomTipType: this.getInitBottomType(),
      refreshing: false
    }
    this.isUnMounted = false;
  }
  componentWillUnmount() {
    this.isUnMounted = true;
  }
  getInitBottomType=()=>{
    const {accountInfo,netConfig,txList} = this.props
    let bottomTipType = ""
    if(accountInfo.homeBottomType){
      bottomTipType = accountInfo.homeBottomType
    }else{
      if (netConfig.netType !== NET_CONFIG_DEFAULT) {
        bottomTipType = BOTTOM_TYPE.BOTTOM_TYPE_NOT_DEFAULT
      }else{
        if(txList.length > 0){
          bottomTipType = BOTTOM_TYPE.BOTTOM_TYPE_SHOW_TX
        }else{
          bottomTipType = BOTTOM_TYPE.BOTTOM_TYPE_LOADING
        }
      }
    }
    return bottomTipType
  }
  callSetState = (data, callback) => { 
    if (!this.isUnMounted) {
      this.setState({
        ...data
      }, () => {
        callback && callback()
      })
    }
  }
  async componentDidMount() {
    let { currentAccount } = this.props
    let address = currentAccount.address
    if(this.state.bottomTipType !== BOTTOM_TYPE.BOTTOM_TYPE_NOT_DEFAULT){
      this.fetchData(address,true)
    }else{
      this.fetchData(address)
    }
    this.checkLocalWatchWallet()
  }
  onModalConfirm = () => {
    ConfirmModal.hide()
    saveLocal(WATCH_MODE_TIP_SHOW, "true")
  }

  renderTipContent=()=>{
    return(
    <div className={'walletWatchTipContainer'}><Trans
      i18nKey={"watchTip"}
      components={{a:<span onClick={()=>{
        this.onModalConfirm()
        this.goToPage("/account_manage")
      }} className={"walletWatchLink click-cursor"}/>}}
    /></div>)
  }
  showWatchModeTip=()=>{
    let title = getLanguage('prompt')
    let elementContent = this.renderTipContent
    ConfirmModal.show({
      title,
      elementContent,
      confirmText:getLanguage("isee"),
      onConfirm: this.onModalConfirm,
    })
  }
  checkLocalWatchWallet=()=>{
    sendMsg({
      action: WALLET_GET_ALL_ACCOUNT,
    }, (account) => {
      let watchList = account.accounts.filter((item, index) => {
        return item.type === ACCOUNT_TYPE.WALLET_WATCH
      })
      if(watchList.length>0){
        let showStatus = getLocal(WATCH_MODE_TIP_SHOW)
        if(!showStatus){
          this.showWatchModeTip()
        }
      }
    })
  }
  setHomeBottomType = () => {
    this.props.setBottomType(this.state.bottomTipType)
  }
  fetchPrice=async (currency)=>{
    const {currentCurrency} = this.props
    let lastCurrency = currentCurrency
    if(currency){
      lastCurrency = currency
    }
    let price = await getCurrencyPrice(lastCurrency.key)
    if(isNumber(price)){
      this.props.updateCurrentPrice(price)
    }
  }
  fetchData = async (address, silent = false) => {
    let { currentAccount, shouldRefresh } = this.props
    let currentAddress = currentAccount.address
    // if (!shouldRefresh) {
    //   return
    // }
    this.props.updateShouldRequest(false)
    getBalance(address).then((accountData) => {
      let account = accountData.account
      let balanceAddress = accountData.address
      if (account.error) {
        if(account.error !== ERROR_TYPE.CanceRequest){
          Toast.info(getLanguage('nodeError'))
        }
      } else if (account && account.account && balanceAddress === currentAddress) {
        this.props.updateNetAccount(account.account)
      }
    })
    this.fetchPrice()
    if (this.state.bottomTipType !== BOTTOM_TYPE.BOTTOM_TYPE_NOT_DEFAULT) {
      if (!silent) {
        this.callSetState({
          bottomTipType: BOTTOM_TYPE.BOTTOM_TYPE_LOADING
        })
      }
      let txList = getTransactionList(address)
      let pendingTxList = getPendingTxList(address)
      await Promise.all([txList, pendingTxList]).then((data) => {
        let txData = data[0]
        let txAddress = txData.address
        let txList = txData.txList
        
        let txPendingData = data[1]
        let txPendingList = txPendingData.txList
        let txPendingAddress = txPendingData.address
        let newList = []
        if (currentAddress === txPendingAddress) {
          newList = [...txPendingList]
        }
        if (currentAddress === txAddress) {
          newList = [...newList, ...txList]
        }
        this.callSetState({
          bottomTipType: BOTTOM_TYPE.BOTTOM_TYPE_SHOW_TX
        }, () => {
          this.setHomeBottomType()
        })
        this.props.updateAccountTx(txList, txPendingList)
      })
    }
  }

  onClickAddress = () => {
    let { currentAccount } = this.props
    copyText(currentAccount.address).then(() => {
      Toast.info(getLanguage('copySuccess'))
    })

  }
  onRefresh = async () => {
    if (this.state.refreshing) {
      return
    }
    this.setState({
      refreshing: true
    })
    await this.fetchData(this.props.currentAccount.address, true)
    this.setState({
      refreshing: false
    })
  }
  renderAccount = () => {
    let { currentAccount, balance, netAccount,currentCurrency,cache,accountInfo } = this.props
    let DelegateState = !!netAccount.delegate && netAccount.delegate !== currentAccount.address
    let deleText = DelegateState ? getLanguage("stakingStatus_1") : getLanguage("stakingStatus_2")
    let amount = getDisplayAmount(balance)
    let unitBalance = "--"
    if(cache.currentPrice){
      unitBalance = new BigNumber(cache.currentPrice).multipliedBy(balance).toString()
      unitBalance = currentCurrency.symbol + getDisplayAmount(unitBalance,2)
    }
    let isCache = accountInfo.isAccountCache === ACCOUNT_BALANCE_CACHE_STATE.USING_CACHE
    return (
      <div className="account-container">
        <div className="account-address-container">
          <p className="account-name">{currentAccount && currentAccount.accountName}</p>
          <p className={
            cx({
              "stake-status": true,
              "stake-status-undelete": !DelegateState,
            })
          }>{deleText}</p>
        </div>
        <span className="account-address click-cursor" onClick={this.onClickAddress}>{addressSlice(currentAccount.address)}</span>
        <div className={'wallet-balance-container'}>
          <p className={cx("account-balance", {
            "cache-balance": isCache
          })}>{amount}</p>
          <p className={cx("account-symbol",{
            "cache-balance":isCache
            })}>{cointypes.symbol}</p>
        </div>
        <div className={'wallet-currency-container'}>
          <p className={cx("base-current-balance",{
            "current-balance":!isCache,
            "cache-balance":isCache,
          })}>{unitBalance}</p>
        </div>
      </div>)
  }

  goToPage = (name) => {
    this.props.params.history.push({
      pathname: name,
    })
  };
  renderActionBtn = () => {
    return (<div className={"home-button-container"}>
      <Button
        content={getLanguage('send')}
        onClick={() => this.goToPage("/send_page")}
        propsClass={"home-send-btn"}
      />
      <Button
        content={getLanguage('receive')}
        onClick={() => this.goToPage("/receive_page")}
        propsClass={"home-receive-btn"}
      />
    </div>)
  }
  renderWalletInfo = () => {
    return (<div className="wallet-info">
      {this.renderAccount()}
      <img className="account-manager click-cursor" src={pointNormal}
        onClick={() => {
          let { currentAccount } = this.props
          this.props.setAccountInfo(currentAccount)
          this.goToPage("/account_info")
        }}
      ></img>
      {this.renderActionBtn()}
    </div>)
  }
  getTxSource = (item) => {
    if (item.type.toLowerCase() === "payment") {
      let isReceive = item.receiver.toLowerCase() === this.props.currentAccount.address.toLowerCase()
      return isReceive ? txReceive : txSend
    }
    return txCommonType
  }
  onClickItem = (item) => {
    this.props.params.history.push({
      pathname: "/record_page",
      params: {
        txDetail: item
      }
    })
  }
  getStatusColor = (item) => {
    let className = "tx-pending-title"
    switch (item.status) {
      case STATUS.TX_STATUS_SUCCESS:
        className = "tx-success-title"
        break;
      case STATUS.TX_STATUS_FAILED:
        className = "tx-failed-title"
        break;
      default:
        break;
    }
    return className
  }
  onClickGoExplorer = () => {
    let url = EXPLORER_URL + "?account=" + this.props.currentAccount.address
    openTab(url)
  }
  renderListExplorer = (index) => {
    return (<div key={index + ""} onClick={this.onClickGoExplorer} className={"home-bottom-explorer click-cursor"}>
      <p className={"history-content"}>{getLanguage('goToExplorer')}</p>
      <img className={"history-img"} src={goNext} />
    </div>)
  }
  renderTxList = (item, index) => {
    if (item.showExplorer) {
      return this.renderListExplorer(index)
    }
    let isReceive = true
    if (item.type.toLowerCase() === "payment" || item.type.toLowerCase() === "delegation") {
      isReceive = item.receiver.toLowerCase() === this.props.currentAccount.address.toLowerCase()
    }
    let showAddress = addressSlice(isReceive ? item.sender : item.receiver, 8)
    showAddress = !showAddress ? item.type.toUpperCase() : showAddress
    let amount = amountDecimals(item.amount, cointypes.decimals)
    amount = getDisplayAmount(amount, 2)
    amount = isReceive ? "+" + amount : "-" + amount
    let status = item.status
    let statusText = getLanguage(status && status.toUpperCase())
    let imgSource = this.getTxSource(item)
    let statusColor = this.getStatusColor(item)
    let timeText = status === STATUS.TX_STATUS_PENDING ? "Nonce "+item.nonce : item.time
    return (
      <div key={index + ""} className={"tx-item-container click-cursor"} onClick={() => { this.onClickItem(item) }}>
        <div className={"tx-item-left"}>
          <img className={"tx-item-type"} src={imgSource} />
        </div>

        <div className={"tx-detail-container"}>
          <div className={"tx-top-container"}>
            <p className="tx-item-address">{showAddress}</p>
            <p className={cx({
              "tx-item-amount": true,
            })}>{amount}</p>
          </div>
          <div className={'tx-bottom-container'}>
            <p className="tx-item-time">{timeText}</p>
            <p className={cx({
              "tx-item-status": true,
              [statusColor]: true
            })}>{statusText}</p>
          </div>
        </div>
        <div className={"tx-item-right"}>
          <img className="tx-item-arrow" src={txArrow} />
        </div>
      </div>
    )
  }
  renderHistory = () => {
    let txList = this.props.txList
    if (txList.length <= 0) {
      return this.getBottomRenderContainer(this.renderNoBalance())
    }
    return (
      <div className={"tx-container"}>
        <div className="tx-title">
          {getLanguage('history')}
          <div
            className={cx('refresh-icon-con', {'loading': this.state.refreshing})}
            onClick={this.onRefresh}>
            <img src={refreshIcon}/>
          </div>
        </div>
        {txList.map((item, index) => {
          return this.renderTxList(item, index)
        })}
      </div>
    )
  }

  renderNoTx = () => {
    return (<div className={"home-bottom-tip"}>
      <img className={"history-img"} src={homeNoTx} />
      <p className={"history-content-noTx"}>{getLanguage('homeNoTx')}</p>
    </div>)
  }
  renderNoBalance = () => {
    return (<>
      <div className={"reminder-top-container"}>
        <img src={reminder} className={"reminder-img"} />
        <p className={"reminder-title"}>{getLanguage('walletHomeTitle')}</p>
      </div>
      <p className={"reminder-content"}>{getLanguage('walletHomeTip')}</p>
    </>)
  }
  getBottomRenderContainer = (child) => {
    return (<div className={
      cx({
        "reminder-container": true,
        "reminder-container-txHistory": true
      })
    }>
      {child}
    </div>)
  }
  renderLoading = () => {
    return (
      <div className={"home-bottom-loading"}>
        <img className={"loading-img"} src={loadingCommon} />
      </div>
    )
  }

  getBottomRender = () => {
    let child
    switch (this.state.bottomTipType) {
      case BOTTOM_TYPE.BOTTOM_TYPE_LOADING:
        child = this.renderLoading()
        return this.getBottomRenderContainer(child)
      case BOTTOM_TYPE.BOTTOM_TYPE_NOT_DEFAULT:
        child = this.renderNoTx()
        return this.getBottomRenderContainer(child)
      case BOTTOM_TYPE.BOTTOM_TYPE_SHOW_TX:
        return this.renderHistory()
      default:
        return <></>
    }
  }
  render() {
    return (
      <div className="wallet-page-container">
        <div className="wallet-top-background " >
          <div className="wallet-top-container">
            <img className={'wallet-home-logo'} src={home_logo} />
            <img className="wallet-home-wallet click-cursor" src={home_wallet}
              onClick={() => this.goToPage("/account_manage")}
            />
          </div>
          {this.renderWalletInfo()}
        </div>
        {this.getBottomRender()}
        <Clock schemeEvent={() => { this.fetchData(this.props.currentAccount.address,true) }} />
      </div>)
  }
}

const mapStateToProps = (state) => ({
  currentAccount: state.accountInfo.currentAccount,
  netAccount: state.accountInfo.netAccount,
  balance: state.accountInfo.balance,
  txList: state.accountInfo.txList,
  accountInfo: state.accountInfo,
  netConfig: state.network,
  shouldRefresh: state.accountInfo.shouldRefresh,
  cache: state.cache,
  currentCurrency: state.currencyConfig.currentCurrency,
});

function mapDispatchToProps(dispatch) {
  return {
    updateNetAccount: (netAccount) => {
      dispatch(updateNetAccount(netAccount))
    },
    updateAccountTx: (txList, txPendingList) => {
      dispatch(updateAccountTx(txList, txPendingList))
    },
    setAccountInfo: (account) => {
      dispatch(setAccountInfo(account))
    },
    updateShouldRequest: (shouldRefresh) => {
      dispatch(updateShouldRequest(shouldRefresh))
    },
    setBottomType: (type) => {
      dispatch(setBottomType(type))
    },
    updateCurrentPrice: (price) => {
      dispatch(updateCurrentPrice(price))
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Wallet);
