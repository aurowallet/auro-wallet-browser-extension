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
});
