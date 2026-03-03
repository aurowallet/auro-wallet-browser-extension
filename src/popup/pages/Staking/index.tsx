import { MAIN_COIN_CONFIG } from "@/constant";
import { NetworkID_MAP } from "@/constant/network";
import { useDelegationKey } from "@/hooks/useDelegationKey";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import BigNumber from "bignumber.js";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { useNavigate } from "react-router-dom";
import {
  fetchBlockInfo,
  fetchDaemonStatus,
  fetchDelegationInfo,
  fetchStakingAPR,
} from "../../../background/api";
import { LANG_SUPPORT_LIST } from "../../../i18n";
import {
  getStakingList,
  updateBlockInfo,
  updateDaemonStatus,
  updateDelegationKey,
  updateStakingAPR,
} from "../../../reducers/stakingReducer";
import { copyText } from "../../../utils/browserUtils";
import { openTab } from "../../../utils/commonMsg";
import { useLatestRef } from "../../../utils/hooks";
import { addressSlice, getBalanceForUI, isNumber } from "../../../utils/utils";
import Clock from "../../component/Clock";
import CustomView from "../../component/CustomView";
import Toast from "../../component/Toast";
import {
  StyledActionArrow,
  StyledActionLink,
  StyledActionText,
  StyledActiveTitle,
  StyledCircleCon,
  StyledCircleContainer,
  StyledContent,
  StyledContentClassName,
  StyledContentContainer,
  StyledCopy,
  StyledEarnContainer,
  StyledEarnContent,
  StyledEarnHeader,
  StyledEarnLabel,
  StyledEarnRow,
  StyledEarnValue,
  StyledEpochContent,
  StyledHighlightContent,
  StyledInfoIcon,
  StyledLabel,
  StyledLabelContent,
  StyledLoadingContainer,
  StyledLoadingTip,
  StyledPercentage,
  StyledPercentageContainer,
  StyledPercentageUnit,
  StyledRefreshLoading,
  StyledRowIcon,
  StyledRowItem,
  StyledRowTitle,
  StyledRowTitleContainer,
  StyledStakedInfo,
  StyledStakedLabel,
  StyledStakedValue,
  StyledTime,
  StyledTimeUnit,
  StyledTimeValue,
  StyledUnknownContainer,
  StyledUnknownIcon,
  StyledUnknownTip,
  StyledValidatorCard,
  StyledValidatorIconHolder,
  StyledValidatorIconImg,
  StyledValidatorIconWrapper,
  StyledValidatorInfo,
  StyledValidatorName,
} from "./index.styled";

const Staking = () => {
  const mainTokenNetInfo = useAppSelector(
    (state) => state.accountInfo.mainTokenNetInfo,
  );
  const currentAddress = useAppSelector(
    (state) => state.accountInfo.currentAccount.address,
  );
  const block = useAppSelector((state) => state.staking.block);
  const daemonStatus = useAppSelector((state) => state.staking.daemonStatus);
  const networkID = useAppSelector(
    (state) => state.network.currentNode.networkID,
  );
  const dispatch = useAppDispatch();

  const cachedDelegationKey = useDelegationKey();

  const isKnownNetwork = useMemo(() => {
    return networkID?.startsWith("mina");
  }, [networkID]);

  const [delegatePublicKey, setDelegatePublicKey] = useState<string | null>(
    () => {
      return cachedDelegationKey;
    },
  );
  const [loading, setLoading] = useState(false);
  const consensusConfig = daemonStatus?.consensusConfiguration as
    | { slotsPerEpoch?: number }
    | undefined;
  const hasInitialData = isNumber(consensusConfig?.slotsPerEpoch);
  const isFirstRequest = useRef(true);
  const fetchContextRef = useRef({
    address: currentAddress,
    network: networkID,
  });

  useEffect(() => {
    fetchContextRef.current = { address: currentAddress, network: networkID };
    if (cachedDelegationKey === null) {
      setDelegatePublicKey(null);
      isFirstRequest.current = true;
    } else {
      setDelegatePublicKey(cachedDelegationKey);
      isFirstRequest.current = !hasInitialData;
    }
  }, [currentAddress, networkID, cachedDelegationKey, hasInitialData]);

  const closeLoading = useCallback(() => {
    setLoading(false);
    isFirstRequest.current = false;
  }, []);

  const fetchData = useCallback(
    (isSilent = false) => {
      if (isFirstRequest.current && !isSilent) {
        setLoading(true);
      }
      const fetchAddress = currentAddress || "";
      const fetchNetwork = networkID;
      const promises: Promise<unknown>[] = [
        fetchDelegationInfo(fetchAddress),
        fetchDaemonStatus(),
      ];
      if (fetchNetwork === NetworkID_MAP.mainnet) {
        promises.push(fetchStakingAPR());
      }
      Promise.all(promises)
        .then((data) => {
          const isStale =
            fetchContextRef.current.address !== fetchAddress ||
            fetchContextRef.current.network !== fetchNetwork;
          if (isStale) {
            return;
          }
          const account = data[0] as { delegate?: string };
          const delegateKey =
            fetchAddress === account.delegate ? "" : account.delegate || "";
          setDelegatePublicKey(delegateKey);
          dispatch(
            updateDelegationKey(delegateKey, fetchAddress, fetchNetwork),
          );
          if (data[2] !== undefined) {
            dispatch(updateStakingAPR(data[2] as number | null));
          }
          const daemonStatusRes = data[1] as { stateHash?: string };
          if (daemonStatusRes.stateHash) {
            dispatch(updateDaemonStatus(daemonStatusRes));
            fetchBlockInfo(daemonStatusRes.stateHash).then((blockRes) => {
              if (
                fetchContextRef.current.address !== fetchAddress ||
                fetchContextRef.current.network !== fetchNetwork
              ) {
                return;
              }
              const blockData = blockRes as {
                protocolState?: Record<string, unknown>;
              };
              if (blockData.protocolState) {
                dispatch(updateBlockInfo(blockData));
              }
              closeLoading();
            });
          } else {
            closeLoading();
          }
        })
        .catch(() => {
          if (
            fetchContextRef.current.address !== currentAddress ||
            fetchContextRef.current.network !== networkID
          ) {
            return;
          }
          setDelegatePublicKey((prev) => (prev === null ? "" : prev));
          closeLoading();
        });
    },
    [currentAddress, networkID, closeLoading, dispatch],
  );

  const baseFetchData = useCallback(
    (isSilent = false) => {
      fetchData(isSilent);
      dispatch(getStakingList() as unknown as Parameters<typeof dispatch>[0]);
    },
    [fetchData, dispatch],
  );

  const baseFetchDataRef = useLatestRef(baseFetchData);
  const lastFetchKeyRef = useRef("");

  useEffect(() => {
    const fetchKey = `${currentAddress}:${networkID}`;
    if (lastFetchKeyRef.current === fetchKey) {
      return;
    }
    lastFetchKeyRef.current = fetchKey;
    const isCacheHit = cachedDelegationKey !== null;
    baseFetchDataRef.current(hasInitialData && isCacheHit);
  }, [currentAddress, networkID, hasInitialData, cachedDelegationKey]);

  const cache = useAppSelector((state) => state.cache);

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
  }, [cache]);

  return (
    <CustomView
      title={i18n.t("staking")}
      ContentWrapper={StyledContentClassName}
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

const LoadingView = ({ onClickGuide }: { onClickGuide?: () => void }) => {
  return (
    <StyledEarnContainer>
      <EarnHeader onClickGuide={onClickGuide} />
      <StyledLoadingContainer>
        <StyledRefreshLoading src="/img/loading_purple.svg" />
        <StyledLoadingTip>{i18n.t("loading")}...</StyledLoadingTip>
      </StyledLoadingContainer>
    </StyledEarnContainer>
  );
};

const EarnHeader = ({ onClickGuide }: { onClickGuide?: () => void }) => (
  <StyledEarnHeader>
    <StyledRowTitleContainer>
      <StyledRowIcon src="/img/icon_Delegation.svg" />
      <StyledRowTitle>{i18n.t("earnOnMina")}</StyledRowTitle>
    </StyledRowTitleContainer>
    <StyledInfoIcon src="/img/icon_info_staking.svg" onClick={onClickGuide} />
  </StyledEarnHeader>
);

const EmptyView = ({ onClickGuide }: { onClickGuide?: () => void }) => {
  const navigate = useNavigate();
  const mainTokenNetInfo = useAppSelector(
    (state) => state.accountInfo.mainTokenNetInfo,
  );
  const stakingAPR = useAppSelector((state) => state.staking.stakingAPR);
  const stakingList = useAppSelector((state) => state.staking.stakingList);
  const networkID = useAppSelector(
    (state) => state.network.currentNode.networkID,
  );

  const availableBalance = getBalanceForUI(
    mainTokenNetInfo?.tokenBaseInfo?.showBalance || "0",
    0,
    4,
  );

  const onGoStake = useCallback(() => {
    if (networkID === NetworkID_MAP.mainnet) {
      const params: { nodeAddress?: string; nodeName?: string; icon?: string } =
        {};
      const defaultNode = stakingList.active[0];
      if (defaultNode) {
        params.nodeAddress = defaultNode.nodeAddress;
        params.nodeName = defaultNode.nodeName;
        params.icon = defaultNode.icon;
      }
      navigate("/staking_transfer", { state: params });
    } else {
      navigate("/staking_list");
    }
  }, [stakingList, networkID, navigate]);

  return (
    <StyledEarnContainer>
      <EarnHeader onClickGuide={onClickGuide} />
      <StyledEarnContent>
        <StyledEarnRow>
          <StyledEarnLabel>{i18n.t("available")}</StyledEarnLabel>
          <StyledEarnValue>
            {availableBalance} {MAIN_COIN_CONFIG.symbol}
          </StyledEarnValue>
        </StyledEarnRow>
        <StyledEarnRow>
          <StyledEarnLabel>{i18n.t("apr")}</StyledEarnLabel>
          <StyledEarnValue>
            {stakingAPR !== null ? `${stakingAPR}%` : "--"}
          </StyledEarnValue>
        </StyledEarnRow>
        <StyledEarnRow>
          <StyledEarnLabel>{i18n.t("lockTime")}</StyledEarnLabel>
          <StyledEarnValue>{i18n.t("notLocked")}</StyledEarnValue>
        </StyledEarnRow>
      </StyledEarnContent>
      <StyledActionLink $bordered onClick={onGoStake}>
        <StyledActionText>{i18n.t("stake")}</StyledActionText>
        <StyledActionArrow src="/img/icon_arrow_black.svg" />
      </StyledActionLink>
    </StyledEarnContainer>
  );
};

const UnknownNetworkView = ({
  onClickGuide,
}: {
  onClickGuide?: () => void;
}) => {
  return (
    <StyledEarnContainer>
      <EarnHeader onClickGuide={onClickGuide} />
      <StyledUnknownContainer>
        <StyledUnknownIcon src="/img/icon_empty.svg" />
        <StyledUnknownTip>{i18n.t("unknownNetworkStaking")}</StyledUnknownTip>
      </StyledUnknownContainer>
    </StyledEarnContainer>
  );
};

const DelegationInfo = ({
  delegatePublicKey = "",
  onClickGuide = () => {},
}: {
  delegatePublicKey?: string;
  onClickGuide?: () => void;
}) => {
  const navigate = useNavigate();
  const stakingListData = useAppSelector((state) => state.staking.stakingList);
  const stakingAPR = useAppSelector((state) => state.staking.stakingAPR);
  const mainTokenNetInfo = useAppSelector(
    (state) => state.accountInfo.mainTokenNetInfo,
  );

  const onRedelegate = useCallback(() => {
    navigate("/staking_transfer", { state: { isRedelegate: true } });
  }, [navigate]);

  const { nodeName, nodeIcon, stakedBalance } = useMemo(() => {
    let nodeName = addressSlice(delegatePublicKey, 8);
    let nodeIcon: string | null = null;
    const allStakingList = [
      ...(stakingListData.active || []),
      ...(stakingListData.inactive || []),
    ];
    if (delegatePublicKey) {
      const delegateNode = allStakingList.find(
        ({ nodeAddress }: { nodeAddress: string }) =>
          nodeAddress === delegatePublicKey,
      );
      if (delegateNode && delegateNode.nodeAddress) {
        nodeName =
          delegateNode.nodeName || addressSlice(delegateNode.nodeAddress, 8);
        nodeIcon = delegateNode.icon || null;
      }
    }
    const stakedBalance = getBalanceForUI(
      mainTokenNetInfo?.tokenBaseInfo?.showBalance || "0",
      0,
      4,
    );
    return { nodeName, nodeIcon, stakedBalance };
  }, [delegatePublicKey, stakingListData, mainTokenNetInfo]);

  return (
    <StyledEarnContainer>
      <EarnHeader onClickGuide={onClickGuide} />
      <StyledEarnContent>
        <StyledEarnRow>
          <StyledEarnLabel>{i18n.t("available")}</StyledEarnLabel>
          <StyledEarnValue>
            {stakedBalance} {MAIN_COIN_CONFIG.symbol}
          </StyledEarnValue>
        </StyledEarnRow>
        <StyledEarnRow>
          <StyledEarnLabel>{i18n.t("apr")}</StyledEarnLabel>
          <StyledEarnValue>
            {stakingAPR !== null ? `${stakingAPR}%` : "--"}
          </StyledEarnValue>
        </StyledEarnRow>
        <StyledEarnRow>
          <StyledEarnLabel>{i18n.t("lockTime")}</StyledEarnLabel>
          <StyledEarnValue>{i18n.t("notLocked")}</StyledEarnValue>
        </StyledEarnRow>
      </StyledEarnContent>

      <StyledActiveTitle>{i18n.t("active")}</StyledActiveTitle>
      <StyledValidatorCard>
        <StyledValidatorInfo>
          <ValidatorIcon icon={nodeIcon} name={nodeName || ""} />
          <StyledValidatorName>{nodeName}</StyledValidatorName>
        </StyledValidatorInfo>
        <StyledStakedInfo>
          <StyledStakedLabel>{i18n.t("staked")}</StyledStakedLabel>
          <StyledStakedValue>
            {stakedBalance} {MAIN_COIN_CONFIG.symbol}
          </StyledStakedValue>
        </StyledStakedInfo>
      </StyledValidatorCard>

      <StyledActionLink onClick={onRedelegate}>
        <StyledActionText>{i18n.t("redelegate")}</StyledActionText>
        <StyledActionArrow src="/img/icon_arrow_black.svg" />
      </StyledActionLink>
    </StyledEarnContainer>
  );
};

const ValidatorIcon = ({
  icon,
  name,
}: {
  icon: string | null;
  name: string;
}) => {
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
    <StyledValidatorIconWrapper>
      {showHolder ? (
        <StyledValidatorIconHolder>{holderName}</StyledValidatorIconHolder>
      ) : (
        <StyledValidatorIconImg src={icon || ""} onError={onLoadError} />
      )}
    </StyledValidatorIconWrapper>
  );
};

const EpochInfo = () => {
  const daemonStatus = useAppSelector((state) => state.staking.daemonStatus);
  const block = useAppSelector((state) => state.staking.block);

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

  interface EpochData {
    slotsPerEpoch: number | string;
    epoch: number | string;
    slot: number | string;
    days: number | string;
    hours: number | string;
    minutes: number | string;
    percentage: number | string;
  }
  const epochDataAction = useCallback(
    (
      daemonStatus: Record<string, unknown>,
      block: Record<string, unknown>,
    ): EpochData | undefined => {
      const typedConsensusConfig = daemonStatus?.consensusConfiguration as
        | { slotsPerEpoch?: number; slotDuration?: number }
        | undefined;
      const typedProtocolState = block?.protocolState as
        | { consensusState?: { slot?: number; epoch?: number } }
        | undefined;
      if (daemonStatus && typedConsensusConfig && block && typedProtocolState) {
        const slotsPerEpoch = typedConsensusConfig.slotsPerEpoch || 0;
        const slotDuration = typedConsensusConfig.slotDuration || 0;
        const slot = typedProtocolState.consensusState?.slot || 0;
        const epoch = typedProtocolState.consensusState?.epoch || 0;
        const lastTime = ((slotsPerEpoch - slot) * slotDuration) / 1000;
        let days: number | string = Math.floor(lastTime / 60 / 60 / 24);
        days = BigNumber(days).gte(10) ? days : "0" + days;
        const leave1 = lastTime % (24 * 3600);
        let hours: number | string = Math.floor(leave1 / 3600);
        hours = BigNumber(hours).gte(10) ? hours : "0" + hours;
        const leave2 = leave1 % 3600;
        let minutes: number | string = Math.floor(leave2 / 60);
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
      return undefined;
    },
    [],
  );

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
    <div>
      <StyledRowTitleContainer>
        <StyledRowIcon src="/img/icon_Epoch.svg" />
        <StyledRowTitle>{i18n.t("epochInfo")}</StyledRowTitle>
      </StyledRowTitleContainer>
      <StyledEpochContent>
        <div>
          <StyledRowItem>
            <StyledLabel>Epoch</StyledLabel>
            <StyledHighlightContent>{epochData?.epoch}</StyledHighlightContent>
          </StyledRowItem>
          <StyledRowItem $isMargin>
            <StyledLabel>Slot</StyledLabel>
            <StyledHighlightContent>
              {epochData?.slot}{" "}
              <StyledContent>/ {epochData?.slotsPerEpoch}</StyledContent>
            </StyledHighlightContent>
          </StyledRowItem>
          <StyledRowItem $isMargin>
            <StyledLabel>{i18n.t("epochEndTime")}</StyledLabel>
            <StyledTimeValue>
              <StyledTime>
                {epochData?.days}
                <StyledTimeUnit>d</StyledTimeUnit> :{" "}
              </StyledTime>
              <StyledTime>
                {epochData?.hours}
                <StyledTimeUnit>h</StyledTimeUnit> :{" "}
              </StyledTime>
              <StyledTime>
                {epochData?.minutes}
                <StyledTimeUnit>m</StyledTimeUnit>
              </StyledTime>
            </StyledTimeValue>
          </StyledRowItem>
        </div>
        <StyledCircleContainer>
          <StyledCircleCon>
            <GradientSVG
              rotation={90}
              startColor={"#FF7870"}
              endColor={"#594AF1"}
              idCSS={"circleGradient"}
            />
            <CircularProgressbar
              strokeWidth={10}
              value={epochData?.percentage as number}
            />
            <StyledPercentageContainer>
              <StyledPercentage>
                {epochData?.percentage}
                <StyledPercentageUnit> %</StyledPercentageUnit>
              </StyledPercentage>
            </StyledPercentageContainer>
          </StyledCircleCon>
        </StyledCircleContainer>
      </StyledEpochContent>
    </div>
  );
};

export default Staking;

interface GradientSVGProps {
  startColor: string;
  endColor: string;
  idCSS: string;
  rotation: number;
}

const GradientSVG = ({
  startColor,
  endColor,
  idCSS,
  rotation,
}: GradientSVGProps) => {
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

const RowItem = ({
  title = "",
  content = "",
  isMargin = false,
  copyContent = "",
}) => {
  const canCopy = useMemo(() => {
    return !!copyContent;
  }, [copyContent]);

  const onCopy = useCallback(() => {
    if (canCopy) {
      copyText(copyContent).then(() => {
        Toast.info(i18n.t("copySuccess"));
      });
    }
  }, [canCopy, copyContent, i18n]);

  return (
    <StyledRowItem $isMargin={isMargin}>
      <StyledLabel>{title}</StyledLabel>
      <StyledContentContainer onClick={onCopy} $canCopy={canCopy}>
        <StyledLabelContent>{content}</StyledLabelContent>
        {canCopy && <StyledCopy src="/img/icon_copy_purple.svg" />}
      </StyledContentContainer>
    </StyledRowItem>
  );
};
