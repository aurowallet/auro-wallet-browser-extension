import cx from "classnames";
import extension from 'extensionizer';
import React from "react";
import { connect } from "react-redux";
import { cointypes, EXPLORER_URL } from '../../../../config';
import goNext from "../../../assets/images/goNext.png";
import pending from "../../../assets/images/pending.png";
import success from "../../../assets/images/success.png";
import txFailed from "../../../assets/images/txFailed.png";
import { FROM_BACK_TO_RECORD, TX_SUCCESS } from '../../../constant/types';
import { getLanguage } from "../../../i18n";
import { updateShouldRequest } from "../../../reducers/accountReducer";
import { openTab } from '../../../utils/commonMsg';
import { copyText, getAmountDisplay } from "../../../utils/utils";
import CustomView from "../../component/CustomView";
import Toast from "../../component/Toast";
import "./index.scss";

const DECIMALS = cointypes.decimals

const STATUS = {
  TX_STATUS_PENDING: "PENDING",
  TX_STATUS_SUCCESS: "applied",
  TX_STATUS_INCLUDED: "INCLUDED",

  TX_STATUS_FAILED: "failed",
  TX_STATUS_UNKNOWN: "UNKNOWN"
}

class Record extends React.Component {
  constructor(props) {
    super(props);
    let txDetail = props.location.params?.txDetail;
    this.state = {
      txStatus: txDetail.status || STATUS.TX_STATUS_PENDING,
      txDetail
    };
    this.isUnMounted = false;
  }
  componentDidMount() {
    this.startListener()
  }
  componentWillUnmount(){
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
  startListener = () => {
    extension.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
      const { type, action } = message;
      if (type === FROM_BACK_TO_RECORD && action === TX_SUCCESS) {
        this.callSetState({
          txStatus: STATUS.TX_STATUS_INCLUDED
        })
        this.props.updateShouldRequest(true,true)
        sendResponse();
      }
      return true;
    });
  }

  onCopy = (title, content) => {
    copyText(content).then(()=>{
      Toast.info(title + " " + getLanguage('copySuccess'))
    })
  }
  renderDetailItem = (title, content) => {
    return (
      <div onClick={() => this.onCopy(title, content)} className="record-detail-item">
        <p className="record-detail-title">{title}</p>
        <p className="record-detail-content  click-cursor">{content}</p>
      </div>
    )
  }
  renderDetail = () => {
    let receive = this.state.txDetail.to ||String(this.state.txDetail.receiver)
    let toAddress =this.state.txDetail.from || String(this.state.txDetail.sender)
    let memo = this.state.txDetail.memo
    let time = this.state.txDetail.time
    return (
      <div className="record-detail-container">
        {this.renderDetailItem(getLanguage('amount'), getAmountDisplay(this.state.txDetail.amount, DECIMALS) + " " + cointypes.symbol)}
        {this.renderDetailItem(getLanguage('toAddress'), receive)}
        {this.renderDetailItem(getLanguage('fromAddress'), toAddress)}
        {memo && this.renderDetailItem("Memo", memo)}
        {this.renderDetailItem(getLanguage('fee'), getAmountDisplay(this.state.txDetail.fee, DECIMALS) + " " + cointypes.symbol)}
        {time && this.renderDetailItem(getLanguage('txTime'), time)}
        {this.renderDetailItem("Nonce", String(this.state.txDetail.nonce))}
        {this.renderDetailItem(getLanguage('txHash'), this.state.txDetail.hash)}
      </div>
    )
  }
  goToExplorer = () => {
    let url = EXPLORER_URL + this.state.txDetail.hash
    openTab(url)
  }
  renderDetailExplorer = () => {
    return (
      <div className={"record-bottom"} onClick={this.goToExplorer} >
        <p className="backup-success-dividedline"></p>
        <div className={"record-explorer-inner-container  click-cursor"}>
          <p className={"record-explorer-title"}>{getLanguage('goToExplrer')}</p>
          <img className={"record-arrow"} src={goNext} />
        </div>
      </div>
    )
  }

  getStatusSource = () => {
    let status = {
      source: pending,
      text: getLanguage('txPending'),
      className: "tx-pending-title"
    }
    switch (this.state.txStatus) {
      case STATUS.TX_STATUS_SUCCESS:
      case STATUS.TX_STATUS_INCLUDED:
        status.source = success,
          status.text = getLanguage('txSuccess')
        status.className = "tx-success-title"
        break;
      case STATUS.TX_STATUS_FAILED:
      case STATUS.TX_STATUS_UNKNOWN:
        status.source = txFailed,
          status.text = getLanguage('txFailed')
        status.className = "tx-failed-title"
        break;

      default:
        break;
    }
    return status
  }

  render() {
    let status = this.getStatusSource()
    let imgSource = status.source
    let txStatusTitle = status.text
    const onBack = this.props.location.params?.onGoBack;
    return (
      <CustomView
        title={getLanguage('details')}
        onGoBack={onBack ?? null}
        history={this.props.history}>
        <div className="backup-success-container">
          <div className="backup-top-container">
            <img className={"record-head-img"} src={imgSource}></img>
            <p className={
              cx({
                "tx-common-title": true,
                [status.className]: true,
              })
            }>{txStatusTitle}</p>
            <p className="backup-success-dividedline"></p>
          </div>
          {this.renderDetail()}
        </div>
        {this.renderDetailExplorer()}
      </CustomView>
    )
  }
}

const mapStateToProps = (state) => ({});

function mapDispatchToProps(dispatch) {
  return {
    updateShouldRequest: (shouldRefresh,isSilent) => {
      dispatch(updateShouldRequest(shouldRefresh,isSilent))
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Record);
