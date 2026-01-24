import browser from "webextension-polyfill";

/**
 * save local
 */
export async function extSaveLocal(key: string, value: unknown): Promise<void> {
  await browser.storage.local.set({ [key]: value });
}

/**
 * get local value
 * @param {*} key
 */
export async function extGetLocal(key: string): Promise<unknown> {
  const data = await browser.storage.local.get([key]);
  return data[key];
}

/**
 * remove local value
 * @param {*} key
 */
export async function extRemoveLocal(key: string): Promise<void> {
  return browser.storage.local.remove(key);
}
