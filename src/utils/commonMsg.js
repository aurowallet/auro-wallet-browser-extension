
/**
 * 发送消息的封装类
 * @param {*} message 
 * @param {*} sendResponse 
 */
export function sendMsg(message, sendResponse) {
  const { messageSource, action, payload } = message
  chrome.runtime.sendMessage(
    {
      messageSource, action, payload
    },
    async (params) => {
      sendResponse && sendResponse(params)
    }
  );
}


/**
 * 打开网页
 * @param {*} url 
 */
export function openTab(url){
  chrome.tabs.create({
    url: url,
  });
}