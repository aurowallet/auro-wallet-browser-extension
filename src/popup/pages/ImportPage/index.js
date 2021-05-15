import React from "react";
import { connect } from "react-redux";
import { ACCOUNT_TYPE } from "../../../constant/walletType";
import { ACCOUNT_NAME_FROM_TYPE } from "../../../constant/pageType";
import { getLanguage } from "../../../i18n";
import CustomView from "../../component/CustomView";
import "./index.scss";
import cx from "classnames"
import txArrow from "../../../assets/images/txArrow.png";
import {setChangeAccountName, updateAccoutType} from "../../../reducers/cache";
import {sendMsg} from "../../../utils/commonMsg";
import {WALLET_GET_ALL_ACCOUNT} from "../../../constant/types";

class ImportPage extends React.Component {
  constructor(props) {
    super(props);
    const title = props.location.params?.title ?? ""
    const content = props.location.params?.content ?? ""
    this.state = {
      title,
      content,
      accountList: null
    };
  }
  componentDidMount() {
    sendMsg({
      action: WALLET_GET_ALL_ACCOUNT,
    }, (account) => {
      this.accountList = account.accounts
    })
  }

  renderInfo = (title, callback) => {
    return (
      <div
        onClick={() => { callback && callback() }}
        className={'security-content-import click-cursor'}>
        <p className={"security-content-title"}>{title}</p>
        <img className={'sec-arrow'} src={txArrow} />
      </div>
    )
  }
  getAccountTypeIndex = (list) => {
    if (list.length === 0) {
      return 1
    } else {
      return parseInt(list[list.length - 1].typeIndex) + 1
    }
  }
  importPrivateKey = () => {
    this.props.updateAccoutType(ACCOUNT_NAME_FROM_TYPE.OUTSIDE)
    this.props.history.push({
      pathname: "/account_name",
    });
  }
  importWacthMode = () => {
    let accountTypeList = this.accountList.filter((item) => item.type === ACCOUNT_TYPE.WALLET_WATCH)
    let accountCount = this.getAccountTypeIndex(accountTypeList)
    this.props.updateAccoutType(ACCOUNT_NAME_FROM_TYPE.WATCHMODE)
    this.props.setChangeAccountName({
      fromType: ACCOUNT_NAME_FROM_TYPE.WATCHMODE,
      accountCount
    })
    this.props.history.replace({
      pathname: "/account_name",
    })
  }
  importKepair = () => {
    this.props.updateAccoutType(ACCOUNT_NAME_FROM_TYPE.KEYPAIR)
    this.props.history.push({
      pathname: "/account_name",
    });
  }
  renderImportOption = () => {
    return (
      <div className={'account-info-import'}>
        {this.renderInfo(getLanguage('privateKey'), this.importPrivateKey)}
        {this.renderInfo("Keystore", this.importKepair)}
        {this.renderInfo(getLanguage('watchAccount'), this.importWacthMode)}
      </div>
    )
  }
  render() {
    return (
      <CustomView
        title={getLanguage('importEntry')}
        history={this.props.history}>
        {this.renderImportOption()}
      </CustomView>)
  }
}

const mapStateToProps = (state) => ({});

function mapDispatchToProps(dispatch) {
  return {
    updateAccoutType: (type) => {
      dispatch(updateAccoutType(type));
    },
    setChangeAccountName: (info) => {
      dispatch(setChangeAccountName(info))
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ImportPage);
