import React from "react";
import { connect } from "react-redux";
import { getLanguage } from "../../../i18n";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import "./index.scss";
class ShowMnemonic extends React.Component {
  constructor(props) {
    super(props);
    const pwd = props.location.params?.password ?? ""
    this.state = {
      mnemonic: "",
      password: pwd
    };
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
  componentDidMount() {
    this.callSetState({
      mnemonic: this.props.mnemonic
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
      params: {
        "password": this.state.password,
        "mnemonic": this.state.mnemonic
      },
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
  mnemonic: state.accountInfo.mnemonic,
});

function mapDispatchToProps(dispatch) {
  return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(ShowMnemonic);
