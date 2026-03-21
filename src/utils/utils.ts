import { FALLBACK_MESSAGE, errorValues } from "@/constant/dappError";
import { sha256 } from "@noble/hashes/sha256";
import { utf8ToBytes } from "@noble/hashes/utils";
import { createBase58check } from "@scure/base";
import BigNumber from "bignumber.js";
import { MAIN_COIN_CONFIG, TRANSACTION_FEE } from "../constant";
import type { NetworkConfig } from "../constant/network";

const bs58check = createBase58check(sha256);

// ============ Mnemonic Utils ============

export const parseMnemonicWords = (mnemonic: string): string[] => {
  return mnemonic.trim().split(/\s+/).filter(Boolean);
};

// ============ String Utils ============

export function addressSlice(
  address: string | undefined,
  sliceLength: number = 10,
  lastLength: number | string = ""
): string | undefined {
  if (address) {
    const realLastLength = lastLength ? Number(lastLength) : sliceLength;
    return `${address.slice(0, sliceLength)}...${address.slice(-realLastLength)}`;
  }
  return address;
}

export function showNameSlice(name: string | undefined, sliceLength: number = 8): string | undefined {
  if (name && name.length > sliceLength) {
    return `${name.slice(0, sliceLength)}...`;
  }
  return name;
}

export function trimSpace(str: unknown): unknown {
  if (typeof str !== "string") {
    return str;
  }
  let res = str.replace(/(^\s*)|(\s*$)/g, "");
  res = res.replace(/[\r\n]/g, "");
  return res;
}

// ============ Number Utils ============

export function toNonExponential(ExpNumber: string | number): string {
  const num = new BigNumber(ExpNumber);
  return num.toFixed();
}

export function amountDecimals(amount: string | number, decimal: number = 0): string {
  let nextDecimals = decimal;
  if (BigNumber(nextDecimals).gt(100)) {
    nextDecimals = 0;
  }
  const realBalance = new BigNumber(amount)
    .dividedBy(new BigNumber(10).pow(nextDecimals))
    .toString();
  return realBalance;
}

export function getBalanceForUI(
  balance: string | number,
  decimal: number = 0,
  fixed: number = 4
): string {
  try {
    const nextBalance = amountDecimals(balance, decimal);
    if (isNaN(parseFloat(nextBalance)) || Number(nextBalance) === 0) {
      return "0.00";
    }
    const showBalance = new BigNumber(nextBalance).toFixed(Number(fixed), 1).toString();
    return toNonExponential(showBalance);
  } catch (error) {
    return String(balance);
  }
}

export function getAmountForUI(
  rawAmount: string | number,
  decimal: number = MAIN_COIN_CONFIG.decimals,
  fixed: number = 2
): string {
  return new BigNumber(rawAmount)
    .dividedBy(new BigNumber(10).pow(decimal))
    .toFormat(fixed, BigNumber.ROUND_DOWN, {
      groupSeparator: ",",
      groupSize: 3,
      decimalSeparator: ".",
    });
}

export function isNumber(n: unknown, includeE: boolean = false): boolean {
  const isNum = !!String(n).match(/^\d+(?:\.\d*)?$/);
  if (!isNum && includeE) {
    return !!String(n).match(/^\d+e(-)?\d+$/);
  }
  return isNum;
}

export function isTrueNumber(n: unknown): boolean {
  return !!String(n).match(/^([1-9][0-9]*)$/);
}

export function isNaturalNumber(n: unknown): boolean {
  return !!String(n).match(/^([0]|[1-9][0-9]*)$/);
}

export function numberFormat(str: string): string {
  return str.replace(/[^\d^\.]+/g, "").replace(/\.{2,}/, "");
}

// ============ Validation Utils ============

export function urlValid(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return false;
    }
    if (!parsedUrl.hostname || parsedUrl.hostname.length === 0) {
      return false;
    }
    if (parsedUrl.username || parsedUrl.password) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function isPrivateIP(hostname: string): boolean {
  if (hostname === "localhost") return true;
  if (hostname.endsWith(".local")) return true;

  const bare = hostname.startsWith("[") && hostname.endsWith("]")
    ? hostname.slice(1, -1)
    : hostname;

  const parts = bare.split(".").map(Number);
  if (parts.length === 4 && parts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1]! >= 16 && parts[1]! <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 0) return true;
  }

  // IPv6 check
  const lower = bare.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
  if (lower.startsWith("fe80")) return true;
  if (lower.startsWith("::ffff:")) {
    const mapped = lower.slice(7);
    const mappedParts = mapped.split(".").map(Number);
    if (mappedParts.length === 4 && mappedParts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
      return isPrivateIP(mapped);
    }
  }

  return false;
}

export function urlValidStrict(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "https:") {
      return false;
    }
    if (!parsedUrl.hostname || parsedUrl.hostname.length === 0) {
      return false;
    }
    if (parsedUrl.username || parsedUrl.password) {
      return false;
    }
    if (isPrivateIP(parsedUrl.hostname)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function addressValid(address: string): boolean {
  try {
    if (!address.toLowerCase().startsWith("b62")) {
      return false;
    }
    const decoded = bs58check.decode(address);
    const decodedHex = Array.from(decoded)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return !!decodedHex && decodedHex.length === 72;
  } catch {
    return false;
  }
}

export function getCharLength(name: string): number {
  let realLength = 0;
  const len = name.length;
  for (let i = 0; i < len; i++) {
    const charCode = name.charCodeAt(i);
    if (charCode >= 0 && charCode <= 128) {
      realLength += 1;
    } else {
      realLength += 2;
    }
  }
  return realLength;
}

export function nameLengthCheck(name: string, defaultLength: number = 16): boolean {
  const realLength = getCharLength(name);
  return realLength <= defaultLength;
}

// ============ URL Utils ============

export function getOriginFromUrl(url: string | undefined): string {
  try {
    if (!url) return "";
    return new URL(url).origin;
  } catch {
    return "";
  }
}

export function getQueryStringArgs(queryUrl: string = ""): Record<string, string> {
  const paramSplit = queryUrl.split("?");
  let paramUrl = "";
  if (paramSplit.length > 1) {
    paramUrl = paramSplit[1] || "";
  }
  const params = new URLSearchParams(paramUrl);
  const args: Record<string, string> = {};
  params.forEach((value, key) => {
    args[key] = value;
  });
  return args;
}

// ============ Error Utils ============

interface ErrorWithMessage {
  message?: string;
  c?: string;
}

export function getRealErrorMsg(error: unknown): string {
  let errorMessage = "";
  try {
    if (error && typeof error === "object" && "message" in error) {
      errorMessage = (error as ErrorWithMessage).message || "";
    }
    if (Array.isArray(error) && error.length > 0) {
      errorMessage = error[0].message;
      if (!errorMessage && error.length > 1) {
        errorMessage = error[1].c;
      }
    }
    if (typeof error === "string") {
      const lastErrorIndex = error.lastIndexOf("Error:");
      if (lastErrorIndex !== -1) {
        errorMessage = error.slice(lastErrorIndex);
      } else {
        errorMessage = error;
      }
    }
  } catch {
    // ignore
  }
  return errorMessage;
}

export function getMessageFromCode(
  code: number | string,
  fallbackMessage: string = FALLBACK_MESSAGE
): string {
  const codeString = code.toString();
  const message = errorValues[codeString]?.message;
  return message || fallbackMessage;
}

// ============ Staking Utils ============

interface StakingNodeServer {
  public_key: string;
  identity_name: string;
  stake: string | number;
  delegations: number;
  validator_logo?: string;
  fee?: number;
  blocks_created?: number;
  is_active?: boolean;
}

interface StakingNodeParsed {
  nodeAddress: string;
  nodeName: string;
  totalStake: string;
  delegations: number;
  icon: string;
  fee?: number;
  blocksCreated?: number;
  isActive: boolean;
}

export interface StakingListResult {
  active: StakingNodeParsed[];
  inactive: StakingNodeParsed[];
}

interface StakingListFromServerV2 {
  active?: StakingNodeServer[];
  inactive?: StakingNodeServer[];
}

export function parseStakingList(
  stakingListFromServer: StakingNodeServer[] | StakingListFromServerV2 | null
): StakingListResult {
  const emptyResult: StakingListResult = { active: [], inactive: [] };
  if (!stakingListFromServer) return emptyResult;

  const parseNode = (node: StakingNodeServer, isActive?: boolean): StakingNodeParsed => ({
    nodeAddress: node.public_key,
    nodeName: node.identity_name,
    totalStake: getAmountForUI(node.stake, MAIN_COIN_CONFIG.decimals, 0),
    delegations: node.delegations,
    icon: node.validator_logo || "",
    fee: node.fee,
    blocksCreated: node.blocks_created,
    isActive: isActive !== undefined ? isActive : !!node.is_active,
  });

  // v2 format: { active: [...], inactive: [...] }
  if ('active' in stakingListFromServer || 'inactive' in stakingListFromServer) {
    const serverV2 = stakingListFromServer as StakingListFromServerV2;
    const active = (serverV2.active || []).map(n => parseNode(n, true));
    const inactive = (serverV2.inactive || []).map(n => parseNode(n, false));
    return { active, inactive };
  }

  // legacy flat array format
  if (Array.isArray(stakingListFromServer)) {
    const nodes = stakingListFromServer.map(n => parseNode(n));
    return { active: nodes.filter(n => n.isActive), inactive: nodes.filter(n => !n.isActive) };
  }

  return emptyResult;
}

// ============ Time Utils ============

export function getShowTime(time: unknown, needParse: boolean = false): string {
  try {
    if (!time) return "date-time";
    let nextTime = time;
    if (typeof time === "string" && needParse) {
      nextTime = parseInt(time);
    }
    const date = new Date(nextTime as number | string);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hour}:${minute}`;
  } catch {
    return String(time);
  }
}

export function getTimeGMT(time: unknown): string {
  try {
    const date = new Date(time as number | string).toString();
    const gmtIndex = date.indexOf("GMT");
    return date.slice(gmtIndex, gmtIndex + 8);
  } catch {
    return String(time);
  }
}

// ============ Array Utils ============

export function getArrayDiff<T>(deletedList: T[], newList: T[]): T[] {
  return deletedList.filter((item) => !newList.includes(item));
}

export function checkValidStrInList(list: unknown[]): string[] {
  return list.filter(
    (element): element is string => typeof element === "string" && element.trim() !== ""
  );
}

// ============ File Utils ============

declare global {
  interface Navigator {
    msSaveOrOpenBlob?: (blob: Blob, filename: string) => boolean;
  }
}

export function exportFile(data: BlobPart, fileName: string): void {
  const streamData = new Blob([data], { type: "application/octet-stream" });
  if (window.navigator && window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveOrOpenBlob(streamData, fileName);
  } else {
    const link = document.createElement("a");
    link.download = fileName;
    link.style.display = "none";
    link.href = window.URL.createObjectURL(streamData);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// ============ Memo Utils ============

export function decodeMemo(encode: string): string {
  try {
    const encoded = bs58check.decode(encode);
    const memoBytes = encoded.slice(3, 3 + (encoded[2] || 0));
    return new TextDecoder("utf-8").decode(memoBytes);
  } catch {
    return encode;
  }
}

// ============ Network Utils ============

export function checkNodeExist(
  allNodeList: NetworkConfig[],
  url: string
): { index: number; config?: NetworkConfig } {
  let sameIndex = -1;
  let config: NetworkConfig | undefined;
  for (let index = 0; index < allNodeList.length; index++) {
    const nodeItem = allNodeList[index];
    if (nodeItem && nodeItem.url === url) {
      sameIndex = index;
      config = nodeItem;
      break;
    }
  }
  return { index: sameIndex, config };
}

export function getReadableNetworkId(networkId: string): string {
  return networkId.replace(/:/g, "_");
}

export const isZekoNet = (networkID: unknown): boolean => {
  if (!networkID || typeof networkID !== "string") return false;
  return networkID.startsWith("zeko");
};

// ============ Token Utils ============

interface TokenWithId {
  tokenId: string;
  localConfig?: Record<string, unknown>;
  [key: string]: unknown;
}

export function mergeLocalConfigToNetToken<T extends TokenWithId>(
  newTokens: T[],
  localTokens: T[]
): T[] {
  const tokenMap = new Map<string, T>();
  localTokens.forEach((token) => tokenMap.set(token.tokenId, token));
  return newTokens.map((token) => {
    const localToken = tokenMap.get(token.tokenId);
    if (localToken) {
      return { ...token, localConfig: localToken.localConfig ?? {} };
    }
    return token;
  });
}

// ============ Credential Utils ============

interface CredentialData {
  metadata?: unknown;
  [key: string]: unknown;
}

interface MagnitudeValue {
  magnitude: string;
  sgn: "Positive" | "Negative";
}

export const createCredentialHash = (credential: CredentialData): string => {
  const { metadata: _, ...credentialWithoutMetadata } = credential;

  function sortObject(obj: unknown): unknown {
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
      return obj;
    }
    const sorted: Record<string, unknown> = {};
    Object.keys(obj as Record<string, unknown>)
      .sort()
      .forEach((key) => {
        sorted[key] = sortObject((obj as Record<string, unknown>)[key]);
      });
    return sorted;
  }

  const normalized = sortObject(credentialWithoutMetadata);
  const stableString = JSON.stringify(normalized);
  const bytes = utf8ToBytes(stableString);
  const hash = sha256(bytes);
  return Array.from(hash)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

export function getCredentialDisplayData(
  data: Record<string, unknown>
): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(data)) {
    try {
      if (typeof value === "string") {
        result[key] = value;
      } else if (
        value &&
        typeof value === "object" &&
        "magnitude" in value &&
        "sgn" in value
      ) {
        const v = value as MagnitudeValue;
        const sign = v.sgn === "Positive" ? 1 : -1;
        result[key] = sign * parseInt(v.magnitude);
      } else {
        result[key] = JSON.stringify(value);
      }
      if (key === "expiresAt") {
        result[key] = getShowTime(value, true);
      }
    } catch {
      result[key] = "";
    }
  }
  return result;
}

// ============ Permission Utils ============

export function removeUrlFromArrays(
  data: Record<string, (string | null | undefined)[]>,
  urlToRemove: string
): Record<string, string[]> {
  const filteredData: Record<string, string[]> = {};
  for (const key in data) {
    filteredData[key] = (data[key] || []).filter(
      (url): url is string => url !== undefined && url !== null && url !== urlToRemove
    );
  }
  return filteredData;
}

// ============ Password Validation ============

export interface PasswordValidationRule {
  text: string;
  expression: RegExp;
  bool: boolean;
}

export const PasswordValidationList: PasswordValidationRule[] = [
  { text: "passwordRequires", expression: /^.{8,32}$/, bool: false },
  { text: "atLeastOneUppercaseLetter", expression: /[A-Z]+/, bool: false },
  { text: "atLeastOneLowercaseLetter", expression: /[a-z]+/, bool: false },
  { text: "atLeastOneNumber", expression: /[0-9]+/, bool: false },
];

export const validatePassword = (password: string): PasswordValidationRule[] => {
  return PasswordValidationList.map((rule) => ({
    ...rule,
    bool: rule.expression.test(password),
  }));
};

// ============ Fee Utils ============

export const parsedZekoFee = (fee: string | number | undefined, buffer: number = 0.1): string | number => {
  let feePerWeightUnit: string | number | undefined = fee;
  if (feePerWeightUnit) {
    feePerWeightUnit = amountDecimals(feePerWeightUnit, MAIN_COIN_CONFIG.decimals);
    if (buffer) {
      feePerWeightUnit = new BigNumber(feePerWeightUnit).multipliedBy(buffer + 1).toString();
    }
    feePerWeightUnit = new BigNumber(feePerWeightUnit)
      .decimalPlaces(4, BigNumber.ROUND_DOWN)
      .toString();
  } else {
    feePerWeightUnit = TRANSACTION_FEE;
  }
  return feePerWeightUnit;
};
