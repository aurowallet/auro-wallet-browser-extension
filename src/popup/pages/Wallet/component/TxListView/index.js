import { DAppActions } from "@aurowallet/mina-provider";
import BigNumber from "bignumber.js";
import cls from "classnames";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import {
  getPendingTxList,
  sendStakeTx,
  sendTx,
} from "../../../../../background/api";
import { MAIN_COIN_CONFIG } from "../../../../../constant";
import {
  ACCOUNT_TYPE,
  LEDGER_STATUS,
} from "../../../../../constant/commonType";
import {
  QA_SIGN_TRANSACTION,
  WALLET_CHECK_TX_STATUS
} from "../../../../../constant/msgTypes";
import { updateShouldRequest } from "../../../../../reducers/accountReducer";
import { updateLedgerConnectStatus } from "../../../../../reducers/ledger";
import { openTab, sendMsg } from "../../../../../utils/commonMsg";
import {
  getLedgerStatus,
  requestSignDelegation,
  requestSignPayment,
} from "../../../../../utils/ledger";
import {
  addressSlice,
  amountDecimals,
  decodeMemo,
  getDisplayAmount,
  getRealErrorMsg,
  getShowTime,
  isNumber,
} from "../../../../../utils/utils";
import Button from "../../../../component/Button";
import { LedgerInfoModal } from "../../../../component/LedgerInfoModal";
import Toast from "../../../../component/Toast";
import {
  TransactionModal,
  TransactionModalType,
} from "../../../../component/TransactionModal";
import styles from "./index.module.scss";
import { HistoryHeader } from "../StatusView";

/**
 *
 * @param {*} showEmpty
 * @param {*} showEmpty
 * @returns
 */
const TxListView = ({
  history = [],
  showHistoryStatus = false,
  onClickRefresh = () => {},
}) => {
  const dispatch = useDispatch();

  const accountInfo = useSelector((state) => state.accountInfo);
  const netConfig = useSelector((state) => state.network);
  const netFeeList = useSelector((state) => state.cache.feeRecommend);
  const ledgerStatus = useSelector((state) => state.ledger.ledgerConnectStatus);
  const shouldRefresh = useSelector(state => state.accountInfo.shouldRefresh)

  const onGoExplorer = useCallback(() => {
    let currentNode = netConfig.currentNode;
    let url =
    currentNode.explorer +
      "/account/" +
      accountInfo.currentAccount.address +
      "/txs";
    openTab(url);
  }, [netConfig, accountInfo]);

  const isLedgerAccount = useMemo(() => {
    return accountInfo.currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER;
  }, [accountInfo]);

  const [transactionModalStatus, setTransactionModalStatus] = useState(false);
  const [modalType, setModalType] = useState();
  const [transactionModalData, setTransactionModalData] = useState({});
  const [nextFee, setNextFee] = useState("");
  const [currentFee, setCurrentFee] = useState("");
  const [btnLoading, setBtnLoading] = useState(false);

  const [ledgerApp, setLedgerApp] = useState();
  const [ledgerModalStatus, setLedgerModalStatus] = useState(false);
  const [waitLedgerStatus, setWaitLedgerStatus] = useState(false);

  const { nextNetFee } = useMemo(() => {
    let nextNetFee = "";
    if (Array.isArray(netFeeList)) {
      let tempFeeList = netFeeList.filter((item) => {
        return item.desc === "speedup";
      });
      if (tempFeeList.length >= 1) {
        nextNetFee = tempFeeList[0].value;
      }
    }
    return {
      nextNetFee,
    };
  }, [transactionModalData, netFeeList]);

  const setCurrentTransactionFee = useCallback((txData) => {
    let fee = txData?.fee || "";
    if (isNumber(fee)) {
      fee = amountDecimals(fee, MAIN_COIN_CONFIG.decimals);
    }
    setCurrentFee(fee);
    return fee;
  }, []);

  const checkLedgerStatus = useCallback(async () => {
    if (isLedgerAccount) {
      const ledger = await getLedgerStatus();
      dispatch(updateLedgerConnectStatus(ledger.status));
      setLedgerApp(ledger.app);
    }
  }, [isLedgerAccount]);

  const onClickSpeedUp = useCallback(
    (txData) => {
      checkLedgerStatus();
      setModalType(TransactionModalType.speedUp);
      setTransactionModalData(txData);

      let localFee = setCurrentTransactionFee(txData);

      const nextUpFee = new BigNumber(localFee).plus(nextNetFee).toNumber();
      setNextFee(nextUpFee);
      setCurrentTransactionFee(txData);

      setTransactionModalStatus(true);
    },
    [nextNetFee, checkLedgerStatus]
  );

  const onClickCancel = useCallback(
    (txData) => {
      checkLedgerStatus();
      setTransactionModalStatus(true);
      setModalType(TransactionModalType.cancel);
      let localFee = setCurrentTransactionFee(txData);

      const nextCancelFee = new BigNumber(localFee).plus(0.0001).toNumber();
      setNextFee(nextCancelFee);

      setTransactionModalData(txData);
    },
    [checkLedgerStatus]
  );

  const { modalTitle, modalDesc } = useMemo(() => {
    let modalTitle = "";
    let modalDesc = "";
    if (modalType === TransactionModalType.speedUp) {
      modalTitle = i18n.t("speedUpTitle");
      modalDesc = "speedUpTip";
    } else {
      modalTitle = i18n.t("cancelTransaction");
      modalDesc = "transactionCancelTip";
    }
    return {
      modalTitle,
      modalDesc,
    };
  }, [modalType, i18n]);

  const onClickClose = useCallback(() => {
    setTransactionModalStatus(false);
  }, []);

  const onSubmitTx = useCallback(
    async (data, type) => {
      setBtnLoading(false);
      if (data.error) {
        let errorMessage = i18n.t("postFailed");
        let realMsg = getRealErrorMsg(data.error);
        errorMessage = realMsg ? realMsg : errorMessage;
        Toast.info(errorMessage, 5 * 1000);

        setWaitLedgerStatus(false);
        setLedgerModalStatus(false);
        setTransactionModalStatus(false);
        return;
      }
      let detail = (data.sendPayment && data.sendPayment.payment) || {};
      dispatch(updateShouldRequest(true, true));
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
      setTransactionModalStatus(false);
      await getPendingTxList(transactionModalData.from);
    },
    [i18n, transactionModalData]
  );
  useEffect(() => {
    if (!transactionModalStatus) {
      setBtnLoading(false);
      setWaitLedgerStatus(false);
    }
  }, [transactionModalStatus]);

  const ledgerTransfer = useCallback(
    async (nextPayload) => {
      const nextAction = nextPayload.sendAction;
      setWaitLedgerStatus(true);
      let ledgerNextPayload = nextPayload;
      if (modalType === TransactionModalType.cancel) {
        ledgerNextPayload = {
          ...nextPayload,
          amount: 1e-9,
        };
      } else {
        ledgerNextPayload = {
          ...nextPayload,
          memo: decodeMemo(nextPayload.memo),
        };
      }
      const nextFunc =
        nextAction === DAppActions.mina_sendStakeDelegation
          ? requestSignDelegation
          : requestSignPayment;
      const { signature, payload, error, rejected } = await nextFunc(
        ledgerApp,
        ledgerNextPayload,
        accountInfo.currentAccount.hdPath,
        true
      );
      if (error) {
        setBtnLoading(false);
        setTransactionModalStatus(false);
        Toast.info(error.message);
        return;
      }
      const nextPostFunc =
        nextAction === DAppActions.mina_sendStakeDelegation
          ? sendStakeTx
          : sendTx;
      let postRes = await nextPostFunc(payload, {
        rawSignature: signature,
      }).catch((error) => error);
      onSubmitTx(postRes, "ledger");
    },
    [ledgerApp, modalType, accountInfo]
  );

  const onClickConfirm = useCallback(
    (nextInputFee) => {
      if (isLedgerAccount && ledgerStatus !== LEDGER_STATUS.READY) {
        setLedgerModalStatus(true);
        return;
      }
      setBtnLoading(true);
      const currentAddress = accountInfo.currentAccount.address;
      let nextAction = "";
      let nextPayload = {};
      if (modalType === TransactionModalType.cancel) {
        nextAction = QA_SIGN_TRANSACTION;
        nextPayload = {
          amount: 0,
          fee: nextInputFee,
          nonce: transactionModalData.nonce,
          toAddress: currentAddress,
          fromAddress: currentAddress,
          memo: "",
          sendAction: DAppActions.mina_sendPayment,
        };
      } else {
        if (transactionModalData.kind) {
          let kind_low = transactionModalData.kind.toLowerCase();
          switch (kind_low) {
            case "payment":
              nextAction = QA_SIGN_TRANSACTION;
              nextPayload = {
                ...transactionModalData,
                fee: nextInputFee,
                nonce: transactionModalData.nonce,
                fromAddress: currentAddress,
                toAddress: transactionModalData.to,
                amount: amountDecimals(
                  transactionModalData.amount,
                  MAIN_COIN_CONFIG.decimals
                ),
                isSpeedUp: true,
                sendAction: DAppActions.mina_sendPayment,
              };
              break;
            case "stake_delegation":
            case "delegation":
              nextAction = QA_SIGN_TRANSACTION;
              nextPayload = {
                ...transactionModalData,
                fee: nextInputFee,
                nonce: transactionModalData.nonce,
                fromAddress: currentAddress,
                toAddress: transactionModalData.to,
                isSpeedUp: true,
                sendAction: DAppActions.mina_sendStakeDelegation,
              };
              break;
            case "zkapp":
              nextAction = QA_SIGN_TRANSACTION;
              nextPayload = {
                ...transactionModalData,
                fee: nextInputFee,
                nonce: transactionModalData.nonce,
                fromAddress: currentAddress,
                toAddress: transactionModalData.to,
                isResend: true,
                sendAction: DAppActions.mina_sendTransaction,
                transaction: JSON.stringify(
                  transactionModalData?.body?.zkappCommand
                ),
                memo: decodeMemo(DAppActions.memo),
              };
              break;
            default:
              break;
          }
        }
      }

      if (isLedgerAccount) {
        return ledgerTransfer(nextPayload);
      }

      sendMsg(
        {
          action: nextAction,
          payload: nextPayload,
        },
        (data) => {
          onSubmitTx(data);
        }
      );
    },
    [
      transactionModalData,
      accountInfo,
      ledgerStatus,
      isLedgerAccount,
      ledgerTransfer,
    ]
  );
  const onLedgerInfoModalConfirm = useCallback((ledger) => {
    setLedgerApp(ledger.app);
    setLedgerModalStatus(false);
  }, []);
  return (
    <div className={cls(styles.historyContainer, styles.holderContainer)}>
      <div className={styles.listContainer}>
        {history.map((item, index) => {
          if (item.showExplorer) {
            return (
              <div key={index} className={styles.explorerContainer}>
                <div className={styles.explorerContent} onClick={onGoExplorer}>
                  <p className={styles.explorerTitle}>
                    {i18n.t("goToExplorer")}
                  </p>
                  <img src="/img/icon_link.svg" />
                </div>
              </div>
            );
          }
          return (
            <TxItem
              txData={item}
              index={index}
              key={index}
              currentAccount={accountInfo.currentAccount}
              onClickSpeedUp={onClickSpeedUp}
              onClickCancel={onClickCancel}
            />
          );
        })}
      </div>
      <TransactionModal
        title={modalTitle}
        modalContent={modalDesc}
        modalVisible={transactionModalStatus}
        currentFee={currentFee}
        currentNonce={transactionModalData?.nonce}
        nextFee={nextFee}
        modalType={modalType}
        onClickClose={onClickClose}
        onConfirm={onClickConfirm}
        btnLoading={btnLoading}
        waitingLedger={waitLedgerStatus}
      />
      <LedgerInfoModal
        modalVisible={ledgerModalStatus}
        onClickClose={() => setLedgerModalStatus(false)}
        onConfirm={onLedgerInfoModalConfirm}
      />
    </div>
  );
};

const TX_STATUS = {
  PENDING: "PENDING",
  SUCCESS: "applied",
  FAILED: "failed",
};

const TxItem = ({
  txData,
  currentAccount,
  index,
  onClickSpeedUp,
  onClickCancel,
}) => {
  const {
    statusIcon,
    showAddress,
    timeInfo,
    amount,
    statusText,
    statusStyle,
    showPendTx,
  } = useMemo(() => {
    let isReceive = true;
    let statusIcon,
      showAddress,
      timeInfo,
      amount,
      statusText,
      statusStyle = "";
    const txKindLow = txData.kind?.toLowerCase();
    if (txKindLow === "payment") {
      isReceive =
        txData.to.toLowerCase() === currentAccount.address.toLowerCase();
      statusIcon = isReceive ? "/img/tx_receive.svg" : "/img/tx_send.svg";
    } else if (txKindLow === "stake_delegation" || txKindLow === "delegation") {
      isReceive = false;
      statusIcon = "/img/tx_pending.svg";
    } else if (txKindLow === "zkapp") {
      isReceive = false;
      statusIcon = "/img/tx_history_zkapp.svg";
    } else {
      statusIcon = "/img/tx_pending.svg";
    }
    showAddress = addressSlice(isReceive ? txData.from : txData.to, 8);
    showAddress = !showAddress ? txData.kind.toUpperCase() : showAddress;
    timeInfo =
      txData.status === TX_STATUS.PENDING
        ? "Nonce " + txData.nonce
        : getShowTime(txData.dateTime);

    amount = amountDecimals(txData.amount, MAIN_COIN_CONFIG.decimals);
    amount = getDisplayAmount(amount, 2);
    amount = isReceive ? "+" + amount : "-" + amount;

    if (txKindLow === "zkapp") {
      amount = "0";
    }

    let showPendTx = false;

    if (txData.status === TX_STATUS.PENDING) {
      statusStyle = styles.itemStatus_Pending;
      showPendTx = true;
      statusText = i18n.t(txData.status && txData.status.toUpperCase());
    } else {
      if (txData.failureReason) {
        statusStyle = styles.itemStatus_Failed;
        statusText = i18n.t("FAILED");
      } else {
        statusStyle = styles.itemStatus_Success;
        statusText = i18n.t("APPLIED");
      }
    }

    return {
      statusIcon,
      showAddress,
      timeInfo,
      amount,
      statusText,
      statusStyle,
      showPendTx,
    };
  }, [txData, i18n]);
  const [showPendingAction, setShowPendingAction] = useState(false);

  useEffect(() => {
    if (
      txData.status === TX_STATUS.PENDING &&
      txData.from === currentAccount.address
    ) {
      if (
        currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER &&
        txData.kind?.toLowerCase() === "zkapp"
      ) {
        setShowPendingAction(false);
      } else {
        setShowPendingAction(true);
      }
    } else {
      setShowPendingAction(false);
    }
  }, [txData, currentAccount]);

  const history = useHistory();
  const onToDetail = useCallback(() => {
    history.push({
      pathname: "/record_page",
      params: { txDetail: txData },
    });
  }, [txData]);
  const paddingLineStyle = useMemo(() => {
    return index !== 0;
  }, [index]);
  const onClickItemSpeedUp = useCallback(
    (e) => {
      onClickSpeedUp(txData);
      e.stopPropagation();
    },
    [txData]
  );
  const onClickItemCancel = useCallback(
    (e) => {
      onClickCancel(txData);
      e.stopPropagation();
    },
    [txData]
  );

  return (
    <div
      onClick={onToDetail}
      className={cls(styles.txItemCon, {
        [styles.pendingCls]: showPendTx,
      })}
    >
      <div
        className={cls(styles.dividedLine, {
          [styles.paddingLine]: paddingLineStyle,
        })}
      />
      <div
        className={cls(styles.itemContainer, {
          [styles.pendingContent]: showPendTx,
        })}
      >
        <div className={styles.itemLeftContainer}>
          <img src={statusIcon} />
          <div className={styles.itemAccount}>
            <p className={styles.itemAccountAddress}>
              {showAddress}
              {txData.isFromAddressScam && (
                <span className={styles.scamTag}>{i18n.t("scam")}</span>
              )}
            </p>
            <p className={styles.itemAccountInfo}>{timeInfo}</p>
          </div>
        </div>
        <div className={styles.itemRightContainer}>
          <p className={styles.itemAmount}> {amount} </p>
          <div className={cls(styles.itemStatus, statusStyle)}>
            {statusText}
          </div>
        </div>
      </div>
      {showPendingAction && (
        <div className={styles.speedBtnGroup}>
          {txData.showSpeedUp && (
            <Button
              onClick={onClickItemSpeedUp}
              withEvent={true}
              className={styles.speedBtn}
            >
              {i18n.t("speedUp")}
            </Button>
          )}
          <Button
            onClick={onClickItemCancel}
            withEvent={true}
            className={cls(styles.cancelBtn, styles.speedBtn)}
          >
            {i18n.t("cancel")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default TxListView;
