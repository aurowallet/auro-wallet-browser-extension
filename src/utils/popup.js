import { POPUP_CHANNEL_KEYS } from "@/constant/commonType";
import browser from "webextension-polyfill";
import { POPUP_ACTIONS } from "../constant/msgTypes";

export const PopupSize = {
  width: 375,
  height: 600 + 28, // 28px is tabBar height
  fixHeight: 80,
  exitSize: 100,
};

export let lastWindowIds = {};

export function checkAndTopV2(channel) {
  return new Promise(async (resolve) => {
    browser.tabs.query(
      {
        windowId: lastWindowIds[channel],
      }).then(async (tabs)=>{
        if (tabs.length <= 0) {
          resolve(false);
          return;
        }
        if (lastWindowIds[channel]) {
          try {
            await browser.windows.update(lastWindowIds[channel], {
              focused: true,
            });
          } catch (e) {
            console.log(`Failed to update window focus: ${e.message}`);
          }
          resolve(true);
        } else {
          resolve(false);
        }
      })
  });
}

/**
 * Try open window if no previous window exists.
 * If, previous window exists, try to change the location of this window.
 * Finally, try to recover focusing for opened window.
 * @param url
 */
async function openPopupWindow(
  url,
  channel = "default",
  options = {}
) {
  const option = Object.assign(
    {
      width: PopupSize.width,
      height: PopupSize.height,
      url: url,
      type: "popup",
    },
    options
  );
  const createdWindow = await new Promise((resolve) => {
    browser.windows.create(option).then((windowData) => {
      resolve(windowData);
    });
  });
  lastWindowIds[channel] = createdWindow?.id;

  if (lastWindowIds[channel]) {
    try {
      await browser.windows.update(lastWindowIds[channel], {
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
  options = {}
) {
  const option = Object.assign(
    {
      width: PopupSize.width,
      height: PopupSize.height,
      url: url,
      type: "popup",
    },
    options
  );

  const createdWindow = await new Promise((resolve) => {
    browser.windows.create(option).then((windowData) => {
      resolve(windowData);
    });
  });
  lastWindowIds[channel] = createdWindow?.id;

  if (lastWindowIds[channel]) {
    try {
      await browser.windows.update(lastWindowIds[channel], {
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
      await browser.windows.remove(windowId);
    }
  })();
}
/**
 *
 * @param {*} withListener
 * @returns
 */
export function startExtensionPopup(withListener = false) {
  return new Promise(async (resolve) => {
    if (lastWindowIds[POPUP_CHANNEL_KEYS.popup]) {
      await checkAndTopV2(POPUP_CHANNEL_KEYS.popup);
      resolve(lastWindowIds[POPUP_CHANNEL_KEYS.popup]);
      return;
    }
    let targetUrl = "popup.html";
    browser.windows.getCurrent().then(async (currentWindow) => {
      const top = currentWindow.top; // Top of the current window
      const left = currentWindow.left + currentWindow.width - PopupSize.width; // Align to the right edge
      const id = await openPopupWindow(
        targetUrl,
        POPUP_CHANNEL_KEYS.popup,
        {
          left: left - 130,
          top: top, //+ PopupSize.fixHeight,
        }
      );
      if (!withListener) {
        resolve(id);
      } else {
        const onMessage = (message, sender, sendResponse) => {
          const { action } = message;
          switch (action) {
            case POPUP_ACTIONS.POPUP_NOTIFACATION:
              sendResponse("page live");
              browser.runtime.onMessage.removeListener(onMessage);
              resolve(id);
              break;
            default:
              break;
          }
          return false;
        };
        browser.runtime.onMessage.addListener(onMessage);
      }
    });
  });
}

// Function to create a new tab
function createTab(url) {
  browser.tabs.create({ url: url, active: true }).then((tab)=>{
    lastWindowIds[POPUP_CHANNEL_KEYS.welcome] = tab.id;
  })
}
// Function to create or activate a tab
export async function createOrActivateTab(url = "") {
  if (lastWindowIds[POPUP_CHANNEL_KEYS.welcome]) {
      await browser.tabs.update(lastWindowIds[POPUP_CHANNEL_KEYS.welcome], {
        active: true,
        url,
      });
  } else {
    createTab(url);
  }
}
