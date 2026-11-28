import { createBase58check } from "@scure/base";
import { sha256 } from "@noble/hashes/sha256";
import {
  applyLedgerZkAppSignature,
  fieldElementToLedgerBytes,
  getLedgerSignedZkApp,
  ledgerSignatureToBase58,
  prepareLedgerZkApp,
} from "@/utils/ledgerZkApp";
import { signDataV2 } from "../data/sign_data_v2";

const bs58check = createBase58check(sha256);

function littleEndianToBigint(bytes: Uint8Array): bigint {
  let value = 0n;
  for (let index = bytes.length - 1; index >= 0; index--) {
    value = (value << 8n) + BigInt(bytes[index]!);
  }
  return value;
}

function signatureFromBase58(signature: string): { field: string; scalar: string } {
  const bytes = bs58check.decode(signature);
  expect(Array.from(bytes.slice(0, 2))).toEqual([154, 1]);
  return {
    field: littleEndianToBigint(bytes.slice(2, 34)).toString(),
    scalar: littleEndianToBigint(bytes.slice(34, 66)).toString(),
  };
}

describe("Ledger zkApp signing helpers", () => {
  it("encodes the official Zondax field element and signature vectors", () => {
    const vectors = [
      {
        fullCommitment:
          15125478341151450434551337097321105823980530753786707595743937773095033818642n,
        field:
          "11619783670674005040286766680043318342744628142296660823840441823735301563062",
        scalar:
          "5256877650906059721964298241491347735487277814428991042620254968055263398580",
        signature:
          "7mXNThDyNizRWiWq2kbXMZ1SWm6hS4LPY9XFdMjkTUY9Q3SM6VpZUWHqx8oNVb4ypjU3g5asW3hjecFtHvm9LfrP4iGQfGKu",
      },
      {
        fullCommitment:
          5490931312214959595156407183296387647560081342128903631300221129583487063453n,
        field:
          "2851174318468409351646479056778061885738826089603624081964891973494880124377",
        scalar:
          "13778505841453590681917294611129260196551995351800417708011118827598052499276",
        signature:
          "7mXT5yaQuWh8ARufjCEakXRTcn7GXay9P6ju1Mf9MveQnKMsFAh6vcAnhraomMe3V1FMCApUoYscFodv6WScnAZXgD2Jkrcw",
      },
    ];

    vectors.forEach(({ fullCommitment, field, scalar, signature }) => {
      expect(littleEndianToBigint(fieldElementToLedgerBytes(fullCommitment))).toBe(
        fullCommitment
      );
      expect(ledgerSignatureToBase58(field, scalar)).toBe(signature);
    });
  });

  it("builds the same signed zkApp payload as the software signer", async () => {
    const params = signDataV2.signZkTransaction.testnet.signParams as {
      transaction: string;
      fromAddress: string;
      fee: string;
      nonce: string;
      memo: string;
    };
    const expected = signDataV2.signZkTransaction.testnet.signResult as {
      signature: string;
      publicKey: string;
      data: {
        zkappCommand: Record<string, unknown>;
        feePayer: Record<string, unknown>;
      };
    };
    const prepared = await prepareLedgerZkApp(
      {
        transaction: params.transaction,
        fromAddress: params.fromAddress,
        fee: params.fee,
        nonce: params.nonce,
        memo: params.memo,
        feePayerAddress: JSON.parse(params.transaction).feePayer.body.publicKey,
      },
      "mina:devnet"
    );

    expect(prepared.signingRequests).toHaveLength(1);
    const ledgerSignature = signatureFromBase58(expected.signature);
    const signature = ledgerSignatureToBase58(
      ledgerSignature.field,
      ledgerSignature.scalar
    );
    applyLedgerZkAppSignature(prepared, prepared.signingRequests[0]!, signature);

    expect(getLedgerSignedZkApp(prepared)).toEqual(expected);
  });
});
