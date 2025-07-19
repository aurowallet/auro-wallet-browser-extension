import assert from "assert";
import { encryptData, decryptData } from "../../src/utils/fore";
import forge from "node-forge";

describe("Reducer Utils Test", function () {
  const node_private_keys = `
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDFvRo/GMwDOzz3
+/gK0FQBz824eITrliIdpzPsV/fMOXYT1N944WB1vVZDuitqI2inebRoMQTfke7N
qSFoRSQIlc+dtgM6fcs9mFZlwT9xjxA9o5xVzQGFxa8wHo1/v0/nZd0QQZBVm22v
rHqCOsHukd0bbQIQ66lp2ygb1byUeavJt8xw+aPTuU+XF2p1YKLSgf7cm5+5/lmj
i6CdBtA4gV9u0bK6IAkSKxrQWBumY/0LW7jmu24z8ERXXjh7vygxG3a4y7ScKlD3
glYfTQEjW47mOsaN7jNjc3y34ubIr2dMlvxj/H4uZka4+hVlq0VIPAC6nfOZd6E9
HNtGZq8pAgMBAAECggEANO0kKM5U0Oqaq4+UOSTAz4lU+XK8tSgGsqQt2C1FhLK+
oZlBRWQhwvHuNIuQkkSu/uCrApZYRRUU85Q4/mU/O1MJ8p8kpxPDghWTzoGWnykZ
Qj5YGnkYVrtuZDVRT2egFgIkVPUPknJbPgGu+suKW/ZL1crsGiZRvqUry6N+acjc
isU6ZpC6Zb4ghrU6HG41nUJJx1k/SDMRRMQiy/WIBOrRo8m/jz6kXdPaBBu1ChPW
9y3juHLBvc9Os9U1unVxywGN1OnFXRSvZ6uX9wOQtf9rC14OFIyfUINlQbB5jAHh
rBx4pOKE/thZEgVJLqW4SZu69wRr8zCNUThgnbydlwKBgQDxvo9DYF8oDquNZbxU
PDE5BTjkpSIW1LaG0Mkz/i3QTXRF8pqFeX0Mxf2M/8bSnZilKIhMz5FVW1XIIPsQ
8bsmHb1QMNusxxrAzY9TI8RcFvgAiGquv5wqANJJS7E00bt7MXM8v8nLx6FmqMhL
WG1ghltRXMvKEj4yyhi8ysnUCwKBgQDRZjiBiZIofV4q2Tgbk7qQ6gegRH3/o+Mg
KpoXzIs6kJQI1PpHRC4X9B1i2cXm09Hq0VoJ1OpcyY5uL4PM3Udr1r1Im79XUgkV
aKq2EEG6uDHGhvOoxCj8X244YER5YlYUIyoKy4xbTKIvxwPhiM2QltNB7DkjQE4R
NFjGFAk2GwKBgQCqhvfcWWEGisKtLbTZ3tQCGxL1Bx+y5z4Sf7lOueBrbhe1N9uU
iAyUNB4VlmAUNiN1bdAoDsvAYHt0fv9cBokz7AqdRLnReWn/04Fk7ngXVgR/q7tF
pdhtMMMl/QT183TDBDD8C3Y4D4xlNG6F58zQKDbGgCUpWBEUFse4dXxF3QKBgAd4
YBeu8rnjDxL0QN4q/QLidncvOld+X0HsgybKM0VZlw5hmrQkKIjOOqYmIrtDXz/D
TDUBlYLN5fjkVQ1f74ZXWNVYSREyagSLgVuRZObmX1A3zEV/Cf9G4EW+mXLDIVMC
liNgc5dmOnr93JOVL9AysUKuzLMHPkG63lfiqxl1AoGBAJvla7SffJOtSK43MQtk
NzwUnv3nyT0zYkgd7FLgDoZUWNkvQ+6joHoof6B2gCi3QcmwSTbc1rHEEPgKHeWM
s9xeT7lvxop4jyoOSMCbODRctFJYLSi5Xa9iKSvwRduCdgTgEkfr1SX60yTmUhz7
ARKgmyCCSs6hhGG2bQFR7WoI
-----END PRIVATE KEY-----
`;
  const node_public_keys = `
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxb0aPxjMAzs89/v4CtBU
Ac/NuHiE65YiHacz7Ff3zDl2E9TfeOFgdb1WQ7oraiNop3m0aDEE35HuzakhaEUk
CJXPnbYDOn3LPZhWZcE/cY8QPaOcVc0BhcWvMB6Nf79P52XdEEGQVZttr6x6gjrB
7pHdG20CEOupadsoG9W8lHmrybfMcPmj07lPlxdqdWCi0oH+3Jufuf5Zo4ugnQbQ
OIFfbtGyuiAJEisa0FgbpmP9C1u45rtuM/BEV144e78oMRt2uMu0nCpQ94JWH00B
I1uO5jrGje4zY3N8t+LmyK9nTJb8Y/x+LmZGuPoVZatFSDwAup3zmXehPRzbRmav
KQIDAQAB
-----END PUBLIC KEY-----

`;

  describe("encryptData and decryptData", () => {
    it("should encrypt and decrypt data correctly", () => {
      const data = { token: "test-token", value: 123 };
      const encrypted = encryptData(data, node_public_keys);
      assert.ok(encrypted.encryptedData, "encryptedData should be present");
      assert.ok(encrypted.encryptedAESKey, "encryptedAESKey should be present");
      assert.ok(encrypted.iv, "iv should be present");

      const decrypted = decryptData(
        encrypted.encryptedData,
        encrypted.encryptedAESKey,
        encrypted.iv,
        node_private_keys
      );
      assert.deepStrictEqual(decrypted, data);
    });

    it("should throw error for invalid private key", () => {
      const data = { token: "test-token", value: 123 };
      const encrypted = encryptData(data, node_public_keys); // Use publicKey from before hook
      const invalidPrivateKey = forge.pki.privateKeyToPem(
        forge.pki.rsa.generateKeyPair({ bits: 2048 }).privateKey
      );

      assert.throws(
        () =>
          decryptData(
            encrypted.encryptedData,
            encrypted.encryptedAESKey,
            encrypted.iv,
            invalidPrivateKey
          ),
        /Error:.*(Encrypted message is invalid|Invalid RSAES-OAEP padding)/ // Accept either error message
      );
    });

    it("should throw error for invalid encrypted data", () => {
      assert.throws(
        () =>
          decryptData(
            "invalid-base64",
            forge.util.encode64(forge.random.getBytesSync(32)),
            forge.util.encode64(forge.random.getBytesSync(16)),
            node_private_keys
          ),
        /Error: Encrypted message length is invalid./
      );
    });

    it("should handle empty data input", () => {
      const data = {};
      const encrypted = encryptData(data, node_public_keys);
      assert.ok(encrypted.encryptedData, "encryptedData should be present");
      assert.ok(encrypted.encryptedAESKey, "encryptedAESKey should be present");
      assert.ok(encrypted.iv, "iv should be present");

      const decrypted = decryptData(
        encrypted.encryptedData,
        encrypted.encryptedAESKey,
        encrypted.iv,
        node_private_keys
      );
      assert.deepStrictEqual(decrypted, data);
    });
  });
});
