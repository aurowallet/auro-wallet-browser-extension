import browser from "webextension-polyfill";
import { extGetLocal } from "../background/extensionStorage";
import { NET_WORK_CONFIG_V2 } from "../constant/storageKey"; 

export function getExtensionAction() {
  let isManifestV3 = browser.runtime.getManifest().manifest_version === 3;
  const action = isManifestV3 ? browser.action : browser.browserAction;
  return action;
}


export async function getCurrentNodeConfig() {
  let localNetConfig = await extGetLocal(NET_WORK_CONFIG_V2);
  if (localNetConfig) {
    return localNetConfig.currentNode;
  }
  return {};
}
export async function getLocalNetworkList() {
  let localNetConfig = await extGetLocal(NET_WORK_CONFIG_V2);
  if (localNetConfig) {
    return localNetConfig.customNodeList;
  }
  return [];
}

/**
 * copy text
 */
export function copyText(text) {
  return navigator.clipboard.writeText(text).catch((error) => {
    alert(`Copy failed! ${error}`);
  });
}