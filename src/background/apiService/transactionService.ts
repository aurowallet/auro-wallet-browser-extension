import { DAppActions } from "@aurowallet/mina-provider";
import i18n from "i18next";
import browser from "webextension-polyfill";

import { LANGUAGE_CONFIG } from "../../constant/storageKey";
import { FROM_BACK_TO_RECORD, TX_SUCCESS } from "../../constant/msgTypes";
import { changeLanguage } from "../../i18n";
import { getCurrentNodeConfig } from "../../utils/browserUtils";
import { decodeMemo } from "../../utils/utils";
import { extGetLocal } from "../extensionStorage";
import {
  getQATxStatus,
  getTxStatus,
  sendParty,
  sendStakeTx,
  sendTx,
} from "../api";
import { createNullifier, signFieldsMessage, signTransaction } from "../lib";
import { STATUS, FETCH_TYPE_QA } from "./vaultHelpers";

// ============================================
// Types
// ============================================

export interface TransactionParams {
  isSpeedUp?: boolean;
  memo?: string;
  zkOnlySign?: boolean;
  sendAction?: string;
  [key: string]: unknown;
}

export interface SignedTransaction {
  data: {
    zkappCommand?: unknown;
    [key: string]: unknown;
  };
  signature: string;
  error?: string;
}

export interface TransactionResult {
  hash?: string;
  id?: string;
  error?: unknown;
  sendDelegation?: { delegation?: { hash?: string; id?: string } };
  sendPayment?: { payment?: { hash?: string; id?: string } };
  sendZkapp?: { zkapp?: { hash?: string; id?: string } };
  [key: string]: unknown;
}

export interface TxPayload {
  fee: string | number;
  to: string;
  from: string;
  nonce: string | number;
  memo?: string;
  validUntil?: string | number;
  amount?: string | number;
}

export interface Signature {
  rawSignature?: string;
  field?: string;
  scalar?: string;
}

type GetPrivateKeyFn = () => Promise<string | null>;
type TimerRef = { current: ReturnType<typeof setTimeout> | null };

// ============================================
// Transaction Status Checking
// ============================================

export const createTransactionStatusChecker = (
  timerRef: TimerRef,
  notificationFn: (hash: string) => Promise<void>
) => {
  const baseTransactionStatus = (
    method: (paymentId: string) => Promise<unknown>,
    paymentId: string,
    hash: string
  ): void => {
    method(paymentId)
      .then((result) => {
        const data = result as { transactionStatus?: string } | null;
        if (data?.transactionStatus === STATUS.TX_STATUS_INCLUDED) {
          browser.runtime.sendMessage({
            type: FROM_BACK_TO_RECORD,
            action: TX_SUCCESS,
            hash,
          });
          notificationFn(hash);
          if (timerRef.current) clearTimeout(timerRef.current);
        } else if (data?.transactionStatus === STATUS.TX_STATUS_UNKNOWN) {
          if (timerRef.current) clearTimeout(timerRef.current);
        } else {
          timerRef.current = setTimeout(() => {
            baseTransactionStatus(method, paymentId, hash);
          }, 5000);
        }
      })
      .catch(() => {
        timerRef.current = setTimeout(() => {
          baseTransactionStatus(method, paymentId, hash);
        }, 5000);
      });
  };

  const fetchTransactionStatus = (paymentId: string, hash: string): void => {
    baseTransactionStatus(getTxStatus, paymentId, hash);
  };

  const fetchQAnetTransactionStatus = (paymentId: string, hash: string): void => {
    baseTransactionStatus(getQATxStatus, paymentId, hash);
  };

  const checkTxStatus = (paymentId: string, hash: string, type?: string): void => {
    if (type === FETCH_TYPE_QA) {
      fetchQAnetTransactionStatus(paymentId, hash);
    } else {
      fetchTransactionStatus(paymentId, hash);
    }
  };

  return {
    baseTransactionStatus,
    fetchTransactionStatus,
    fetchQAnetTransactionStatus,
    checkTxStatus,
  };
};

// ============================================
// Notification
// ============================================

export const createNotification = async (hash: string): Promise<void> => {
  const netConfig = await getCurrentNodeConfig();
  let myNotificationID: string;
  
  browser.notifications &&
    browser.notifications.onClicked.addListener(function (clickId: string) {
      if (myNotificationID === clickId) {
        const url = netConfig.explorer + "/tx/" + clickId;
        browser.tabs.create({ url });
      }
    });
    
  const i18nLanguage = i18n.language;
  const localLanguage = await extGetLocal(LANGUAGE_CONFIG);
  if (localLanguage && localLanguage !== i18nLanguage) {
    changeLanguage(localLanguage as string);
  }
  
  const title = i18n.t("notificationTitle");
  const message = i18n.t("notificationContent");
  
  browser.notifications
    .create(hash, {
      title,
      message,
      iconUrl: "/img/logo/128.png",
      type: "basic",
    })
    .then((notificationItem) => {
      myNotificationID = notificationItem;
    });
};

// ============================================
// Transaction Sending
// ============================================

export const postStakeTx = async (
  data: TxPayload,
  signature: Signature,
  checkTxStatusFn: (id: string, hash: string) => void
): Promise<TransactionResult> => {
  const stakeRes = await sendStakeTx(data, signature).catch((error) => error) as TransactionResult;
  const delegation = stakeRes?.sendDelegation?.delegation || {};
  if (delegation.hash && delegation.id) {
    checkTxStatusFn(delegation.id, delegation.hash);
  }
  return { ...stakeRes };
};

export const postPaymentTx = async (
  data: TxPayload,
  signature: Signature,
  checkTxStatusFn: (id: string, hash: string) => void
): Promise<TransactionResult> => {
  const sendRes = await sendTx(data, signature).catch((error) => error) as TransactionResult;
  const payment = sendRes?.sendPayment?.payment || {};
  if (payment.hash && payment.id) {
    checkTxStatusFn(payment.id, payment.hash);
  }
  return { ...sendRes };
};

export const postZkTx = async (
  signedTx: SignedTransaction,
  checkTxStatusFn: (id: string, hash: string, type?: string) => void
): Promise<TransactionResult> => {
  const sendPartyRes = await sendParty(signedTx.data.zkappCommand).catch((error) => error) as TransactionResult;
  
  if (!sendPartyRes?.error) {
    const partyRes = sendPartyRes?.sendZkapp?.zkapp || {};
    if (partyRes.id && partyRes.hash) {
      checkTxStatusFn(partyRes.id, partyRes.hash, FETCH_TYPE_QA);
    }
    return { ...partyRes };
  } else {
    return sendPartyRes;
  }
};

export const sendTransaction = async (
  params: TransactionParams,
  getCurrentPrivateKey: GetPrivateKeyFn,
  checkTxStatusFn: (id: string, hash: string, type?: string) => void
): Promise<TransactionResult | SignedTransaction | unknown> => {
  try {
    const nextParams = { ...params };
    const privateKey = await getCurrentPrivateKey();
    
    if (params.isSpeedUp && params.memo) {
      nextParams.memo = decodeMemo(params.memo);
    }
    
    if (!privateKey) {
      return { error: "No private key available" };
    }
    const signedTx = await signTransaction(privateKey, nextParams as any) as any;
    if (signedTx?.error) {
      return { error: signedTx.error };   
    }
    
    if (nextParams.zkOnlySign) {
      return signedTx.data;
    }
    
    const sendAction = params.sendAction;
    switch (sendAction) {
      case DAppActions.mina_signMessage:
        return signedTx;
      case DAppActions.mina_sendPayment:
        return await postPaymentTx(
          signedTx.data,
          signedTx.signature,
          checkTxStatusFn
        );
      case DAppActions.mina_sendStakeDelegation:
        return await postStakeTx(
          signedTx.data,
          signedTx.signature,
          checkTxStatusFn
        );
      case DAppActions.mina_sendTransaction:
        return await postZkTx(signedTx, checkTxStatusFn);
      default:
        return { error: "not support" };
    }
  } catch (err) {
    return { error: err };
  }
};

// ============================================
// Signing Operations
// ============================================

export const signFields = async (
  params: unknown,
  getCurrentPrivateKey: GetPrivateKeyFn
): Promise<{ error?: string; [key: string]: unknown }> => {
  const privateKey = await getCurrentPrivateKey();
  if (!privateKey) {
    return { error: "No private key available" };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const signedResult = await signFieldsMessage(privateKey, params as any) as any;
  if (signedResult?.error) {
    return { error: signedResult.error?.message || signedResult.error };
  }
  return signedResult;
};

export const createNullifierByApi = async (
  params: unknown,
  getCurrentPrivateKey: GetPrivateKeyFn
): Promise<{ error?: string; [key: string]: unknown }> => {
  const privateKey = await getCurrentPrivateKey();
  if (!privateKey) {
    return { error: "No private key available" };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createResult = await createNullifier(privateKey, params as any) as any;
  if (createResult?.error) {
    return { error: createResult.error?.message || createResult.error };
  }
  return createResult;
};
