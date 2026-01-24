import { LOCAL_CACHE_KEYS } from "@/constant/storageKey";

/**
 * save local
 */
export function saveLocal(key: string, value: string): void {
  localStorage.setItem(key, value);
}

/**
 * get local value
 * @param {*} value
 */
export function getLocal(key: string): string | null {
  return localStorage.getItem(key);
}

/**
 * remove local value
 * @param {*} value
 */
export function removeLocal(key: string): void {
  localStorage.removeItem(key);
}

/**
 * remove all local storage
 */
export function clearLocal(): void {
  localStorage.clear();
}

/**
 * get all local storage
 */
export function getAllLocal(): Record<string, string> {
  return { ...localStorage };
}

/**
 * clear local storage except some keys
 * @param {string|string[]} targetKeys - single key or array of keys to preserve
 */
export function clearLocalExcept(targetKeys?: string | string[]): void {
  if (targetKeys) {
    const keysToKeep = Array.isArray(targetKeys) ? targetKeys : [targetKeys];
    const data = getAllLocal();
    const keys = Object.keys(data);
    for (let index = 0; index < keys.length; index++) {
      const key = keys[index];
      if (key && !keysToKeep.includes(key)) {
        removeLocal(key);
      }
    }
  } else {
    clearLocal();
  }
}

export function clearLocalCache(): void {
  const localCacheKeys = Object.keys(LOCAL_CACHE_KEYS) as Array<keyof typeof LOCAL_CACHE_KEYS>;
  for (let index = 0; index < localCacheKeys.length; index++) {
    const keyName = localCacheKeys[index];
    if (keyName) {
      const localKey = LOCAL_CACHE_KEYS[keyName];
      removeLocal(localKey);
    }
  }
}
