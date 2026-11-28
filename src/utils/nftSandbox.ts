export async function nftSandboxRequest<T>(
  operation: string,
  payload: unknown,
  signal?: AbortSignal,
): Promise<T> {
  signal?.throwIfAborted();
  const frame = document.getElementById(
    "o1jssandbox",
  ) as HTMLIFrameElement | null;
  const target = frame?.contentWindow;
  if (!target) throw new Error("NFT sandbox unavailable");
  return new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID();
    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener("message", receive);
      frame.removeEventListener("load", send);
      signal?.removeEventListener("abort", abort);
    };
    const abort = () => {
      cleanup();
      reject(new Error("NFT request cancelled"));
    };
    const receive = (event: MessageEvent) => {
      if (
        event.source !== target ||
        event.data?.type !== "nft-operation-result" ||
        event.data.requestId !== requestId
      )
        return;
      cleanup();
      if (event.data.error) reject(new Error(event.data.error.message));
      else resolve(event.data.result);
    };
    const send = () =>
      target.postMessage(
        { type: "nft-operation", requestId, operation, payload },
        "*",
      );
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("NFT operation timed out"));
    }, 150000);
    window.addEventListener("message", receive);
    frame.addEventListener("load", send, { once: true });
    signal?.addEventListener("abort", abort, { once: true });
    send();
  });
}

