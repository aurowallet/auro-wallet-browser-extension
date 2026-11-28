import type {
  INFTIdentity,
  INFTInfoResponse,
  NFTNetwork,
  INFTAccountIdentity,
  INFTChainState,
  INFTDecodedState,
} from "@/types/nft";
import { LOCAL_CACHE_KEYS } from "@/constant/storageKey";
import { nftSandboxRequest } from "./nftSandbox";
import { getNFTAssets } from "@/background/api";
import { commonFetch, startFetchMyQuery } from "@/background/request";
import { getCurrentNodeConfig } from "./browserUtils";

export interface ILocalNFTItem {
  id: string;
  name: string;
  imageUrl: string;
  nftAddress: string;
  collectionAddress: string;
  collectionName: string;
  owner: string;
  network: NFTNetwork;
  tokenId: string;
  description: string;
  attributes?: { name: string; value: string }[];
  metadataRoot?: string;
  collectionTransferFee?: string;
  feeRecipient?: string;
  canTransfer: boolean;
  isPaused: boolean;
  requireTransferApproval: boolean;
}

type NFTQuery = INFTIdentity & {
  chain: NFTNetwork;
  gqlUrl: string;
  owner?: string;
};
const fail = (message: string): never => {
  throw new Error(message);
};
const metadataCache = new Map<string, Promise<any>>();

export async function readNFTState(input: NFTQuery, signal?: AbortSignal) {
  const [id] = await nftSandboxRequest<[INFTAccountIdentity]>(
    "derive-identities",
    [{ collectionAddress: input.collectionAddress, nftAddress: input.nftAddress }],
    signal,
  );
  const raw = await startFetchMyQuery<INFTChainState>(
    `query($collection:PublicKey!,$nft:PublicKey!,$token:TokenId!){daemonStatus{chainId}
    collection:account(publicKey:$collection){publicKey zkappState verificationKey{hash}}
    nft:account(publicKey:$nft,token:$token){publicKey zkappState verificationKey{hash}}}`,
    { collection: id.collectionAddress, nft: id.nftAddress, token: id.tokenId },
    input.gqlUrl,
  );
  if (!raw || !("collection" in raw))
    throw new Error(raw?.error || "NFT node unavailable");
  const state = await nftSandboxRequest<INFTDecodedState>(
    "decode-state", { id, raw }, signal,
  );
  return { id, raw, state };
}

function mediaUrl(value: string) {
  const url = new URL(
    value.startsWith("ipfs://")
      ? `https://gateway.pinata.cloud/ipfs/${value.slice(7)}`
      : value,
  );
  if (url.protocol !== "https:" || url.username || url.password)
    fail("Unsupported NFT image URL");
  return url.href;
}
async function readMetadata(cid: string) {
  let pending = metadataCache.get(cid);
  if (!pending) {
    pending = (async () => {
      const json = await commonFetch<any>(
        `https://gateway.pinata.cloud/ipfs/${encodeURIComponent(cid)}`,
      );
      if (!json || json.error) fail("NFT metadata unavailable");
      const seen = new Set();
      for (const t of json.traits ?? []) {
        if (
          seen.has(t.key) ||
          (["name", "image", "description", "banner"].includes(t.key) &&
            t.value !== json[t.key])
        )
          fail("Conflicting NFT metadata");
        seen.add(t.key);
      }
      const result = await nftSandboxRequest<{ valid: boolean }>(
        "validate-metadata", json,
      );
      if (!result.valid) fail("NFT metadata validation failed");
      return json;
    })();
    if (metadataCache.size >= 64)
      metadataCache.delete(metadataCache.keys().next().value!);
    metadataCache.set(cid, pending);
    // A failed gateway/validation attempt must remain retryable.
    void pending.catch(() => {
      if (metadataCache.get(cid) === pending) metadataCache.delete(cid);
    });
  }
  return pending;
}
export async function readNFTInfo(input: NFTQuery, signal?: AbortSignal) {
  return nftInfoFromState(
    await readNFTState(input, signal), input.chain, input.owner, signal,
  );
}
// Batch only discovery reads. Transfer preflight and transaction checks always read fresh state.
export async function readNFTInfos(
  input: Pick<NFTQuery, "chain" | "gqlUrl" | "owner"> & {
    identities: INFTIdentity[];
  },
  signal?: AbortSignal,
) {
  const ids = await nftSandboxRequest<INFTAccountIdentity[]>(
    "derive-identities", input.identities, signal,
  );
  const collections = [
    ...new Set<string>(ids.map((id) => id.collectionAddress)),
  ];
  const variables: Record<string, string> = {};
  const declarations: string[] = [],
    accounts: string[] = [];
  const fields = "publicKey zkappState verificationKey{hash}";
  collections.forEach((address, i) => {
    variables[`c${i}`] = address;
    declarations.push(`$c${i}:PublicKey!`);
    accounts.push(`c${i}:account(publicKey:$c${i}){${fields}}`);
  });
  ids.forEach((id: INFTAccountIdentity, i: number) => {
    variables[`n${i}`] = id.nftAddress;
    variables[`t${i}`] = id.tokenId;
    declarations.push(`$n${i}:PublicKey!`, `$t${i}:TokenId!`);
    accounts.push(`n${i}:account(publicKey:$n${i},token:$t${i}){${fields}}`);
  });
  const raw = await startFetchMyQuery<any>(
    `query(${declarations.join(",")}){daemonStatus{chainId} ${accounts.join(" ")}}`,
    variables,
    input.gqlUrl,
  );
  if (!raw || raw.error) fail(raw?.error || "NFT node unavailable");
  return Promise.all(
    ids.map(async (id: INFTAccountIdentity, i: number) => {
      try {
        const accounts = {
          collection: raw[`c${collections.indexOf(id.collectionAddress)}`],
          nft: raw[`n${i}`],
        };
        const state = await nftSandboxRequest<INFTDecodedState>(
          "decode-state", { id, raw: accounts }, signal,
        );
        return {
          info: await nftInfoFromState(
            { id, state },
            input.chain,
            input.owner,
            signal,
          ),
        };
      } catch {
        return { error: true };
      }
    }),
  );
}
async function nftInfoFromState(
  { id, state }: { id: INFTAccountIdentity; state: INFTDecodedState },
  chain: NFTNetwork,
  owner?: string,
  signal?: AbortSignal,
): Promise<INFTInfoResponse | null> {
  signal?.throwIfAborted();
  const c = state.collection;
  // Check fresh ownership before fetching metadata for a portfolio scan.
  if (owner !== undefined && state.owner !== owner) return null;
  const json = await readMetadata(state.storage);
  signal?.throwIfAborted();
  // Cached metadata must still match this NFT's fresh on-chain commitment.
  if (json.name !== state.name || json.metadataRoot !== state.metadataRoot)
    fail("NFT metadata differs from chain");
  return {
    nft: {
      chain,
      ...id,
      tokenAddress: id.nftAddress,
      name: json.name,
      metadataRoot: state.metadataRoot,
      image: mediaUrl(json.image),
      description: json.description ?? "",
      attributes: (json.traits ?? [])
        .filter(
          (trait: any) =>
            !trait.isPrivate &&
            typeof trait.key === "string" &&
            trait.key.trim() &&
            !["name", "image", "description", "banner"].includes(trait.key) &&
            ["string", "number", "boolean"].includes(typeof trait.value),
        )
        .map((trait: any) => ({ name: trait.key, value: String(trait.value) })),
      owner: state.owner,
      canTransfer: state.canTransfer,
      isPaused: state.isPaused,
    },
    collection: {
      chain,
      collectionAddress: id.collectionAddress,
      tokenId: "",
      collectionName: c.name,
      transferFee: c.transferFee,
      creator: c.creator,
      isPaused: c.isPaused,
      requireTransferApproval: c.requireTransferApproval,
    },
  };
}

function invalidNFTInfo(): never {
  throw new Error("Invalid local NFT response");
}

function toNFTItem(
  info: INFTInfoResponse,
  requested: INFTIdentity,
  network: string,
): ILocalNFTItem {
  const { nft, collection } = info;
  if (
    nft.chain !== network ||
    collection.chain !== network ||
    nft.collectionAddress !== requested.collectionAddress ||
    nft.tokenAddress !== requested.nftAddress ||
    collection.collectionAddress !== requested.collectionAddress
  )
    invalidNFTInfo();
  return {
    id: `${nft.collectionAddress}.${nft.tokenAddress}`,
    ...requested,
    owner: nft.owner,
    network: nft.chain,
    tokenId: nft.tokenId,
    name: nft.name,
    imageUrl: nft.image,
    collectionName: collection.collectionName || "",
    description: typeof nft.description === "string" ? nft.description : "",
    attributes: nft.attributes,
    metadataRoot: nft.metadataRoot,
    collectionTransferFee:
      nft.owner === collection.creator ? "0" : collection.transferFee,
    feeRecipient: collection.creator,
    canTransfer: nft.canTransfer,
    isPaused: nft.isPaused || collection.isPaused,
    requireTransferApproval: collection.requireTransferApproval,
  };
}

async function withLocalRequest<T>(
  signal: AbortSignal | undefined,
  run: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  if (signal?.aborted) throw new Error("NFT query cancelled");
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, 150_000);
  let rejectAborted: () => void = () => {};
  const cancelled = new Promise<never>((_resolve, reject) => {
    rejectAborted = () => reject(new Error("NFT query cancelled or timed out"));
    controller.signal.addEventListener("abort", rejectAborted, { once: true });
  });
  try {
    const result = await Promise.race([run(controller.signal), cancelled]);
    if (controller.signal.aborted) throw new Error("NFT query cancelled");
    return result;
  } finally {
    clearTimeout(timer);
    controller.signal.removeEventListener("abort", rejectAborted);
    signal?.removeEventListener("abort", abort);
  }
}

/** Registered holdings read from the selected network. */
export async function loadLocalNFTs(
  network: string,
  owner: string,
  signal?: AbortSignal,
) {
  if (!owner) throw new Error("Select an account");
  return withLocalRequest(signal, async (requestSignal) => {
    const node = await getCurrentNodeConfig();
    if (!node.url || node.networkID !== network)
      throw new Error("NFT network changed or unavailable");
    const assets = await getNFTAssets();
    const entries = assets.filter((item) => item.chain === network);
    const results: (ILocalNFTItem | undefined)[] = new Array(entries.length);
    let failures = 0,
      cursor = 0;
    await Promise.all(
      Array.from(
        { length: Math.min(3, Math.ceil(entries.length / 5)) },
        async () => {
          while (cursor < entries.length) {
            if (requestSignal.aborted) throw new Error("NFT query cancelled");
            const start = cursor;
            cursor += 5;
            const identities = entries.slice(start, start + 5);
            let batch: { info?: INFTInfoResponse | null; error?: boolean }[];
            try {
              batch = await readNFTInfos(
                {
                  identities,
                  chain: network,
                  owner,
                  gqlUrl: node.url,
                },
                requestSignal,
              );
              if (!Array.isArray(batch) || batch.length !== identities.length)
                invalidNFTInfo();
            } catch (error) {
              if (requestSignal.aborted) throw error;
              batch = identities.map(() => ({ error: true }));
            }
            for (let i = 0; i < identities.length; i++) {
              try {
                const entry = batch[i];
                if (!entry || entry.error || entry.info === undefined)
                  invalidNFTInfo();
                // Null means the fresh chain read belongs to another account.
                if (entry.info !== null)
                  results[start + i] = toNFTItem(
                    entry.info,
                    identities[i]!,
                    network,
                  );
              } catch {
                failures++;
              }
            }
          }
        },
      ),
    );
    const items = results.filter(
      (item): item is ILocalNFTItem =>
        item !== undefined && item.owner === owner,
    );
    if (failures === entries.length && failures > 0)
      throw new Error("NFT node or metadata unavailable");
    return { items, partial: failures > 0 };
  });
}

export async function loadLocalNFT(
  network: string,
  identity: INFTIdentity,
  signal?: AbortSignal,
  gqlUrl?: string,
): Promise<ILocalNFTItem> {
  const requested = {
    collectionAddress: identity.collectionAddress,
    nftAddress: identity.nftAddress,
  };
  return withLocalRequest(signal, async (requestSignal) => {
    const node = await getCurrentNodeConfig();
    if (
      !node.url ||
      node.networkID !== network ||
      (gqlUrl && gqlUrl !== node.url)
    )
      throw new Error("NFT network changed or unavailable");
    const info = await readNFTInfo(
      { chain: network, ...requested, gqlUrl: node.url },
      requestSignal,
    );
    if (!info) invalidNFTInfo();
    return toNFTItem(info, requested, network);
  });
}

// Owned NFT grouping
interface INFTGroup {
  key: string;
  representative: ILocalNFTItem;
  items: ILocalNFTItem[];
}

export function groupOwnedNFTs(
  items: ILocalNFTItem[],
  network: string,
  owner: string,
): INFTGroup[] {
  const groups = new Map<string, INFTGroup>();
  const seen = new Set<string>();
  for (const item of items) {
    if (item.network !== network || item.owner !== owner) continue;
    const identity = JSON.stringify([item.collectionAddress, item.nftAddress]);
    if (seen.has(identity)) continue;
    seen.add(identity);
    const metadata = item.metadataRoot
      ? ["metadata", item.metadataRoot]
      : ["nft", item.nftAddress];
    const key = JSON.stringify([network, item.collectionAddress, ...metadata]);
    const group = groups.get(key);
    if (group) group.items.push(item);
    else groups.set(key, { key, representative: item, items: [item] });
  }
  return [...groups.values()];
}

// Transfer availability
type TransferNFT = Pick<
  ILocalNFTItem,
  "owner" | "canTransfer" | "isPaused" | "requireTransferApproval"
>;

export function nftTransferBlock(nft: TransferNFT, address: string) {
  if (nft.owner !== address) return { code: "NOT_OWNER" };
  if (nft.isPaused || !nft.canTransfer) return { code: "TRANSFER_DISABLED" };
  if (nft.requireTransferApproval) return { code: "APPROVAL_UNSUPPORTED" };
  return undefined;
}

// Holdings cache
type Snapshot = { items: ILocalNFTItem[]; partial: boolean };
const nftAssetsStorageKey = LOCAL_CACHE_KEYS.NFT_ASSETS_V1;
function readNFTAssetsCache(): Record<string, Snapshot> {
  try {
    const value = JSON.parse(localStorage.getItem(nftAssetsStorageKey) || "{}");
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  } catch {
    return {};
  }
}
// Display cache only: signing always uses fresh chain data and transaction validation.
export function readNFTListCache(key: string): Snapshot | undefined {
  const value = readNFTAssetsCache()[key];
  if (
    !value ||
    typeof value.partial !== "boolean" ||
    !Array.isArray(value.items)
  )
    return;
  if (
    !value.items.every((item) => {
      if (
        item?.attributes !== undefined &&
        (!Array.isArray(item.attributes) ||
          !item.attributes.every(
            (attribute) =>
              attribute &&
              typeof attribute.name === "string" &&
              !!attribute.name.trim() &&
              typeof attribute.value === "string",
          ))
      )
        return false;
      if (
        !item ||
        JSON.stringify([item.network, item.owner]) !== key ||
        ![
          "id",
          "name",
          "imageUrl",
          "nftAddress",
          "collectionAddress",
          "collectionName",
          "owner",
          "tokenId",
          "description",
        ].every(
          (field) => typeof item[field as keyof ILocalNFTItem] === "string",
        ) ||
        item.id !== `${item.collectionAddress}.${item.nftAddress}` ||
        !["canTransfer", "isPaused", "requireTransferApproval"].every(
          (field) => typeof item[field as keyof ILocalNFTItem] === "boolean",
        )
      )
        return false;
      try {
        const url = new URL(item.imageUrl);
        return url.protocol === "https:" && !url.username && !url.password;
      } catch {
        return false;
      }
    })
  )
    return;
  return value;
}
export function writeNFTListCache(key: string, value: Snapshot) {
  try {
    localStorage.setItem(
      nftAssetsStorageKey,
      JSON.stringify({ ...readNFTAssetsCache(), [key]: value }),
    );
  } catch {
    /* Cache failure must not fail the chain query. */
  }
}
export function clearNFTListCache(network?: string) {
  try {
    if (!network) {
      localStorage.removeItem(nftAssetsStorageKey);
      return;
    }
    const cache = readNFTAssetsCache();
    for (const key of Object.keys(cache)) {
      try {
        if (JSON.parse(key)[0] === network) delete cache[key];
      } catch {
        delete cache[key];
      }
    }
    localStorage.setItem(nftAssetsStorageKey, JSON.stringify(cache));
  } catch {
    /* Storage may be unavailable. */
  }
}
