import extension from "extensionizer";

const PopupSize = {
  width: 375,
  height: 600 + 28, // 28px is tabBar height
};
/**
 * window.open() has many options for sizing, but they require different ways to do this per web .
 * So, to avoid this problem, just manually set sizing if new window popup is opened.
 */
export function fitPopupWindow() {
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