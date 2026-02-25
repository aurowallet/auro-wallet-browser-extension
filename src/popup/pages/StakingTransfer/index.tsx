import BigNumber from "bignumber.js";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import type { InputChangeEvent } from "../../types/common";
import { useNavigate, useLocation } from "react-router-dom";
import { sendStakeTx } from "../../../background/api";
import { useDelegationKey } from "@/hooks/useDelegationKey";
import { NetworkID_MAP } from "@/constant/network";
import {
  addressSlice,
  addressValid,
  getRealErrorMsg,
  isNaturalNumber,
  isNumber,
  trimSpace,
} from "../../../utils/utils";
import AdvanceMode from "../../component/AdvanceMode";
import Button from "../../component/Button";
import { ConfirmModal } from "../../component/ConfirmModal";
import CustomView from "../../component/CustomView";
import FeeGroup from "../../component/FeeGroup";
import Input from "../../component/Input";
import {
  StyledContainer,
  StyledContentContainer,
  StyledInputContainer,
  StyledFeeContainer,
  StyledDividedLine,
  StyledBottomContainer,
  StyledPlaceholder,
  StyledInfoBanner,
  StyledInfoBannerText,
  StyledValidatorSection,
  StyledValidatorLabel,
  StyledValidatorCard,
  StyledValidatorSelectorCard,
  StyledValidatorInfo,
  StyledValidatorIconWrapper,
  StyledValidatorIconHolder,
  StyledValidatorIconImg,
  StyledValidatorName,
  StyledSelectorArrow,
  StyledEarningsCard,
  StyledEarningsRow,
  StyledEarningsLabel,
  StyledEarningsValue,
} from "./index.styled";

import { MAIN_COIN_CONFIG, ZK_DEFAULT_TOKEN_ID } from "../../../constant";
import {
  QA_SIGN_TRANSACTION,
  WALLET_CHECK_TX_STATUS,
} from "../../../constant/msgTypes";
import { sendMsg } from "../../../utils/commonMsg";
import Toast from "../../component/Toast";

import useFetchAccountData from "@/hooks/useUpdateAccount";
import { DAppActions } from "@aurowallet/mina-provider";
import { ACCOUNT_TYPE, LEDGER_STATUS } from "../../../constant/commonType";
import { updateLedgerConnectStatus } from "../../../reducers/ledger";
import { updateNextTokenDetail } from "../../../reducers/cache";
import ledgerManager from "../../../utils/ledger";
import { LedgerInfoModal } from "../../component/LedgerInfoModal";

const StakingTransfer = () => {

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const currentAccount = useAppSelector(
    (state) => state.accountInfo.currentAccount
  );
  const mainTokenNetInfo = useAppSelector(
    (state) => state.accountInfo.mainTokenNetInfo
  );
  const netFeeList = useAppSelector((state) => state.cache.feeRecommend);
  const ledgerStatus = useAppSelector((state) => state.ledger.ledgerConnectStatus);
  const { fetchAccountData } = useFetchAccountData(currentAccount as Parameters<typeof useFetchAccountData>[0]);

  const stakingList = useAppSelector((state) => state.staking.stakingList);
  const delegationKey = useDelegationKey();
  const stakingAPY = useAppSelector((state) => state.staking.stakingAPY);
  const networkID = useAppSelector((state) => state.network.currentNode.networkID);

  const [routeParams] = useState(() => {
    const params = (location?.state || {}) as {
      menuAdd?: boolean;
      nodeName?: string;
      nodeAddress?: string;
      icon?: string;
      isRedelegate?: boolean;
    };
    return {
      menuAdd: !!params.menuAdd,
      nodeName: params.nodeName,
      nodeAddress: params.nodeAddress,
      icon: params.icon,
      isRedelegate: !!params.isRedelegate,
    };
  });

  const { menuAdd, nodeAddress, showNodeName, nodeIcon, isRedelegate, currentValidatorName, currentValidatorIcon, hasToValidator, isActiveValidator } = useMemo(() => {
    let menuAdd = routeParams.menuAdd;
    let nodeName = routeParams.nodeName;
    let nodeAddress = routeParams.nodeAddress;
    let nodeIcon = routeParams.icon;
    let isRedelegate = routeParams.isRedelegate;

    if (isRedelegate && !nodeAddress && !menuAdd && networkID === NetworkID_MAP.mainnet) {
      const defaultNode = stakingList.active[0];
      if (defaultNode) {
        nodeAddress = defaultNode.nodeAddress;
        nodeName = defaultNode.nodeName;
        nodeIcon = defaultNode.icon;
      }
    }

    let showNodeName = nodeName || (nodeAddress ? addressSlice(nodeAddress, 8) : "");
    let hasToValidator = !!nodeAddress;
    let isActiveValidator = nodeAddress ? stakingList.active.some((n: { nodeAddress: string }) => n.nodeAddress === nodeAddress) : false;

    if (nodeAddress && !nodeIcon) {
      const node = stakingList.active.find((n: { nodeAddress: string }) => n.nodeAddress === nodeAddress) ||
                   stakingList.inactive.find((n: { nodeAddress: string }) => n.nodeAddress === nodeAddress);
      if (node) {
        nodeIcon = node.icon;
        if (!nodeName) {
          showNodeName = node.nodeName || addressSlice(nodeAddress, 8);
        }
      }
    }

    let currentValidatorName = delegationKey ? addressSlice(delegationKey, 8) : i18n.t('currentValidator');
    let currentValidatorIcon: string | null = null;
    if (isRedelegate && delegationKey) {
      const currentNode = stakingList.active.find((n: { nodeAddress: string }) => n.nodeAddress === delegationKey) ||
                          stakingList.inactive.find((n: { nodeAddress: string }) => n.nodeAddress === delegationKey);
      if (currentNode) {
        currentValidatorName = currentNode.nodeName || addressSlice(delegationKey, 8);
        currentValidatorIcon = currentNode.icon;
      }
    }

    return {
      menuAdd,
      nodeAddress,
      showNodeName,
      nodeIcon,
      isRedelegate,
      currentValidatorName,
      currentValidatorIcon,
      hasToValidator,
      isActiveValidator,
    };
  }, [routeParams, stakingList, delegationKey, networkID]);

  const [blockAddress, setBlockAddress] = useState<string>("");

  const [memo, setMemo] = useState("");
  const [feeAmount, setFeeAmount] = useState(() => {
    return netFeeList.length > 1 && netFeeList[1] ? String(netFeeList[1].value) : "0.1";
  });
  const [advanceInputFee, setAdvanceInputFee] = useState("");
  const [inputNonce, setInputNonce] = useState("");
  const [feeErrorTip, setFeeErrorTip] = useState("");
  const [isOpenAdvance, setIsOpenAdvance] = useState(false);
  const [confirmModalStatus, setConfirmModalStatus] = useState(false);
  const [confirmBtnStatus, setConfirmBtnStatus] = useState(false);
  const [contentList, setContentList] = useState<{ label: string; value: string }[]>([]);

  const [waitLedgerStatus, setWaitLedgerStatus] = useState(false);
  const [btnDisableStatus, setBtnDisableStatus] = useState(() => {
    if (routeParams.menuAdd) {
      return true;
    }
    if (routeParams.isRedelegate && !routeParams.nodeAddress && !routeParams.menuAdd) {
      return true;
    }
    return false;
  });

  const [ledgerModalStatus, setLedgerModalStatus] = useState(false);

  const onBlockAddressInput = useCallback((e: InputChangeEvent) => {
    setBlockAddress(e.target.value);
  }, []);

  const onMemoInput = useCallback((e: InputChangeEvent) => {
    setMemo(e.target.value);
  }, []);
  const onClickFeeGroup = useCallback((item: { fee: string | number }) => {
    setFeeAmount(String(item.fee));
    setAdvanceInputFee("");
    setFeeErrorTip("");
  }, []);

  const onClickAdvance = useCallback(() => {
    setIsOpenAdvance(prev => {
      if (prev) {
        setAdvanceInputFee("");
        setFeeErrorTip("");
      }
      return !prev;
    });
  }, []);

  const onFeeInput = useCallback((e: InputChangeEvent) => {
    setAdvanceInputFee(e.target.value);
    if (BigNumber(e.target.value).gt(10)) {
      setFeeErrorTip(i18n.t("feeTooHigh"));
    } else {
      setFeeErrorTip("");
    }
  }, []);

  const nextFee = useMemo(() => {
    if (isNumber(advanceInputFee) && Number(advanceInputFee) > 0) {
      return advanceInputFee;
    }
    return feeAmount;
  }, [advanceInputFee, feeAmount]);
  const onNonceInput = useCallback((e: InputChangeEvent) => {
    setInputNonce(e.target.value);
  }, []);
  const onClickClose = useCallback(() => {
    setConfirmModalStatus(false);
  }, []);

  const onSubmitSuccess = useCallback(
    (data: { error?: string; sendDelegation?: { delegation?: { id?: string; hash?: string } } }, type?: string) => {
      if (data.error) {
        let errorMessage = i18n.t("postFailed");
        let realMsg = getRealErrorMsg(data.error);
        errorMessage = realMsg ? realMsg : errorMessage;
        Toast.info(errorMessage, 5 * 1000);
        return;
      }
      let detail =
        (data.sendDelegation && data.sendDelegation.delegation) || {};
      if (type === "ledger") {
        sendMsg(
          {
            action: WALLET_CHECK_TX_STATUS,
            payload: {
              paymentId: detail.id,
              hash: detail.hash,
            },
          },
          () => {}
        );
      }
      const tokenDetail = mainTokenNetInfo?.tokenId
        ? mainTokenNetInfo
        : {
            ...mainTokenNetInfo,
            tokenId: ZK_DEFAULT_TOKEN_ID,
            tokenBaseInfo: mainTokenNetInfo?.tokenBaseInfo || {
              isMainToken: true,
              decimals: MAIN_COIN_CONFIG.decimals,
              showBalance: "0",
              iconUrl: "img/mina_color.svg",
            },
          };
      dispatch(updateNextTokenDetail(tokenDetail as Record<string, unknown>));
      navigate("/", { replace: true });
      setTimeout(() => {
        navigate("/token_detail");
      }, 0);
    },
    [navigate, dispatch, mainTokenNetInfo]
  );

  useEffect(() => {
    if (!confirmModalStatus) {
      setWaitLedgerStatus(false);
    }
  }, [confirmModalStatus]);

  const ledgerTransfer = useCallback(
    async (params: { fromAddress: string; toAddress: string; fee: string | number; nonce: string | number; memo: string }) => {
      const { status } = await ledgerManager.ensureConnect();
      if (status !== LEDGER_STATUS.READY) return;

      setWaitLedgerStatus(true);
      const result = await ledgerManager.signDelegation(
        params,
        typeof currentAccount.hdPath === 'number' ? currentAccount.hdPath : 0
      );
      if (result?.rejected || result?.error) {
        setWaitLedgerStatus(false);
        setConfirmModalStatus(false);
        Toast.info(i18n.t("ledgerRejected"));
        return;
      }
      const postRes = await sendStakeTx(result?.payload as Parameters<typeof sendStakeTx>[0], {
        rawSignature: result?.signature as string,
      });
      setConfirmModalStatus(false);
      onSubmitSuccess(postRes as Parameters<typeof onSubmitSuccess>[0], "ledger");
    },
    [currentAccount]
  );

    const clickNextStep = useCallback(async () => {
      if (currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER) {
        const { status } = await ledgerManager.ensureConnect();

        dispatch(updateLedgerConnectStatus(status));

        if (status !== LEDGER_STATUS.READY) {
          setLedgerModalStatus(true);
          return;
        }
      }
      let fromAddress = currentAccount.address || "";
      let toAddress = nodeAddress || String(trimSpace(blockAddress) || "");
      let nonce = String(trimSpace(inputNonce) || mainTokenNetInfo?.inferredNonce || "");
      let realMemo = memo || "";
      let fee = String(trimSpace(nextFee) || "");
      let payload = {
        fromAddress,
        toAddress,
        fee,
        nonce,
        memo: realMemo,
        sendAction: "" as string | undefined,
      };
      if (currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER) {
        return ledgerTransfer(payload as Parameters<typeof ledgerTransfer>[0]);
      }
      setConfirmBtnStatus(true);
      payload.sendAction = DAppActions.mina_sendStakeDelegation;
      sendMsg(
        {
          action: QA_SIGN_TRANSACTION,
          payload,
        },
        (data: { error?: string; sendDelegation?: { delegation?: { id?: string; hash?: string } } }) => {
          setConfirmBtnStatus(false);
          onSubmitSuccess(data);
        }
      );
    }, [
      currentAccount,
      mainTokenNetInfo,
      inputNonce,
      nextFee,
      blockAddress,
      ledgerTransfer,
      ledgerStatus,
      memo,
    ]);

  const onConfirm = useCallback(async () => {
      let realBlockAddress = nodeAddress || blockAddress;
      if (!addressValid(realBlockAddress)) {
        Toast.info(i18n.t("sendAddressError"));
        return;
      }
      let inputFee = trimSpace(String(nextFee)) as string;
      if (inputFee.length > 0 && !isNumber(inputFee)) {
        Toast.info(i18n.t("inputFeeError"));
        return;
      }

      const showBalance = (mainTokenNetInfo?.tokenBaseInfo as { showBalance?: string } | undefined)?.showBalance || "0";
      if (
        new BigNumber(inputFee).gt(showBalance)
      ) {
        Toast.info(i18n.t("balanceNotEnough"));
        return;
      }
      let nonce = trimSpace(inputNonce) as string;
      if (nonce.length > 0 && !isNaturalNumber(nonce)) {
        Toast.info(i18n.t("inputNonceError", { nonce: "Nonce" }));
        return;
      }

      let list: { label: string; value: string }[] = [
        {
          label: i18n.t("blockProducerAddress"),
          value: nodeAddress || blockAddress || "",
        },
        {
          label: i18n.t("from"),
          value: currentAccount.address || "",
        },
        {
          label: i18n.t("fee"),
          value: trimSpace(String(nextFee)) + " " + MAIN_COIN_CONFIG.symbol,
        },
      ];
      if (isNaturalNumber(nonce)) {
        list.push({
          label: "Nonce",
          value: nonce,
        });
      }
      if (memo) {
        list.push({
          label: "Memo",
          value: memo,
        });
      }
      setContentList(list);
      if (currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER) {
        const { status } = await ledgerManager.ensureConnect();
        dispatch(updateLedgerConnectStatus(status));
        if (status !== LEDGER_STATUS.READY) {
          setLedgerModalStatus(true);
          return;
        }
        setConfirmModalStatus(true);
      } else {
        dispatch(updateLedgerConnectStatus("" as Parameters<typeof updateLedgerConnectStatus>[0]));
        setConfirmModalStatus(true);
      }
    }, [
      nodeAddress,
      mainTokenNetInfo,
      nextFee,
      inputNonce,
      currentAccount,
      clickNextStep,
      blockAddress,
      memo,
      ledgerStatus,
    ]);

  const onLedgerInfoModalConfirm = useCallback(async () => {
    const { status } = await ledgerManager.ensureConnect();
    if (status === LEDGER_STATUS.READY) {
      setLedgerModalStatus(false);
      onConfirm();
    }
  }, [onConfirm]);

  const onClickBlockProducer = useCallback(() => {
    navigate("/staking_list", {
      replace: true,
      state: {
        nodeAddress: nodeAddress,
        fromPage: "stakingTransfer",
        ...(isRedelegate ? { isRedelegate: true } : {}),
      },
    });
  }, [nodeAddress, isRedelegate, navigate]);

  useEffect(() => {
    if (feeAmount === "0.1") {
      if (netFeeList.length > 1 && netFeeList[1]) {
        setFeeAmount(String(netFeeList[1].value) || "0.1");
      }
    }
  }, [feeAmount, netFeeList]);

  useEffect(() => {
    fetchAccountData();
  }, []);

  useEffect(() => {
    if (menuAdd && (trimSpace(blockAddress || '') as string).length === 0) {
      setBtnDisableStatus(true);
    } else if (isRedelegate && !nodeAddress && !menuAdd) {
      setBtnDisableStatus(true);
    } else {
      setBtnDisableStatus(false);
    }
  }, [menuAdd, blockAddress, isRedelegate, nodeAddress]);

  const pageTitle = isRedelegate ? i18n.t("redelegate") : i18n.t("stake");

  return (
    <CustomView title={pageTitle} ContentWrapper={StyledContainer}>
      {!menuAdd && (
        <StyledInfoBanner>
          <StyledInfoBannerText>{i18n.t("stakeInfoBanner")}</StyledInfoBannerText>
        </StyledInfoBanner>
      )}
      <StyledContentContainer>
        {menuAdd ? (
          <>
            <StyledInputContainer>
              <Input
                label={i18n.t("blockProducer")}
                onChange={onBlockAddressInput}
                value={blockAddress}
                inputType={"text"}
              />
              <Input
                label={i18n.t("memo")}
                onChange={onMemoInput}
                value={memo}
                inputType={"text"}
              />
            </StyledInputContainer>
            <StyledFeeContainer>
              <FeeGroup
                onClickFee={onClickFeeGroup}
                currentFee={nextFee}
                netFeeList={netFeeList as unknown as Parameters<typeof FeeGroup>[0]["netFeeList"]}
                hideTimer={true}
              />
            </StyledFeeContainer>
            <StyledDividedLine />
            <div>
              <AdvanceMode
                onClickAdvance={onClickAdvance}
                isOpenAdvance={isOpenAdvance}
                feeValue={advanceInputFee}
                feePlaceholder={String(feeAmount)}
                onFeeInput={onFeeInput}
                feeErrorTip={feeErrorTip}
                nonceValue={inputNonce}
                onNonceInput={onNonceInput}
              />
            </div>
          </>
        ) : isRedelegate ? (
          <StyledValidatorSection>
            <StyledValidatorLabel>{i18n.t("fromValidator")}</StyledValidatorLabel>
            <StyledValidatorCard>
              <ValidatorIcon icon={currentValidatorIcon} name={currentValidatorName || ""} />
              <StyledValidatorName>{currentValidatorName}</StyledValidatorName>
            </StyledValidatorCard>

            <StyledValidatorLabel>{i18n.t("toValidator")}</StyledValidatorLabel>
            {hasToValidator ? (
              <ValidatorSelector
                showNodeName={showNodeName || ""}
                nodeIcon={nodeIcon || null}
                onClickBlockProducer={onClickBlockProducer}
              />
            ) : (
              <ValidatorSelector
                showNodeName={i18n.t("selectValidator")}
                nodeIcon={null}
                showIcon={false}
                onClickBlockProducer={onClickBlockProducer}
              />
            )}
          </StyledValidatorSection>
        ) : (
          <StyledValidatorSection>
            <StyledValidatorLabel>{i18n.t("validator")}</StyledValidatorLabel>
            <ValidatorSelector
              showNodeName={showNodeName || ""}
              nodeIcon={nodeIcon || null}
              onClickBlockProducer={onClickBlockProducer}
            />

            <EarningsEstimate
              balanceTotal={mainTokenNetInfo?.balance?.total || "0"}
              decimals={(mainTokenNetInfo?.tokenBaseInfo as { decimals?: number } | undefined)?.decimals || 9}
              stakingAPY={isActiveValidator ? (stakingAPY || 0) : 0}
            />
          </StyledValidatorSection>
        )}
        <StyledPlaceholder />
      </StyledContentContainer>
      <StyledBottomContainer>
        <Button disable={btnDisableStatus} onClick={onConfirm}>
          {i18n.t("next")}
        </Button>
      </StyledBottomContainer>
      <ConfirmModal
        modalVisible={confirmModalStatus}
        title={i18n.t("transactionDetails")}
        highlightTitle={i18n.t("blockProducer")}
        highlightContent={showNodeName || addressSlice(blockAddress, 8)}
        onConfirm={clickNextStep}
        loadingStatus={confirmBtnStatus}
        onClickClose={onClickClose}
        contentList={contentList}
        waitingLedger={waitLedgerStatus}
        showCloseIcon={waitLedgerStatus}
      />
      <LedgerInfoModal
        modalVisible={ledgerModalStatus}
        onClickClose={() => setLedgerModalStatus(false)}
        onConfirm={onLedgerInfoModalConfirm}
      />
    </CustomView>
  );
};

interface ValidatorSelectorProps {
  showNodeName: string;
  nodeIcon: string | null;
  onClickBlockProducer: () => void;
  showIcon?: boolean;
}

const ValidatorSelector = ({ showNodeName, nodeIcon, onClickBlockProducer, showIcon = true }: ValidatorSelectorProps) => {
  return (
    <StyledValidatorSelectorCard onClick={onClickBlockProducer}>
      <StyledValidatorInfo>
        {showIcon && <ValidatorIcon icon={nodeIcon} name={showNodeName} />}
        <StyledValidatorName>{showNodeName}</StyledValidatorName>
      </StyledValidatorInfo>
      <StyledSelectorArrow src="/img/icon_arrow.svg" />
    </StyledValidatorSelectorCard>
  );
};

interface ValidatorIconProps {
  icon: string | null;
  name: string;
}

const ValidatorIcon = ({ icon, name }: ValidatorIconProps) => {
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
        <StyledValidatorIconImg
          src={icon || ""}
          onError={onLoadError}
        />
      )}
    </StyledValidatorIconWrapper>
  );
};

const EPOCH_DAYS = 15;
const THREE_MONTHS_DAYS = 90;
const SIX_MONTHS_DAYS = 180;
const ESTIMATE_DECIMALS = 4;

interface EarningsEstimateProps {
  balanceTotal: string;
  decimals?: number;
  stakingAPY?: number;
}

const EarningsEstimate = ({ balanceTotal, decimals = 9, stakingAPY = 0 }: EarningsEstimateProps) => {
  const balance = useMemo(() => {
    return new BigNumber(balanceTotal).dividedBy(new BigNumber(10).pow(decimals));
  }, [balanceTotal, decimals]);

  const estimates = useMemo(() => {
    if (!stakingAPY || balance.isZero() || balance.isNaN()) return { epoch: '--', threeMonths: '--', sixMonths: '--' };
    const dailyEarnings = balance.multipliedBy(stakingAPY).dividedBy(36500);
    const calc = (days: number) => dailyEarnings.multipliedBy(days).toFixed(ESTIMATE_DECIMALS, BigNumber.ROUND_DOWN);

    return {
      epoch: calc(EPOCH_DAYS),
      threeMonths: calc(THREE_MONTHS_DAYS),
      sixMonths: calc(SIX_MONTHS_DAYS),
    };
  }, [balance, stakingAPY]);

  const formatValue = (val: string) => val === '--' ? '--' : `${val} ${MAIN_COIN_CONFIG.symbol}`;

  return (
    <StyledEarningsCard>
      <StyledEarningsRow>
        <StyledEarningsLabel>{i18n.t("epochEstimate")}</StyledEarningsLabel>
        <StyledEarningsValue>{formatValue(estimates.epoch)}</StyledEarningsValue>
      </StyledEarningsRow>
      <StyledEarningsRow>
        <StyledEarningsLabel>{i18n.t("threeMonthsEstimate")}</StyledEarningsLabel>
        <StyledEarningsValue>{formatValue(estimates.threeMonths)}</StyledEarningsValue>
      </StyledEarningsRow>
      <StyledEarningsRow>
        <StyledEarningsLabel>{i18n.t("sixMonthsEstimate")}</StyledEarningsLabel>
        <StyledEarningsValue>{formatValue(estimates.sixMonths)}</StyledEarningsValue>
      </StyledEarningsRow>
    </StyledEarningsCard>
  );
};

export default StakingTransfer;
