const operationResults = new Map<string, Promise<Record<string, unknown>>>();
const completedRequests: string[] = [];
export async function handleNFTOperation({ operation, payload, requestId }: {
  operation: string;
  payload: unknown;
  requestId: string;
}) {
  let pending = operationResults.get(requestId);
  if (!pending) {
    pending = (async () => {
      try {
        const runtime = await import("./nftRuntime");
        const operations: Record<string, (input: any) => unknown> = {
          'derive-identities': runtime.deriveNFTIdentities,
          'decode-state': runtime.decodeNFTState,
          'validate-metadata': runtime.validateNFTMetadata,
          'decode-transfer': runtime.decodeNFTTransfer,
        };
        if (!Object.hasOwn(operations, operation))
          throw new Error("Unknown NFT operation");
        return { result: await operations[operation]!(payload) };
      } catch (error) {
        return {
          error: {
            message:
              error instanceof Error ? error.message : "NFT operation failed",
          },
        };
      }
    })();
    operationResults.set(requestId, pending);
    void pending.then(() => {
      completedRequests.push(requestId);
      if (completedRequests.length > 64)
        operationResults.delete(completedRequests.shift()!);
    });
  }
  const result = await pending;
  return { type: "nft-operation-result", requestId, ...result };
}
