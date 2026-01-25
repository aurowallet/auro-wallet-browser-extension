import BigNumber from "bignumber.js";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Trans } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import { useNavigate } from "react-router-dom";
import { fetchBlockInfo, fetchDaemonStatus, fetchDelegationInfo } from "../../../background/api";
import { LANG_SUPPORT_LIST } from "../../../i18n";
import { getStakingList, updateBlockInfo, updateDaemonStatus, updateDelegationKey } from "../../../reducers/stakingReducer";
import { openTab } from "../../../utils/commonMsg";
import { addressSlice, isNumber } from "../../../utils/utils";
import { copyText } from "../../../utils/browserUtils";
import Button, { button_size } from "../../component/Button";
import Clock from "../../component/Clock";
import CustomView from "../../component/CustomView";
import Toast from "../../component/Toast";
import { MAIN_COIN_CONFIG } from "@/constant";
import {
  StyledContentClassName,
  StyledRowTitleContainer,
  StyledRowIcon,
  StyledRowTitle,
  StyledEpochContent,
  StyledHighlightContent,
  StyledContent,
  StyledTimeValue,
  StyledTime,
  StyledTimeUnit,
  StyledCircleContainer,
  StyledCircleCon,
  StyledPercentageContainer,
  StyledPercentage,
  StyledPercentageUnit,
  StyledDelegationContainer,
  StyledDelegationRow,
  StyledRowHelp,
  StyledDelegationContent,
  StyledRowRight,
  StyledRowItem,
  StyledLabelContent,
  StyledContentContainer,
  StyledCopy,
  StyledEmptyContainer,
  StyledEmptyTitle,
  StyledEmptyTip,
  StyledEmptyContent,
  StyledEmptyGuide,
  StyledBtnContainer,
  StyledLoadingContainer,
  StyledRefreshLoading,
  StyledLoadingTip,
  StyledLabel,
} from "./index.styled";

const Staking = () => {
  const mainTokenNetInfo = useAppSelector((state) => state.accountInfo.mainTokenNetInfo)
  const currentAddress = useAppSelector((state) => state.accountInfo.currentAccount.address)
  const block = useAppSelector((state) => state.staking.block)
  const daemonStatus = useAppSelector((state) => state.staking.daemonStatus)
  const dispatch = useAppDispatch()

  const [delegatePublicKey, setDelegatePublicKey] = useState(currentAddress === mainTokenNetInfo?.delegateAccount?.publicKey ? "" : mainTokenNetInfo?.delegateAccount?.publicKey)
  const [loading, setLoading] = useState(false)
  const consensusConfig = daemonStatus?.consensusConfiguration as { slotsPerEpoch?: number } | undefined;
  const isFirstRequest = useRef(!isNumber(consensusConfig?.slotsPerEpoch));

  const closeLoading = useCallback(()=>{
    setLoading(false)
    isFirstRequest.current = false
  },[])
  const fetchData = useCallback((isSilent = false) => {
    if (isFirstRequest.current && !isSilent) {
      setLoading(true)
    }
    Promise.all([fetchDelegationInfo(currentAddress || ""),fetchDaemonStatus()]).then((data)=>{
      let account = data[0] as { delegate?: string };
      let delegateKey = currentAddress === account.delegate ? "" : account.delegate || "";
      setDelegatePublicKey(delegateKey)
      dispatch(updateDelegationKey(delegateKey));
      let daemonStatusRes = data[1] as { stateHash?: string };
      if (daemonStatusRes.stateHash) {
        dispatch(updateDaemonStatus(daemonStatusRes));
        fetchBlockInfo(daemonStatusRes.stateHash).then((blockRes) => {
          const block = blockRes as { protocolState?: Record<string, unknown> };
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
    dispatch(getStakingList() as unknown as Parameters<typeof dispatch>[0])
  }, [])


  useEffect(() => {
    baseFetchData(false)
  }, [])

  const cache = useAppSelector((state) => state.cache)

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



  return (
    <CustomView
      title={i18n.t("staking")}
      ContentWrapper={StyledContentClassName}
    >
      <EpochInfo />
      {loading ? (
        <LoadingView onClickGuide={onClickGuide} />
      ) : delegatePublicKey ? (
        <DelegationInfo
          delegatePublicKey={delegatePublicKey}
          onClickGuide={onClickGuide}
        />
      ) : (
        <EmptyView onClickGuide={onClickGuide} />
      )}
      <Clock schemeEvent={() => baseFetchData(true)} />
    </CustomView>
  );
};

const LoadingView = ({ onClickGuide }: { onClickGuide?: () => void }) => {
  return (
    <StyledDelegationContainer>
      <StyledDelegationRow>
        <StyledRowTitleContainer>
          <StyledRowIcon src="/img/icon_Delegation.svg" />
          <StyledRowTitle>{i18n.t("delegationInfo")}</StyledRowTitle>
        </StyledRowTitleContainer>
        <StyledRowHelp onClick={onClickGuide}>
          {i18n.t("stakingGuide")}
        </StyledRowHelp>
      </StyledDelegationRow>
      <StyledLoadingContainer>
        <StyledRefreshLoading src="/img/loading_purple.svg" />
        <StyledLoadingTip>{i18n.t("loading")}...</StyledLoadingTip>
      </StyledLoadingContainer>
    </StyledDelegationContainer>
  );
};

const EmptyView = ({ onClickGuide }: { onClickGuide?: () => void }) => {
  const navigate = useNavigate();
  const onChangeNode = useCallback(() => {
    navigate("/staking_list");
  }, []);

  return (
    <StyledEmptyContainer>
      <StyledEmptyTitle>{i18n.t("emptyDelegateTitle")}</StyledEmptyTitle>
      <StyledEmptyContent>
        <StyledEmptyTip>{i18n.t("emptyDelegateDesc_1")}</StyledEmptyTip>
        <Trans
          i18nKey={"emptyDelegateDesc_2"}
          components={{
            click: <StyledEmptyGuide onClick={onClickGuide} />,
          }}
        />
      </StyledEmptyContent>
      <StyledBtnContainer>
        <Button size={button_size.small} onClick={onChangeNode}>
          {i18n.t("goStake")}
        </Button>
      </StyledBtnContainer>
    </StyledEmptyContainer>
  );
};


const DelegationInfo = ({ delegatePublicKey = "", onClickGuide = () => {} }: { delegatePublicKey?: string; onClickGuide?: () => void }) => {
  const navigate = useNavigate();
  const stakingList = useAppSelector((state) => state.staking.stakingList);
  const mainTokenNetInfo = useAppSelector(
    (state) => state.accountInfo.mainTokenNetInfo
  );

  const onChangeNode = useCallback(() => {
    navigate("/staking_list", { state: { nodeAddress: delegatePublicKey } });
  }, [delegatePublicKey]);

  const { showNodeAddress, nodeName, stakedBalance } = useMemo(() => {
    let showNodeAddress = addressSlice(delegatePublicKey);
    let nodeName = showNodeAddress;
    if (delegatePublicKey) {
      let delegateNode = stakingList.find(
        ({ nodeAddress }: { nodeAddress: string }) => nodeAddress === delegatePublicKey
      );
      if (delegateNode && delegateNode.nodeAddress) {
        nodeName =
          delegateNode.nodeName || addressSlice(delegateNode.nodeAddress, 8);
      }
    }
    let stakedBalance = mainTokenNetInfo?.tokenBaseInfo?.showBalance || "0.00";
    stakedBalance = stakedBalance + " " + MAIN_COIN_CONFIG.symbol;
    return { showNodeAddress, nodeName, stakedBalance };
  }, [delegatePublicKey, stakingList, mainTokenNetInfo]);

  return (
    <StyledDelegationContainer>
      <StyledDelegationRow>
        <StyledRowTitleContainer>
          <StyledRowIcon src="/img/icon_Delegation.svg" />
          <StyledRowTitle>{i18n.t("delegationInfo")}</StyledRowTitle>
        </StyledRowTitleContainer>
        <StyledRowHelp onClick={onClickGuide}>
          {i18n.t("stakingGuide")}
        </StyledRowHelp>
      </StyledDelegationRow>
      <StyledDelegationContent>
        <div>
          <RowItem title={i18n.t("blockProducerName")} content={nodeName} />
          <RowItem
            title={i18n.t("blockProducerAddress")}
            content={showNodeAddress}
            copyContent={delegatePublicKey}
            isMargin={true}
          />
          <RowItem
            title={i18n.t("stakedBalance")}
            content={stakedBalance}
            isMargin={true}
          />
        </div>
        <StyledRowRight>
          <Button size={button_size.small} onClick={onChangeNode}>
            {i18n.t("change")}
          </Button>
        </StyledRowRight>
      </StyledDelegationContent>
    </StyledDelegationContainer>
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
  const epochDataAction = useCallback((daemonStatus: Record<string, unknown>, block: Record<string, unknown>): EpochData | undefined => {
    const typedConsensusConfig = daemonStatus?.consensusConfiguration as { slotsPerEpoch?: number; slotDuration?: number } | undefined;
    const typedProtocolState = block?.protocolState as { consensusState?: { slot?: number; epoch?: number } } | undefined;
    if (
      daemonStatus &&
      typedConsensusConfig &&
      block &&
      typedProtocolState
    ) {
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
            <CircularProgressbar strokeWidth={10} value={epochData?.percentage as number} />
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

const GradientSVG = ({ startColor, endColor, idCSS, rotation }: GradientSVGProps) => {
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

const RowItem = ({ title = "", content = "", isMargin = false, copyContent = "" }) => {
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