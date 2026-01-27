import forge from "node-forge";

// ============ Types ============

interface EncryptedResult {
  encryptedData: string;
  encryptedAESKey: string;
  iv: string;
}

// ============ Internal Functions ============

const encryptAESKeyWithRSA = (aesKey: string, publicKey: string): string => {
  const rsaPublicKey = forge.pki.publicKeyFromPem(publicKey);
  const encryptedAESKey = rsaPublicKey.encrypt(aesKey, "RSA-OAEP", {
    md: forge.md.sha256.create(),
  });
  return forge.util.encode64(encryptedAESKey);
};

const encryptDataWithAES = (data: unknown, aesKey: string, iv: string): string => {
  const cipher = forge.cipher.createCipher("AES-CBC", aesKey);
  cipher.start({ iv: forge.util.createBuffer(iv) });
  cipher.update(forge.util.createBuffer(JSON.stringify(data), "utf8"));
  cipher.finish();
  return forge.util.encode64(cipher.output.getBytes());
};

const decryptAESKeyWithRSA = (encryptedAESKey: string, privateKeyPEM: string): string => {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPEM);
  const encryptedKeyBuffer = forge.util.decode64(encryptedAESKey);
  const decryptedKey = privateKey.decrypt(encryptedKeyBuffer, "RSA-OAEP", {
    md: forge.md.sha256.create(),
  });
  return decryptedKey;
};

const decryptDataWithAES = <T = unknown>(
  encryptedData: string,
  aesKey: string,
  iv: forge.util.ByteStringBuffer
): T => {
  const decipher = forge.cipher.createDecipher("AES-CBC", aesKey);
  decipher.start({ iv });
  decipher.update(forge.util.createBuffer(forge.util.decode64(encryptedData)));
  decipher.finish();
  return JSON.parse(decipher.output.toString()) as T;
};

// ============ Exported Functions ============

export const encryptData = (data: unknown, publicKey: string): EncryptedResult => {
  const aesKey = forge.random.getBytesSync(32);
  const iv = forge.random.getBytesSync(16);
  const encryptedData = encryptDataWithAES(data, aesKey, iv);
  const encryptedAESKey = encryptAESKeyWithRSA(aesKey, publicKey);
  return {
    encryptedData,
    encryptedAESKey,
    iv: forge.util.encode64(iv),
  };
};

export const decryptData = <T = unknown>(
  encryptedData: string,
  encryptedAESKey: string,
  iv: string,
  privateKeyPEM: string
): T => {
  const aesKey = decryptAESKeyWithRSA(encryptedAESKey, privateKeyPEM);
  const data = decryptDataWithAES<T>(
    encryptedData,
    aesKey,
    forge.util.createBuffer(forge.util.decode64(iv))
  );
  return data;
};
