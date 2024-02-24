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
    it("should correctly handle transactions", async function () {
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
    it("should correctly handle transactions", async function () {
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
  });
});
