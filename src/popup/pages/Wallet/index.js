import BigNumber from 'bignumber.js';
import cx from "classnames";
import React from "react";
import { connect } from "react-redux";
import goNext from "../../../assets/images/goNext.png";
import homeNoTx from "../../../assets/images/homeNoTx.png";
import home_logo from "../../../assets/images/home_logo.png";
import home_wallet from "../../../assets/images/home_wallet.png";
import pointNormal from "../../../assets/images/pointNormal.png";
import receive from "../../../assets/images/receive.png";
import reminder from "../../../assets/images/reminder.png";
import txArrow from "../../../assets/images/txArrow.png";
import { getBalance, getPendingTxList, getTransactionList } from "../../../background/api";
import { cointypes, EXPLORER_URL } from '../../../../config';
import { getLanguage } from "../../../i18n";
import { updateAccountTx, updateNetAccount, updateShouldRequest } from "../../../reducers/accountReducer";
import { setAccountInfo, setBottomType } from "../../../reducers/cache";
import { NET_CONFIG_DEFAULT } from "../../../reducers/network";
import { openTab } from '../../../utils/commonMsg';
import { addressSlice, amountDecimals, copyText, getDisplayAmount } from "../../../utils/utils";
import Button from "../../component/Button";
import Toast from "../../component/Toast";
import "./index.scss";


import txReceive from "../../../assets/images/txReceive.png";
import txSend from "../../../assets/images/txSend.png";
import txCommonType from "../../../assets/images/txCommonType.png";
import loadingCommon from "../../../assets/images/loadingCommon.gif";


const BOTTOM_TYPE ={
  BOTTOM_TYPE_NONE:"BOTTOM_TYPE_NONE",
  BOTTOM_TYPE_NOT_DEFAULT:"BOTTOM_TYPE_NOT_DEFAULT",
  BOTTOM_TYPE_SHOW_TX:"BOTTOM_TYPE_SHOW_TX",
  BOTTOM_TYPE_SHOW_REMINDER:"BOTTOM_TYPE_SHOW_REMINDER",
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
      bottomTipType: props.cache.homeBottomType||BOTTOM_TYPE.BOTTOM_TYPE_NONE,
      isLoading: false,
    }
    this.isUnMounted = false;
  }
  componentWillUnmount() {
    this.isUnMounted = true;
  }
  callSetState=(data,callback)=>{
    if(!this.isUnMounted){
      this.setState({
        ...data
      },()=>{
        callback&&callback()
      })
    }
  }
  async componentDidMount() {
    let { currentAccount, shouldRefresh } = this.props
    let address = currentAccount.address
    this.setBottomTipType()
    if (shouldRefresh && !this.isUnMounted) {
      this.fetchData(address)
    }
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.currentAccount.address && nextProps.currentAccount.address !== this.props.currentAccount.address) {
      this.fetchData(nextProps.currentAccount.address)
    }
  }

  setBottomTipType = () => {
    let balance = this.props.balance
    let netConfig = this.props.netConfig
    let lastType = this.state.bottomTipType

    if(netConfig.netType !== NET_CONFIG_DEFAULT){
      lastType = BOTTOM_TYPE.BOTTOM_TYPE_NOT_DEFAULT 
    }
    if (lastType !== this.state.bottomTipType) {
      this.callSetState({
        bottomTipType: lastType
      },()=>{
        this.setHomeBottomType()
      })
    }
  }
  setHomeBottomType=()=>{
    this.props.setBottomType(this.state.bottomTipType)
  }
  fetchData = async (address) => {
    let netConfig = this.props.netConfig
    this.callSetState({
      isLoading:true
    })
    let account = await getBalance(address)
    if (account.error) {
      Toast.info(getLanguage('nodeError'))
    } else if (account && account.account) {
      this.props.updateNetAccount(account.account)
    }
    if (netConfig.netType === NET_CONFIG_DEFAULT) {
      let txList = await getTransactionList(address)
      let txPendingList = await getPendingTxList(address)
      let newList = [...txPendingList,...txList]
      
        if(newList.length>0){
          this.callSetState({
            isLoading: false,
            bottomTipType:BOTTOM_TYPE.BOTTOM_TYPE_SHOW_TX
          },()=>{
            this.setHomeBottomType()
          })
        }else{
          this.callSetState({
            isLoading: false,
            bottomTipType:BOTTOM_TYPE.BOTTOM_TYPE_SHOW_REMINDER
          },()=>{
            this.setHomeBottomType()
          })
        }
      
      this.props.updateAccountTx(txList, txPendingList)
    }else{
      this.callSetState({
        isLoading:false
      })
    }
    this.props.updateShouldRequest(false)
  }

  onClickAddress = () => {
    let { currentAccount } = this.props
    copyText(currentAccount.address).then(() => {
      Toast.info(getLanguage('copySuccess'))
    })

  }
  renderAccount = () => {
    let { currentAccount, balance, netAccount } = this.props
    let DelegateState = !!netAccount.delegate && netAccount.delegate !== currentAccount.address
    let deleText = DelegateState ? getLanguage("stakingStatus_1") : getLanguage("stakingStatus_2")
    let amount = getDisplayAmount(balance)
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
        <p className="account-address click-cursor" onClick={this.onClickAddress}>{addressSlice(currentAccount.address)}</p>
        <div className={'wallet-balance-container'}>
          <p className="account-balance">{amount}</p>
          <p className="account-symbol">{cointypes.symbol}</p>
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
    let showAddress = addressSlice(isReceive ? item.sender : item.receiver)
    showAddress = !showAddress ? item.type.toUpperCase() : showAddress
    let amount = amountDecimals(item.amount, cointypes.decimals)
    amount = getDisplayAmount(amount, 2)
    amount = isReceive ? "+" + amount : "-" + amount
    let status = item.status
    let statusText = getLanguage(status && status.toUpperCase())
    let imgSource = this.getTxSource(item)
    let statusColor = this.getStatusColor(item)
    return (
      <div key={index + ""} className={"tx-item-container click-cursor"} onClick={() => { this.onClickItem(item) }}>
        <div className={"tx-item-left"}>
          <img className={"tx-item-type"} src={imgSource} />
        </div>

        <div className={"tx-detail-container"}>
          <div className={"tx-top-container"}>
            <p className="tx-item-address">{showAddress}</p>
            <p className={cx({
              "tx-item-amount":true,
              })}>{amount} {cointypes.symbol}</p>
          </div>
          <div className={'tx-bottom-container'}>
            <p className="tx-item-time">{item.time}</p>
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
      return (<></>)
    }
    return (
      <div className={"tx-container"}>
        <p className="tx-title">{getLanguage('history')}</p>
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
        <p className={"reminder-title"}>{getLanguage('minaHomeTitle')}</p>
      </div>
      <p className={"reminder-content"}>{getLanguage('minaHomeTip')}</p>
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
    if (this.state.isLoading) {
      child = this.renderLoading()
      return this.getBottomRenderContainer(child)
    }
    switch (this.state.bottomTipType) {
      case BOTTOM_TYPE.BOTTOM_TYPE_NOT_DEFAULT:
        child = this.renderNoTx()
      return this.getBottomRenderContainer(child)
      case BOTTOM_TYPE.BOTTOM_TYPE_SHOW_REMINDER:
        child = this.renderNoBalance()
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
  cache: state.cache
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

  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Wallet);
