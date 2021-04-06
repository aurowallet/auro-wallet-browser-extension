import React from "react";
import { connect } from "react-redux";
import { MINA_GET_CREATE_MNEMONIC } from "../../../constant/types";
import { getLanguage } from "../../../i18n";
import { sendMsg } from "../../../utils/commonMsg";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import "./index.scss";
class ShowMnemonic extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mnemonic: "",
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
    sendMsg({
      action: MINA_GET_CREATE_MNEMONIC,
    }, (mnemonic) => { 
      this.callSetState({
        mnemonic: mnemonic
      })
    })
  }

  showMne = () => {
    return (
      <div className={"mne-container"}>
        {this.state.mnemonic.split(" ").map((item, index) => {
          return <p key={index + ""} className="mne-item mne-item-common">{index + 1 + ". " + item}</p>;
        })}
      </div>
    );
  };
  goToNext = () => {
    this.props.history.push({
      pathname: "/backupmnemonic",
    })
  };
  renderBottonBtn = () => {
    return (
      <div className="bottom-container">
        <Button
          content={getLanguage('show_seed_button')}
          onClick={this.goToNext}
        />
      </div>
    )
  }
  render() {
    return (
      <CustomView
        title={getLanguage('backTips_title')}
        history={this.props.history}>
        <div className="mne-show-container">
          <p className={"mne-description"}>{getLanguage("show_seed_content")}</p>
          {this.showMne()}
        </div>
        {this.renderBottonBtn()}
      </CustomView>
    )
  }
}

const mapStateToProps = (state) => ({
});

function mapDispatchToProps(dispatch) {
  return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(ShowMnemonic);
