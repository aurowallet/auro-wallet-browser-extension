import React from "react";
import { connect } from "react-redux";
import select_account_no from "../../../assets/images/select_account_no.png";
import select_account_ok from "../../../assets/images/select_account_ok.png";
import { changeLanguage, getLanguage, languageOption, LANG_SUPPORT_LIST } from "../../../i18n";
import { setLanguage } from "../../../reducers/appReducer";
import CustomView from "../../component/CustomView";
import "./index.scss"; 

class LanguageManagementPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: LANG_SUPPORT_LIST.ZH_CN
    };
    this.language = languageOption
  }

  changeLangOption = (item) => {
    if (item.key !== this.props.language) {
      changeLanguage(item.key);
      this.props.setLanguage(item.key);
    }
  }
  renderOptionItem = (item, index) => {
    let imgSource = this.props.language === item.key ? select_account_ok : select_account_no
    return (
      <div onClick={() => this.changeLangOption(item)} className={"lang-option-item click-cursor"} key={item.key + ""}>
        <p className={"lang-option-title"}>{item.value}</p>
        <div className={"lang-option-img-container"} >
          <img className={"lang-option-img"} src={imgSource} />
        </div>
      </div>
    )
  }
  renderLangOption = () => {
    return (
      <div className={"lang-option-container"}>
        {this.language.map((item, index) => {
          return this.renderOptionItem(item)
        })}
      </div>
    )
  }

  render() {
    return (
      <CustomView
        title={getLanguage("language")}
        history={this.props.history}>
        {this.renderLangOption()}
      </CustomView>)
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
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(LanguageManagementPage);
