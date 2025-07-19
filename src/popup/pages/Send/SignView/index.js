import { MAIN_COIN_CONFIG } from "@/constant";
import { ACCOUNT_TYPE } from "@/constant/commonType";
import {
  DAPP_ACTION_SIGN_MESSAGE,
  QA_SIGN_TRANSACTION,
} from "@/constant/msgTypes";
import { TOKEN_BUILD } from "@/constant/tokenMsgTypes";
import Button, { button_size, button_theme } from "@/popup/component/Button";
import DAppAdvance from "@/popup/component/DAppAdvance";
import DappWebsite from "@/popup/component/DappWebsite";
import NetworkStatusView from "@/popup/component/StatusView/NetworkStatusView";
import Toast from "@/popup/component/Toast";
import { sendMsg } from "@/utils/commonMsg";
import {
  addressSlice,
  amountDecimals,
  getBalanceForUI,
  getRealErrorMsg,
  isNaturalNumber,
  isNumber,
  trimSpace,
} from "@/utils/utils";
import {
  copyText,
} from "@/utils/browserUtils";
import { DAppActions } from "@aurowallet/mina-provider";
import BigNumber from "bignumber.js";
import cls from "classnames";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "./index.module.scss";
import { updateShouldRequest } from "../../../../reducers/accountReducer";

const TX_CLICK_TYPE = {
  CONFIRM: "TX_CLICK_TYPE_CONFIRM",
  CANCEL: "TX_CLICK_TYPE_CANCEL",
};

const SignView = ({
  signParams,
  showMultiView,
  onRemoveTx,
  inferredNonce,
  advanceData,
  onUpdateAdvance,
}) => {
  const dispatch = useDispatch();
  const currentAccount = useSelector(
    (state) => state.accountInfo.currentAccount
  );
  const mainTokenNetInfo = useSelector(
    (state) => state.accountInfo.mainTokenNetInfo
  );
  const tokenList = useSelector((state) => state.accountInfo.tokenList);

  const [advanceStatus, setAdvanceStatus] = useState(false);
  const [feeValue, setFeeValue] = useState("");
  const [nonceValue, setNonceValue] = useState("");
  const [feeErrorTip, setFeeErrorTip] = useState("");
  const [btnLoading, setBtnLoading] = useState(false);

  const [advanceFee, setAdvanceFee] = useState("");
  const [advanceNonce, setAdvanceNonce] = useState("");

  const {
    sendAction,
    currentAdvanceData,
    tokenDecimal,
    receiveAddress,
    sender,
    nextMemo,
    showAmount,
    pageTitle,
    currentToken,
    availableBalance,
    sourceFee,
  } = useMemo(() => {
    let sendAction = signParams?.params?.action || "";
    let id = signParams?.id || "";
    let currentAdvanceData = advanceData[id] || {};

    const buildData = signParams?.params?.buildData ?? {};
    const showSymbol = buildData.symbol ?? "UNKNOWN";
    const tokenDecimal = buildData.decimals ?? 0;
    const receiveAddress = buildData.receiver;
    const sender = buildData.sender;
    const nextMemo = buildData.memo ?? "";
    let showAmount = getBalanceForUI(
      buildData.amount,
      tokenDecimal,
      tokenDecimal
    );
    showAmount = showAmount + " " + showSymbol;
    const sourceFee = amountDecimals(buildData.fee, MAIN_COIN_CONFIG.decimals);

    let pageTitle = i18n.t("send") + " " + showSymbol;
    let currentToken = tokenList.find(
      (tokenItem) => tokenItem.tokenId === buildData.tokenId
    );
    let availableBalance = currentToken?.tokenBaseInfo?.showBalance || 0;
    return {
      sendAction,
      currentAdvanceData,
      tokenDecimal,
      receiveAddress,
      sender,
      nextMemo,
      showAmount,
      pageTitle,
      currentToken,
      availableBalance,
      sourceFee,
    };
  }, [signParams, advanceData, tokenList]);

  useEffect(() => {
    setFeeValue(sourceFee);
  }, [sourceFee]);
  useEffect(() => {
    if (isNumber(currentAdvanceData.fee)) {
      setFeeValue(currentAdvanceData.fee);
    }
    if (isNaturalNumber(currentAdvanceData.nonce)) {
      setNonceValue(currentAdvanceData.nonce);
    }
  }, [currentAdvanceData]);

  const onCancel = useCallback(() => {
    sendMsg(
      {
        action: TOKEN_BUILD.requestSign,
        payload: {
          cancel: true,
          resultOrigin: signParams.site?.origin,
          id: signParams.id,
        },
      },
      async (params) => {
        onRemoveTx(signParams.id);
      }
    );
  }, [currentAccount, signParams, sendAction, onRemoveTx]);

  const onSubmitSuccess = useCallback(
    (data, nonce, type) => {
      if (data.error) {
        let errorMessage = i18n.t("postFailed");
        let realMsg = getRealErrorMsg(data.error);
        errorMessage = realMsg ? realMsg : errorMessage;
        Toast.info(errorMessage, 5 * 1000);
        return;
      } else {
        let resultAction = TOKEN_BUILD.requestSign;
        let payload = {};
        payload.resultOrigin = signParams?.site?.origin;
        payload.id = signParams.id;
        payload.hash = data.hash;
        resultAction = TOKEN_BUILD.requestSign;
        dispatch(updateShouldRequest(true, true));
        sendMsg(
          {
            action: resultAction,
            payload: payload,
          },
          async (params) => {
            onRemoveTx(signParams.id, TX_CLICK_TYPE.CONFIRM, nonce);
          }
        );
      }
    },
    [signParams, sendAction, onRemoveTx]
  );

  const clickNextStep = useCallback(async () => {
    if (currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER) {
      Toast.info(i18n.t("notSupportNow"));
      sendMsg(
        {
          action: DAPP_ACTION_SIGN_MESSAGE,
          payload: { error: "Not supported yet" },
        },
        async (params) => {}
      );
      return;
    }

    let { params } = signParams;
    let validNonce = nonceValue || inferredNonce;
    let nonce = trimSpace(validNonce);

    let toAddress = receiveAddress;
    let fee = trimSpace(feeValue);
    let memo = nextMemo;
    let fromAddress = sender;

    let payload = {
      fromAddress,
      toAddress,
      nonce,
      currentAccount,
      fee,
      memo,
    };

    payload.transaction = JSON.stringify(params.result);
    setBtnLoading(true);
    let connectAction = QA_SIGN_TRANSACTION;
    payload.sendAction = DAppActions.mina_sendTransaction;
    sendMsg(
      {
        action: connectAction,
        payload,
      },
      (data) => {
        setBtnLoading(false);
        onSubmitSuccess(data, payload.nonce);
      }
    );
  }, [
    currentAccount,
    signParams,
    nonceValue,
    feeValue,
    onSubmitSuccess,
    sendAction,
    inferredNonce,
    receiveAddress,
    sender,
  ]);

  const onConfirm = useCallback(async () => {
    if (sender !== currentAccount.address) {
      Toast.info(i18n.t('updateAccount'));
      return; 
    }
    const buildData = signParams?.params?.buildData ?? {};
    let validNonce = nonceValue || inferredNonce;
    let nonce = trimSpace(validNonce) || "";
    if (nonce.length > 0 && !isNumber(nonce)) {
      Toast.info(i18n.t("waitNonce"));
      return;
    }
    let fee = trimSpace(feeValue);
    if (fee.length > 0 && !isNumber(fee)) {
      Toast.info(i18n.t("inputFeeError"));
      return;
    }
    const sendAmount = buildData.amount;
    let amount = amountDecimals(sendAmount,tokenDecimal)

    let mainTokenBalance = mainTokenNetInfo.tokenBaseInfo.showBalance;
    if (
      new BigNumber(fee).gt(mainTokenBalance) ||
      new BigNumber(amount).gt(availableBalance)
    ) {
      Toast.info(i18n.t("balanceNotEnough"));
      return;
    }
    clickNextStep();
  }, [
    i18n,
    currentAccount,
    signParams,
    mainTokenNetInfo,
    nonceValue,
    feeValue,
    clickNextStep,
    inferredNonce,
    sender,
    availableBalance,
    tokenDecimal
  ]);

  const onClickAdvance = useCallback(() => {
    setAdvanceStatus((state) => !state);
  }, []);
  const onClickClose = useCallback(() => {
    setAdvanceStatus(false);
  }, []);

  const onFeeInput = useCallback(
    (e) => {
      setAdvanceFee(e.target.value);
      if (BigNumber(e.target.value).gt(10)) {
        setFeeErrorTip(i18n.t("feeTooHigh"));
      } else {
        setFeeErrorTip("");
      }
    },
    [i18n]
  );
  const onNonceInput = useCallback((e) => {
    setAdvanceNonce(e.target.value);
  }, []);

  const onConfirmAdvance = useCallback(() => {
    if (advanceFee) {
      setFeeValue(advanceFee);
    }
    if (advanceNonce) {
      setNonceValue(advanceNonce);
    }
    setAdvanceStatus(false);
    onUpdateAdvance({
      id: signParams.id,
      fee: advanceFee,
      nonce: advanceNonce,
    });
  }, [advanceFee, advanceNonce, onUpdateAdvance, signParams]);

  const checkFeeHigh = useCallback(() => {
    let checkFee = feeValue;
    if (BigNumber(checkFee).gt(10)) {
      setFeeErrorTip(i18n.t("feeTooHigh"));
    } else {
      setFeeErrorTip("");
    }
  }, [feeValue, i18n, signParams]);

  useEffect(() => {
    checkFeeHigh();
  }, [feeValue]);

  return (
    <section className={styles.sectionSign}>
      <div className={styles.titleRow}>
        <p className={styles.title}>{pageTitle}</p>
        <div className={styles.titleRight}>
          <div style={{ marginRight: "6px" }} />
          <NetworkStatusView />
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.websiteContainer}>
          <DappWebsite
            siteIcon={signParams?.site?.webIcon}
            siteUrl={signParams?.site?.origin}
          />
        </div>

        <>
          <CommonRow
            leftTitle={currentAccount.accountName}
            leftContent={addressSlice(sender, 6, 6)}
            rightTitle={i18n.t("to")}
            rightContent={addressSlice(receiveAddress, 6)}
            leftCopyContent={currentAccount.address}
            rightCopyContent={receiveAddress}
            showArrow={true}
          />

          <CommonRow leftTitle={i18n.t("amount")} leftContent={showAmount} />
          {nextMemo && <CommonRow leftTitle={"Memo"} leftContent={nextMemo} />}
          <div className={styles.accountRow}>
            <div className={styles.rowLeft}>
              <p className={styles.rowTitle}>{i18n.t("transactionFee")}</p>
              <div className={styles.feeCon}>
                <p className={cls(styles.rowContent, styles.feeContent)}>
                  {feeValue + " " + MAIN_COIN_CONFIG.symbol}
                </p>
              </div>
            </div>
            <div className={styles.modeWrapper}>
              <p className={styles.rowPurpleContent} onClick={onClickAdvance}>
                {i18n.t("advanceMode")}
              </p>
            </div>
          </div>
          <div className={styles.highFeeTip}>{feeErrorTip}</div>
        </>
      </div>
      <div
        className={cls(styles.btnGroup, {
          [styles.multiBottomBtn]: showMultiView,
        })}
      >
        <Button
          onClick={onCancel}
          theme={button_theme.BUTTON_THEME_LIGHT}
          size={button_size.middle}
        >
          {i18n.t("cancel")}
        </Button>
        <Button
          loading={btnLoading}
          size={button_size.middle}
          onClick={onConfirm}
        >
          {i18n.t("confirm")}
        </Button>
      </div>
      <DAppAdvance
        modalVisible={advanceStatus}
        title={i18n.t("advanceMode")}
        onClickClose={onClickClose}
        feeValue={advanceFee}
        feePlaceHolder={feeValue}
        onFeeInput={onFeeInput}
        nonceValue={advanceNonce}
        onNonceInput={onNonceInput}
        onConfirm={onConfirmAdvance}
        feeErrorTip={feeErrorTip}
      />
    </section>
  );
};

const CommonRow = ({
  leftTitle = "",
  leftContent = "",
  leftDescContent = "",
  rightTitle = " ",
  rightContent = "",
  leftCopyContent = "",
  rightCopyContent = "",
  showArrow = false,
  toTypeName = "",
}) => {
  const { leftCopyAble, rightCopyAble } = useMemo(() => {
    const leftCopyAble = !!leftCopyContent;
    const rightCopyAble = !!rightCopyContent;
    return {
      leftCopyAble,
      rightCopyAble,
    };
  }, [leftCopyContent, rightCopyContent]);

  const onClickLeft = useCallback(() => {
    if (leftCopyAble) {
      copyText(leftCopyContent).then(() => {
        Toast.info(i18n.t("copySuccess"));
      });
    }
  }, [leftCopyAble, leftCopyContent, i18n]);
  const onClickRight = useCallback(() => {
    if (rightCopyAble) {
      copyText(rightCopyContent).then(() => {
        Toast.info(i18n.t("copySuccess"));
      });
    }
  }, [rightCopyAble, rightCopyContent, i18n]);

  return (
    <div className={styles.accountRow}>
      <div className={styles.rowLeft}>
        <p className={styles.rowTitle}>{leftTitle}</p>
        <p
          className={cls(styles.rowContent, {
            [styles.copyCss]: leftCopyAble,
          })}
          onClick={onClickLeft}
        >
          {leftContent}
          <span className={styles.rowDescContent}>{leftDescContent}</span>
        </p>
      </div>
      {showArrow && (
        <div className={styles.rowArrow}>
          <img src="/img/icon_arrow_purple.svg" />
        </div>
      )}
      <div className={styles.rowRight}>
        <div className={styles.rightWrapper}>
          {toTypeName && <div className={styles.typeRow}>{toTypeName}</div>}
          <p className={cls(styles.rowTitle, styles.rightTitle)}>
            {rightTitle}
          </p>
        </div>
        <p
          className={cls(styles.rowContent, {
            [styles.copyCss]: rightCopyAble,
          })}
          onClick={onClickRight}
        >
          {rightContent}
        </p>
      </div>
    </div>
  );
};

export default SignView;
