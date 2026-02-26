import { NetworkID_MAP } from "@/constant/network";
import { BASE_INFO_URL } from "../../../config";
import { DEFAULT_TX_REQUEST_LENGTH, ZK_DEFAULT_TOKEN_ID, DEFAULT_FEE_CONFIG } from "../../constant";
import {
  LOCAL_BASE_INFO,
  LOCAL_CACHE_KEYS,
  RECOMMEND_FEE,
  SCAM_LIST,
  SUPPORT_TOKEN_LIST,
} from "../../constant/storageKey";
import { getCurrentNodeConfig } from "../../utils/browserUtils";
import { getReadableNetworkId, parseStakingList, type StakingListResult } from "../../utils/utils";

import { getLocal, saveLocal } from "../localStorage";
import {
  commonFetch,
  startFetchMyMutation,
  startFetchMyQuery,
} from "../request";
import {
  getAllTransactionListBody,
  getBalanceBatchBody,
  getBlockInfoBody,
  getDaemonStatusBody,
  getDelegationInfoBody,
  getFetchAccountBody,
  getNetworkIDBody,
  getPartyBody,
  getPendingTxBody,
  getPendingZkAppTxBody,
  getQATxStatusBody,
  getStakeTxSend,
  getTokenInfoBodyV2,
  getTokenQueryBody,
  getTokenStateBody,
  getTxHistoryBody,
  getTxSend,
  getTxStatusBody,
  getZekoFeeBody,
  getZkAppTransactionListBody,
} from "./gqlparams";
import type { FeeConfig } from "@/types/tx.types";

// ============ Types ============

interface TxPayload {
  fee: string | number;
  to: string;
  from: string;
  nonce: string | number;
  memo?: string;
  validUntil?: string | number;
  amount?: string | number;
}

interface Signature {
  rawSignature?: string;
  field?: string;
  scalar?: string;
}

interface TxResult {
  txList: unknown[];
  address: string;
  tokenId?: string;
}

// ============ Functions ============

/**
 * get txStatus
 * @param {*} paymentId
 */
export async function getTxStatus(paymentId: string): Promise<unknown> {
  const txBody = getTxStatusBody();
  const result = await startFetchMyQuery(txBody, { paymentId });
  return result;
}

export async function getQATxStatus(zkappTransaction: string): Promise<unknown> {
  const txBody = getQATxStatusBody();
  const result = await startFetchMyQuery(txBody, { zkappTransaction });
  return result;
}

function _getGQLVariables(
  payload: TxPayload,
  signature: Signature,
  includeAmount: boolean = true
): Record<string, string> {
  const isRawSignature = !!signature.rawSignature;
  const variables: Record<string, string | number | undefined> = {
    fee: payload.fee,
    to: payload.to,
    from: payload.from,
    nonce: payload.nonce,
    memo: payload.memo || "",
    validUntil: payload.validUntil,
  };
  if (includeAmount) {
    variables.amount = payload.amount;
  }
  if (isRawSignature) {
    variables.rawSignature = signature.rawSignature;
  } else {
    variables.field = signature.field;
    variables.scalar = signature.scalar;
  }
  const result: Record<string, string> = {};
  for (const pro in variables) {
    result[pro] = String(
      typeof variables[pro] === "undefined" ? "" : variables[pro]
    );
  }
  return result;
}

/**
 * send transaction
 */
export async function sendTx(
  payload: TxPayload,
  signature: Signature
): Promise<unknown> {
  const variables = _getGQLVariables(payload, signature, true);
  const txBody = getTxSend(!!variables.rawSignature);
  const res = await startFetchMyMutation(txBody, variables);
  return res;
}

/**
 * send staking
 */
export async function sendStakeTx(
  payload: TxPayload,
  signature: Signature
): Promise<unknown> {
  const variables = _getGQLVariables(payload, signature, false);
  const txBody = getStakeTxSend(!!variables.rawSignature);
  const res = await startFetchMyMutation(txBody, variables);
  return res;
}

/**
 * send zk transaction
 */
export async function sendParty(sendJson: unknown): Promise<unknown> {
  const txBody = getPartyBody();
  const variables = {
    zkappCommandInput: sendJson,
  };
  const res = await startFetchMyMutation(txBody, variables as Record<string, unknown>);
  return res;
}

/**
 * get daemon status
 * @returns {Promise<{error: *}>}
 */
export async function fetchDaemonStatus(): Promise<unknown> {
  const query = getDaemonStatusBody();
  const res = (await startFetchMyQuery(query, {})) as { daemonStatus?: unknown };
  const daemonStatus = res.daemonStatus || {};
  saveLocal(LOCAL_CACHE_KEYS.DAEMON_STATUS, JSON.stringify(daemonStatus));
  return daemonStatus;
}

/**
 * get current block info
 * @param {*} stateHash
 * @returns
 */
export async function fetchBlockInfo(stateHash: string): Promise<unknown> {
  const query = getBlockInfoBody();
  const res = (await startFetchMyQuery(query, { stateHash })) as { block?: unknown };
  const block = res.block || {};
  saveLocal(LOCAL_CACHE_KEYS.BLOCK_INFO, JSON.stringify(block));
  return block;
}

/**
 * get delegation info
 * @param {*} publicKey
 * @returns
 */
export async function fetchDelegationInfo(publicKey: string): Promise<unknown> {
  const query = getDelegationInfoBody();
  const res = (await startFetchMyQuery(query, { publicKey })) as { account?: unknown };
  const account = res.account || {};
  saveLocal(
    LOCAL_CACHE_KEYS.DELEGATION_INFO,
    JSON.stringify({ [publicKey]: account })
  );
  return account;
}

export async function fetchStakingAPY(): Promise<number | null> {
  const netConfig = await getCurrentNodeConfig();
  if (netConfig.networkID !== NetworkID_MAP.mainnet) {
    return null;
  }
  const data = await commonFetch(BASE_INFO_URL + "/staking/apy").catch(() => null) as { apr?: number } | null;
  const apy = data?.apr ?? null;
  if (apy !== null) {
    saveLocal(LOCAL_CACHE_KEYS.STAKING_APY, JSON.stringify(apy));
  }
  return apy;
}

export async function fetchStakingList(): Promise<StakingListResult> {
  const netConfig = await getCurrentNodeConfig();
  if (netConfig.networkID !== NetworkID_MAP.mainnet) {
    return { active: [], inactive: [] };
  }
  const data = await commonFetch(BASE_INFO_URL + "/validators/v2").catch(() => ({}));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stakingList = parseStakingList(data as any);
  saveLocal(LOCAL_CACHE_KEYS.STAKING_LIST, JSON.stringify(stakingList));
  return stakingList as StakingListResult;
}

/**
 * get recommend fee
 */
export async function getRecommendFee(): Promise<FeeConfig> {
  const feeUrl = BASE_INFO_URL + "/fee_config.json";
  const result = await commonFetch(feeUrl).catch(() => null);
  if (result && typeof result === "object" && (result as FeeConfig).transactionFee) {
    saveLocal(RECOMMEND_FEE, JSON.stringify(result));
    return result as FeeConfig;
  }
  const cached = getLocal(RECOMMEND_FEE);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.transactionFee) {
        return parsed as FeeConfig;
      }
    } catch (_e) {
      // ignore parse error
    }
  }
  return DEFAULT_FEE_CONFIG;
}

/**
 * get about page base info
 */
export async function getBaseInfo(): Promise<unknown> {
  const feeUrl = BASE_INFO_URL + "/about_us.json";
  const baseInfo = (await commonFetch(feeUrl).catch((error) => {
    return error;
  })) as { changelog?: unknown };
  let data;
  if (baseInfo.changelog) {
    saveLocal(LOCAL_BASE_INFO, JSON.stringify(baseInfo));
    data = baseInfo;
  }
  return data;
}

/**
 * get pending transaction in gql
 * @param {*} address
 * @returns
 */
export async function getPendingTxList(
  address: string
): Promise<{ txList: unknown[]; address: string }> {
  const txBody = getPendingTxBody();
  const result = (await startFetchMyQuery(txBody, {
    publicKey: address,
  }).catch((error) => error)) as { error?: string; pooledUserCommands?: unknown[] };
  if (result.error) {
    throw new Error(String(result.error));
  }
  const list = result.pooledUserCommands || [];
  return { txList: list, address };
}

/**
 * get balance in batch
 */
export async function getBalanceBatch(
  addressList: string | string[]
): Promise<Record<string, unknown>> {
  let realList: string[];
  if (!Array.isArray(addressList)) {
    realList = [addressList];
  } else {
    realList = addressList;
  }
  const variables: Record<string, string> = {};
  realList.forEach((address, i) => {
    variables[`account${i}`] = address;
  });
  const txBody = getBalanceBatchBody(realList.length);
  const result = (await startFetchMyQuery(txBody, variables).catch(() => {})) as
    | Record<string, unknown>
    | undefined;
  const addressBalances: Record<string, unknown> = {};
  if (result) {
    realList.forEach((address, i) => {
      if (result[`account${i}`]) {
        addressBalances[address] = result[`account${i}`];
      }
    });
  }
  return addressBalances;
}

/**
 * get node networkID
 * @param {*} gqlUrl
 * @returns
 */
export async function getNodeNetworkID(gqlUrl: string): Promise<unknown> {
  const body = getNetworkIDBody();
  const result = await startFetchMyQuery(body, {}, gqlUrl).catch((err) => err);
  return result;
}

/**
 * get currency
 * @param {*} currency
 * @returns
 */
export async function getCurrencyPrice(
  currency: string
): Promise<Record<string, number>> {
  const netConfig = await getCurrentNodeConfig();
  if (netConfig.networkID !== NetworkID_MAP.mainnet) {
    return {};
  }
  const priceUrl =
    BASE_INFO_URL + "/prices?currency=" + encodeURIComponent(currency);
  const data = (await commonFetch(priceUrl).catch(() => {})) as { data?: number } | undefined;
  const price = data?.data || 0;
  const tokenPrice: Record<string, number> = {};
  tokenPrice[ZK_DEFAULT_TOKEN_ID] = price;
  saveLocal(LOCAL_CACHE_KEYS.COIN_PRICE, JSON.stringify(tokenPrice));
  return tokenPrice;
}

/** request gql transaction */
export async function getTxHistory(
  address: string,
  limit?: number
): Promise<TxResult | unknown[]> {
  const netConfig = await getCurrentNodeConfig();
  const gqlTxUrl = netConfig.gqlTxUrl;
  if (!gqlTxUrl) {
    return [];
  }
  const txBody = getTxHistoryBody();
  const result = (await startFetchMyQuery(
    txBody,
    {
      publicKey: address,
      limit: limit || DEFAULT_TX_REQUEST_LENGTH,
    },
    gqlTxUrl
  ).catch((error) => error)) as { error?: string; transactions?: unknown[] };
  if (result.error) {
    throw new Error(String(result.error));
  }
  const txList = result?.transactions || [];
  return { txList, address };
}

/** request gql transaction */
export async function getZkAppTxHistory(
  address: string,
  tokenId: string,
  limit?: number
): Promise<TxResult | unknown[]> {
  const netConfig = await getCurrentNodeConfig();
  const gqlTxUrl = netConfig.gqlTxUrl;
  if (!gqlTxUrl) {
    return [];
  }
  const nextTokenId = tokenId == ZK_DEFAULT_TOKEN_ID ? "" : tokenId;
  const txBody = getZkAppTransactionListBody();
  const result = (await startFetchMyQuery(
    txBody,
    {
      publicKey: address,
      tokenId: nextTokenId,
      limit: limit || DEFAULT_TX_REQUEST_LENGTH,
    },
    gqlTxUrl
  ).catch((error) => error)) as { error?: string; zkapps?: unknown[] };
  if (result.error) {
    throw new Error(String(result.error));
  }
  const txList = result?.zkapps || [];
  return { txList, address, tokenId };
}

/**
 * get full type transaction, contains payment, delegation,zkapp,
 * @param {*} address
 * @param {*} tokenId
 * @param {*} limit
 * @returns
 */
export async function getAllTxHistory(
  address: string,
  tokenId: string,
  limit?: number
): Promise<TxResult | unknown[]> {
  const netConfig = await getCurrentNodeConfig();
  const gqlTxUrl = netConfig.gqlTxUrl;
  if (!gqlTxUrl) {
    return [];
  }
  const nextTokenId = tokenId == ZK_DEFAULT_TOKEN_ID ? "" : tokenId;
  const txBody = getAllTransactionListBody();
  const result = (await startFetchMyQuery(
    txBody,
    {
      publicKey: address,
      tokenId: nextTokenId,
      limit: limit || DEFAULT_TX_REQUEST_LENGTH,
    },
    gqlTxUrl
  ).catch((error) => error)) as { error?: string; fullTransactions?: unknown[] };

  if (result.error) {
    throw new Error(String(result.error));
  }
  const txList = result?.fullTransactions || [];
  return { txList, address, tokenId };
}

export async function getZkAppPendingTx(
  address: string,
  limit?: number
): Promise<{ txList: unknown[]; address: string } | unknown[]> {
  const netConfig = await getCurrentNodeConfig();
  let gqlTxUrl = netConfig.url;
  if (!gqlTxUrl) {
    return [];
  }
  if (gqlTxUrl.indexOf("graphql") !== -1) {
    gqlTxUrl.substring(gqlTxUrl.indexOf("graphql"));
  }
  const txBody = getPendingZkAppTxBody();
  const result = (await startFetchMyQuery(
    txBody,
    {
      publicKey: address,
      limit: limit || 20,
    },
    gqlTxUrl
  ).catch((error) => error)) as { error?: string; pooledZkappCommands?: unknown[] };
  if (result.error) {
    throw new Error(String(result.error));
  }
  const txList = result.pooledZkappCommands || [];
  return { txList, address };
}

/**
 * get scam list
 */
export async function getScamList(): Promise<unknown[]> {
  const feeUrl = BASE_INFO_URL + "/scam_list";
  const result = await commonFetch(feeUrl).catch(() => []);
  if (Array.isArray(result) && result.length > 0) {
    saveLocal(SCAM_LIST, JSON.stringify(result));
  }
  return result as unknown[];
}

export async function getAccountInfo(
  address: string,
  tokenId?: string
): Promise<{ error?: string } | undefined> {
  const accountBody = getFetchAccountBody();
  const queryParams: { publicKey: string; tokenId?: string } = {
    publicKey: address,
  };
  if (tokenId) {
    queryParams.tokenId = tokenId;
  }
  const result = (await startFetchMyQuery(accountBody, queryParams).catch(
    (error) => error
  )) as { error?: string };
  if (result?.error) {
    return { error: result.error };
  }
  return undefined;
}

export async function getAllTokenAssets(address: string): Promise<unknown> {
  const txBody = getTokenQueryBody();
  const result = await startFetchMyQuery(txBody, {
    publicKey: address,
  }).catch((error) => error);
  return result;
}

export async function getAllTokenInfoV2(
  tokenIds: string[]
): Promise<unknown> {
  try {
    const tokenBody = getTokenInfoBodyV2(tokenIds);
    const result = await startFetchMyQuery(tokenBody, {}).catch(
      (error) => error
    );
    return result;
  } catch (error) {
    console.error("Error fetching token info:", error);
    return { error: (error as Error).message };
  }
}

export async function getTokenState(
  address: string,
  tokenId: string
): Promise<unknown> {
  const txBody = getTokenStateBody();
  const result = await startFetchMyQuery(txBody, {
    publicKey: address,
    tokenId,
  }).catch((error) => error);
  return result;
}

/**
 * get token info
 */
export async function fetchSupportTokenInfo(): Promise<unknown[]> {
  const netConfig = await getCurrentNodeConfig();
  const readableNetworkId = getReadableNetworkId(netConfig.networkID);
  const requestUrl =
    BASE_INFO_URL +
    "/tokenInfo?networkId=" +
    encodeURIComponent(readableNetworkId);
  const data = await commonFetch(requestUrl).catch(() => []);
  if (Array.isArray(data) && data.length > 0) {
    saveLocal(
      SUPPORT_TOKEN_LIST + "_" + readableNetworkId,
      JSON.stringify(data)
    );
  }
  return data as unknown[];
}

/**
 * get zeko recommend fee
 */
export async function getZekoNetFee(weight: number = 1): Promise<unknown> {
  const queryBody = getZekoFeeBody();
  const result = (await startFetchMyQuery(queryBody, {
    weight: weight,
  }).catch((error) => error)) as { feePerWeightUnit?: unknown };
  const feePerWeightUnit = result?.feePerWeightUnit;
  return feePerWeightUnit;
}
