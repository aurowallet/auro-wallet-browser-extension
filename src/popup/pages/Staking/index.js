import React from "react";
import { buildStyles, CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import goNext from '../../../assets/images/goNext.png';
import loadingCommon from "../../../assets/images/loadingCommon.gif";
import { fetchBlockInfo, fetchDaemonStatus, fetchDelegationInfo, fetchValidatorDetail } from "../../../background/api";
import { getCurrentLang, getLanguage, LANG_SUPPORT_LIST } from '../../../i18n';
import { getStakingList, updateBlockInfo, updateDaemonStatus, updateDelegationInfo, updateValidatorDetail } from "../../../reducers/stakingReducer";
import { openTab } from "../../../utils/commonMsg";
import { addressSlice, copyText, getAmountForUI } from '../../../utils/utils';
import Clock from "../../component/Clock";
import Toast from "../../component/Toast";
import EmptyGuide from "./components/EmptyGuide";
import "./index.scss";

class Staking extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      epoch: 0,
      delegatePublicKey: '',
      loading: false,
      percentage: 0
    }
    this.isUnMounted= false
  }
  componentWillUnmount() {
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
    let { shouldRefresh,account,daemonStatus,block,validatorDetail } = this.props
    if (shouldRefresh) {
      if(daemonStatus.stateHash && block.protocolState){
        this.fetchEpochData(daemonStatus,block)
        this.setDelegationInfo(account,validatorDetail)

        this.fetchLoadingData(true)
      }else{
        this.fetchLoadingData()
      }
    }else{
      this.fetchEpochData(daemonStatus,block)
      this.setDelegationInfo(account,validatorDetail)
    }
  }
  fetchData=()=>{
    Promise.all([
      fetchDaemonStatus(),
      fetchDelegationInfo(this.props.currentAccount.address),
    ]).then(async (data)=>{
      let daemonStatus = data[0].daemonStatus || {}
      let account = data[1].account || {}
      this.props.dispatch(updateDaemonStatus(daemonStatus));
      this.props.dispatch(updateDelegationInfo(account));

      if(daemonStatus.stateHash){
        fetchBlockInfo(daemonStatus.stateHash).then((blockInfo)=>{
          let block = blockInfo.block
          if(block){
            this.props.dispatch(updateBlockInfo(block));
            this.fetchEpochData(daemonStatus,block)
          }
        });
      }

      let isSelf = this.props.currentAccount.address === account.delegate;
      let validatorDetail = null;
      if (!isSelf && account.delegate) {
        await fetchValidatorDetail(account.delegate).then((validatorDetailResp)=>{
          validatorDetail = validatorDetailResp?.validator;
          this.props.dispatch(updateValidatorDetail(validatorDetail));
          this.setDelegationInfo(account,validatorDetail)
        }).catch(()=>{
          this.setDelegationInfo(account, null)
        })
      }
      this.callSetState({
        loading: false
      })
    }).catch((err)=>{
      Toast.info(getLanguage('nodeError'))
      this.callSetState({
        loading: false
      });
    })
    this.props.dispatch(getStakingList());
  }

  fetchLoadingData=async(silent=false)=>{
    if(silent){
      this.fetchData()
    }else{
      this.callSetState({
        loading: true
      },()=>{
        this.fetchData()
      });
    }
  }

  async fetchEpochData(daemonStatus,block) {
    if((daemonStatus&& daemonStatus.consensusConfiguration )
      && (block&&block.protocolState)){
        const slotsPerEpoch = daemonStatus.consensusConfiguration.slotsPerEpoch;
        const slotDuration = daemonStatus.consensusConfiguration.slotDuration;
        const slot = block.protocolState.consensusState.slot;
        const epoch = block.protocolState.consensusState.epoch;
        const lastTime = (slotsPerEpoch - slot) * slotDuration / 1000;
        const days = Math.floor(lastTime / 60 / 60 / 24);
        const leave1 = lastTime % (24 * 3600);
        const hours = Math.floor(leave1 / (3600));
        const leave2 = leave1 % 3600;
        const minutes = Math.floor(leave2 / 60);
        this.callSetState({
          slotsPerEpoch,
          epoch,
          slot,
          days,
          hours,
          minutes,
          percentage: parseInt((100 * slot / slotsPerEpoch).toFixed(0))
        });
    }
  }
  async setDelegationInfo(account,validatorDetail) {
    let isSelf = this.props.currentAccount.address === account.delegate;
    this.callSetState({
      delegatePublicKey: isSelf ? '' : account.delegate,
      validatorDetail
    });
  }
  goStaking = () => {
    this.props.history.push({
      pathname: "/staking_list",
      params: {
        nodeAddress: this.state.delegatePublicKey
      }
    });
  }
  renderLoading = () => {
    return (
      <div className={"home-bottom-loading"}>
        <img className={"loading-img"} src={loadingCommon} />
      </div>
    )
  }
  onClickGuide=()=>{
    const { staking_guide, staking_guide_cn } = this.props.cache
    let lan = getCurrentLang()
    let url = ""
    if(lan === LANG_SUPPORT_LIST.EN){
        url = staking_guide
    }else if(lan === LANG_SUPPORT_LIST.ZH_CN){
        url = staking_guide_cn
    }
    if(url){
        openTab(url)
    }
}
  onCopy=(delegatePublicKey)=>{
    copyText(delegatePublicKey).then(() => {
      Toast.info(getLanguage('copySuccess'))
    })
  }
  renderContent() {
    const { stakingList } = this.props;
    const { validatorDetail, delegatePublicKey } = this.state;
    let nodeName = '';
    if (delegatePublicKey) {
      let delegateNode = stakingList.find(({ nodeAddress }) => nodeAddress === delegatePublicKey);
      if (delegateNode && delegateNode.nodeAddress) {
        nodeName = delegateNode.nodeName || addressSlice(delegateNode.nodeAddress,8);
      }
    }
    return (<div className={'staking-content'}>
      <div className={'module epoch-module'}>
        <div className={'title'}>{getLanguage('epochInfo')}</div>
        <div className={'panel'}>
          <div className={'item itemFirst'}>
            <label>Epoch</label>
            <span className={'value-highlight bold-text'}>{this.state.epoch}</span>
          </div>
          <div className={'item'}>
            <label>Slot</label>
            <span className={'value'}><span className={'highlight bold-text'}>{this.state.slot}</span> / {this.state.slotsPerEpoch}</span>
          </div>
          <div className={'item multi'}>
            <label>{getLanguage('epochEndTime')}</label>
            <div className={'value time-value'}>
              <span>{this.state.days}d</span>
              <span className={'sep'}>:</span>
              <span>{this.state.hours}h</span>
              <span className={'sep'}>:</span>
              <span>{this.state.minutes}m</span>
            </div>
          </div>
          <div className={'circle-con'}>
            <GradientSVG rotation={90} startColor={'#A642FF'} endColor={'#737BE4'} idCSS={'circleGradient'}/>
            <CircularProgressbar styles={buildStyles({
              textSize: '18px'
            })} strokeWidth={10} value={this.state.percentage} text={`${this.state.percentage}%`} />
          </div>
        </div>
      </div>
      <div className={'module'}>
        <div className={'title'}>{getLanguage('delegationInfo')}</div>
        {

          <div className={'panel'}>
            {
              !this.state.loading ? <>
                {
                  !delegatePublicKey ? <EmptyGuide /> :
                    <>
                      <div className={'change-pos'}>
                        <div className={'change-btn  click-cursor'} onClick={this.goStaking}>{getLanguage('changeNode')}</div>
                      </div>
                      {
                        nodeName && <>
                          <div className={'delegation-label first'}>{getLanguage('blockProducerName')}</div>
                          <div className={'delegation-value nodeName'}>{nodeName}</div>
                        </>
                      }
                      <div className={"deletaion-AddressContainer"} onClick={()=>this.onCopy(delegatePublicKey)}>
                        <div className={'delegation-label'}>{getLanguage('blockProducerAddress')}</div>
                        <div className={'delegation-value'}>{addressSlice(delegatePublicKey)}</div>
                      </div>
                      {
                        validatorDetail && <>
                          <div className={'delegation-label'}>{getLanguage('producerTotalStake')}</div>
                          <div className={'delegation-value'}>{getAmountForUI(validatorDetail.stake)}</div>

                          <div className={'delegation-label'}>{getLanguage('producerTotalAccount')}</div>
                          <div className={'delegation-value'}>{validatorDetail.delegations}</div>

                          <div className={'delegation-label'}>{getLanguage('blocksProduced')}</div>
                          <div className={'delegation-value'}>{validatorDetail.blocks_created}</div>
                        </>
                      }
                      <div className={"delegation-help click-cursor"} onClick={this.onClickGuide}>
                        <p className={"delegation-help-text"}>{getLanguage('delegationHelp')}</p>
                      </div>
                    </>
                }
              </> : null
            }
          </div>
        }
      </div>
      {
        !this.state.delegatePublicKey && (<div className={'operate-con'}>
          <div className={'go-staking click-cursor'} onClick={this.goStaking}>
            {getLanguage('goStake')}
            <img className={'double-arrow'} src={goNext} />
          </div>
        </div>)
      }
    </div>)
  }
  render() {

    return (
      <div
        className={'staking-root'}
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <p className={"tab-common-title"}>{getLanguage('staking')}</p>
        {
          this.state.loading ? this.renderLoading() : this.renderContent()
        }
        <Clock schemeEvent={() => { this.fetchLoadingData(true) }} />
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  accountInfo: state.accountInfo,
  currentAccount: state.accountInfo.currentAccount,
  stakingList: state.staking.stakingList,
  shouldRefresh: state.accountInfo.shouldRefresh,
  daemonStatus: state.staking.daemonStatus,
  block: state.staking.block,
  validatorDetail: state.staking.validatorDetail,
  account: state.staking.account,
  cache: state.cache,
});

export default withRouter(
  connect(mapStateToProps)(Staking)
);

class GradientSVG extends React.Component {
  render() {
    let { startColor, endColor, idCSS, rotation } = this.props;

    let gradientTransform = `rotate(${rotation})`;

    return (
      <svg style={{ height: 0 }}>
        <defs>
          <linearGradient id={idCSS} gradientTransform={gradientTransform}>
            <stop offset="0%" stopColor={startColor} />
            <stop offset="100%" stopColor={endColor} />
          </linearGradient>
        </defs>
      </svg>
    );
  }
}