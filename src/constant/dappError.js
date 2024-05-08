export const errorCodes = {
  userRejectedRequest: 1002,
  userDisconnect: 1001,
  noWallet: 20001,
  verifyFailed: 20002,
  invalidParams: 20003,
  notSupportChain: 20004,
  zkChainPending: 20005,
  unsupportedMethod: 20006,
  internal: 21001,
  throwError: 22001,
  originDismatch: 23001,
  notFound: 404,
};
export const FALLBACK_MESSAGE =
  "Unspecified error message. This is a bug, please report it.";

export const errorValues = {
  1002: {
    message: "User rejected the request.",
  },
  1001: {
    message: "User disconnect, please connect first.",
  },
  20001: {
    message: "Please create or restore wallet first.",
  },
  20002: {
    message: "Verify failed.",
  },
  20003: {
    message: "Invalid method parameter(s).",
  },
  20005: {
    message: "Request already pending. Please wait.",
  },
  20006:{
    message: "Method not supported.",
  },
  20004: {
    message: "Not support chain.",
  },
  21001: {
    message: "Transaction error.",
  },
  22001: {
    message: FALLBACK_MESSAGE,
  },
  23001: {
    message: "Origin dismatch.",
  },
};
