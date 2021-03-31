import React from 'react';
import ledgerWallet from "../../../assets/images/ledgerWallet.png";
import connectedIcon from "../../../assets/images/connected.png";
import {getLanguage} from "../../../i18n";
import './index.scss';
import PropTypes from 'prop-types';
export class LedgerConnected extends React.Component {
  static propTypes = {
    tips: PropTypes.array
  }
  renderTopLogo = () => {
    return (
      <div className={"ledger-status-logo-con"}>
        <img src={ledgerWallet} className={"ledger-status-logo"} />
        <div className={'ledger-connected-status'}>
          <div className={'connected-status'}>
            <img src={connectedIcon} className={'ledger-connected-icon'}/>
            {
              getLanguage('connected')
            }
          </div>
          {
            getLanguage('ledgerWallet')
          }
        </div>
      </div>
    )
  }
  renderTips = () => {
    return (<div className={'ledger-connect-tip-container'}>
      {
        this.props.tips.map((tip)=>{
          return <p className="wallet-tip-description" key={tip} dangerouslySetInnerHTML={{__html:getLanguage(tip)}}/>
        })
      }
    </div>)
  }
  render() {
    return <div className={'ledger-connected-container'}>
      {
        this.renderTopLogo()
      }
      {
        this.renderTips()
      }
    </div>
  }
}