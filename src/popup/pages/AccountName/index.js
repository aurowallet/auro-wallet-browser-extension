import React from "react";
import { connect } from "react-redux";
import { WALLET_CREATE_HD_ACCOUNT } from "../../../constant/types";
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
import { updateAccoutType } from "../../../reducers/cache";

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
    }else if(fromType === ACCOUNT_NAME_FROM_TYPE.KEYPAIR){
      placeholderText =  "Import Account "
    } else{
      placeholderText = "Account "
    }
    this.state = {
      accountName: "",
      btnClick: true,
      accountCount,
      errorTipShow: false,
      placeholderText: placeholderText + parseInt(accountCount)
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
  goToNext = async () => {
    if (this.isClicked) {
      return
    }
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
          "accountName": accountText
        },
      })
    } else if(fromType === ACCOUNT_NAME_FROM_TYPE.KEYPAIR){
      this.props.history.push({
        pathname: "/import_keypair",
        params: {
          "accountName": accountText
        },
      })

    } else {
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
  onSubmit = (event) => {
    event.preventDefault();
  }
  render() {
    return (
      <CustomView
        title={getLanguage("accountName")}
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
