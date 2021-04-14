import React from "react";
import { connect } from "react-redux";
import home_active from "../../../assets/images/home_active.png";
import home_common from "../../../assets/images/home_common.png";
import setting_active from "../../../assets/images/setting_active.png";
import setting_common from "../../../assets/images/setting_common.png";
import staking_active from "../../../assets/images/staking_active.png";
import staking_common from "../../../assets/images/staking_common.png";
import { getLocal, saveLocal } from "../../../background/localStorage";
import { NET_WORK_CONFIG } from "../../../constant/storageKey";
import { WALLET_GET_CURRENT_ACCOUNT } from "../../../constant/types";
import { getLanguage } from "../../../i18n";
import { updateCurrentAccount } from "../../../reducers/accountReducer";
import { updateCurrentNetwork, updateNetConfig } from "../../../reducers/network";
import { updateHomeIndex } from "../../../reducers/tabRouteReducer";
import { sendMsg } from "../../../utils/commonMsg";
import Tabs from "../../component/Tabs";
import Setting from "../Setting";
import Staking from "../Staking";
import Wallet from "../Wallet";
import "./index.scss";



class HomePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    }
  }

  componentDidMount() {
  }
  onChangeRouteIndex = (index) => {
    this.props.updateHomeIndex(index)
  }

  render() {
    let { tabRoute } = this.props
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
        }}
      >
        <Tabs currentActiveIndex={tabRoute.homePageRouteIndex} onChangeIndex={this.onChangeRouteIndex}>
          <div lable={getLanguage('wallet')}
            activeSource={home_active}
            commonSource={home_common}
          >
            <Wallet params={this.props} />
          </div>
          <div lable={getLanguage('staking')}
            activeSource={staking_active}
            commonSource={staking_common}
          >
            <Staking params={this.props} />
          </div>
          <div
            lable={getLanguage('setting')}
            activeSource={setting_active}
            commonSource={setting_common}
          >
            <Setting params={this.props} />
          </div>
        </Tabs>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  tabRoute: state.tabRouteConfig,
  currentAccount: state.accountInfo.currentAccount,
});

function mapDispatchToProps(dispatch) {
  return {
    updateHomeIndex: (index) => {
      dispatch(updateHomeIndex(index));
    },
    updateCurrentAccount: (account) => {
      dispatch(updateCurrentAccount(account))
    },
    updateCurrentNetwork: (url, type) => {
      dispatch(updateCurrentNetwork(url, type))
    },
    updateNetConfig: (config) => {
      dispatch(updateNetConfig(config))
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(HomePage);
