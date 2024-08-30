import extensionizer from "extensionizer";
import {sendMsg} from "../utils/commonMsg";
import { MessageChannel,getSiteIcon } from '@aurowallet/mina-provider';
import { WALLET_CONNECT_TYPE } from "../constant/commonType";

const CONTENT_SCRIPT = WALLET_CONNECT_TYPE.CONTENT_SCRIPT;
const contentScript = {
  init() {
    this.channel = new MessageChannel(CONTENT_SCRIPT);
    this.registerListeners();
    this.inject()
    this.reportUrl()
  },
  reportUrl(){
    extensionizer.runtime.connect({ name: CONTENT_SCRIPT });
  },
  registerListeners() {
    window.addEventListener("message", (event) => {
      const { data: eventData } = event;
      const { isAuro = false, message, source } = eventData;
      if (!isAuro || (!message && !source)) return;
      if (source === CONTENT_SCRIPT) return;
      const { data } = message;

      const nextPayload = {
        ...data.payload,
        site: {
          origin: event.origin,
          webIcon: getSiteIcon(event.source),
        },
      };
      sendMsg({
        action: data.action,
        messageSource: 'messageFromDapp',
        payload: nextPayload,
      }, async (params) => {
        this.channel.send("messageFromWallet", params);
      });
    });

    extensionizer.runtime.onMessage.addListener(
      (message, sender, sendResponse) => {
        if (message.id) {
          this.channel.send("messageFromWallet", message);
        } else {
          this.channel.send(message.action, message.result);
        }
        sendResponse("content-back");
        return true;
      }
    );
  },

  inject() {
    const hostPage = (document.head || document.documentElement);
    const script = document.createElement('script');

    script.src = extensionizer.runtime.getURL('webhook.js');
    script.onload = function() {
      this.parentNode.removeChild(this);
    };
    hostPage.appendChild(script);
  }
};
contentScript.init();