import { DAPP_CHANGE_NETWORK } from "@/constant/msgTypes";
import browser from "webextension-polyfill";

// ============ Types ============

export interface MessagePayload {
  action: string;
  payload?: Record<string, unknown>;
  [key: string]: unknown;
}

export type SendResponseCallback<T = unknown> = (params: T) => void;
export type ErrorCallback = () => void;

// ============ Functions ============

/**
 * Sending messages to background
 */
export function sendMsg<T = unknown>(
  message: MessagePayload,
  sendResponse?: SendResponseCallback<T>,
  errorCallback?: ErrorCallback
): void {
  const { action } = message;
  browser.runtime
    .sendMessage({
      ...message,
    })
    .then((params) => {
      sendResponse?.(params as T);
      if (browser.runtime.lastError) {
        console.error("send message error", action, browser.runtime.lastError);
        errorCallback?.();
      }
    })
    .catch((err) => {
      console.warn("send message error", action, err);
      errorCallback?.();
    });
}

/**
 * Sending messages with Promise
 */
export function sendMsgV2<T = unknown>(message: MessagePayload): Promise<T> {
  return new Promise((resolve, reject) => {
    const { action } = message;
    browser.runtime
      .sendMessage({
        ...message,
      })
      .then((response) => {
        if (browser.runtime.lastError) {
          console.error(
            "send message error",
            action,
            browser.runtime.lastError
          );
          reject(browser.runtime.lastError);
        } else {
          resolve(response as T);
        }
      });
  });
}

/**
 * Open web page in new tab
 */
export function openTab(url: string): void {
  browser.tabs.create({
    url: url,
  });
}

// ============ Network Config Type ============

interface NetConfig {
  networkID?: string;
  [key: string]: unknown;
}

/**
 * Send network change message
 */
export function sendNetworkChangeMsg(netConfig: NetConfig): void {
  if (netConfig.networkID) {
    sendMsg(
      {
        action: DAPP_CHANGE_NETWORK,
        payload: {
          netConfig: netConfig,
        },
      },
      () => {}
    );
  }
}
