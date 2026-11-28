import { Field, Mina, PublicKey, TokenId, UInt64 } from "o1js";
import {
  NFTData,
  NFTDataPacked,
  NFTStateStruct,
  CollectionData,
  Metadata,
  fieldToString,
} from "@silvana-one/nft";

import type {
  INFTIdentity,
  INFTAccountIdentity,
  INFTChainState,
  INFTDecodedState,
  INFTTransferData,
} from "@/types/nft";

const fail = (message: string): never => {
  throw new Error(message);
};

function nftIdentity(input: INFTIdentity) {
  const collection = PublicKey.fromBase58(input.collectionAddress);
  const nft = PublicKey.fromBase58(input.nftAddress);
  return {
    collectionAddress: collection.toBase58(),
    nftAddress: nft.toBase58(),
    tokenId: TokenId.toBase58(TokenId.derive(collection)),
  };
}

export function deriveNFTIdentities(
  identities: INFTIdentity[],
): INFTAccountIdentity[] {
  return identities.map(nftIdentity);
}

export function decodeNFTState({
  id,
  raw,
}: {
  id: INFTAccountIdentity;
  raw: Pick<INFTChainState, "collection" | "nft">;
}): INFTDecodedState {
  for (const [kind, address] of [
    ["Collection", id.collectionAddress],
    ["NFT", id.nftAddress],
  ] as const) {
    const a = kind === "Collection" ? raw.collection : raw.nft;
    if (!a || a.publicKey !== address) fail("NFT account not found");
    if (
      !Array.isArray(a.zkappState) ||
      a.zkappState.length !== 32 ||
      a.zkappState.slice(8).some((x: string) => x !== "0")
    )
      fail("Unsupported NFT state layout");
  }
  const c = raw.collection.zkappState.map(Field),
    n = raw.nft.zkappState.slice(0, 8).map(Field);
  const state = NFTStateStruct.fromFields(n),
    data = NFTData.unpack(state.packedData);
  if (
    NFTDataPacked.toFields(data.pack()).some(
      (x: any, i: number) => x.toString() !== raw.nft.zkappState[i + 4],
    )
  )
    fail("Invalid NFT packed state");
  const collectionData = CollectionData.unpack(c[6]!);
  return {
    name: fieldToString(state.name),
    storage: state.storage.toString(),
    metadataRoot: state.metadata.toString(),
    owner: data.owner.toBase58(),
    version: data.version.toString(),
    canTransfer: data.canTransfer.toBoolean(),
    isPaused: data.isPaused.toBoolean(),
    collection: {
      name: fieldToString(c[0]!),
      creator: PublicKey.fromFields(c.slice(1, 3)).toBase58(),
      transferFee: collectionData.transferFee.toString(),
      isPaused: collectionData.isPaused.toBoolean(),
      requireTransferApproval:
        collectionData.requireTransferApproval.toBoolean(),
    },
  };
}

export function validateNFTMetadata(json: any) {
  Metadata.fromJSON({ json, checkRoot: true });
  return { valid: true };
}

export async function decodeNFTTransfer({
  nftState,
  recipient,
  version,
  transaction,
}: {
  nftState: string[];
  recipient: string;
  version: string;
  transaction: Record<string, any>;
}): Promise<INFTTransferData> {
  const state = NFTStateStruct.fromFields(nftState.slice(0, 8).map(Field));
  const expectedData = NFTData.unpack(state.packedData);
  expectedData.owner = PublicKey.fromBase58(recipient);
  expectedData.approved = PublicKey.empty();
  expectedData.version = UInt64.from(BigInt(version) + 1n);
  const tx = await Mina.Transaction.fromJSON(JSON.stringify(transaction));
  return {
    defaultToken: TokenId.toBase58(TokenId.default),
    nextFields: NFTDataPacked.toFields(expectedData.pack()).map((field) =>
      field.toString(),
    ),
    memo: tx.transaction.memo,
  };
}
