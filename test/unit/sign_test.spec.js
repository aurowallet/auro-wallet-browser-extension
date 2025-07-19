const sinon = require("sinon");
const proxyquire = require("proxyquire").noCallThru();
const assert = require("assert");
const { signDataV2 } = require("../data/sign_data_v2");

const pathToModule = "../../src/background/lib";
const utilsPath = "../../utils/browserUtils";

describe("Functionality on mainnet", function () {
  let getCurrentNetConfigStub;

  beforeEach(function () {
    getCurrentNetConfigStub = sinon
      .stub()
      .returns(Promise.resolve({ networkID: "mina:mainnet" }));

    this.module = proxyquire(pathToModule, {
      [utilsPath]: {
        getCurrentNodeConfig: getCurrentNetConfigStub,
      },
      "webextension-polyfill": {
        storage: {
          local: {
            set: sinon.stub().resolves(),
            get: sinon.stub().resolves({}),
            remove: sinon.stub().resolves(),
          },
        },
      },
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  describe("signTransaction on mainnet", function () {
    it("should correctly send payment on mainnet", async function () {
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

  describe("signFields on mainnet", function () {
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
        signResult.data
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
      .returns(Promise.resolve({ networkID: "mina:testnet" }));

    this.module = proxyquire(pathToModule, {
      [utilsPath]: {
        getCurrentNodeConfig: getCurrentNetConfigStub,
      },
      "webextension-polyfill": {
        storage: {
          local: {
            set: sinon.stub().resolves(),
            get: sinon.stub().resolves({}),
            remove: sinon.stub().resolves(),
          },
        },
      },
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  describe("signTransaction on testnet", function () {
    it("should correctly send payment on testnet", async function () {
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
      assert.deepStrictEqual(
        signResult,
        signDataV2.signZkTransaction.testnet.signResult
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

  describe("signFields on testnet", function () {
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
        signResult.data
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