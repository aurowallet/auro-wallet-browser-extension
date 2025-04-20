import extension from "extensionizer";
import { produce } from "immer";

const extensionStorage = extension.storage && extension.storage.local;

/**
 * save local in storage
 */
export function save(value) {
  return new Promise((resolve, reject) => {
    extensionStorage.set(value, () => {
      let error = extension.runtime.lastError;
      if (error) {
        reject(error);
      }
      resolve();
    });
  });
}

/**
 * get local storage
 * @param {*} value
 */
export function get(value) {
  return new Promise((resolve, reject) => {
    extensionStorage.get(value, (items) => {
      let error = extension.runtime.lastError;
      if (error) {
        reject(error);
      }
      resolve(items);
    });
  });
}

/**
 * remove local storage
 * @param {*} value
 */
export function removeValue(value) {
  return new Promise((resolve, reject) => {
    extensionStorage.remove(value, () => {
      let error = extension.runtime.lastError;
      if (error) {
        reject(error);
      }
      resolve();
    });
  });
}

/**
 * remove all local storage
 */
export function clearStorage() {
  extensionStorage.clear();
}

export const getStoredCredentials = () => {
  return new Promise((resolve) => {
    extensionStorage.get("credentials", (result) => {
      resolve({
        credentials: result.credentials || {},
      });
    });
  });
};

const setStoredData = (data) => {
  return new Promise((resolve) => {
    extensionStorage.set(data, () => {
      resolve();
    });
  });
};

export const getCredentialById = async (credentialId) => {
  const { credentials } = await getStoredCredentials();
  return credentials[credentialId] || {};
};

export const storeCredential = async ({ credentialId, credential }) => {
  const current = await getStoredCredentials();
  const newData = produce(current, (draft) => {
    draft.credentials[credentialId] = {
      ...draft.credentials[credentialId],
      ...credential,
    };
  });
  await setStoredData(newData);
};
export const removeCredential = async (credentialId) => {
  const current = await getStoredCredentials();
  const newData = produce(current, (draft) => {
    delete draft.credentials[credentialId];
  });
  await setStoredData(newData);
};
export const searchCredential = async ({ query, props }) => {
  const { credentials } = await getStoredCredentials();
  
  const objectsStatesArray = Object.values(credentials);
  const filteredObjects = objectsStatesArray.filter((object) =>
    matchesQuery(object, query)
  );
  if (props?.length) {
    return filteredObjects.flatMap((object) =>
      props.filter((prop) => prop in object).map((prop) => object[prop])
    );
  }
  return filteredObjects;
};
function matchesQuery(obj, query) {
  for (const key in query) {
    if (Object.prototype.hasOwnProperty.call(query, key)) {
      if (typeof query[key] === "object" && !Array.isArray(query[key])) {
        if (
          !Object.prototype.hasOwnProperty.call(obj, key) ||
          !matchesQuery(obj[key], query[key])
        ) {
          return false;
        }
      } else if (Array.isArray(obj[key]) && typeof query[key] === "string") {
        if (!obj[key].includes(query[key])) {
          return false;
        }
      } else if (obj[key] !== query[key]) {
        return false;
      }
    }
  }
  return true;
}
