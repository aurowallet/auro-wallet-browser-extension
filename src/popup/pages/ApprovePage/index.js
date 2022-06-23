import React from "react";
import { connect } from "react-redux";
import { DAPP_ACTION_CLOSE_WINDOW, DAPP_ACTION_GET_ACCOUNT, DAPP_GET_CURRENT_ACCOUNT_CONNECT_STATUS, WALLET_GET_CURRENT_ACCOUNT } from "../../../constant/types";
import { getLanguage } from "../../../i18n";
import { updateDAppOpenWindow, updateDappSelectList } from "../../../reducers/cache";
import { ENTRY_WITCH_ROUTE, updateEntryWitchRoute } from "../../../reducers/entryRouteReducer";
import { sendMsg } from "../../../utils/commonMsg";
import { getQueryStringArgs } from "../../../utils/utils";
import Button, { BUTTON_TYPE_CANCEL } from "../../component/Button";
import DappWebsite from "../../component/DappWebsite";
import LockPage from '../Lock';
import ApproveAccountItem from "./ApproveAccountItem";
import "./index.scss";

class ApprovePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lockStatus: false,
    };
    this.firstRequest = true
    this.isUnMounted = false;
  }
  componentWillUnmount() {
    this.isUnMounted = true;
  }
  componentDidMount() {
    let params = this.getParams()
    if (!(params.isUnlocked == '0' && !this.state.lockStatus)) {
      this.getAccountConnect()
    }
  }

  getAccountConnect = () => {
    sendMsg({
      action: WALLET_GET_CURRENT_ACCOUNT,
      payload: true
    }, (account) => {
      let list = []
      list.push(account)
      this.props.updateDappSelectList(list)
    })
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

  renderActionBtn = () => {
    let { currentAccount } = this.props;
    return (
      <div className={"approve-button-container"}>
        <Button
          content={getLanguage('cancel')}
          buttonType={BUTTON_TYPE_CANCEL}
          onClick={() => {
            sendMsg({
              action: DAPP_ACTION_GET_ACCOUNT,
              payload: {
                selectAccount: [],
                currentAddress: currentAccount.address,
                resultOrigin: this.getParams().siteUrl,
              }
            }, async (params) => {
              this.goToHome()
            })
          }}
        />
        <Button
          content={getLanguage('setConnect')}
          onClick={async () => {
            let selectAccount = this.props.dappAccountList
            sendMsg({
              action: DAPP_ACTION_GET_ACCOUNT,
              payload: {
                selectAccount,
                resultOrigin: this.getParams().siteUrl,
              },
            }, (params) => {
              this.goToHome()
            })
          }}
        />
      </div>
    );
  };
  renderBottomStable = () => {
    return (<div className="bottomRowContainer">
      {this.renderActionBtn()}
    </div>)
  }
  goToHome = () => {
    let url = this.props.dappWindow?.url
    if (url) {
      this.props.updateEntryWitchRoute(ENTRY_WITCH_ROUTE.HOME_PAGE)
    }
    this.props.updateDAppOpenWindow({})
  }
  onClickUnLock = async () => {
    let { currentAccount } = this.props;
    let params = this.getParams()
    let siteUrl = params.siteUrl || ""
    sendMsg({
      action: DAPP_GET_CURRENT_ACCOUNT_CONNECT_STATUS,
      payload: {
        siteUrl: siteUrl,
        currentAddress: currentAccount.address,
      }
    }, async (currentAccountConnectStatus) => {

      if (currentAccountConnectStatus) {
        sendMsg({
          action: DAPP_ACTION_CLOSE_WINDOW,
          payload: {
            page: "approve_page",
            account: currentAccount.address,
            resultOrigin: siteUrl,
          },
        }, (params) => {
        })
      } else {
        this.getAccountConnect()
        this.callSetState({
          lockStatus: true
        })
      }
    })
  }

  renderAccountView = () => {
    const { dappAccountList } = this.props
    return (
      <div className={"approve-page-item-container"}>
        {dappAccountList.map((item, index) => {
          return (
            <ApproveAccountItem
              key={index + ""}
              account={item}
            />
          )
        })}
      </div>)
  }
  getParams = () => {
    let url = this.props.dappWindow.url || window.location?.href || ""
    return getQueryStringArgs(url)
  }

  render() {
    let params = this.getParams()
    if (params.isUnlocked == '0' && !this.state.lockStatus) {
      return <LockPage onDappConfirm={true} onClickUnLock={this.onClickUnLock} history={this.props.history} />;
    }
    return (<>
      <div className="approveHead">
        <p className={"approve-common-title"}>{getLanguage('connectTitle')}</p>
        <DappWebsite siteIcon={params.siteIcon} siteUrl={params.siteUrl} />
        <p className={'approveDescTipTitle'}>{getLanguage('agreeToConnect')}</p>
      </div>
      {this.renderAccountView()}
      <p className={'approveDescTipTitle'}>{getLanguage('agreeToConnectTip')}</p>
      {this.renderBottomStable()}
    </>)
  }
}

const mapStateToProps = (state) => ({
  currentAccount: state.accountInfo.currentAccount,
  dappAccountList: state.cache.dappAccountList,
  dappWindow: state.cache.dappWindow,
});

function mapDispatchToProps(dispatch) {
  return {
    updateDappSelectList: (list) => {
      dispatch(updateDappSelectList(list))
    },
    updateDAppOpenWindow: (window) => {
      dispatch(updateDAppOpenWindow(window))
    },
    updateEntryWitchRoute: (route) => {
      dispatch(updateEntryWitchRoute(route))
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ApprovePage);