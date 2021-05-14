import React from "react";
import { connect } from "react-redux";
import {WALLET_CREATE_HD_ACCOUNT, WALLET_IMPORT_LEDGER, WALLET_IMPORT_WATCH_MODE} from "../../../constant/types";
import { getLanguage } from "../../../i18n";
import { updateCurrentAccount } from "../../../reducers/accountReducer";
import { sendMsg } from "../../../utils/commonMsg";
import { nameLengthCheck } from "../../../utils/utils";
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
    if (!addressValid(this.state.watchModeAddress)) {
      Toast.info(getLanguage('sendAddressError'))
      return
    }
    sendMsg({
      payload: {
        address: this.state.watchModeAddress,
        accountName: accountName
      },
      action: WALLET_IMPORT_WATCH_MODE
    },(account)=>{
      console.log('account', account)
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
      sendMsg({
        action: WALLET_CREATE_HD_ACCOUNT,
        payload: { accountName: accountText }
      }, (account) => {
        this.props.updateCurrentAccount(account)
        this.props.history.replace({
          pathname: "/account_manage",
        })
      })
    }
    this.isClicked = false
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
    let buttonText = fromType === ACCOUNT_NAME_FROM_TYPE.INSIDE? 'confirm_1' : 'next'
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
      <div>HD派生路径</div>
      <div className={'ledger-derived-input'}>m / 44' / 12586' / '<input
        type='number'
        min="0"
        step="1"
        onChange={this.onAccountIndexChange}
        value={this.state.accountIndex}/>'/0/0</div>
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
