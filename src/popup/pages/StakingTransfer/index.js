import BigNumber from "bignumber.js";
import cls from "classnames";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import styles from "./index.module.scss";

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
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const currentAccount = useSelector(
    (state) => state.accountInfo.currentAccount
  );
  const mainTokenNetInfo = useSelector(
    (state) => state.accountInfo.mainTokenNetInfo
  );
  const netFeeList = useSelector((state) => state.cache.feeRecommend);
  const ledgerStatus = useSelector((state) => state.ledger.ledgerConnectStatus);
  const { fetchAccountData } = useFetchAccountData(currentAccount);

  const { menuAdd, nodeName, nodeAddress, showNodeName } = useMemo(() => {
    let params = location?.state || {};

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

  const [blockAddress, setBlockAddress] = useState("");

  const [memo, setMemo] = useState("");
  const [feeAmount, setFeeAmount] = useState(0.1);
  const [advanceInputFee, setAdvanceInputFee] = useState("");
  const [inputNonce, setInputNonce] = useState("");
  const [feeErrorTip, setFeeErrorTip] = useState("");
  const [isOpenAdvance, setIsOpenAdvance] = useState(false);
  const [confirmModalStatus, setConfirmModalStatus] = useState(false);
  const [confirmBtnStatus, setConfirmBtnStatus] = useState(false);
  const [contentList, setContentList] = useState([]);

  const [waitLedgerStatus, setWaitLedgerStatus] = useState(false);
  const [btnDisableStatus, setBtnDisableStatus] = useState(() => {
    if (menuAdd) {
      return true;
    }
    return false;
  });

  const [ledgerModalStatus, setLedgerModalStatus] = useState(false);

  const onBlockAddressInput = useCallback((e) => {
    setBlockAddress(e.target.value);
  }, []);

  const onMemoInput = useCallback((e) => {
    setMemo(e.target.value);
  }, []);
  const onClickFeeGroup = useCallback((item) => {
    setFeeAmount(item.fee);
  }, []);

  const onClickAdvance = useCallback(() => {
    setIsOpenAdvance((state) => !state);
  }, []);

  const onFeeInput = useCallback((e) => {
    setFeeAmount(e.target.value);
    setAdvanceInputFee(e.target.value);
    if (BigNumber(e.target.value).gt(10)) {
      setFeeErrorTip(i18n.t("feeTooHigh"));
    } else {
      setFeeErrorTip("");
    }
  }, []);
  const onNonceInput = useCallback((e) => {
    setInputNonce(e.target.value);
  }, []);
  const onClickClose = useCallback(() => {
    setConfirmModalStatus(false);
  }, []);

  const onSubmitSuccess = useCallback(
    (data, type) => {
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
    async (params) => {
      const { status } = await ledgerManager.ensureConnect();
      if (status !== LEDGER_STATUS.READY) return;

      setWaitLedgerStatus(true);
      const result = await ledgerManager.signDelegation(
        params,
        currentAccount.hdPath
      );
      if (result.rejected || result.error) {
        setWaitLedgerStatus(false);
        setConfirmModalStatus(false);
        Toast.info(i18n.t("ledgerRejected"));
        return;
      }
      const postRes = await sendStakeTx(result.payload, {
        rawSignature: result.signature,
      });
      setConfirmModalStatus(false);
      onSubmitSuccess(postRes, "ledger");
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
      let fromAddress = currentAccount.address;
      let toAddress = nodeAddress || trimSpace(blockAddress);
      let nonce = trimSpace(inputNonce) || mainTokenNetInfo.inferredNonce;
      let realMemo = memo || "";
      let fee = trimSpace(feeAmount);
      let payload = {
        fromAddress,
        toAddress,
        fee,
        nonce,
        memo: realMemo,
      };
      if (currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER) {
        return ledgerTransfer(payload);
      }
      setConfirmBtnStatus(true);
      payload.sendAction = DAppActions.mina_sendStakeDelegation;
      sendMsg(
        {
          action: QA_SIGN_TRANSACTION,
          payload,
        },
        (data) => {
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
      let inputFee = trimSpace(feeAmount);
      if (inputFee.length > 0 && !isNumber(inputFee)) {
        Toast.info(i18n.t("inputFeeError"));
        return;
      }

      if (
        new BigNumber(inputFee).gt(mainTokenNetInfo.tokenBaseInfo.showBalance)
      ) {
        Toast.info(i18n.t("balanceNotEnough"));
        return;
      }
      let nonce = trimSpace(inputNonce);
      if (nonce.length > 0 && !isNaturalNumber(nonce)) {
        Toast.info(i18n.t("inputNonceError", { nonce: "Nonce" }));
        return;
      }

      let list = [
        {
          label: i18n.t("blockProducerAddress"),
          value: nodeAddress || blockAddress,
        },
        {
          label: i18n.t("from"),
          value: currentAccount.address,
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
        dispatch(updateLedgerConnectStatus(""));
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
      if (netFeeList.length > 0) {
        setFeeAmount(netFeeList[1].value);
      }
    }
  }, [feeAmount, netFeeList]);

  useEffect(() => {
    fetchAccountData();
  }, []);

  useEffect(() => {
    if (menuAdd && trimSpace(blockAddress).length === 0) {
      setBtnDisableStatus(true);
    } else {
      setBtnDisableStatus(false);
    }
  }, [menuAdd, blockAddress]);

  return (
    <CustomView title={i18n.t("staking")} contentClassName={styles.container}>
      <div className={styles.contentContainer}>
        <div className={styles.inputContainer}>
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
              showNodeName={showNodeName}
              onClickBlockProducer={onClickBlockProducer}
            />
          )}
          <Input
            label={i18n.t("memo")}
            onChange={onMemoInput}
            value={memo}
            inputType={"text"}
          />
        </div>
        <div className={styles.feeContainer}>
          <FeeGroup
            onClickFee={onClickFeeGroup}
            currentFee={feeAmount}
            netFeeList={netFeeList}
            hideTimer={true}
          />
        </div>

        <div className={styles.dividedLine}>
          <p className={styles.dividedContent}>-</p>
        </div>

        <div>
          <AdvanceMode
            onClickAdvance={onClickAdvance}
            isOpenAdvance={isOpenAdvance}
            feeValue={advanceInputFee}
            feePlaceholder={feeAmount}
            onFeeInput={onFeeInput}
            feeErrorTip={feeErrorTip}
            nonceValue={inputNonce}
            onNonceInput={onNonceInput}
          />
        </div>
        <div className={styles.hold} />
      </div>
      <div className={cls(styles.bottomContainer)}>
        <Button disable={btnDisableStatus} onClick={onConfirm}>
          {i18n.t("next")}
        </Button>
      </div>

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

const BlockProducer = ({ label, showNodeName, onClickBlockProducer }) => {
  return (
    <div className={styles.nodeNameContainer}>
      <div className={styles.label}>
        <div className={styles.labelContainer}>
          <span>{label}</span>
        </div>
      </div>
      <div className={styles.rowContainer} onClick={onClickBlockProducer}>
        <p className={styles.nodeName}>{showNodeName}</p>
        <img className={styles.arrow} src={"/img/icon_arrow_unfold.svg"} />
      </div>
    </div>
  );
};
export default StakingTransfer;
