
/**
 * 存储在本地存储
 */
export function saveLocal(key,value) {
    return localStorage.setItem(key, value);
}


/**
 * 获取本地存储的值
 * @param {*} value 
 */
export function getLocal(key) {
    return localStorage.getItem(key);
}

/**
 * 移除本地存储的值
 * @param {*} value 
 */
export function removeLocal(key) {
    localStorage.removeItem(key);
}

/**
 * 移除所有存储
 */
export function clearLocal() {
    localStorage.clear();
}
