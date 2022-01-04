import React from "react";
import { connect } from "react-redux";
import home_active from "../../../assets/images/home_active.png";
import home_common from "../../../assets/images/home_common.png";
import setting_active from "../../../assets/images/setting_active.png";
import setting_common from "../../../assets/images/setting_common.png";
import staking_active from "../../../assets/images/staking_active.png";
import staking_common from "../../../assets/images/staking_common.png";
import { getLocal } from "../../../background/localStorage";
import { LOCAL_CACHE_KEYS } from "../../../constant/storageKey";
import { NET_CONFIG_TYPE } from "../../../constant/walletType";
import { getLanguage } from "../../../i18n";
import { updateAccountTx, updateNetAccount } from "../../../reducers/accountReducer";
import { updateCurrentPrice } from "../../../reducers/cache";
import { updateBlockInfo, updateDaemonStatus, updateDelegationInfo, updateStakingList, updateValidatorDetail } from "../../../reducers/stakingReducer";
import { updateHomeIndex } from "../../../reducers/tabRouteReducer";
import { isNumber } from "../../../utils/utils";
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
  componentWillMount() {
    this.getlocalCache()
  }

  componentDidMount() {
  }
  onChangeRouteIndex = (index) => {
    this.props.dispatch(updateHomeIndex(index))
  }
  safeJsonParse = (data) => {
    try {
      return JSON.parse(data)
    } catch (error) {
      return ""
    }
  }
  /**
   * updateTxList
   * @param {*} address 
   */
  shouldUpdateTxList = (address) => {
    let localHistory = getLocal(LOCAL_CACHE_KEYS.TRANSACTION_HISTORY)
    let txList = []
    let pendingTxList = []
    if (localHistory) {
      let localHistoryJson = this.safeJsonParse(localHistory)
      txList = localHistoryJson ? localHistoryJson[address] : []
    }
    let localPendingHistory = getLocal(LOCAL_CACHE_KEYS.PENDING_TRANSACTION_HISTORY)
    if (localPendingHistory) {
      let localPendingJson = this.safeJsonParse(localPendingHistory)
      pendingTxList = localPendingJson ? localPendingJson[address] : []
    }
    let updateTxList = txList && Array.isArray(txList) ? txList : []
    let updatePendingTxList = pendingTxList && Array.isArray(pendingTxList) ? pendingTxList : []
    this.props.dispatch(updateAccountTx(updateTxList, updatePendingTxList))
  }
  updateLocalAccount = (address) => {
    let localAccount = getLocal(LOCAL_CACHE_KEYS.ACCOUNT_BALANCE)
    if (localAccount) {
      let localAccountJson = this.safeJsonParse(localAccount)
      let netAccount = localAccountJson ? localAccountJson[address] : ""
      if (netAccount && netAccount.publicKey) {
        this.props.dispatch(updateNetAccount(netAccount, true))
      }
    }
  }
  updateLocalPrice = () => {
    let localPrice = getLocal(LOCAL_CACHE_KEYS.COIN_PRICE)
    if (localPrice) {
      let localPriceJson = this.safeJsonParse(localPrice)
      if (localPriceJson && isNumber(localPriceJson.price)) {
        this.props.dispatch(updateCurrentPrice(localPriceJson.price))
      }
    }
  }
  updateLocalDaemonStatus = () => {
    let localDaemonStatus = getLocal(LOCAL_CACHE_KEYS.DAEMON_STATUS)
    if (localDaemonStatus) {
      let localDaemonStatusJson = this.safeJsonParse(localDaemonStatus)
      if (localDaemonStatusJson) {
        this.props.dispatch(updateDaemonStatus(localDaemonStatusJson))
      }
    }
  }
  updateLocalDelegation = (address) => {
    let localDelegationInfo = getLocal(LOCAL_CACHE_KEYS.DELEGATION_INFO)
    if (localDelegationInfo) {
      let localDelegationInfoJson = this.safeJsonParse(localDelegationInfo)
      let delegationInfoJson = localDelegationInfoJson ? localDelegationInfoJson[address] : ""
      if (delegationInfoJson) {
        this.props.dispatch(updateDelegationInfo(delegationInfoJson))
      }
    }
  }
  updateLocalBlock = () => {
    let localBlockInfo = getLocal(LOCAL_CACHE_KEYS.BLOCK_INFO)
    if (localBlockInfo) {
      let localBlockInfoJson = this.safeJsonParse(localBlockInfo)
      if (localBlockInfoJson) {
        this.props.dispatch(updateBlockInfo(localBlockInfoJson))
      }
    }
  }
  updateLocalValidator = () => {
    let localValidatorDetail = getLocal(LOCAL_CACHE_KEYS.VALIDATOR_DETAIL)
    if (localValidatorDetail) {
      let localValidatorDetailJson = this.safeJsonParse(localValidatorDetail)
      if (localValidatorDetailJson) {
        this.props.dispatch(updateValidatorDetail(localValidatorDetailJson))
      }
    }
  }
  updateLocalStaking = () => {
    let localStakingList = getLocal(LOCAL_CACHE_KEYS.STAKING_LIST)
    if (localStakingList) {
      let localStakingListJson = this.safeJsonParse(localStakingList)
      if (localStakingListJson) {
        this.props.dispatch(updateStakingList({ stakingList: localStakingListJson }))
      }
    }
  }
  /**
   * 获取本地缓存的数据,应该把缓存放到 进入页面之前
  */
  getlocalCache = () => {
    const { netConfig, currentAccount } = this.props
    const netType = netConfig.currentConfig?.netType
    let address = currentAccount?.address || ""
    if (netType !== NET_CONFIG_TYPE.Unknown) {
      this.shouldUpdateTxList(address)
    }
    this.updateLocalAccount(address)
    this.updateLocalPrice()


    this.updateLocalDaemonStatus()
    this.updateLocalDelegation(address)
    this.updateLocalBlock()
    this.updateLocalValidator()
    this.updateLocalStaking()
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
  netConfig: state.network,
});
export default connect(mapStateToProps)(HomePage);
