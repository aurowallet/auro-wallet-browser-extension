import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import purpleArrow from "../../../assets/images/rightPurpleArrow.png";
import whiteArrow from "../../../assets/images/rightWhiteArrow.png";
import logo from "../../../assets/images/transparentLogo.png";
import welcomeBg from "../../../assets/images/welcomeBg.png";
import { generateMne } from "../../../background/accountService";
import { get } from "../../../background/storageService";
import {
  changeLanguage,
  default_language,
  getCurrentLang,
  getLanguage,
  languageOption
} from "../../../i18n";
import { updateMne } from "../../../reducers/accountReducer";
import { setLanguage } from "../../../reducers/appReducer";
import { setWelcomeNextRoute } from "../../../reducers/cache";
import Button, { BUTTON_TYPE_HOME_BUTTON } from "../../component/Button";
import Select from "../../component/Select";
import "./index.scss";
class Welcome extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newAccount: false
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
    this.props.setWelcomeNextRoute(nextRoute)
    this.props.history.push({
      pathname: "/createpassword",
    }
    )
  };
  goToCreate = () => {
    if (this.state.newAccount) {
      let mne = generateMne()
      this.props.updateMne(mne)
    }
    let nextRoute = "backup_tips"
    this.props.setWelcomeNextRoute(nextRoute)
    this.props.history.push({
      pathname: "/createpassword",
    }
    )
  };

  render() {
    return (
      <div className="welcome_container">
        <img className={"welcome-left-bg"} src={welcomeBg}></img>
        <img style={{
          position: "absolute",
          left: "30px",
          top: "40px",
          width: "54px",
          height: "49px"
        }} src={logo}></img>
        <div className={'language-container'}>
          {this.renderLanMenu()}
        </div>
        <div style={{
          marginTop: "40px",
          width: "100%",
          textAlign: "center",
        }}>
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
    updateMne: (mne) => {
      dispatch(updateMne(mne))
    },
    setWelcomeNextRoute: (nextRoute) => {
      dispatch(setWelcomeNextRoute(nextRoute))
    }
  };
}

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(Welcome)
);
