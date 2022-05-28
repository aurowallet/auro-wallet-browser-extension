import BigNumber from "bignumber.js";
import cx from "classnames";
import React from "react";
import { Trans } from "react-i18next";
import { connect } from "react-redux";
import { cointypes } from "../../../../config";
import addressBook from "../../../assets/images/addressBook.svg";
import downArrow from "../../../assets/images/downArrow.png";
import loadingCommon from "../../../assets/images/loadingCommon.gif";
import modalClose from "../../../assets/images/modalClose.png";
import pwd_right from "../../../assets/images/pwd_right.png";
import reminder from "../../../assets/images/reminder.png";
import { getBalance, getFeeRecom, sendTx } from "../../../background/api";
import { WALLET_CHECK_TX_STATUS, WALLET_SEND_TRANSTRACTION } from "../../../constant/types";
import { ACCOUNT_TYPE } from "../../../constant/walletType";
import { getLanguage } from "../../../i18n";
import { updateNetAccount, updateShouldRequest } from "../../../reducers/accountReducer";
import { updateAddressBookFrom, updateAddressDetail } from "../../../reducers/cache";
import { sendMsg } from "../../../utils/commonMsg";
import { checkLedgerConnect, requestSignPayment } from "../../../utils/ledger";
import { getDisplayAmount, getRealErrorMsg, isNumber, isTrueNumber, trimSpace } from "../../../utils/utils";
import { addressValid } from "../../../utils/validator";
import Button from "../../component/Button";
import CustomInput from "../../component/CustomInput";
import CustomView from "../../component/CustomView";
import Loading from "../../component/Loading";
import { FeeSlider } from "../../component/Slider";
import TestModal from "../../component/TestModal";
import Toast from "../../component/Toast";
import "./index.scss";


const FEE_RECOMMED_DEFAULT = 1
const FEE_RECOMMED_CUSTOM = -1

class SendPage extends React.Component {
  constructor(props) {
    super(props);
    let addressDetail = props.addressDetail ?? {};
    this.state = {
      toAddress: addressDetail.address || "",
      toAddressName: addressDetail.name || "",
      amount: "",
      fee: 0.1,
      addressErr: "",
      amountErr: "",
      feeErr: "",
      btnClick: false,
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
    this.props.updateAddressDetail({})
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
    let account = await getBalance(address)
    if (account.publicKey) {
      this.props.updateNetAccount(account)
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
      toAddress: address,
      toAddressName: ""
    }, () => {
      this.setBtnStatus()
    })
  }
  onGotoAddressBook = () => {
    this.props.updateAddressBookFrom("send")
    this.props.history.push({
      pathname: "/address_book",
    })
  }
  renderAddressBook = () => {
    return (
      <div className={"send-address-book-container click-cursor"} onClick={this.onGotoAddressBook}>
        <img src={addressBook} className={"send-address-book"} />
      </div>
    )
  }
  renderToAddress = () => {
    let labelName = this.state.toAddressName ? "(" + this.state.toAddressName + ")" : ""
    return (<CustomInput
      value={this.state.toAddress}
      label={getLanguage('toAddress')}
      littleLabel={labelName}
      rightComponent={this.renderAddressBook()}
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
  onClickAll = () => {
    let { balance } = this.props
   
    this.callSetState({
      amount: balance
    },()=>{
      this.setBtnStatus()
    })
  }
  renderInputRightStable = () => {
    return (
      <p className={"inputRightLabel"} onClick={this.onClickAll}>
        {getLanguage('all')}
      </p>
    )
  }
  renderToAmount = () => {
    let { balance } = this.props
    return (<CustomInput
      value={this.state.amount}
      label={getLanguage('amount')}
      descLabel={getLanguage('balance') + " " + getDisplayAmount(balance, cointypes.decimals)}
      onTextInput={this.onAmountInput}
      propsClass={'stableInput'}
      rightStableComponent={this.renderInputRightStable}
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
    let showFeeHigh = BigNumber(this.state.inputFee).gt(10)
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
        {showFeeHigh && <div className={"fee-too-high-container"}>
          <img src={reminder} className={"fee-reminder"} />
          <p className={"fee-too-high-content"}>{getLanguage('feeTooHigh')}</p>
        </div>}
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
  isAllTransfer=()=>{
    let { balance } = this.props
    return new BigNumber(this.state.amount).isEqualTo(balance)
  }
  getRealTransferAmount=()=>{
    let fee = trimSpace(this.state.inputFee) || this.state.fee
    let amount = 0
    if(this.isAllTransfer()){
      amount = new BigNumber(this.state.amount).minus(fee).toNumber()
    }else{
      amount = new BigNumber(this.state.amount).toNumber()
    }
    return amount
  }
  onConfirm = async () => {
    let { balance } = this.props
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
    
    
    if(this.isAllTransfer()){
      let maxAmount = this.getRealTransferAmount()
      if (new BigNumber(maxAmount).lt(0)) {
        Toast.info(getLanguage('balanceNotEnough'))
        return
      }
    }else{
      let maxAmount = new BigNumber(amount).plus(fee).toString()
      if (new BigNumber(maxAmount).gt(balance)) {
        Toast.info(getLanguage('balanceNotEnough'))
        return
      }
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
      const { signature, payload, error } = await requestSignPayment(ledgerApp, params, currentAccount.hdPath)
      this.modal.current.setModalVisable(false)
      this.callSetState({
        confirmModalLoading: false
      })
      if (error) {
        Toast.info(error.message)
        return
      }
      let postRes = await sendTx(payload, { rawSignature: signature }).catch(error => error)
      this.onSubmitSuccess(postRes,"ledger")
    }
  }
  clickNextStep = async () => {
    let currentAccount = this.props.currentAccount
    let netAccount = this.props.netAccount
    let fromAddress = currentAccount.address
    let toAddress = trimSpace(this.state.toAddress)
    let amount = this.getRealTransferAmount()
    let nonce = trimSpace(this.state.nonce) || netAccount.inferredNonce
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
  onSubmitSuccess = (data,type) => {
    if (data.error) {
      let errorMessage = getLanguage('postFailed')
      let realMsg = getRealErrorMsg(data.error)
      errorMessage = realMsg ? realMsg : errorMessage
      Toast.info(errorMessage, 5 * 1000)
      return
    }
    Toast.info(getLanguage('postSuccess'))
    let detail = data.sendPayment && data.sendPayment.payment || {}
    this.props.updateShouldRequest(true, true)
    if(type === "ledger"){
      sendMsg({
        action: WALLET_CHECK_TX_STATUS,
        payload: {
          paymentId: detail.id,
          hash: detail.hash,
        }
      }, () => { })
    }
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
    let isWatchModde = currentAccount.type === ACCOUNT_TYPE.WALLET_WATCH
    let buttonText = isWatchModde ? getLanguage("watchMode") : getLanguage('confirm')
    return (
      <div className={"send-confirm-container"}>
        <Button
          disabled={disabled}
          content={buttonText}
          onClick={this.clickNextStep}
        />
      </div>
    )
  }
  renderConfirmView = () => {
    let lastFee = this.state.inputFee ? this.state.inputFee : this.state.fee
    let nonce = this.state.nonce ? this.state.nonce : ""
    let memo = this.state.memo ? this.state.memo : ""
    let realAmount = this.getRealTransferAmount()
    return (
      <div className={"confirm-modal-container"}>
        {this.renderConfirmItem(getLanguage('amount'), realAmount + " " + cointypes.symbol, true)}
        {this.renderConfirmItem(getLanguage('toAddress'), this.state.toAddress)}
        {this.renderConfirmItem(getLanguage('fromAddress'), this.state.fromAddress)}
        {memo && this.renderConfirmItem("Memo", memo, true)}
        {nonce && this.renderConfirmItem("Nonce", nonce, true)}
        {this.renderConfirmItem(getLanguage('fee'), lastFee + " " + cointypes.symbol, true)}
        {this.renderConfirmButton()}
      </div>
    )
  }

  renderLoadingView = () => {
    return (
      <div className={"confirm-loading"}>
        <div className="confirmLoadingTip">
          <p className="confirmLoadingDescTip">{getLanguage('ledgerSendWaitTip')}</p>
          <Trans
              i18nKey={"ledgerSendCloseTip"}
              components={{ b: <strong /> }}
          />
        </div>
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
      fee: item.fee,
      inputFee: ""
    })
  }
  renderButtonFee = () => {
    return (
      <div className={"button-fee-container"}>
        <div className={"lable-container fee-style"}>
          <p className="pwd-lable-1">{getLanguage('fee')}</p>
          <p className="pwd-lable-desc-1">{this.state.inputFee || this.state.fee}</p>
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
  addressDetail: state.cache.addressDetail,
});

function mapDispatchToProps(dispatch) {
  return {
    updateNetAccount: (netAccount) => {
      dispatch(updateNetAccount(netAccount))
    },
    updateShouldRequest: (shouldRefresh, isSilent) => {
      dispatch(updateShouldRequest(shouldRefresh, isSilent))
    },
    updateAddressBookFrom: (from) => {
      dispatch(updateAddressBookFrom(from))
    },
    updateAddressDetail: (addressDetail) => {
      dispatch(updateAddressDetail(addressDetail))
  },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SendPage);
