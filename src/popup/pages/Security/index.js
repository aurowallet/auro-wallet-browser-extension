import React from "react";
import { connect } from "react-redux";
import txArrow from "../../../assets/images/txArrow.png";
import { SEC_SHOW_MNEMONIC } from "../../../constant/secTypes";
import { getLanguage } from "../../../i18n";
import CustomView from "../../component/CustomView";
import "./index.scss";
class Security extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
    this.settingList = [{
      name: getLanguage('restoreSeed'),
      route: "/security_pwd_page",
      nextRoute: "/reveal_seed_page",
      action: SEC_SHOW_MNEMONIC
    },
    {
      name: getLanguage('changePassword'),
      route: "/reset_password",
    }
    ]
  }
  onClickItem = (e) => {
    this.props.history.push({
      pathname: e.route,
      params: {
        ...e
      }
    })
  }

  renderMainItem = () => {
    return (
      <div>
        {this.settingList.map((item, index) => {
          return (
            <div key={index + ""}
              onClick={() => this.onClickItem(item)}
              className={'security-content-container click-cursor'}>
              <p className={"security-content-title"}>{item.name}</p>
              <img className={'sec-arrow'} src={txArrow} />
            </div>)
        })}
      </div>
    )
  }
  render() {
    return (<CustomView
      title={getLanguage('security')}
      history={this.props.history}>
      {this.renderMainItem()}
    </CustomView>)
  }
}

const mapStateToProps = (state) => ({});

function mapDispatchToProps(dispatch) {
  return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(Security);
