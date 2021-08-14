import React from "react";
import { connect } from "react-redux";
import { SEC_DELETE_ACCOUNT, SEC_SHOW_MNEMONIC, SEC_SHOW_PRIVATE_KEY } from "../../../constant/secTypes";
import { WALLET_CHANGE_DELETE_ACCOUNT, WALLET_GET_MNE, WALLET_GET_PRIVATE_KEY } from "../../../constant/types";
import { getLanguage } from "../../../i18n";
import { updateCurrentAccount } from "../../../reducers/accountReducer";
import { sendMsg } from "../../../utils/commonMsg";
import Button from "../../component/Button";
import ConfirmModal from "../../component/ConfirmModal";
import CustomView from "../../component/CustomView";
import Loading from "../../component/Loading";
import TextInput from "../../component/TextInput";
import Toast from "../../component/Toast";
class SecurityPwdPage extends React.Component {
  constructor(props) {
    super(props);
    let allParams = props.location?.params || {}

    this.state = {
      btnClick: false,
      pwd: "",
      pwdErr: "",

    };
    this.nextRoute = allParams.nextRoute || ""
    this.nextParams = allParams.nextParams || {}
    this.address = allParams.address || ""
    this.isUnMounted = false;
  }
  onModalConfirm = () => {
    ConfirmModal.hide()
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
  componentDidMount() {
    let action = this.props.location.params?.action || ""
    let title = getLanguage('prompt')
    let content = ""
    let confirmText = getLanguage('isee')
    switch (action) {
      case SEC_DELETE_ACCOUNT:
        content = getLanguage('deleteAccountTip')
        ConfirmModal.show({
          title, content,
          confirmText,
          onConfirm: this.onModalConfirm,
        })
        break
      case SEC_SHOW_PRIVATE_KEY:
        content = [getLanguage('privateKeyTip_1'),
        getLanguage('privateKeyTip_2')]
        ConfirmModal.show({
          title, content,
          confirmText,
          onConfirm: this.onModalConfirm,
        })
        break
      case SEC_SHOW_MNEMONIC:
        content = [getLanguage('backTips_1'),
        getLanguage('backTips_2'),
        getLanguage('backTips_3'),
        ]
        ConfirmModal.show({
          title, content,
          confirmText,
          onConfirm: this.onModalConfirm,
        })
        break
    }
  }

  onPwdInput = (e) => {
    let pwd = e.target.value;
    this.callSetState({
      pwd
    }, () => {
      if (this.state.pwd.trim().length > 0) {
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
  onConfirm = () => {
    let action = this.props.location.params?.action || ""
    let jumpTime = 50
    switch (action) {
      case SEC_DELETE_ACCOUNT:
        Loading.show()
        sendMsg({
          action: WALLET_CHANGE_DELETE_ACCOUNT,
          payload: {
            address: this.address,
            password: this.state.pwd
          }
        },
          async (currentAccount) => {
            Loading.hide()
            if (currentAccount.error) {
              if(currentAccount.type === "local"){
                Toast.info(getLanguage(currentAccount.error))
              }else{
                  Toast.info(currentAccount.error)
              }
            } else {
              Toast.info(getLanguage("deleteSuccess"))
              this.props.updateCurrentAccount(currentAccount)
              if (this.nextRoute) {
                this.props.history.replace({
                  pathname: this.nextRoute,
                  params: {
                    ...this.nextParams
                  }
                }
                )
              }
            }
          })
        break;
      case SEC_SHOW_PRIVATE_KEY:
        sendMsg({
          action: WALLET_GET_PRIVATE_KEY,
          payload: {
            password: this.state.pwd,
            address: this.address
          }
        },
          async (privateKey) => {
            if (privateKey.error) {
              if(privateKey.type === "local"){
                Toast.info(getLanguage(privateKey.error))
              }else{
                  Toast.info(privateKey.error)
              }
            } else {
              Toast.info(getLanguage("securitySuccess"))
              setTimeout(() => {
                if (this.nextRoute) {
                  this.props.history.replace({
                    pathname: this.nextRoute,
                    params: {
                      ...this.nextParams,
                      privateKey,
                      address:this.address
                    }
                  }
                  )
                }
              }, jumpTime);
            }
          })
        break
      case SEC_SHOW_MNEMONIC:
        sendMsg({
          action: WALLET_GET_MNE,
          payload: {
            password: this.state.pwd
          }
        },
          async (mnemonic) => { 
            if (mnemonic && mnemonic.error) {
              if(mnemonic.type === "local"){
                Toast.info(getLanguage(mnemonic.error))
              }else{
                  Toast.info(mnemonic.error)
              }
            } else {
              Toast.info(getLanguage("securitySuccess"))
              setTimeout(() => {
                if (this.nextRoute) {
                  this.props.history.replace({
                    pathname: this.nextRoute,
                    params: {
                      ...this.nextParams,
                      mnemonic
                    }
                  }
                  )
                }
              }, jumpTime);
            }
          })
        break
      default:
        break;
    }
  }

  renderInput = () => {
    return (
      <TextInput
        value={this.state.pwd}
        label={getLanguage('securityHolder')}
        onTextInput={this.onPwdInput}
      />
    )
  }
  renderBottomBtn = () => {
    return (
      <div className="bottom-container">
        <Button
          disabled={!this.state.btnClick}
          content={getLanguage('confirm_1')}
          onClick={this.onConfirm}
        />
      </div>
    )
  }
  onSubmit = (event) => {
    event.preventDefault();
  }
  render() {
    return (
      <CustomView
        title={getLanguage('securityPassword')}
        history={this.props.history}>
        <form onSubmit={this.onSubmit}>
          {this.renderInput()}
          {this.renderBottomBtn()}
        </form>
      </CustomView>)
  }
}

const mapStateToProps = (state) => ({});

function mapDispatchToProps(dispatch) {
  return {
    updateCurrentAccount: (account) => {
      dispatch(updateCurrentAccount(account))
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SecurityPwdPage);
