import browser from 'webextension-polyfill';

/**
 * save local
 */
 export async function extSaveLocal(key, value) {
    await browser.storage.local.set({[key]: value});
}


/**
 * get local value
 * @param {*} key
 */
export async function extGetLocal(key) {
    const data = await browser.storage.local.get([key]);
    return data[key]
}

/**
 * remove local value
 * @param {*} key
 */
export async function extRemoveLocal(key) {
  return browser.storage.local.remove(key);
}