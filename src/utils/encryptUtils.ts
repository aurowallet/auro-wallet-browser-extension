import sodium from "libsodium-wrappers-sumo";
import { Buffer } from "buffer";

// ============ Constants ============

const ENCRYPT_VERSION_ARGON2 = 2;
const ENCRYPT_VERSION_CRYPTOKEY = 3;

// ============ Types ============

interface EncryptedPayload {
  data: string;
  iv: string;
  salt?: string;
  version?: number;
}

// ============ Internal Functions ============

function wipeBytes(bytes?: Uint8Array | null): void {
  if (!bytes) return;
  bytes.fill(0);
}

function generateSalt(byteCount: number = 32): string {
  const view = new Uint8Array(byteCount);
  globalThis.crypto.getRandomValues(view);
  const b64encoded = btoa(String.fromCharCode.apply(null, Array.from(view)));
  return b64encoded;
}

async function encryptWithKey(
  key: CryptoKey,
  dataObj: unknown
): Promise<{ data: string; iv: string }> {
  const data = JSON.stringify(dataObj);
  const dataBuffer = Buffer.from(data, "utf8");
  const vector = globalThis.crypto.getRandomValues(new Uint8Array(16));
  try {
    const buf = await globalThis.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: vector },
      key,
      dataBuffer
    );

    const buffer = new Uint8Array(buf);
    const vectorStr = Buffer.from(vector).toString("base64");
    const vaultStr = Buffer.from(buffer).toString("base64");

    return { data: vaultStr, iv: vectorStr };
  } finally {
    wipeBytes(dataBuffer);
  }
}

async function decryptWithKey(key: CryptoKey, payload: EncryptedPayload): Promise<unknown> {
  const encryptedData = Buffer.from(payload.data, "base64");
  const vector = Buffer.from(payload.iv, "base64");

  try {
    const result = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: vector },
      key,
      encryptedData
    );
    const decryptedData = new Uint8Array(result);
    const decryptedStr = Buffer.from(decryptedData).toString("utf8");
    return JSON.parse(decryptedStr);
  } catch {
    throw new Error("Incorrect password");
  }
}

async function keyFromPasswordV2(password: string, salt: string): Promise<CryptoKey> {
  const saltBuffer = Buffer.from(salt, "base64");
  await sodium.ready;
  const passwordBytes = new TextEncoder().encode(password);
  let keyBuffer: Uint8Array | null = null;
  let importBytes: Uint8Array | null = null;
  try {
    keyBuffer = sodium.crypto_pwhash(
      32,
      passwordBytes,
      saltBuffer,
      sodium.crypto_pwhash_OPSLIMIT_MODERATE,
      sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_ALG_ARGON2ID13
    );

    // Copy into a standalone ArrayBuffer so importKey always receives exactly 32 bytes.
    const importBuf = new ArrayBuffer(keyBuffer.byteLength);
    importBytes = new Uint8Array(importBuf);
    importBytes.set(keyBuffer);
    return await crypto.subtle.importKey(
      "raw",
      importBuf,
      "AES-GCM",
      false,
      ["encrypt", "decrypt"]
    );
  } finally {
    wipeBytes(passwordBytes);
    wipeBytes(keyBuffer);
    wipeBytes(importBytes);
  }
}

async function keyFromPassword(password: string, salt: string): Promise<CryptoKey> {
  const passBuffer = Buffer.from(password, "utf8");
  const saltBuffer = Buffer.from(salt, "base64");
  try {
    const key = await globalThis.crypto.subtle.importKey(
      "raw",
      passBuffer,
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    return await globalThis.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: saltBuffer,
        iterations: 10000,
        hash: "SHA-256",
      },
      key,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  } finally {
    wipeBytes(passBuffer);
  }
}

// ============ Exported Functions ============

async function encrypt(password: string, dataObj: unknown): Promise<string> {
  const salt = generateSalt(16);
  const passwordDerivedKey = await keyFromPasswordV2(password, salt);
  const payload = await encryptWithKey(passwordDerivedKey, dataObj);

  return JSON.stringify({
    ...payload,
    salt,
    version: ENCRYPT_VERSION_ARGON2,
  });
}

async function decrypt(password: string, text: string): Promise<unknown> {
  const payload: EncryptedPayload = JSON.parse(text);

  if (payload.version === ENCRYPT_VERSION_CRYPTOKEY) {
    throw new Error("v3 payloads must be decrypted with decryptWithCryptoKey()");
  }

  const salt = payload.salt || "";
  const keyDerivedFunc = payload.version === ENCRYPT_VERSION_ARGON2 ? keyFromPasswordV2 : keyFromPassword;
  const key = await keyDerivedFunc(password, salt);

  return decryptWithKey(key, payload);
}

// ============ Session CryptoKey Functions ============
// Non-exportable CryptoKey approach: minimizes password residence in JS memory.
// Note: the input password string may still exist transiently in JS heap.
// The CryptoKey (extractable: false) lives only in the browser's C++ crypto engine.

async function deriveSessionKey(
  password: string,
  salt?: string
): Promise<{ key: CryptoKey; salt: string }> {
  const keySalt = salt || generateSalt(16);
  const key = await keyFromPasswordV2(password, keySalt);
  return { key, salt: keySalt };
}

async function encryptWithCryptoKey(
  key: CryptoKey,
  dataObj: unknown
): Promise<string> {
  const payload = await encryptWithKey(key, dataObj);
  return JSON.stringify({
    ...payload,
    version: ENCRYPT_VERSION_CRYPTOKEY,
  });
}

async function decryptWithCryptoKey<T = unknown>(
  key: CryptoKey,
  text: string
): Promise<T> {
  const payload: EncryptedPayload = JSON.parse(text);
  if (payload.version !== ENCRYPT_VERSION_CRYPTOKEY) {
    throw new Error(
      `decryptWithCryptoKey: expected v${ENCRYPT_VERSION_CRYPTOKEY} payload, got v${payload.version ?? 'none'}. ` +
      `Inner secrets may not have been migrated to CryptoKey format.`
    );
  }
  return decryptWithKey(key, payload) as Promise<T>;
}

export { generateSalt, ENCRYPT_VERSION_CRYPTOKEY };

export default {
  encrypt,
  decrypt,
  deriveSessionKey,
  encryptWithCryptoKey,
  decryptWithCryptoKey,
};
