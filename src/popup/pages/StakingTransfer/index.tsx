import BigNumber from "bignumber.js";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import type { InputChangeEvent } from "../../types/common";
import { useNavigate, useLocation } from "react-router-dom";
import { sendStakeTx } from "../../../background/api";
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
  StyledNodeNameContainer,
  StyledLabel,
  StyledLabelContainer,
  StyledRowContainer,
  StyledNodeName,
  StyledArrow,
} from "./index.styled";

import { MAIN_COIN_CONFIG } from "../../../constant";
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

  const { menuAdd, nodeName, nodeAddress, showNodeName } = useMemo(() => {
    let params = (location?.state || {}) as { menuAdd?: boolean; nodeName?: string; nodeAddress?: string };

    let menuAdd = !!params.menuAdd;
    let nodeName = params.nodeName;
    let nodeAddress = params.nodeAddress;

    let showNodeName = nodeName || addressSlice(nodeAddress, 8);
    return {
      menuAdd,
      nodeName,
      nodeAddress,
      showNodeName,
    };
  }, [location]);

  const [blockAddress, setBlockAddress] = useState<string>("");

  const [memo, setMemo] = useState("");
  const [feeAmount, setFeeAmount] = useState(0.1);
  const [advanceInputFee, setAdvanceInputFee] = useState("");
  const [inputNonce, setInputNonce] = useState("");
  const [feeErrorTip, setFeeErrorTip] = useState("");
  const [isOpenAdvance, setIsOpenAdvance] = useState(false);
  const [confirmModalStatus, setConfirmModalStatus] = useState(false);
  const [confirmBtnStatus, setConfirmBtnStatus] = useState(false);
  const [contentList, setContentList] = useState<{ label: string; value: string }[]>([]);

  const [waitLedgerStatus, setWaitLedgerStatus] = useState(false);
  const [btnDisableStatus, setBtnDisableStatus] = useState(() => {
    if (menuAdd) {
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
    setFeeAmount(Number(item.fee) || 0);
  }, []);

  const onClickAdvance = useCallback(() => {
    setIsOpenAdvance((state) => !state);
  }, []);

  const onFeeInput = useCallback((e: InputChangeEvent) => {
    setFeeAmount(Number(e.target.value) || 0);
    setAdvanceInputFee(e.target.value);
    if (BigNumber(e.target.value).gt(10)) {
      setFeeErrorTip(i18n.t("feeTooHigh"));
    } else {
      setFeeErrorTip("");
    }
  }, []);
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
      if (window.history.length >= 4) {
        navigate(-3);
      } else {
        navigate("/");
      }
    },
    [location]
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
      let fee = String(trimSpace(feeAmount) || "");
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
      feeAmount,
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
      let inputFee = trimSpace(feeAmount) as string;
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
          value: inputFee + " " + MAIN_COIN_CONFIG.symbol,
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
      feeAmount,
      inputNonce,
      currentAccount,
      clickNextStep,
      nodeName,
      nodeAddress,
      blockAddress,
      currentAccount,
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
      state: {
        nodeAddress: nodeAddress,
        fromPage: "stakingTransfer",
      },
    });
  }, [nodeAddress]);

  useEffect(() => {
    if (feeAmount === 0.1) {
      if (netFeeList.length > 1 && netFeeList[1]) {
        setFeeAmount(Number(netFeeList[1].value) || 0.1);
      }
    }
  }, [feeAmount, netFeeList]);

  useEffect(() => {
    fetchAccountData();
  }, []);

  useEffect(() => {
    if (menuAdd && (trimSpace(blockAddress || '') as string).length === 0) {
      setBtnDisableStatus(true);
    } else {
      setBtnDisableStatus(false);
    }
  }, [menuAdd, blockAddress]);

  return (
    <CustomView title={i18n.t("staking")} ContentWrapper={StyledContainer}>
      <StyledContentContainer>
        <StyledInputContainer>
          {menuAdd ? (
            <Input
              label={i18n.t("blockProducer")}
              onChange={onBlockAddressInput}
              value={blockAddress}
              inputType={"text"}
            />
          ) : (
            <BlockProducer
              label={i18n.t("blockProducer")}
              showNodeName={showNodeName || ""}
              onClickBlockProducer={onClickBlockProducer}
            />
          )}
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
            currentFee={String(feeAmount)}
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
        highlightTitle={i18n.t("blockProducerName")}
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

interface BlockProducerProps {
  label: string;
  showNodeName: string;
  onClickBlockProducer: () => void;
}

const BlockProducer = ({ label, showNodeName, onClickBlockProducer }: BlockProducerProps) => {
  return (
    <StyledNodeNameContainer>
      <StyledLabel>
        <StyledLabelContainer>
          <span>{label}</span>
        </StyledLabelContainer>
      </StyledLabel>
      <StyledRowContainer onClick={onClickBlockProducer}>
        <StyledNodeName>{showNodeName}</StyledNodeName>
        <StyledArrow src={"/img/icon_arrow_unfold.svg"} />
      </StyledRowContainer>
    </StyledNodeNameContainer>
  );
};

export default StakingTransfer;
