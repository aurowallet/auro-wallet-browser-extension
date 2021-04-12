import extension from 'extensionizer'
/**
 * 发送消息的封装类
 * @param {*} message 
 * @param {*} sendResponse 
 */
export function sendMsg(message, sendResponse) {
  const { messageSource, action, payload } = message
  extension.runtime.sendMessage(
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
  extension.tabs.create({
    url: url,
  });
}