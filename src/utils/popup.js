import extension from 'extensionizer'

const PopupSize = {
  width: 360,
  height: 580,
};

const lastWindowIds = {};

/**
 * Try open window if no previous window exists.
 * If, previous window exists, try to change the location of this window.
 * Finally, try to recover focusing for opened window.
 * @param url
 */
export async function openPopupWindow(
  url,
  channel = "default"
) {
  const option = {
    width: PopupSize.width,
    height: PopupSize.height,
    url: url,
    type: "popup",
  };

  if (lastWindowIds[channel] !== undefined) {
    try {
      const window = await extension.windows.get(
        lastWindowIds[channel],
        {
          populate: true,
        }
      );
      if (window?.tabs?.length) {
        const tab = window.tabs[0];
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
  window.lastWindowIds = lastWindowIds
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
 * window.open() has many options for sizing, but they require different ways to do this per web .
 * So, to avoid this problem, just manually set sizing if new window popup is opened.
 */
export function fitPopupWindow() {
  // Get the gap size like title bar or menu bar, etc...
  const gap = {
    width: window.outerWidth - window.innerWidth,
    height: window.outerHeight - window.innerHeight,
  };

  if (extension.windows) {
    extension.windows.getCurrent().then((window) => {
      if (window?.id != null) {
        extension.windows.update(window.id, {
          width: PopupSize.width + gap.width,
          height: PopupSize.height + gap.height,
        });
      }
    });
    return;
  }

  window.resizeTo(PopupSize.width + gap.width, PopupSize.height + gap.height);
}

