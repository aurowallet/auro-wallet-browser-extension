import BigNumber from "bignumber.js";
import { AccountUpdate } from "../constant/zkAccountUpdateDoc";
import { addressSlice, amountDecimals } from "./utils";
import {
  MAIN_COIN_CONFIG,
  ZK_DEFAULT_TOKEN_ID,
  ZK_EMPTY_PUBLICKEY,
} from "@/constant";

// ============ Types ============

interface BalanceChange {
  magnitude: string;
  sgn: string;
}

interface AccountUpdateBody {
  publicKey: string;
  tokenId: string;
  balanceChange: BalanceChange;
  update: {
    tokenSymbol?: string | null;
    verificationKey?: {
      data: string;
      hash: string;
    };
    permissions?: unknown;
    appState?: unknown;
    timing?: unknown;
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
}

interface ZkInfoItem {
  label: string;
  value?: string;
  children?: ZkInfoItem[];
}

interface ZkAppUpdateInfo {
  totalBalanceChange: string;
  symbol: string;
  updateCount: string;
  from: string;
  to: string;
  isZkReceive: boolean;
}

interface SourceData {
  sender: string;
  receiver: string;
  amount: string | number;
  isNewAccount?: boolean;
}

// ============ Internal Functions ============

function short(s: string): string {
  return ".." + s.slice(-4);
}

function getFormatFeePayer(zkappCommand: ZkAppCommand): Record<string, unknown> {
  const feePayer = zkappCommand.feePayer;
  const body = { ...feePayer.body, authorization: short(feePayer.authorization) };
  if (body.validUntil === null) delete body.validUntil;
  return { label: "FeePayer", ...body };
}

function removeNoUpdateValue(
  data: Record<string, unknown>,
  docBody: { docEntries?: Record<string, unknown>; entries?: Record<string, { type?: string; docEntries?: unknown; entries?: unknown }> }
): boolean {
  const bodyKeys = Object.keys(data);
  let isRemovedAll = true;

  bodyKeys.forEach((key) => {
    const nextBodyContent = data[key];
    const body_docEntries = docBody.docEntries || {};
    const body_entries = docBody.entries || {};

    if (nextBodyContent === body_docEntries[key]) {
      delete data[key];
    } else {
      const nextType = body_entries[key]?.type;

      if (nextType === "object") {
        const childRemoved = removeNoUpdateValue(
          nextBodyContent as Record<string, unknown>,
          body_entries[key] as { docEntries?: Record<string, unknown>; entries?: Record<string, { type?: string }> }
        );
        if (childRemoved) {
          delete data[key];
        } else {
          isRemovedAll = false;
        }
      } else {
        isRemovedAll = false;
      }
    }
  });

  return isRemovedAll;
}

function filterByDefaultsValue(jsonUpdateBody: Record<string, unknown>): Record<string, unknown> {
  const nextRealBody = { ...jsonUpdateBody };
  const nextDocBody = AccountUpdate.entries.body;
  removeNoUpdateValue(nextRealBody, nextDocBody);
  return nextRealBody;
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

function getUpdateBody(zkappCommand: ZkAppCommand): ZkInfoItem {
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
    const balanceChange = new BigNumber(balanceChangeBody.magnitude).isEqualTo(0)
      ? "0"
      : balanceChangeOperator +
        amountDecimals(balanceChangeBody.magnitude, MAIN_COIN_CONFIG.decimals);

    let tokenSymbol: string;
    if (accountItemBody.tokenId === ZK_DEFAULT_TOKEN_ID) {
      tokenSymbol = MAIN_COIN_CONFIG.symbol;
    } else {
      const bodyTokenSymbol = accountItemBody.update.tokenSymbol;
      tokenSymbol = bodyTokenSymbol === null ? "UNKNOWN" : bodyTokenSymbol || "UNKNOWN";
    }

    const showBalanceChange = balanceChange + " " + tokenSymbol;
    updateInfo.children!.push({
      label: "Account #" + (index + 1),
      children: [
        { label: "publicKey", value: addressSlice(publicKey) },
        { label: "tokenId", value: addressSlice(tokenId) },
        { label: "balanceChange", value: showBalanceChange },
      ],
    });
  }

  return updateInfo;
}

// ============ Exported Functions ============

export function getZkInfo(
  zkappCommand: string,
  currentAddress: string
): ZkInfoItem[] {
  try {
    const nextZkCommond: ZkAppCommand = JSON.parse(zkappCommand);
    const feePayerBody = getFormatFeePayerV2(nextZkCommond, currentAddress);
    const accountUpdateBody = getUpdateBody(nextZkCommond);
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
  const { sender, receiver, amount, isNewAccount } = sourceData;
  const nextBuildZkCommand: ZkAppCommand = JSON.parse(buildZkCommand);
  let senderVerified = false;
  let receiverVerified = false;
  const accountUpdateCount = isNewAccount ? 4 : 3;

  if (nextBuildZkCommand.accountUpdates.length !== accountUpdateCount) {
    return false;
  }

  nextBuildZkCommand.accountUpdates.forEach((accountUpdate) => {
    const { publicKey, balanceChange, tokenId } = accountUpdate.body;

    if (tokenId === sendTokenId) {
      if (publicKey === sender) {
        if (
          balanceChange.magnitude === amount.toString() &&
          balanceChange.sgn === "Negative"
        ) {
          senderVerified = true;
        }
      }

      if (publicKey === receiver) {
        if (
          balanceChange.magnitude === amount.toString() &&
          balanceChange.sgn === "Positive"
        ) {
          receiverVerified = true;
        }
      }
    }
  });

  return senderVerified && receiverVerified;
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
        new BigNumber(b.amount).comparedTo(new BigNumber(a.amount)) || 0
      );
    }

    if (otherList.length > 0) {
      otherList.sort((a, b) =>
        new BigNumber(b.amount).comparedTo(new BigNumber(a.amount)) || 0
      );
    }

    let symbol = "";
    let from = "";
    let to = "";
    let isZkReceive = false;

    if (totalBalanceChange.isGreaterThan(0)) {
      symbol = "+";
      from = updateList.length > 0 ? (updateList[0]?.address || "") : (otherList[0]?.address || "");
      to = publicKey;
      isZkReceive = true;
    } else if (totalBalanceChange.isLessThan(0)) {
      symbol = "-";
      totalBalanceChange = totalBalanceChange.abs();
      from = publicKey;
      to = updateList.length > 0 ? (updateList[0]?.address || "") : (otherList[0]?.address || "");
      isZkReceive = false;
    } else {
      let result: { address: string; amount: string } | undefined;
      if (updateList.length > 0) {
        result = updateList.find((item) => item.address !== feePayer) || { address: "", amount: "" };
        to = result.address || publicKey;
      } else {
        result = otherList.find((item) => item.address !== feePayer) || { address: "", amount: "" };
        to = result.address || publicKey;
      }
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
