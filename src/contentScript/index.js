import extensionizer from "extensionizer";
import {sendMsg} from "../utils/commonMsg";
import { MessageChannel } from '@aurowallet/mina-provider';
import { WALLET_CONNECT_TYPE } from "../constant/walletType";

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

    this.channel.on('messageFromWeb', async data => {
      sendMsg({
        action: data.action,
        messageSource: 'messageFromDapp',
        payload: data.payload,
      }, async (params) => {
        this.channel.send('messageFromWallet', params);
      })
    })
    extensionizer.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.id) {
        this.channel.send('messageFromWallet', message);
      } else {
        this.channel.send(message.action, message.result);
      }
      sendResponse('content-back')
    })
  },

  inject() {
    const hostPage = (document.head || document.documentElement);
    const script = document.createElement('script');

    script.src = extensionizer.runtime.getURL('webhook.js');
    script.onload = function() {
      this.parentNode.removeChild(this);
    };
    hostPage.insertBefore(
      script,
      hostPage.children[0]
    );
  }
};
contentScript.init();