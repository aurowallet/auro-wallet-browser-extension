/**
 * Crypto Module Tests - Migrated from Mocha to Jest
 */
import cryptoModule from '@/utils/encryptUtils';

describe('Crypto Module Test', () => {
  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt data correctly with Argon2 (version 2)', async () => {
      const data = { token: 'test-token', value: 123 };
      const password = 'securePassword123';
      const encrypted = await cryptoModule.encrypt(password, data);
      const parsedEncrypted = JSON.parse(encrypted);

      expect(parsedEncrypted.data).toBeTruthy();
      expect(parsedEncrypted.iv).toBeTruthy();
      expect(parsedEncrypted.salt).toBeTruthy();
      expect(parsedEncrypted.version).toBe(2);

      const decrypted = await cryptoModule.decrypt(password, encrypted);
      expect(decrypted).toEqual(data);
    });

    it('should throw error for incorrect password', async () => {
      const data = { token: 'test-token', value: 123 };
      const correctPassword = 'securePassword123';
      const wrongPassword = 'wrongPassword';
      const encrypted = await cryptoModule.encrypt(correctPassword, data);

      await expect(
        cryptoModule.decrypt(wrongPassword, encrypted)
      ).rejects.toThrow(/Incorrect password/);
    });

    it('should handle empty data input', async () => {
      const data = {};
      const password = 'securePassword123';
      const encrypted = await cryptoModule.encrypt(password, data);
      const parsedEncrypted = JSON.parse(encrypted);

      expect(parsedEncrypted.data).toBeTruthy();
      expect(parsedEncrypted.iv).toBeTruthy();
      expect(parsedEncrypted.salt).toBeTruthy();
      expect(parsedEncrypted.version).toBe(2);

      const decrypted = await cryptoModule.decrypt(password, encrypted);
      expect(decrypted).toEqual(data);
    });
  });

  describe('Session CryptoKey (non-exportable)', () => {
    it('should derive a session key with generated salt', async () => {
      const password = 'securePassword123';
      const { key, salt } = await cryptoModule.deriveSessionKey(password);

      expect(key).toBeTruthy();
      expect(key instanceof CryptoKey).toBe(true);
      expect(salt).toBeTruthy();
      expect(typeof salt).toBe('string');
    });

    it('should derive the same key with the same salt', async () => {
      const password = 'securePassword123';
      const { key: key1, salt } = await cryptoModule.deriveSessionKey(password);
      const { key: key2 } = await cryptoModule.deriveSessionKey(password, salt);

      // Encrypt with key1, decrypt with key2 - should work if keys are identical
      const data = { test: 'value' };
      const encrypted = await cryptoModule.encryptWithCryptoKey(key1, data);
      const decrypted = await cryptoModule.decryptWithCryptoKey(key2, encrypted);
      expect(decrypted).toEqual(data);
    });

    it('should encrypt and decrypt with CryptoKey (version 3)', async () => {
      const password = 'securePassword123';
      const { key } = await cryptoModule.deriveSessionKey(password);
      const data = { token: 'test-token', value: 456 };

      const encrypted = await cryptoModule.encryptWithCryptoKey(key, data);
      const parsedEncrypted = JSON.parse(encrypted);

      expect(parsedEncrypted.data).toBeTruthy();
      expect(parsedEncrypted.iv).toBeTruthy();
      expect(parsedEncrypted.version).toBe(3);
      expect(parsedEncrypted.salt).toBeUndefined();

      const decrypted = await cryptoModule.decryptWithCryptoKey(key, encrypted);
      expect(decrypted).toEqual(data);
    });

    it('should fail to decrypt with wrong key', async () => {
      const { key: key1 } = await cryptoModule.deriveSessionKey('password1');
      const { key: key2 } = await cryptoModule.deriveSessionKey('password2');
      const data = { secret: 'data' };

      const encrypted = await cryptoModule.encryptWithCryptoKey(key1, data);

      await expect(
        cryptoModule.decryptWithCryptoKey(key2, encrypted)
      ).rejects.toThrow(/Incorrect password/);
    });

    it('should verify password by decrypting vault', async () => {
      const password = 'securePassword123';
      const { key, salt } = await cryptoModule.deriveSessionKey(password);

      // Encrypt some vault data
      const vaultData = { version: 3, keyrings: [] };
      const encrypted = await cryptoModule.encryptWithCryptoKey(key, vaultData);

      // Correct password: re-derive key and decrypt succeeds
      const { key: freshKey } = await cryptoModule.deriveSessionKey(password, salt);
      const decrypted = await cryptoModule.decryptWithCryptoKey(freshKey, encrypted);
      expect(decrypted).toEqual(vaultData);
    });

    it('should reject wrong password when decrypting vault', async () => {
      const { key: correctKey, salt } = await cryptoModule.deriveSessionKey('correct');

      const vaultData = { version: 3, keyrings: [] };
      const encrypted = await cryptoModule.encryptWithCryptoKey(correctKey, vaultData);

      // Wrong password: re-derive key and decrypt should fail
      const { key: wrongKey } = await cryptoModule.deriveSessionKey('wrong', salt);
      await expect(
        cryptoModule.decryptWithCryptoKey(wrongKey, encrypted)
      ).rejects.toThrow();
    });

    it('CryptoKey should be non-exportable', async () => {
      const { key } = await cryptoModule.deriveSessionKey('password');

      // The key should not be exportable - attempting to export should throw
      await expect(
        crypto.subtle.exportKey('raw', key)
      ).rejects.toThrow();
    });
  });
});
