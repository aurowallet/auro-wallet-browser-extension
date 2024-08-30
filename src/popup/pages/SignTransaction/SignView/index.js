import { sendStakeTx, sendTx } from "@/background/api";
import { MAIN_COIN_CONFIG } from "@/constant";
import { ACCOUNT_TYPE, LEDGER_STATUS } from "@/constant/commonType";
import {
  DAPP_ACTION_CREATE_NULLIFIER,
  DAPP_ACTION_SEND_TRANSACTION,
  DAPP_ACTION_SIGN_MESSAGE,
  QA_SIGN_TRANSACTION,
  WALLET_CHECK_TX_STATUS,
  WALLET_SEND_FIELDS_MESSAGE_TRANSACTION,
  WALLET_SEND_NULLIFIER,
} from "@/constant/msgTypes";
import Button, { button_size, button_theme } from "@/popup/component/Button";
import { ConfirmModal } from "@/popup/component/ConfirmModal";
import DAppAdvance from "@/popup/component/DAppAdvance";
import DappWebsite from "@/popup/component/DappWebsite";
import { LedgerInfoModal } from "@/popup/component/LedgerInfoModal";
import LedgerStatusView from "@/popup/component/StatusView/LedgerStatusView";
import NetworkStatusView from "@/popup/component/StatusView/NetworkStatusView";
import Tabs from "@/popup/component/Tabs";
import Toast from "@/popup/component/Toast";
import { updateLedgerConnectStatus } from "@/reducers/ledger";
import { sendMsg } from "@/utils/commonMsg";
import {
  getLedgerStatus,
  requestSignDelegation,
  requestSignPayment,
} from "@/utils/ledger";
import {
  addressSlice,
  copyText,
  exportFile,
  getRealErrorMsg,
  isNaturalNumber,
  isNumber,
  toNonExponential,
  trimSpace,
} from "@/utils/utils";
import { addressValid } from "@/utils/validator";
import { getAccountUpdateCount, getZkFee, getZkInfo } from "@/utils/zkUtils";
import { DAppActions } from "@aurowallet/mina-provider";
import BigNumber from "bignumber.js";
import cls from "classnames";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { TypeRowInfo } from "../TypeRowInfo";
import styles from "./index.module.scss";

const FeeTypeEnum = {
  site: "FEE_RECOMMEND_SITE",
  default: "FEE_RECOMMEND_DEFAULT",
  custom: "FEE_RECOMMEND_CUSTOM",
};

/** page click event */
const TX_CLICK_TYPE = {
  CONFIRM: "TX_CLICK_TYPE_CONFIRM",
  CANCEL: "TX_CLICK_TYPE_CANCEL",
};

/** mina sign event */
const SIGN_MESSAGE_EVENT = [
  DAppActions.mina_signMessage,
  DAppActions.mina_signFields,
  DAppActions.mina_sign_JsonMessage,
  DAppActions.mina_createNullifier,
];

const COMMON_TRANSACTION_ACTION = [
  DAppActions.mina_sendPayment,
  DAppActions.mina_sendStakeDelegation,
];

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
  const mainTokenNetInfo = useSelector((state) => state.accountInfo.mainTokenNetInfo);
  const netFeeList = useSelector((state) => state.cache.feeRecommend);

  const [advanceStatus, setAdvanceStatus] = useState(false);
  const [feeValue, setFeeValue] = useState("");
  const [feeDefault, setFeeDefault] = useState("");
  const [customFeeStatus, setCustomFeeStatus] = useState(false);
  const [feeType, setFeeType] = useState("");
  const [nonceValue, setNonceValue] = useState("");
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [feeErrorTip, setFeeErrorTip] = useState("");
  const [btnLoading, setBtnLoading] = useState(false);
  const [ledgerModalStatus, setLedgerModalStatus] = useState(false);

  const [confirmModalStatus, setConfirmModalStatus] = useState(false);
  const [isLedgerAccount, setIsLedgerAccount] = useState(false);

  const [showRawData, setShowRawData] = useState(false);
  const [showRawDetail, setShowRawDetail] = useState(false);

  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const [advanceFee, setAdvanceFee] = useState("");
  const [advanceNonce, setAdvanceNonce] = useState("");
  const [ledgerApp, setLedgerApp] = useState();

  const {
    sendAction,
    siteRecommendFee,
    currentAdvanceData,
    transactionTypeName,
  } = useMemo(() => {
    let sendAction = signParams?.params?.action || "";
    const body = signParams?.params?.transaction;
    const zkFee = getZkFee(body);
    let siteFee =
      zkFee || signParams?.params?.feePayer?.fee || signParams?.params?.fee || "";
    let siteRecommendFee = isNumber(siteFee) ? siteFee + "" : "";
    let id = signParams?.id || "";
    let currentAdvanceData = advanceData[id] || {};
    let transactionTypeName = "";
    switch (sendAction) {
      case DAppActions.mina_sendPayment:
        transactionTypeName = "Payment";
        break;
      case DAppActions.mina_sendStakeDelegation:
        transactionTypeName = "Delegation";
        break;
      case DAppActions.mina_sendTransaction:
        transactionTypeName = "zkApp";
        break;
      default:
        break;
    }
    return {
      sendAction,
      siteRecommendFee,
      currentAdvanceData,
      transactionTypeName,
    };
  }, [signParams, advanceData]);

  const { isSendZk, zkSourceData, zkFormatData,zkOnlySign,defaultRecommandFee } = useMemo(() => {
    const isSendZk = sendAction === DAppActions.mina_sendTransaction;
    let zkShowData = "",
      zkSourceData = "",
      zkFormatData = [],
      count = 0;
    
    if (isSendZk) {
      zkShowData = signParams.params?.transaction;
      try {
        zkFormatData = getZkInfo(zkShowData, currentAccount.address);
        zkSourceData = JSON.stringify(JSON.parse(zkShowData), null, 2);
        count = getAccountUpdateCount(zkShowData)  
      } catch (error) {}
    }
    let zkOnlySign = (signParams?.params?.onlySign && isSendZk);

    
    let defaultRecommandFee = 0.1
    if(netFeeList.length >= 2){
      defaultRecommandFee = netFeeList[1].value
    }
    if(isSendZk && netFeeList.length >= 6){
      const zkAccountFee = new BigNumber(netFeeList[5].value).multipliedBy(count)
      defaultRecommandFee = new BigNumber(netFeeList[1].value).plus(zkAccountFee).toNumber()
    }
    return {
      isSendZk,
      zkSourceData,
      zkFormatData,
      zkOnlySign,
      defaultRecommandFee
    };
  }, [sendAction, signParams, currentAccount,netFeeList]);

  useEffect(() => {
    if (isNumber(currentAdvanceData.fee)) {
      setCustomFeeStatus(true);
      setFeeValue(currentAdvanceData.fee);
    }
    if (isNaturalNumber(currentAdvanceData.nonce)) {
      setNonceValue(currentAdvanceData.nonce);
    }
  }, [currentAdvanceData]);

  useEffect(() => {
    setIsLedgerAccount(currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER);
  }, [currentAccount]);

  const onSelectedTab = useCallback((tabIndex) => {
    setSelectedTabIndex(tabIndex);
  }, []);

  const onCancel = useCallback(() => {
    let resultAction = "";
    switch (sendAction) {
      case DAppActions.mina_sendStakeDelegation:
      case DAppActions.mina_sendPayment:
      case DAppActions.mina_sendTransaction:
        resultAction = DAPP_ACTION_SEND_TRANSACTION;
        break;
      case DAppActions.mina_signMessage:
      case DAppActions.mina_signFields:
      case DAppActions.mina_sign_JsonMessage:
        resultAction = DAPP_ACTION_SIGN_MESSAGE;
        break;
      case DAppActions.mina_createNullifier:
        resultAction = DAPP_ACTION_CREATE_NULLIFIER;
        break;
      default:
        break;
    }
    sendMsg(
      {
        action: resultAction,
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
        let resultAction = "";
        let payload = {};
        let id = "";
        payload.resultOrigin = signParams?.site?.origin;
        payload.id = signParams.id;
        switch (sendAction) {
          case DAppActions.mina_sendStakeDelegation:
            payload.hash = data.sendDelegation.delegation.hash;
            id = data.sendDelegation.delegation.id;
            resultAction = DAPP_ACTION_SEND_TRANSACTION;
            break;
          case DAppActions.mina_sendPayment:
            payload.hash = data.sendPayment.payment.hash;
            id = data.sendPayment.payment.id;
            resultAction = DAPP_ACTION_SEND_TRANSACTION;
            break;
          case DAppActions.mina_signMessage:
          case DAppActions.mina_signFields:
          case DAppActions.mina_sign_JsonMessage:
            payload = {
              ...payload,
              ...data,
            };
            resultAction = DAPP_ACTION_SIGN_MESSAGE;
            break;
          case DAppActions.mina_sendTransaction:
            if(zkOnlySign){
              payload.signedData = JSON.stringify(data);
            }else{
              payload.hash = data.hash;
            }
            resultAction = DAPP_ACTION_SEND_TRANSACTION;
            break;
          case DAppActions.mina_createNullifier:
            payload = {
              ...payload,
              ...data,
            };
            resultAction = DAPP_ACTION_CREATE_NULLIFIER;
            break;
          default:
            break;
        }
        if (type === "ledger" && id && payload.hash) {
          sendMsg(
            {
              action: WALLET_CHECK_TX_STATUS,
              payload: {
                paymentId: id,
                hash: payload.hash,
              },
            },
            () => {}
          );
        }
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
    [signParams, sendAction, onRemoveTx,zkOnlySign]
  );
  useEffect(() => {
    setShowRawData(isSendZk && selectedTabIndex === 0);
  }, [isSendZk, selectedTabIndex]);

  const ledgerTransfer = useCallback(
    async (params, preLedgerApp) => {
      if (SIGN_MESSAGE_EVENT.indexOf(sendAction) !== -1) {
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
      if (COMMON_TRANSACTION_ACTION.indexOf(sendAction) === -1) {
        Toast.info(i18n.t("notSupportNow"));
        return;
      }
      const nextLedgerApp = preLedgerApp || ledgerApp;
      if (nextLedgerApp) {
        let signResult;
        let postRes;
        setConfirmModalStatus(true);
        if (sendAction === DAppActions.mina_sendPayment) {
          signResult = await requestSignPayment(
            nextLedgerApp,
            params,
            currentAccount.hdPath
          );
          const { signature, payload, error } = signResult;
          if (error) {
            setConfirmModalStatus(false);
            Toast.info(error.message);
            return;
          }
          postRes = await sendTx(payload, { rawSignature: signature }).catch(
            (error) => error
          );
        } else if (sendAction === DAppActions.mina_sendStakeDelegation) {
          signResult = await requestSignDelegation(
            nextLedgerApp,
            params,
            currentAccount.hdPath
          );
          const { signature, payload, error } = signResult;
          if (error) {
            setConfirmModalStatus(false);
            Toast.info(error.message);
            return;
          }
          postRes = await sendStakeTx(payload, {
            rawSignature: signature,
          }).catch((error) => error);
        }

        setConfirmModalStatus(false);
        onSubmitSuccess(postRes, params.nonce, "ledger");
      }
    },
    [signParams, currentAccount, sendAction]
  );

  const clickNextStep = useCallback(
    async (ledgerReady = false, preLedgerApp) => {
      let ledgerTemp = preLedgerApp;
      if (currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER) {
        if (!ledgerReady) {
          const ledger = await getLedgerStatus();
          ledgerTemp = ledger.app;
          dispatch(updateLedgerConnectStatus(ledger.status));
          if (ledger.status !== LEDGER_STATUS.READY) {
            setLedgerModalStatus(true);
            return;
          }
          setLedgerApp(ledger.app);
        }
      }
      let { params } = signParams;
      let validNonce = nonceValue || inferredNonce;
      let nonce = trimSpace(validNonce);

      let toAddress = "";
      let fee = "";
      let memo = "";
      if (SIGN_MESSAGE_EVENT.indexOf(sendAction) === -1) {
        toAddress = trimSpace(params.to);
        fee = trimSpace(feeValue);
        memo = params?.feePayer?.memo || params?.memo || "";
      }
      let fromAddress = currentAccount.address;
      let payload = {
        fromAddress,
        toAddress,
        nonce,
        currentAccount,
        fee,
        memo,
      };
      if (SIGN_MESSAGE_EVENT.indexOf(sendAction) !== -1) {
        payload.message = params.message;
      }
      if (sendAction === DAppActions.mina_sendPayment) {
        let amount = trimSpace(params.amount);
        amount = toNonExponential(new BigNumber(amount).toString());
        payload.amount = amount;
      }
      if (isSendZk) {
        payload.transaction = params.transaction;
        memo = params.feePayer?.memo || "";
        payload.zkOnlySign = zkOnlySign;
      }
      if (currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER) {
        return ledgerTransfer(payload, ledgerTemp);
      }
      setBtnLoading(true);
      let connectAction = QA_SIGN_TRANSACTION;
      if (sendAction === DAppActions.mina_signFields) {
        connectAction = WALLET_SEND_FIELDS_MESSAGE_TRANSACTION;
      } else if (sendAction === DAppActions.mina_createNullifier) {
        connectAction = WALLET_SEND_NULLIFIER;
      }
      if (sendAction === DAppActions.mina_sign_JsonMessage) {
        payload.sendAction = DAppActions.mina_signMessage;
        payload.message = JSON.stringify(payload.message);
      } else {
        payload.sendAction = sendAction;
      }
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
    },
    [
      currentAccount,
      signParams,
      nonceValue,
      feeValue,
      onSubmitSuccess,
      sendAction,
      inferredNonce,
      isSendZk,
      zkOnlySign
    ]
  );

  const onConfirm = useCallback(
    async (ledgerReady = false) => {
      let params = signParams.params;
      if (
        SIGN_MESSAGE_EVENT.indexOf(sendAction) == -1 &&
        sendAction !== DAppActions.mina_sendTransaction
      ) {
        let toAddress = trimSpace(params.to);
        if (!addressValid(toAddress)) {
          Toast.info(i18n.t("sendAddressError"));
          return;
        }
      }
      if (sendAction == DAppActions.mina_sendPayment) {
        let amount = trimSpace(params.amount);
        if (!isNumber(amount) || !new BigNumber(amount).gte(0)) {
          Toast.info(i18n.t("amountError"));
          return;
        }
      }
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
      if (SIGN_MESSAGE_EVENT.indexOf(sendAction) === -1) {
        let amount = trimSpace(params.amount) || 0;
        let maxAmount = new BigNumber(amount).plus(fee).toString();
        if (new BigNumber(maxAmount).gt(mainTokenNetInfo?.tokenBaseInfo.showBalance)) {
          Toast.info(i18n.t("balanceNotEnough"));
          return;
        }
      }
      if (currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER) {
        if (!ledgerReady) {
          const ledger = await getLedgerStatus();
          setLedgerApp(ledger.app);
          dispatch(updateLedgerConnectStatus(ledger.status));

          if (ledger.status == LEDGER_STATUS.READY) {
            clickNextStep(true, ledger.app);
          } else {
            setLedgerModalStatus(true);
          }
        } else {
          clickNextStep();
        }
      } else {
        dispatch(updateLedgerConnectStatus(""));
        clickNextStep();
      }
    },
    [
      i18n,
      currentAccount,
      signParams,
      mainTokenNetInfo,
      nonceValue,
      feeValue,
      clickNextStep,
      sendAction,
      inferredNonce,
    ]
  );

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
      setCustomFeeStatus(true);
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

  useEffect(() => {
    if (!feeDefault) {
      if (defaultRecommandFee) {
        setFeeDefault(defaultRecommandFee);
      }
    }
  }, [feeDefault,defaultRecommandFee]);

  const getContractAddress = useCallback((tx) => {
    try {
      let address;
      if (tx) {
        let realTx = JSON.parse(tx);
        let firstZKapp = realTx?.accountUpdates.find(
          (update) => update.authorization.proof !== undefined
        );
        if (firstZKapp === undefined) {
        } else {
          address = firstZKapp.body.publicKey;
        }
      }
      return address;
    } catch (error) {
      return "";
    }
  }, []);

  const {
    showAccountAddress,
    toAmount,
    realToAddress,
    showToAddress,
    tabInitId,
    tabList,
    pageTitle,
  } = useMemo(() => {
    let showAccountAddress = addressSlice(currentAccount.address, 6, 6);
    let params = signParams?.params;
    let toAmount = params?.amount || "";
    toAmount = toAmount + " " + MAIN_COIN_CONFIG.symbol;

    let partyContractAddress = getContractAddress(params?.transaction);
    let realToAddress = partyContractAddress || params?.to || "";
    let showToAddress = addressSlice(realToAddress, 6);

    let memo = params?.feePayer?.memo || params?.memo || "";
    let content = params?.message || "";
    if (isSendZk) {
      content = params?.transaction;
    } else if (
      sendAction === DAppActions.mina_signFields ||
      sendAction === DAppActions.mina_createNullifier
    ) {
      content = JSON.stringify(content);
    }

    let tabList = [];
    let tabInitId = "";
    if (content) {
      let contentObj = {
        id: "tab1",
        label: i18n.t("content"),
        content: content,
      };
      if (isSendZk) {
        contentObj.isZkData = !showRawDetail;
        contentObj.content = showRawDetail ? zkSourceData : zkFormatData;
      } else if (sendAction === DAppActions.mina_sign_JsonMessage) {
        contentObj.isJsonData = true;
      }
      tabList.push(contentObj);
      tabInitId = "tab1";
    }
    if (memo) {
      tabList.push({ id: "tab2", label: "Memo", content: memo });
      if (!content) {
        tabInitId = "tab2";
      }
    }
    let pageTitle = i18n.t("transactionDetails");
    if (SIGN_MESSAGE_EVENT.indexOf(sendAction) !== -1 || zkOnlySign) {
      pageTitle = i18n.t("signatureRequest");
    }
    return {
      showAccountAddress,
      toAmount,
      realToAddress,
      showToAddress,
      tabInitId,
      tabList,
      pageTitle,
    };
  }, [
    currentAccount,
    signParams,
    i18n,
    sendAction,
    showRawDetail,
    zkSourceData,
    zkFormatData,
    isSendZk,
    zkOnlySign
  ]);

  useEffect(() => {
    if (customFeeStatus) {
      setFeeType(FeeTypeEnum.custom);
      return;
    }
    if (siteRecommendFee) {
      setFeeType(FeeTypeEnum.site);
      setFeeValue(siteRecommendFee);
      return;
    }
    if (feeDefault) {
      setFeeType(FeeTypeEnum.default);
      setFeeValue(feeDefault);
    }
  }, [feeDefault, feeValue, customFeeStatus, siteRecommendFee]);

  const checkFeeHigh = useCallback(() => {
    let checkFee = "";
    if (customFeeStatus) {
      checkFee = feeValue;
    } else {
      checkFee = siteRecommendFee;
    }
    if (BigNumber(checkFee).gt(10)) {
      setFeeErrorTip(i18n.t("feeTooHigh"));
    } else {
      setFeeErrorTip("");
    }
  }, [feeValue, i18n, signParams, customFeeStatus, siteRecommendFee]);

  useEffect(() => {
    checkFeeHigh();
  }, [feeValue]);

  const onClickContent = useCallback(
    (clickAble) => {
      if (clickAble) {
        let data = signParams?.params?.transaction;
        if (data) {
          let res = JSON.parse(data);
          exportFile(JSON.stringify(res, null, 2), "zkapp_command.json");
        }
      }
    },
    [signParams]
  );

  const onClickRawData = useCallback(() => {
    setShowRawDetail((state) => !state);
  }, []);
  const showRawTitle = useMemo(() => {
    return showRawDetail ? i18n.t("rawData") + " </>" : i18n.t("showData");
  }, [showRawDetail, i18n]);

  const tabContentRef = useRef([]);
  useEffect(() => {
    const targetRef = tabContentRef.current[selectedTabIndex];
    if (targetRef) {
      const showBtn = targetRef.scrollHeight > targetRef.clientHeight;
      setShowScrollBtn(showBtn);
    }
  }, [tabContentRef, selectedTabIndex, showMultiView]);

  const onClickScrollBtn = useCallback(() => {
    const targetRef = tabContentRef.current[selectedTabIndex];
    if (targetRef) {
      targetRef.scrollTo({
        top: targetRef.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [tabContentRef, selectedTabIndex]);

  const nextBtnTxt = useMemo(() => {
    let title = "confirm";
    switch (sendAction) {
      case DAppActions.mina_signMessage:
      case DAppActions.mina_sign_JsonMessage:
      case DAppActions.mina_signFields:
        title = "sign";
        break;
      case DAppActions.mina_createNullifier:
        title = "create";
        break;
      case DAppActions.mina_sendTransaction:
        if(zkOnlySign){
          title = "sign";
        }
        break;
      default:
        break;
    }
    return title;
  }, [sendAction,zkOnlySign]);

  const onLedgerInfoModalConfirm = useCallback(
    (ledger) => {
      setLedgerApp(ledger.app);
      setLedgerModalStatus(false);
      onConfirm(true);
    },
    [onConfirm]
  );

  return (
    <section className={styles.sectionSign}>
      <div className={styles.titleRow}>
        <p className={styles.title}>{pageTitle}</p>
        <div className={styles.titleRight}>
          <LedgerStatusView />
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
        {SIGN_MESSAGE_EVENT.indexOf(sendAction) !== -1 ? (
          <CommonRow
            leftTitle={currentAccount.accountName}
            leftContent={showAccountAddress}
            leftCopyContent={currentAccount.address}
            rightTitle={i18n.t("amount")}
            rightContent={mainTokenNetInfo?.tokenBaseInfo?.showBalance + " " + MAIN_COIN_CONFIG.symbol}
          />
        ) : (
          <>
            <CommonRow
              leftTitle={currentAccount.accountName}
              leftContent={showAccountAddress}
              rightTitle={i18n.t("to")}
              rightContent={showToAddress}
              leftCopyContent={currentAccount.address}
              rightCopyContent={realToAddress}
              showArrow={true}
              toTypeName={transactionTypeName}
            />
            {sendAction === DAppActions.mina_sendPayment && (
              <CommonRow leftTitle={i18n.t("amount")} leftContent={toAmount} />
            )}
            <div className={styles.accountRow}>
              <div className={styles.rowLeft}>
                <p className={styles.rowTitle}>{i18n.t("transactionFee")}</p>
                <div className={styles.feeCon}>
                  <p className={cls(styles.rowContent, styles.feeContent)}>
                    {feeValue + " " + MAIN_COIN_CONFIG.symbol}
                  </p>
                  {feeType !== FeeTypeEnum.custom && (
                    <span
                      className={cls(
                        feeType === FeeTypeEnum.site
                          ? styles.feeTypeSite
                          : styles.feeTypeDefault
                      )}
                    >
                      {feeType === FeeTypeEnum.site
                        ? i18n.t("siteSuggested")
                        : i18n.t("fee_default")}
                    </span>
                  )}
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
        )}
        {tabList.length > 0 && (
          <div className={styles.accountRow}>
            <Tabs
              selected={selectedTabIndex}
              initId={tabInitId}
              onSelect={onSelectedTab}
              customTabPanelCss={styles.customTabPanelCss}
              customBtnCss={styles.customBtnCss}
              btnRightComponent={
                showRawData && (
                  <div className={styles.rowData} onClick={onClickRawData}>
                    {showRawTitle}
                  </div>
                )
              }
            >
              {tabList.map((tab, index) => {
                const clickAble = tab.contentClick;
                return (
                  <div key={tab.id} id={tab.id} label={tab.label}>
                    {
                      <div
                        onClick={() => onClickContent(clickAble)}
                        ref={(element) =>
                          (tabContentRef.current[index] = element)
                        }
                        className={cls(styles.tabContent, {
                          [styles.clickCss]: clickAble,
                          [styles.multiContent]: showMultiView,
                          [styles.highContent]: isSendZk,
                          [styles.highMultiContent]: showMultiView && isSendZk,
                        })}
                      >
                        {showScrollBtn && (
                          <div
                            className={cls(styles.scrollBtn, {
                              [styles.scrollBtnBm]: showMultiView,
                            })}
                            onClick={onClickScrollBtn}
                          >
                            <img src="/img/icon_roll.svg" />
                          </div>
                        )}
                        {tab.isJsonData || tab.isZkData ? (
                          <TypeRowInfo
                            data={tab.content}
                            isZkData={tab.isZkData}
                          />
                        ) : (
                          tab.content
                        )}
                      </div>
                    }
                  </div>
                );
              })}
            </Tabs>
          </div>
        )}
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
          {i18n.t(nextBtnTxt)}
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
      <ConfirmModal
        modalVisible={confirmModalStatus}
        title={i18n.t("transactionDetails")}
        waitingLedger={isLedgerAccount}
        showCloseIcon={isLedgerAccount}
        onClickClose={() => setConfirmModalStatus(false)}
      />

      <LedgerInfoModal
        modalVisible={ledgerModalStatus}
        onClickClose={() => setLedgerModalStatus(false)}
        onConfirm={onLedgerInfoModalConfirm}
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
