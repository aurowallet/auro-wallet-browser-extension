import { DAppActions } from "@aurowallet/mina-provider";
import { ACCOUNT_TYPE } from "@/constant/commonType";
import { QA_SIGN_TRANSACTION, WALLET_CHECK_TX_STATUS } from "@/constant/msgTypes";
import { sendParty } from "@/background/api";
import { sendMsg, sendMsgV2 } from "./commonMsg";
import ledgerManager from "./ledger";
import type { LedgerZkAppBody } from "./ledgerZkApp";

interface ZkAppSignResult {
  data?: { zkappCommand: Record<string, any> };
  error?: unknown;
  rejected?: boolean;
}

interface ZkAppSendResult {
  hash?: string;
  id?: string;
  error?: unknown;
}

export async function signZkAppTransaction(
  payload: LedgerZkAppBody,
  account: { type?: string; hdPath?: number },
  onAwaitDevice?: () => void,
): Promise<ZkAppSignResult | undefined> {
  if (account.type === ACCOUNT_TYPE.WALLET_LEDGER) {
    const result = await ledgerManager.signZkApp(payload, account.hdPath || 0, onAwaitDevice);
    if (!result) return undefined;
    return { data: result.signedZkApp?.data, error: result.error, rejected: result.rejected };
  }
  const result = await sendMsgV2<{ zkappCommand?: Record<string, any>; error?: unknown }>({
    action: QA_SIGN_TRANSACTION,
    payload: { ...payload, sendAction: DAppActions.mina_sendTransaction, zkOnlySign: true },
  });
  return { data: result?.zkappCommand ? { zkappCommand: result.zkappCommand } : undefined, error: result?.error };
}

/** Token and NFT use the same node submission and transaction-status tracking. */
export async function sendZkAppTransaction(command: Record<string, any>): Promise<ZkAppSendResult> {
  const response = await sendParty(command) as {
    error?: unknown;
    sendZkapp?: { zkapp?: { hash?: string; id?: string } };
  } | undefined;
  if (response?.error) return { error: response.error };
  const result = response?.sendZkapp?.zkapp || {};
  if (result.id && result.hash) {
    sendMsg({
      action: WALLET_CHECK_TX_STATUS,
      payload: { paymentId: result.id, hash: result.hash, type: "ZKAPP_TX" },
    });
  }
  return result;
}
