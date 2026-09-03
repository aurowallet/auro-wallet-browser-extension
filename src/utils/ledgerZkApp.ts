import { createBase58check } from "@scure/base";
import { sha256 } from "@noble/hashes/sha256";
import BigNumber from "bignumber.js";
import { MAIN_COIN_CONFIG, ZK_EMPTY_PUBLICKEY } from "@/constant";
import { NetworkID_MAP } from "@/constant/network";
import { getZkappCommandEra, hasUnsupportedZkappStateLength } from "./zkAppSigner";
import { decodeMemo } from "./utils";

const SIGNATURE_VERSION_BYTE = 154;
const SIGNATURE_VERSION_NUMBER = 1;
const MEMO_VERSION_BYTE = 20;
const MEMO_VERSION_NUMBER = 1;
const FIELD_ELEMENT_LENGTH = 32;
const bs58check = createBase58check(sha256);

interface ZkAppFeePayerBody {
  publicKey: string;
  fee: string;
  nonce: string;
  validUntil?: string | number | null;
}

interface ZkAppCommand {
  feePayer: {
    body: ZkAppFeePayerBody;
    authorization: string;
  };
  accountUpdates: Array<{
    body?: {
      publicKey?: string;
      useFullCommitment?: boolean;
      authorizationKind?: { isSigned?: boolean };
    };
    authorization?: { signature?: string | null; [key: string]: unknown };
  }>;
  memo: string;
  [key: string]: unknown;
}

export interface LedgerZkAppBody {
  transaction: string;
  fromAddress: string;
  fee: string | number;
  nonce: string | number;
  memo?: string;
  feePayerAddress?: string;
  zkOnlySign?: boolean;
}

interface MinaSignerClient {
  getZkappCommandCommitments(input: {
    feePayer: LedgerZkAppFeePayer;
    zkappCommand: ZkAppCommand;
  }): { commitment: bigint; fullCommitment: bigint };
}

export interface LedgerZkAppFeePayer {
  feePayer: string;
  fee: string;
  nonce: string;
  memo: string;
  validUntil: string | null;
}

export interface LedgerZkAppSigningRequest {
  fieldElement: bigint;
  feePayer: boolean;
  accountUpdateIndexes: number[];
}

export interface PreparedLedgerZkApp {
  zkappCommand: ZkAppCommand;
  feePayer: LedgerZkAppFeePayer;
  signingRequests: LedgerZkAppSigningRequest[];
}

export interface LedgerSignedZkApp {
  signature: string;
  publicKey: string;
  data: {
    zkappCommand: ZkAppCommand;
    feePayer: LedgerZkAppFeePayer;
  };
}

function bigintToLittleEndian(value: bigint, length: number): Uint8Array {
  if (value < 0n || value >= 1n << BigInt(length * 8)) {
    throw new Error(`Value does not fit in ${length} bytes`);
  }

  const bytes = new Uint8Array(length);
  let remaining = value;
  for (let index = 0; index < length; index++) {
    bytes[index] = Number(remaining & 0xffn);
    remaining >>= 8n;
  }
  return bytes;
}

export function fieldElementToLedgerBytes(fieldElement: bigint): Uint8Array {
  return bigintToLittleEndian(fieldElement, FIELD_ELEMENT_LENGTH);
}

export function ledgerSignatureToBase58(field: string, scalar: string): string {
  const signatureBytes = new Uint8Array(2 + FIELD_ELEMENT_LENGTH * 2);
  signatureBytes[0] = SIGNATURE_VERSION_BYTE;
  signatureBytes[1] = SIGNATURE_VERSION_NUMBER;
  signatureBytes.set(bigintToLittleEndian(BigInt(field), FIELD_ELEMENT_LENGTH), 2);
  signatureBytes.set(
    bigintToLittleEndian(BigInt(scalar), FIELD_ELEMENT_LENGTH),
    2 + FIELD_ELEMENT_LENGTH
  );
  return bs58check.encode(signatureBytes);
}

function encodeMemo(memo: string): string {
  const memoBytes = new TextEncoder().encode(memo);
  if (memoBytes.length > 32) {
    throw new Error("Memo field is longer than 32 bytes");
  }

  const bytes = new Uint8Array(1 + 1 + 1 + 32);
  bytes[0] = MEMO_VERSION_BYTE;
  bytes[1] = MEMO_VERSION_NUMBER;
  bytes[2] = memoBytes.length;
  bytes.set(memoBytes, 3);
  return bs58check.encode(bytes);
}

function getSignerNetwork(networkID: string): "mainnet" | "testnet" {
  return networkID === NetworkID_MAP.mainnet ? "mainnet" : "testnet";
}

function normalizeValidUntil(validUntil: string | number | null | undefined): string | null {
  return validUntil === null || validUntil === undefined ? null : String(validUntil);
}

function addSigningTarget(
  requests: Map<string, LedgerZkAppSigningRequest>,
  fieldElement: bigint,
  target: { feePayer?: boolean; accountUpdateIndex?: number }
): void {
  const key = fieldElement.toString();
  const request = requests.get(key) || {
    fieldElement,
    feePayer: false,
    accountUpdateIndexes: [],
  };
  if (target.feePayer) request.feePayer = true;
  if (target.accountUpdateIndex !== undefined) {
    request.accountUpdateIndexes.push(target.accountUpdateIndex);
  }
  requests.set(key, request);
}

export async function prepareLedgerZkApp(
  body: LedgerZkAppBody,
  networkID: string
): Promise<PreparedLedgerZkApp> {
  const zkappCommand = JSON.parse(body.transaction) as ZkAppCommand;
  if (!zkappCommand?.feePayer?.body || !Array.isArray(zkappCommand.accountUpdates)) {
    throw new Error("Invalid zkApp command");
  }
  if (hasUnsupportedZkappStateLength(zkappCommand)) {
    throw new Error("Unsupported zkApp state layout");
  }

  const useCommandFeePayer =
    !!body.feePayerAddress &&
    body.feePayerAddress !== ZK_EMPTY_PUBLICKEY &&
    body.feePayerAddress !== body.fromAddress;

  const commandFeePayer = zkappCommand.feePayer.body;
  const validUntil = normalizeValidUntil(commandFeePayer.validUntil);
  const memo = useCommandFeePayer
    ? decodeMemo(zkappCommand.memo || "")
    : body.memo || "";
  const feePayer: LedgerZkAppFeePayer = useCommandFeePayer
    ? {
        feePayer: commandFeePayer.publicKey,
        fee: String(commandFeePayer.fee),
        nonce: String(commandFeePayer.nonce),
        memo,
        validUntil,
      }
    : {
        feePayer: body.fromAddress,
        fee: new BigNumber(body.fee)
          .multipliedBy(new BigNumber(10).pow(MAIN_COIN_CONFIG.decimals))
          .toFixed(0),
        nonce: String(body.nonce),
        memo,
        validUntil,
      };

  const { default: Client } = await import("mina-signer");
  const client = new Client({
    network: getSignerNetwork(networkID),
    era: getZkappCommandEra(zkappCommand),
  }) as unknown as MinaSignerClient;
  const { commitment, fullCommitment } = client.getZkappCommandCommitments({
    feePayer,
    zkappCommand,
  });

  zkappCommand.feePayer = {
    body: {
      publicKey: feePayer.feePayer,
      fee: feePayer.fee,
      nonce: feePayer.nonce,
      validUntil: feePayer.validUntil,
    },
    authorization: "",
  };
  zkappCommand.memo = encodeMemo(feePayer.memo);

  const requests = new Map<string, LedgerZkAppSigningRequest>();
  if (feePayer.feePayer === body.fromAddress) {
    addSigningTarget(requests, fullCommitment, { feePayer: true });
  }

  zkappCommand.accountUpdates.forEach((accountUpdate, index) => {
    const updateBody = accountUpdate.body;
    if (
      updateBody?.authorizationKind?.isSigned === true &&
      updateBody.publicKey === body.fromAddress
    ) {
      addSigningTarget(
        requests,
        updateBody.useFullCommitment ? fullCommitment : commitment,
        { accountUpdateIndex: index }
      );
    }
  });

  if (requests.size === 0) {
    throw new Error("The Ledger account is not a signer for this zkApp command");
  }
  if (!body.zkOnlySign && feePayer.feePayer !== body.fromAddress) {
    throw new Error("The Ledger account must be the fee payer to send this zkApp command");
  }

  return {
    zkappCommand,
    feePayer,
    signingRequests: Array.from(requests.values()),
  };
}

export function applyLedgerZkAppSignature(
  prepared: PreparedLedgerZkApp,
  request: LedgerZkAppSigningRequest,
  signature: string
): void {
  if (request.feePayer) {
    prepared.zkappCommand.feePayer.authorization = signature;
  }
  request.accountUpdateIndexes.forEach((index) => {
    const accountUpdate = prepared.zkappCommand.accountUpdates[index];
    if (!accountUpdate) {
      throw new Error(`Missing account update at index ${index}`);
    }
    accountUpdate.authorization = { signature };
  });
}

export function getLedgerSignedZkApp(
  prepared: PreparedLedgerZkApp
): LedgerSignedZkApp {
  return {
    signature: prepared.zkappCommand.feePayer.authorization,
    publicKey: prepared.feePayer.feePayer,
    data: {
      zkappCommand: prepared.zkappCommand,
      feePayer: prepared.feePayer,
    },
  };
}
