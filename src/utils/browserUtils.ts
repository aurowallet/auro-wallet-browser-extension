import browser from "webextension-polyfill";
import { extGetLocal } from "../background/extensionStorage";
import { NET_WORK_CONFIG_V2 } from "../constant/storageKey";
import type { NetworkConfig } from "../constant/network";

// ============ Types ============

interface NetworkConfigStorage {
  currentNode?: NetworkConfig;
  customNodeList?: NetworkConfig[];
}

// ============ Functions ============

export function getExtensionAction() {
  const isManifestV3 = browser.runtime.getManifest().manifest_version === 3;
  const action = isManifestV3 ? browser.action : browser.browserAction;
  return action;
}

export async function getCurrentNodeConfig(): Promise<NetworkConfig | Record<string, never>> {
  const localNetConfig = (await extGetLocal(NET_WORK_CONFIG_V2)) as NetworkConfigStorage | null;
  if (localNetConfig) {
    return localNetConfig.currentNode || {};
  }
  return {};
}

export async function getLocalNetworkList(): Promise<NetworkConfig[]> {
  const localNetConfig = (await extGetLocal(NET_WORK_CONFIG_V2)) as NetworkConfigStorage | null;
  if (localNetConfig) {
    return localNetConfig.customNodeList || [];
  }
  return [];
}

/**
 * Copy text to clipboard
 */
export function copyText(text: string): Promise<void> {
  return navigator.clipboard.writeText(text).catch((error) => {
    alert(`Copy failed! ${error}`);
  });
}
