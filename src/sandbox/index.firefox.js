// Firefox sandbox: 空（无 o1js）
window.addEventListener("message", (event) => {
  if (
    event.data.type &&
    (event.data.type.includes("credential") ||
      event.data.type.includes("presentation"))
  ) {
    const result = {
      type: `${event.data.type}-result`,
      error: { message: "Not supported yet" },
    };
    window.parent.postMessage(result, "*");
  }
});
