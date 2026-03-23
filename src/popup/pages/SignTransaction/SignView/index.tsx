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
import { CheckBox } from "@/popup/component/CheckBox";
import { ConfirmModal } from "@/popup/component/ConfirmModal";
import DAppAdvance from "@/popup/component/DAppAdvance";
import DappWebsite from "@/popup/component/DappWebsite";
import { LedgerInfoModal } from "@/popup/component/LedgerInfoModal";
import LedgerStatusView from "@/popup/component/StatusView/LedgerStatusView";
import NetworkStatusView from "@/popup/component/StatusView/NetworkStatusView";
import Tabs, { Tab } from "@/popup/component/Tabs";
import Toast from "@/popup/component/Toast";
import { updateLedgerConnectStatus } from "@/reducers/ledger";
import { copyText } from "@/utils/browserUtils";
import { sendMsg, sendMsgV2 } from "@/utils/commonMsg";

import ledgerManager from "@/utils/ledger";
import {
  getPrintPresentationRequest,
  getPrintVerifierIdentity,
  getSimplifyCredentialData,
} from "@/utils/o1jsUtils";
import {
  addressSlice,
  addressValid,
  createCredentialHash,
  exportFile,
  getRealErrorMsg,
  isNaturalNumber,
  isNumber,
  toNonExponential,
  trimSpace,
} from "@/utils/utils";
import {
  getAccountUpdateCount,
  getZkAppFeePayerAddress,
  getZkFee,
  getZkInfo,
} from "@/utils/zkUtils";
import { DAppActions } from "@aurowallet/mina-provider";
import BigNumber from "bignumber.js";
import { useFeeValidation } from "@/hooks/useFeeValidation";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import type { InputChangeEvent } from "@/popup/types/common";
import { serializeError } from "serialize-error";
import styled from "styled-components";
import browser from "webextension-polyfill";
import { getZekoNetFee } from "../../../../background/api";
import { TRANSACTION_FEE, ZEKO_FEE_INTERVAL_TIME } from "../../../../constant";
import { CredentialMsg } from "../../../../constant/msgTypes";
import { TimerProvider } from "../../../../hooks/TimerContext";
import { updateShouldRequest } from "../../../../reducers/accountReducer";
import {
  getBalanceForUI,
  isZekoNet,
  parsedZekoFee,
} from "../../../../utils/utils";
import CountdownTimer from "../../../component/CountdownTimer";
import { TypeRowInfo } from "../TypeRowInfo";
import {
  StyledSectionSign,
  StyledTitleRow,
  StyledTitleRight,
  StyledTitle,
  StyledContent,
  StyledAccountRow,
  StyledRowLeft,
  StyledRowTitle,
  StyledRowContent,
  StyledRowDescContent,
  StyledFeeCon,
  StyledFeeContent,
  StyledFeeTypeBase,
  StyledFeeTypeSite,
  StyledRowArrow,
  StyledRowRight,
  StyledRightWrapper,
  StyledTypeRow,
  StyledModeWrapper,
  StyledRowPurpleContent,
  StyledHighFeeTip,
  StyledBtnGroup,
  StyledTabContent,
  StyledClickCss,
  StyledRowData,
  StyledScrollBtn,
  StyledCustomTabPanelCss,
} from "./index.styled";

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
  DAppActions.mina_signMessage,
  DAppActions.mina_sign_JsonMessage,
];

const StyledJsonView = styled.div`
  overflow-y: auto;
  border-radius: 4px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  padding: 10px;
  color: rgba(0, 0, 0, 0.8);
  margin-top: 20px;
  overflow-y: auto;
  width: calc(100% - 20px);
  overflow-wrap: break-word;
  white-space: pre-wrap;
  pre {
    font-size: 12px;
    line-height: 17px;
    margin: 0;
    color: rgba(0, 0, 0, 0.8);
    word-break: break-all;
    white-space: pre-wrap;
  }
`;

const StyledJsonViewSmall = styled(StyledJsonView)<{ $ismulti?: boolean }>`
  border: unset;
  margin-top: 10px;
  padding: 0px;
  width: 100%;
`;
const StyledFeeWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
`;

interface SignParams {
  id?: string;
  site?: { origin?: string; webIcon?: string };
  params?: {
    action?: string;
    transaction?: string;
    feePayer?: { fee?: string | number; memo?: string };
    fee?: string | number;
    nonce?: string | number;
    onlySign?: boolean;
    message?: string | Record<string, unknown>;
    credential?: Record<string, unknown>;
    presentationData?: Record<string, unknown>;
    to?: string;
    amount?: string | number;
    memo?: string;
  };
}

interface SignViewProps {
  signParams?: SignParams;
  showMultiView?: boolean;
  onRemoveTx?: (id?: string, type?: string, nonce?: string | number) => void;
  inferredNonce?: string | number;
  advanceData?: Record<string, { fee?: string; nonce?: string }>;
  onUpdateAdvance?: (data: { id: string; fee: string; nonce: string }) => void;
}

// Credential data interface
interface CredentialData {
  witness?: { type?: string };
  [key: string]: unknown;
}

// Sandbox message result interface
interface SandboxValidateResult {
  error?: { message?: string };
  result?: string;
}

// Stored credential interface
interface StoredCredential {
  credential: string;
  address: string;
}

// Tab content item interface - content can be string or TypeRowData[] for JSON/ZK data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface TabContentItem {
  id: string;
  label: string;
  content: any; // Can be string, TypeRowData[], or Record for various display modes
  isZkData?: boolean;
  isJsonData?: boolean;
  contentClick?: boolean;
}

// ZkApp account update interface for parsing
interface ZkAppAccountUpdate {
  authorization: { proof?: string };
  body: { publicKey: string };
}

// ============ Shared Interfaces ============

// Credential requirement interface
interface CredentialRequirement {
  inputKey: string;
  type: string;
  dataFields: string[];
}

// Credential data structure
interface CredentialItem {
  witness?: { type?: string };
  metadata?: { description?: string };
  credential?: { value?: { data?: Record<string, unknown> }; data?: Record<string, unknown> };
  [key: string]: unknown;
}

// Parsed credential
interface ParsedCredentialItem {
  id: string;
  credential: { credential: CredentialItem; credentialStr: string };
  matchingRequirements: CredentialRequirement[];
}

const SignView = ({
  signParams,
  showMultiView,
  onRemoveTx,
  inferredNonce,
  advanceData = {},
  onUpdateAdvance,
}: SignViewProps) => {
  const dispatch = useAppDispatch();
  const currentAccount = useAppSelector(
    (state) => state.accountInfo.currentAccount
  );
  const mainTokenNetInfo = useAppSelector(
    (state) => state.accountInfo.mainTokenNetInfo
  );
  const tokenList = useAppSelector(
    (state) => state.accountInfo.tokenList
  );

  const tokenSymbolMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const token of tokenList) {
      const symbol = token.tokenNetInfo?.tokenSymbol;
      if (symbol) {
        map[token.tokenId] = symbol;
      }
    }
    return map;
  }, [tokenList]);
  const tokenDecimalsMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const token of tokenList) {
      map[token.tokenId] = token.tokenBaseInfo.decimals;
    }
    return map;
  }, [tokenList]);
  const { feeErrorTip, validateFee, feeConfig } = useFeeValidation();
  const currentNode = useAppSelector((state) => state.network.currentNode);

  const [advanceStatus, setAdvanceStatus] = useState(false);
  const [customFeeStatus, setCustomFeeStatus] = useState(false);
  const [zekoPerFee, setZekoPerFee] = useState(TRANSACTION_FEE);

  const [nonceType, setNonceType] = useState("");
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [btnLoading, setBtnLoading] = useState(false);
  const [ledgerModalStatus, setLedgerModalStatus] = useState(false);

  const [confirmModalStatus, setConfirmModalStatus] = useState(false);
  const [isLedgerAccount, setIsLedgerAccount] = useState(false);

  const [showRawData, setShowRawData] = useState(false);
  const [showRawDetail, setShowRawDetail] = useState(false);

  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const [advanceFee, setAdvanceFee] = useState("");
  const [advanceNonce, setAdvanceNonce] = useState("");
  const [selectedCredentials, setSelectedCredentials] = useState<Map<string, { credential: unknown; credentialStr?: string }>>(new Map());

  const isZeko = useMemo(() => {
    return isZekoNet(currentNode.networkID);
  }, [currentNode]);
  const {
    sendAction,
    siteRecommendFee,
    currentAdvanceData,
    transactionTypeName,
    credentialData,
    presentationData,
  } = useMemo(() => {
    let sendAction = signParams?.params?.action || "";
    const body = signParams?.params?.transaction || "";
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
      credentialData = signParams?.params?.credential || {};
    }
    if (sendAction == DAppActions.mina_requestPresentation) {
      presentationData = signParams?.params?.presentationData || {};
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
    defaultRecommendFee,
    zkAppNonce,
    zkAppUpdateCount,
  } = useMemo(() => {
    const isSendZk = sendAction === DAppActions.mina_sendTransaction;
    let zkShowData = "",
      zkSourceData = "",
      zkFormatData: unknown[] = [],
      count = 0;

    if (isSendZk) {
      zkShowData = signParams?.params?.transaction || "";
      try {
        zkFormatData = getZkInfo(zkShowData || "", currentAccount.address || "", tokenSymbolMap, tokenDecimalsMap);
        zkSourceData = JSON.stringify(JSON.parse(zkShowData), null, 2);
        count = getAccountUpdateCount(zkShowData);
      } catch (error) {}
    }
    let zkOnlySign = signParams?.params?.onlySign && isSendZk;
    let zkAppNonce = isNumber(signParams?.params?.nonce)
      ? signParams?.params?.nonce
      : "";

    let defaultRecommendFee: number = Number(feeConfig?.transactionFee?.medium ?? TRANSACTION_FEE);
    if (isSendZk) {
      const zkAccountFee = new BigNumber(feeConfig?.zkAppAccountUpdateFee ?? 0).multipliedBy(
        count
      );
      defaultRecommendFee = new BigNumber(feeConfig?.transactionFee?.medium ?? 0)
        .plus(zkAccountFee)
        .toNumber();
    }
    return {
      isSendZk,
      zkSourceData,
      zkFormatData,
      zkOnlySign,
      defaultRecommendFee,
      zkAppNonce,
      zkAppUpdateCount: count,
    };
  }, [sendAction, signParams, currentAccount, feeConfig, tokenSymbolMap, tokenDecimalsMap]);

  useEffect(() => {
    if (isNumber(currentAdvanceData.fee)) {
      setCustomFeeStatus(true);
      setAdvanceFee(currentAdvanceData.fee || "");
    }
    if (isNaturalNumber(currentAdvanceData.nonce)) {
      setAdvanceNonce(currentAdvanceData.nonce || "");
    }
  }, [currentAdvanceData]);

  const { nextFee, feeType } = useMemo(() => {
    let nextFee: string | number = "";
    let feeType = "";
    if (isNumber(advanceFee) && Number(advanceFee) > 0) {
      nextFee = advanceFee;
      feeType = ZkAppValueType.custom;
    } else {
      if (
        isNumber(siteRecommendFee) &&
        Number(siteRecommendFee) > 0 &&
        !customFeeStatus
      ) {
        nextFee = siteRecommendFee;
        feeType = ZkAppValueType.site;
      } else {
        feeType = ZkAppValueType.default;
        if (isZeko) {
          nextFee = zekoPerFee;
        } else {
          nextFee = defaultRecommendFee;
        }
      }
    }
    return {
      nextFee,
      feeType,
    };
  }, [advanceFee, siteRecommendFee, isZeko, zekoPerFee, customFeeStatus]);

  useEffect(() => {
    const fetchFee = async () => {
      if (isZeko) {
        const fee = await getZekoNetFee(zkAppUpdateCount + 1);
        setZekoPerFee(parsedZekoFee(fee as string) as number);
      }
    };
    fetchFee();
  }, [isZeko, zkAppUpdateCount]);

  const onFeeTimerComplete = useCallback(async () => {
    if (isZeko) {
      const fee = await getZekoNetFee(zkAppUpdateCount + 1);
      const parsedFee = parsedZekoFee(fee as string);
      if (typeof parsedFee === 'number') {
        setZekoPerFee(parsedFee);
      }
    }
  }, [isZeko, zkAppUpdateCount]);

  const feeIntervalTime = useMemo(() => {
    if (!isZeko) {
      return 0;
    }
    if (feeType !== ZkAppValueType.default) {
      return 0;
    }
    return ZEKO_FEE_INTERVAL_TIME;
  }, [isZeko, feeType]);

  useEffect(() => {
    setIsLedgerAccount(currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER);
  }, [currentAccount]);

  const onSelectedTab = useCallback((tabIndex: number) => {
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
          resultOrigin: signParams?.site?.origin,
          id: signParams?.id,
        },
      },
      async () => {
        onRemoveTx?.(signParams?.id || "");
      }
    );
  }, [currentAccount, signParams, sendAction, onRemoveTx]);

  const onSubmitSuccess = useCallback(
    (data: Record<string, unknown>, nonce?: string | number, type?: string) => {
      if (data.error) {
        let errorMessage = i18n.t("postFailed");
        let realMsg = getRealErrorMsg(data.error);
        errorMessage = realMsg ? realMsg : errorMessage;
        Toast.info(errorMessage, 5 * 1000);
        return;
      } else {
        let resultAction = "";
        let payload: Record<string, unknown> = {};
        let id = "";
        payload.resultOrigin = signParams?.site?.origin;
        payload.id = signParams?.id;
        const typedData = data as {
          sendDelegation?: { delegation?: { hash?: string; id?: string } };
          sendPayment?: { payment?: { hash?: string; id?: string } };
          hash?: string;
          id?: string;
        };
        switch (sendAction) {
          case DAppActions.mina_sendStakeDelegation:
            payload.hash = typedData.sendDelegation?.delegation?.hash;
            payload.paymentId = typedData.sendDelegation?.delegation?.id;
            id = typedData.sendDelegation?.delegation?.id || "";
            resultAction = DAPP_ACTION_SEND_TRANSACTION;
            break;
          case DAppActions.mina_sendPayment:
            payload.hash = typedData.sendPayment?.payment?.hash;
            payload.paymentId = typedData.sendPayment?.payment?.id;
            id = typedData.sendPayment?.payment?.id || "";
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
          async () => {
            onRemoveTx?.(signParams?.id, TX_CLICK_TYPE.CONFIRM, nonce);
          }
        );
      }
    },
    [signParams, sendAction, onRemoveTx, zkOnlySign]
  );
  useEffect(() => {
    setShowRawData(isSendZk && selectedTabIndex === 0);
  }, [isSendZk, selectedTabIndex]);

  const handleLedgerSign = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (params: any) => {
      const { status } = await ledgerManager.ensureConnect();
      if (status !== LEDGER_STATUS.READY) {
        setLedgerModalStatus(true);
        return false;
      }

      setBtnLoading(true);
      try {
        let result;
        let response;
        if (sendAction === DAppActions.mina_sendPayment) {
          result = await ledgerManager.signPayment(
            params,
            (currentAccount.hdPath || 0) as number
          );
        } else if (sendAction === DAppActions.mina_sendStakeDelegation) {
          result = await ledgerManager.signDelegation(
            params,
            (currentAccount.hdPath || 0) as number
          );
        } else if (SIGN_MESSAGE_EVENT.includes(sendAction)) {
          let nextMsg = params.message;
          if (sendAction === DAppActions.mina_sign_JsonMessage) {
            nextMsg = JSON.stringify(params.message);
          }
          result = await ledgerManager.signMessage(
            nextMsg as string,
            (currentAccount.hdPath || 0) as number
          );
          const { signature, signedMessage, error } = result || {};
          if (error) {
            setConfirmModalStatus(false);
            Toast.info(error.message);
            return;
          }
          response = {
            data: signedMessage,
            publicKey: params.fromAddress,
            signature: signature,
          };
        } else if (sendAction === DAppActions.mina_sendTransaction) {
          setConfirmModalStatus(false);
          return true;
        } else {
          Toast.info(i18n.t("notSupportNow"));
          setConfirmModalStatus(false);
          return false;
        }

        if (result?.rejected) {
          Toast.info(i18n.t("ledgerRejected"));
          setConfirmModalStatus(false);
          return false;
        }
        if (result?.error) {
          Toast.info(result.error.message || "Signature failed");
          setConfirmModalStatus(false);
          return false;
        }

        if (result?.signature && result?.payload) {
          const sendFn =
            sendAction === DAppActions.mina_sendStakeDelegation
              ? sendStakeTx
              : sendTx;

          // Ledger returns signature as string for payment/delegation
          const rawSignature = typeof result.signature === 'string' ? result.signature : undefined;
          response = await sendFn(result.payload, { rawSignature });

          // Check for error in response
          const txResponse = response as { error?: unknown };
          if (txResponse.error) {
            Toast.info(getRealErrorMsg(txResponse.error) || i18n.t("postFailed"));
            setConfirmModalStatus(false);
            return;
          }
        }
        setConfirmModalStatus(false);
        onSubmitSuccess(response as Record<string, unknown>, params.nonce as string, "ledger");

        return true;
      } catch (err) {
        Toast.info("Transaction failed");
        setConfirmModalStatus(false);
        return false;
      } finally {
        setBtnLoading(false);
      }
    },
    [signParams, currentAccount, inferredNonce, nextFee]
  );
  const onStoreInfo = async () => {
    const stringifiedCredential = JSON.stringify(credentialData);
    let credentialToStore;

    try {
      setBtnLoading(true);
      const credential = credentialData as CredentialData;
      const credentialWitnessType = credential.witness?.type;
      if (credentialWitnessType === "unsigned") {
        credentialToStore = stringifiedCredential;
      } else {
        const result = await sendSandboxMessage({
          type: "validate-credential",
          payload: stringifiedCredential,
        }) as SandboxValidateResult;

        if (result?.error || !result?.result) {
          Toast.info(result?.error?.message || "validate credential failed");
          setBtnLoading(false);
          return;
        }
        credentialToStore = result.result;
      }

      const newCredentialHash = createCredentialHash(credentialData);
      const existingCredentials = await sendMsgV2<StoredCredential[]>({
        action: CredentialMsg.get_credentials,
        payload: { address: currentAccount.address },
      });
      const isDuplicate = existingCredentials.some((existing: StoredCredential) => {
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
          payload: {
            credential: parsedResult,
            address: currentAccount.address,
          },
        });
        sendMsg(
          {
            action: DAPP_ACTION_STORE_CREDENTIAL,
            payload: {
              credential: parsedResult,
              resultOrigin: signParams?.site?.origin,
              id: signParams?.id,
            },
          },
          () => {
            onRemoveTx?.(signParams?.id || "", TX_CLICK_TYPE.CONFIRM);
          }
        );
        setBtnLoading(false);
        return { success: parsedResult };
      } catch (error) {
        const err = serializeError(error) as { message?: string };
        Toast.info(
          `Failed to store private credential: ${
            err.message || (error as Error).message || JSON.stringify(error)
          }`
        );
      }
    } catch (error) {
      const err = serializeError(error) as { message?: string };
      Toast.info(
        `Failed to store validate credential: ${
          err.message || (error as Error).message || JSON.stringify(error)
        }`
      );
    }
    return undefined;
  };

  const onPresentation = async () => {
    const { presentationRequest, zkAppAccount } = presentationData as { presentationRequest?: { type?: string }; zkAppAccount?: string };
    const verifierIdentity =
      presentationRequest?.type === "zk-app"
        ? zkAppAccount
        : signParams?.site?.origin;

    if (selectedCredentials.size === 0) {
      Toast.info(i18n.t("credentalSelectTip"));
      return;
    }
    setBtnLoading(true);
    const credentialStrs = Array.from(selectedCredentials.values()).map(
      (entry) => entry.credentialStr
    );
    const result = await sendSandboxMessage({
      type: "presentation",
      payload: {
        presentationRequest,
        selectedCredentials: credentialStrs.length === 1 ? credentialStrs[0] : credentialStrs,
        verifierIdentity,
      },
    });
    const typedResult = result as { error?: { message?: string }; result?: unknown };
    if (typedResult?.error || !typedResult?.result) {
      Toast.info(typedResult.error?.message || "validate credential failed");
      setBtnLoading(false);
      return;
    }
    return typedResult?.result;
  };

  const clickNextStep = useCallback(async () => {
    if (sendAction === DAppActions.mina_storePrivateCredential) {
      await onStoreInfo();
      return;
    }

    if (sendAction === DAppActions.mina_requestPresentation) {
      const res = await onPresentation();
      if (!res) return;
      sendMsg(
        {
          action: DAPP_ACTION_REQUEST_PRESENTATION,
          payload: {
            presentation: res,
            resultOrigin: signParams?.site?.origin,
            id: signParams?.id,
          },
        },
        () => {
          setBtnLoading(false);
          onRemoveTx?.(signParams?.id || "", TX_CLICK_TYPE.CONFIRM);
        }
      );
      return;
    }

    // ==================== 构造 payload（你原有逻辑完全保留） ====================
    let { params } = signParams || {};
    let validNonce = advanceNonce || zkAppNonce || inferredNonce;
    let nonce = trimSpace(validNonce);

    let toAddress = "";
    let fee = "";
    let memo = "";
    if (SIGN_MESSAGE_EVENT.indexOf(sendAction) === -1) {
      toAddress = trimSpace(params?.to as string | undefined) as string;
      fee = trimSpace(nextFee) as string;
      memo = params?.feePayer?.memo || params?.memo || "";
    }

    let fromAddress = currentAccount.address;
    let payload: Record<string, unknown> = {
      fromAddress,
      toAddress,
      nonce,
      currentAccount,
      fee,
      memo,
    };

    if (SIGN_MESSAGE_EVENT.indexOf(sendAction) !== -1) {
      payload.message = params?.message;
    }

    if (sendAction === DAppActions.mina_sendPayment) {
      let amount = trimSpace(params?.amount as string | undefined) || "";
      amount = toNonExponential(new BigNumber(amount as string).toString());
      payload.amount = amount;
    }

    if (isSendZk) {
      payload.transaction = params?.transaction;
      memo = params?.feePayer?.memo || "";
      payload.feePayerAddress = getZkAppFeePayerAddress(params?.transaction);
      payload.zkOnlySign = zkOnlySign;
    }
    if (currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER) {
      return handleLedgerSign(payload);
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
      payload.message = JSON.stringify(payload.message || '');
    } else {
      payload.sendAction = sendAction;
    }
    sendMsg({ action: connectAction, payload }, (data: unknown) => {
      setBtnLoading(false);
      onSubmitSuccess(data as Record<string, unknown>, payload.nonce as string);
    });
    return undefined;
  }, [
    currentAccount,
    signParams,
    advanceNonce,
    nextFee,
    onSubmitSuccess,
    sendAction,
    inferredNonce,
    isSendZk,
    zkOnlySign,
    zkAppNonce,
    onStoreInfo,
    onPresentation,
    onRemoveTx,
  ]);

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
  }, [sendAction]);

  const sendSandboxMessage = (payload: Record<string, unknown>) => {
    return new Promise((resolve, reject) => {
      const sandbox = document.getElementById("o1jssandbox");
      if (!sandbox) {
        resolve({
          error: { message: "Sandbox iframe not found" },
        });
        return;
      }
      // Listen for the response from the sandbox
      const messageHandler = (event: MessageEvent) => {
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
            (data: { signature?: string; error?: { message?: string } }) => {
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
            const allowedOrigin = `chrome-extension://${browser.runtime.id}`;
            (sandbox as HTMLIFrameElement).contentWindow?.postMessage(
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
      (sandbox as HTMLIFrameElement).contentWindow?.postMessage(payload, "*");
    });
  };

  const onConfirm = useCallback(async () => {
    let params = signParams?.params;
    if (
      sendAction == DAppActions.mina_sendPayment ||
      sendAction == DAppActions.mina_sendStakeDelegation
    ) {
      let toAddress = trimSpace(params?.to as string | undefined) || "";
      if (!addressValid(toAddress as string)) {
        Toast.info(i18n.t("sendAddressError"));
        return;
      }
    }
    if (sendAction == DAppActions.mina_sendPayment) {
      let amount = trimSpace(params?.amount as string | undefined) || "";
      if (!isNumber(amount as string) || !new BigNumber(amount as string).gte(0)) {
        Toast.info(i18n.t("amountError"));
        return;
      }
    }
    if (COMMON_TRANSACTION_ACTION.indexOf(sendAction) !== -1) {
      let validNonce = advanceNonce || zkAppNonce || inferredNonce;
      let nonce = trimSpace(validNonce || '') || "";
      if ((nonce as string).length > 0 && !isNumber(nonce)) {
        Toast.info(i18n.t("waitNonce"));
        return;
      }
      let fee = trimSpace(nextFee) as string;
      if (fee.length > 0 && !isNumber(fee)) {
        Toast.info(i18n.t("inputFeeError"));
        return;
      }
      let amount2 = trimSpace(params?.amount as string | undefined) || "0";
      let maxAmount = new BigNumber(amount2 as string).plus(fee).toString();
      if (
        !zkOnlySign &&
        new BigNumber(maxAmount).gt(mainTokenNetInfo?.tokenBaseInfo?.showBalance || 0)
      ) {
        Toast.info(i18n.t("balanceNotEnough"));
        return;
      }
    }
    const isEdge = /Edg\//i.test(navigator.userAgent);
    const isFirefox = /Firefox/i.test(navigator.userAgent);

    if (sendAction === DAppActions.mina_requestPresentation && isEdge) {
      Toast.info(i18n.t("notSupportNow"));
      return;
    }
    if (
      (sendAction === DAppActions.mina_requestPresentation ||
        sendAction === DAppActions.mina_storePrivateCredential) &&
      isFirefox
    ) {
      Toast.info(i18n.t("notSupportNow"));
      return;
    }
    if (currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER) {
      let support = checkLedgerSupport();
      if (!support) {
        return;
      }
      const { status } = await ledgerManager.ensureConnect();
      dispatch(updateLedgerConnectStatus(status));
      if (status !== LEDGER_STATUS.READY) {
        setLedgerModalStatus(true);
        return;
      }
      setConfirmModalStatus(true);
      clickNextStep();
    } else {
      dispatch(updateLedgerConnectStatus(LEDGER_STATUS.LEDGER_DISCONNECT));
      clickNextStep();
    }
  }, [
    i18n,
    currentAccount,
    signParams,
    mainTokenNetInfo,
    advanceNonce,
    nextFee,
    clickNextStep,
    sendAction,
    inferredNonce,
    zkAppNonce,
    selectedCredentials,
    credentialData,
    presentationData,
    zkOnlySign,
    handleLedgerSign,
    checkLedgerSupport,
    dispatch,
  ]);

  const onClickAdvance = useCallback(() => {
    setAdvanceStatus((state) => !state);
  }, []);
  const onClickClose = useCallback(() => {
    setAdvanceStatus(false);
  }, []);

  const onFeeInput = useCallback(
    (e: InputChangeEvent) => {
      if (!customFeeStatus) {
        setCustomFeeStatus(true);
      }
      setAdvanceFee(e.target.value);
      validateFee(e.target.value);
    },
    [validateFee, customFeeStatus]
  );
  const onNonceInput = useCallback((e: InputChangeEvent) => {
    setAdvanceNonce(e.target.value);
  }, []);

  const onConfirmAdvance = useCallback(() => {
    setAdvanceStatus(false);
    onUpdateAdvance?.({
      id: signParams?.id || "",
      fee: advanceFee,
      nonce: advanceNonce,
    });
  }, [advanceFee, advanceNonce, onUpdateAdvance, signParams]);

  const getContractAddress = useCallback((tx: string | undefined): string | undefined => {
    try {
      let address;
      if (tx) {
        const realTx = JSON.parse(tx) as { accountUpdates?: ZkAppAccountUpdate[] };
        const firstZKapp = realTx?.accountUpdates?.find(
          (update: ZkAppAccountUpdate) => update.authorization.proof !== undefined
        );
        if (firstZKapp !== undefined) {
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
      content = params?.transaction || "";
    } else if (
      sendAction === DAppActions.mina_signFields ||
      sendAction === DAppActions.mina_createNullifier
    ) {
      content = JSON.stringify(content);
    }

    let tabList = [];
    let tabInitId = "";
    if (content) {
      const contentObj: TabContentItem = {
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
    let pageTitle = i18n.t("signatureRequest");
    if (COMMON_TRANSACTION_ACTION.indexOf(sendAction) !== -1 && !zkOnlySign) {
      pageTitle = i18n.t("transactionDetails");
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
    if (advanceNonce) {
      setNonceType(ZkAppValueType.custom);
    } else if (zkAppNonce) {
      setNonceType(ZkAppValueType.site);
    }
  }, [advanceNonce, zkAppNonce]);

  const checkFeeHigh = useCallback(() => {
    validateFee(nextFee);
  }, [nextFee, validateFee]);

  useEffect(() => {
    checkFeeHigh();
  }, [checkFeeHigh]);

  const onClickContent = useCallback(
    (clickAble: boolean | undefined) => {
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

  const tabContentRef = useRef<(HTMLDivElement | null)[]>([]);
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

  const onLedgerInfoModalConfirm = useCallback(async () => {
    const { status } = await ledgerManager.ensureConnect();
    if (status === LEDGER_STATUS.READY) {
      setLedgerModalStatus(false);
      (onConfirm as (isLedger?: boolean) => void)(true);
    }
  }, [onConfirm]);

  const onResetNonce = useCallback(() => {
    setNonceType(ZkAppValueType.custom);
    setAdvanceNonce("");
  }, [inferredNonce]);
  const onSelectCredential = (credentialData: Record<string, unknown>, inputKey: string) => {
    const cred = credentialData.credential as { credential: unknown; credentialStr?: string } | undefined;
    setSelectedCredentials((prev) => {
      const newMap = new Map(prev);
      newMap.set(inputKey, {
        credential: cred?.credential,
        credentialStr: cred?.credentialStr,
      });
      return newMap;
    });
  };

  return (
    <TimerProvider
      intervalTime={feeIntervalTime}
      onTimerComplete={onFeeTimerComplete}
    >
      <StyledSectionSign>
        <StyledTitleRow>
          <StyledTitle>{pageTitle}</StyledTitle>
          <StyledTitleRight>
            <LedgerStatusView />
            <div style={{ marginRight: "6px" }} />
            <NetworkStatusView />
          </StyledTitleRight>
        </StyledTitleRow>
        <StyledContent $showMultiView={showMultiView} $flexLayout={isSendZk}>
          <div>
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
              mainTokenNetInfo={mainTokenNetInfo}
              showMultiView={showMultiView}
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
              showMultiView={showMultiView}
              mainTokenNetInfo={mainTokenNetInfo}
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
                getBalanceForUI(mainTokenNetInfo?.tokenBaseInfo?.showBalance || 0) +
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
                <CommonRow
                  leftTitle={i18n.t("amount")}
                  leftContent={toAmount}
                />
              )}
              {zkAppNonce && (
                <StyledAccountRow>
                  <StyledRowLeft>
                    <StyledRowTitle>{"Nonce"}</StyledRowTitle>
                    <StyledFeeCon>
                      <StyledFeeContent>
                        {advanceNonce || zkAppNonce}
                      </StyledFeeContent>
                      {nonceType !== ZkAppValueType.custom && (
                        nonceType === ZkAppValueType.site
                          ? <StyledFeeTypeSite>{i18n.t("siteSuggested")}</StyledFeeTypeSite>
                          : <StyledFeeTypeBase>{i18n.t("fee_default")}</StyledFeeTypeBase>
                      )}
                    </StyledFeeCon>
                  </StyledRowLeft>
                  {nonceType === ZkAppValueType.site && (
                    <StyledModeWrapper>
                      <StyledRowPurpleContent onClick={onResetNonce}>
                        {i18n.t("reset")}
                      </StyledRowPurpleContent>
                    </StyledModeWrapper>
                  )}
                </StyledAccountRow>
              )}
              <StyledAccountRow>
                <StyledRowLeft>
                  <StyledRowTitle>{i18n.t("networkFee")}</StyledRowTitle>
                  <StyledFeeCon>
                    <StyledFeeContent>
                      {nextFee + " " + MAIN_COIN_CONFIG.symbol}
                    </StyledFeeContent>
                    {feeType !== ZkAppValueType.custom && (
                      feeType === ZkAppValueType.site
                        ? <StyledFeeTypeSite>{i18n.t("siteSuggested")}</StyledFeeTypeSite>
                        : <StyledFeeTypeBase>{i18n.t("fee_default")}</StyledFeeTypeBase>
                    )}
                    <StyledFeeWrapper>
                      <CountdownTimer />
                    </StyledFeeWrapper>
                  </StyledFeeCon>
                </StyledRowLeft>
                <StyledModeWrapper>
                  <StyledRowPurpleContent onClick={onClickAdvance}>
                    {i18n.t("advanceMode")}
                  </StyledRowPurpleContent>
                </StyledModeWrapper>
              </StyledAccountRow>
              <StyledHighFeeTip>{feeErrorTip}</StyledHighFeeTip>
            </>
          ) : (
            <></>
          )}
          {tabList.length > 0 && (
            <StyledAccountRow $noMargin>
              <Tabs
                selected={selectedTabIndex}
                initId={tabInitId}
                onSelect={onSelectedTab}
                customTabPanelCss={StyledCustomTabPanelCss}
                btnRightComponent={
                  showRawData && (
                    <StyledRowData onClick={onClickRawData}>
                      {showRawTitle}
                    </StyledRowData>
                  )
                }
              >
                {tabList.map((tab, index) => {
                  const clickAble = tab.contentClick;
                  return (
                    <Tab key={tab.id} id={tab.id} label={tab.label} style={{ width: '100%', minWidth: 0 }}>
                      {
                        <StyledTabContent
                          onClick={() => onClickContent(clickAble)}
                          ref={(element) => {
                            tabContentRef.current[index] = element;
                          }}
                          style={{ cursor: clickAble ? 'pointer' : 'default' }}
                        >
                          {showScrollBtn && (
                            <StyledScrollBtn onClick={onClickScrollBtn}>
                              <img src="/img/icon_roll.svg" />
                            </StyledScrollBtn>
                          )}
                          {tab.isJsonData || tab.isZkData ? (
                            <TypeRowInfo
                              data={tab.content}
                              isZkData={tab.isZkData}
                            />
                          ) : (
                            tab.content
                          )}
                        </StyledTabContent>
                      }
                    </Tab>
                  );
                })}
              </Tabs>
            </StyledAccountRow>
          )}
        </StyledContent>
        <StyledBtnGroup $showMultiView={showMultiView}>
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
        </StyledBtnGroup>
        <DAppAdvance
          modalVisible={advanceStatus}
          title={i18n.t("advanceMode")}
          onClickClose={onClickClose}
          feeValue={advanceFee}
          feePlaceHolder={String(nextFee)}
          onFeeInput={onFeeInput}
          nonceValue={advanceNonce}
          onNonceInput={onNonceInput}
          onConfirm={onConfirmAdvance}
          feeErrorTip={feeErrorTip}
          zkAppNonce={String(advanceNonce || zkAppNonce || "")}
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
      </StyledSectionSign>
    </TimerProvider>
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
    <StyledAccountRow>
      <StyledRowLeft>
        <StyledRowTitle>{leftTitle}</StyledRowTitle>
        <StyledRowContent $canCopy={leftCopyAble} onClick={onClickLeft}>
          {leftContent}
          <StyledRowDescContent>{leftDescContent}</StyledRowDescContent>
        </StyledRowContent>
      </StyledRowLeft>
      {showArrow && (
        <StyledRowArrow>
          <img src="/img/icon_arrow_purple.svg" />
        </StyledRowArrow>
      )}
      <StyledRowRight>
        <StyledRightWrapper>
          {toTypeName && <StyledTypeRow>{toTypeName}</StyledTypeRow>}
          <StyledRowTitle $rightAlign>{rightTitle}</StyledRowTitle>
        </StyledRightWrapper>
        <StyledRowContent $canCopy={rightCopyAble} onClick={onClickRight}>
          {rightContent}
        </StyledRowContent>
      </StyledRowRight>
    </StyledAccountRow>
  );
};
const StyledJsonWrapper = styled.div`
  width: calc(100% - 0px);
  pre {
    word-break: break-all;
    white-space: pre-wrap;
    margin: 0;
  }
`;
const CredentialView = ({
  currentAccount,
  showAccountAddress,
  credentialData,
  mainTokenNetInfo,
  showMultiView = false,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentAccount: any;
  showAccountAddress?: string;
  credentialData: CredentialItem;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mainTokenNetInfo: any;
  showMultiView?: boolean;
}) => {
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const tabContentRef = useRef<(HTMLDivElement | null)[]>([]);

  const { displayCredentialData, tabList, tabInitId } = useMemo(() => {
    let displayCredentialData = credentialData;
    if (Object.keys(credentialData).length > 0) {
      displayCredentialData = getSimplifyCredentialData(credentialData);
    }

    let tabList = [];
    let tabInitId = "tab1";

    let contentObj = {
      id: "tab1",
      label: i18n.t("content"),
      content: displayCredentialData,
    };
    if (displayCredentialData) {
      tabList.push(contentObj);
    }
    return { displayCredentialData, tabList, tabInitId };
  }, [credentialData]);

  const onSelectedTab = useCallback((tabIndex: number) => {}, []);

  useEffect(() => {
    const targetRef = tabContentRef.current[0];
    if (targetRef) {
      const showBtn = targetRef.scrollHeight > targetRef.clientHeight;
      setShowScrollBtn(showBtn);
    }
  }, [tabContentRef]);
  const onClickScrollBtn = useCallback(() => {
    const targetRef = tabContentRef.current[0];
    if (targetRef) {
      targetRef.scrollTo({
        top: targetRef.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [tabContentRef]);

  return (
    <>
      <CommonRow
        leftTitle={currentAccount.accountName}
        leftContent={showAccountAddress}
        leftCopyContent={currentAccount.address}
        rightTitle={i18n.t("amount")}
        rightContent={
          getBalanceForUI(mainTokenNetInfo?.tokenBaseInfo?.showBalance) +
          " " +
          MAIN_COIN_CONFIG.symbol
        }
      />
      {tabList.length > 0 && (
        <StyledAccountRow $noMargin>
          <Tabs
            selected={0}
            initId={tabInitId}
            onSelect={onSelectedTab}
            customTabPanelCss={StyledCustomTabPanelCss}
          >
            {tabList.map((tab, index) => {
              return (
                <Tab key={tab.id} id={tab.id} label={tab.label} style={{ width: '100%', minWidth: 0 }}>
                  {showScrollBtn && (
                    <StyledScrollBtn onClick={onClickScrollBtn}>
                      <img src="/img/icon_roll.svg" />
                    </StyledScrollBtn>
                  )}
                  {
                    <StyledTabContent
                      ref={(element) => {
                        tabContentRef.current[index] = element;
                      }}
                    >
                      <pre>
                        {JSON.stringify(displayCredentialData, null, 4)}
                      </pre>
                    </StyledTabContent>
                  }
                </Tab>
              );
            })}
          </Tabs>
        </StyledAccountRow>
      )}
    </>
  );
};

const StyledSelectRow = styled.label`
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  border-radius: 4px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;
const StyledTipContent = styled.div`
  width: fit-content;
  padding-top: 10px;
`;
const StyledCredentialRow = styled.div`
  font-weight: 600;
  font-size: 12px;
  color: rgba(0, 0, 0);
  margin-bottom: 6px;
`;
const StyledDivideLine = styled.div`
  height: 3px;
  background: #000000;
  position: relative;
`;
const StyledDivideLineFull = styled.div`
  position: absolute;
  z-index: 1;
  bottom: 0;
  left: 0;
  height: 0.5px;
  background: rgba(0, 0, 0, 0.1);
  width: calc(100vw - 40px);
`;
const StyledRequirementWrapper = styled.div`
  margin-top: 10px;
`;

// PresentationView uses complex runtime credential types from o1js
// Props use any where types are dynamic or from external libraries
const PresentationView = ({
  currentAccount,
  showAccountAddress,
  presentationData,
  origin,
  onSelectCredential,
  showMultiView = false,
  mainTokenNetInfo,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentAccount: any;
  showAccountAddress?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  presentationData: any;
  origin?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelectCredential?: (credentialData: any, inputKey: string) => void;
  showMultiView?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mainTokenNetInfo: any;
}) => {
  const tabContentRef = useRef<(HTMLDivElement | null)[]>([]);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [storedCredentials, setStoredCredentials] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedCredentials, setSelectedCredentials] = useState<Map<string, any>>(new Map());
  useEffect(() => {
    sendMsg(
      {
        action: CredentialMsg.get_credentials,
        payload: currentAccount.address,
      },
      async (credentials: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setStoredCredentials(credentials as any[]);
      }
    );
  }, [currentAccount]);
  const onSelectedTab2 = useCallback((tabIndex: number) => {}, []);

  const { displayPresentation, tabList, tabInitId } = useMemo(() => {
    const { presentationRequest, zkAppAccount } = presentationData;
    const verifierIdentity =
      presentationRequest.type === "zk-app" ? zkAppAccount : origin;
    const formatted = [
      getPrintPresentationRequest(presentationRequest),
      getPrintVerifierIdentity(presentationRequest.type, verifierIdentity),
    ].join("\n");

    let tabList = [];
    let tabInitId = "tab1";

    let contentObj = {
      id: "tab1",
      label: i18n.t("content"),
      content: "",
    };
    if (formatted) {
      tabList.push(contentObj);
    }

    return { displayPresentation: formatted, tabList, tabInitId };
  }, [presentationData, origin]);

  const getCredentialRequirements = (presentationRequest: Record<string, unknown>): CredentialRequirement[] => {
    const extractDataFields = (data: Record<string, unknown> | null | undefined): string[] => {
      if (!data) return [];

      if (data._type === "Struct" && data.properties) {
        return Object.keys(data.properties as Record<string, unknown>);
      }

      if (data._type === "DynamicRecord" && data.knownShape) {
        return Object.keys(data.knownShape as Record<string, unknown>);
      }
      return Object.keys(data);
    };
    const requirements: CredentialRequirement[] = [];
    const spec = presentationRequest.spec as { inputs?: Record<string, unknown> } | undefined;
    if (!spec?.inputs) return requirements;
    
    for (const [key, input] of Object.entries(spec.inputs)) {
      const typedInput = input as { type?: string; credentialType?: string; data?: Record<string, unknown> };
      if (typedInput.type === "credential" && typedInput.credentialType && typedInput.data) {
        requirements.push({
          inputKey: key,
          type: typedInput.credentialType,
          dataFields: extractDataFields(typedInput.data),
        });
      }
    }
    return requirements;
  };
  const credentialMatchesRequirement = (credential: CredentialItem, requirement: CredentialRequirement): boolean => {
    if (credential.witness?.type !== requirement.type) {
      return false;
    }
    const getCredentialDataKeys = (cred: CredentialItem): string[] => {
      const data = cred.credential?.value?.data || cred.credential?.data;
      return data ? Object.keys(data) : [];
    };
    const credentialFields = getCredentialDataKeys(credential);
    return requirement.dataFields.every((field: string) =>
      credentialFields.includes(field)
    );
  };
  const findMatchingRequirements = (credential: CredentialItem, requirements: CredentialRequirement[]): CredentialRequirement[] => {
    return requirements.filter((req: CredentialRequirement) =>
      credentialMatchesRequirement(credential, req)
    );
  };

  const { credentials, requirements } = useMemo(() => {
    try {
      const { presentationRequest, zkAppAccount } = presentationData;
      const credentialRequirements =
        getCredentialRequirements(presentationRequest);
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: unknown) {
      const err = error as Error;
      err.message = `Issue with parsing: ${err.message}`;
      throw err;
    }
  }, [presentationData, storedCredentials]);

  const isSelectedFor = (credentialId: string, inputKey: string): boolean => {
    const selection = selectedCredentials.get(inputKey);
    return selection?.credentialId === credentialId;
  };
  const handleCredentialSelect = (credentialData: { id: string; credential: unknown }, inputKey: string) => {
    setSelectedCredentials((prev: Map<string, { credential: unknown; credentialId: string }>) => {
      const newMap = new Map(prev);
      newMap.set(inputKey, {
        credential: credentialData.credential,
        credentialId: credentialData.id,
      });
      return newMap;
    });
    onSelectCredential && onSelectCredential(credentialData, inputKey);
  };
  useEffect(() => {
    const targetRef = tabContentRef.current[0];
    if (targetRef) {
      const showBtn = targetRef.scrollHeight > targetRef.clientHeight;
      setShowScrollBtn(showBtn);
    }
  }, [tabContentRef]);
  const onClickScrollBtn = useCallback(() => {
    const targetRef = tabContentRef.current[0];
    if (targetRef) {
      targetRef.scrollTo({
        top: targetRef.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [tabContentRef]);

  return (
    <>
      <CommonRow
        leftTitle={currentAccount.accountName}
        leftContent={showAccountAddress}
        leftCopyContent={currentAccount.address}
        rightTitle={i18n.t("amount")}
        rightContent={
          getBalanceForUI(mainTokenNetInfo?.tokenBaseInfo?.showBalance) +
          " " +
          MAIN_COIN_CONFIG.symbol
        }
      />

      {tabList.length > 0 && (
        <StyledAccountRow $noMargin>
          <Tabs
            selected={0}
            initId={tabInitId}
            onSelect={onSelectedTab2}
            customTabPanelCss={StyledCustomTabPanelCss}
          >
            {tabList.map((tab, index) => {
              return (
                <Tab key={tab.id} id={tab.id} label={tab.label} style={{ width: '100%', minWidth: 0 }}>
                  {showScrollBtn && (
                    <StyledScrollBtn onClick={onClickScrollBtn}>
                      <img src="/img/icon_roll.svg" />
                    </StyledScrollBtn>
                  )}
                  {
                    <StyledTabContent
                      ref={(element) => {
                        tabContentRef.current[index] = element;
                      }}
                    >
                      <pre>{displayPresentation ?? ""}</pre>
                    </StyledTabContent>
                  }
                </Tab>
              );
            })}
          </Tabs>
        </StyledAccountRow>
      )}

      {requirements.map((requirement, index) => {
        const matchingCredentials = credentials.filter((cred) =>
          cred.matchingRequirements.some(
            (req: { inputKey?: string }) => req.inputKey === requirement.inputKey
          )
        );
        return (
          <StyledRequirementWrapper key={requirement.inputKey + "_" + index}>
            <StyledTipContent>
              <StyledCredentialRow>{i18n.t("credential")}</StyledCredentialRow>
              <StyledDivideLine>
                <StyledDivideLineFull />
              </StyledDivideLine>
            </StyledTipContent>
            <StyledJsonViewSmall $ismulti={showMultiView}>
              <div>
                {matchingCredentials.length > 0 ? (
                  matchingCredentials.map((credentialData, index) => (
                    <StyledSelectRow
                      key={`${credentialData.id}-${requirement.inputKey}`}
                      onClick={() => {
                        handleCredentialSelect(
                          credentialData,
                          requirement.inputKey
                        );
                      }}
                    >
                      <CheckBox
                        status={isSelectedFor(
                          credentialData.id,
                          requirement.inputKey
                        )}
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
          </StyledRequirementWrapper>
        );
      })}
    </>
  );
};

const StyledCredentialCard = styled.div`
  padding: 10px;
  margin-left: 6px;
`;
const StyledTipSpan = styled.span`
  margin-right: 4px;
`;
const StyledTipWrapper = styled.div`
  color: rgba(0, 0, 0, 0.8);
  font-size: 12px;
`;
const CredentialDisplay = ({ credential, matchingRequirements }: { 
  credential: CredentialItem; 
  matchingRequirements: CredentialRequirement[] 
}) => {
  const witnessType = credential.witness?.type || "unknown";
  const simplifiedData = getSimplifyCredentialData(credential);
  const description = credential.metadata?.description;

  return (
    <StyledCredentialCard>
      {description && <p>{description}</p>}
      <pre>{JSON.stringify(simplifiedData, null, 2)}</pre>
      <StyledTipWrapper>
        <StyledTipSpan>Type: {witnessType}</StyledTipSpan>
        <p>
          {i18n.t("credentialsMatchTip", {
            keys: matchingRequirements.map((r: CredentialRequirement) => r.inputKey).join(", "),
          })}
        </p>
      </StyledTipWrapper>
    </StyledCredentialCard>
  );
};

export default SignView;
