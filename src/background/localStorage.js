
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
 * clear local storage except some key
 */
 export function clearLocalExcept(targetKey) {
     if(targetKey){
        let data = getAllLocal()
        let keys = Object.keys(data)
        for (let index = 0; index < keys.length; index++) {
            const key = keys[index];
            if(key!== targetKey ){
                removeLocal(key)
            }
        }
     }else{
        clearLocal()
     }
}

