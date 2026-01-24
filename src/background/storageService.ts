import browser from "webextension-polyfill";
import { produce } from "immer";

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
  return new Promise((resolve, reject) => {
    extensionStorage
      .set(value)
      .then(() => {
        const error = browser.runtime.lastError;
        if (error) {
          reject(error);
          return;
        }
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
}

/**
 * get local storage
 * @param {*} value
 */
export function get(value: string | string[]): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    extensionStorage
      .get(value)
      .then((items) => {
        const error = browser.runtime.lastError;
        if (error) {
          reject(error);
          return;
        }
        resolve(items);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

/**
 * remove local storage
 * @param {*} value
 */
export function removeValue(value: string | string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    extensionStorage
      .remove(value)
      .then(() => {
        const error = browser.runtime.lastError;
        if (error) {
          reject(error);
          return;
        }
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
}

/**
 * remove all local storage
 */
export function clearStorage(): void {
  extensionStorage.clear();
}

// ============ Credential Storage Functions ============

export const getStoredCredentials = (): Promise<CredentialsStore> => {
  return new Promise((resolve) => {
    extensionStorage.get("credentials").then((result) => {
      resolve({
        credentials: (result.credentials as Record<string, Record<string, CredentialData>>) || {},
      });
    });
  });
};

const setStoredData = (data: CredentialsStore): Promise<void> => {
  return new Promise((resolve) => {
    extensionStorage.set(data as unknown as Record<string, unknown>).then(() => {
      resolve();
    });
  });
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
  const current = await getStoredCredentials();
  const newData = produce(current, (draft) => {
    // Ensure the address key exists in credentials
    if (!draft.credentials[address]) {
      draft.credentials[address] = {};
    }
    // Store the credential under the specified address and credentialId
    draft.credentials[address][credentialId] = {
      ...draft.credentials[address][credentialId],
      ...credential,
    };
  });
  await setStoredData(newData);
};

export const removeCredential = async (
  address: string,
  credentialId: string
): Promise<void> => {
  const current = await getStoredCredentials();
  const newData = produce(current, (draft) => {
    if (draft.credentials[address]) {
      delete draft.credentials[address][credentialId];
      // Optionally, clean up the address key if it's empty
      if (Object.keys(draft.credentials[address]).length === 0) {
        delete draft.credentials[address];
      }
    }
  });
  await setStoredData(newData);
};

export const searchCredential = async ({
  address,
  query,
  props,
}: SearchCredentialParams): Promise<unknown[]> => {
  const { credentials } = await getStoredCredentials();

  // Get credentials for the specified address, default to empty object if not found
  const addressCredentials = credentials[address] || {};

  // Convert to array of credential objects, including the credentialId
  const objectsStatesArray = Object.entries(addressCredentials).map(
    ([id, credential]) => ({
      id,
      ...credential,
    })
  );

  // Filter based on the query
  const filteredObjects = objectsStatesArray.filter((object) =>
    matchesQuery(object, query)
  );

  // If props are specified, return only the requested properties
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
      if (typeof query[key] === "object" && !Array.isArray(query[key])) {
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
