import browser from "webextension-polyfill";
import { DEBUG_LOG_STORAGE_KEY } from "../constant/storageKey";

const originalLog = console.log.bind(console);
const originalWarn = console.warn.bind(console);

export const noop = (): void => {
  /* intentionally empty */
};

let initialized = false;

function disableConsole(): void {
  console.log = noop;
  console.warn = noop;
}

function enableConsole(): void {
  console.log = originalLog;
  console.warn = originalWarn;
}

export async function initRuntimeLog(): Promise<void> {
  if (initialized) return;
  initialized = true;

  disableConsole();

  try {
    const data = await browser.storage.local.get(DEBUG_LOG_STORAGE_KEY);
    if (data[DEBUG_LOG_STORAGE_KEY] === true) {
      enableConsole();
    }
  } catch {
  }

  try {
    browser.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && DEBUG_LOG_STORAGE_KEY in changes) {
        if (changes[DEBUG_LOG_STORAGE_KEY].newValue === true) {
          enableConsole();
        } else {
          disableConsole();
        }
      }
    });
  } catch {
  }
}

export async function getDebugLogEnabled(): Promise<boolean> {
  try {
    const data = await browser.storage.local.get(DEBUG_LOG_STORAGE_KEY);
    return data[DEBUG_LOG_STORAGE_KEY] === true;
  } catch {
    return false;
  }
}

export async function setDebugLogEnabled(enabled: boolean): Promise<void> {
  await browser.storage.local.set({ [DEBUG_LOG_STORAGE_KEY]: enabled });
}
