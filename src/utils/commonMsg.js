import extension from 'extensionizer'
/**
 * sending messages
 * @param {*} message 
 * @param {*} sendResponse 
 */
export function sendMsg(message, sendResponse,errorCallback) {
  const { action } = message
  extension.runtime.sendMessage(
    {
      // messageSource, action, payload
      ...message,
    },
    async (params) => {
      sendResponse && sendResponse(params)
      if (extension.runtime.lastError) {
        console.error("send message error",action,extension.runtime.lastError);
        if(errorCallback){
          errorCallback()
        }
      }
    }
  );
}


/**
 * open web  page
 * @param {*} url 
 */
export function openTab(url){
  extension.tabs.create({
    url: url,
  });
}