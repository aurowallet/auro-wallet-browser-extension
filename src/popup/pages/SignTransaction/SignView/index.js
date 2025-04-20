import { sendStakeTx, sendTx } from "@/background/api";
import { MAIN_COIN_CONFIG } from "@/constant";
import { ACCOUNT_TYPE, LEDGER_STATUS } from "@/constant/commonType";
import {
  DAPP_ACTION_CREATE_NULLIFIER,
  DAPP_ACTION_REQUEST_PRESENTATION,
  DAPP_ACTION_SEND_TRANSACTION,
  DAPP_ACTION_SIGN_MESSAGE,
  DAPP_ACTION_STORE_CREDENTIAL,
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
import { sendMsg, sendMsgV2 } from "@/utils/commonMsg";
import {
  getLedgerStatus,
  requestSignDelegation,
  requestSignPayment,
} from "@/utils/ledger";
import {
  addressSlice,
  copyText,
  createCredentialHash,
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
import { PrettyPrinter } from "mina-attestations";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { serializeError } from "serialize-error";
import styled from "styled-components";
import { CredentialMsg } from "../../../../constant/msgTypes";
import { updateShouldRequest } from "../../../../reducers/accountReducer";
import { TypeRowInfo } from "../TypeRowInfo";
import styles from "./index.module.scss";

const ZkAppValueType = {
  site: "RECOMMEND_SITE",
  default: "RECOMMEND_DEFAULT",
  custom: "RECOMMEND_CUSTOM",
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
  DAppActions.mina_sendTransaction,
];

const Ledger_support_action = [
  DAppActions.mina_sendPayment,
  DAppActions.mina_sendStakeDelegation,
];

const StyledJsonView = styled.div`
  overflow-y: auto;
  border-radius: 4px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  padding: 10px;
  color: rgba(0, 0, 0, 0.8);
  margin-top: 20px;
  max-height: calc(100vh - 400px);
  overflow-y: auto;
  width: calc(100% - 20px);
  overflow-wrap: break-word;
  white-space: pre-wrap;
  pre {
    word-break: break-all;
    white-space: pre-wrap;
  }
`;
const StyledJsonViewRequire = styled(StyledJsonView)`
  margin-top: 10px;
  max-height: 100px;
`;
const StyledJsonViewSmall = styled(StyledJsonView)`
  margin-top: 10px;
  max-height: 130px;
`;

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
  const netFeeList = useSelector((state) => state.cache.feeRecommend);

  const [advanceStatus, setAdvanceStatus] = useState(false);
  const [feeValue, setFeeValue] = useState("");
  const [feeDefault, setFeeDefault] = useState("");
  const [customFeeStatus, setCustomFeeStatus] = useState(false);
  const [feeType, setFeeType] = useState("");
  const [nonceType, setNonceType] = useState("");
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
  const [selectedCredentials, setSelectedCredentials] = useState({});

  const {
    sendAction,
    siteRecommendFee,
    currentAdvanceData,
    transactionTypeName,
    credentialData,
    presentationData,
  } = useMemo(() => {
    let sendAction = signParams?.params?.action || "";
    const body = signParams?.params?.transaction;
    const zkFee = getZkFee(body);
    let siteFee =
      zkFee ||
      signParams?.params?.feePayer?.fee ||
      signParams?.params?.fee ||
      "";
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

    let credentialData = {};
    let presentationData = {};
    if (sendAction == DAppActions.mina_storePrivateCredential) {
      credentialData = signParams.params.credential || {};
    }
    if (sendAction == DAppActions.mina_requestPresentation) {
      presentationData = signParams.params.presentationData || {};
    }
    return {
      sendAction,
      siteRecommendFee,
      currentAdvanceData,
      transactionTypeName,
      credentialData,
      presentationData,
    };
  }, [signParams, advanceData]);

  const {
    isSendZk,
    zkSourceData,
    zkFormatData,
    zkOnlySign,
    defaultRecommandFee,
    zkAppNonce,
  } = useMemo(() => {
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
        count = getAccountUpdateCount(zkShowData);
      } catch (error) {}
    }
    let zkOnlySign = signParams?.params?.onlySign && isSendZk;
    let zkAppNonce = isNumber(signParams?.params?.nonce)
      ? signParams?.params?.nonce
      : "";

    let defaultRecommandFee = 0.1;
    if (netFeeList.length >= 2) {
      defaultRecommandFee = netFeeList[1].value;
    }
    if (isSendZk && netFeeList.length >= 6) {
      const zkAccountFee = new BigNumber(netFeeList[5].value).multipliedBy(
        count
      );
      defaultRecommandFee = new BigNumber(netFeeList[1].value)
        .plus(zkAccountFee)
        .toNumber();
    }
    return {
      isSendZk,
      zkSourceData,
      zkFormatData,
      zkOnlySign,
      defaultRecommandFee,
      zkAppNonce,
    };
  }, [sendAction, signParams, currentAccount, netFeeList]);

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
      case DAppActions.mina_storePrivateCredential:
        resultAction = DAPP_ACTION_STORE_CREDENTIAL;
        break;
      case DAppActions.mina_requestPresentation:
        resultAction = DAPP_ACTION_REQUEST_PRESENTATION;
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
            payload.paymentId = data.sendDelegation.delegation.id;
            id = data.sendDelegation.delegation.id;
            resultAction = DAPP_ACTION_SEND_TRANSACTION;
            break;
          case DAppActions.mina_sendPayment:
            payload.hash = data.sendPayment.payment.hash;
            payload.paymentId = data.sendPayment.payment.id;
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
            if (zkOnlySign) {
              payload.signedData = JSON.stringify(data);
            } else {
              payload.hash = data.hash;
              payload.paymentId = data.id;
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
        if (payload.hash) {
          dispatch(updateShouldRequest(true, true));
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
    [signParams, sendAction, onRemoveTx, zkOnlySign]
  );
  useEffect(() => {
    setShowRawData(isSendZk && selectedTabIndex === 0);
  }, [isSendZk, selectedTabIndex]);

  const ledgerTransfer = useCallback(
    async (params, preLedgerApp) => {
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
      if (sendAction === DAppActions.mina_storePrivateCredential) {
        const res = await onStoreInfo();
        if (!res) {
          return;
        }
        sendMsg(
          {
            action: DAPP_ACTION_STORE_CREDENTIAL,
            payload: {
              ...res,
            },
          },
          async (params) => {
            onRemoveTx(signParams.id, TX_CLICK_TYPE.CONFIRM);
          }
        );
        return;
      }
      if (sendAction === DAppActions.mina_requestPresentation) {
        const res = await onPresentation();

        if (!res) {
          return;
        }
        sendMsg(
          {
            action: DAPP_ACTION_REQUEST_PRESENTATION,
            payload: {
              presentation: res,
              resultOrigin: signParams?.site?.origin,
              id: signParams.id,
            },
          },
          async (params) => {
            onRemoveTx(signParams.id, TX_CLICK_TYPE.CONFIRM);
          }
        );
        return;
      }
      let { params } = signParams;
      let validNonce = nonceValue || zkAppNonce || inferredNonce;
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
      zkOnlySign,
      zkAppNonce,
      selectedCredentials,
      credentialData,
      presentationData,
    ]
  );

  const checkLedgerSupport = useCallback(() => {
    if (Ledger_support_action.indexOf(sendAction) === -1) {
      Toast.info(i18n.t("notSupportNow"));
      let resultAction = "";
      switch (sendAction) {
        case DAppActions.mina_sendTransaction:
          resultAction = DAPP_ACTION_SEND_TRANSACTION;
          break;
        case DAppActions.mina_signFields:
          resultAction = DAPP_ACTION_SIGN_MESSAGE;
          break;
        case DAppActions.mina_createNullifier:
          resultAction = DAPP_ACTION_CREATE_NULLIFIER;
          break;
        case DAppActions.mina_signMessage:
        case DAppActions.mina_sign_JsonMessage:
          resultAction = DAPP_ACTION_SIGN_MESSAGE;
          break;
        case DAppActions.mina_storePrivateCredential:
          resultAction = DAPP_ACTION_STORE_CREDENTIAL;
          break;
        case DAppActions.mina_requestPresentation:
          resultAction = DAPP_ACTION_REQUEST_PRESENTATION;
          break;
        default:
          break;
      }
      sendMsg(
        {
          action: resultAction,
          payload: { error: "Not supported yet" },
        },
        async (params) => {}
      );
      return false;
    }
    return true;
  }, []);

  const sendSandboxMessage = (payload) => {
    return new Promise((resolve, reject) => {
      const sandbox = document.getElementById("o1jssandbox");
      if (!sandbox) {
        resolve({
          error: { message: "Sandbox iframe not found" },
        });
        return;
      }
      // Listen for the response from the sandbox
      const messageHandler = (event) => {
        if (event.data.type === "validate-credential-result") {
          window.removeEventListener("message", messageHandler);
          resolve({
            type: event.data.type,
            result: event.data.result,
            error: event.data.error,
          });
        }
        if (event.data.type === "presentation-signing-request") {
          sendMsg(
            {
              action: WALLET_SEND_FIELDS_MESSAGE_TRANSACTION,
              payload: {
                message: event.data.fields,
              },
            },
            (data) => {
              if (!data.signature) {
                Toast.info(data?.error?.message || "presentation sign failed");
                setBtnLoading(false);
                window.removeEventListener("message", messageHandler);
                return;
              }
              sendSandboxMessage({
                type: "presentation-signature",
                signature: data.signature,
              });
            }
          );
        }
        if (event.data.type === "presentation-result") {
          window.removeEventListener("message", messageHandler);
          resolve({
            type: event.data.type,
            result: event.data.result,
            error: event.data.error,
          });
        }
        if (event.data.type === "init-sandbox-extension-id") {
          if (sandbox) {
            Toast.info(i18n.t("tryAgain"));
            const allowedOrigin = `chrome-extension://${chrome.runtime.id}`;
            sandbox.contentWindow.postMessage(
              {
                type: "init-sandbox",
                parentOrigin: allowedOrigin,
              },
              "*"
            );
            resolve({
              error: {
                message: i18n.t("tryAgain"),
              },
            });
          }
        }
      };
      window.addEventListener("message", messageHandler);
      sandbox.contentWindow?.postMessage(payload, "*");
    });
  };

  const onStoreInfo = async () => {
    const stringifiedCredential = JSON.stringify(credentialData);
    let credentialToStore;

    try {
      setBtnLoading(true);
      const credentialWitnessType = credentialData.witness.type;
      if (credentialWitnessType === "unsigned") {
        credentialToStore = stringifiedCredential;
      } else {
        const result = await sendSandboxMessage({
          type: "validate-credential",
          payload: stringifiedCredential,
        });

        if (result?.error || !result?.result) {
          Toast.info(result.error?.message || "validate credential failed");
          setBtnLoading(false);
          return;
        }
        credentialToStore = result.result;
      }

      const newCredentialHash = createCredentialHash(credentialData);
      const existingCredentials = await sendMsgV2({
        action: CredentialMsg.get_credentials,
      });
      const isDuplicate = existingCredentials.some((existing) => {
        const existingHash = createCredentialHash(
          JSON.parse(existing.credential)
        );
        return existingHash === newCredentialHash;
      });
      if (isDuplicate) {
        Toast.info(i18n.t("credentialExist"));
        setBtnLoading(false);
        return;
      }

      try {
        const parsedResult = credentialToStore;
        await sendMsgV2({
          action: CredentialMsg.store_credential,
          payload: parsedResult,
        });
        sendMsg(
          {
            action: DAPP_ACTION_STORE_CREDENTIAL,
            payload: {
              credential: parsedResult,
              resultOrigin: signParams?.site?.origin,
              id: signParams.id,
            },
          },
          async (params) => {
            onRemoveTx(signParams.id, TX_CLICK_TYPE.CONFIRM);
          }
        );
        setBtnLoading(true);
        return { success: parsedResult };
      } catch (error) {
        const err = serializeError(error);
        Toast.info(
          `Failed to store private credential: ${
            err.message || error.message || JSON.stringify(error)
          }`
        );
      }
    } catch (error) {
      console.log(" onStoreInfo error", error);
      const err = serializeError(error);
      Toast.info(
        `Failed to store validate credential: ${
          err.message || error.message || JSON.stringify(error)
        }`
      );
    }
  };

  const onPresentation = async () => {
    const { presentationRequest, zkAppAccount } = presentationData;
    const verifierIdentity =
      presentationRequest.type === "zk-app"
        ? zkAppAccount
        : signParams?.site?.origin;

    if (!selectedCredentials?.credential) {
      Toast.info(i18n.t("credentalSelectTip"));
      return;
    }
    setBtnLoading(true);
    const result = await sendSandboxMessage({
      type: "presentation",
      payload: {
        presentationRequest,
        selectedCredentials: selectedCredentials.credential.credentialStr,
        verifierIdentity,
      },
    });
    if (result?.error || !result?.result) {
      Toast.info(result.error?.message || "validate credential failed");
      setBtnLoading(false);
      return;
    }
    return result?.result;
  };

  const onConfirm = useCallback(
    async (ledgerReady = false) => {
      let params = signParams.params;
      if (
        sendAction == DAppActions.mina_sendPayment ||
        sendAction == DAppActions.mina_sendStakeDelegation
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
      if (COMMON_TRANSACTION_ACTION.indexOf(sendAction) !== -1) {
        let validNonce = nonceValue || zkAppNonce || inferredNonce;
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
        let amount = trimSpace(params.amount) || 0;
        let maxAmount = new BigNumber(amount).plus(fee).toString();
        if (
          new BigNumber(maxAmount).gt(
            mainTokenNetInfo?.tokenBaseInfo.showBalance
          )
        ) {
          Toast.info(i18n.t("balanceNotEnough"));
          return;
        }
      }
      if (currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER) {
        let support = checkLedgerSupport();
        if (!support) {
          return;
        }
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
      zkAppNonce,
      selectedCredentials,
      credentialData,
      presentationData,
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
  }, [feeDefault, defaultRecommandFee]);

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
    zkOnlySign,
  ]);

  useEffect(() => {
    if (customFeeStatus) {
      setFeeType(ZkAppValueType.custom);
      return;
    }
    if (siteRecommendFee) {
      setFeeType(ZkAppValueType.site);
      setFeeValue(siteRecommendFee);
      return;
    }
    if (feeDefault) {
      setFeeType(ZkAppValueType.default);
      setFeeValue(feeDefault);
    }
  }, [feeDefault, feeValue, customFeeStatus, siteRecommendFee]);

  useEffect(() => {
    if (nonceValue) {
      setNonceType(ZkAppValueType.custom);
    } else if (zkAppNonce) {
      setNonceType(ZkAppValueType.site);
    }
  }, [nonceValue, zkAppNonce]);

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
        if (zkOnlySign) {
          title = "sign";
        }
        break;
      default:
        break;
    }
    return title;
  }, [sendAction, zkOnlySign]);

  const onLedgerInfoModalConfirm = useCallback(
    (ledger) => {
      setLedgerApp(ledger.app);
      setLedgerModalStatus(false);
      onConfirm(true);
    },
    [onConfirm]
  );
  const onResetNonce = useCallback(() => {
    setNonceType(ZkAppValueType.custom);
    setNonceValue(inferredNonce);
  }, [inferredNonce]);
  const onSelectCredential = (credentialData) => {
    setSelectedCredentials({
      ...credentialData,
    });
  };

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
        {sendAction === DAppActions.mina_storePrivateCredential ? (
          <CredentialView
            currentAccount={currentAccount}
            showAccountAddress={showAccountAddress}
            credentialData={credentialData}
          />
        ) : (
          <></>
        )}
        {sendAction === DAppActions.mina_requestPresentation ? (
          <PresentationView
            currentAccount={currentAccount}
            showAccountAddress={showAccountAddress}
            presentationData={presentationData}
            origin={signParams?.site?.origin}
            onSelectCredential={onSelectCredential}
          />
        ) : (
          <></>
        )}
        {SIGN_MESSAGE_EVENT.indexOf(sendAction) !== -1 ? (
          <CommonRow
            leftTitle={currentAccount.accountName}
            leftContent={showAccountAddress}
            leftCopyContent={currentAccount.address}
            rightTitle={i18n.t("amount")}
            rightContent={
              mainTokenNetInfo?.tokenBaseInfo?.showBalance +
              " " +
              MAIN_COIN_CONFIG.symbol
            }
          />
        ) : (
          <></>
        )}
        {COMMON_TRANSACTION_ACTION.indexOf(sendAction) !== -1 ? (
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
            {zkAppNonce && (
              <div className={styles.accountRow}>
                <div className={styles.rowLeft}>
                  <p className={styles.rowTitle}>{"Nonce"}</p>
                  <div className={styles.feeCon}>
                    <p className={cls(styles.rowContent, styles.feeContent)}>
                      {nonceValue || zkAppNonce}
                    </p>
                    {nonceType !== ZkAppValueType.custom && (
                      <span
                        className={cls(
                          nonceType === ZkAppValueType.site
                            ? styles.feeTypeSite
                            : styles.feeTypeDefault
                        )}
                      >
                        {nonceType === ZkAppValueType.site
                          ? i18n.t("siteSuggested")
                          : i18n.t("fee_default")}
                      </span>
                    )}
                  </div>
                </div>
                {nonceType === ZkAppValueType.site && (
                  <div className={styles.modeWrapper}>
                    <p
                      className={styles.rowPurpleContent}
                      onClick={onResetNonce}
                    >
                      {i18n.t("reset")}
                    </p>
                  </div>
                )}
              </div>
            )}
            <div className={styles.accountRow}>
              <div className={styles.rowLeft}>
                <p className={styles.rowTitle}>{i18n.t("transactionFee")}</p>
                <div className={styles.feeCon}>
                  <p className={cls(styles.rowContent, styles.feeContent)}>
                    {feeValue + " " + MAIN_COIN_CONFIG.symbol}
                  </p>
                  {feeType !== ZkAppValueType.custom && (
                    <span
                      className={cls(
                        feeType === ZkAppValueType.site
                          ? styles.feeTypeSite
                          : styles.feeTypeDefault
                      )}
                    >
                      {feeType === ZkAppValueType.site
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
        ) : (
          <></>
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
        zkAppNonce={nonceValue || zkAppNonce}
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
const CredentialView = ({
  currentAccount,
  showAccountAddress,
  credentialData,
}) => {
  const displayCredentialData = useMemo(() => {
    let displayCredentialData = credentialData;
    if (Object.keys(credentialData).length > 0) {
      displayCredentialData = PrettyPrinter.simplifyCredentialData(
        credentialData
      );
    }
    return displayCredentialData;
  }, [credentialData]);
  return (
    <>
      <CommonRow
        leftTitle={currentAccount.accountName}
        leftContent={showAccountAddress}
        leftCopyContent={currentAccount.address}
      />
      <StyledJsonView>
        <pre>{JSON.stringify(displayCredentialData, null, 4)}</pre>
      </StyledJsonView>
    </>
  );
};

const StyledSelectRow = styled.label`
  padding: 0.75rem;
  border-radius: 1rem;
  gap: 0.5rem;
  align-items: center;
  cursor: pointer;
  display: flex;
  background-color: #eee;
  margin-bottom: 10px;
`;
const StyledTipContent = styled.p`
  margin: 10px 0;
  font-weight: 500;
  font-size: 14px;
`;

const PresentationView = ({
  currentAccount,
  showAccountAddress,
  presentationData,
  origin,
  onSelectCredential,
}) => {
  const [storedCredentials, setStoredCredentials] = useState([]);
  const [selectedCredentials, setSelectedCredentials] = useState(new Map());
  useEffect(() => {
    sendMsg(
      {
        action: CredentialMsg.get_credentials,
      },
      async (credentials) => {
        setStoredCredentials(credentials);
      }
    );
  }, []);

  const displayPresentation = useMemo(() => {
    const { presentationRequest, zkAppAccount } = presentationData;
    const verifierIdentity =
      presentationRequest.type === "zk-app" ? zkAppAccount : origin;
    const formatted = [
      PrettyPrinter.printPresentationRequest(presentationRequest),
      PrettyPrinter.printVerifierIdentity(
        presentationRequest.type,
        verifierIdentity
      ),
    ].join("\n");
    return formatted;
  }, [presentationData, origin]);

  const getCredentialRequirements = (presentationRequest) => {
    const extractDataFields = (data) => {
      if (!data) return [];

      if (data._type === "Struct" && data.properties) {
        return Object.keys(data.properties);
      }

      if (data._type === "DynamicRecord" && data.knownShape) {
        return Object.keys(data.knownShape);
      }
      return Object.keys(data);
    };
    const requirements = [];
    for (const [key, input] of Object.entries(
      presentationRequest.spec.inputs
    )) {
      if (input.type === "credential" && input.credentialType && input.data) {
        requirements.push({
          inputKey: key,
          type: input.credentialType,
          dataFields: extractDataFields(input.data),
        });
      }
    }
    return requirements;
  };
  const credentialMatchesRequirement = (credential, requirement) => {
    if (credential.witness?.type !== requirement.type) {
      return false;
    }
    const getCredentialDataKeys = (credential) => {
      const data =
        credential.credential.value?.data || credential.credential.data;
      return data ? Object.keys(data) : [];
    };
    const credentialFields = getCredentialDataKeys(credential);
    return requirement.dataFields.every((field) =>
      credentialFields.includes(field)
    );
  };
  const findMatchingRequirements = (credential, requirements) => {
    return requirements.filter((req) =>
      credentialMatchesRequirement(credential, req)
    );
  };

  const { credentials, requirements } = useMemo(() => {
    try {
      const { presentationRequest, zkAppAccount } = presentationData;
      const credentialRequirements = getCredentialRequirements(
        presentationRequest
      );
      const parsedStoredCredentials = storedCredentials.map((credentials) => {
        return {
          credential: JSON.parse(credentials.credential),
          credentialStr: credentials.credential,
        };
      });
      const validCredentials = parsedStoredCredentials
        .filter(
          (credential) =>
            findMatchingRequirements(
              credential.credential,
              credentialRequirements
            ).length > 0
        )
        .map((credential) => ({
          id: createCredentialHash(credential.credential),
          credential,
          matchingRequirements: findMatchingRequirements(
            credential.credential,
            credentialRequirements
          ),
        }));

      return {
        credentials: validCredentials,
        requirements: credentialRequirements,
      };
    } catch (error) {
      error.message = `Issue with parsing: ${error.message}`;
      throw error;
    }
  }, [presentationData, storedCredentials]);

  const isSelectedFor = (credentialId, inputKey) => {
    const selection = selectedCredentials.get(inputKey);
    return selection?.credentialId === credentialId;
  };
  const handleCredentialSelect = (credentialData, inputKey) => {
    setSelectedCredentials((prev) => {
      const newMap = new Map(prev);
      newMap.set(inputKey, {
        credential: credentialData.credential,
        credentialId: credentialData.id,
      });
      return newMap;
    });
    onSelectCredential && onSelectCredential(credentialData, inputKey);
  };

  return (
    <>
      <CommonRow
        leftTitle={currentAccount.accountName}
        leftContent={showAccountAddress}
        leftCopyContent={currentAccount.address}
      />
      <StyledJsonViewRequire>
        <pre>{displayPresentation ?? ""}</pre>
      </StyledJsonViewRequire>

      {requirements.map((requirement, index) => {
        const matchingCredentials = credentials.filter((cred) =>
          cred.matchingRequirements.some(
            (req) => req.inputKey === requirement.inputKey
          )
        );
        return (
          <div key={requirement.inputKey + "_" + index}>
            <StyledTipContent>
              {i18n.t("selectCredentialTip", { key: requirement.inputKey })}
            </StyledTipContent>
            <StyledJsonViewSmall>
              <div>
                {matchingCredentials.length > 0 ? (
                  matchingCredentials.map((credentialData, index) => (
                    <StyledSelectRow
                      key={`${credentialData.id}-${requirement.inputKey}`}
                    >
                      <input
                        type="radio"
                        name={requirement.inputKey}
                        checked={isSelectedFor(
                          credentialData.id,
                          requirement.inputKey
                        )}
                        onChange={() =>
                          handleCredentialSelect(
                            credentialData,
                            requirement.inputKey
                          )
                        }
                      />
                      <CredentialDisplay
                        key={credentialData.id + "+" + index}
                        credential={credentialData.credential.credential}
                        matchingRequirements={
                          credentialData.matchingRequirements
                        }
                      />
                    </StyledSelectRow>
                  ))
                ) : (
                  <div>{i18n.t("noMatchCredentials")}</div>
                )}
              </div>
            </StyledJsonViewSmall>
          </div>
        );
      })}
    </>
  );
};

const StyledTipSpan = styled.span`
  margin-right: 4px;
`;
const CredentialDisplay = ({ credential, matchingRequirements }) => {
  const witnessType = credential.witness?.type || "unknown";
  const simplifiedData = PrettyPrinter.simplifyCredentialData(credential);
  const description = credential.metadata?.description;

  return (
    <div>
      {description && <p>{description}</p>}
      <pre>{JSON.stringify(simplifiedData, null, 2)}</pre>
      <div>
        <StyledTipSpan>Type: {witnessType}</StyledTipSpan>
        <p>
          {i18n.t("credentialsMatchTip", {
            keys: matchingRequirements.map((r) => r.inputKey).join(", "),
          })}
        </p>
      </div>
    </div>
  );
};

export default SignView;
