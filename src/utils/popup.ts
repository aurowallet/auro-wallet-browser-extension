import { POPUP_CHANNEL_KEYS, PopupChannelKey } from "@/constant/commonType";
import browser from "webextension-polyfill";
import { POPUP_ACTIONS } from "../constant/msgTypes";

// ============ Types ============

/**
 * Message listener for browser.runtime.onMessage
 * Returns void (synchronous) or true (async response pending)
 */
type RuntimeMessageListener = (
  message: unknown,
  sender: browser.Runtime.MessageSender,
  sendResponse: (response?: unknown) => void
) => void | true;

// ============ Constants ============

export const PopupSize = {
  width: 375,
  height: 600 + 28,
  fixHeight: 80,
  exitSize: 100,
} as const;

// ============ State ============

export const lastWindowIds: Record<string, number | null | undefined> = {};

// ============ Functions ============

export function checkAndTopV2(channel: string): Promise<boolean> {
  return new Promise(async (resolve) => {
    browser.tabs
      .query({
        windowId: lastWindowIds[channel] ?? undefined,
      })
      .then(async (tabs) => {
        if (tabs.length <= 0) {
          resolve(false);
          return;
        }
        if (lastWindowIds[channel]) {
          try {
            await browser.windows.update(lastWindowIds[channel]!, {
              focused: true,
            });
          } catch (e) {
            console.log(`Failed to update window focus: ${(e as Error).message}`);
          }
          resolve(true);
        } else {
          resolve(false);
        }
      });
  });
}

interface PopupWindowOptions {
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  url?: string;
  type?: "popup" | "normal" | "panel" | "detached_panel";
}

async function openPopupWindow(
  url: string,
  channel: string = "default",
  options: PopupWindowOptions = {}
): Promise<number | undefined> {
  const option = {
    width: PopupSize.width,
    height: PopupSize.height,
    url: url,
    type: "popup" as const,
    ...options,
  };

  const createdWindow = await browser.windows.create(option);
  lastWindowIds[channel] = createdWindow?.id;

  if (lastWindowIds[channel]) {
    try {
      await browser.windows.update(lastWindowIds[channel]!, {
        focused: true,
      });
    } catch (e) {
      console.log(`Failed to update window focus: ${(e as Error).message}`);
    }
  }
  return lastWindowIds[channel] ?? undefined;
}

export async function startPopupWindow(
  url: string,
  channel: string = "default",
  options: PopupWindowOptions = {}
): Promise<number | undefined> {
  const option = {
    width: PopupSize.width,
    height: PopupSize.height,
    url: url,
    type: "popup" as const,
    ...options,
  };

  const createdWindow = await browser.windows.create(option);
  lastWindowIds[channel] = createdWindow?.id;

  if (lastWindowIds[channel]) {
    try {
      await browser.windows.update(lastWindowIds[channel]!, {
        focused: true,
      });
    } catch (e) {
      console.log(`Failed to update window focus: ${(e as Error).message}`);
    }
  }
  return lastWindowIds[channel] ?? undefined;
}

export function closePopupWindow(channel: string): void {
  (async () => {
    const windowId = lastWindowIds[channel];
    if (windowId) {
      await browser.windows.remove(windowId);
    }
  })();
}

export function startExtensionPopup(withListener: boolean = false): Promise<number | undefined> {
  return new Promise(async (resolve) => {
    if (lastWindowIds[POPUP_CHANNEL_KEYS.popup]) {
      await checkAndTopV2(POPUP_CHANNEL_KEYS.popup);
      resolve(lastWindowIds[POPUP_CHANNEL_KEYS.popup] ?? undefined);
      return;
    }
    const targetUrl = "popup.html";
    browser.windows.getCurrent().then(async (currentWindow) => {
      const top = currentWindow.top;
      const left =
        (currentWindow.left ?? 0) + (currentWindow.width ?? 0) - PopupSize.width;
      const id = await openPopupWindow(targetUrl, POPUP_CHANNEL_KEYS.popup, {
        left: left - 130,
        top: top ?? undefined,
      });
      if (!withListener) {
        resolve(id);
      } else {
        const onMessage: RuntimeMessageListener = (
          message,
          _sender,
          sendResponse
        ) => {
          const { action } = message as { action?: string };
          switch (action) {
            case POPUP_ACTIONS.POPUP_NOTIFICATION:
              sendResponse("page live");
              browser.runtime.onMessage.removeListener(onMessage as Parameters<typeof browser.runtime.onMessage.removeListener>[0]);
              resolve(id);
              break;
            default:
              break;
          }
        };
        browser.runtime.onMessage.addListener(onMessage as Parameters<typeof browser.runtime.onMessage.addListener>[0]);
      }
    });
  });
}

function createTab(url: string): Promise<browser.Tabs.Tab> {
  return browser.tabs.create({ url: url, active: true }).then((tab) => {
    lastWindowIds[POPUP_CHANNEL_KEYS.welcome] = tab.id;
    return tab;
  });
}

export async function createOrActivateTab(url: string = ""): Promise<void> {
  const existingTabId = lastWindowIds[POPUP_CHANNEL_KEYS.welcome];

  if (existingTabId) {
    try {
      const tab = await browser.tabs.get(existingTabId);
      if (tab) {
        await browser.tabs.update(existingTabId, {
          active: true,
          url,
        });
        if (tab.windowId) {
          await browser.windows.update(tab.windowId, { focused: true });
        }
        return;
      }
    } catch {
      lastWindowIds[POPUP_CHANNEL_KEYS.welcome] = null;
    }
  }

  await createTab(url);
}
