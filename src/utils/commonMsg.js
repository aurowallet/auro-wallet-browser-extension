import browser from 'webextension-polyfill';
/**
 * sending messages
 * @param {*} message 
 * @param {*} sendResponse 
 */
export function sendMsg(message, sendResponse,errorCallback) {
  const { action } = message
  browser.runtime.sendMessage(
    {
      ...message,
    },
  ).then((params)=>{
      sendResponse && sendResponse(params)
      if (browser.runtime.lastError) {
        console.error("send message error",action,browser.runtime.lastError);
        if(errorCallback){
          errorCallback()
        }
      }
  });
}

export function sendMsgV2(message) {
  return new Promise((resolve, reject) => {
    const { action } = message;
    browser.runtime.sendMessage(
      {
        ...message,
      },
    ).then((response)=>{
      if (browser.runtime.lastError) {
        console.error("send message error", action, browser.runtime.lastError);
        reject(browser.runtime.lastError);
      } else {
        resolve(response);
      }
  });
  });
}

/**
 * open web  page
 * @param {*} url 
 */
export function openTab(url){
  browser.tabs.create({
    url: url,
  });
}