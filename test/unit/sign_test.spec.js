const sinon = require("sinon");
const proxyquire = require("proxyquire").noCallThru();
const assert = require("assert");
import { signDataV2 } from "../data/sign_data_v2";

const pathToModule = "../../src/background/lib";
const utilsPath = "../../utils/utils";

describe("Functionality on mainnet", function () {
  let getCurrentNetConfigStub;

  beforeEach(function () {
    getCurrentNetConfigStub = sinon
      .stub()
      .returns(Promise.resolve({ netType: "mainnet" }));

    this.module = proxyquire(pathToModule, {
      [utilsPath]: {
        getCurrentNetConfig: getCurrentNetConfigStub,
      },
    });
  });

  describe("signTransaction on mainnet", function () {
    it("should correctly send payment", async function () {
      const signResult = await this.module.signTransaction(
        signDataV2.testAccount.privateKey,
        {
          ...signDataV2.signPayment.mainnet.signParams,
        }
      );
      assert.strictEqual(
        JSON.stringify(signResult),
        JSON.stringify(signDataV2.signPayment.mainnet.signResult)
      );
    });

    it("should correctly send stakeDelegation", async function () {
      const signResult = await this.module.signTransaction(
        signDataV2.testAccount.privateKey,
        {
          ...signDataV2.signStakeTransaction.mainnet.signParams,
        }
      );
      assert.strictEqual(
        JSON.stringify(signResult),
        JSON.stringify(signDataV2.signStakeTransaction.mainnet.signResult)
      );
    });

    it("should correctly sign message & verify message", async function () {
      const signResult = await this.module.signTransaction(
        signDataV2.testAccount.privateKey,
        {
          ...signDataV2.signMessage.mainnet.signParams,
        }
      );
      assert.strictEqual(
        JSON.stringify(signResult),
        JSON.stringify(signDataV2.signMessage.mainnet.signResult)
      );

      const verifyResult = await this.module.verifyMessage(
        signResult.publicKey,
        signResult.signature,
        signResult.data
      );
      assert.strictEqual(verifyResult, true);
    });
  });
  describe("signFeilds on mainnet", function () {
    it("should correctly sign fields", async function () {
      const signResult = await this.module.signFieldsMessage(
        signDataV2.testAccount.privateKey,
        {
          ...signDataV2.signFileds.mainnet.signParams,
        }
      );
      assert.strictEqual(
        signResult.signature,
        signDataV2.signFileds.mainnet.signResult.signature
      );

      const verifyResult = await this.module.verifyFieldsMessage(
        signResult.publicKey,
        signResult.signature,
        signResult.data,
      );
      assert.strictEqual(verifyResult, true);
    });
  });
  describe("create nullifier on mainnet", function () {
    it("should correctly create nullifier", async function () {
      const signResult = await this.module.createNullifier(
        signDataV2.testAccount.privateKey,
        {
          ...signDataV2.nullifierData.mainnet.signParams,
        }
      );
      assert.strictEqual(!!signResult.private, true);
    });
  });
});

describe("Functionality on testnet", function () {
  let getCurrentNetConfigStub;

  beforeEach(function () {
    getCurrentNetConfigStub = sinon
      .stub()
      .returns(Promise.resolve({ netType: "testnet" }));

    this.module = proxyquire(pathToModule, {
      [utilsPath]: {
        getCurrentNetConfig: getCurrentNetConfigStub,
      },
    });
  });

  describe("signTransaction on testnet", function () {
    it("should correctly send payment", async function () {
      const signResult = await this.module.signTransaction(
        signDataV2.testAccount.privateKey,
        {
          ...signDataV2.signPayment.testnet.signParams,
        }
      );
      assert.strictEqual(
        JSON.stringify(signResult),
        JSON.stringify(signDataV2.signPayment.testnet.signResult)
      );
    });

    it("should correctly send stakeDelegation", async function () {
      const signResult = await this.module.signTransaction(
        signDataV2.testAccount.privateKey,
        {
          ...signDataV2.signStakeTransaction.testnet.signParams,
        }
      );
      assert.strictEqual(
        JSON.stringify(signResult),
        JSON.stringify(signDataV2.signStakeTransaction.testnet.signResult)
      );
    });

    it("should correctly send zk transaction", async function () {
      const signResult = await this.module.signTransaction(
        signDataV2.testAccount.privateKey,
        {
          ...signDataV2.signZkTransaction.testnet.signParams,
        }
      );
      assert.strictEqual(
        JSON.stringify(signResult),
        JSON.stringify(signDataV2.signZkTransaction.testnet.signResult)
      );
    });
    it("should correctly sign message & verify message", async function () {
      const signResult = await this.module.signTransaction(
        signDataV2.testAccount.privateKey,
        {
          ...signDataV2.signMessage.testnet.signParams,
        }
      );
      assert.strictEqual(
        JSON.stringify(signResult),
        JSON.stringify(signDataV2.signMessage.testnet.signResult)
      );

      const verifyResult = await this.module.verifyMessage(
        signResult.publicKey,
        signResult.signature,
        signResult.data
      );
      assert.strictEqual(verifyResult, true);
    });
  });
  describe("signFeilds on testnet", function () {
    it("should correctly sign fields", async function () {
      const signResult = await this.module.signFieldsMessage(
        signDataV2.testAccount.privateKey,
        {
          ...signDataV2.signFileds.testnet.signParams,
        }
      );
      assert.strictEqual(
        signResult.signature,
        signDataV2.signFileds.testnet.signResult.signature
      );
      
      const verifyResult = await this.module.verifyFieldsMessage(
        signResult.publicKey,
        signResult.signature,
        signResult.data,
      );
      assert.strictEqual(verifyResult, true);
    });
  });
  describe("create nullifier on testnet", function () {
    it("should correctly create nullifier", async function () {
      const signResult = await this.module.createNullifier(
        signDataV2.testAccount.privateKey,
        {
          ...signDataV2.nullifierData.testnet.signParams,
        }
      );
      assert.strictEqual(!!signResult.private, true);
    });
  });
});
