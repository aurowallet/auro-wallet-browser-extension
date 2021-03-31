import React from "react";
import { connect } from "react-redux";
import { validateMnemonic } from "../../../background/accountService";
import { MINA_NEW_HD_ACCOUNT } from "../../../constant/types";
import { getLanguage } from "../../../i18n";
import { updateCurrentAccount } from "../../../reducers/accountReducer";
import { ENTRY_WITCH_ROUTE, updateEntryWitchRoute } from "../../../reducers/entryRouteReducer";
import { sendMsg } from "../../../utils/commonMsg";
import { trimSpace } from "../../../utils/utils";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import Toast from "../../component/Toast";
import "./index.scss";
class RestoreAccount extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      btnClick: false,
      mnemonic: ""
    };
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
  goToCreate = () => {
    // 如果长度不够，则提示，长度不符合
    let mnemonic = this.state.mnemonic
    mnemonic = trimSpace(mnemonic)
    let mneList = mnemonic.split(" ")
    if (mneList.length !== 12) {
      Toast.info(getLanguage('seedLengthError'))
      return
    }
    let mnemonicVaild = validateMnemonic(mnemonic)
    if (!mnemonicVaild) {
      Toast.info(getLanguage('inputVaildSeed'))
      return
    } 
    sendMsg({
      action: MINA_NEW_HD_ACCOUNT,
      payload: {
        pwd: this.state.password,
        mne: mnemonic
      }
    },
      async (currentAccount) => {
        // 如果有账户
        this.props.updateCurrentAccount(currentAccount)
        this.props.updateEntryWitchRoute(ENTRY_WITCH_ROUTE.HOME_PAGE)
        this.props.history.push({
          pathname: "/backupsuccess",
          params:{type:"restore"}
        })
      })
  };

  onMneInput = (e) => {
    let mnemonic = e.target.value;
    let _mnemonic = mnemonic.replace(/\s/g, ' ');
    _mnemonic = _mnemonic.replace(/[\r\n]/g, "")
    this.callSetState({
      mnemonic: _mnemonic
    }, () => {
      if (mnemonic.length > 0) {
        this.callSetState({
          btnClick: true
        })
      } else {
        this.callSetState({
          btnClick: false
        })
      }
    })
  }
  renderInput = () => {
    return (
      <textarea
        className={"text-area-input"}
        value={this.state.privateKey}
        onChange={this.onMneInput} />
    )
  }
  renderBotton = () => {
    return (
      <div className="bottom-container">
        <Button
          disabled={!this.state.btnClick}
          content={getLanguage('confirm')}
          onClick={this.goToCreate}
        />
      </div>
    )
  }
  render() {
    return (
      <CustomView
        title={getLanguage("restoreWallet")}
        history={this.props.history}>
        <div className="import-container">
          <p className={"import-title"}>{getLanguage("inputSeed")}</p>
          {this.renderInput()}
        </div>
        {this.renderBotton()}
      </CustomView>
    )
  }

}

const mapStateToProps = (state) => ({});

function mapDispatchToProps(dispatch) {
  return {
    updateEntryWitchRoute: (index) => {
      dispatch(updateEntryWitchRoute(index));
    },
    updateCurrentAccount: (account) => {
      dispatch(updateCurrentAccount(account))
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(RestoreAccount);
