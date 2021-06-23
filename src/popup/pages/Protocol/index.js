import React from "react";
import { connect } from "react-redux";
import { getLanguage } from "../../../i18n";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import "./index.scss";
import protocol from "../../../i18n/protocol"
import { getCurrentLang } from "../../../i18n"
import { USER_AGREEMENT } from "../../../constant/storageKey";
import { saveLocal } from "../../../background/localStorage";
import cx from "classnames"; 

class ProtocolPage extends React.Component {
  constructor(props) {
    super(props);
    let isHideBtn = props.location.params?.isHideBtn ?? false;
    this.state = {
      content: "",
      isHideBtn
    };
    this.isUnMounted = false;
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
  componentDidMount() {
    let currentLang = getCurrentLang()
    this.callSetState({
      content: protocol[currentLang]
    })
  }
  renderUserProtocol = () => {
    let content = this.state.content
    return (
      <div className={cx("user-agree-container-common", {
        "user-agree-container-border": !this.state.isHideBtn
      })}>
        <p className="user-agree-content">{content}</p>
      </div>
    )
  }
  goToNext = () => {
    let { protocolFromRoute } = this.props.cache
    // 本地保存同意
    saveLocal(USER_AGREEMENT, "true")
    this.props.history.push({
      pathname: protocolFromRoute
    })
  }
  renderBtn = () => {
    if (this.state.isHideBtn) {
      return (<></>)
    }
    return (
      <div className="bottom-container">
        <Button
          content={getLanguage('agree')}
          onClick={this.goToNext}
        />
      </div>
    )
  }
  render() {
    return (
      <CustomView
        title={getLanguage('userAgree')}
        history={this.props.history}>
        <div className={cx("protocol-container-common",{
          "protocol-container-btn": !this.state.isHideBtn
        })}>
          {this.renderUserProtocol()}
        </div>
        {this.renderBtn()}
      </CustomView>)
  }
}

const mapStateToProps = (state) => ({
  cache: state.cache,
});

function mapDispatchToProps(dispatch) {
  return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(ProtocolPage);
