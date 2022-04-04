import BigNumber from 'bignumber.js';
import cx from "classnames";
import extensionizer from "extensionizer";
import React from "react";
import { Trans } from 'react-i18next';
import { connect } from "react-redux";
import { cointypes } from '../../../../config';
import dappConnectIcon from "../../../assets/images/dapp_connect.svg";
import dappDisconnectIcon from "../../../assets/images/dapp_disconnect.svg";
import goNext from "../../../assets/images/goNext.png";
import homeNoTx from "../../../assets/images/homeNoTx.png";
import home_wallet from "../../../assets/images/home_wallet.png";
import loadingCommon from "../../../assets/images/loadingCommon.gif";
import pointNormal from "../../../assets/images/pointNormal.png";
import refreshIcon from "../../../assets/images/refresh.svg";
import reminder from "../../../assets/images/reminder.png";
import selectArrow from "../../../assets/images/selectArrow.svg";
import home_logo from "../../../assets/images/transparentLogo.png";
import txArrow from "../../../assets/images/txArrow.png";
import txCommonType from "../../../assets/images/txCommonType.png";
import txReceive from "../../../assets/images/txReceive.png";
import txSend from "../../../assets/images/txSend.png";
import { getBalance, getCurrencyPrice, getPendingTxList, getTransactionList } from "../../../background/api";
import { saveLocal } from '../../../background/localStorage';
import { NET_WORK_CONFIG } from '../../../constant/storageKey';
import { DAPP_DISCONNECT_SITE, DAPP_GET_CONNECT_STATUS, WALLET_GET_ALL_ACCOUNT } from '../../../constant/types';
import { NET_CONFIG_TYPE } from '../../../constant/walletType';
import { getLanguage } from "../../../i18n";
import { ACCOUNT_BALANCE_CACHE_STATE, setBottomType, updateAccountTx, updateCurrentAccount, updateNetAccount, updateShouldRequest, updateStakingRefresh } from "../../../reducers/accountReducer";
import { setAccountInfo, updateCurrentPrice } from "../../../reducers/cache";
import { updateNetConfig } from "../../../reducers/network";
import { openTab, sendMsg } from '../../../utils/commonMsg';
import { addressSlice, amountDecimals, copyText, getCurrentNetConfig, getDisplayAmount, getOriginFromUrl, getShowTime, isNumber, sendNetworkChangeMsg } from "../../../utils/utils";
import Button, { BUTTON_TYPE_CANCEL } from "../../component/Button";
import Clock from '../../component/Clock';
import ConfirmModal from '../../component/ConfirmModal';
import DialogModal from '../../component/DialogModal';
import Select from '../../component/Select';
import Toast from "../../component/Toast";
import "./index.scss";


const BOTTOM_TYPE = {
  BOTTOM_TYPE_NOT_DEFAULT: "BOTTOM_TYPE_NOT_DEFAULT",
  BOTTOM_TYPE_SHOW_TX: "BOTTOM_TYPE_SHOW_TX",
  BOTTOM_TYPE_LOADING: "BOTTOM_TYPE_LOADING",
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
      refreshing: false,
      showConncetHover: false,
      currentAccountConnectDAppStatus:false
    }
    this.isUnMounted = false;
    this.siteUrl = ""
    this.modal = React.createRef();
  }
  componentWillUnmount() {
    this.isUnMounted = true;
  }
  getInitBottomType = () => {
    const { accountInfo, netConfig, txList } = this.props
    let bottomTipType = ""
    if (accountInfo.homeBottomType) {
      bottomTipType = accountInfo.homeBottomType
    } else {
      const netType = netConfig.currentConfig?.netType
      if (netType === NET_CONFIG_TYPE.Unknown) {
        bottomTipType = BOTTOM_TYPE.BOTTOM_TYPE_NOT_DEFAULT
      } else {
        if (txList.length > 0) {
          bottomTipType = BOTTOM_TYPE.BOTTOM_TYPE_SHOW_TX
        } else {
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
    if (this.state.bottomTipType !== BOTTOM_TYPE.BOTTOM_TYPE_NOT_DEFAULT) {
      this.fetchData(address, true)
    } else {
      this.fetchData(address)
    }
    this.getDappConnect()
    this.checkLocalWatchWallet()
  }
  getDappConnect() {
    let { currentAccount } = this.props
    let address = currentAccount.address
    let that = this
    extensionizer.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      let url = tabs[0]?.url || ""
      let origin = getOriginFromUrl(url)
      that.siteUrl = origin
      sendMsg({
        action: DAPP_GET_CONNECT_STATUS,
        payload: {
          siteUrl: origin,
          address
        }
      }, (isConnected) => {
        that.callSetState({
          currentAccountConnectDAppStatus:isConnected
        })
      })
    });
  }

  dappAccountSort = (list, address) => {
    list.map((item, index) => {
      if (item.address === address) {
        list.unshift(list.splice(index, 1)[0]);
      }
    })
    return list
  }
  onModalConfirm = () => {
    ConfirmModal.hide()
    this.goToPage("/account_manage")
  }

  renderTipContent = () => {
    return (
      <div className={'walletWatchTipContainer'}><Trans
        i18nKey={"watchModeDeleteTip"}
        components={{ red: <span className={"walletWatchLink"} /> }}
      /></div>)
  }
  showWatchModeTip = () => {
    let title = getLanguage('prompt')
    let elementContent = this.renderTipContent
    ConfirmModal.show({
      title,
      elementContent,
      widthAuto:true,
      confirmText: getLanguage("watchModeDeleteBtn"),
      onConfirm: this.onModalConfirm,
    })
  }
  checkLocalWatchWallet = () => {
    sendMsg({
      action: WALLET_GET_ALL_ACCOUNT,
    }, (account) => {
      let watchList = account.accounts.watchList
      if (watchList.length > 0) {
        this.showWatchModeTip()
      }
    })
  }
  setHomeBottomType = () => {
    this.props.setBottomType(this.state.bottomTipType)
  }
  fetchPrice = async (currency) => {
    const { currentConfig } = this.props.netConfig
    if (currentConfig.netType == NET_CONFIG_TYPE.Mainnet) {
      const { currentCurrency } = this.props
      let lastCurrency = currentCurrency
      if (currency) {
        lastCurrency = currency
      }
      let price = await getCurrencyPrice(lastCurrency.key)
      if (isNumber(price)) {
        this.props.updateCurrentPrice(price)
      }
    }
  }
  fetchData = async (address, silent = false) => {
    let { currentAccount, shouldRefresh } = this.props
    let currentAddress = currentAccount.address
    // if (!shouldRefresh) {
    //   return
    // }
    this.props.updateShouldRequest(false)
    getBalance(address).then((account) => {
      if (account.publicKey) {
        this.props.updateNetAccount(account)
      } else if(account.error){
        Toast.info(getLanguage('nodeError'))
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
    let { currentAccount, balance, netAccount, currentCurrency, cache, accountInfo, netConfig } = this.props
    const netType = netConfig.currentConfig?.netType
    let showCurrency = netType == NET_CONFIG_TYPE.Mainnet ? true : false

    let DelegateState = !!netAccount.delegate && netAccount.delegate !== currentAccount.address
    let deleText = DelegateState ? getLanguage("stakingStatus_1") : getLanguage("stakingStatus_2")
    let amount = getDisplayAmount(balance)
    let unitBalance = "--"
    if (cache.currentPrice) {
      unitBalance = new BigNumber(cache.currentPrice).multipliedBy(balance).toString()
      unitBalance = currentCurrency.symbol + getDisplayAmount(unitBalance, 2)
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
          <p className={cx("account-symbol", {
            "cache-balance": isCache
          })}>{cointypes.symbol}</p>
        </div>
        {showCurrency && <div className={'wallet-currency-container'}>
          <p className={cx("base-current-balance", {
            "current-balance": !isCache,
            "cache-balance": isCache,
          })}>{unitBalance}</p>
        </div>}
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
  renderModalTitle = () => {
    return (<div className={''}>
      <p className={'dappModalTitle'}>
        {this.siteUrl}
      </p>
    </div>)
  }

  onClickDisconnect = () => {
      let { currentAccount } = this.props
      let address = currentAccount.address
      sendMsg({
        action: DAPP_DISCONNECT_SITE,
        payload: {
          siteUrl: this.siteUrl,
          address,
        }
      }, (status) => {
        this.callSetState({
          currentAccountConnectDAppStatus:!status
        })
        if(status){
          this.onCloseModal()
          Toast.info(getLanguage('disconnectSuccess'))
        }else{
          Toast.info(getLanguage('disconnectFailed'))
        }
      })
  }

  renderContent = () => { 
    const { currentAccountConnectDAppStatus } = this.state
    if (currentAccountConnectDAppStatus) {
      return(<div className={"wallet-connect-disconnect"}>
      <p className={"walletDisconnectContent"}>
        {getLanguage('walletConnected')}
      </p>
      <div className='walletDisconnectBtn'>
      <Button
            buttonType={BUTTON_TYPE_CANCEL} 
            content={getLanguage('setDappDisconnet')}
            propsClass={'modal-button-width'}
            onClick={() => {
              this.onClickDisconnect()
            }}
        />
      </div>
    </div>)
    } else {
      return (<div className={"wallet-connect-disconnect"}>
        <p className={"walletDisconnectContent"}>
          {getLanguage('noAccountConnect')}
        </p>
      </div>)
    }
  }
  renderChangeModal = () => {
    return (<DialogModal
      ref={this.modal}
      showClose={true}
      touchToClose={true}
    >
      <div className={'wallet-connect-container'}>
        {this.renderModalTitle()}
        {this.renderContent()}
      </div>
    </DialogModal>)
  }
  onClickDappConnect = (e) => {
    this.modal.current.setModalVisible(true)
  }
  onCloseModal = () => {
    this.modal.current.setModalVisible(false)
  }
  renderWalletInfo = () => {
    let currentConnected =  this.state.currentAccountConnectDAppStatus
    let showTip = currentConnected ? getLanguage("dappConnect") : getLanguage("dappDisconnect")
    let imgSrc = currentConnected ? dappConnectIcon : dappDisconnectIcon
    return (<div className="wallet-info">
      {this.renderAccount()}
      <div className={"wallet-icon-con"}>
        <div className={cx('dapp-icon-inner-con click-cursor', {
          "dapp-icon-inner-con-dis": !currentConnected
        })} onClick={this.onClickDappConnect}>
          <span className="baseTip tooltiptext">{showTip}</span>
          <img src={imgSrc} className={"dapp-connect-icon"} />
        </div>
        <img className="account-manager click-cursor" src={pointNormal}
          onClick={() => {
            let { currentAccount } = this.props
            this.props.setAccountInfo(currentAccount)
            this.goToPage("/account_info")
          }}
        ></img>
      </div>
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
    let netConfig = getCurrentNetConfig()
    let url = netConfig.explorer + "/wallet/" + this.props.currentAccount.address
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
    let timeText = status === STATUS.TX_STATUS_PENDING ? "Nonce " + item.nonce : getShowTime(item.time)
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
    const { txList, netConfig } = this.props
    if (txList.length <= 0) {
      return this.getBottomRenderContainer(this.renderNoBalance())
    }
    const { currentConfig } = netConfig
    let showPrice = false
    if (currentConfig.netType == NET_CONFIG_TYPE.Mainnet) {
      showPrice = true
    }
    return (
      <div className={cx("tx-container",
        { "tx-container-more": showPrice }
      )}>
        <div className="tx-title">
          {getLanguage('history')}
          <div
            className={cx('refresh-icon-con', { 'loading': this.state.refreshing })}
            onClick={this.onRefresh}>
            <img src={refreshIcon} />
          </div>
        </div>
        {txList.map((item, index) => {
          return this.renderTxList(item, index)
        })}
      </div>
    )
  }

  renderNoTx = () => {
    return (
      <div className={"tx-container"}>
        <div className="tx-title">
          {getLanguage('history')}
        </div>
        <div className={"home-bottom-tip"}>
          <img className={"history-img"} src={homeNoTx} />
          <p className={"history-content-noTx"}>{getLanguage('unknownInfo')}</p>
        </div>
      </div>
    )
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
        return this.renderNoTx()
      case BOTTOM_TYPE.BOTTOM_TYPE_SHOW_TX:
        return this.renderHistory()
      default:
        return <></>
    }
  }
  handleChange = (item) => {
    const { currentConfig, currentNetConfig, netList } = this.props.netConfig
    if (item.key !== currentConfig.url) {
      let newConfig = {}
      for (let index = 0; index < netList.length; index++) {
        const config = netList[index];
        if (config.url === item.key) {
          newConfig = config
          break
        }
      }
      let nextBottomType = BOTTOM_TYPE.BOTTOM_TYPE_LOADING
      if (newConfig.netType === NET_CONFIG_TYPE.Unknown) {
        nextBottomType = BOTTOM_TYPE.BOTTOM_TYPE_NOT_DEFAULT
      }
      this.callSetState({
        bottomTipType: nextBottomType
      }, () => {
        let config = {
          ...currentNetConfig,
          currentConfig: newConfig
        }
        saveLocal(NET_WORK_CONFIG, JSON.stringify(config))
        this.props.updateNetConfig(config)
        this.props.updateShouldRequest(true)
        this.props.updateStakingRefresh(true)

        sendNetworkChangeMsg(newConfig)

        setTimeout(() => {
          this.onRefresh()
        }, 0)
      })

    }
  };
  renderNetSelect = () => {
    const { netSelectList, currentNetName } = this.props.netConfig
    return (
      <div className={"wallet-select-con"}>
        <Select
          options={netSelectList}
          defaultValue={currentNetName}
          onChange={this.handleChange}
          arrowSrc={selectArrow}
          selfInputProps={"wallet-self-select"}
        />
      </div>
    )
  }
  render() {
    return (
      <div className="wallet-page-container">
        <div className="wallet-top-background " >
          <div className="wallet-top-container">
            <img className={'wallet-home-logo'} src={home_logo} />
            <div className={"wallet-net-change"}>
              {this.renderNetSelect()}
              <img className="wallet-home-wallet click-cursor" src={home_wallet}
                onClick={() => this.goToPage("/account_manage")}
              />
            </div>
          </div>
          {this.renderWalletInfo()}
        </div>
        {this.getBottomRender()}
        {this.renderChangeModal()}
        <Clock schemeEvent={() => { this.fetchData(this.props.currentAccount.address, true) }} />
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
    updateCurrentAccount: (account) => {
      dispatch(updateCurrentAccount(account))
    },
    updateNetConfig: (config) => {
      dispatch(updateNetConfig(config))
    },
    updateStakingRefresh: (isRefresh) => {
      dispatch(updateStakingRefresh(isRefresh))
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Wallet);
