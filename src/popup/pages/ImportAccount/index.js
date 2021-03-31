import React from "react";
import { connect } from "react-redux";
import { MINA_IMPORT_HD_ACCOUNT } from "../../../constant/types";
import { getLanguage } from "../../../i18n";
import { updateCurrentAccount } from "../../../reducers/accountReducer";
import { updateEntryWitchRoute } from "../../../reducers/entryRouteReducer";
import { sendMsg } from "../../../utils/commonMsg";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import Toast from "../../component/Toast";
import "./index.scss";
class ImportAccount extends React.Component {
  constructor(props) {
    super(props);
    let accountName = props.location.params?.accountName || ""
    this.state = {
      btnClick: false,
      privateKey: "",
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
  onPriKeyInput = (e) => {
    let privateKey = e.target.value;
    if (privateKey.length >= 0) {
      this.callSetState({
        privateKey: privateKey.replace(/\s/g, ' '),
        btnClick: true
      })
    } else {
      this.callSetState({
        privateKey: privateKey,
        btnClick: false
      })
    }

  };
  goToCreate = () => {//去创建
    // 去一个界面，输入私钥，然后判断私钥是否有效，有效则导入成功，返回上层界面
    sendMsg({
      action: MINA_IMPORT_HD_ACCOUNT,
      payload: {
        privateKey: this.state.privateKey.replace(/[\r\n]/g, ""),
        accountName: this.state.accountName
      }
    }, (account) => {
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

  handleTextareaChange = (e) => {
    let value = e.target.value
    this.callSetState({
      privateKey: value
    },() => {
      if (this.state.privateKey.length > 0) {
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
      <div className={"keypair-input-container"}>
      <textarea
        className={"text-area-input"}
        value={this.state.privateKey}
        onChange={this.handleTextareaChange} />
        </div>
    )
  }
  renderDescContainer=(content1,content2)=>{ 
    return(<div className={"keypair-input-container-desc"}>
        <p className={"import-title-keystore"}>{content1}</p>
        <p className={"import-title-keystore"}>{content2}</p>
    </div>)
  }
  renderBotton = () => {
    return (
      <div className="bottom-container">
        <Button
          disabled={!this.state.btnClick}
          content={getLanguage('confirm_1')}
          onClick={this.goToCreate}
        />
      </div>
    )
  }
  renderContentContainer=(content)=>{
    return(<div className={"keypair-input-container"}>
        <p className={"import-title"}>{content}</p>
    </div>)
  }
  render() {
    return (
      <CustomView
        title={getLanguage('importAccount')}
        history={this.props.history}>
        <div className="import-keypair-container">
          {this.renderContentContainer(getLanguage("pleaseInputPriKey"))}
          {this.renderInput()}
          {this.renderDescContainer(getLanguage("importAccount_2"),getLanguage("importAccount_3"))}
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
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ImportAccount);
