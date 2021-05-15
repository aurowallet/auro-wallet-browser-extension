import React from "react";
import { connect } from "react-redux";
import ledgerWallet from "../../../assets/images/ledgerWallet.png";
import { getLanguage } from "../../../i18n";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import Loading from "../../component/Loading";
import "./index.scss";
import {checkLedgerConnect, requestAccount} from "../../../utils/ledger";
import Toast from "../../component/Toast";
import {sendMsg} from "../../../utils/commonMsg";
import {WALLET_IMPORT_LEDGER} from "../../../constant/types";
import {updateCurrentAccount} from "../../../reducers/accountReducer";
import {LedgerConnected} from "../../component/LedgerConnected";

class LedgerImport extends React.Component {
  constructor(props) {
    let params = props.location?.params || {};
    super(props);
    this.accountName = params.accountName;
    this.accountIndex = params.accountIndex;
    this.state = {
    };
  }


  renderTopLogo = () => {
    return (
      <div className={"ledger-logo-container"}>
        <img src={ledgerWallet} className={"ledger-wallet-logo"} />
      </div>
    )
  }
  renderTips = () => {
    return (<div className={'ledger-connect-tip-container'}>
      <p className="wallet-tip-description">{getLanguage('ledgerConnectSuccess')}</p>
      <p className="wallet-tip-description">{getLanguage('ledgerImportTip')}</p>
    </div>)
  }
  goToNext = async () => {
    Loading.show()
    const {ledgerApp} = await checkLedgerConnect()
    if (ledgerApp) {
      Loading.show()
      const {publicKey, rejected} = await requestAccount(ledgerApp, this.accountIndex)
      Loading.hide()
      if (rejected) {
        Toast.info(getLanguage('ledgerRejected'))
      } else {
        sendMsg({
          payload: {
            address: publicKey,
            accountIndex: this.accountIndex,
            accountName: this.accountName
          },
          action: WALLET_IMPORT_LEDGER
        },(account)=>{
          if (account.error) {
            if(account.type === "local"){
              Toast.info(getLanguage(account.error))
            } else {
              Toast.info(account.error)
            }
          } else {
            this.props.updateCurrentAccount(account)
            this.props.history.go(-1)
          }
        })
      }
    }
  }
  renderBottonBtn = () => {
    return (
      <div className="bottom-container">
        <Button
          content={getLanguage('importAccont')}
          onClick={this.goToNext}
        />
      </div>)
  }
  render() {
    return (
      <CustomView
        title={getLanguage('walletName')}
        history={this.props.history}>
        <LedgerConnected tips={['ledgerImportTip']}/>
        {this.renderBottonBtn()}
      </CustomView>)
  }
}

const mapStateToProps = (state) => ({});

function mapDispatchToProps(dispatch) {
  return {
    updateCurrentAccount: (account) => {
      dispatch(updateCurrentAccount(account))
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(LedgerImport);
