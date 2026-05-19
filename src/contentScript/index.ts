import browser from "webextension-polyfill";
import { sendMsg } from "../utils/commonMsg";
import { MessageChannel, getSiteIcon } from "@aurowallet/mina-provider";
import { WALLET_CONNECT_TYPE } from "../constant/commonType";
import { errorCodes } from "../constant/dappError";
import { getMessageFromCode } from "../utils/utils";

interface ContentScriptInterface {
  channel: InstanceType<typeof MessageChannel> | null;
  init: () => void;
  reportUrl: () => void;
  registerListeners: () => void;
  inject: () => void;
}

const CONTENT_SCRIPT = WALLET_CONNECT_TYPE.CONTENT_SCRIPT;

type NormalizedPageMessage = {
  source?: string;
  action: string;
  payload: Record<string, unknown>;
};

type WalletErrorPayload = {
  code: number;
  message: string;
  [key: string]: unknown;
};

function normalizeWalletErrorPayload(error: unknown): WalletErrorPayload {
  if (typeof error === "string" && error.length > 0) {
    return {
      code: errorCodes.throwError,
      message: error,
    };
  }

  if (!error || typeof error !== "object") {
    return {
      code: errorCodes.throwError,
      message: getMessageFromCode(errorCodes.throwError),
    };
  }

  const nextError = error as Record<string, unknown>;
  const code = typeof nextError.code === "number" ? nextError.code : errorCodes.throwError;
  const message =
    typeof nextError.message === "string" && nextError.message.length > 0
      ? nextError.message
      : getMessageFromCode(code);

  return {
    ...nextError,
    code,
    message,
  };
}

function createNormalizedWalletError(id?: unknown, error?: unknown): { id?: string; error: WalletErrorPayload } {
  const nextId = typeof id === "string" ? id : undefined;
  return {
    ...(nextId ? { id: nextId } : {}),
    error: normalizeWalletErrorPayload(error),
  };
}

function normalizeDirectWalletResponse(
  payload: unknown,
  fallbackId?: unknown
): Record<string, unknown> {
  if (!payload || typeof payload !== "object") {
    return createNormalizedWalletError(fallbackId);
  }

  const response = payload as Record<string, unknown>;
  const responseId =
    typeof response.id === "string"
      ? response.id
      : typeof fallbackId === "string"
        ? fallbackId
        : undefined;
  const hasResult = Object.prototype.hasOwnProperty.call(response, "result");
  const hasError = Object.prototype.hasOwnProperty.call(response, "error");

  if (hasError) {
    const normalizedError = normalizeWalletErrorPayload(response.error);
    const normalizedResponse = {
      ...response,
      error: normalizedError,
    };
    return responseId ? { ...normalizedResponse, id: responseId } : normalizedResponse;
  }

  if (hasResult) {
    return responseId ? { ...response, id: responseId } : response;
  }

  return createNormalizedWalletError(responseId);
}

function isWalletResponseMessage(message: unknown): message is {
  id: string;
  result?: unknown;
  error?: unknown;
} {
  if (!message || typeof message !== "object") {
    return false;
  }

  const response = message as Record<string, unknown>;
  return (
    typeof response.id === "string" &&
    (Object.prototype.hasOwnProperty.call(response, "result") ||
      Object.prototype.hasOwnProperty.call(response, "error"))
  );
}

function normalizePageMessage(event: MessageEvent): NormalizedPageMessage | null {
  const { data: eventData, isTrusted } = event;
  if (!isTrusted) return null;
  if (!eventData || typeof eventData !== "object") return null;

  const envelope = eventData as Record<string, unknown>;
  if (envelope.isAuro !== true) return null;

  const source =
    typeof envelope.source === "string" ? envelope.source : undefined;
  const rawMessage = envelope.message;

  if (!rawMessage || typeof rawMessage !== "object") return null;

  const outerMessage = rawMessage as Record<string, unknown>;
  const messageData = outerMessage.data;
  if (!messageData || typeof messageData !== "object") return null;

  const data = messageData as Record<string, unknown>;
  if (typeof data.action !== "string" || !data.action) return null;

  const payload =
    data.payload && typeof data.payload === "object" && !Array.isArray(data.payload)
      ? (data.payload as Record<string, unknown>)
      : {};

  return {
    source,
    action: data.action,
    payload,
  };
}

const contentScript: ContentScriptInterface = {
  channel: null,
  init() {
    this.channel = new MessageChannel(CONTENT_SCRIPT);
    this.registerListeners();
    this.inject();
    this.reportUrl();
  },
  reportUrl() {
    browser.runtime.connect({ name: CONTENT_SCRIPT });
  },
  registerListeners() {
    window.addEventListener("message", (event) => {
      if (event.source !== window) return;
      const normalized = normalizePageMessage(event);
      if (!normalized) return;
      if (normalized.source === CONTENT_SCRIPT) return;

      const nextPayload = {
        ...normalized.payload,
        site: {
          origin: event.origin,
          webIcon: getSiteIcon(event.source as Window & typeof globalThis),
        },
      };
      sendMsg(
        {
          action: normalized.action,
          messageSource: "messageFromDapp",
          payload: nextPayload,
        },
        async (params: Record<string, unknown>) => {
          const normalizedResponse = normalizeDirectWalletResponse(
            params,
            normalized.payload.id
          );
          this.channel?.send("messageFromWallet", normalizedResponse);
        },
        () => {
          this.channel?.send("messageFromWallet", {
            id: normalized.payload.id,
            error: {
              code: errorCodes.throwError,
              message: getMessageFromCode(errorCodes.throwError),
            },
          });
        }
      );
    });

    browser.runtime.onMessage.addListener(
      (message: unknown, sender, sendResponse) => {
        const msg = message as { id?: string; action?: string; result?: unknown };
        if (isWalletResponseMessage(message)) {
          const normalizedResponse = normalizeDirectWalletResponse(message, msg.id);
          this.channel?.send("messageFromWallet", normalizedResponse);
        } else if (typeof msg.action === "string" && msg.action.length > 0) {
          this.channel?.send(msg.action, msg.result as Record<string, unknown>);
        }
        sendResponse("content-back");
        return true;
      }
    );
  },

  inject() {
    const hostPage = document.head || document.documentElement;
    const script = document.createElement("script");

    script.src = browser.runtime.getURL("webhook.js");
    script.onload = () => {
      script.parentNode?.removeChild(script);
    };
    hostPage.appendChild(script);
  },
};
contentScript.init();
