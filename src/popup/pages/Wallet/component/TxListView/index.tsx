import ledgerManager from "@/utils/ledger";
import { getZkAppUpdateInfo } from "@/utils/zkUtils";
import { DAppActions } from "@aurowallet/mina-provider";
import BigNumber from "bignumber.js";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { sendStakeTx, sendTx } from "../../../../../background/api";
import { MAIN_COIN_CONFIG, ZK_DEFAULT_TOKEN_ID } from "../../../../../constant";
import {
  ACCOUNT_TYPE,
  LEDGER_STATUS,
} from "../../../../../constant/commonType";
import {
  QA_SIGN_TRANSACTION,
  WALLET_CHECK_TX_STATUS,
} from "../../../../../constant/msgTypes";
import { updateShouldRequest } from "../../../../../reducers/accountReducer";
import { updateLedgerConnectStatus } from "../../../../../reducers/ledger";
import { openTab, sendMsg } from "../../../../../utils/commonMsg";
import {
  addressSlice,
  amountDecimals,
  decodeMemo,
  getBalanceForUI,
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
import type {
  TxData,
  TokenInfo,
  AccountInfo,
  FeeRecommendItem,
} from "../../../../../types/tx.types";
import type { RootState } from "@/reducers";
import { TX_STATUS } from "../../../../../types/tx.types";
import type { TxStatusStyle } from "./index.styled";
import {
  StyledHistoryContainer,
  StyledHolderContainer,
  StyledListContainer,
  StyledExplorerContainer,
  StyledExplorerContent,
  StyledExplorerTitle,
  StyledTxItemCon,
  StyledDividedLine,
  StyledItemContainer,
  StyledItemLeftContainer,
  StyledItemAccount,
  StyledItemAccountAddress,
  StyledScamTag,
  StyledItemAccountInfo,
  StyledItemRightContainer,
  StyledItemAmount,
  StyledItemStatus,
  StyledSpeedBtnGroup,
  StyledSpeedBtn,
  StyledCancelBtn,
} from "./index.styled";

// ============ Component Props Interfaces ============

interface TxListViewProps {
  history?: TxData[];
  tokenInfo?: TokenInfo;
}

interface TxItemProps {
  txData: TxData;
  currentAccount: AccountInfo | { address?: string; type?: string; hdPath?: string; accountName?: string };
  index: number;
  onClickSpeedUp: (txData: TxData) => void;
  onClickCancel: (txData: TxData) => void;
  tokenInfo: TokenInfo;
}

// ============ Internal Types ============

interface TransactionPayload {
  amount?: number | string;
  fee: string | number;
  nonce: number;
  toAddress: string;
  fromAddress: string;
  memo?: string;
  sendAction: string;
  isSpeedUp?: boolean;
  isResend?: boolean;
  transaction?: string;
}

interface SendMsgPayload {
  action: string;
  payload: TransactionPayload;
}

interface TxSubmitResponse {
  error?: {
    message?: string;
  };
  sendPayment?: {
    payment?: {
      id?: string;
      hash?: string;
    };
  };
}

interface LedgerSignResult {
  rejected?: boolean;
  error?: {
    message?: string;
  };
  payload?: TransactionPayload;
  signature?: string;
}

// ============ Main Component ============

const TxListView: React.FC<TxListViewProps> = ({
  history = [],
  tokenInfo = {},
}) => {
  const dispatch = useDispatch();

  const accountInfo = useSelector((state: RootState) => state.accountInfo);
  const netConfig = useSelector((state: RootState) => state.network);
  const netFeeList = useSelector(
    (state: RootState) => state.cache.feeRecommend
  );
  const ledgerStatus = useSelector(
    (state: RootState) => state.ledger.ledgerConnectStatus
  );

  const onGoExplorer = useCallback(() => {
    const currentNode = netConfig.currentNode;
    const url =
      currentNode.explorer +
      "/account/" +
      accountInfo.currentAccount.address +
      "/txs";
    openTab(url);
  }, [netConfig, accountInfo]);

  const isLedgerAccount = useMemo<boolean>(() => {
    return accountInfo.currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER;
  }, [accountInfo]);

  const [transactionModalStatus, setTransactionModalStatus] =
    useState<boolean>(false);
  const [modalType, setModalType] = useState<string>();
  const [transactionModalData, setTransactionModalData] = useState<TxData>(
    {} as TxData
  );
  const [nextFee, setNextFee] = useState<string | number>("");
  const [currentFee, setCurrentFee] = useState<string>("");
  const [btnLoading, setBtnLoading] = useState<boolean>(false);

  const [ledgerModalStatus, setLedgerModalStatus] = useState<boolean>(false);
  const [waitLedgerStatus, setWaitLedgerStatus] = useState<boolean>(false);

  const { nextNetFee } = useMemo<{ nextNetFee: string | number }>(() => {
    let nextNetFee: string | number = "";
    if (Array.isArray(netFeeList)) {
      const tempFeeList = netFeeList.filter((item: FeeRecommendItem) => {
        return item.desc === "speedup";
      });
      if (tempFeeList.length >= 1) {
        nextNetFee = tempFeeList[0]?.value ?? "";
      }
    }
    return {
      nextNetFee,
    };
  }, [transactionModalData, netFeeList]);

  const setCurrentTransactionFee = useCallback((txData: TxData): string => {
    let fee = txData?.fee ?? "";
    if (isNumber(fee)) {
      fee = amountDecimals(fee, MAIN_COIN_CONFIG.decimals);
    }
    setCurrentFee(String(fee));
    return String(fee);
  }, []);

  const checkLedgerStatus = useCallback(async (): Promise<void> => {
    if (isLedgerAccount) {
      const { status } = await ledgerManager.ensureConnect();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dispatch(updateLedgerConnectStatus(status) as any);
    }
  }, [isLedgerAccount, dispatch]);

  const onClickSpeedUp = useCallback(
    async (txData: TxData): Promise<void> => {
      await checkLedgerStatus();
      setModalType(TransactionModalType.speedUp);
      setTransactionModalData(txData);

      const localFee = setCurrentTransactionFee(txData);

      const nextUpFee = new BigNumber(localFee).plus(nextNetFee).toNumber();
      setNextFee(nextUpFee);
      setCurrentTransactionFee(txData);

      setTransactionModalStatus(true);
    },
    [nextNetFee, checkLedgerStatus, setCurrentTransactionFee]
  );

  const onClickCancel = useCallback(
    async (txData: TxData): Promise<void> => {
      await checkLedgerStatus();
      setTransactionModalStatus(true);
      setModalType(TransactionModalType.cancel);
      const localFee = setCurrentTransactionFee(txData);

      const nextCancelFee = new BigNumber(localFee).plus(0.0001).toNumber();
      setNextFee(nextCancelFee);

      setTransactionModalData(txData);
    },
    [checkLedgerStatus, setCurrentTransactionFee]
  );

  const { modalTitle, modalDesc } = useMemo<{
    modalTitle: string;
    modalDesc: string;
  }>(() => {
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
  }, [modalType]);

  const onClickClose = useCallback((): void => {
    setTransactionModalStatus(false);
  }, []);

  const onSubmitTx = useCallback(
    async (data: TxSubmitResponse, type?: string): Promise<void> => {
      setBtnLoading(false);
      if (data.error) {
        let errorMessage = i18n.t("postFailed");
        const realMsg = getRealErrorMsg(data.error);
        errorMessage = realMsg ? realMsg : errorMessage;
        Toast.info(errorMessage, 5 * 1000);

        setWaitLedgerStatus(false);
        setLedgerModalStatus(false);
        setTransactionModalStatus(false);
        return;
      }
      const detail = (data.sendPayment && data.sendPayment.payment) || {};
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
          () => {},
          undefined
        );
      }
      setTransactionModalStatus(false);
    },
    [dispatch]
  );

  useEffect(() => {
    if (!transactionModalStatus) {
      setBtnLoading(false);
      setWaitLedgerStatus(false);
    }
  }, [transactionModalStatus]);

  const ledgerTransfer = useCallback(
    async (nextPayload: TransactionPayload): Promise<void> => {
      const nextAction = nextPayload.sendAction;
      setWaitLedgerStatus(true);

      const ledgerNextPayload: TransactionPayload = { ...nextPayload };
      if (modalType === TransactionModalType.cancel) {
        ledgerNextPayload.amount = 0;
      } else {
        ledgerNextPayload.memo = decodeMemo(nextPayload.memo || '');
      }

      try {
        let signResult: LedgerSignResult;
        const hdPath = typeof accountInfo.currentAccount.hdPath === 'number' 
          ? accountInfo.currentAccount.hdPath 
          : parseInt(String(accountInfo.currentAccount.hdPath || '0'), 10);
        if (nextAction === DAppActions.mina_sendStakeDelegation) {
          signResult = (await ledgerManager.signDelegation(
            ledgerNextPayload,
            hdPath
          )) as LedgerSignResult;
        } else {
          signResult = (await ledgerManager.signPayment(
            ledgerNextPayload,
            hdPath
          )) as LedgerSignResult;
        }

        if (signResult.rejected) {
          Toast.info(i18n.t("ledgerRejected"));
          setBtnLoading(false);
          return;
        }
        if (signResult.error) {
          setBtnLoading(false);
          Toast.info(signResult.error.message || "Signature failed");
          return;
        }

        const sendFunc =
          nextAction === DAppActions.mina_sendStakeDelegation
            ? sendStakeTx
            : sendTx;

        const postRes = await sendFunc(
          signResult.payload as unknown as Parameters<typeof sendTx>[0],
          { rawSignature: signResult.signature }
        );

        onSubmitTx(postRes as TxSubmitResponse, "ledger");
      } catch (err) {
        console.error("Ledger transfer failed:", err);
        const error = err as Error;
        Toast.info(error.message || "Transaction failed");
      } finally {
        setWaitLedgerStatus(false);
      }
    },
    [modalType, accountInfo.currentAccount.hdPath, onSubmitTx]
  );

  const onClickConfirm = useCallback(
    (nextInputFee: string | number): void => {
      if (isLedgerAccount && ledgerStatus !== LEDGER_STATUS.READY) {
        setLedgerModalStatus(true);
        return;
      }
      setBtnLoading(true);
      const currentAddress = accountInfo.currentAccount.address || '';
      let nextAction = "";
      let nextPayload: TransactionPayload = {} as TransactionPayload;

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
          const kind_low = transactionModalData.kind.toLowerCase();
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
                  transactionModalData.amount || 0,
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
                memo: decodeMemo(transactionModalData?.memo || ''),
              };
              break;
            default:
              break;
          }
        }
      }

      if (isLedgerAccount) {
        ledgerTransfer(nextPayload);
        return;
      }

      sendMsg<TxSubmitResponse>(
        {
          action: nextAction,
          payload: nextPayload as unknown as Record<string, unknown>,
        },
        (data: TxSubmitResponse) => {
          onSubmitTx(data);
        },
        undefined
      );
    },
    [
      transactionModalData,
      accountInfo,
      ledgerStatus,
      isLedgerAccount,
      ledgerTransfer,
      modalType,
      onSubmitTx,
    ]
  );

  const onLedgerInfoModalConfirm = useCallback(async (): Promise<void> => {
    const { status } = await (ledgerManager as any).ensureConnect();
    if (status === LEDGER_STATUS.READY) {
      setLedgerModalStatus(false);
      onClickConfirm(nextFee);
    }
  }, [nextFee, onClickConfirm]);

  return (
    <StyledHistoryContainer as={StyledHolderContainer}>
      <StyledListContainer>
        {history.map((item, index) => {
          if (item.showExplorer) {
            return (
              <StyledExplorerContainer key={index}>
                <StyledExplorerContent onClick={onGoExplorer}>
                  <StyledExplorerTitle>
                    {i18n.t("goToExplorer")}
                  </StyledExplorerTitle>
                  <img src="/img/icon_link.svg" />
                </StyledExplorerContent>
              </StyledExplorerContainer>
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
              tokenInfo={tokenInfo as TokenInfo}
            />
          );
        })}
      </StyledListContainer>
      <TransactionModal
        title={modalTitle}
        modalContent={modalDesc}
        modalVisible={transactionModalStatus}
        currentFee={currentFee}
        currentNonce={String(transactionModalData?.nonce ?? "")}
        nextFee={String(nextFee)}
        modalType={modalType}
        onClickClose={onClickClose}
        onConfirm={onClickConfirm as (nextInputFee?: string | number) => void}
        btnLoading={btnLoading}
        waitingLedger={waitLedgerStatus}
      />
      <LedgerInfoModal
        modalVisible={ledgerModalStatus}
        onClickClose={() => setLedgerModalStatus(false)}
        onConfirm={onLedgerInfoModalConfirm}
      />
    </StyledHistoryContainer>
  );
};

// ============ TxItem Component ============

const TxItem: React.FC<TxItemProps> = ({
  txData,
  currentAccount,
  index,
  onClickSpeedUp,
  onClickCancel,
  tokenInfo,
}) => {
  const {
    statusIcon,
    showAddress,
    timeInfo,
    amount,
    statusText,
    statusStyle,
    showPendTx,
  } = useMemo<{
    statusIcon: string;
    showAddress: string;
    timeInfo: string;
    amount: string;
    statusText: string;
    statusStyle: TxStatusStyle;
    showPendTx: boolean;
  }>(() => {
    let isReceive = true;
    let statusIcon: string = "";
    let showAddress: string = "";
    let timeInfo: string = "";
    let amount: string = "";
    let statusText: string = "";
    let statusStyle: TxStatusStyle = "pending";

    const txKindLow = txData.kind?.toLowerCase();
    const isMainCoin = tokenInfo?.tokenBaseInfo?.isMainToken;

    if (txKindLow === "payment") {
      const isOut =
        txData.from.toLowerCase() === (currentAccount.address || '').toLowerCase();
      isReceive = !isOut;
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

    if (!isMainCoin) {
      const accountUpdates = txData.body?.zkappCommand?.accountUpdates;
      const result = getZkAppUpdateInfo(
        accountUpdates as Parameters<typeof getZkAppUpdateInfo>[0],
        currentAccount.address || '',
        txData.from,
        tokenInfo.tokenId || ''
      );
      const tokenDecimal = tokenInfo?.tokenBaseInfo?.decimals;
      amount = getBalanceForUI(result.totalBalanceChange, tokenDecimal, 4);
      amount = (result.symbol || '') + amount;
      const isZkReceive = result.symbol !== "-";
      statusIcon = isZkReceive ? "/img/tx_receive.svg" : "/img/tx_send.svg";
      showAddress = (isZkReceive
        ? addressSlice(result.from || '', 8)
        : addressSlice(result.to || '', 8)) || '';
    } else {
      if (isMainCoin && txKindLow === "zkapp") {
        const accountUpdates = txData.body?.zkappCommand?.accountUpdates;
        const result = getZkAppUpdateInfo(
          accountUpdates as Parameters<typeof getZkAppUpdateInfo>[0],
          currentAccount.address || '',
          txData.from,
          ZK_DEFAULT_TOKEN_ID
        );

        amount = getBalanceForUI(
          result.totalBalanceChange,
          MAIN_COIN_CONFIG.decimals,
          4
        );
        amount = (result.symbol || '') + amount;
        if (result.symbol === "-") {
          showAddress = addressSlice(result.to || '', 8) || '';
        } else if (result.symbol === "+") {
          showAddress = addressSlice(result.from || '', 8) || '';
        } else {
          showAddress = addressSlice(result.to || '', 8) || '';
        }
      }
    }

    if (!showAddress) {
      showAddress = addressSlice(isReceive ? txData.from : txData.to || '', 8) || '';
      showAddress = !showAddress
        ? (txData.kind?.toUpperCase() ?? "")
        : showAddress;
    }

    if (!amount) {
      amount = getBalanceForUI(txData.amount || 0, MAIN_COIN_CONFIG.decimals, 4);
      amount = isReceive ? "+" + amount : "-" + amount;
      if (txKindLow === "zkapp") {
        amount = "0";
      }
    }

    timeInfo =
      txData.status === TX_STATUS.PENDING
        ? "Nonce " + txData.nonce
        : getShowTime(txData.dateTime);

    let showPendTx = false;

    if (txData.status === TX_STATUS.PENDING) {
      statusStyle = "pending";
      showPendTx = true;
      statusText = i18n.t(txData.status && txData.status.toUpperCase());
    } else {
      if (txData.failureReason) {
        statusStyle = "failed";
        statusText = i18n.t("FAILED");
      } else {
        statusStyle = "success";
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
  }, [txData, tokenInfo, currentAccount]);

  const [showPendingAction, setShowPendingAction] = useState<boolean>(false);

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

  const navigate = useNavigate();

  const onToDetail = useCallback((): void => {
    navigate("/record_page", { state: { txDetail: txData, tokenInfo } });
  }, [txData, tokenInfo, navigate]);

  const paddingLineStyle = useMemo<boolean>(() => {
    return index !== 0;
  }, [index]);

  const onClickItemSpeedUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): void => {
      onClickSpeedUp(txData);
      e.stopPropagation();
    },
    [txData, onClickSpeedUp]
  );

  const onClickItemCancel = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): void => {
      onClickCancel(txData);
      e.stopPropagation();
    },
    [txData, onClickCancel]
  );

  return (
    <StyledTxItemCon onClick={onToDetail} $isPending={showPendTx}>
      <StyledDividedLine $paddingLine={paddingLineStyle} />
      <StyledItemContainer $isPending={showPendTx}>
        <StyledItemLeftContainer>
          <img src={statusIcon} />
          <StyledItemAccount>
            <StyledItemAccountAddress>
              {showAddress}
              {txData.isFromAddressScam && (
                <StyledScamTag>{i18n.t("scam")}</StyledScamTag>
              )}
            </StyledItemAccountAddress>
            <StyledItemAccountInfo>{timeInfo}</StyledItemAccountInfo>
          </StyledItemAccount>
        </StyledItemLeftContainer>
        <StyledItemRightContainer>
          <StyledItemAmount>{amount}</StyledItemAmount>
          <StyledItemStatus $status={statusStyle}>
            {statusText}
          </StyledItemStatus>
        </StyledItemRightContainer>
      </StyledItemContainer>
      {showPendingAction && (
        <StyledSpeedBtnGroup>
          {txData.showSpeedUp && (
            <StyledSpeedBtn onClick={onClickItemSpeedUp}>
              {i18n.t("speedUp")}
            </StyledSpeedBtn>
          )}
          <StyledCancelBtn onClick={onClickItemCancel}>
            {i18n.t("cancel")}
          </StyledCancelBtn>
        </StyledSpeedBtnGroup>
      )}
    </StyledTxItemCon>
  );
};

export default TxListView;
