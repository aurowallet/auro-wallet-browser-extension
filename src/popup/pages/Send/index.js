import BigNumber from "bignumber.js";
import cx from "classnames";
import React from "react";
import { connect } from "react-redux";
import { cointypes } from "../../../../config";
import downArrow from "../../../assets/images/downArrow.png";
import loadingCommon from "../../../assets/images/loadingCommon.gif";
import modalClose from "../../../assets/images/modalClose.png";
import pwd_right from "../../../assets/images/pwd_right.png";
import { getBalance, getFeeRecom, sendPayment } from "../../../background/api";
import { WALLET_CHECK_TX_STATUS, WALLET_SEND_TRANSTRACTION } from "../../../constant/types";
import { ACCOUNT_TYPE } from "../../../constant/walletType";
import { getLanguage } from "../../../i18n";
import { updateNetAccount, updateShouldRequest } from "../../../reducers/accountReducer";
import { sendMsg } from "../../../utils/commonMsg";
import { checkLedgerConnect, requestSignPayment } from "../../../utils/ledger";
import { getDisplayAmount, isNumber,trimSpace ,isTrueNumber} from "../../../utils/utils";
import { addressValid } from "../../../utils/validator";
import Button from "../../component/Button";
import CustomInput from "../../component/CustomInput";
import CustomView from "../../component/CustomView";
import Loading from "../../component/Loading";
import { FeeSlider } from "../../component/Slider";
import TestModal from "../../component/TestModal";
import Toast from "../../component/Toast";
import "./index.scss";
const FEE_RECOMMED_CHEAPER = 0
const FEE_RECOMMED_DEFAULT = 1
const FEE_RECOMMED_HIGH = 2
const FEE_RECOMMED_CUSTOM = -1

class SendPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      toAddress: "",
      amount: "",
      fee: 0.1,
      addressErr: "",
      amountErr: "",
      feeErr: "",
      btnClick: true,
      confirmModal: false,
      memo: "",
      isOpenAdvance: false,
      inputFee: "",
      nonce: "",
      fromAddress: props.currentAccount.address,
      feeSelect: FEE_RECOMMED_DEFAULT,
      confirmModalLoading: false
    };
    this.modal = React.createRef();
    this.isUnMounted = false;
    this.feeList = [
      {
        text: getLanguage("fee_slow"),
        select: false,
        fee: " "
      }, {
        text: getLanguage("fee_default"),
        select: false,
        fee: " "
      },
      {
        text: getLanguage("fee_fast"),
        select: false,
        fee: " "
      }
    ]
  }
  componentWillUnmount() {
    this.isUnMounted = true;
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
    this.fetchData()
  }

  fetchData = async () => {
    let { currentAccount } = this.props
    let address = currentAccount.address
    let feeRecom = await getFeeRecom()
    if (feeRecom.length > 0) {
      this.feeList.map((item, index) => {
        return item.fee = feeRecom[index].value
      })
      this.callSetState({
        fee: feeRecom[1].value
      })
    }
    let accountData = await getBalance(address)
    let account = accountData.account
    if (account.account) {
      this.props.updateNetAccount(account.account)
    }


  }
  setBtnStatus = () => {
    if (this.state.toAddress.length > 0
      && this.state.amount.length > 0) {
      this.callSetState({
        btnClick: true
      })
    } else {
      this.callSetState({
        btnClick: false
      })
    }
  }


  onToAddressInput = (e) => {
    let address = e.target.value;
    this.callSetState({
      toAddress: address
    }, () => {
      this.setBtnStatus()
    })
  }
  renderToAddress = () => {
    return (<CustomInput
      value={this.state.toAddress}
      label={getLanguage('toAddress')}
      onTextInput={this.onToAddressInput}
    />)
  }
  onAmountInput = (e) => {
    let amount = e.target.value;
    this.callSetState({
      amount: amount
    }, () => {
      this.setBtnStatus()
    })
  }
  renderToAmount = () => {
    let { balance } = this.props
    return (<CustomInput
      value={this.state.amount}
      label={getLanguage('amount')}
      descLabel={getLanguage('balance') + " " + getDisplayAmount(balance)}
      onTextInput={this.onAmountInput}
    />)
  }
  onMemoInput = (e) => {
    let memo = e.target.value;
    this.callSetState({
      memo: memo
    }, () => {
      this.setBtnStatus()
    })
  }
  renderMemo = () => {
    return (<CustomInput
      value={this.state.memo}
      label={getLanguage('memo')}
      onTextInput={this.onMemoInput}
    />)
  }
  onSliderChange = (fee) => {
    this.callSetState({
      fee
    })
  }
  renderFee = () => {
    return (
      <div className={"slider-container"}>
        <div className={"lable-container fee-style"}>
          <p className="pwd-lable-1">{getLanguage('fee')}</p>
          <p className="pwd-lable-desc-1">{this.state.fee}</p>
        </div>
        <FeeSlider
          domain={[0, 1]}
          decimals={4}
          defaultValues={[this.state.fee]}
          onSliderChange={this.onSliderChange}
        />
        <div className={"lable-container fee-style"}>
          <p className="fee-speed">{getLanguage('fee_slow')}</p>
          <p className="fee-speed">{getLanguage('fee_default')}</p>
          <p className="fee-speed">{getLanguage('fee_fast')}</p>
        </div>
      </div>
    )
  }
  onOpenAdvance = () => {
    this.callSetState({
      isOpenAdvance: !this.state.isOpenAdvance
    })
  }

  onFeeInput = (e) => {
    let fee = e.target.value
    this.callSetState({
      inputFee: fee
    }, () => {
      this.setBtnStatus()
      this.callSetState({
        feeSelect: FEE_RECOMMED_CUSTOM
      })
    })
  }
  onNonceInput = (e) => {
    let nonce = e.target.value
    this.callSetState({
      nonce: nonce
    })
  }
  renderAdvanceOption = () => {
    let netAccount = this.props.netAccount
    let nonceHolder = netAccount.inferredNonce ? "Nonce " + netAccount.inferredNonce : "Nonce "
    return (
      <div className={
        cx({
          "advance-option-show": this.state.isOpenAdvance,
          "advance-option-hide": !this.state.isOpenAdvance,
        })
      }>
        <CustomInput
          value={this.state.inputFee}
          placeholder={getLanguage('feePlaceHolder')}
          onTextInput={this.onFeeInput}
        />
        <CustomInput
          value={this.state.nonce}
          placeholder={nonceHolder}
          onTextInput={this.onNonceInput}
        />
      </div>
    )
  }
  renderAdvance = () => {
    const { isOpenAdvance } = this.state;
    return (
      <div className="advancer-outer-container">
        <div
          onClick={this.onOpenAdvance}
          className="advancer-container click-cursor">
          <p className="advance-content">{getLanguage('advanceMode')}</p>
          <img className={cx({
            "down-normal": true,
            "up-advance": isOpenAdvance,
            "down-advance": !isOpenAdvance
          })} src={downArrow}></img>
        </div>
      </div>)
  }

  renderConfirm = () => {
    return (
      <div className="bottom-container">
        <Button
          disabled={!this.state.btnClick}
          content={getLanguage('next')}
          onClick={this.onConfirm}
        />
      </div>)
  }
  renderConfirmItem = (title, content, isAmount) => {
    return (
      <div className={"confirm-item-container"}>
        <div>
          <p className={"confirm-item-title"}>{title}</p>
        </div>
        <p className={
          cx({
            "confirm-item-content": true,
            "confirm-item-content-purple": isAmount
          })
        }>{content}</p>
      </div>
    )
  }
  onConfirm = async () => {
    let toAddress = trimSpace(this.state.toAddress)
    if (!addressValid(toAddress)) {
      Toast.info(getLanguage('sendAddressError'))
      return
    }
    let amount = trimSpace(this.state.amount)
    if (!isNumber(amount) || !new BigNumber(amount).gt(0)) {
      Toast.info(getLanguage('amountError'))
      return
    }
    let inputFee = trimSpace(this.state.inputFee)
    if (inputFee.length > 0 && !isNumber(inputFee)) {
      Toast.info(getLanguage('inputFeeError'))
      return
    }
    let fee = trimSpace(this.state.inputFee) || this.state.fee
    let maxAmount = new BigNumber(amount).plus(fee).toString()
    if (new BigNumber(maxAmount).gt(amount)) {
      Toast.info(getLanguage('balanceNotEnough'))
      return
    }
    let nonce = trimSpace(this.state.nonce)
    if (nonce.length > 0 && !isTrueNumber(nonce)) {
      Toast.info(getLanguage('inputNonceError'))
      return
    }
    this.modal.current.setModalVisable(true)
  }
  onCancel = () => {
    this.modal.current.setModalVisable(false)
  }
  ledgerTransfer = async (params) => {
    const { ledgerApp } = await checkLedgerConnect()
    if (ledgerApp) {
      this.modal.current.setModalVisable(false)
      this.callSetState({
        confirmModalLoading: true
      })
      this.modal.current.setModalVisable(true)
      let currentAccount = this.props.currentAccount
      console.log('currentAccount', currentAccount, typeof currentAccount.hdPath)
      const { signature, payload, error } = await requestSignPayment(ledgerApp, params, currentAccount.hdPath)
      this.modal.current.setModalVisable(false)
      this.callSetState({
        confirmModalLoading: false
      })
      if (error) {
        Toast.info(error.message)
        return
      }
      let postRes = await sendPayment(payload, { rawSignature: signature }).catch(error => error)
      this.onSubmitSuccess(postRes)
    }
  }
  clickNextStep = async () => {
    let currentAccount = this.props.currentAccount
    let netAccount = this.props.netAccount
    let fromAddress = currentAccount.address
    let toAddress = trimSpace(this.state.toAddress)
    let amount = new BigNumber(this.state.amount).toNumber()
    let nonce = trimSpace(this.state.nonce)|| netAccount.inferredNonce
    let memo = this.state.memo || ""
    let fee = trimSpace(this.state.inputFee) || this.state.fee
    let payload = {
      fromAddress, toAddress, amount, fee, nonce, memo
    }
    if (currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER) {
      return this.ledgerTransfer(payload)
    }
    Loading.show()
    this.modal.current.setModalVisable(false)
    sendMsg({
      action: WALLET_SEND_TRANSTRACTION,
      payload
    }, (data) => {
      Loading.hide()
      this.onSubmitSuccess(data)
    })
  }
  onSubmitSuccess = (data) => {
    if (data.error) {
      let err = data.error
      let errorMessage = getLanguage('postFailed')
      if (data.error.message) {
        errorMessage = data.error.message
      }
      if (Array.isArray(err) && err.length > 0) {
        errorMessage = err[0].message
      }
      Toast.info(errorMessage)
      return
    }
    Toast.info(getLanguage('postSuccess'))
    let detail = data.sendPayment && data.sendPayment.payment || {}
    this.props.updateShouldRequest(true)
    sendMsg({
      action: WALLET_CHECK_TX_STATUS,
      payload: {
        paymentId: detail.id,
        hash: detail.hash,
      }
    }, () => { })
    this.props.history.replace({
      pathname: "/record_page",
      params: {
        txDetail: detail
      }
    })
  }
  renderConfirmButton = () => {
    let currentAccount = this.props.currentAccount
    let disabled = currentAccount.type === ACCOUNT_TYPE.WALLET_WATCH
    return (
      <div className={"send-confirm-container"}>
        <Button
          disabled={disabled}
          content={getLanguage('confirm')}
          onClick={this.clickNextStep}
        />
      </div>
    )
  }
  renderConfirmView = () => {
    let lastFee = this.state.inputFee ? this.state.inputFee : this.state.fee
    let nonce = this.state.nonce ? this.state.nonce : ""
    return (
      <div className={"confirm-modal-container"}>
        {this.renderConfirmItem(getLanguage('amount'), this.state.amount + " " + cointypes.symbol, true)}
        {this.renderConfirmItem(getLanguage('toAddress'), this.state.toAddress)}
        {this.renderConfirmItem(getLanguage('fromAddress'), this.state.fromAddress)}
        {nonce && this.renderConfirmItem("Nonce", nonce)}
        {this.renderConfirmItem(getLanguage('fee'), lastFee + " " + cointypes.symbol, true)}
        {this.renderConfirmButton()}
      </div>
    )
  }

  renderLoadingView = () => {
    return (
      <div className={"confirm-loading"}>
        <p className={"confirm-loading-desc"}>{getLanguage('confirmInfoLedger')}</p>
        <img className={"confirm-loading-img"} src={loadingCommon} />
      </div>)
  }
  onCloseModal = () => {
    this.modal.current.setModalVisable(false)
  }
  renderConfirmModal = () => {
    let title = this.state.confirmModalLoading ? "waitLedgerConfirm" : "sendDetail"
    return (<TestModal
      ref={this.modal}
      touchToClose={true}
      title={getLanguage(title)}
    >
      {this.state.confirmModalLoading ? this.renderLoadingView() : this.renderConfirmView()}
      {this.state.confirmModalLoading ? <></> : <img onClick={this.onCloseModal} className="modal-close click-cursor" src={modalClose} />}
    </TestModal>)
  }
  onClickFee = (item, index) => {
    this.callSetState({
      feeSelect: index,
      fee: item.fee
    })
  }
  renderButtonFee = () => {
    return (
      <div className={"button-fee-container"}>
        <div className={"lable-container fee-style"}>
          <p className="pwd-lable-1">{getLanguage('fee')}</p>
          <p className="pwd-lable-desc-1">{this.state.fee}</p>
        </div>
        <div className={"fee-item-container"}>
          {this.feeList.map((item, index) => {
            let selected = index == this.state.feeSelect
            return (
              <div key={index + ""} onClick={() => this.onClickFee(item, index)}
                className={
                  cx({
                    "fee-common": true,
                    "click-cursor": true,
                    "fee-select": selected
                  })
                }>
                <img src={pwd_right} className={
                  cx({
                    "fee-select-img": selected,
                    "fee-select-img-none": !selected,
                  })
                } />
                <p className={"fee-text"}>{item.text}</p>
              </div>
            )

          })}
        </div>
      </div>
    )
  }
  onSubmit = (event) => {
    event.preventDefault();
  }
  render() {
    return (<CustomView
      title={getLanguage('send')}
      history={this.props.history}>
      <form onSubmit={this.onSubmit}>
        <div className="send-container">
          {this.renderToAddress()}
          {this.renderToAmount()}
          {this.renderMemo()}
          {/* {this.renderFee()} */}
          {this.renderButtonFee()}
          {this.renderAdvance()}
          {this.renderAdvanceOption()}

        </div>
      </form>
      {this.renderConfirm()}
      {this.renderConfirmModal()}
    </CustomView>)
  }
}

const mapStateToProps = (state) => ({
  balance: state.accountInfo.balance,
  currentAccount: state.accountInfo.currentAccount,
  netAccount: state.accountInfo.netAccount,
});

function mapDispatchToProps(dispatch) {
  return {
    updateNetAccount: (netAccount) => {
      dispatch(updateNetAccount(netAccount))
    },
    updateShouldRequest: (shouldRefresh) => {
      dispatch(updateShouldRequest(shouldRefresh))
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SendPage);
