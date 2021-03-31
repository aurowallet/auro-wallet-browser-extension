import React from "react";
import { connect } from "react-redux";
import copyImg from "../../../assets/images/copy.png";
import { getLanguage } from "../../../i18n";
import { copyText } from '../../../utils/utils';
import ConfirmModal from '../../component/ConfirmModal';
import CustomView from "../../component/CustomView";
import Toast from "../../component/Toast";
import "./index.scss";
class ShowPrivateKeyPage extends React.Component {
  constructor(props) {
    super(props);
    let privateKey = props.location.params?.privateKey ?? ""
    let address = props.location.params?.address ?? ""
    this.state = {
      priKey: privateKey,
      address,
    };
  }

  renderTip = () => {
    return (
      <p className="wallet-tip-description">{getLanguage('privateKeyTip_2')}</p>
    )
  }
  renderAddress = () => {
    return (<div>
      <p className="wallet-show-title">{getLanguage('walletAddress')}</p>
      <p className="wallet-show-address">{this.state.address}</p>
    </div>)
  }
  renderKey = () => {
    return (<p className="wallet-show-prikey">{this.state.priKey}</p>)
  }
  onCopy = () => {
    let title = getLanguage('prompt')
    let content = getLanguage('copyTipContent')
    let confirmText = getLanguage('copyCancel')
    let cancelText = getLanguage('copyConfirm')
    ConfirmModal.show({
      title, content,
      confirmText, cancelText,
      onConfirm: this.onClickRight,
      onCancel: this.onClickLeft
    })
  }
  onClickRight = () => {
  }
  onClickLeft = () => {
    copyText(this.state.priKey).then(()=>{
      Toast.info(getLanguage('copySuccess'))
    })
  }
  renderCopy = () => { 
    return (
      <div className="copy-to-clip click-cursor"
        onClick={this.onCopy}>
        <img className="copy-to-icon" src={copyImg} />
        <p className="copy-to-desc">{getLanguage('copyToClipboard')}</p>
      </div>
    )
  }
  goToNext = () => {
    this.props.history.goBack()
  }

  render() {
    return (
      <CustomView
        title={getLanguage('showPrivateKey')}
        history={this.props.history}>
        <div className="mne-show-container">
          {this.renderTip()}
          {this.renderAddress()}
          {this.renderKey()}
          {this.renderCopy()}
        </div>
      </CustomView>)
  }
}

const mapStateToProps = (state) => ({
  currentAccount: state.accountInfo.currentAccount,
});

function mapDispatchToProps(dispatch) {
  return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(ShowPrivateKeyPage);
