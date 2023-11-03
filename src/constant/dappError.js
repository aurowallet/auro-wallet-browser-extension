export const errorCodes = {
  invalidInput: -32000,
  transactionRejected: -32003,
  methodNotSupported: -32004,
  zkPending: -32005,
  parse: -32700,
  methodNotFound: -32601,
  invalidParams: -32602,
  internal: -32603,
  notSupportChain: -32006,
  noWallet: -32007,
  throwError: -32800,
  userRejectedRequest: 4001,
  userDisconnect: 4300,
  originDismatch: 4500,
};
export const FALLBACK_MESSAGE =
  "Unspecified error message. This is a bug, please report it.";

export const errorValues = {
  "-32800": {
    message: FALLBACK_MESSAGE,
  },
  "-32700": {
    message:
      "Invalid JSON was received by the server. An error occurred on the server while parsing the JSON text.",
  },
  "-32601": {
    message: "The method does not exist / is not available.",
  },
  "-32602": {
    message: "Invalid method parameter(s).",
  },
  "-32603": {
    message: "Transaction error.",
  },
  "-32006": {
    message: "Not support chain.",
  },
  "-32000": {
    message: "Invalid input.",
  },
  "-32003": {
    message: "Transaction rejected.",
  },
  "-32004": {
    message: "Method not supported.",
  },
  "-32005": {
    message: "Request already pending. Please wait.",
  },
  "-32007": {
    message: "Please create or restore wallet first",
  },
  4001: {
    message: "User rejected the request.",
  },
  4300: {
    message: "User disconnect, please connect first",
  },
  4500: {
    message: "Origin dismatch",
  },
};
