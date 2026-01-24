import browser from 'webextension-polyfill';
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
      const { data: eventData, isTrusted } = event;
      const { isAuro = false, message, source } = eventData;
      if (!isTrusted) return;
      if (!isAuro || (!message && !source)) return;
      if (source === CONTENT_SCRIPT) return;
      const { data } = message;

      const nextPayload = {
        ...data.payload,
        site: {
          origin: event.origin,
          webIcon: getSiteIcon(event.source as Window & typeof globalThis),
        },
      };
      sendMsg(
        {
          action: data.action,
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
