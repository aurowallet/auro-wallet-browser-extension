import { sendStakeTx, sendTx } from "@/background/api";
import { MAIN_COIN_CONFIG } from "@/constant";
import { ACCOUNT_TYPE } from "@/constant/commonType";
import {
  DAPP_ACTION_CREATE_NULLIFIER,
  DAPP_ACTION_SEND_TRANSACTION,
  DAPP_ACTION_SIGN_MESSAGE,
  QA_SIGN_TRANSTRACTION,
  WALLET_CHECK_TX_STATUS,
  WALLET_SEND_FIELDS_MESSAGE_TRANSTRACTION,
  WALLET_SEND_NULLIFIER,
} from "@/constant/msgTypes";
import Button, { button_size, button_theme } from "@/popup/component/Button";
import { ConfirmModal } from "@/popup/component/ConfirmModal";
import DAppAdvance from "@/popup/component/DAppAdvance";
import DappWebsite from "@/popup/component/DappWebsite";
import Tabs from "@/popup/component/Tabs";
import Toast from "@/popup/component/Toast";
import { sendMsg } from "@/utils/commonMsg";
import {
  checkLedgerConnect,
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
import { getZkInfo, toPretty } from "@/utils/zkUtils";
import { DAppActions } from "@aurowallet/mina-provider";
import BigNumber from "bignumber.js";
import cls from "classnames";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { TypeRowInfo } from "../TypeRowInfo";
import styles from "./index.module.scss";

const FeeTypeEnum = {
  site: "FEE_RECOMMED_SITE",
  default: "FEE_RECOMMED_DEFAULT",
  custom: "FEE_RECOMMED_CUSTOM",
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

const SignView = ({
  signParams,
  showMultiView,
  onRemoveTx,
  inferredNonce,
  advanceData,
  onUpdateAdvance,
}) => {
  const currentAccount = useSelector(
    (state) => state.accountInfo.currentAccount
  );
  const balance = useSelector((state) => state.accountInfo.balance);
  const currentConfig = useSelector((state) => state.network.currentConfig);
  const netFeeList = useSelector((state) => state.cache.feeRecom);

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
  const [showRawData, setShowRawData] = useState(false);
  const [showRawDetail, setShowRawDetail] = useState(false);

  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const [advanceFee, setAdvanceFee] = useState("");
  const [advanceNonce, setAdvanceNonce] = useState("");

  const { sendAction, siteRecommendFee, currentAdvanceData } = useMemo(() => {
    let sendAction = signParams?.params?.action || "";
    let siteFee = signParams?.feePayer?.fee || signParams?.params?.fee || "";
    let siteRecommendFee = isNumber(siteFee) ? siteFee + "" : "";
    let id = signParams?.id || "";
    let currentAdvanceData = advanceData[id] || {};
    return {
      sendAction,
      siteRecommendFee,
      currentAdvanceData,
    };
  }, [signParams, advanceData]);

  useEffect(() => {
    if (isNumber(currentAdvanceData.fee)) {
      setCustomFeeStatus(true);
      setFeeValue(currentAdvanceData.fee);
    }
    if (isNaturalNumber(currentAdvanceData.nonce)) {
      setNonceValue(currentAdvanceData.nonce);
    }
  }, [currentAdvanceData]);

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
      case DAppActions.mina_sign_JsonMessage:
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
            payload.hash = data.hash;
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
    [signParams, sendAction, onRemoveTx]
  );
  const { isSendZk, zkSourceData, zkFormatData } = useMemo(() => {
    const isSendZk = sendAction === DAppActions.mina_sendTransaction;
    let zkShowData = "",
      zkSourceData = "",
      zkFormatData = "";
    if (isSendZk) {
      zkShowData = signParams.params?.transaction;
      zkSourceData = JSON.stringify(JSON.parse(zkShowData),null,2);
      zkFormatData = getZkInfo(zkShowData,currentAccount.address);
    }
    return {
      isSendZk,
      zkSourceData,
      zkFormatData,
    };
  }, [sendAction, signParams,currentAccount]);
  useEffect(() => {
    setShowRawData(
      sendAction === DAppActions.mina_sendTransaction && selectedTabIndex === 0
    );
  }, [sendAction, selectedTabIndex]);

  const ledgerTransfer = useCallback(
    async (params) => {
      if (SIGN_MESSAGE_EVENT.indexOf(sendAction) !== -1) {
        Toast.info(i18n.t("ledgerNotSupportSign"));
        sendMsg(
          {
            action: DAPP_ACTION_SIGN_MESSAGE,
            payload: { error: "not support ledger sign message" },
          },
          async (params) => {}
        );
        return;
      }
      const supportAction = [
        DAppActions.mina_sendPayment,
        DAppActions.mina_sendStakeDelegation,
      ];
      if (supportAction.indexOf(sendAction) === -1) {
        Toast.info(i18n.t("notSupportNow"));
        return;
      }

      const { ledgerApp } = await checkLedgerConnect();
      if (ledgerApp) {
        setLedgerModalStatus(true);
        let signResult;
        let postRes;
        if (sendAction === DAppActions.mina_sendPayment) {
          signResult = await requestSignPayment(
            ledgerApp,
            params,
            currentAccount.hdPath
          );

          const { signature, payload, error } = signResult;
          if (error) {
            setLedgerModalStatus(false);
            Toast.info(error.message);
            return;
          }
          postRes = await sendTx(payload, { rawSignature: signature }).catch(
            (error) => error
          );
        } else if (sendAction === DAppActions.mina_sendStakeDelegation) {
          signResult = await requestSignDelegation(
            ledgerApp,
            params,
            currentAccount.hdPath
          );

          const { signature, payload, error } = signResult;
          if (error) {
            setLedgerModalStatus(false);
            Toast.info(error.message);
            return;
          }
          postRes = await sendStakeTx(payload, {
            rawSignature: signature,
          }).catch((error) => error);
        }

        setLedgerModalStatus(false);
        onSubmitSuccess(postRes, params.nonce, "ledger");
      }
    },
    [signParams, currentAccount, sendAction]
  );

  const clickNextStep = useCallback(() => {
    let { params } = signParams;
    let vaildNonce = nonceValue || inferredNonce;
    let nonce = trimSpace(vaildNonce);

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
    if (sendAction === DAppActions.mina_sendTransaction) {
      payload.transaction = params.transaction;
      memo = params.feePayer?.memo || "";
    }
    if (currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER) {
      return ledgerTransfer(payload);
    }
    setBtnLoading(true);
    let connectAction = QA_SIGN_TRANSTRACTION;
    if (sendAction === DAppActions.mina_signFields) {
      connectAction = WALLET_SEND_FIELDS_MESSAGE_TRANSTRACTION;
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
  }, [
    currentAccount,
    signParams,
    nonceValue,
    feeValue,
    onSubmitSuccess,
    // netAccount,
    sendAction,
    inferredNonce,
  ]);

  const onConfirm = useCallback(() => {
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
    if (sendAction === DAppActions.mina_sendPayment) {
      let amount = trimSpace(params.amount);
      if (!isNumber(amount) || !new BigNumber(amount).gt(0)) {
        Toast.info(i18n.t("amountError"));
        return;
      }
    }
    let vaildNonce = nonceValue || inferredNonce;
    let nonce = trimSpace(vaildNonce) || "";
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
      if (new BigNumber(maxAmount).gt(balance)) {
        Toast.info(i18n.t("balanceNotEnough"));
        return;
      }
    }
    clickNextStep();
  }, [
    i18n,
    currentAccount,
    signParams,
    balance,
    nonceValue,
    feeValue,
    clickNextStep,
    sendAction,
    inferredNonce,
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
      if (netFeeList.length >= 1) {
        setFeeDefault(netFeeList[1].value);
      }
    }
  }, [netFeeList, feeDefault]);

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
    if (sendAction === DAppActions.mina_sendTransaction) {
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
      if (sendAction === DAppActions.mina_sendTransaction) {
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
    let pageTitle = i18n.t("confirmTransaction");
    if (SIGN_MESSAGE_EVENT.indexOf(sendAction) !== -1) {
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
    if(targetRef){
      const showBtn = targetRef.scrollHeight > targetRef.clientHeight;
      setShowScrollBtn(showBtn);
    }
  }, [tabContentRef, selectedTabIndex,showMultiView]);

  const onClickScrollBtn = useCallback(() => {
    const targtRef = tabContentRef.current[selectedTabIndex];
    if (targtRef) {
      targtRef.scrollTo({
        top: targtRef.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [tabContentRef, selectedTabIndex]);

  const nextBtnTxt = useMemo(()=>{
    let title = 'confirm'
    switch (sendAction) {
      case DAppActions.mina_signMessage:
      case DAppActions.mina_sign_JsonMessage:
      case DAppActions.mina_signFields:
        title = "sign"
        break;
      case DAppActions.mina_createNullifier:
        title = "create"
        break;
      default:
        break;
    }
    return title
  },[sendAction])
  return (
    <section className={styles.sectionSign}>
      <div className={styles.titleRow}>
        <p className={styles.title}>{pageTitle}</p>
        <div className={styles.netContainer}>
          <div className={styles.dot} />
          <p className={styles.netContent}>{currentConfig.name}</p>
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
            rightContent={balance + " " + MAIN_COIN_CONFIG.symbol}
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
              <div className={styles.rowRight}>
                <p className={cls(styles.rowTitle, styles.rightTitle)} />
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
              initedId={tabInitId}
              onSelect={onSelectedTab}
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
        modalVisable={advanceStatus}
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
        modalVisable={ledgerModalStatus}
        title={i18n.t("transactionDetails")}
        waitingLedger={ledgerModalStatus}
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
        <p className={cls(styles.rowTitle, styles.rightTitle)}>{rightTitle}</p>
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
