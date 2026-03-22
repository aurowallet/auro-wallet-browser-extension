import BigNumber from "bignumber.js";
import { addressSlice, amountDecimals, decodeMemo } from "./utils";
import {
  MAIN_COIN_CONFIG,
  ZK_DEFAULT_TOKEN_ID,
  ZK_EMPTY_PUBLICKEY,
} from "@/constant";

interface BalanceChange {
  magnitude: string;
  sgn: string;
}

interface AccountUpdateBody {
  publicKey: string;
  tokenId: string;
  balanceChange: BalanceChange;
  update: {
    tokenSymbol?: unknown;
    verificationKey?: unknown;
    permissions?: unknown;
    appState?: unknown;
    timing?: unknown;
    delegate?: unknown;
    votingFor?: unknown;
    zkappUri?: unknown;
  };
  callDepth?: number;
  incrementNonce?: boolean;
  useFullCommitment?: boolean;
  implicitAccountCreationFee?: boolean;
  events?: unknown[];
  actions?: unknown[];
  preconditions?: {
    account?: unknown;
    network?: unknown;
    validWhile?: unknown;
  };
  authorizationKind?: {
    isProved?: boolean;
    isSigned?: boolean;
  };
  mayUseToken?: {
    parentsOwnToken: boolean;
    inheritFromParent: boolean;
  };
  callData?: unknown;
}

interface AccountUpdateItem {
  body: AccountUpdateBody;
  authorization?: {
    proof?: string;
    signature?: string | null;
  };
}

interface FeePayer {
  body: {
    publicKey: string;
    fee: string;
    validUntil?: string | null;
  };
  authorization: string;
}

interface ZkAppCommand {
  feePayer: FeePayer;
  accountUpdates: AccountUpdateItem[];
  memo?: string;
}

interface ZkInfoItem {
  label: string;
  value?: string;
  children?: ZkInfoItem[];
  warn?: boolean;
}

interface ZkAppUpdateInfo {
  totalBalanceChange: string;
  symbol: string;
  updateCount: string;
  from: string;
  to: string;
  isZkReceive: boolean;
}

export interface SourceData {
  sender: string;
  receiver: string;
  amount: string | number;
  isNewAccount?: boolean;
}

const ALLOWED_UPDATE_KEYS = new Set<string>([
  "appState",
  "delegate",
  "verificationKey",
  "permissions",
  "zkappUri",
  "tokenSymbol",
  "timing",
  "votingFor",
]);

const SENSITIVE_UPDATE_LABELS: Record<string, string> = {
  delegate: "Delegate",
  permissions: "Permissions",
  verificationKey: "Verification Key",
  timing: "Timing / Vesting",
  votingFor: "Voting For",
  zkappUri: "zkApp URI",
};

function isNullOrFlaggedNone(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'object' && value !== null && 'isSome' in value) {
    return (value as { isSome: boolean }).isSome === false;
  }
  return false;
}

function isUpdateFieldSafe(key: string, value: unknown): boolean {
  if (key === 'tokenSymbol') return true;
  if (key === 'appState') return true;
  return isNullOrFlaggedNone(value);
}

function extractFlaggedValue(val: unknown): unknown {
  if (val && typeof val === 'object' && 'isSome' in val) {
    const flagged = val as { isSome: boolean; value?: unknown };
    return flagged.isSome ? flagged.value : null;
  }
  return val;
}

function formatSensitiveFieldChildren(key: string, innerVal: unknown): ZkInfoItem[] {
  if ((key === 'permissions' || key === 'timing') && typeof innerVal === 'object' && innerVal !== null) {
    return Object.entries(innerVal as Record<string, unknown>).map(([k, v]) => ({
      label: k,
      value: typeof v === 'string' ? v : JSON.stringify(v),
      warn: true,
    }));
  }
  return [];
}

function getSensitiveUpdateItems(update: Record<string, unknown>): ZkInfoItem[] {
  const items: ZkInfoItem[] = [];

  for (const [key, label] of Object.entries(SENSITIVE_UPDATE_LABELS)) {
    const rawVal = update[key];
    if (isNullOrFlaggedNone(rawVal)) continue;

    const innerVal = extractFlaggedValue(rawVal);
    if (innerVal === null || innerVal === undefined) continue;

    const children = formatSensitiveFieldChildren(key, innerVal);

    if (children.length > 0) {
      items.push({ label, warn: true, children });
    } else if (key === 'delegate' && typeof innerVal === 'string') {
      items.push({ label, value: addressSlice(innerVal), warn: true });
    } else if (key === 'verificationKey' && typeof innerVal === 'object' && innerVal !== null) {
      const vk = innerVal as { hash?: string };
      items.push({ label, value: vk.hash ? addressSlice(vk.hash) : "Updated", warn: true });
    } else {
      items.push({
        label,
        value: typeof innerVal === 'string' ? innerVal : JSON.stringify(innerVal),
        warn: true,
      });
    }
  }

  return items;
}

function getFormatFeePayerV2(
  zkappCommand: ZkAppCommand,
  currentAddress: string
): ZkInfoItem {
  const feePayer = zkappCommand.feePayer;
  let feePayerKey = feePayer.body.publicKey;

  if (feePayerKey.toLowerCase() === ZK_EMPTY_PUBLICKEY.toLowerCase()) {
    feePayerKey = currentAddress;
  }

  let fee: string | number = feePayer.body.fee;
  if (fee) {
    fee = amountDecimals(fee, MAIN_COIN_CONFIG.decimals);
  }

  return {
    label: "feePayer",
    children: [
      { label: "publicKey", value: addressSlice(feePayerKey) },
      { label: "fee", value: fee + " " + MAIN_COIN_CONFIG.symbol },
    ],
  };
}

function resolveTokenSymbol(
  rawTokenSymbol: unknown,
  tokenId: string,
  tokenSymbolMap?: Record<string, string>
): string {
  const extracted = extractFlaggedValue(rawTokenSymbol);
  if (typeof extracted === 'string' && extracted !== '') {
    return extracted;
  }

  if (tokenSymbolMap && tokenSymbolMap[tokenId]) {
    return tokenSymbolMap[tokenId];
  }

  if (tokenId === ZK_DEFAULT_TOKEN_ID) {
    return MAIN_COIN_CONFIG.symbol;
  }
  return "UNKNOWN";
}

function resolveTokenDecimals(
  tokenId: string,
  tokenDecimalsMap?: Record<string, number>
): number {
  if (tokenDecimalsMap && tokenDecimalsMap[tokenId] !== undefined) {
    return tokenDecimalsMap[tokenId];
  }
  return MAIN_COIN_CONFIG.decimals;
}

function getUpdateBody(zkappCommand: ZkAppCommand, tokenSymbolMap?: Record<string, string>, tokenDecimalsMap?: Record<string, number>): ZkInfoItem {
  const accountUpdates = zkappCommand.accountUpdates;
  const updateInfo: ZkInfoItem = {
    label: "accountUpdates",
    children: [],
  };

  for (let index = 0; index < accountUpdates.length; index++) {
    const accountItem = accountUpdates[index];
    if (!accountItem) continue;
    const accountItemBody = accountItem.body;
    const publicKey = accountItemBody.publicKey;
    const tokenId = accountItemBody.tokenId;
    const balanceChangeBody = accountItemBody.balanceChange;

    const balanceChangeOperator =
      balanceChangeBody.sgn.toLowerCase() === "negative" ? "-" : "+";
    const decimals = resolveTokenDecimals(tokenId, tokenDecimalsMap);
    const balanceChange = new BigNumber(balanceChangeBody.magnitude).isEqualTo(0)
      ? "0"
      : balanceChangeOperator +
        amountDecimals(balanceChangeBody.magnitude, decimals);

    const tokenSymbol = resolveTokenSymbol(
      accountItemBody.update?.tokenSymbol,
      tokenId,
      tokenSymbolMap
    );

    const showBalanceChange = balanceChange + " " + tokenSymbol;
    const accountChildren: ZkInfoItem[] = [
      { label: "publicKey", value: addressSlice(publicKey) },
      { label: "tokenId", value: addressSlice(tokenId) },
      { label: "balanceChange", value: showBalanceChange },
    ];

    if (accountItemBody.update) {
      const updateRecord = accountItemBody.update as Record<string, unknown>;
      const sensitiveItems = getSensitiveUpdateItems(updateRecord);
      if (sensitiveItems.length > 0) {
        accountChildren.push(...sensitiveItems);
      }
    }

    updateInfo.children!.push({
      label: "Account #" + (index + 1),
      children: accountChildren,
    });
  }

  return updateInfo;
}

export function getZkInfo(
  zkappCommand: string,
  currentAddress: string,
  tokenSymbolMap?: Record<string, string>,
  tokenDecimalsMap?: Record<string, number>
): ZkInfoItem[] {
  try {
    const nextZkCommond: ZkAppCommand = JSON.parse(zkappCommand);
    const feePayerBody = getFormatFeePayerV2(nextZkCommond, currentAddress);
    const accountUpdateBody = getUpdateBody(nextZkCommond, tokenSymbolMap, tokenDecimalsMap);
    return [feePayerBody, accountUpdateBody];
  } catch (error) {
    return [{ label: "Error", value: String(error) }];
  }
}

export function zkCommondFormat(zkAppCommand: unknown): string {
  if (typeof zkAppCommand === "string") {
    return zkAppCommand;
  }
  return JSON.stringify(zkAppCommand);
}

export function getZkFee(zkappCommand: string): string | number {
  try {
    const nextZkCommond: ZkAppCommand = JSON.parse(zkappCommand);
    const feePayer = nextZkCommond.feePayer;
    const fee = feePayer.body.fee;
    if (new BigNumber(fee).isGreaterThan(0)) {
      return amountDecimals(fee, MAIN_COIN_CONFIG.decimals);
    }
    return 0;
  } catch {
    return 0;
  }
}

export function verifyTokenCommand(
  sourceData: SourceData,
  sendTokenId: string,
  buildZkCommand: string
): boolean {
  try {
    const { sender, receiver, amount, isNewAccount } = sourceData;
    const nextBuildZkCommand: ZkAppCommand = JSON.parse(buildZkCommand);
    let senderVerified = false;
    let receiverVerified = false;
    const accountUpdateCount = isNewAccount ? 4 : 3;

    if (!Array.isArray(nextBuildZkCommand.accountUpdates) || 
        nextBuildZkCommand.accountUpdates.length !== accountUpdateCount) {
      return false;
    }

    if (nextBuildZkCommand.accountUpdates.some(item => !item?.body)) {
      return false;
    }

    const feePayerFee = nextBuildZkCommand.feePayer?.body?.fee;
    const feePayerPublicKey = nextBuildZkCommand.feePayer?.body?.publicKey;

    if (feePayerFee === undefined || feePayerFee === null || feePayerFee === "" || !feePayerPublicKey) {
      return false;
    }

    if (new BigNumber(feePayerFee).isNaN()) {
      return false;
    }
    
    if (new BigNumber(feePayerFee).isLessThan(0)) {
      return false;
    }
    
    if (feePayerPublicKey !== sender) {
      return false;
    }

    for (const accountUpdate of nextBuildZkCommand.accountUpdates) {
      if (!accountUpdate || !accountUpdate.body) {
        return false;
      }

      if (!accountUpdate.body.publicKey || !accountUpdate.body.tokenId) {
        return false;
      }

      const { publicKey, balanceChange, tokenId, update } = accountUpdate.body;

      if (update != null && typeof update !== 'object') {
        return false;
      }
      if (update && typeof update === 'object') {
        const updateKeys = Object.keys(update);
        for (const key of updateKeys) {
          if (!ALLOWED_UPDATE_KEYS.has(key)) {
            return false;
          }
        }
        if (publicKey === sender) {
          for (const key of updateKeys) {
            const val = (update as Record<string, unknown>)[key];
            if (!isUpdateFieldSafe(key, val)) {
              return false;
            }
          }
          if (!isNullOrFlaggedNone(update.tokenSymbol)) {
            return false;
          }
        }
      }
      if (!balanceChange || typeof balanceChange.magnitude !== "string" || typeof balanceChange.sgn !== "string") {
        return false;
      }

      if (tokenId === sendTokenId) {
        if (publicKey === sender) {
          if (
            new BigNumber(balanceChange.magnitude).isEqualTo(amount) &&
            balanceChange.sgn === "Negative"
          ) {
            senderVerified = true;
          }
        } else if (publicKey === receiver) {
          if (
            new BigNumber(balanceChange.magnitude).isEqualTo(amount) &&
            balanceChange.sgn === "Positive"
          ) {
            receiverVerified = true;
          }
        } else {
          if (balanceChange.magnitude !== "0") {
            return false;
          }
        }
      } else {
        if (balanceChange.magnitude !== "0" || 
            (balanceChange.sgn !== "Positive" && balanceChange.sgn !== "Negative")) {
          return false;
        }
      }
    }

    return senderVerified && receiverVerified;
  } catch (error) {
    return false;
  }
}

export function getAccountUpdateCount(zkappCommand: string): number {
  const nextZkCommand: ZkAppCommand = JSON.parse(zkappCommand);
  const accountUpdates = nextZkCommand.accountUpdates;
  return accountUpdates.length;
}

export function getZkAppUpdateInfo(
  accountUpdates: AccountUpdateItem[] | null | undefined,
  publicKey: string,
  feePayer: string,
  tokenId: string
): ZkAppUpdateInfo {
  try {
    if (!accountUpdates || accountUpdates.length === 0) {
      return {
        totalBalanceChange: "0",
        symbol: "",
        updateCount: "-",
        from: "",
        to: "",
        isZkReceive: true,
      };
    }

    let totalBalanceChange = new BigNumber(0);
    const updateList: { address: string; amount: string }[] = [];
    const otherList: { address: string; amount: string }[] = [];

    accountUpdates.forEach((update) => {
      const body = update.body;
      const magnitude = new BigNumber(body.balanceChange.magnitude).abs();

      if (body.tokenId === tokenId) {
        if (body.publicKey === publicKey) {
          if (body.balanceChange.sgn === "Negative") {
            totalBalanceChange = totalBalanceChange.minus(magnitude);
          } else if (body.balanceChange.sgn === "Positive") {
            totalBalanceChange = totalBalanceChange.plus(magnitude);
          }
        } else {
          updateList.push({
            address: body.publicKey,
            amount: magnitude.toString(),
          });
        }
      } else {
        otherList.push({
          address: body.publicKey,
          amount: magnitude.toString(),
        });
      }
    });

    if (updateList.length > 0) {
      updateList.sort((a, b) =>
        new BigNumber(b.amount).comparedTo(new BigNumber(a.amount)) ?? 0
      );
    }

    if (otherList.length > 0) {
      otherList.sort((a, b) =>
        new BigNumber(b.amount).comparedTo(new BigNumber(a.amount)) ?? 0
      );
    }

    let symbol = "";
    let from = "";
    let to = "";
    let isZkReceive = false;

    const firstAddress = (list: typeof updateList): string =>
      list[0]?.address ?? "";

    const counterpartyAddress = firstAddress(updateList) || firstAddress(otherList);

    if (totalBalanceChange.isGreaterThan(0)) {
      symbol = "+";
      from = counterpartyAddress;
      to = publicKey;
      isZkReceive = true;
    } else if (totalBalanceChange.isLessThan(0)) {
      symbol = "-";
      totalBalanceChange = totalBalanceChange.abs();
      from = publicKey;
      to = counterpartyAddress;
      isZkReceive = false;
    } else {
      const candidates = updateList.length > 0 ? updateList : otherList;
      const result = candidates.find((item) => item.address !== feePayer);
      to = result?.address || publicKey;
      from = feePayer;
    }

    return {
      totalBalanceChange: totalBalanceChange.toString(),
      symbol,
      updateCount: accountUpdates.length.toString(),
      from,
      to,
      isZkReceive,
    };
  } catch {
    return {
      totalBalanceChange: "0",
      symbol: "",
      updateCount: "-",
      from: "",
      to: "",
      isZkReceive: true,
    };
  }
}

export const getZkAppFeePayerAddress = (tx: string | null | undefined): string => {
  try {
    if (tx) {
      const realTx: ZkAppCommand = JSON.parse(tx);
      const feePayer = realTx?.feePayer;
      return feePayer?.body?.publicKey || "";
    }
    return "";
  } catch {
    return "";
  }
};

export interface TokenTransferInfo {
  sender: string;
  receiver: string;
  amount: string;
  tokenId: string;
  isNewAccount: boolean;
  memo: string;
}

export enum ExtractionErrorCode {
  SENDER_NOT_FOUND = "SENDER_NOT_FOUND",
  RECEIVER_NOT_FOUND = "RECEIVER_NOT_FOUND",
  AMOUNT_MISMATCH = "AMOUNT_MISMATCH",
  INVALID_STRUCTURE = "INVALID_STRUCTURE",
  PARSE_ERROR = "PARSE_ERROR",
}

export type ExtractionResult =
  | { success: true; data: TokenTransferInfo }
  | { success: false; error: string; code: ExtractionErrorCode };

export function extractTokenTransferInfo(
  zkCommand: string,
  expectedTokenId: string
): ExtractionResult {
  try {
    const nextZkCommand: ZkAppCommand = JSON.parse(zkCommand);

    if (!nextZkCommand?.accountUpdates || !Array.isArray(nextZkCommand.accountUpdates)) {
      return { success: false, error: "Invalid transaction structure: missing accountUpdates", code: ExtractionErrorCode.INVALID_STRUCTURE };
    }

    let sender = "";
    let receiver = "";
    let senderAmount = "";
    let receiverAmount = "";
    let senderFound = false;
    let receiverFound = false;

    const isNewAccount = nextZkCommand.accountUpdates.length === 4;

    for (const accountUpdate of nextZkCommand.accountUpdates) {
      if (!accountUpdate?.body) {
        return { success: false, error: "Invalid accountUpdate: missing body", code: ExtractionErrorCode.INVALID_STRUCTURE };
      }
      const { publicKey, balanceChange, tokenId } = accountUpdate.body;

      if (tokenId === expectedTokenId) {
        if (balanceChange.sgn === "Negative" && balanceChange.magnitude !== "0") {
          if (senderFound) {
            return { success: false, error: "Multiple senders found in accountUpdates", code: ExtractionErrorCode.INVALID_STRUCTURE };
          }
          sender = publicKey;
          senderAmount = balanceChange.magnitude;
          senderFound = true;
        }

        if (balanceChange.sgn === "Positive" && balanceChange.magnitude !== "0") {
          if (receiverFound) {
            return { success: false, error: "Multiple receivers found in accountUpdates", code: ExtractionErrorCode.INVALID_STRUCTURE };
          }
          receiver = publicKey;
          receiverAmount = balanceChange.magnitude;
          receiverFound = true;
        }
      }
    }

    if (!senderFound) {
      return { success: false, error: "Sender not found in accountUpdates", code: ExtractionErrorCode.SENDER_NOT_FOUND };
    }
    if (!receiverFound) {
      return { success: false, error: "Receiver not found in accountUpdates", code: ExtractionErrorCode.RECEIVER_NOT_FOUND };
    }
    if (!new BigNumber(senderAmount).isEqualTo(receiverAmount)) {
      return { success: false, error: `Amount mismatch: sender=${senderAmount}, receiver=${receiverAmount}`, code: ExtractionErrorCode.AMOUNT_MISMATCH };
    }

    return {
      success: true,
      data: {
        sender,
        receiver,
        amount: senderAmount,
        tokenId: expectedTokenId,
        isNewAccount,
        memo: nextZkCommand.memo ? decodeMemo(nextZkCommand.memo) : "",
      },
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Parse error: ${errorMsg}`, code: ExtractionErrorCode.PARSE_ERROR };
  }
}
