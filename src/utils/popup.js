import { POPUP_CHANNEL_KEYS } from '@/constant/commonType';
import extension from 'extensionizer';
import { POPUP_ACTIONS } from '../constant/msgTypes';

export const PopupSize = {
  width: 375,
  height: 600 + 28,// 28px is tabBar height
  fixHeight:80,
  exitSize:100,
};

export let lastWindowIds = {};

function checkForError() {
  const { lastError } = extension.runtime;
  if (!lastError) {
    return undefined;
  }
  if (lastError.stack && lastError.message) {
    return lastError;
  }
  return new Error(lastError.message);
}


function getLastFocusedWindow() {
  return new Promise((resolve, reject) => {
    extension.windows.getLastFocused((windowObject) => {
      const error = checkForError();
      if (error) {
        return reject(error);
      }
      return resolve(windowObject);
    });
  });
}
export async function getDappWindowPosition() {
  let left = 0;
  let top = 0;
  try {
    const lastFocused = await getLastFocusedWindow();
    // Position window in top right corner of lastFocused window.
    top = lastFocused.top;
    left = lastFocused.left + (lastFocused.width - PopupSize.width);
  } catch (_) {
    // The following properties are more than likely 0, due to being
    // opened from the background chrome process for the extension that
    // has no physical dimensions
    const { screenX, screenY, outerWidth } = window;
    top = Math.max(screenY, 0);
    left = Math.max(screenX + (outerWidth - PopupSize.width), 0);
  }
  return {
    top, left
  }
}
/**
 * @param {*} windowId 
 * @returns 
 */
export function checkAndTop(windowId, channel) {
  return new Promise(async (resolve) => {
    extension.tabs.query({
      windowId: windowId
    }, async (tabs) => {
      if (tabs.length <= 0) {
        resolve(false)
        return
      };
      if (lastWindowIds[channel]) {
        try {
          await extension.windows.update(lastWindowIds[channel], {
            focused: true,
          });
        } catch (e) {
          console.log(`Failed to update window focus: ${e.message}`);
        }
        resolve(true)
      }else{
        resolve(false)
      }
    });
  })
}

export function checkAndTopV2(channel) {
  return new Promise(async (resolve) => {
    extension.tabs.query({
      windowId: lastWindowIds[channel]
    }, async (tabs) => {
      console.log('checkAndTopV2');
      if (tabs.length <= 0) {
        resolve(false)
        return
      };
      if (lastWindowIds[channel]) {
        try {
          await extension.windows.update(lastWindowIds[channel], {
            focused: true,
          });
        } catch (e) {
          console.log(`Failed to update window focus: ${e.message}`);
        }
        resolve(true)
      }else{
        resolve(false)
      }
    });
  })
}

async function getCurrentTab(windowId) {
  return new Promise((resolve) => {
    extension.tabs.query({
      windowId: windowId
    }, (tabs) => {
      resolve(tabs)
    })
  })
}
/**
 * Try open window if no previous window exists.
 * If, previous window exists, try to change the location of this window.
 * Finally, try to recover focusing for opened window.
 * @param url
 */
export async function openPopupWindow(
  url,
  channel = "default",
  windowType = "",
  options = {}
) {
  if (windowType === "dapp") {
    let dappOption = await getDappWindowPosition()
    options = {
      ...options,
      ...dappOption
    }
  }
  const option = Object.assign({
    width: PopupSize.width,
    height: PopupSize.height,
    url: url,
    type: "popup",
  }, options);

  if (lastWindowIds[channel] !== undefined) {
    try {
      const window = await getCurrentTab(lastWindowIds[channel])
      if (window?.length) {
        const tab = window[0];
        if (tab?.id) {
          await extension.tabs.update(tab.id, { active: true, url });
        } else {
          throw new Error("Null window or tabs");
        }
      } else {
        throw new Error("Null window or tabs");
      }
    } catch {
      const createdWindow = await new Promise(resolve => {
        extension.windows.create(option, function (windowData) {
          resolve(windowData)
        })
      })
      lastWindowIds[channel] = createdWindow?.id;
    }
  } else {
    const createdWindow = await new Promise(resolve => {
      extension.windows.create(option, function (windowData) {
        resolve(windowData)
      })
    })
    lastWindowIds[channel] = createdWindow?.id;
  }

  if (lastWindowIds[channel]) {
    try {
      await extension.windows.update(lastWindowIds[channel], {
        focused: true,
      });
    } catch (e) {
      console.log(`Failed to update window focus: ${e.message}`);
    }
  }
  return lastWindowIds[channel];
}


export async function startPopupWindow(
  url,
  channel = "default",
  windowType = "",
  options = {}
) {
  if (windowType === "dapp") {
    let dappOption = await getDappWindowPosition()
    options = {
      ...options,
      ...dappOption
    }
  }
  const option = Object.assign({
    width: PopupSize.width,
    height: PopupSize.height,
    url: url,
    type: "popup",
  }, options);

  const createdWindow = await new Promise(resolve => {
    extension.windows.create(option, function (windowData) {
      resolve(windowData)
    })
  })
  lastWindowIds[channel] = createdWindow?.id;

  if (lastWindowIds[channel]) {
    try {
      await extension.windows.update(lastWindowIds[channel], {
        focused: true,
      });
    } catch (e) {
      console.log(`Failed to update window focus: ${e.message}`);
    }
  }
  return lastWindowIds[channel];
}

export function closePopupWindow(channel) {
  (async () => {
    const windowId = lastWindowIds[channel];
    if (windowId) {
      await extension.windows.remove(windowId);
    }
  })();
}
/**
 * 
 * @param {*} withListener
 * @returns 
 */
export function startExtensionPopup(withListener = false) {
  return new Promise((resolve)=>{
  let targetUrl = 'popup.html'
  extension.windows.getCurrent().then(async (currentWindow) => {
    const top = currentWindow.top; // Top of the current window
    const left = currentWindow.left + currentWindow.width - PopupSize.width; // Align to the right edge
    const id = await openPopupWindow(targetUrl, POPUP_CHANNEL_KEYS.popup, undefined, {
      left: left,
      top: top + PopupSize.fixHeight,
    })
    if(!withListener){
      resolve(id)
    }else{
      const onMessage = (message, sender, sendResponse) => {
        const { action } = message;
        switch (action) {
          case POPUP_ACTIONS.POPUP_NOTIFACATION:
            sendResponse("page live");
            extension.runtime.onMessage.removeListener(onMessage);
            resolve(id)
            break;
          default:
            break;
        }
        return false; 
      };
      extension.runtime.onMessage.addListener(onMessage)
    }
  });
})
}


// Function to create a new tab
function createTab(url) {
  extension.tabs.create({ url: url, active: true }, function(tab) {
    lastWindowIds[POPUP_CHANNEL_KEYS.welcome] = tab.id;
  });
}
// Function to create or activate a tab
export async function createOrActivateTab(url="") {
    if (lastWindowIds[POPUP_CHANNEL_KEYS.welcome] !== null) {
      if (lastWindowIds[POPUP_CHANNEL_KEYS.welcome]) {
        await extension.tabs.update(lastWindowIds[POPUP_CHANNEL_KEYS.welcome], { active: true, url });
      } else {
        createTab(url);
      }
    } else {
      createTab(url);
    }
}