import {
  getCredentialById,
  getStoredCredentials,
  removeCredential,
  searchCredential,
  storeCredential,
} from "../storageService";

// ============================================
// Types
// ============================================

export interface PrivateCredential {
  address: string;
  credentialId: string;
  credential: {
    credential: unknown;
    type: string;
  };
}

export interface CredentialSearchResult {
  type?: string;
  [key: string]: unknown;
}

// ============================================
// Credential Operations
// ============================================

export const storePrivateCredential = async (
  address: string,
  credential: unknown
): Promise<void> => {
  const nextCredential: PrivateCredential = {
    address,
    credentialId: crypto.randomUUID(),
    credential: { credential, type: "private-credential" },
  };
  await storeCredential(nextCredential);
};

export const getPrivateCredential = async (
  address: string
): Promise<Array<Record<string, unknown> | null>> => {
  const credentials = await searchCredential({
    address,
    query: { type: "private-credential" },
    props: [],
  });
  return (credentials as Array<CredentialSearchResult | null>).map((c) => {
    if (!c) return c;
    const { type, ...rest } = c;
    return rest;
  });
};

export const getCredentialIdList = async (
  address: string
): Promise<string[]> => {
  const { credentials } = await getStoredCredentials();
  return Object.keys(credentials[address] || {});
};

export const getTargetCredential = async (
  address: string,
  credentialId: string
): Promise<unknown> => {
  return await getCredentialById(address, credentialId);
};

export const removeTargetCredential = async (
  address: string,
  credentialId: string
): Promise<boolean> => {
  try {
    await removeCredential(address, credentialId);
    return true;
  } catch {
    return false;
  }
};
