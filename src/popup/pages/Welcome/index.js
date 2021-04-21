import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import purpleArrow from "../../../assets/images/rightPurpleArrow.png";
import whiteArrow from "../../../assets/images/rightWhiteArrow.png";
import logo from "../../../assets/images/transparentLogo.png";
import welcomeBg from "../../../assets/images/welcomeBg.png";
import { getLocal } from "../../../background/localStorage";
import { get } from "../../../background/storageService";
import { USER_AGREEMENT } from "../../../constant/storageKey";
import {
  changeLanguage,
  default_language,
  getCurrentLang,
  getLanguage,
  languageOption
} from "../../../i18n";
import { setLanguage } from "../../../reducers/appReducer";
import { setWelcomeNextRoute, updateProtocolFrom } from "../../../reducers/cache";
import Button, { BUTTON_TYPE_HOME_BUTTON } from "../../component/Button";
import Select from "../../component/Select";
import "./index.scss";
class Welcome extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newAccount: false,
      isGotoProtocol:true
    }
    this.isUnMounted = false;
  }

  componentDidMount() {
    this.initLocal()
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

  initLocal = () => {
    // 先去获取本地的隐私协议是否同意
    let agreeStatus = getLocal(USER_AGREEMENT)
    if(agreeStatus){
      this.callSetState({
        isGotoProtocol:false
      })
    }
    get(null).then(dataObj => {
      if (dataObj && !dataObj.keyringData) {
        this.callSetState({
          newAccount: true
        })
      }
    })
  }
  handleChange = (item) => {
    let value = item.key
    this.props.setLanguage(value);
    changeLanguage(value);
  };
  renderLanMenu = () => {
    let defaultValue = languageOption.filter((item, index) => {
      return item.key === default_language
    })
    return (
      <Select
        options={languageOption}
        defaultValue={defaultValue[0].value}
        onChange={this.handleChange}
      />
    )
  }
  goToPage = (nextRoute) => {
    // 有协议，先进入协议，然后输入密码。进入主要操作界面
    // 没有协议，进入输入面膜，然后进入主要操作界面
    if(this.state.isGotoProtocol){
      this.props.updateProtocolFrom("/createpassword")
      this.props.setWelcomeNextRoute(nextRoute)
      this.props.history.push({
        pathname: "protocol_page"
      })
    }else{
      this.props.setWelcomeNextRoute(nextRoute)
      this.props.history.push({
        pathname: "/createpassword",
      })
    }
    // 更新下一步的路由
  };
  goToCreate = (nextRoute) => {
    if(this.state.isGotoProtocol){
      this.props.updateProtocolFrom("/createpassword")
      this.props.setWelcomeNextRoute(nextRoute)
      this.props.history.push({
        pathname: "protocol_page",
      })
    }else{
      this.props.setWelcomeNextRoute(nextRoute)
      this.props.history.push({
        pathname: "/createpassword",
      })
    }
  };

  render() {
    return (
      <div className="welcome_container">
        <img className={"welcome-left-bg"} src={welcomeBg}></img>
        <div className={'welcome-top-container'}>
          <img className={'welcome-left-logo'} src={logo}></img>
            {this.renderLanMenu()}
        </div>
        <div className={'welcome-button-container'}>
          <Button
            buttonType={BUTTON_TYPE_HOME_BUTTON}
            propsClass={'welcome-create-button'}
            content={getLanguage('createWallet')}
            onClick={() => { this.goToCreate("/backup_tips") }}
          >
            <img className={"welcome-arrow"} src={whiteArrow}></img>
          </Button>

          <Button
            buttonType={BUTTON_TYPE_HOME_BUTTON}
            propsClass={'welcome-restore-button'}
            content={getLanguage('restoreWallet')}
            onClick={() => { this.goToPage("/restore_account") }}
          >
            <img className={"welcome-arrow"} src={purpleArrow}></img>
          </Button>
        </div>
        <p className="bottomTip" >Powered by Bit Cat</p>
      </div>)
  }
}

const mapStateToProps = (state) => ({
  language: state.appReducer.language,
});

function mapDispatchToProps(dispatch) {
  return {
    setLanguage: (lan) => {
      dispatch(setLanguage(lan));
    },
    setWelcomeNextRoute: (nextRoute) => {
      dispatch(setWelcomeNextRoute(nextRoute))
    },
    
    updateProtocolFrom: (nextRoute) => {
      dispatch(updateProtocolFrom(nextRoute))
    },
  };
}

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(Welcome)
);
