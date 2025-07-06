import assert from "assert";
import cryptoModule from "../../src/utils/encryptUtils";

describe("Crypto Module Test", function () {
  describe("encrypt and decrypt", () => {
    it("should encrypt and decrypt data correctly with Argon2 (version 2)", async () => {
      const data = { token: "test-token", value: 123 };
      const password = "securePassword123";
      const encrypted = await cryptoModule.encrypt(password, data);
      const parsedEncrypted = JSON.parse(encrypted);

      assert.ok(parsedEncrypted.data, "encrypted data should be present");
      assert.ok(parsedEncrypted.iv, "iv should be present");
      assert.ok(parsedEncrypted.salt, "salt should be present");
      assert.strictEqual(parsedEncrypted.version, 2, "version should be 2");

      const decrypted = await cryptoModule.decrypt(password, encrypted);
      assert.deepStrictEqual(
        decrypted,
        data,
        "decrypted data should match original"
      );
    });

    it("should throw error for incorrect password", async () => {
      const data = { token: "test-token", value: 123 };
      const correctPassword = "securePassword123";
      const wrongPassword = "wrongPassword";
      const encrypted = await cryptoModule.encrypt(correctPassword, data);

      await assert.rejects(
        async () => await cryptoModule.decrypt(wrongPassword, encrypted),
        /Incorrect password/,
        "should throw Incorrect password error"
      );
    });

    it("should handle empty data input", async () => {
      const data = {};
      const password = "securePassword123";
      const encrypted = await cryptoModule.encrypt(password, data);
      const parsedEncrypted = JSON.parse(encrypted);

      assert.ok(parsedEncrypted.data, "encrypted data should be present");
      assert.ok(parsedEncrypted.iv, "iv should be present");
      assert.ok(parsedEncrypted.salt, "salt should be present");
      assert.strictEqual(parsedEncrypted.version, 2, "version should be 2");

      const decrypted = await cryptoModule.decrypt(password, encrypted);
      assert.deepStrictEqual(
        decrypted,
        data,
        "decrypted data should match original"
      );
    });
  });
});
