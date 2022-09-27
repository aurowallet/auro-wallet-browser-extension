import extension from 'extensionizer'
const extensionStorage = extension.storage && extension.storage.local

/**
 * save local in storage
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
 * get local storage 
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
 * remove local storage
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
 * remove all local storage
 */
export function clearStorage() {
    extensionStorage.clear();
}
