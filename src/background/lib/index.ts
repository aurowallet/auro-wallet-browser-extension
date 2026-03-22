import BigNumber from "bignumber.js";
import { MAIN_COIN_CONFIG, ZK_EMPTY_PUBLICKEY } from "../../constant";
import { decodeMemo, getMessageFromCode, getRealErrorMsg } from "../../utils/utils";
import { getCurrentNodeConfig } from "../../utils/browserUtils";
import i18n from "i18next";
import { DAppActions } from "@aurowallet/mina-provider";
import { errorCodes } from "@/constant/dappError";
import { NetworkID_MAP } from "@/constant/network";

// ============ Types ============

// mina-signer Client interface
interface MinaSignerClient {
  signPayment(payment: Record<string, unknown>, privateKey: string): SignedPayment;
  signStakeDelegation(delegation: Record<string, unknown>, privateKey: string): SignedPayment;
  signMessage(message: string, privateKey: string): SignedPayment;
  verifyMessage(verifyBody: Record<string, unknown>): boolean;
  signTransaction(body: unknown, privateKey: string): SignedPayment;
  signFields(fields: bigint[], privateKey: string): SignedPayment & { data?: string[] };
  verifyFields(verifyBody: Record<string, unknown>): boolean;
  createNullifier(fields: bigint[], privateKey: string): SignedPayment & { data?: string[] };
}

interface SignedPayment {
  signature?: unknown;
  data?: unknown;
  error?: { message: string };
}

interface SignParams {
  sendAction: string;
  fee: string | number;
  toAddress: string;
  fromAddress: string;
  nonce: string | number;
  memo?: string;
  amount?: string | number;
  message?: string | unknown[];
  transaction?: string;
  feePayerAddress?: string;
}

interface VerifyResult {
  message?: string;
  code?: number;
}

// ============ Functions ============

export async function getSignClient(): Promise<MinaSignerClient> {
  const netConfig = await getCurrentNodeConfig();
  let networkID = "";
  const { default: Client } = await import("mina-signer");
  if (netConfig.networkID) {
    networkID = netConfig.networkID;
  }
  let client;
  if (networkID === NetworkID_MAP.mainnet) {
    client = new Client({ network: "mainnet" });
  } else {
    client = new Client({ network: "testnet" });
  }
  return client as unknown as MinaSignerClient;
}

/**
 * get signed transaction
 * @param {*} privateKey
 * @param {*} fromAddress
 * @param {*} toAddress
 * @param {*} amount
 * @param {*} fee
 * @param {*} nonce
 * @param {*} memo
 */
export async function signPayment(
  privateKey: string,
  fromAddress: string,
  toAddress: string,
  amount: string | number,
  fee: string | number,
  nonce: string | number,
  memo?: string
): Promise<SignedPayment> {
  let signedPayment: SignedPayment;
  try {
    const signClient = await getSignClient();

    const decimal = new BigNumber(10).pow(MAIN_COIN_CONFIG.decimals);
    const sendFee = new BigNumber(fee).multipliedBy(decimal).toFixed(0);
    const sendAmount = new BigNumber(amount).multipliedBy(decimal).toFixed(0);
    signedPayment = signClient.signPayment(
      {
        to: toAddress,
        from: fromAddress,
        amount: sendAmount,
        fee: sendFee,
        nonce: nonce,
        memo,
      },
      privateKey
    );
  } catch (err) {
    const errorMessage = getRealErrorMsg(err) || i18n.t("buildFailed");
    signedPayment = { error: { message: errorMessage } };
  }
  return signedPayment;
}

export async function stakePayment(
  privateKey: string,
  fromAddress: string,
  toAddress: string,
  fee: string | number,
  nonce: string | number,
  memo?: string
): Promise<SignedPayment> {
  let signedStakingPayment: SignedPayment;
  try {
    const signClient = await getSignClient();
    const decimal = new BigNumber(10).pow(MAIN_COIN_CONFIG.decimals);
    const sendFee = new BigNumber(fee).multipliedBy(decimal).toFixed(0);
    signedStakingPayment = signClient.signStakeDelegation(
      {
        to: toAddress,
        from: fromAddress,
        fee: sendFee,
        nonce: nonce,
        memo,
      },
      privateKey
    );
  } catch {
    signedStakingPayment = { error: { message: i18n.t("buildFailed") } };
  }
  return signedStakingPayment;
}

/**
 * build transaction body
 * @param {*} privateKey
 * @param {*} fromAddress
 * @param {*} message
 * @returns
 */
export async function signMessagePayment(
  privateKey: string,
  message: string
): Promise<SignedPayment> {
  let signedResult: SignedPayment;
  try {
    const signClient = await getSignClient();
    signedResult = signClient.signMessage(message, privateKey);
  } catch {
    signedResult = { error: { message: i18n.t("buildFailed") } };
  }
  return signedResult;
}

export async function verifyMessage(
  publicKey: string,
  signature: string | unknown,
  verifyMessageData: string
): Promise<boolean | VerifyResult> {
  let verifyResult: boolean | VerifyResult;
  try {
    const nextSignature =
      typeof signature === "string" ? JSON.parse(signature) : signature;
    const signClient = await getSignClient();
    const verifyBody = {
      data: verifyMessageData,
      publicKey: publicKey,
      signature: nextSignature,
    };
    verifyResult = signClient.verifyMessage(verifyBody);
  } catch {
    verifyResult = {
      message: getMessageFromCode(errorCodes.verifyFailed),
      code: errorCodes.verifyFailed,
    };
  }
  return verifyResult;
}

/** build payment and delegation tx body */
function buildSignTxBody(params: SignParams): Record<string, unknown> {
  const sendAction = params.sendAction;
  const decimal = new BigNumber(10).pow(MAIN_COIN_CONFIG.decimals);
  const sendFee = new BigNumber(params.fee).multipliedBy(decimal).toFixed(0);
  const signBody: Record<string, unknown> = {
    to: params.toAddress,
    from: params.fromAddress,
    fee: sendFee,
    nonce: params.nonce,
    memo: params.memo || "",
  };
  if (sendAction === DAppActions.mina_sendPayment) {
    const sendAmount = new BigNumber(params.amount || 0)
      .multipliedBy(decimal)
      .toFixed(0);
    signBody.amount = sendAmount;
  }
  return signBody;
}

/** QA net sign */
export async function signTransaction(
  privateKey: string,
  params: SignParams
): Promise<SignedPayment> {
  let signResult: SignedPayment;
  try {
    const signClient = await getSignClient();
    let signBody: unknown = {};

    if (params.sendAction === DAppActions.mina_signMessage) {
      signBody = params.message;
    } else if (params.sendAction === DAppActions.mina_sendTransaction) {
      const parseTx = JSON.parse(params.transaction || "{}");
      if (
        params.feePayerAddress &&
        params.feePayerAddress !== ZK_EMPTY_PUBLICKEY &&
        params.feePayerAddress !== params.fromAddress
      ) {
        let memo = "";
        try {
          memo = decodeMemo(parseTx.zkappCommand.memo) || "";
        } catch {}
        signBody = {
          zkappCommand: parseTx,
          feePayer: {
            feePayer: parseTx.feePayer.body.publicKey,
            fee: parseTx.feePayer.body.fee,
            nonce: parseTx.feePayer.body.nonce,
            memo: memo,
          },
        };
      } else {
        const decimal = new BigNumber(10).pow(MAIN_COIN_CONFIG.decimals);
        const sendFee = new BigNumber(params.fee)
          .multipliedBy(decimal)
          .toFixed(0);
        signBody = {
          zkappCommand: parseTx,
          feePayer: {
            feePayer: params.fromAddress,
            fee: sendFee,
            nonce: params.nonce,
            memo: params.memo || "",
          },
        };
      }
    } else {
      signBody = buildSignTxBody(params);
    }
    signResult = signClient.signTransaction(signBody, privateKey);
  } catch (err) {
    const errorMessage = getRealErrorMsg(err) || i18n.t("buildFailed");
    signResult = { error: { message: errorMessage } };
  }
  return signResult;
}

export async function signFieldsMessage(
  privateKey: string,
  params: { message: string[] }
): Promise<SignedPayment & { data?: string[] }> {
  let signResult: SignedPayment & { data?: string[] };
  try {
    const fields = params.message;
    const nextFields = fields.map(BigInt);
    const signClient = await getSignClient();
    signResult = signClient.signFields(nextFields, privateKey);
    signResult.data = fields;
  } catch (err) {
    const errorMessage = getRealErrorMsg(err) || i18n.t("buildFailed");
    signResult = { error: { message: errorMessage } };
  }
  return signResult;
}

export async function verifyFieldsMessage(
  publicKey: string,
  signature: unknown,
  fields: string[]
): Promise<boolean | VerifyResult> {
  let verifyResult: boolean | VerifyResult;
  try {
    const signClient = await getSignClient();

    const nextFields = fields.map(BigInt);
    const verifyBody = {
      data: nextFields,
      publicKey: publicKey,
      signature: signature,
    };
    verifyResult = signClient.verifyFields(verifyBody);
  } catch {
    verifyResult = {
      message: getMessageFromCode(errorCodes.verifyFailed),
      code: errorCodes.verifyFailed,
    };
  }
  return verifyResult;
}

export async function createNullifier(
  privateKey: string,
  params: { message: string[] }
): Promise<SignedPayment & { data?: string[] }> {
  let createResult: SignedPayment & { data?: string[] };
  try {
    const fields = params.message;
    const nextFields = fields.map(BigInt);
    const signClient = await getSignClient();
    createResult = signClient.createNullifier(nextFields, privateKey);
    createResult.data = fields;
  } catch (err) {
    const errorMessage = getRealErrorMsg(err) || i18n.t("buildFailed");
    createResult = { error: { message: errorMessage } };
  }
  return createResult;
}

