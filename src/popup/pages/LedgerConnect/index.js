import React from "react";
import { connect } from "react-redux";
import ledgerWallet from "../../../assets/images/ledgerWallet.png";
import select_account_ok from "../../../assets/images/select_account_ok.png";
import { getLanguage } from "../../../i18n";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import Transport from "@ledgerhq/hw-transport-webusb";
import {MinaLedgerJS} from "mina-ledger-js";
import {sendMsg} from "../../../utils/commonMsg";
import {LEDGER_CONNECTED_SUCCESSFULLY} from "../../../constant/types";

import "./index.scss";
import {closePopupWindow} from "../../../utils/popup";
import {LedgerConnected} from "../../component/LedgerConnected";
class LedgerConnect extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      connected: false,
      opened: false,
      connectCompleted: false
    }
    this.isUnMounted = false;
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
  onDisconnected = () => {
    this.callSetState({
      connected: false
    })
  }
  goToNext = async (e) =>{
    let connected = this.state.connected
    let opened = this.state.opened
    try {
      if (this.transport) {
        console.log('create it!')
        this.transport.off('disconnect', this.onDisconnected)
        this.transport.close()
      }
      this.transport = await Transport.create();
      connected = true
      console.log('onDisconnected', this.onDisconnected)
      this.transport.on('disconnect', this.onDisconnected)
    } catch (e) {
      console.log(e, 'port error')
      connected = false
    }

    console.log('transport', this.transport)
    try {
      this.app = new MinaLedgerJS(this.transport)
      const result = await this.app.getAppName()
      console.log('result', result);
      if (result.name === 'Mina') {
        opened = true
      } else {
        opened = false
      }
    } catch (e) {
      console.log('app e', e)
      opened = false
    }
    this.callSetState({
      opened,
      connected
    })
    if (opened && connected) {
      console.log('send message')
      sendMsg({
        action: LEDGER_CONNECTED_SUCCESSFULLY,
      },()=>{
        this.transport.close()
        this.transport = null
        console.log('close ledger')
        this.callSetState({
          connectCompleted: true
        })
      });
    }
  }
  renderCommonStep = (item, index) => {
    return (
      <div key={index + ""} className={"ledger-item-container"}>
        {/* 左右 */}
        <div>
          <div className={"account-item-top"}>
            <p className={"account-item-name ledger-step-title"}>{item.title}</p>
          </div>
          <p className={"account-item-address ledger-step-content"}>{item.content}</p>
        </div>
        <div className={"ledger-item-right"}>
          {item.bool && <img src={select_account_ok} className={"account-item-select click-cursor"} />}
        </div>
      </div>
    )
  }
  renderSteps = () => {
    const steps = [
      {
        title: getLanguage('firstStep'),
        content: getLanguage('pleaseConnectLedger'),
        bool: this.state.connected
      },
      {
        title: getLanguage('secondStep'),
        content: getLanguage('pleaseOpenInLedger'),
        bool: this.state.opened
      }
    ]
    return (
      <>
        <div className={"ledger-steps-logo-container"}>
          <img src={ledgerWallet} className={"ledger-wallet-logo"} />
        </div>
        <div className={"ledger-step-container"}>{steps.map((step, index) => {
          return this.renderCommonStep(step, index)
        })}</div>
      </>
    )
  }
  renderBottonBtn = () => {
    return (
      <div className="bottom-container">
        <Button
          content={getLanguage('next')}
          onClick={this.goToNext}
        />
      </div>)
  }
  render() {
    return (
      <div>
        <div className="ledger-connect-container">
          {
            this.state.connectCompleted ?
            <LedgerConnected tips={['back2extension', 'dontclose']}/> :
            this.renderSteps()
          }
        </div>
        {!this.state.connectCompleted && this.renderBottonBtn()}
      </div>)
  }
}

const mapStateToProps = (state) => ({});

function mapDispatchToProps(dispatch) {
  return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(LedgerConnect);
