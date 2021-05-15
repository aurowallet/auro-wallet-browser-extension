import cx from "classnames";
import React from "react";
import { connect } from "react-redux";
import modalClose from "../../../assets/images/modalClose.png";
import txArrow from "../../../assets/images/txArrow.png";
import { SEC_DELETE_ACCOUNT, SEC_SHOW_PRIVATE_KEY } from "../../../constant/secTypes";
import { WALLET_CHANGE_ACCOUNT_NAME } from "../../../constant/types";
import { ACCOUNT_TYPE } from "../../../constant/walletType";
import { getLanguage } from "../../../i18n";
import { sendMsg } from "../../../utils/commonMsg";
import { copyText, nameLengthCheck } from "../../../utils/utils";
import Button, { BUTTON_TYPE_CANCEL } from "../../component/Button";
import CustomInput from "../../component/CustomInput";
import CustomView from "../../component/CustomView";
import TestModal from "../../component/TestModal";
import Toast from "../../component/Toast";
import "./index.scss";

class AccountInfo extends React.Component {
  constructor(props) {
    super(props);
    let account = props.cache.accountInfo
    this.state = {
      confirmModal: false,
      account,
      accountName: account.accountName,
      inputAccountName: "",
      errorTipShow: false,
      btnClick: false
    };
    this.modal = React.createRef();
    this.isUnMounted = false;
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
  renderInfo = (title, content, callback, hideArrow) => {
    return (
      <div className={cx({
        "account-info-item": true,
      })}
        onClick={() => callback && callback()}>
        <div className="account-info-item-inner click-cursor">
          <p className="account-info-title">{title}</p>
          {content && <p className={
            cx({
              "account-info-content": true,
            })
          }>{content}</p>}
        </div>
        <img className={
          cx({
            "account-info-arrow": true,
            "account-info-arrow-hide": hideArrow
          })

        } src={txArrow} />
      </div>
    )
  }

  changeAccountName = (e) => {
    this.modal.current.setModalVisable(true)
  }
  onCloseModal = () => {
    this.modal.current.setModalVisable(false)
  }
  showPrivateKey = () => {
    this.props.history.push({
      pathname: "/security_pwd_page",
      params: {
        nextRoute: "/show_privatekey_page",
        action: SEC_SHOW_PRIVATE_KEY,
        address: this.state.account.address,
      }
    }
    )
  }
  deleteAccount = () => {
    this.props.history.push({
      pathname: "/security_pwd_page",
      params: {
        action: SEC_DELETE_ACCOUNT,
        nextRoute: "/account_manage",
        address: this.state.account.address,
        nextParams: {
          title: getLanguage('backup_success_title'),
          content: getLanguage('deleteAccountSuccess')
        }
      }
    }
    )
  }
  onChangeAccountName = () => {
    if (this.state.inputAccountName.length <= 0) {
      Toast.info(getLanguage('inputAccountName'))
      return
    }
    sendMsg({
      action: WALLET_CHANGE_ACCOUNT_NAME,
      payload: {
        address: this.state.account.address,
        accountName: this.state.inputAccountName
      }
    }, (account) => {
      if(!this.isUnMounted){
        this.callSetState({
          account: account.account
        })
      }
      this.onCloseModal()
      Toast.info(getLanguage('changeSuccess'))
    })
  }
  renderActionBtn = () => {
    return (
      <div className={"account-info-btn-container"}>
        <Button
          content={getLanguage('confirm')}
          onClick={this.onChangeAccountName}
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
  onTextInput = (e) => {
    if(!this.isUnMounted){
      this.callSetState({
        inputAccountName: e.target.value,
      },() => {
        let checkResult = nameLengthCheck(this.state.inputAccountName)
        if (checkResult) {
          this.callSetState({
            btnClick: true,
            errorTipShow: false
          })
        } else {
          this.callSetState({
            btnClick: false,
            errorTipShow: true
          })
        }
      })
    }
  }
  onSubmit = (event) => {
    event.preventDefault();
  }
  renderInput = () => {
    return (

      <div className="change-input-wrapper">
        <CustomInput
          placeholder={this.state.account.accountName}
          value={this.state.inputAccountName}
          onTextInput={this.onTextInput}
          errorTipShow={this.state.errorTipShow}
          showTip={getLanguage("accountNameLimit")}
        />
        {/* <img onClick={this.onCloseModal} className="modal-close click-cursor" src={modalClose} /> */}
      </div>)
  }
  renderChangeModal = () => {
    return (<TestModal
      ref={this.modal}
      title={getLanguage('renameAccountName')}
    >
      {this.renderInput()}
      {this.renderActionBtn()}
    </TestModal>)
  }
  copyAddress = () => {
    copyText(this.state.account.address).then(() => {
      Toast.info(getLanguage('copySuccess'))
    })
  }
  render() {
    let hideDelete = this.state.account.type === ACCOUNT_TYPE.WALLET_INSIDE
    let isLedger = this.state.account.type === ACCOUNT_TYPE.WALLET_LEDGER
    let hideExport = this.state.account.type === ACCOUNT_TYPE.WALLET_WATCH 
      ||  isLedger
    let showAddress = this.state.account.address
    return (
      <CustomView
        title={getLanguage('accountInfo')}
        history={this.props.history}>
        <div className="account-info-container">
          {this.renderInfo(getLanguage('accountAddress'), showAddress, this.copyAddress, true)}
          {isLedger ? this.renderInfo(getLanguage('hdDerivedPath'), `m / 44' / 12586' / ${this.state.account.hdPath} ' / 0 / 0`, null, true) : null}
          {this.renderInfo(getLanguage('accountName'), this.state.account.accountName, this.changeAccountName)}
          {!hideExport ?this.renderInfo(getLanguage('exportPrivateKey'), "", this.showPrivateKey) : null}
          {!hideDelete ? this.renderInfo(getLanguage("accountDelete"), "", this.deleteAccount) : null}
        </div>
        <form onSubmit={this.onSubmit}>
          {this.renderChangeModal()}
        </form>
      </CustomView>)
  }
}

const mapStateToProps = (state) => ({
  cache: state.cache
});

function mapDispatchToProps(dispatch) {
  return {
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(AccountInfo);
