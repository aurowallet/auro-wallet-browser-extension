import { expect } from "chai";
import {
  analyzeTransactionRisks,
  calculateTokenFlow,
  analyzeTransaction,
  RISK_LEVEL,
  RISK_TYPES,
  getRiskSpecificDetails,
} from "../../src/utils/transactionAnalysis";

// Import test data from JSON files
import permissionsChangeData from "../data/zkapp_permissions_change.json";
import sendImpossibleData from "../data/zkapp_send_impossible.json";
import tokenTransferData from "../data/zkapp_token_transfer.json";
import convertToZkAppData from "../data/zkapp_convert_to_zkapp.json";
import delegateChangeData from "../data/zkapp_delegate_change.json";
import timingChangeData from "../data/zkapp_timing_change.json";
import contractPermissionsData from "../data/zkapp_contract_permissions.json";
import receiveImpossibleData from "../data/zkapp_receive_impossible.json";
import accessImpossibleData from "../data/zkapp_access_impossible.json";
import permissionsLockedData from "../data/zkapp_permissions_locked.json";
import multipleImpossibleData from "../data/zkapp_multiple_impossible.json";
import safeStateUpdateData from "../data/zkapp_safe_state_update.json";

const TEST_ADDRESS = "B62qkVs6zgN84e1KjFxurigqTQ57FqV3KnWubV3t77E9R6uBm4DmkPi";
const OTHER_ADDRESS = "B62qk3FF1FxfFxfJ4CLSgu2YehPdRqcNZw7Jw3z1JMyH28cSNR6XYDW";
const ZK_DEFAULT_TOKEN_ID =
  "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf";

describe("Transaction Analysis", () => {
  describe("analyzeTransactionRisks", () => {
    it("should detect verification key change (convert to zkApp) risk", () => {
      const zkappCommand = {
        feePayer: {
          body: {
            publicKey: TEST_ADDRESS,
            fee: "10000000",
            nonce: "0",
          },
        },
        accountUpdates: [
          {
            body: {
              publicKey: TEST_ADDRESS,
              tokenId: ZK_DEFAULT_TOKEN_ID,
              update: {
                verificationKey: {
                  data: "someData",
                  hash: "someHash",
                },
              },
              balanceChange: { magnitude: "0", sgn: "Positive" },
            },
          },
        ],
      };

      const result = analyzeTransactionRisks(zkappCommand, TEST_ADDRESS);

      expect(result.risks.length).to.be.greaterThan(0);
      expect(result.risks[0].type).to.equal(RISK_TYPES.CONVERT_TO_ZKAPP);
      expect(result.risks[0].level).to.equal(RISK_LEVEL.HIGH);
      expect(result.risks[0].isCurrentAccount).to.be.true;
    });

    it("should detect permissions change risk", () => {
      const zkappCommand = {
        feePayer: {
          body: {
            publicKey: TEST_ADDRESS,
            fee: "10000000",
            nonce: "0",
          },
        },
        accountUpdates: [
          {
            body: {
              publicKey: TEST_ADDRESS,
              tokenId: ZK_DEFAULT_TOKEN_ID,
              update: {
                permissions: {
                  send: "Signature",
                  receive: "None",
                },
              },
              balanceChange: { magnitude: "0", sgn: "Positive" },
            },
          },
        ],
      };

      const result = analyzeTransactionRisks(zkappCommand, TEST_ADDRESS);

      expect(result.risks.length).to.be.greaterThan(0);
      const permissionRisk = result.risks.find(
        (r) => r.type === RISK_TYPES.PERMISSIONS_CHANGE
      );
      expect(permissionRisk).to.not.be.undefined;
    });

    it("should detect high risk permissions (Impossible)", () => {
      const zkappCommand = {
        feePayer: {
          body: {
            publicKey: TEST_ADDRESS,
            fee: "10000000",
            nonce: "0",
          },
        },
        accountUpdates: [
          {
            body: {
              publicKey: TEST_ADDRESS,
              tokenId: ZK_DEFAULT_TOKEN_ID,
              update: {
                permissions: {
                  send: "Impossible",
                  access: "Impossible",
                },
              },
              balanceChange: { magnitude: "0", sgn: "Positive" },
            },
          },
        ],
      };

      const result = analyzeTransactionRisks(zkappCommand, TEST_ADDRESS);

      expect(result.summary.highRiskCount).to.be.greaterThan(0);
      expect(result.summary.overallLevel).to.equal(RISK_LEVEL.HIGH);
    });

    it("should detect delegate change risk", () => {
      const zkappCommand = {
        feePayer: {
          body: {
            publicKey: TEST_ADDRESS,
            fee: "10000000",
            nonce: "0",
          },
        },
        accountUpdates: [
          {
            body: {
              publicKey: TEST_ADDRESS,
              tokenId: ZK_DEFAULT_TOKEN_ID,
              update: {
                delegate: OTHER_ADDRESS,
              },
              balanceChange: { magnitude: "0", sgn: "Positive" },
            },
          },
        ],
      };

      const result = analyzeTransactionRisks(zkappCommand, TEST_ADDRESS);

      const delegateRisk = result.risks.find(
        (r) => r.type === RISK_TYPES.DELEGATE_CHANGE
      );
      expect(delegateRisk).to.not.be.undefined;
      expect(delegateRisk.level).to.equal(RISK_LEVEL.MEDIUM);
    });

    it("should detect timing change risk", () => {
      const zkappCommand = {
        feePayer: {
          body: {
            publicKey: TEST_ADDRESS,
            fee: "10000000",
            nonce: "0",
          },
        },
        accountUpdates: [
          {
            body: {
              publicKey: TEST_ADDRESS,
              tokenId: ZK_DEFAULT_TOKEN_ID,
              update: {
                timing: {
                  initialMinimumBalance: "1000000000",
                  cliffTime: "100",
                  cliffAmount: "500000000",
                  vestingPeriod: "10",
                  vestingIncrement: "100000000",
                },
              },
              balanceChange: { magnitude: "0", sgn: "Positive" },
            },
          },
        ],
      };

      const result = analyzeTransactionRisks(zkappCommand, TEST_ADDRESS);

      const timingRisk = result.risks.find(
        (r) => r.type === RISK_TYPES.TIMING_CHANGE
      );
      expect(timingRisk).to.not.be.undefined;
      expect(timingRisk.level).to.equal(RISK_LEVEL.HIGH);
    });

    it("should return no risks for safe transaction", () => {
      const zkappCommand = {
        feePayer: {
          body: {
            publicKey: TEST_ADDRESS,
            fee: "10000000",
            nonce: "0",
          },
        },
        accountUpdates: [
          {
            body: {
              publicKey: OTHER_ADDRESS,
              tokenId: ZK_DEFAULT_TOKEN_ID,
              update: {},
              balanceChange: { magnitude: "1000000000", sgn: "Negative" },
            },
          },
        ],
      };

      const result = analyzeTransactionRisks(zkappCommand, TEST_ADDRESS);

      expect(result.summary.totalRisks).to.equal(0);
      expect(result.summary.overallLevel).to.equal(RISK_LEVEL.LOW);
    });

    it("should not show risks for other accounts with safe permissions (e.g. deploying new contract)", () => {
      const zkappCommand = {
        feePayer: {
          body: {
            publicKey: TEST_ADDRESS,
            fee: "10000000",
            nonce: "0",
          },
        },
        accountUpdates: [
          {
            body: {
              publicKey: OTHER_ADDRESS,
              tokenId: ZK_DEFAULT_TOKEN_ID,
              update: {
                verificationKey: {
                  data: "someData",
                  hash: "someHash",
                },
                permissions: {
                  send: "Proof",
                  receive: "None",
                },
              },
              balanceChange: { magnitude: "0", sgn: "Positive" },
            },
          },
        ],
      };

      const result = analyzeTransactionRisks(zkappCommand, TEST_ADDRESS);

      // No risks should be shown since permissions are safe (not Impossible) and not current account
      expect(result.summary.totalRisks).to.equal(0);
      expect(result.summary.overallLevel).to.equal(RISK_LEVEL.LOW);
    });

    it("should show risks for other accounts with Impossible permissions", () => {
      const zkappCommand = {
        feePayer: {
          body: {
            publicKey: TEST_ADDRESS,
            fee: "10000000",
            nonce: "0",
          },
        },
        accountUpdates: [
          {
            body: {
              publicKey: OTHER_ADDRESS,
              tokenId: ZK_DEFAULT_TOKEN_ID,
              update: {
                permissions: {
                  send: "Impossible",
                  receive: "None",
                },
              },
              balanceChange: { magnitude: "0", sgn: "Positive" },
            },
          },
        ],
      };

      const result = analyzeTransactionRisks(zkappCommand, TEST_ADDRESS);

      // Should show high risk because Impossible permissions are always shown
      expect(result.summary.totalRisks).to.equal(1);
      expect(result.summary.highRiskCount).to.equal(1);
      expect(result.risks[0].type).to.equal(RISK_TYPES.PERMISSIONS_CHANGE);
      expect(result.risks[0].isCurrentAccount).to.be.false;
      expect(result.risks[0].details.dangerousPermissions.length).to.be.greaterThan(0);
    });

    it("should handle string input", () => {
      const zkappCommand = JSON.stringify({
        feePayer: {
          body: {
            publicKey: TEST_ADDRESS,
            fee: "10000000",
            nonce: "0",
          },
        },
        accountUpdates: [],
      });

      const result = analyzeTransactionRisks(zkappCommand, TEST_ADDRESS);

      expect(result.summary.totalRisks).to.equal(0);
    });

    it("should only show risks affecting current account when mixed with other accounts", () => {
      const zkappCommand = {
        feePayer: {
          body: {
            publicKey: TEST_ADDRESS,
            fee: "10000000",
            nonce: "0",
          },
        },
        accountUpdates: [
          {
            body: {
              publicKey: OTHER_ADDRESS,
              tokenId: ZK_DEFAULT_TOKEN_ID,
              update: {
                verificationKey: {
                  data: "someData",
                  hash: "someHash",
                },
              },
              balanceChange: { magnitude: "0", sgn: "Positive" },
            },
          },
          {
            body: {
              publicKey: TEST_ADDRESS,
              tokenId: ZK_DEFAULT_TOKEN_ID,
              update: {
                delegate: OTHER_ADDRESS,
              },
              balanceChange: { magnitude: "0", sgn: "Positive" },
            },
          },
        ],
      };

      const result = analyzeTransactionRisks(zkappCommand, TEST_ADDRESS);

      // Only the delegate change on current account should be detected
      expect(result.summary.totalRisks).to.equal(1);
      expect(result.risks[0].type).to.equal(RISK_TYPES.DELEGATE_CHANGE);
      expect(result.risks[0].isCurrentAccount).to.be.true;
    });
  });

  describe("calculateTokenFlow", () => {
    it("should calculate MINA outflow correctly", () => {
      const zkappCommand = {
        feePayer: {
          body: {
            publicKey: TEST_ADDRESS,
            fee: "10000000",
            nonce: "0",
          },
        },
        accountUpdates: [
          {
            body: {
              publicKey: TEST_ADDRESS,
              tokenId: ZK_DEFAULT_TOKEN_ID,
              update: {},
              balanceChange: { magnitude: "1000000000", sgn: "Negative" },
            },
          },
          {
            body: {
              publicKey: OTHER_ADDRESS,
              tokenId: ZK_DEFAULT_TOKEN_ID,
              update: {},
              balanceChange: { magnitude: "1000000000", sgn: "Positive" },
            },
          },
        ],
      };

      const result = calculateTokenFlow(zkappCommand, TEST_ADDRESS);

      expect(result.flows.length).to.be.greaterThan(0);
      const minaFlow = result.flows.find((f) => f.isMainToken);
      expect(minaFlow).to.not.be.undefined;
      expect(minaFlow.send.raw).to.equal("1000000000");
      expect(minaFlow.receive.raw).to.equal("0");
    });

    it("should calculate MINA inflow correctly", () => {
      const zkappCommand = {
        feePayer: {
          body: {
            publicKey: OTHER_ADDRESS,
            fee: "10000000",
            nonce: "0",
          },
        },
        accountUpdates: [
          {
            body: {
              publicKey: TEST_ADDRESS,
              tokenId: ZK_DEFAULT_TOKEN_ID,
              update: {},
              balanceChange: { magnitude: "5000000000", sgn: "Positive" },
            },
          },
        ],
      };

      const result = calculateTokenFlow(zkappCommand, TEST_ADDRESS);

      const minaFlow = result.flows.find((f) => f.isMainToken);
      expect(minaFlow).to.not.be.undefined;
      expect(minaFlow.receive.raw).to.equal("5000000000");
    });

    it("should include fee in calculation when current account is fee payer", () => {
      const zkappCommand = {
        feePayer: {
          body: {
            publicKey: TEST_ADDRESS,
            fee: "10000000",
            nonce: "0",
          },
        },
        accountUpdates: [],
      };

      const result = calculateTokenFlow(zkappCommand, TEST_ADDRESS);

      const minaFlow = result.flows.find((f) => f.isMainToken);
      expect(minaFlow).to.not.be.undefined;
      expect(minaFlow.fee.raw).to.equal("10000000");
    });

    it("should handle custom token flows", () => {
      const CUSTOM_TOKEN_ID = "customTokenId123456";
      const zkappCommand = {
        feePayer: {
          body: {
            publicKey: TEST_ADDRESS,
            fee: "10000000",
            nonce: "0",
          },
        },
        accountUpdates: [
          {
            body: {
              publicKey: TEST_ADDRESS,
              tokenId: CUSTOM_TOKEN_ID,
              update: {
                tokenSymbol: "CUSTOM",
              },
              balanceChange: { magnitude: "500000000", sgn: "Negative" },
            },
          },
        ],
      };

      const result = calculateTokenFlow(zkappCommand, TEST_ADDRESS);

      const customFlow = result.flows.find((f) => !f.isMainToken);
      expect(customFlow).to.not.be.undefined;
      expect(customFlow.send.raw).to.equal("500000000");
    });

    it("should handle string input", () => {
      const zkappCommand = JSON.stringify({
        feePayer: {
          body: {
            publicKey: TEST_ADDRESS,
            fee: "10000000",
            nonce: "0",
          },
        },
        accountUpdates: [],
      });

      const result = calculateTokenFlow(zkappCommand, TEST_ADDRESS);

      expect(result.flows).to.be.an("array");
    });
  });

  describe("analyzeTransaction", () => {
    it("should return combined risk and token flow analysis", () => {
      const zkappCommand = {
        feePayer: {
          body: {
            publicKey: TEST_ADDRESS,
            fee: "10000000",
            nonce: "0",
          },
        },
        accountUpdates: [
          {
            body: {
              publicKey: TEST_ADDRESS,
              tokenId: ZK_DEFAULT_TOKEN_ID,
              update: {
                verificationKey: {
                  data: "someData",
                  hash: "someHash",
                },
              },
              balanceChange: { magnitude: "1000000000", sgn: "Negative" },
            },
          },
        ],
      };

      const result = analyzeTransaction(zkappCommand, TEST_ADDRESS);

      expect(result.risks).to.not.be.undefined;
      expect(result.tokenFlow).to.not.be.undefined;
      expect(result.hasRisks).to.be.true;
      expect(result.hasHighRisks).to.be.true;
    });

    it("should handle invalid input gracefully", () => {
      const result = analyzeTransaction("invalid json", TEST_ADDRESS);

      expect(result.risks.risks).to.be.an("array");
      expect(result.tokenFlow.flows).to.be.an("array");
    });
  });

  describe("Real contract test cases (from JSON files)", () => {
    it("should detect medium risk for permissions change on current account", () => {
      const { zkappCommand, currentAddress } = permissionsChangeData;
      const result = analyzeTransactionRisks(zkappCommand, currentAddress);

      expect(result.summary.totalRisks).to.be.greaterThan(0);
      expect(result.summary.mediumRiskCount).to.be.greaterThan(0);
      expect(result.risks[0].type).to.equal(RISK_TYPES.PERMISSIONS_CHANGE);
      expect(result.risks[0].level).to.equal(RISK_LEVEL.MEDIUM);
    });

    it("should detect high risk for send Impossible permission", () => {
      const { zkappCommand, currentAddress } = sendImpossibleData;
      const result = analyzeTransactionRisks(zkappCommand, currentAddress);

      expect(result.summary.totalRisks).to.be.greaterThan(0);
      expect(result.summary.highRiskCount).to.be.greaterThan(0);
      expect(result.risks[0].type).to.equal(RISK_TYPES.PERMISSIONS_CHANGE);
      expect(result.risks[0].level).to.equal(RISK_LEVEL.HIGH);
      expect(result.risks[0].details.dangerousPermissions.length).to.be.greaterThan(0);
    });

    it("should detect no risks for token transfer (fee payer only)", () => {
      const { zkappCommand, currentAddress } = tokenTransferData;
      const result = analyzeTransactionRisks(zkappCommand, currentAddress);

      // No risks since current account only pays fee, no dangerous permissions
      expect(result.summary.totalRisks).to.equal(0);
    });

    it("should detect high risk for converting current account to zkApp", () => {
      const { zkappCommand, currentAddress } = convertToZkAppData;
      const result = analyzeTransactionRisks(zkappCommand, currentAddress);

      expect(result.summary.totalRisks).to.be.greaterThan(0);
      expect(result.summary.highRiskCount).to.be.greaterThan(0);
      expect(result.risks[0].type).to.equal(RISK_TYPES.CONVERT_TO_ZKAPP);
      expect(result.risks[0].level).to.equal(RISK_LEVEL.HIGH);
    });

    it("should show token flow for token transfer", () => {
      const { zkappCommand, currentAddress } = tokenTransferData;
      const result = calculateTokenFlow(zkappCommand, currentAddress);

      expect(result.flows.length).to.be.greaterThan(0);
      expect(result.flows[0].hasOtherAccountsFlow).to.be.true;
    });

    it("should detect medium risk for delegate change on current account", () => {
      const { zkappCommand, currentAddress } = delegateChangeData;
      const result = analyzeTransactionRisks(zkappCommand, currentAddress);

      expect(result.summary.totalRisks).to.be.greaterThan(0);
      expect(result.summary.mediumRiskCount).to.be.greaterThan(0);
      expect(result.risks[0].type).to.equal(RISK_TYPES.DELEGATE_CHANGE);
      expect(result.risks[0].level).to.equal(RISK_LEVEL.MEDIUM);
      expect(result.risks[0].details.newDelegate).to.not.be.undefined;
    });

    it("should detect high risk for timing/vesting change on current account", () => {
      const { zkappCommand, currentAddress } = timingChangeData;
      const result = analyzeTransactionRisks(zkappCommand, currentAddress);

      expect(result.summary.totalRisks).to.be.greaterThan(0);
      expect(result.summary.highRiskCount).to.be.greaterThan(0);
      expect(result.risks[0].type).to.equal(RISK_TYPES.TIMING_CHANGE);
      expect(result.risks[0].level).to.equal(RISK_LEVEL.HIGH);
    });

    it("should detect delegate change with flaggedOption format { isSome: true, value: ... }", () => {
      const zkappCommand = {
        feePayer: {
          body: { publicKey: TEST_ADDRESS, fee: "10000000", nonce: "0" },
          authorization: "sig",
        },
        accountUpdates: [
          {
            body: {
              publicKey: TEST_ADDRESS,
              tokenId: ZK_DEFAULT_TOKEN_ID,
              update: {
                delegate: {
                  isSome: true,
                  value: "B62qk3FF1FxfFxfJ4CLSgu2YehPdRqcNZw7Jw3z1JMyH28cSNR6XYDW",
                },
              },
              balanceChange: { magnitude: "0", sgn: "Positive" },
            },
            authorization: {},
          },
        ],
      };

      const result = analyzeTransactionRisks(zkappCommand, TEST_ADDRESS);

      expect(result.summary.totalRisks).to.equal(1);
      expect(result.risks[0].type).to.equal(RISK_TYPES.DELEGATE_CHANGE);
      expect(result.risks[0].level).to.equal(RISK_LEVEL.MEDIUM);
    });

    it("should NOT detect delegate change with flaggedOption format { isSome: false }", () => {
      const zkappCommand = {
        feePayer: {
          body: { publicKey: TEST_ADDRESS, fee: "10000000", nonce: "0" },
          authorization: "sig",
        },
        accountUpdates: [
          {
            body: {
              publicKey: TEST_ADDRESS,
              tokenId: ZK_DEFAULT_TOKEN_ID,
              update: {
                delegate: { isSome: false },
              },
              balanceChange: { magnitude: "0", sgn: "Positive" },
            },
            authorization: {},
          },
        ],
      };

      const result = analyzeTransactionRisks(zkappCommand, TEST_ADDRESS);

      expect(result.summary.totalRisks).to.equal(0);
    });

    it("should NOT detect medium risk for contract permissions change on other account", () => {
      const { zkappCommand, currentAddress } = contractPermissionsData;
      const result = analyzeTransactionRisks(zkappCommand, currentAddress);

      // Medium risk permissions changes are only shown for current account
      // Contract account permissions changes (non-current) should not show as medium risk
      expect(result.summary.totalRisks).to.equal(0);
      expect(result.summary.mediumRiskCount).to.equal(0);
    });

    it("should detect high risk for receive Impossible permission", () => {
      const { zkappCommand, currentAddress } = receiveImpossibleData;
      const result = analyzeTransactionRisks(zkappCommand, currentAddress);

      expect(result.summary.totalRisks).to.be.greaterThan(0);
      expect(result.summary.highRiskCount).to.be.greaterThan(0);
      expect(result.risks[0].type).to.equal(RISK_TYPES.PERMISSIONS_CHANGE);
      expect(result.risks[0].level).to.equal(RISK_LEVEL.HIGH);
      const hasReceiveImpossible = result.risks[0].details.dangerousPermissions.some(
        (p) => p.permission === "receive"
      );
      expect(hasReceiveImpossible).to.be.true;
    });

    it("should detect high risk for access Impossible permission", () => {
      const { zkappCommand, currentAddress } = accessImpossibleData;
      const result = analyzeTransactionRisks(zkappCommand, currentAddress);

      expect(result.summary.totalRisks).to.be.greaterThan(0);
      expect(result.summary.highRiskCount).to.be.greaterThan(0);
      expect(result.risks[0].type).to.equal(RISK_TYPES.PERMISSIONS_CHANGE);
      expect(result.risks[0].level).to.equal(RISK_LEVEL.HIGH);
      const hasAccessImpossible = result.risks[0].details.dangerousPermissions.some(
        (p) => p.permission === "access"
      );
      expect(hasAccessImpossible).to.be.true;
    });

    it("should detect high risk for permissions locked (setPermissions Impossible)", () => {
      const { zkappCommand, currentAddress } = permissionsLockedData;
      const result = analyzeTransactionRisks(zkappCommand, currentAddress);

      expect(result.summary.totalRisks).to.be.greaterThan(0);
      expect(result.summary.highRiskCount).to.be.greaterThan(0);
      expect(result.risks[0].type).to.equal(RISK_TYPES.PERMISSIONS_CHANGE);
      expect(result.risks[0].level).to.equal(RISK_LEVEL.HIGH);
      const hasSetPermissionsImpossible = result.risks[0].details.dangerousPermissions.some(
        (p) => p.permission === "setPermissions"
      );
      expect(hasSetPermissionsImpossible).to.be.true;
    });

    it("should detect high risk for multiple Impossible permissions", () => {
      const { zkappCommand, currentAddress } = multipleImpossibleData;
      const result = analyzeTransactionRisks(zkappCommand, currentAddress);

      expect(result.summary.totalRisks).to.be.greaterThan(0);
      expect(result.summary.highRiskCount).to.be.greaterThan(0);
      expect(result.risks[0].type).to.equal(RISK_TYPES.PERMISSIONS_CHANGE);
      expect(result.risks[0].level).to.equal(RISK_LEVEL.HIGH);
      // Should have both send and receive Impossible
      expect(result.risks[0].details.dangerousPermissions.length).to.be.greaterThan(1);
    });

    it("should detect no risk for safe state update", () => {
      const { zkappCommand, currentAddress } = safeStateUpdateData;
      const result = analyzeTransactionRisks(zkappCommand, currentAddress);

      // No risks since only appState is updated on other account
      expect(result.summary.totalRisks).to.equal(0);
    });
  });

  describe("getRiskSpecificDetails", () => {
    it("should extract dangerous permissions details", () => {
      const risk = {
        type: RISK_TYPES.PERMISSIONS_CHANGE,
        level: RISK_LEVEL.HIGH,
        details: {
          permissions: {
            send: "Impossible",
            receive: "None",
          },
          dangerousPermissions: [
            { type: RISK_TYPES.SEND_IMPOSSIBLE, permission: "send" },
          ],
        },
      };

      const details = getRiskSpecificDetails(risk);

      expect(details.affectedPermissions).to.include("send");
      expect(details.changedPermissions.length).to.be.greaterThan(0);
    });

    it("should extract changed permissions for medium risk", () => {
      const risk = {
        type: RISK_TYPES.PERMISSIONS_CHANGE,
        level: RISK_LEVEL.MEDIUM,
        details: {
          permissions: {
            editState: "Signature",
            send: "Signature",
          },
        },
      };

      const details = getRiskSpecificDetails(risk);

      expect(details.affectedPermissions.length).to.equal(0);
      expect(details.changedPermissions.length).to.equal(2);
    });

    it("should extract delegate change details", () => {
      const risk = {
        type: RISK_TYPES.DELEGATE_CHANGE,
        level: RISK_LEVEL.MEDIUM,
        details: {
          newDelegate: "B62qk3FF1FxfFxfJ4CLSgu2YehPdRqcNZw7Jw3z1JMyH28cSNR6XYDW",
        },
      };

      const details = getRiskSpecificDetails(risk);

      expect(details.newDelegate).to.equal(
        "B62qk3FF1FxfFxfJ4CLSgu2YehPdRqcNZw7Jw3z1JMyH28cSNR6XYDW"
      );
    });
  });
});
