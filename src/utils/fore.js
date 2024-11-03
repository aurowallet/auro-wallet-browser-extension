import forge from "node-forge";

// Encrypt AES key with RSA
const encryptAESKeyWithRSA = (aesKey, publicKey) => {
  const rsaPublicKey = forge.pki.publicKeyFromPem(publicKey);
  const encryptedAESKey = rsaPublicKey.encrypt(aesKey, "RSA-OAEP", {
    md: forge.md.sha256.create(),
  });
  return forge.util.encode64(encryptedAESKey);
};

// AES encryption
const encryptDataWithAES = (data, aesKey, iv) => {
  const cipher = forge.cipher.createCipher("AES-CBC", aesKey);
  cipher.start({ iv: forge.util.createBuffer(iv) });
  cipher.update(forge.util.createBuffer(JSON.stringify(data), "utf8"));
  cipher.finish();
  return forge.util.encode64(cipher.output.getBytes());
};

// Function to encrypt data
export const encryptData = (data, publicKey) => {
  const aesKey = forge.random.getBytesSync(32); // 256-bit key
  const iv = forge.random.getBytesSync(16); // 16-byte IV
  const encryptedData = encryptDataWithAES(data, aesKey, iv);
  const encryptedAESKey = encryptAESKeyWithRSA(aesKey, publicKey);
  return {
    encryptedData,
    encryptedAESKey,
    iv: forge.util.encode64(iv),
  };
};

// Decrypt AES key with RSA
const decryptAESKeyWithRSA = (encryptedAESKey, privateKeyPEM) => {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPEM);
  const encryptedKeyBuffer = forge.util.decode64(encryptedAESKey);
  const decryptedKey = privateKey.decrypt(encryptedKeyBuffer, "RSA-OAEP", {
    md: forge.md.sha256.create(),
  });
  return decryptedKey;
};

// AES decryption
const decryptDataWithAES = (encryptedData, aesKey, iv) => {
  const decipher = forge.cipher.createDecipher("AES-CBC", aesKey);
  decipher.start({ iv: forge.util.createBuffer(iv) });
  decipher.update(forge.util.createBuffer(forge.util.decode64(encryptedData)));
  decipher.finish();
  return JSON.parse(decipher.output.toString("utf8"));
};

// Function to decrypt data
export const decryptData = (
  encryptedData,
  encryptedAESKey,
  iv,
  privateKeyPEM
) => {
  const aesKey = decryptAESKeyWithRSA(encryptedAESKey, privateKeyPEM);
  const data = decryptDataWithAES(
    encryptedData,
    aesKey,
    forge.util.decode64(iv)
  );
  return data;
};
