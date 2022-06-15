import { DAppActions } from '@aurowallet/mina-provider';
import BigNumber from "bignumber.js";
import React from "react";
import { connect } from "react-redux";
import { cointypes } from "../../../../config";
import dapp_default_icon from "../../../assets/images/dapp_default_icon.svg";
import loadingCommon from "../../../assets/images/loadingCommon.gif";
import { getBalance, getFeeRecom, sendStakeTx, sendTx } from "../../../background/api";
import { DAPP_ACTION_SEND_TRANSACTION, DAPP_ACTION_SIGN_MESSAGE, DAPP_GET_CURRENT_ACCOUNT_CONNECT_STATUS, GET_SIGN_PARAMS, QA_SIGN_TRANSTRACTION, WALLET_CHECK_TX_STATUS, WALLET_SEND_MESSAGE_TRANSTRACTION, WALLET_SEND_STAKE_TRANSTRACTION, WALLET_SEND_TRANSTRACTION } from "../../../constant/types";
import { ACCOUNT_TYPE } from "../../../constant/walletType";
import { getLanguage } from "../../../i18n";
import { updateNetAccount } from "../../../reducers/accountReducer";
import { updateDAppOpenWindow } from "../../../reducers/cache";
import { ENTRY_WITCH_ROUTE, updateEntryWitchRoute } from "../../../reducers/entryRouteReducer";
import { sendMsg } from "../../../utils/commonMsg";
import { checkLedgerConnect, requestSignDelegation, requestSignPayment } from "../../../utils/ledger";
import { addressSlice, getDisplayAmount, getQueryStringArgs, getRealErrorMsg, isNumber, toNonExponential, trimSpace } from "../../../utils/utils";
import { addressValid } from "../../../utils/validator";
import Button, { BUTTON_TYPE_CANCEL } from "../../component/Button";
import CustomInput from "../../component/CustomInput";
import DappWebsite from "../../component/DappWebsite";
import Loading from "../../component/Loading";
import TestModal from "../../component/TestModal";
import Toast from "../../component/Toast";
import LockPage from '../Lock';
import "./index.scss";
import SignContent from "./SignContent";
import cx from "classnames";
import pwd_right from "../../../assets/images/pwd_right.png";
import reminder from "../../../assets/images/reminder.png";

const FEE_RECOMMED_DEFAULT = 1
const FEE_RECOMMED_CUSTOM = -1

class SignTransaction extends React.Component {
  constructor(props) {
    super(props);
    let winParams = this.getParams()
    this.state = {
      site: {},
      params: {},
      currentAccount: {},
      nonce: "",
      lockStatus: false,
      sendAction: "",
      btnClick: false,
      inputFee: "",
      inputNonce: "",
      winParams,
      feeSelect: FEE_RECOMMED_DEFAULT, 
    }
    this.isUnMounted = false;
    this.modal = React.createRef();
    this.confirmModal = React.createRef();
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
  fetchData = () => {
    let { currentAccount } = this.props
    let address = currentAccount.address
    let balanceRequest = getBalance(address)
    let feeRequest = getFeeRecom()

    Promise.all([balanceRequest, feeRequest]).then((data) => {
      let account = data[0]
      let feeRecom = data[1]
      Loading.hide()
      if (account.publicKey) {
        this.props.updateNetAccount(account)
        this.callSetState({
          nonce: account.inferredNonce
        })
      } else {
        Toast.info(getLanguage('nodeError'))
      }
      if (feeRecom.length > 0) {
        this.feeList.map((item, index) => {
          return item.fee = feeRecom[index].value
        })
        this.callSetState({
          fee: feeRecom[1].value
        })
      }
    })
  }

  componentDidMount() {
    sendMsg({
      action: GET_SIGN_PARAMS,
      payload: {
        openId: this.state.winParams.openId
      }
    }, (res) => {
      Loading.show()
      let siteFee = res.params?.fee || res.params?.feePayer?.fee || ""
      let siteRecommendFee = isNumber(siteFee)? siteFee+"" : ""
      let feeSelect = siteRecommendFee?.length>0 ?FEE_RECOMMED_CUSTOM:FEE_RECOMMED_DEFAULT
      this.callSetState({
        site: res.site,
        params: res.params,
        sendAction: res.params.action,
        inputFee:siteRecommendFee,
        feeSelect:feeSelect
      }, () => {
        this.fetchData()
      })
    })
  }


  onConfirm = async () => {
    let { currentAccount,balance } = this.props
    let { params } = this.state
    if (currentAccount.type === ACCOUNT_TYPE.WALLET_WATCH) {
      Toast.info(getLanguage('observeAccountTip'))
      return
    }
    if (this.state.sendAction !== DAppActions.mina_signMessage && this.state.sendAction !== DAppActions.mina_sendTransaction) {
      let toAddress = trimSpace(params.to)
      if (!addressValid(toAddress)) {
        Toast.info(getLanguage('sendAddressError'))
        return
      }
    }
    if (this.state.sendAction === DAppActions.mina_sendPayment) {
      let amount = trimSpace(params.amount)
      if (!isNumber(amount) || !new BigNumber(amount).gt(0)) {
        Toast.info(getLanguage('amountError'))
        return
      }
    }
    let vaildNonce = this.state.inputNonce || this.state.nonce
    let nonce = trimSpace(vaildNonce) || ""
    if (nonce.length > 0 && !isNumber(nonce)) {
      Toast.info(getLanguage('waitNonce'))
      return
    }
    let vaildFee = this.state.inputFee
    let fee = trimSpace(vaildFee)
    if (fee.length > 0 && !isNumber(fee)) {
      Toast.info(getLanguage('inputFeeError'))
      return
    }
    if (this.state.sendAction !== DAppActions.mina_signMessage) {
      fee = fee ? fee: this.state.fee
      let amount = trimSpace(params.amount)
      let maxAmount = new BigNumber(amount).plus(fee).toString()
      if (new BigNumber(maxAmount).gt(balance)) {
        Toast.info(getLanguage('balanceNotEnough'))
        return
      }
    }
    this.clickNextStep()
  }

  ledgerTransfer = async (params) => {
    const { ledgerApp } = await checkLedgerConnect()
    if (ledgerApp) {

      if (this.state.sendAction === DAppActions.mina_signMessage) {
        Toast.info(getLanguage('ledgerNotSupportSign'))
        sendMsg({
          action: resultAction,
          payload: { error: "not support ledger sign message" },
        }, async (params) => { })
        return
      }

      this.confirmModal.current.setModalVisable(true)
      let currentAccount = this.props.currentAccount
      let signResult
      let postRes
      if (this.state.sendAction === DAppActions.mina_sendPayment) {
        signResult = await requestSignPayment(ledgerApp, params, currentAccount.hdPath)

        const { signature, payload, error } = signResult
        if (error) {
          this.confirmModal.current.setModalVisable(false)
          Toast.info(error.message)
          return
        }
        postRes = await sendTx(payload, { rawSignature: signature }).catch(error => error)

      } else if (this.state.sendAction === DAppActions.mina_sendStakeDelegation) {
        signResult = await requestSignDelegation(ledgerApp, params, currentAccount.hdPath)

        const { signature, payload, error } = signResult
        if (error) {
          this.confirmModal.current.setModalVisable(false)
          Toast.info(error.message)
          return
        }
        postRes = await sendStakeTx(payload, { rawSignature: signature }).catch(error => error)
      } else {
        Toast.info(getLanguage('notSupportNow'))
        return
      }

      this.confirmModal.current.setModalVisable(false)
      this.onSubmitSuccess(postRes,"ledger")
    }
  }

  clickNextStep = async () => {
    let { params } = this.state
    let currentAccount = this.props.currentAccount
    let vaildNonce = this.state.inputNonce || this.state.nonce
    let nonce = trimSpace(vaildNonce)

    let toAddress = ''
    let fee = ""
    let memo = ""
    if (this.state.sendAction !== DAppActions.mina_signMessage) {
      toAddress = trimSpace(params.to)
      let vaildFee = this.state.inputFee
      fee = trimSpace(vaildFee) || this.state.fee
      memo = params.memo || ""
    } 
 
    let fromAddress = currentAccount.address
    let payload = {
      fromAddress, toAddress, nonce, currentAccount, fee, memo
    }
    if(this.state.sendAction === DAppActions.mina_signMessage){
      payload.message = params.message
    }
    if (this.state.sendAction === DAppActions.mina_sendPayment) {
      let amount = trimSpace(params.amount)
      amount = toNonExponential(new BigNumber(amount).toString())
      payload.amount = amount
    }
    if(this.state.sendAction === DAppActions.mina_sendTransaction){
      payload.transaction = params.transaction
      memo = params.feePayer?.memo || ""
    }
    if (currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER) {
      return this.ledgerTransfer(payload)
    }
    Loading.show()
    payload.sendAction = this.state.sendAction
    sendMsg({
      action: QA_SIGN_TRANSTRACTION,
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
    } else {
      let resultAction = ""
      let payload = {}
      let id = ""
      payload.resultOrigin = this.state.winParams.siteUrl
      switch (this.state.sendAction) {
        case DAppActions.mina_sendStakeDelegation:
          payload.hash = data.sendDelegation.delegation.hash
          id = data.sendDelegation.delegation.id
          resultAction = DAPP_ACTION_SEND_TRANSACTION
          break;
        case DAppActions.mina_sendPayment:
          payload.hash = data.sendPayment.payment.hash
          id = data.sendPayment.payment.id
          resultAction = DAPP_ACTION_SEND_TRANSACTION
          break;
        case DAppActions.mina_signMessage:
          payload.signature = data.signature
          payload.data = data.data
          resultAction = DAPP_ACTION_SIGN_MESSAGE
          break;
        case DAppActions.mina_sendTransaction:
          payload.hash = data.hash
          resultAction = DAPP_ACTION_SEND_TRANSACTION
          break;
        default:
          break;
      }
      if(type === "ledger" && id && payload.hash){
        sendMsg({
          action: WALLET_CHECK_TX_STATUS,
          payload: {
            paymentId: id,
            hash: payload.hash,
          }
        }, () => { })
      }
      sendMsg({
        action: resultAction,
        payload: payload,
      }, async (params) => { })
    }
    this.goToHome()
  }
  goToHome = () => {
    let url = this.props.dappWindow?.url
    if (url) {
      this.props.updateEntryWitchRoute(ENTRY_WITCH_ROUTE.HOME_PAGE)
    }
    this.props.updateDAppOpenWindow({})
  }
  renderActionBtn = () => {
    return (
      <div className={"sign-button-container"}>
        <Button
          content={getLanguage('cancel')}
          buttonType={BUTTON_TYPE_CANCEL}
          onClick={() => {
            sendMsg({
              action: DAPP_ACTION_SEND_TRANSACTION,
              payload: {
                cancel: true,
                resultOrigin: this.state.winParams.siteUrl
              },
            }, async (params) => {
              this.goToHome()
            })
          }}
        />
        <Button
          content={getLanguage('onConfirm')}
          onClick={async () => {
            this.onConfirm()
          }}
        />
      </div>
    );
  };

  onClickUnLock = () => {
    this.callSetState({
      lockStatus: true
    })
  }
  renderAccountInfo = () => {
    let showAddress = addressSlice(this.props.currentAccount.address,0, 6)
    let netName = this.props.netConfig.currentNetType
    return (
      <div className={'sign-page-top-con'}>
        <div className={"sign-page-top-left"}>
          <p className={"sign-page-top-address"}>{showAddress}</p>
        </div>
        <p className={"sign-page-top-netName"}>{netName}</p>
      </div>
    )
  }
  renderWebInfo = (winParams) => {
    let webIcon = winParams.siteIcon
    return (
      <div className={'sign-page-icon-con'}>
        <img
          className="sign-page-icon" src={webIcon}
          onError={(event) => {
            event.target.src = dapp_default_icon
          }}
        />
        <p className={'sign-page-url'}>{winParams.siteUrl}</p>
      </div>
    )
  }
  renderSendItem = (item, index) => {
    return (
      <div className="sign-detail-item" key={index + ""}>
        <p className="sign-detail-title">{item.title}</p>
        <p className="sign-detail-content">{item.content}</p>
      </div>
    )
  }
  getParams = () => {
    let url = this.props.dappWindow.url || window.location?.href || ""
    return getQueryStringArgs(url)
  }
  renderDivided = () => {
    return (<div className={"sign-divided-line"} />)
  }
  renderInfoItemAccount = () => {
    const { currentAccount, accountInfo } = this.props
    let balance = getDisplayAmount(accountInfo.balance || 0)
    let showAddress = "(" + addressSlice(currentAccount.address, 0,6) + ")"
    return (
      <div className={"sign-info-con"}>
        <div className={"sign-info-bottom-con"}>
          <span className={"signTitleName"}>{getLanguage('signAccount')}</span>
        </div>
        <div className={"sign-info-bottom-con-content"}>
          <p className={"sign-info-name"}>{currentAccount.accountName}<span className={"sign-info-name-desc"}>{showAddress}</span></p>
          <span className={"sign-info-name-content"}>{balance + " " + cointypes.symbol} </span>
        </div>
      </div>
    )
  }
  renderInfoItemSend = () => {
    const { currentAccount } = this.props
    let { params } = this.state
    let showAddress = addressSlice(params.to, 6)
    let fromAddress = "(" + addressSlice(currentAccount.address, 0,6) + ")"
    return (
      <div className={"sign-info-con"}>
        <div className={"sign-info-bottom-con"}>
          <span className={"signTitleName"}>{getLanguage('signAccount')}
            
          </span>
          <span className={"signTitleName"}>{getLanguage('transactionTo')}</span>
        </div>
        <div className={"sign-info-bottom-con-content"}>
          <p className={"sign-info-name"}>{currentAccount.accountName}
            <span className={"sign-info-name-desc"}>{fromAddress}</span>
          </p>
          <span className={"sign-info-name"}>{showAddress}</span>
        </div>
      </div>
    )
  }
  setBtnStatus = () => {
    let inputFee = this.state.inputFee
    inputFee = trimSpace(inputFee)
    let inputNonce = this.state.inputNonce
    inputNonce = trimSpace(inputNonce)
    let canClick = true

    if (inputFee.length > 0 && !isNumber(inputFee)) {
      canClick = false
    }
    if (inputNonce.length > 0 && !isNumber(inputNonce)) {
      canClick = false
    }
    if (inputFee.length == 0 && inputNonce.length == 0) {
      canClick = false
    }
    this.callSetState({
      btnClick: canClick
    })
  }
  onFeeInput = (e) => {
    let fee = e.target.value
    this.callSetState({
      inputFee: fee
    }, () => {
      this.setBtnStatus()
    })
  }
  onNonceInput = (e) => {
    let nonce = e.target.value
    this.callSetState({
      inputNonce: nonce
    }, () => {
      this.setBtnStatus()
    })
  }
  renderAdvanceOption = () => {
    let nonceHolder = this.state.nonce ? "Nonce " + this.state.nonce : "Nonce "
    let feeHolder = getLanguage('feePlaceHolder')
    let showFeeHigh = BigNumber(this.state.inputFee).gt(10)
    return (
      <div className={"advance-option-show"}>
        <CustomInput
          value={this.state.inputFee}
          placeholder={feeHolder}
          onTextInput={this.onFeeInput}
        />
        {showFeeHigh && <div className={"fee-too-high-container"}>
          <img src={reminder} className={"fee-reminder"} />
          <p className={"fee-too-high-content"}>{getLanguage('feeTooHigh')}</p>
        </div>}
        <CustomInput
          value={this.state.inputNonce}
          placeholder={nonceHolder}
          onTextInput={this.onNonceInput}
        />
      </div>
    )
  }
  onChangeAdvance = () => {
    this.onCloseModal()
    this.callSetState({
      feeSelect: FEE_RECOMMED_CUSTOM
    })
  }
  renderConfirmBtn = () => {
    return (
      <div className={"confirm-modal-btn-con"}>
        <Button
          content={getLanguage('confirm')}
          onClick={this.onChangeAdvance}
          propsClass={'modal-button-width'}
          disabled={!this.state.btnClick}
        />
        <Button
          buttonType={BUTTON_TYPE_CANCEL}
          content={getLanguage('cancel')}
          onClick={this.onCloseModal}
          propsClass={'modal-button-width'}
        />
      </div>
    )
  }
  renderChangeModal = () => {
    return (<TestModal
      touchToClose={true}
      ref={this.modal}
      title={getLanguage('advanceMode')}
    >
      {this.renderAdvanceOption()}
      {this.renderConfirmBtn()}
    </TestModal>)
  }
  onAdvance = () => {
    this.modal.current.setModalVisable(true)
  }
  onCloseModal = () => {
    this.modal.current.setModalVisable(false)
  }
  renderInfoItemAmount = () => {
    let { params } = this.state
    let amountShow = params.amount || 0
    amountShow = amountShow + " " + cointypes.symbol
    return (
      <div className={"sign-info-con"}>
        <div className={"sign-info-bottom-con"}>
          <span className={"signTitleName"}>{getLanguage('amount')}</span>
        </div>
        <div className={"sign-info-bottom-con-content"}>
        <p className={"sign-info-name"}>{amountShow}</p>
          <span onClick={this.onAdvance} className={"sign-info-advanceMode click-cursor"}>{getLanguage('advanceMode')}</span>
        </div>
      </div>
    )
  }
  renderDetailInfo = () => {
    if (this.state.sendAction === DAppActions.mina_signMessage) {
      return this.renderInfoItemAccount()
    } else {
      return (
        <>
          {this.renderInfoItemSend()}
          {this.renderDivided()}
          {this.renderInfoItemAmount()}
        </>
      )
    }
  }
  onClickFee = (item, index) => {
    this.callSetState({
      feeSelect: index,
      fee: item.fee,
      inputFee: ""
    })
  }

  renderButtonFee=()=>{
    return (
      <div  className={"sign-info-con"}>
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
  renderMessageBody = () => {
    const { sendAction , params } = this.state
    let isSignMessage =  sendAction === DAppActions.mina_signMessage
    let realMemo = params.memo || params.feePayer?.memo || ""
    let showContent = isSignMessage ? params.message : realMemo
    let contentTitle = isSignMessage ? getLanguage('signContent') : "Memo"
    let nextClass = isSignMessage?"":"sign-info-detail-content-mini"
    if(showContent){
      return (<div className={"sign-info-detail-con"}>
      <span className={"sign-info-detail-title"}>{contentTitle}</span>
      <SignContent content={showContent} nextClass={nextClass}/>
    </div>)
    }else{
      return <></>
    }
  }

  renderLoadingView = () => {
    return (
      <div className={"confirm-loading"}>
        <p className={"confirm-loading-desc"}>{getLanguage('confirmInfoLedger')}</p>
        <img className={"confirm-loading-img"} src={loadingCommon} />
      </div>)
  }
  renderConfirmModal = () => {
    return (<TestModal
      ref={this.confirmModal}
      touchToClose={true}
      title={getLanguage("waitLedgerConfirm")}
    >
      {this.renderLoadingView()}
    </TestModal>)
  }
  render() {
    const { winParams, lockStatus,sendAction } = this.state
    if (winParams.isUnlocked == '0' && !lockStatus) {
      return <LockPage onDappConfirm={true} onClickUnLock={this.onClickUnLock} history={this.props.history} />;
    }
    const { currentConfig } = this.props.netConfig
    return (
      <>
        <div className={"tab-common-title"}>
          {sendAction !== DAppActions.mina_signMessage ? getLanguage('signRequest'):getLanguage('messageSign')}
          <div className={"netSelectCon"}>
            <span className={"netSelectCon-name"}>{currentConfig.name}</span>
          </div>
        </div>
        <DappWebsite siteIcon={winParams.siteIcon} siteUrl={winParams.siteUrl} type={"signConfirm"} />
        <div className={"sign-page-container"}>
          {this.renderDivided()}

          {this.renderDetailInfo()}
          {this.renderDivided()}
          {sendAction !== DAppActions.mina_signMessage &&<>
            {this.renderButtonFee()}
            {this.renderDivided()}
          </>}
          {this.renderMessageBody()}
        </div>
        {this.renderActionBtn()}
        {this.renderChangeModal()}
        {this.renderConfirmModal()}
      </>
    )
  }
}

const mapStateToProps = (state) => ({
  currentAccount: state.accountInfo.currentAccount,
  accountInfo: state.accountInfo,
  netConfig: state.network,
  dappWindow: state.cache.dappWindow,
  balance: state.accountInfo.balance,
});

function mapDispatchToProps(dispatch) {
  return {
    updateNetAccount: (netAccount) => {
      dispatch(updateNetAccount(netAccount))
    },
    updateDAppOpenWindow: (window) => {
      dispatch(updateDAppOpenWindow(window))
    },
    updateEntryWitchRoute: (route) => {
      dispatch(updateEntryWitchRoute(route))
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SignTransaction);
