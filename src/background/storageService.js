const chromeStorage = chrome.storage && chrome.storage.local

/**
 * 存储在本地存储
 */
export function save(value) {
    return new Promise((resolve, reject) => {
        chromeStorage.set(value, () => {
            let error = chrome.runtime.lastError
            if (error) {
                reject(error);
            }
            resolve();
        });
    })
}


/**
 * 获取本地存储的值
 * @param {*} value 
 */
export function get(value) {
    return new Promise((resolve, reject) => {
        chromeStorage.get(value, items => {
            let error = chrome.runtime.lastError
            if (error) {
                reject(error);
            }
            resolve(items);
        });
    });
}

/**
 * 移除本地存储的值
 * @param {*} value 
 */
export function removeValue(value) {
    return new Promise((resolve, reject) => {
        chromeStorage.remove(value, () => {
            let error = chrome.runtime.lastError
            if (error) {
                reject(error);
            }
            resolve();
        });
    });
}

/**
 * 移除所有存储
 */
export function clearStorage() {
    chromeStorage.clear();
}
