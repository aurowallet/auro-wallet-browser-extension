import sodium from "libsodium-wrappers-sumo";
import { Buffer } from "buffer";

// ============ Types ============

interface EncryptedPayload {
  data: string;
  iv: string;
  salt?: string;
  version?: number;
}

// ============ Internal Functions ============

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

  const buf = await globalThis.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: vector },
    key,
    dataBuffer
  );

  const buffer = new Uint8Array(buf);
  const vectorStr = Buffer.from(vector).toString("base64");
  const vaultStr = Buffer.from(buffer).toString("base64");

  return { data: vaultStr, iv: vectorStr };
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

  const keyBuffer = await sodium.crypto_pwhash(
    32,
    new TextEncoder().encode(password),
    saltBuffer,
    sodium.crypto_pwhash_OPSLIMIT_MODERATE,
    sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_ALG_ARGON2ID13
  );

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer.buffer as ArrayBuffer,
    "AES-GCM",
    false,
    ["encrypt", "decrypt"]
  );

  return cryptoKey;
}

async function keyFromPassword(password: string, salt: string): Promise<CryptoKey> {
  const passBuffer = Buffer.from(password, "utf8");
  const saltBuffer = Buffer.from(salt, "base64");

  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    passBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return globalThis.crypto.subtle.deriveKey(
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
}

// ============ Exported Functions ============

async function encrypt(password: string, dataObj: unknown): Promise<string> {
  const salt = generateSalt(16);
  const passwordDerivedKey = await keyFromPasswordV2(password, salt);
  const payload = await encryptWithKey(passwordDerivedKey, dataObj);

  return JSON.stringify({
    ...payload,
    salt,
    version: 2,
  });
}

async function decrypt(password: string, text: string): Promise<unknown> {
  const payload: EncryptedPayload = JSON.parse(text);
  const salt = payload.salt || "";

  const keyDerivedFunc = payload.version === 2 ? keyFromPasswordV2 : keyFromPassword;
  const key = await keyDerivedFunc(password, salt);

  return decryptWithKey(key, payload);
}

export default {
  encrypt,
  decrypt,
};
