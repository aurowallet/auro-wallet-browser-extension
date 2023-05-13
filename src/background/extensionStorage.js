import extension from "extensionizer";

/**
 * save local
 */
 export async function extSaveLocal(key, value) {
    await extension.storage.local.set({[key]: value});
}


/**
 * get local value
 * @param {*} key
 */
export async function extGetLocal(key) {
    const data = await extension.storage.local.get([key]);
    return data[key]
}

/**
 * remove local value
 * @param {*} key
 */
export async function extRemoveLocal(key) {
  return extension.storage.local.remove(key);
}

/**
 * remove all local storage
 */
export async function extClearLocal() {
  return extension.storage.local.clear();
}

/**
 * get all local storage
 */
 export async function extGetAllLocal() {
    return extension.storage.local.get();
}


/**
 * clear local storage except some key
 */
 export async function clearLocalExcept(targetKey) {
     if(targetKey){
        let data = await extGetAllLocal()
        let keys = Object.keys(data)
        for (let index = 0; index < keys.length; index++) {
            const key = keys[index];
            if(key!== targetKey ){
                await extRemoveLocal(key)
            }
        }
     }else{
        await extClearLocal()
     }
}