import React from "react";
import { connect } from "react-redux";
import {WALLET_CREATE_HD_ACCOUNT, WALLET_IMPORT_LEDGER, WALLET_IMPORT_WATCH_MODE} from "../../../constant/types";
import { getLanguage } from "../../../i18n";
import { updateCurrentAccount } from "../../../reducers/accountReducer";
import { sendMsg } from "../../../utils/commonMsg";
import { nameLengthCheck, trimSpace } from "../../../utils/utils";
import Button from "../../component/Button";
import CustomInput from "../../component/CustomInput";
import CustomView from "../../component/CustomView";
import "./index.scss";
import {openPopupWindow} from "../../../utils/popup";
import {checkLedgerConnect} from "../../../utils/ledger";
import { ACCOUNT_NAME_FROM_TYPE } from "../../../constant/pageType";
import {setChangeAccountName, updateAccoutType} from "../../../reducers/cache";
import cx from "classnames";
import downArrow from "../../../assets/images/downArrow.png";
import Toast from "../../component/Toast";
import {addressValid} from "../../../utils/validator";
import Loading from "../../component/Loading";
import ConfirmModal from "../../component/ConfirmModal";
import { Trans } from "react-i18next";

class AccountName extends React.Component {
  constructor(props) {
    super(props);
    let accountCount = props.cache.accountCount
    let placeholderText = ""
    let fromType = props.cache.fromType
    if(fromType === ACCOUNT_NAME_FROM_TYPE.OUTSIDE){
      placeholderText = "Import Account "
    }else if(fromType === ACCOUNT_NAME_FROM_TYPE.LEDGER){
      placeholderText =  "Ledger Account "
    } else if(fromType === ACCOUNT_NAME_FROM_TYPE.KEYPAIR){
      placeholderText =  "Import Account "
    }  else if(fromType === ACCOUNT_NAME_FROM_TYPE.WATCHMODE){
      placeholderText =  "Watched Account "
    } else{
      placeholderText = "Account "
    }
    this.state = {
      accountName: "",
      btnClick: true,
      accountCount,
      errorTipShow: false,
      placeholderText: placeholderText + parseInt(accountCount),
      isOpenAdvance: false,
      accountIndex: 0,
      watchModeAddress: ''
    };
    this.isClicked = false
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
  onAccountInput = (e) => {
    let name = e.target.value
      this.callSetState({
        accountName: name
      },() => {
        let checkResult = nameLengthCheck(this.state.accountName)
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
  onImportWatchModeAccount(accountName) {
    let address = trimSpace(this.state.watchModeAddress)
    if (!addressValid(address)) {
      Toast.info(getLanguage('sendAddressError'))
      return
    }
    Loading.show()
    sendMsg({
      payload: {
        address: address,
        accountName: accountName
      },
      action: WALLET_IMPORT_WATCH_MODE
    },(account)=>{
      Loading.hide()
      if (account.error) {
        if(account.type === "local"){
          Toast.info(getLanguage(account.error))
        } else {
          Toast.info(account.error)
        }
      } else {
        this.props.updateCurrentAccount(account)
        this.props.history.go(-1)
      }
    })
  }
  goToNext = async () => {
    if (this.isClicked) {
      return
    }
    setTimeout(()=>{
      this.isClicked = false
    },500)
    this.isClicked = true
    let accountText = ""
    if (this.state.accountName.length <= 0) {
      accountText = this.state.placeholderText
    } else {
      accountText = this.state.accountName
    }
    let fromType = this.props.cache.fromType
    if (fromType === ACCOUNT_NAME_FROM_TYPE.OUTSIDE) {
      this.props.history.push({
        pathname: "/import_account",
        params: {
          "accountName": accountText
        },
      })
    } else if(fromType === ACCOUNT_NAME_FROM_TYPE.LEDGER){
      await checkLedgerConnect()
      this.props.history.replace({
        pathname: "/ledger_import",
        params: {
          "accountName": accountText,
          "accountIndex": this.state.accountIndex
        },
      })
    } else if(fromType === ACCOUNT_NAME_FROM_TYPE.KEYPAIR){
      this.props.history.push({
        pathname: "/import_keypair",
        params: {
          "accountName": accountText
        },
      })
    } else if (fromType === ACCOUNT_NAME_FROM_TYPE.WATCHMODE){
      this.onImportWatchModeAccount(accountText)
    }else {
      Loading.show()
      sendMsg({
        action: WALLET_CREATE_HD_ACCOUNT,
        payload: { accountName: accountText }
      }, (account) => {
        Loading.hide()
        if(account.error){
          if(account.error === "improtRepeat"){
              this.showSameAccountTip(account.account)
          }
        }else{
          this.props.updateCurrentAccount(account)
          this.props.history.replace({
            pathname: "/account_manage",
          })
        }
     
      })
    }
    this.isClicked = false
  }
  renderTipContent = (account) => {
    return (
      <div className={'walletRepeatTipContainer'}>
        <p className="accountRepeatTitle">{getLanguage('importSameAccount_1')}</p>
        <p className="accountRepeatAddress">{account.address}</p>
        <Trans
        i18nKey={"importSameAccount_2"}
        values={{accountName:account.accountName}}
        components={{ b: <span className={"accountRepeatName"} />,
                      click:<span className={"accountRepeatClick"} /> }}
      />
      </div>)
  }
  showSameAccountTip=(account)=>{
    let title = getLanguage('prompt')
    let elementContent = ()=>this.renderTipContent(account)
    ConfirmModal.show({
      title,
      elementContent,
      confirmText: getLanguage("isee"),
    })

  }
  onAccountIndexChange = (e)=> {
    var accountIndex = +e.target.value;
    this.setState({
      accountIndex,
    });
  }
  onWatchModeInput = (e)=> {
    var watchModeAddress = e.target.value;
    this.setState({
      watchModeAddress,
    });
  }
  onOpenAdvance = () => {
    this.callSetState({
      isOpenAdvance: !this.state.isOpenAdvance
    })
  }
  renderAdvance = () => {
    if (this.props.cache.fromType !== ACCOUNT_NAME_FROM_TYPE.LEDGER) {
      return null;
    }
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
  renderBottonBtn = () => {
    let {fromType} = this.props.cache
    let buttonText = 'next'
    if(fromType === ACCOUNT_NAME_FROM_TYPE.INSIDE || fromType === ACCOUNT_NAME_FROM_TYPE.WATCHMODE){
      buttonText = 'confirm_1'
    }
    return (
      <div className="bottom-container">
        <Button
          content={getLanguage(buttonText)}
          onClick={this.goToNext}
          disabled={!this.state.btnClick}
        />
      </div>)
  }
  renderWatchModeAddressInput() {
    return <div className={'watchmode-input-container'}>
       <textarea
         className={"watchmode-area-input"}
         placeholder={getLanguage('textWatchModeAddress')}
         value={this.state.watchModeAddress}
         onChange={this.onWatchModeInput} />
    </div>
  }
  renderLedgerHDPath(){
    const { isOpenAdvance } = this.state;
    if (this.props.cache.fromType !== ACCOUNT_NAME_FROM_TYPE.LEDGER) {
      return null;
    }
    if (!isOpenAdvance) {
      return null;
    }
    return <div className={'ledger-derived-path'}>
      <div>{getLanguage('hdDerivedPath')}</div>
      <div className={'ledger-derived-input'}>m / 44' / 12586' / <input
        type='number'
        min="0"
        step="1"
        onChange={this.onAccountIndexChange}
        value={this.state.accountIndex}/> ' / 0 / 0</div>
    </div>
  }
  onSubmit = (event) => {
    event.preventDefault();
  }
  render() {
    let isWatchMode = this.props.cache.fromType === ACCOUNT_NAME_FROM_TYPE.WATCHMODE
    return (
      <CustomView
        title={getLanguage(isWatchMode ? "watchAccount" :"accountName")}
        history={this.props.history}>
        <form onSubmit={this.onSubmit}>
          <div className={"account-name-container"}>
            <CustomInput
              value={this.state.accountName}
              label={getLanguage('accountNameTip')}
              placeholder={this.state.placeholderText}
              errorTipShow={this.state.errorTipShow}
              showTip={getLanguage("accountNameLimit")}
              onTextInput={this.onAccountInput} />
            {
              this.props.cache.fromType === ACCOUNT_NAME_FROM_TYPE.LEDGER ? <div className={'ledger-path-container'}>
                {this.renderAdvance()}
                {this.renderLedgerHDPath()}
              </div> : null
            }
            {
              isWatchMode ? this.renderWatchModeAddressInput() : null
            }
            {this.renderBottonBtn()}
          </div>
        </form>
      </CustomView>)
  }
}

const mapStateToProps = (state) => ({
  cache: state.cache
});

function mapDispatchToProps(dispatch) {
  return {
    updateCurrentAccount: (account) => {
      dispatch(updateCurrentAccount(account))
    },
    updateAccoutType: (type) => {
      dispatch(updateAccoutType(type));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(AccountName);
