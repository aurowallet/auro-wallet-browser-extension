import type {
  ILocalTransferRequest,
  ILocalTransferSummary,
  ILocalTransferJob,
  INFTTransferData,
} from "@/types/nft";
import { sendMsgV2 } from "./commonMsg";
import { amountDecimals, toNonExponential } from "./utils";
import { MAIN_COIN_CONFIG } from "@/constant";
import { NFT_WEB_ACTION } from "@/constant/msgTypes";
import { getCurrentNodeConfig } from "./browserUtils";
import { nftSandboxRequest } from "./nftSandbox";
import { readNFTState } from "./nft";
import { startFetchMyQuery } from "@/background/request";

type TransferRequest = ILocalTransferRequest & { gqlUrl: string };
const fail = (message: string): never => {
  throw new Error(message);
};

export async function preflightNFT(
  input: TransferRequest,
  signal?: AbortSignal,
): Promise<ILocalTransferSummary> {
  return (await preflightNFTState(input, signal)).summary;
}
// Reuse one state snapshot when checking the summary and transaction contents.
async function preflightNFTState(input: TransferRequest, signal?: AbortSignal) {
  const r = await readNFTState(input, signal);
  const { state } = r;
  const c = state.collection;
  if (state.owner !== input.sender)
    fail("NFT is no longer owned by this account");
  if (!state.canTransfer || state.isPaused || c.isPaused)
    fail("NFT transfers are disabled");
  if (c.requireTransferApproval)
    fail("Administrator-approved NFT transfers are not supported");
  const result = await startFetchMyQuery<any>(
    `query($key:PublicKey!){daemonStatus{chainId} account(publicKey:$key){publicKey nonce balance{liquid}}}`,
    { key: input.sender },
    input.gqlUrl,
  );
  if (!result || result.error) fail(result?.error || "NFT node unavailable");
  signal?.throwIfAborted();
  const account = result.account;
  if (!account) fail("Fee payer unavailable");
  const nonce = input.nonce ?? account.nonce;
  if (BigInt(nonce) < BigInt(account.nonce))
    fail(
      "Nonce has already been used; update it or leave it empty for automatic selection",
    );
  const collectionTransferFee =
      input.sender === c.creator ? "0" : c.transferFee,
    totalDebit = (BigInt(input.fee) + BigInt(collectionTransferFee)).toString();
  if (BigInt(account.balance.liquid) < BigInt(totalDebit))
    fail("Insufficient balance for NFT transfer fees");
  return {
    chainState: r,
    summary: {
      chain: input.chain,
      gqlUrl: input.gqlUrl,
      collectionAddress: r.id.collectionAddress,
      nftAddress: r.id.nftAddress,
      sender: input.sender,
      recipient: input.recipient,
      fee: input.fee,
      memo: input.memo,
      owner: input.sender,
      tokenId: r.id.tokenId,
      nonce,
      nftVersion: state.version,
      collectionTransferFee,
      feeRecipient: c.creator,
      totalDebit,
      collectionVk: r.raw.collection.verificationKey.hash,
      nftVk: r.raw.nft.verificationKey.hash,
      metadataRoot: state.metadataRoot,
      chainId: r.raw.daemonStatus.chainId,
      accountCreationFee: "0" as const,
      provingFee: "0" as const,
      checkedAt: new Date().toISOString(),
    },
  };
}
/** Match the built transaction to the reviewed transfer before signing, as for Token transfers. */
export async function validateNFTTransaction(
  { summary: s, transaction: t }: {
    summary: ILocalTransferSummary;
    transaction: Record<string, any>;
  },
  signal?: AbortSignal,
) {
  const { summary, chainState: r } = await preflightNFTState(s, signal);
  // Request fields already come from s; only newly read chain values can change.
  const chainFields = [
    "chainId",
    "tokenId",
    "nftVersion",
    "collectionTransferFee",
    "feeRecipient",
    "totalDebit",
    "collectionVk",
    "nftVk",
    "metadataRoot",
  ] as const;
  if (chainFields.some((key) => s[key] !== summary[key]))
    fail("Transfer details changed; review again");
  const keys = {
    Collection: r.raw.collection.verificationKey,
    NFT: r.raw.nft.verificationKey,
  };
  if (
    !t ||
    !Array.isArray(t.accountUpdates) ||
    t.accountUpdates.length !== 4 ||
    t.feePayer?.body?.publicKey !== s.sender ||
    t.feePayer.body.fee !== s.fee ||
    t.feePayer.body.nonce !== s.nonce ||
    t.feePayer.body.validUntil !== null
  )
    fail("Unexpected NFT transaction");
  const { defaultToken, nextFields, memo } = await nftSandboxRequest<INFTTransferData>(
    "decode-transfer",
    {
      nftState: r.raw.nft.zkappState,
      recipient: s.recipient,
      version: s.nftVersion,
      transaction: t,
    },
    signal,
  );
  const roles = [
    {
      key: s.collectionAddress,
      token: defaultToken,
      depth: 0,
      delta: 0n,
      proof: "Collection",
    },
    { key: s.nftAddress, token: s.tokenId, depth: 1, delta: 0n, proof: "NFT" },
    {
      key: s.sender,
      token: defaultToken,
      depth: 1,
      delta: -BigInt(s.collectionTransferFee),
      proof: null,
    },
    {
      key: s.feeRecipient,
      token: defaultToken,
      depth: 2,
      delta: BigInt(s.collectionTransferFee),
      proof: null,
    },
  ];
  for (let i = 0; i < 4; i++) {
    const a = t.accountUpdates[i],
      b = a?.body,
      e = roles[i]!;
    if (
      !b ||
      b.publicKey !== e.key ||
      b.tokenId !== e.token ||
      b.callDepth !== e.depth ||
      b.incrementNonce ||
      b.implicitAccountCreationFee ||
      !Array.isArray(b.actions) ||
      b.actions.length
    )
      fail("Unexpected NFT account update");
    if (
      !b.balanceChange ||
      !["Positive", "Negative"].includes(b.balanceChange.sgn)
    )
      fail("Invalid NFT balance change");
    const magnitude = BigInt(b.balanceChange.magnitude);
    if (magnitude < 0n) fail("Invalid NFT balance change");
    const delta =
      magnitude *
      (b.balanceChange.sgn === "Negative" ? -1n : 1n);
    if (delta !== e.delta) fail("Unexpected NFT debit");
    if (
      Object.entries(b.update).some(([k, v]) => k !== "appState" && v !== null)
    )
      fail("Unexpected NFT permission or contract change");
    if (
      !Array.isArray(b.update.appState) ||
      b.update.appState.length !== 32 ||
      b.preconditions?.account?.state?.length !== 32
    )
      fail("Invalid NFT update layout");
    // Dynamic VKs do not establish the contract's semantics. Explicitly bind
    // execution to the reviewed owner/version/flags and collection creator/fees.
    const requiredState = i === 0 ? [1, 2, 6] : i === 1 ? [4, 5, 6] : [];
    const chainState =
      i === 0 ? r.raw.collection.zkappState : r.raw.nft.zkappState;
    if (
      requiredState.some(
        (index) => b.preconditions.account.state[index] !== chainState[index],
      )
    )
      fail("NFT transaction is missing reviewed state preconditions");
    if (
      b.mayUseToken?.parentsOwnToken !== (i === 1) ||
      b.mayUseToken?.inheritFromParent !== false
    )
      fail("Unexpected NFT token authorization");
    if (
      b.update.appState.some(
        (v: any, n: number) =>
          v !== (i === 1 && n >= 4 && n <= 6 ? nextFields[n - 4] : null),
      )
    )
      fail("Unexpected NFT owner or state change");
    if (
      b.authorizationKind?.isProved !== !!e.proof ||
      b.authorizationKind?.isSigned !== (i === 2) ||
      (i === 2 && !b.useFullCommitment)
    )
      fail("Unexpected NFT authorization");
    if (
      e.proof &&
      (b.authorizationKind.verificationKeyHash !==
        keys[e.proof as keyof typeof keys].hash ||
        typeof a.authorization?.proof !== "string" ||
        !a.authorization.proof)
    )
      fail("Missing NFT proof");
  }
  if (memo !== s.memo) fail("Unexpected NFT memo");
  return { valid: true };
}

/** Send an NFT build operation to the extension background. */
async function sendNFTBuildRequest<T>(
  route: string,
  body: object,
  signal?: AbortSignal,
): Promise<T> {
  signal?.throwIfAborted();
  const result = await sendMsgV2<T & { error?: { message: string } }>({
    action: NFT_WEB_ACTION,
    payload: { route, body },
  });
  if (!result) throw new Error("Invalid local transfer response");
  if (result.error) throw new Error(result.error.message);
  signal?.throwIfAborted();
  return result;
}
/** Check the browser build against the transfer reviewed in the wallet. */
export async function validateWebNFTTransaction(
  job: ILocalTransferJob,
  signal?: AbortSignal,
) {
  if (!job.transaction) throw new Error("Missing NFT transaction");
  await validateNFTTransaction(
    { summary: job.summary, transaction: job.transaction }, signal,
  );
}
export const localTransfer = {
  async review(jobId: string, signal?: AbortSignal) {
    const job = await sendNFTBuildRequest<ILocalTransferJob>(
      "transaction/review",
      { jobId },
      signal,
    );
    if (job.jobId !== jobId || job.state !== "ready")
      throw new Error("Transfer is no longer available for signing");
    return job;
  },
  async cancel(
    summary: ILocalTransferRequest,
    jobId?: string,
    signal?: AbortSignal,
  ) {
    const { chain, sender, collectionAddress, nftAddress } = summary;
    const result = await sendNFTBuildRequest<{ cancelled: boolean }>(
      "transaction/cancel",
      { chain, sender, collectionAddress, nftAddress, jobId },
      signal,
    );
    if (!result.cancelled) throw new Error("Transfer cancellation failed");
  },
  async preflight(input: ILocalTransferRequest, signal?: AbortSignal) {
    const node = await getCurrentNodeConfig();
    if (
      !node.url ||
      node.networkID !== input.chain ||
      (input.gqlUrl && input.gqlUrl !== node.url)
    )
      throw new Error("NFT network changed or unavailable");
    return preflightNFT({ ...input, gqlUrl: node.url }, signal);
  },
  prepare(summary: ILocalTransferSummary, signal?: AbortSignal) {
    return sendNFTBuildRequest<ILocalTransferJob>("nft/transfer", summary, signal);
  },
  removeBuild(jobId: string, signal?: AbortSignal) {
    return sendNFTBuildRequest("nft/remove-build", { jobId }, signal);
  },
};
export function localTransferSigningPayload(
  job: ILocalTransferJob,
  network: string,
  address: string,
) {
  const s = job.summary,
    t = job.transaction;
  if (
    job.state !== "ready" ||
    network !== s.chain ||
    s.sender !== address
  )
    throw new Error("Transfer unavailable or account/network changed");
  return {
    transaction: JSON.stringify(t),
    fromAddress: address,
    feePayerAddress: address,
    fee: toNonExponential(amountDecimals(s.fee, MAIN_COIN_CONFIG.decimals)),
    nonce: s.nonce,
    memo: s.memo,
  };
}
