
import BigNumber from "bignumber.js";
import cls from "classnames";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Trans } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from 'react-router-dom';
import { fetchBlockInfo, fetchDaemonStatus, fetchDelegationInfo } from "../../../background/api";
import { LANG_SUPPORT_LIST } from "../../../i18n";
import { getStakingList, updateBlockInfo, updateDaemonStatus, updateDelegationKey } from "../../../reducers/stakingReducer";
import { openTab } from "../../../utils/commonMsg";
import { addressSlice, copyText, isNumber } from "../../../utils/utils";
import Button, { button_size } from "../../component/Button";
import Clock from "../../component/Clock";
import CustomView from "../../component/CustomView";
import Toast from "../../component/Toast";
import styles from './index.module.scss';
import { MAIN_COIN_CONFIG } from "@/constant";

const Staking = ({ }) => {

  const mainTokenNetInfo = useSelector(state => state.accountInfo.mainTokenNetInfo)
  const currentAddress = useSelector(state => state.accountInfo.currentAccount.address)
  const block = useSelector(state => state.staking.block)
  const daemonStatus = useSelector(state => state.staking.daemonStatus)
  const dispatch = useDispatch()

  const [delegatePublicKey, setDelegatePublicKey] = useState(currentAddress === mainTokenNetInfo?.delegateAccount?.publicKey ? "" : mainTokenNetInfo?.delegateAccount?.publicKey)
  const [loading, setLoading] = useState(false)
  const isFirstRequest = useRef(!isNumber(daemonStatus?.consensusConfiguration?.slotsPerEpoch));

  const closeLoading = useCallback(()=>{
    setLoading(false)
    isFirstRequest.current = false
  },[])
  const fetchData = useCallback((isSilent = false) => {
    if (isFirstRequest.current && !isSilent) {
      setLoading(true)
    }
    Promise.all([fetchDelegationInfo(currentAddress),fetchDaemonStatus()]).then((data)=>{
      let account = data[0]
      let delegateKey = currentAddress === account.delegate ? "" : account.delegate;
      setDelegatePublicKey(delegateKey)
      dispatch(updateDelegationKey(delegateKey));
      let daemonStatus = data[1]
      if (daemonStatus.stateHash) {
        dispatch(updateDaemonStatus(daemonStatus));
        fetchBlockInfo(daemonStatus.stateHash).then((block) => {
          if (block.protocolState) {
            dispatch(updateBlockInfo(block));
          }
          closeLoading()
        })
      }else{
        closeLoading()
      }
    }).catch(()=>{
      closeLoading()
    })
  }, [currentAddress,block.protocolState])


  const baseFetchData = useCallback((isSilent = false) => {
    fetchData(isSilent)
    dispatch(getStakingList())
  }, [])


  useEffect(() => {
    baseFetchData(false)
  }, [])

  const cache = useSelector(state => state.cache)
  const history = useHistory()

  const onClickGuide = useCallback(() => {
    const { staking_guide, staking_guide_cn } = cache
    let lan = i18n.language
    let url = ""
    if (lan === LANG_SUPPORT_LIST.zh_CN) {
      url = staking_guide_cn
    } else {
      url = staking_guide
    }
    if (url) {
      openTab(url)
    }
  }, [cache, i18n])



  return (<CustomView
    title={i18n.t('staking')}
    customTitleClass={styles.customTitleClass}
    contentClassName={styles.contentClassName}>
    <EpochInfo />
    {
        loading ? <LoadingView onClickGuide={onClickGuide} /> : (delegatePublicKey ? <DelegationInfo delegatePublicKey={delegatePublicKey} onClickGuide={onClickGuide}/> : <EmptyView onClickGuide={onClickGuide} />)
    }
    <Clock schemeEvent={() => baseFetchData(true)} />
  </CustomView>)
}

const LoadingView = ({
  onClickGuide
}) => {
  return (<div className={styles.delegationContainer}>
    <div className={styles.delegationRow}>
      <div className={styles.rowTitleContainer}>
        <img className={styles.rowIcon} src="/img/icon_Delegation.svg" />
        <p className={styles.rowTitle}>{i18n.t('delegationInfo')}</p>
      </div>
      <p className={styles.rowHelp} onClick={onClickGuide}>{i18n.t("stakingGuide")}</p>
    </div>
    <div className={styles.loadingContainer}>
      <img className={styles.refreshLoading} src="/img/loading_purple.svg" />
      <p className={styles.loadingTip}>{i18n.t('loading')}...</p>
    </div>
  </div>)
}

const EmptyView = ({
  onClickGuide
}) => {

  const history = useHistory()
  const onChangeNode = useCallback(() => {
    history.push({
      pathname: "staking_list",
    })
  }, [])

  return (<div className={styles.emptyContainer}>
    <p className={styles.emptyTitle}>{i18n.t('emptyDelegateTitle')}</p>
    <div className={styles.emptyContent}>
      <p className={styles.emptyTip}>{i18n.t("emptyDelegateDesc_1")}</p>
      <Trans
        i18nKey={"emptyDelegateDesc_2"}
        components={{ click: <span className={styles.emptyGuide} onClick={onClickGuide} /> }}
      />
    </div>
    <div className={styles.btnContainer}>
      <Button
        size={button_size.small}
        onClick={onChangeNode}>
        {i18n.t('goStake')}
      </Button>
    </div>
  </div>)
}


const DelegationInfo = ({ 
  delegatePublicKey = "",
  onClickGuide=()=>{}
}) => {

  const history = useHistory()
  const stakingList = useSelector(state => state.staking.stakingList)
  const mainTokenNetInfo = useSelector(state => state.accountInfo.mainTokenNetInfo)

  const onChangeNode = useCallback(() => {
    history.push({
      pathname: "staking_list",
      params: {
        nodeAddress: delegatePublicKey
      }
    })
  }, [delegatePublicKey])

  const {
    showNodeAddress, nodeName,stakedBalance
  } = useMemo(() => {
    let showNodeAddress = addressSlice(delegatePublicKey)
    
    let nodeName = showNodeAddress
    if (delegatePublicKey) {
      let delegateNode = stakingList.find(({ nodeAddress }) => nodeAddress === delegatePublicKey);
      if (delegateNode && delegateNode.nodeAddress) {
        nodeName = delegateNode.nodeName || addressSlice(delegateNode.nodeAddress, 8);
      }
    }
    let stakedBalance = mainTokenNetInfo?.tokenBaseInfo?.showBalance || "0.00"
    stakedBalance = stakedBalance + " "+ MAIN_COIN_CONFIG.symbol
    return {
      showNodeAddress, nodeName,stakedBalance
    }
  }, [delegatePublicKey, stakingList,mainTokenNetInfo])
 
  return (<div className={styles.delegationContainer}>
    <div className={styles.delegationRow}>
      <div className={styles.rowTitleContainer}>
        <img className={styles.rowIcon} src="/img/icon_Delegation.svg" />
        <p className={styles.rowTitle}>{i18n.t('delegationInfo')}</p>
      </div>
      <p className={styles.rowHelp} onClick={onClickGuide}>{i18n.t("stakingGuide")}</p>
    </div>

    <div className={styles.delegationContent}>
      <div className={styles.rowLeft}>
        <RowItem title={i18n.t('blockProducerName')} content={nodeName} />
        <RowItem title={i18n.t('blockProducerAddress')} content={showNodeAddress} copyContent={delegatePublicKey} isMargin={true}/>
        <RowItem title={i18n.t('stakedBalance')} content={stakedBalance} isMargin={true} />
      </div>
      <div className={styles.rowRight}>
        <Button
          size={button_size.small}
          onClick={onChangeNode}>
          {i18n.t('change')}
        </Button>
      </div>

    </div>
  </div>)
}

const EpochInfo = ({ }) => {
  const dispatch = useDispatch()
  const daemonStatus = useSelector(state => state.staking.daemonStatus)
  const block = useSelector(state => state.staking.block)

  const initEpochData = useMemo(() => {
    return {
      slotsPerEpoch: "-",
      epoch: "-",
      slot: "-",
      days: "-",
      hours: "-",
      minutes: "-",
      percentage: "-"
    }
  }, [])

  const epochDataAction = useCallback((daemonStatus, block) => {
    if ((daemonStatus && daemonStatus.consensusConfiguration)
      && (block && block.protocolState)) {
      const slotsPerEpoch = daemonStatus.consensusConfiguration.slotsPerEpoch;
      const slotDuration = daemonStatus.consensusConfiguration.slotDuration;
      const slot = block.protocolState.consensusState.slot;
      const epoch = block.protocolState.consensusState.epoch;
      const lastTime = (slotsPerEpoch - slot) * slotDuration / 1000;
      let days = Math.floor(lastTime / 60 / 60 / 24);
      days = BigNumber(days).gte(10) ? days : "0"+days
      const leave1 = lastTime % (24 * 3600);
      let hours = Math.floor(leave1 / (3600));
      hours = BigNumber(hours).gte(10) ? hours : "0"+hours
      const leave2 = leave1 % 3600;
      let minutes = Math.floor(leave2 / 60);
      minutes = BigNumber(minutes).gte(10) ? minutes : "0"+minutes
      let epochData = {
        slotsPerEpoch,
        epoch,
        slot,
        days,
        hours,
        minutes,
        percentage: parseInt((100 * slot / slotsPerEpoch).toFixed(0))
      }
      return epochData
    }
  }, [])

  const [epochData, setEpochData] = useState(() => {
    if (daemonStatus.stateHash && block.protocolState) {
      return epochDataAction(daemonStatus, block)
    } else {
      return initEpochData
    }
  })
  useEffect(() => {
    if(daemonStatus.stateHash && block.protocolState){
      let epochData = epochDataAction(daemonStatus, block)
      setEpochData(epochData)
    }
  }, [daemonStatus, block])


  return (<div className={styles.epochContainer}>
    <div className={styles.rowTitleContainer}>
      <img className={styles.rowIcon} src="/img/icon_Epoch.svg" />
      <p className={styles.rowTitle}>{i18n.t('epochInfo')}</p>
    </div>

    <div className={styles.epochContent}>
      <div className={styles.leftEpochContent}>
        <div className={styles.rowItem}>
          <p className={styles.label}>Epoch</p>
          <span className={styles.highlightContent}>{epochData.epoch}</span>
        </div>

        <div className={cls(styles.rowItem, styles.mgtM10)}>
          <p className={styles.label}>Slot</p>
          <span className={styles.highlightContent}>{epochData.slot} <span className={styles.content}>/ {epochData.slotsPerEpoch}</span></span>
        </div>

        <div className={cls(styles.rowItem, styles.mgtM10)}>
          <p className={styles.label}>{i18n.t('epochEndTime')}</p>
          <div className={styles.timeValue}>
            <p className={styles.time}>{epochData.days}<span className={styles.timeUnit}>d</span> : </p>
            <p className={styles.time}>{epochData.hours}<span className={styles.timeUnit}>h</span> : </p>
            <p className={styles.time}>{epochData.minutes}<span className={styles.timeUnit}>m</span></p>
          </div>
        </div>
      </div>
      <div className={styles.circleContainer}>
        <div className={styles.circleCon}>
          <GradientSVG
            rotation={90}
            startColor={'#FF7870'}
            endColor={'#594AF1'}
            idCSS={'circleGradient'} />
          <CircularProgressbar strokeWidth={10} value={epochData.percentage} />
          <div className={styles.percentageContainer}>
            <span className={styles.percentage}>{epochData.percentage}<span className={styles.percentageUnit}> %</span></span>
          </div>
        </div>
      </div>
    </div>
  </div>)
}

export default Staking

const GradientSVG = ({ startColor, endColor, idCSS, rotation }) => {
  const gradientTransform = useMemo(() => {
    return `rotate(${rotation})`;
  }, [rotation])
  return (
    <svg style={{ height: "0px" }}>
      <defs>
        <linearGradient id={idCSS} gradientTransform={gradientTransform}>
          <stop offset="0%" stopColor={startColor} />
          <stop offset="100%" stopColor={endColor} />
        </linearGradient>
      </defs>
    </svg>
  )
}

const RowItem = ({
  title = "",
  content = "",
  isMargin = false,
  copyContent=""
}) => {
  const canCopy = useMemo(()=>{
    return !!copyContent
  },[copyContent])
  const onCopy = useCallback(() => {
    if (canCopy) {
      copyText(copyContent).then(() => {
        Toast.info(i18n.t('copySuccess'))
      })
    }
  }, [canCopy, copyContent,i18n])
  return (<div className={cls(styles.rowItem, {
    [styles.mgtM10]: isMargin
  })}>
    <p className={styles.label}>{title}</p>
    <div onClick={onCopy} className={cls(styles.contentContainer, {
      [styles.canCopy]: canCopy
    })}>
      <span className={styles.labelContent}>{content}</span>
      {canCopy && <img className={styles.copy} src="/img/icon_copy_purple.svg" />}
    </div>
  </div>)
}