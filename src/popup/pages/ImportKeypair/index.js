import React from "react";
import { connect } from "react-redux";
import { validateMnemonic } from "../../../background/accountService";
import { MINA_IMPORT_KEY_STORE, MINA_NEW_HD_ACCOUNT } from "../../../constant/types";
import { getLanguage } from "../../../i18n";
import { updateCurrentAccount } from "../../../reducers/accountReducer";
import { ENTRY_WITCH_ROUTE, updateEntryWitchRoute } from "../../../reducers/entryRouteReducer";
import { sendMsg } from "../../../utils/commonMsg";
import { trimSpace } from "../../../utils/utils";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import Loading from "../../component/Loading";
import TextInput from "../../component/TextInput";
import Toast from "../../component/Toast";
import "./index.scss";
class ImportKeypair extends React.Component {
  constructor(props) {
    super(props);
    let accountName =  props.location.params?.accountName ?? "";
    this.state = {
      btnClick: false,
      keypair: "",
      pwd:"",
      accountName
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
  goToCreate = (e) => {
    e.preventDefault()
    e.stopPropagation()
    Loading.show()
    sendMsg({
      action: MINA_IMPORT_KEY_STORE,
      payload: {
        keypair: this.state.keypair,
        password: this.state.pwd,
        accountName:this.state.accountName
      }
    },
      async (account) => {
        Loading.hide()
        if (account.error) {//如果是数组，且 则返回正确
          if(account.type === "local"){
            Toast.info(getLanguage(account.error))
          }else{
              Toast.info(account.error)
          }
          return
        } else {
          this.props.updateCurrentAccount(account)
          setTimeout(() => {
            this.props.history.replace({ // todo  返回的路由有问题
              pathname: "/account_manage",
            })
          }, 300);
        }
      })
  };

  onKeypairInput = (e) => {
    let keypair = e.target.value;
    this.callSetState({
      keypair:trimSpace(keypair)
    }, () => {
      this.setBtnStatus()
    })
  }
  renderInput = () => {
    return (
      <div className={"keypair-input-container"}>
      <textarea
        className={"text-area-input"}
        value={this.state.privateKey}
        onChange={this.onKeypairInput} />
        </div>
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
  setBtnStatus=()=>{
    if(this.state.keypair.length>0 && this.state.pwd.length>0){
      this.callSetState({
        btnClick:true
      })
    }else{
      this.callSetState({
        btnClick:false
      })
    }
  }
  onPwdInput=(e)=>{
    let pwd = e.target.value;
    this.callSetState({
      pwd:trimSpace(pwd)
    }, () => {
      this.setBtnStatus()
    })
  }
  renderPwdInput = () => {
    return (
      <TextInput
        value={this.state.pwd}
        label={getLanguage('pleaseInputKeyPairPwd')}
        onTextInput={this.onPwdInput}
      />
    )
  }
  renderDescContainer=(content1,content2)=>{
    return(<div className={"keypair-input-container-desc"}>
        <p className={"import-title-keystore"}>{content1}</p>
        <p className={"import-title-keystore"}>{content2}</p>
    </div>)
  }
  renderContentContainer=(content)=>{
    return(<div className={"keypair-input-container"}>
        <p className={"import-title"}>{content}</p>
    </div>)
  }
  render() {
    return (
      <CustomView
        title={getLanguage('importKeyStore')}
        history={this.props.history}>
        <form className="import-keypair-container" onSubmit={this.goToCreate}>
          {this.renderContentContainer(getLanguage("pleaseInputKeyPair"))}
          {this.renderInput()}
          {this.renderPwdInput()}
          {this.renderDescContainer(getLanguage("importAccount_2"),getLanguage("importAccount_3"))}
        </form>
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

export default connect(mapStateToProps, mapDispatchToProps)(ImportKeypair);
