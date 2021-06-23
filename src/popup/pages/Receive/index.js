import qrCode from 'qrcode-generator';
import React from "react";
import { connect } from "react-redux";
import { cointypes } from '../../../../config';
import home_logo from "../../../assets/images/home_logo.png";
import minaLogo from "../../../assets/images/minaLogo.png";
import { getLanguage } from "../../../i18n";
import { copyText } from '../../../utils/utils';
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import Toast from "../../component/Toast";
import "./index.scss";
class ReceivePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

    };
  }

  renderQrView = () => {
    let { address } = this.props.currentAccount
    const qrImage = qrCode(4, 'M')
    let qrData = address
    qrImage.addData(qrData)
    qrImage.make()
    return (
      <div className={"receive-scan-container"}>
        <div className={"receive-home-logo-container"}>
          <img src={home_logo} className={"receive-wallet-logo"} />
        </div>
        <div
          className="qr-image"
          dangerouslySetInnerHTML={{
            __html: qrImage.createTableTag(4),
          }}
        />
      </div>
    )
  }
  onCopy = () => {
    let { address } = this.props.currentAccount
    copyText(address).then(()=>{
      Toast.info(getLanguage('copySuccess'))
    })

  }

  renderAddress = () => {
    let { address } = this.props.currentAccount
    return (<div className="receive-address-container">
      <p className={"receive-address-detail"}>{address}</p>
    </div>)
  }

  rednerCopyButton = () => {
    return (
      <div className="receive-bottom-container">
        <Button
          content={getLanguage('copyAddress')}
          onClick={this.onCopy}
        />
      </div>
    )
  }
  renderScanTip = () => {
    return (<p className={"receive-scan-tip"}>{getLanguage('addressQrTip')}</p>)
  }
  render() {
    return (
      <CustomView
        title={getLanguage('receiveTitle')}
        isReceive={true}
        history={this.props.history}>
        <div className={"receive-container"}>
          <img className={'receive-home-logo'} src={minaLogo} />
          <div className={"receive-content-container"}>
            {this.renderScanTip()}
            {this.renderQrView()}
            {this.renderAddress()}
            {this.rednerCopyButton()}
          </div>
          <p className="bottomTip" >Powered by Bit Cat</p>
        </div>
      </CustomView>
    )
  }
}

const mapStateToProps = (state) => ({
  currentAccount: state.accountInfo.currentAccount,
});

function mapDispatchToProps(dispatch) {
  return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(ReceivePage);