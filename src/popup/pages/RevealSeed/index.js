import React from "react";
import { connect } from "react-redux";
import { SEC_SHOW_MNEMONIC } from "../../../constant/secTypes";
import { WALLET_GET_MNE } from "../../../constant/types";
import { getLanguage } from "../../../i18n";
import { sendMsg } from "../../../utils/commonMsg";
import CustomView from "../../component/CustomView";
import SecurityPwd from "../../component/SecurityPwd";
import Toast from "../../component/Toast";

class RevealSeedPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mnemonic: "",
      showSecurity: true
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

  renderInput = () => {
    return (
      <textarea
        className={"text-area-input"}
        value={this.state.mnemonic}
        readOnly="readOnly" />
    )
  }

  onClickCheck = (password) => {
    sendMsg({
      action: WALLET_GET_MNE,
      payload: {
        password: password
      }
    },
      async (mnemonic) => {
        if (mnemonic && mnemonic.error) {
          if (mnemonic.type === "local") {
            Toast.info(getLanguage(mnemonic.error))
          } else {
            Toast.info(mnemonic.error)
          }
        } else {
          this.callSetState({
            mnemonic: mnemonic,
            showSecurity: false
          }, () => {
            Toast.info(getLanguage("securitySuccess"))
          })
        }
      })
  }

  render() {
    const { showSecurity } = this.state
    let title = showSecurity ? getLanguage('securityPassword') : getLanguage('backTips_title')
    return (
      <CustomView
        title={title}
        history={this.props.history}>
        {showSecurity ? <SecurityPwd onClickCheck={this.onClickCheck} action={SEC_SHOW_MNEMONIC} /> :
          <div className="import-container">
            <p className={"import-title"}>{getLanguage('show_seed_content')}</p>
            {this.renderInput()}
          </div>}
      </CustomView>)
  }
}

const mapStateToProps = (state) => ({});

function mapDispatchToProps(dispatch) {
  return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(RevealSeedPage);