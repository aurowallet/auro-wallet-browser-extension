import browser from "webextension-polyfill";
import { sendMsg } from "../utils/commonMsg";
import { MessageChannel, getSiteIcon } from "@aurowallet/mina-provider";
import { WALLET_CONNECT_TYPE } from "../constant/commonType";

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
          this.channel?.send("messageFromWallet", params);
        }
      );
    });

    browser.runtime.onMessage.addListener(
      (message: unknown, sender, sendResponse) => {
        const msg = message as { id?: string; action?: string; result?: unknown };
        if (msg.id) {
          this.channel?.send("messageFromWallet", msg as Record<string, unknown>);
        } else {
          this.channel?.send(msg.action || '', msg.result as Record<string, unknown>);
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
