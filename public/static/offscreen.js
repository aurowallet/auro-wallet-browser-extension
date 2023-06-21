chrome.runtime.sendMessage({ method: "keep-alive" });

setInterval(async () => {
  chrome.runtime.sendMessage({
    method: "keep-alive",
  });
}, 5e3);
