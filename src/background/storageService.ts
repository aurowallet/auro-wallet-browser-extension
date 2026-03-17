import browser from "webextension-polyfill";
import { produce } from "immer";
import encryptUtils from "../utils/encryptUtils";
import { memStore } from "@/store";

// ============ Constants ============

const extensionStorage = browser.storage && browser.storage.local;

// ============ Types ============

interface CredentialData {
  [key: string]: unknown;
}

interface CredentialsStore {
  credentials: Record<string, Record<string, CredentialData>>;
}

interface StoreCredentialParams {
  address: string;
  credentialId: string;
  credential: CredentialData;
}

interface SearchCredentialParams {
  address: string;
  query: Record<string, unknown>;
  props?: string[];
}

// ============ Basic Storage Functions ============

/**
 * save local in storage
 */
export function save(value: Record<string, unknown>): Promise<void> {
  return extensionStorage.set(value);
}

/**
 * get local storage
 * @param {*} value
 */
export function get(value: string | string[]): Promise<Record<string, any>> {
  return extensionStorage.get(value);
}

/**
 * remove local storage
 * @param {*} value
 */
export function removeValue(value: string | string[]): Promise<void> {
  return extensionStorage.remove(value);
}

/**
 * remove all local storage
 */
export function clearStorage(): void {
  extensionStorage.clear();
}

// ============ Credential Operation Lock ============

let credentialOpLock: Promise<void> = Promise.resolve();

async function withCredentialLock<T>(fn: () => Promise<T>): Promise<T> {
  const previous = credentialOpLock;
  let release: () => void = () => {};
  credentialOpLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    return await fn();
  } finally {
    release();
  }
}

type PlaintextCredentials = Record<string, Record<string, CredentialData>>;

function requireCryptoKey(): CryptoKey {
  const cryptoKey = memStore.getState().cryptoKey;
  if (!cryptoKey) {
    throw new Error("Wallet is locked: CryptoKey not available for credential encryption");
  }
  return cryptoKey;
}

async function readLegacyCredentials(): Promise<PlaintextCredentials> {
  const result = await extensionStorage.get("credentials");
  const raw = result.credentials;
  if (raw && typeof raw === "object" && typeof raw !== "string") {
    return raw as PlaintextCredentials;
  }
  return {};
}

async function readEncryptedCredentials(
  cryptoKey: CryptoKey
): Promise<PlaintextCredentials> {
  const result = await extensionStorage.get("credentialsEncrypted");
  const raw = result.credentialsEncrypted;
  if (!raw || typeof raw !== "string") return {};
  const decrypted = await encryptUtils.decryptWithCryptoKey<PlaintextCredentials>(
    cryptoKey,
    raw
  );
  return decrypted || {};
}

function mergeCredentials(
  legacy: PlaintextCredentials,
  encrypted: PlaintextCredentials
): PlaintextCredentials {
  const merged: PlaintextCredentials = {};
  for (const addr of Object.keys(legacy)) {
    merged[addr] = { ...legacy[addr] };
  }
  for (const addr of Object.keys(encrypted)) {
    if (!merged[addr]) {
      merged[addr] = {};
    }
    Object.assign(merged[addr], encrypted[addr]);
  }
  return merged;
}

async function saveEncryptedCredentials(
  data: PlaintextCredentials,
  cryptoKey: CryptoKey
): Promise<void> {
  const encrypted = await encryptUtils.encryptWithCryptoKey(cryptoKey, data);
  await extensionStorage.set({ credentialsEncrypted: encrypted });
}

async function saveLegacyCredentials(
  data: PlaintextCredentials
): Promise<void> {
  if (Object.keys(data).length === 0) {
    await extensionStorage.remove("credentials");
  } else {
    await extensionStorage.set({ credentials: data });
  }
}

export const getStoredCredentials = async (): Promise<CredentialsStore> => {
  const cryptoKey = memStore.getState().cryptoKey;
  if (!cryptoKey) {
    return { credentials: {} };
  }
  const [legacy, encrypted] = await Promise.all([
    readLegacyCredentials(),
    readEncryptedCredentials(cryptoKey),
  ]);
  return { credentials: mergeCredentials(legacy, encrypted) };
};

export const getCredentialById = async (
  address: string,
  credentialId: string
): Promise<CredentialData> => {
  const { credentials } = await getStoredCredentials();
  return credentials[address]?.[credentialId] || {};
};

export const storeCredential = async ({
  address,
  credentialId,
  credential,
}: StoreCredentialParams): Promise<void> => {
  return withCredentialLock(async () => {
    const cryptoKey = requireCryptoKey();
    const [legacy, encrypted] = await Promise.all([
      readLegacyCredentials(),
      readEncryptedCredentials(cryptoKey),
    ]);
    const existingLegacy = legacy[address]?.[credentialId];
    const existingEncrypted = encrypted[address]?.[credentialId];
    const merged = { ...existingLegacy, ...existingEncrypted, ...credential };
    const newEncrypted = produce(encrypted, (draft) => {
      if (!draft[address]) {
        draft[address] = {};
      }
      draft[address][credentialId] = merged;
    });
    await saveEncryptedCredentials(newEncrypted, cryptoKey);
    if (existingLegacy) {
      const newLegacy = produce(legacy, (draft) => {
        if (draft[address]) {
          delete draft[address][credentialId];
          if (Object.keys(draft[address]).length === 0) {
            delete draft[address];
          }
        }
      });
      await saveLegacyCredentials(newLegacy);
    }
  });
};

export const removeCredential = async (
  address: string,
  credentialId: string
): Promise<void> => {
  return withCredentialLock(async () => {
    const cryptoKey = requireCryptoKey();
    const [legacy, encrypted] = await Promise.all([
      readLegacyCredentials(),
      readEncryptedCredentials(cryptoKey),
    ]);
    let legacyChanged = false;
    const newLegacy = produce(legacy, (draft) => {
      if (draft[address]?.[credentialId]) {
        delete draft[address][credentialId];
        legacyChanged = true;
        if (Object.keys(draft[address]).length === 0) {
          delete draft[address];
        }
      }
    });
    const newEncrypted = produce(encrypted, (draft) => {
      if (draft[address]?.[credentialId]) {
        delete draft[address][credentialId];
        if (Object.keys(draft[address]).length === 0) {
          delete draft[address];
        }
      }
    });
    const saves: Promise<void>[] = [
      saveEncryptedCredentials(newEncrypted, cryptoKey),
    ];
    if (legacyChanged) {
      saves.push(saveLegacyCredentials(newLegacy));
    }
    await Promise.all(saves);
  });
};

export const searchCredential = async ({
  address,
  query,
  props,
}: SearchCredentialParams): Promise<unknown[]> => {
  const { credentials } = await getStoredCredentials();

  const addressCredentials = credentials[address] || {};

  const objectsStatesArray = Object.entries(addressCredentials).map(
    ([id, credential]) => ({
      id,
      ...credential,
    })
  );

  const filteredObjects = objectsStatesArray.filter((object) =>
    matchesQuery(object, query)
  );

  if (props?.length) {
    return filteredObjects.flatMap((object) =>
      props
        .filter((prop) => prop in object)
        .map((prop) => (object as Record<string, unknown>)[prop])
    );
  }

  return filteredObjects;
};

function matchesQuery(
  obj: Record<string, unknown>,
  query: Record<string, unknown>
): boolean {
  for (const key in query) {
    if (Object.prototype.hasOwnProperty.call(query, key)) {
      if (typeof query[key] === "object" && query[key] !== null && !Array.isArray(query[key])) {
        if (
          !Object.prototype.hasOwnProperty.call(obj, key) ||
          !matchesQuery(
            obj[key] as Record<string, unknown>,
            query[key] as Record<string, unknown>
          )
        ) {
          return false;
        }
      } else if (Array.isArray(obj[key]) && typeof query[key] === "string") {
        if (!(obj[key] as string[]).includes(query[key] as string)) {
          return false;
        }
      } else if (obj[key] !== query[key]) {
        return false;
      }
    }
  }
  return true;
}
