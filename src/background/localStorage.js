import { LOCAL_CACHE_KEYS } from "@/constant/storageKey";

/**
 * save local
 */
 export function saveLocal(key, value) {
    return localStorage.setItem(key, value);
}


/**
 * get local value
 * @param {*} value
 */
export function getLocal(key) {
    return localStorage.getItem(key);
}

/**
 * remove local value
 * @param {*} value
 */
export function removeLocal(key) {
    localStorage.removeItem(key);
}

/**
 * remove all local storage
 */
export function clearLocal() {
    localStorage.clear();
}

/**
 * get all local storage
 */
 export function getAllLocal() {
    return localStorage.valueOf();
}


/**
 * clear local storage except some keys
 * @param {string|string[]} targetKeys - single key or array of keys to preserve
 */
 export function clearLocalExcept(targetKeys) {
     if(targetKeys){
        const keysToKeep = Array.isArray(targetKeys) ? targetKeys : [targetKeys];
        let data = getAllLocal()
        let keys = Object.keys(data)
        for (let index = 0; index < keys.length; index++) {
            const key = keys[index];
            if(!keysToKeep.includes(key)){
                removeLocal(key)
            }
        }
     }else{
        clearLocal()
     }
}


export function clearLocalCache() {
  let localCacheKeys = Object.keys(LOCAL_CACHE_KEYS);
  for (let index = 0; index < localCacheKeys.length; index++) {
    const keys = localCacheKeys[index];
    let localKey = LOCAL_CACHE_KEYS[keys];
    removeLocal(localKey);
  }
}