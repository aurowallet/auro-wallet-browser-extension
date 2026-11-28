window.addEventListener("message", (event) => {
  if (
    event.data.type &&
    (event.data.type.includes("credential") ||
      event.data.type.includes("presentation") ||
      event.data.type === "nft-operation")
  ) {
    const result = {
      type: `${event.data.type}-result`,
      ...(event.data.type === "nft-operation"
        ? { requestId: event.data.requestId }
        : {}),
      error: { message: "Not supported yet" },
    };
    window.parent.postMessage(result, "*");
  }
});
