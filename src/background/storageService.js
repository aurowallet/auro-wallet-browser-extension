import extension from 'extensionizer'
const extensionStorage = extension.storage && extension.storage.local

/**
 * 存储在本地存储
 */
export function save(value) {
    return new Promise((resolve, reject) => {
        extensionStorage.set(value, () => {
            let error = extension.runtime.lastError
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
        extensionStorage.get(value, items => {
            let error = extension.runtime.lastError
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
        extensionStorage.remove(value, () => {
            let error = extension.runtime.lastError
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
    extensionStorage.clear();
}
