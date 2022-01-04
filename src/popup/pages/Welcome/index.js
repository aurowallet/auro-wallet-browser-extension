import React from "react";
import { Trans } from "react-i18next";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import purpleArrow from "../../../assets/images/rightPurpleArrow.png";
import whiteArrow from "../../../assets/images/rightWhiteArrow.png";
import logo from "../../../assets/images/transparentLogo.png";
import welcomeBg from "../../../assets/images/welcomeBg.png";
import { getLocal, saveLocal } from "../../../background/localStorage";
import { get } from "../../../background/storageService";
import { USER_AGREEMENT } from "../../../constant/storageKey";
import {
  changeLanguage,
  default_language,
  getCurrentLang,
  getLanguage,
  languageOption,
  LANG_SUPPORT_LIST
} from "../../../i18n";
import { setLanguage } from "../../../reducers/appReducer";
import { setWelcomeNextRoute } from "../../../reducers/cache";
import { openTab } from "../../../utils/commonMsg";
import Button, { BUTTON_TYPE_HOME_BUTTON } from "../../component/Button";
import ConfirmModal from "../../component/ConfirmModal/";
import Select from "../../component/Select";
import "./index.scss";
const type_conditions = "conditions"
const type_policy = "policy"
class Welcome extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newAccount: false,
      isGotoProtocol: true,
      currentLang:""
    }
    this.isUnMounted = false;
  }

  componentDidMount() {
    this.initLocal()
  }
  componentWillUnmount() {
    this.isUnMounted = true;
  }
  callSetState = (data, callback) => {
    if (!this.isUnMounted) {
      this.setState({
        ...data
      }, () => {
        callback && callback()
      })
    }
  }

  initLocal = () => {
    let agreeStatus = getLocal(USER_AGREEMENT)
    if (agreeStatus) {
      this.callSetState({
        isGotoProtocol: false
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
    this.callSetState({currentLang:value})
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
  onClickGuide = (type) => {
    const { terms_and_contions, terms_and_contions_cn, privacy_policy, privacy_policy_cn } = this.props.cache
    let lan = getCurrentLang()
    let url = ""
    if (lan === LANG_SUPPORT_LIST.EN) {
      url = type === type_conditions ? terms_and_contions : privacy_policy
    } else if (lan === LANG_SUPPORT_LIST.ZH_CN) {
      url = type === type_conditions ? terms_and_contions_cn : privacy_policy_cn
    }
    if (url) {
      openTab(url)
    }
  }

  renderClickElement = () => {
    return (<div>
      <p className={'confirm-content'}>{getLanguage('termsAndPrivacy_0')}</p>
      <p className={'confirm-content'}>
        <Trans
          i18nKey={getLanguage('termsAndPrivacy_1')}
          components={{
            conditions: <span className={"tips-spical"} onClick={() => this.onClickGuide(type_conditions)} />,
            policy: <span className={"tips-spical"} onClick={() => this.onClickGuide(type_policy)} />
          }}
        />
      </p>
    </div>)
  }

  onConfirmProtocol = (nextRoute) => {
    let title = getLanguage('termsAndPrivacy')
    let confirmText = getLanguage('agree')
    let cancelText = getLanguage('refuse')
    let elementContent = this.renderClickElement
    ConfirmModal.show({
      title,
      cancelText,
      confirmText,
      elementContent,
      onConfirm: () => this.goPage(nextRoute, "saveProtocol"),
    })
  }

  goPage = (nextRoute, type) => {
    if (type === "saveProtocol") {
      saveLocal(USER_AGREEMENT, "true")
    }
    this.props.setWelcomeNextRoute(nextRoute)
    this.props.history.push({
      pathname: "/createpassword",
    })
  }

  goNextRoute = (nextRoute) => {
    if (this.state.isGotoProtocol) {
      this.onConfirmProtocol(nextRoute)
    } else {
      this.goPage(nextRoute)
    }
  }
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
            onClick={() => { this.goNextRoute("/backup_tips") }}
          >
            <img className={"welcome-arrow"} src={whiteArrow}></img>
          </Button>

          <Button
            buttonType={BUTTON_TYPE_HOME_BUTTON}
            propsClass={'welcome-restore-button'}
            content={getLanguage('restoreWallet')}
            onClick={() => { this.goNextRoute("/restore_account") }}
          >
            <img className={"welcome-arrow"} src={purpleArrow}></img>
          </Button>
        </div>
        <p className="bottomTipLedger" >{getLanguage("ledgerUserTip")}</p>
        <p className="bottomTip" >Powered by Bit Cat</p>
      </div>)
  }
}

const mapStateToProps = (state) => ({
  cache: state.cache,
});

function mapDispatchToProps(dispatch) {
  return {
    setLanguage: (lan) => {
      dispatch(setLanguage(lan));
    },
    setWelcomeNextRoute: (nextRoute) => {
      dispatch(setWelcomeNextRoute(nextRoute))
    },
  };
}

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(Welcome)
);
