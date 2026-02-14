import BigNumber from "bignumber.js";
import cls from "classnames";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLatestRef } from "../../../utils/hooks";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import {
  fetchBlockInfo,
  fetchDaemonStatus,
  fetchDelegationInfo,
  fetchStakingAPY,
} from "../../../background/api";
import { LANG_SUPPORT_LIST } from "../../../i18n";
import {
  getStakingList,
  updateBlockInfo,
  updateDaemonStatus,
  updateDelegationKey,
  updateStakingAPY,
} from "../../../reducers/stakingReducer";
import { openTab } from "../../../utils/commonMsg";
import { addressSlice, getBalanceForUI, isNumber } from "../../../utils/utils";
import Clock from "../../component/Clock";
import CustomView from "../../component/CustomView";
import styles from "./index.module.scss";
import { MAIN_COIN_CONFIG } from "@/constant";
import { NetworkID_MAP } from "@/constant/network";

const Staking = ({}) => {
  const mainTokenNetInfo = useSelector(
    (state) => state.accountInfo.mainTokenNetInfo,
  );
  const currentAddress = useSelector(
    (state) => state.accountInfo.currentAccount.address,
  );
  const block = useSelector((state) => state.staking.block);
  const daemonStatus = useSelector((state) => state.staking.daemonStatus);
  const networkID = useSelector((state) => state.network.currentNode.networkID);
  const dispatch = useDispatch();

  const isKnownNetwork = useMemo(() => {
    return networkID?.startsWith("mina");
  }, [networkID]);

  const [delegatePublicKey, setDelegatePublicKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const isFirstRequest = useRef(
    !isNumber(daemonStatus?.consensusConfiguration?.slotsPerEpoch),
  );

  const closeLoading = useCallback(() => {
    setLoading(false);
    isFirstRequest.current = false;
  }, []);
  const fetchData = useCallback(
    (isSilent = false) => {
      if (isFirstRequest.current && !isSilent) {
        setLoading(true);
      }
      const promises = [fetchDelegationInfo(currentAddress), fetchDaemonStatus()];
      if (networkID === NetworkID_MAP.mainnet) {
        promises.push(fetchStakingAPY());
      }
      Promise.all(promises)
        .then((data) => {
          let account = data[0];
          let delegateKey =
            currentAddress === account.delegate ? "" : account.delegate;
          console.log('[Staking:fetchData] currentAddress:', currentAddress);
          console.log('[Staking:fetchData] account.delegate:', account.delegate);
          console.log('[Staking:fetchData] resolved delegateKey:', delegateKey);
          setDelegatePublicKey(delegateKey);
          dispatch(updateDelegationKey(delegateKey));
          let daemonStatus = data[1];
          if (data[2] !== undefined) {
            dispatch(updateStakingAPY(data[2]));
          }
          if (daemonStatus.stateHash) {
            dispatch(updateDaemonStatus(daemonStatus));
            fetchBlockInfo(daemonStatus.stateHash).then((block) => {
              if (block.protocolState) {
                dispatch(updateBlockInfo(block));
              }
              closeLoading();
            });
          } else {
            closeLoading();
          }
        })
        .catch(() => {
          setDelegatePublicKey((prev) => (prev === null ? "" : prev));
          closeLoading();
        });
    },
    [currentAddress, networkID, closeLoading, dispatch],
  );

  const baseFetchData = useCallback((isSilent = false) => {
    fetchData(isSilent);
    dispatch(getStakingList());
  }, [fetchData]);

  const baseFetchDataRef = useLatestRef(baseFetchData);

  useEffect(() => {
    baseFetchData(false);
  }, []);

  const cache = useSelector((state) => state.cache);
  const history = useHistory();

  const onClickGuide = useCallback(() => {
    const { staking_guide, staking_guide_cn } = cache;
    let lan = i18n.language;
    let url = "";
    if (lan === LANG_SUPPORT_LIST.zh_CN) {
      url = staking_guide_cn;
    } else {
      url = staking_guide;
    }
    if (url) {
      openTab(url);
    }
  }, [cache, i18n]);

  return (
    <CustomView
      title={i18n.t("staking")}
      customTitleClass={styles.customTitleClass}
      contentClassName={styles.contentClassName}
    >
      <EpochInfo />
      {isKnownNetwork ? (
        loading || delegatePublicKey === null ? (
          <LoadingView onClickGuide={onClickGuide} />
        ) : delegatePublicKey ? (
          <DelegationInfo
            delegatePublicKey={delegatePublicKey}
            onClickGuide={onClickGuide}
          />
        ) : (
          <EmptyView onClickGuide={onClickGuide} />
        )
      ) : (
        <UnknownNetworkView onClickGuide={onClickGuide} />
      )}
      <Clock schemeEvent={() => baseFetchDataRef.current(true)} />
    </CustomView>
  );
};


const EarnHeader = ({ onClickGuide }) => (
  <div className={styles.earnHeader}>
    <div className={styles.rowTitleContainer}>
      <img className={styles.rowIcon} src="/img/icon_Delegation.svg" />
      <p className={styles.rowTitle}>{i18n.t("earnOnMina")}</p>
    </div>
    <img
      className={styles.infoIcon}
      src="/img/icon_info_staking.svg"
      onClick={onClickGuide}
    />
  </div>
);

const LoadingView = ({ onClickGuide }) => {
  return (
    <div className={cls(styles.earnContainer, styles.loadingEarnContainer)}>
      <EarnHeader onClickGuide={onClickGuide} />
      <div className={styles.loadingContainer}>
        <img className={styles.refreshLoading} src="/img/loading_purple.svg" />
        <p className={styles.loadingTip}>{i18n.t("loading")}...</p>
      </div>
    </div>
  );
};

const EmptyView = ({ onClickGuide }) => {
  const history = useHistory();
  const mainTokenNetInfo = useSelector(
    (state) => state.accountInfo.mainTokenNetInfo,
  );
  const stakingAPY = useSelector((state) => state.staking.stakingAPY);
  const stakingList = useSelector((state) => state.staking.stakingList);
  const networkID = useSelector((state) => state.network.currentNode.networkID);
  const availableBalance = getBalanceForUI(
    mainTokenNetInfo?.tokenBaseInfo?.showBalance || "0", 0, 4
  );

  const onGoStake = useCallback(() => {
    if (networkID === NetworkID_MAP.mainnet) {
      const params = {};
      const defaultNode = stakingList.active[0];
      if (defaultNode) {
        params.nodeAddress = defaultNode.nodeAddress;
        params.nodeName = defaultNode.nodeName;
        params.icon = defaultNode.icon;
      }
      history.push({
        pathname: "/staking_transfer",
        params,
      });
    } else {
      history.push({
        pathname: "/staking_list",
      });
    }
  }, [stakingList, networkID]);

  return (
    <div className={styles.earnContainer}>
      <EarnHeader onClickGuide={onClickGuide} />
      <div className={styles.earnContent}>
        <div className={styles.earnRow}>
          <span className={styles.earnLabel}>{i18n.t("available")}</span>
          <span className={styles.earnValue}>
            {availableBalance} {MAIN_COIN_CONFIG.symbol}
          </span>
        </div>
        <div className={styles.earnRow}>
          <span className={styles.earnLabel}>{i18n.t("apr")}</span>
          <span className={styles.earnValue}>
            {stakingAPY !== null ? `${stakingAPY}%` : "--"}
          </span>
        </div>
        <div className={styles.earnRow}>
          <span className={styles.earnLabel}>{i18n.t("lockTime")}</span>
          <span className={styles.earnValue}>{i18n.t("notLocked")}</span>
        </div>
      </div>
      <div className={cls(styles.actionLink, styles.actionLinkBordered)} onClick={onGoStake}>
        <span className={styles.actionText}>{i18n.t("stake")}</span>
        <img className={styles.actionArrow} src="/img/icon_arrow.svg" />
      </div>
    </div>
  );
};

const DelegationInfo = ({
  delegatePublicKey = "",
  onClickGuide = () => {},
}) => {
  const history = useHistory();
  const stakingList = useSelector((state) => state.staking.stakingList);
  const stakingAPY = useSelector((state) => state.staking.stakingAPY);
  const mainTokenNetInfo = useSelector(
    (state) => state.accountInfo.mainTokenNetInfo,
  );

  const onRedelegate = useCallback(() => {
    history.push({
      pathname: "/staking_transfer",
      params: {
        isRedelegate: true,
      },
    });
  }, []);

  const { nodeName, nodeIcon, stakedBalance } =
    useMemo(() => {
      let nodeName = addressSlice(delegatePublicKey, 8);
      let nodeIcon = null;
      if (delegatePublicKey) {
        let delegateNode = stakingList.active.find(
          ({ nodeAddress }) => nodeAddress === delegatePublicKey,
        ) || stakingList.inactive.find(
          ({ nodeAddress }) => nodeAddress === delegatePublicKey,
        );
        if (delegateNode && delegateNode.nodeAddress) {
          nodeName =
            delegateNode.nodeName || addressSlice(delegateNode.nodeAddress, 8);
          nodeIcon = delegateNode.icon;
        }
      }
      let stakedBalance = getBalanceForUI(
        mainTokenNetInfo?.tokenBaseInfo?.showBalance || "0", 0, 4
      );
      return {
        nodeName,
        nodeIcon,
        stakedBalance,
      };
    }, [delegatePublicKey, stakingList, mainTokenNetInfo]);

  return (
    <div className={styles.earnContainer}>
      <EarnHeader onClickGuide={onClickGuide} />
      <div className={styles.earnContent}>
        <div className={styles.earnRow}>
          <span className={styles.earnLabel}>{i18n.t("available")}</span>
          <span className={styles.earnValue}>
            {stakedBalance} {MAIN_COIN_CONFIG.symbol}
          </span>
        </div>
        <div className={styles.earnRow}>
          <span className={styles.earnLabel}>{i18n.t("apr")}</span>
          <span className={styles.earnValue}>
            {stakingAPY !== null ? `${stakingAPY}%` : "--"}
          </span>
        </div>
        <div className={styles.earnRow}>
          <span className={styles.earnLabel}>{i18n.t("lockTime")}</span>
          <span className={styles.earnValue}>{i18n.t("notLocked")}</span>
        </div>
      </div>

      <p className={styles.activeTitle}>{i18n.t("active")}</p>
      <div className={styles.validatorCard}>
        <div className={styles.validatorInfo}>
          <ValidatorIcon icon={nodeIcon} name={nodeName} />
          <span className={styles.validatorName}>{nodeName}</span>
        </div>
        <div className={styles.stakedInfo}>
          <span className={styles.stakedLabel}>{i18n.t("staked")}</span>
          <span className={styles.stakedValue}>
            {stakedBalance} {MAIN_COIN_CONFIG.symbol}
          </span>
        </div>
      </div>

      <div className={styles.actionLink} onClick={onRedelegate}>
        <span className={styles.actionText}>{i18n.t("redelegate")}</span>
        <img className={styles.actionArrow} src="/img/icon_arrow.svg" />
      </div>
    </div>
  );
};

const ValidatorIcon = ({ icon, name }) => {
  const [showHolder, setShowHolder] = useState(!icon);
  const holderName = useMemo(() => {
    return (name?.slice(0, 1) || "").toUpperCase();
  }, [name]);

  useEffect(() => {
    if (icon) setShowHolder(false);
  }, [icon]);

  const onLoadError = useCallback(() => {
    setShowHolder(true);
  }, []);

  return (
    <div className={styles.validatorIconWrapper}>
      {showHolder ? (
        <div className={styles.validatorIconHolder}>{holderName}</div>
      ) : (
        <img
          src={icon}
          className={styles.validatorIconImg}
          onError={onLoadError}
        />
      )}
    </div>
  );
};

const UnknownNetworkView = ({ onClickGuide }) => {
  return (
    <div className={cls(styles.earnContainer, styles.unknownEarnContainer)}>
      <EarnHeader onClickGuide={onClickGuide} />
      <div className={styles.unknownContainer}>
        <img className={styles.unknownIcon} src="/img/icon_empty.svg" />
        <p className={styles.unknownTip}>{i18n.t("unknownNetworkStaking")}</p>
      </div>
    </div>
  );
};

const EpochInfo = ({}) => {
  const dispatch = useDispatch();
  const daemonStatus = useSelector((state) => state.staking.daemonStatus);
  const block = useSelector((state) => state.staking.block);

  const initEpochData = useMemo(() => {
    return {
      slotsPerEpoch: "-",
      epoch: "-",
      slot: "-",
      days: "-",
      hours: "-",
      minutes: "-",
      percentage: "-",
    };
  }, []);

  const epochDataAction = useCallback((daemonStatus, block) => {
    if (
      daemonStatus &&
      daemonStatus.consensusConfiguration &&
      block &&
      block.protocolState
    ) {
      const slotsPerEpoch = daemonStatus.consensusConfiguration.slotsPerEpoch;
      const slotDuration = daemonStatus.consensusConfiguration.slotDuration;
      const slot = block.protocolState.consensusState.slot;
      const epoch = block.protocolState.consensusState.epoch;
      const lastTime = ((slotsPerEpoch - slot) * slotDuration) / 1000;
      let days = Math.floor(lastTime / 60 / 60 / 24);
      days = BigNumber(days).gte(10) ? days : "0" + days;
      const leave1 = lastTime % (24 * 3600);
      let hours = Math.floor(leave1 / 3600);
      hours = BigNumber(hours).gte(10) ? hours : "0" + hours;
      const leave2 = leave1 % 3600;
      let minutes = Math.floor(leave2 / 60);
      minutes = BigNumber(minutes).gte(10) ? minutes : "0" + minutes;
      let epochData = {
        slotsPerEpoch,
        epoch,
        slot,
        days,
        hours,
        minutes,
        percentage: parseInt(((100 * slot) / slotsPerEpoch).toFixed(0)),
      };
      return epochData;
    }
  }, []);

  const [epochData, setEpochData] = useState(() => {
    if (daemonStatus.stateHash && block.protocolState) {
      return epochDataAction(daemonStatus, block);
    } else {
      return initEpochData;
    }
  });
  useEffect(() => {
    if (daemonStatus.stateHash && block.protocolState) {
      let epochData = epochDataAction(daemonStatus, block);
      setEpochData(epochData);
    }
  }, [daemonStatus, block]);

  return (
    <div className={styles.epochContainer}>
      <div className={styles.rowTitleContainer}>
        <img className={styles.rowIcon} src="/img/icon_Epoch.svg" />
        <p className={styles.rowTitle}>{i18n.t("currentEpoch")}</p>
      </div>

      <div className={styles.epochContent}>
        <div className={styles.leftEpochContent}>
          <div className={styles.rowItem}>
            <p className={styles.label}>Epoch</p>
            <span className={styles.highlightContent}>{epochData.epoch}</span>
          </div>

          <div className={cls(styles.rowItem, styles.mgtM10)}>
            <p className={styles.label}>Slot</p>
            <span className={styles.highlightContent}>
              {epochData.slot}{" "}
              <span className={styles.content}>
                / {epochData.slotsPerEpoch}
              </span>
            </span>
          </div>

          <div className={cls(styles.rowItem, styles.mgtM10)}>
            <p className={styles.label}>{i18n.t("epochEndTime")}</p>
            <div className={styles.timeValue}>
              <p className={styles.time}>
                {epochData.days}
                <span className={styles.timeUnit}>d</span> :{" "}
              </p>
              <p className={styles.time}>
                {epochData.hours}
                <span className={styles.timeUnit}>h</span> :{" "}
              </p>
              <p className={styles.time}>
                {epochData.minutes}
                <span className={styles.timeUnit}>m</span>
              </p>
            </div>
          </div>
        </div>
        <div className={styles.circleContainer}>
          <div className={styles.circleCon}>
            <GradientSVG
              rotation={90}
              startColor={"#FF7870"}
              endColor={"#594AF1"}
              idCSS={"circleGradient"}
            />
            <CircularProgressbar
              strokeWidth={10}
              value={epochData.percentage}
            />
            <div className={styles.percentageContainer}>
              <span className={styles.percentage}>
                {epochData.percentage}
                <span className={styles.percentageUnit}> %</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Staking;

const GradientSVG = ({ startColor, endColor, idCSS, rotation }) => {
  const gradientTransform = useMemo(() => {
    return `rotate(${rotation})`;
  }, [rotation]);
  return (
    <svg style={{ height: "0px" }}>
      <defs>
        <linearGradient id={idCSS} gradientTransform={gradientTransform}>
          <stop offset="0%" stopColor={startColor} />
          <stop offset="100%" stopColor={endColor} />
        </linearGradient>
      </defs>
    </svg>
  );
};
