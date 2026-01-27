/**
 * get Site Icon from window
 * @param {*} window
 * @returns
 */
export function getSiteIcon (window: Window): string | null {
  const document = window.document
  // Use the site's favicon if it exists
  const shortcutIcon = document.querySelector('head > link[rel="shortcut icon"]') as HTMLLinkElement | null
  if (shortcutIcon) {
    return shortcutIcon.href
  }
  // Search through available icons in no particular order
  const icon = Array.from(document.querySelectorAll('head > link[rel="icon"]')).find((icon) => Boolean((icon as HTMLLinkElement).href)) as HTMLLinkElement | undefined
  if (icon) {
    return icon.href
  }

  return null
}