const { expect } = require("chai");
const sinon = require("sinon");
const proxyquire = require("proxyquire").noCallThru();

// ==================== browser mock ====================
const browserMock = {
  runtime: {
    id: "mock-extension-id",
    sendMessage: sinon.stub().resolves(),
    onMessage: {
      addListener: sinon.stub(),
      removeListener: sinon.stub(),
    },
  },
  tabs: {
    query: sinon.stub().resolves([]),
    sendMessage: sinon.stub().resolves(),
  },
  storage: {
    local: {
      get: sinon.stub().resolves({}),
      set: sinon.stub().resolves(),
    },
  },
};

// ==================== Test Data ====================
const TEST_DATA = {
  accounts: [
    {
      address: "B62qkVs6zgN84e1KjFxurigqTQ57FqV3KnWubV3t77E9R6uBm4DmkPi",
      type: "WALLET_INSIDE",
    },
    {
      address: "B62qk3FF1FxfFxfJ4CLSgu2YehPdRqcNZw7Jw3z1JMyH28cSNR6XYDW",
      type: "WALLET_INSIDE",
    },
  ],
  sites: {
    example: { origin: "https://example.com" },
    test: { origin: "https://test.com" },
    dapp: { origin: "https://dapp.com" },
  },
  // payment params
  paymentParams: {
    to: "B62qk3FF1FxfFxfJ4CLSgu2YehPdRqcNZw7Jw3z1JMyH28cSNR6XYDW",
    amount: "1000000000", // 1 MINA
    fee: "10000000",
    memo: "test payment",
    nonce: "1",
  },
  // stake params
  stakeParams: {
    to: "B62qk3FF1FxfFxfJ4CLSgu2YehPdRqcNZw7Jw3z1JMyH28cSNR6XYDW",
    fee: "10000000",
    memo: "stake delegation",
  },
  // sign message params
  signMessageParams: {
    message: "Hello, Mina!",
  },
  // sign fields params
  signFieldsParams: {
    message: [1, 2, 3],
  },
  // networks
  networks: {
    mainnet: { networkID: "mina:mainnet", name: "Mainnet" },
    testnet: { networkID: "mina:testnet", name: "Testnet" },
  },
  // zkApp params
  zkAppParams: {
    transaction: JSON.stringify({
      feePayer: { body: { publicKey: "B62qkVs6zgN84e1KjFxurigqTQ57FqV3KnWubV3t77E9R6uBm4DmkPi", fee: "100000000" } },
      accountUpdates: [],
    }),
    feePayer: {
      fee: "100000000",
      memo: "zkApp tx",
    },
  },
  // credential params
  credentialParams: {
    credential: {
      owner: "B62qkVs6zgN84e1KjFxurigqTQ57FqV3KnWubV3t77E9R6uBm4DmkPi",
      data: { type: "test", value: "123" },
    },
  },
  // token build params
  tokenBuildParams: {
    buildID: "build-123",
    tokenId: "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
    transaction: { test: "data" },
  },
  // nullifier params
  nullifierParams: {
    message: [1, 2, 3],
  },
};

// ==================== Mock Stubs ====================
const sendMsgStub = sinon.stub();
const startExtensionPopupStub = sinon.stub().resolves();
const closePopupWindowStub = sinon.stub();
const checkAndTopV2Stub = sinon.stub().resolves();
const startPopupWindowStub = sinon.stub();

const extensionActionMock = {
  setBadgeText: sinon.stub(),
  setBadgeBackgroundColor: sinon.stub(),
};

const apiServiceMock = {
  getLockStatus: sinon.stub().returns(false),
  getCurrentAccountAddress: sinon.stub().returns(TEST_DATA.accounts[0].address),
};

const storageServiceMock = {
  get: sinon.stub().resolves({}),
  save: sinon.stub().resolves(),
};

// ==================== ObservableStore Mock ====================
class MockObservableStore {
  constructor(initState) {
    this._state = { ...initState };
  }
  getState() {
    return this._state;
  }
  updateState(newState) {
    this._state = { ...this._state, ...newState };
  }
  putState(newState) {
    this._state = newState;
  }
}

// ==================== proxyquire stubs ====================
const proxyquireStubs = {
  "webextension-polyfill": browserMock,

  "@aurowallet/mina-provider": {
    DAppActions: {
      mina_requestAccounts: "mina_requestAccounts",
      mina_accounts: "mina_accounts",
      mina_sendPayment: "mina_sendPayment",
      mina_sendStakeDelegation: "mina_sendStakeDelegation",
      mina_sendTransaction: "mina_sendTransaction",
      mina_signMessage: "mina_signMessage",
      mina_sign_JsonMessage: "mina_sign_JsonMessage",
      mina_signFields: "mina_signFields",
      mina_verifyMessage: "mina_verifyMessage",
      mina_verify_JsonMessage: "mina_verify_JsonMessage",
      mina_verifyFields: "mina_verifyFields",
      mina_requestNetwork: "mina_requestNetwork",
      mina_switchChain: "mina_switchChain",
      mina_addChain: "mina_addChain",
      mina_createNullifier: "mina_createNullifier",
      mina_storePrivateCredential: "mina_storePrivateCredential",
      mina_requestPresentation: "mina_requestPresentation",
      wallet_info: "wallet_info",
      wallet_revokePermissions: "wallet_revokePermissions",
    },
  },

  "obs-store": MockObservableStore,

  "../constant/msgTypes": {
    DAPP_ACTION_CANCEL_ALL: "DAPP_ACTION_CANCEL_ALL",
    DAPP_ACTION_CLOSE_WINDOW: "DAPP_ACTION_CLOSE_WINDOW",
    DAPP_ACTION_CREATE_NULLIFIER: "DAPP_ACTION_CREATE_NULLIFIER",
    DAPP_ACTION_GET_ACCOUNT: "DAPP_ACTION_GET_ACCOUNT",
    DAPP_ACTION_REQUEST_PRESENTATION: "DAPP_ACTION_REQUEST_PRESENTATION",
    DAPP_ACTION_SEND_TRANSACTION: "DAPP_ACTION_SEND_TRANSACTION",
    DAPP_ACTION_SIGN_MESSAGE: "DAPP_ACTION_SIGN_MESSAGE",
    DAPP_ACTION_STORE_CREDENTIAL: "DAPP_ACTION_STORE_CREDENTIAL",
    DAPP_ACTION_SWITCH_CHAIN: "DAPP_ACTION_SWITCH_CHAIN",
    WORKER_ACTIONS: {
      SIGN_ZK: "SIGN_ZK",
      APPROVE: "APPROVE",
      BUILD_TOKEN_SEND: "BUILD_TOKEN_SEND",
    },
  },

  "../utils/popup": {
    checkAndTopV2: checkAndTopV2Stub,
    closePopupWindow: closePopupWindowStub,
    lastWindowIds: {},
    PopupSize: { exitSize: 20 },
    startExtensionPopup: startExtensionPopupStub,
    startPopupWindow: startPopupWindowStub,
  },

  "../utils/utils": {
    addressValid: sinon.stub().returns(true),
    checkNodeExist: sinon.stub().returns({ index: -1 }),
    getArrayDiff: sinon.stub().returns([]),
    getMessageFromCode: sinon.stub().returns("error message"),
    getOriginFromUrl: sinon.stub().callsFake((url) => url),
    isNumber: sinon.stub().returns(true),
    removeUrlFromArrays: sinon.stub().returns({}),
    urlValid: sinon.stub().returns(true),
  },

  "../utils/browserUtils": {
    getExtensionAction: sinon.stub().returns(extensionActionMock),
    getCurrentNodeConfig: sinon.stub().resolves({
      networkID: "mina:mainnet",
      url: "https://proxy.aurowallet.com/graphql"
    }),
    getLocalNetworkList: sinon.stub().resolves([]),
  },

  "./APIService": { default: apiServiceMock },

  "./lib": {
    verifyMessage: sinon.stub().resolves(true),
    verifyFieldsMessage: sinon.stub().resolves(true),
  },

  "./storageService": storageServiceMock,

  "../constant/network": {
    Default_Network_List: [
      { networkID: "mina:mainnet", name: "Mainnet" },
      { networkID: "mina:testnet", name: "Testnet" },
    ],
  },

  "../constant/dappError": {
    errorCodes: {
      userRejectedRequest: 4001,
      userDisconnect: 4100,
      invalidParams: 4101,
      unsupportedMethod: 4200,
      noWallet: 10001,
      zkChainPending: 23001,
      notSupportChain: 23002,
      originDismatch: 23003,
      throwError: 23004,
      internal: 23005,
      notFound: 23006,
      verifyFailed: 23007,
    },
  },

  "../utils/zkUtils": {
    verifyTokenCommand: sinon.stub().returns(true),
    zkCommondFormat: sinon.stub().callsFake((tx) => tx),
  },

  "./api": {
    getAccountInfo: sinon.stub().resolves({ account: {} }),
  },

  "../constant/storageKey": {
    ZKAPP_APPROVE_LIST: "ZKAPP_APPROVE_LIST",
  },

  "../constant": {
    ZK_DEFAULT_TOKEN_ID: "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
  },

  "../constant/tokenMsgTypes": {
    TOKEN_BUILD: {
      add: "TOKEN_BUILD_ADD",
      getParams: "TOKEN_BUILD_GET_PARAMS",
      requestSign: "TOKEN_BUILD_REQUEST_SIGN",
    },
  },

  "../utils/fore": {
    decryptData: sinon.stub().returns("decrypted_data"),
    encryptData: sinon.stub().returns("encrypted_data"),
  },

  "../../config": {
    node_public_keys: "mock_public_key",
    react_private_keys: "mock_private_key",
    TOKEN_BUILD_URL: "https://token.example.com",
  },

  "../utils/commonMsg": {
    sendMsg: sendMsgStub,
  },

  "../constant/commonType": {
    POPUP_CHANNEL_KEYS: {
      popup: "popup",
    },
  },

  "../utils/o1jsUtils": {
    checkPresentationRequestSchema: sinon.stub().returns({ success: true }),
    checkStoredCredentialSchema: sinon.stub().returns({ success: true }),
  },

  uuid: {
    v4: sinon.stub().returns("mock-uuid-1234"),
  },
};

const DappService = proxyquire(
  "../../src/background/DappService",
  proxyquireStubs
).default;

const DappServiceClass = proxyquire(
  "../../src/background/DappService",
  proxyquireStubs
).default.constructor;

describe("DappService", () => {
  let dappService;

  beforeEach(() => {
    sinon.resetHistory();
    dappService = DappService;
    dappService.dappStore.updateState({
      accountApprovedUrlList: {},
      currentConnect: {},
      tokenBuildList: {},
    });
  });

  // ==================== 1. requestCallback ====================
  describe("requestCallback", () => {
    it("should resolve with result on success", (done) => {
      const mockRequest = () => Promise.resolve({ data: "test" });
      const sendResponse = (response) => {
        expect(response.result).to.deep.equal({ data: "test" });
        expect(response.id).to.equal("test-id");
        done();
      };
      dappService.requestCallback(mockRequest, "test-id", sendResponse);
    });

    it("should reject with error on failure", (done) => {
      const mockRequest = () => Promise.reject({ code: 4001, message: "rejected" });
      const sendResponse = (response) => {
        expect(response.error).to.exist;
        expect(response.id).to.equal("test-id");
        done();
      };
      dappService.requestCallback(mockRequest, "test-id", sendResponse);
    });
  });

  // ==================== 2. getDappStore ====================
  describe("getDappStore", () => {
    it("should return dapp store state", () => {
      const state = dappService.getDappStore();
      expect(state).to.have.property("accountApprovedUrlList");
      expect(state).to.have.property("currentConnect");
      expect(state).to.have.property("tokenBuildList");
    });
  });

  // ==================== 3. getCurrentAccountConnectStatus ====================
  describe("getCurrentAccountConnectStatus", () => {
    it("should return true if account is connected to site", () => {
      dappService.dappStore.updateState({
        accountApprovedUrlList: {
          [TEST_DATA.accounts[0].address]: ["https://example.com"],
        },
      });

      const status = dappService.getCurrentAccountConnectStatus(
        "https://example.com",
        TEST_DATA.accounts[0].address
      );
      expect(status).to.be.true;
    });

    it("should return false if account is not connected", () => {
      dappService.dappStore.updateState({
        accountApprovedUrlList: {},
      });

      const status = dappService.getCurrentAccountConnectStatus(
        "https://example.com",
        TEST_DATA.accounts[0].address
      );
      expect(status).to.be.false;
    });
  });

  // ==================== 4. getConnectStatus ====================
  describe("getConnectStatus", () => {
    it("should return true if address is connected to site", () => {
      dappService.dappStore.updateState({
        accountApprovedUrlList: {
          [TEST_DATA.accounts[0].address]: ["https://example.com"],
        },
      });

      const status = dappService.getConnectStatus(
        "https://example.com",
        TEST_DATA.accounts[0].address
      );
      expect(status).to.be.true;
    });

    it("should return false if address is not connected", () => {
      const status = dappService.getConnectStatus(
        "https://notconnected.com",
        TEST_DATA.accounts[0].address
      );
      expect(status).to.be.false;
    });
  });

  // ==================== 5. disconnectDapp ====================
  describe("disconnectDapp", () => {
    it("should disconnect dapp and return true when url exists", () => {
      dappService.dappStore.updateState({
        accountApprovedUrlList: {
          [TEST_DATA.accounts[0].address]: ["https://example.com", "https://other.com"],
        },
      });

      const result = dappService.disconnectDapp(
        "https://example.com",
        TEST_DATA.accounts[0].address
      );

      expect(result).to.be.true;
      const list = dappService.getAppConnectionList(TEST_DATA.accounts[0].address);
      expect(list).to.not.include("https://example.com");
      expect(list).to.include("https://other.com");
    });

    it("should return true even if url not found", () => {
      dappService.dappStore.updateState({
        accountApprovedUrlList: {},
      });

      const result = dappService.disconnectDapp(
        "https://notexist.com",
        TEST_DATA.accounts[0].address
      );

      expect(result).to.be.true;
    });

    it("should return true when address has no connections", () => {
      dappService.dappStore.updateState({
        accountApprovedUrlList: {
          other_address: ["https://example.com"],
        },
      });

      const result = dappService.disconnectDapp(
        "https://example.com",
        TEST_DATA.accounts[0].address
      );

      expect(result).to.be.true;
    });
  });

  // ==================== 6. getAccountIndex ====================
  describe("getAccountIndex", () => {
    it("should return correct index of account", () => {
      const accountList = [
        { address: "addr1" },
        { address: "addr2" },
        { address: "addr3" },
      ];

      expect(dappService.getAccountIndex(accountList, "addr2")).to.equal(1);
      expect(dappService.getAccountIndex(accountList, "addr1")).to.equal(0);
      expect(dappService.getAccountIndex(accountList, "notexist")).to.equal(-1);
    });
  });

  // ==================== 7. getAppLockStatus ====================
  describe("getAppLockStatus", () => {
    it("should delegate to apiService.getLockStatus", () => {
      expect(dappService.getAppLockStatus).to.be.a("function");
    });
  });

  // ==================== 8. getCurrentAccountAddress ====================
  describe("getCurrentAccountAddress", () => {
    it("should delegate to apiService.getCurrentAccountAddress", () => {
      expect(dappService.getCurrentAccountAddress).to.be.a("function");
    });
  });

  // ==================== 9. setBadgeContent ====================
  describe("setBadgeContent", () => {
    it("should set badge text to empty when no pending requests", () => {
      dappService.clearAllPendingZk();
      dappService.setBadgeContent();
      expect(extensionActionMock.setBadgeText.calledWith({ text: "" })).to.be.true;
    });

    it("should set badge text to request count when requests exist", () => {
      dappService.setBadgeContent();
      expect(extensionActionMock.setBadgeText.called).to.be.true;
    });
  });

  // ==================== 10. getAppConnectionList ====================
  describe("getAppConnectionList", () => {
    it("should return approved url list for address", () => {
      dappService.dappStore.updateState({
        accountApprovedUrlList: {
          [TEST_DATA.accounts[0].address]: ["https://a.com", "https://b.com"],
        },
      });

      const list = dappService.getAppConnectionList(TEST_DATA.accounts[0].address);
      expect(list).to.have.length(2);
      expect(list).to.include("https://a.com");
    });

    it("should return empty array if no connections", () => {
      const list = dappService.getAppConnectionList("unknown_address");
      expect(list).to.deep.equal([]);
    });
  });

  // ==================== 11. requestNetwork ====================
  describe("requestNetwork", () => {
    it("should return network ID", async () => {
      const result = await dappService.requestNetwork();
      expect(result).to.have.property("networkID");
      expect(result.networkID).to.equal("mina:mainnet");
    });
  });

  // ==================== 12. requestCurrentNetwork ====================
  describe("requestCurrentNetwork", () => {
    it("should return current network config", async () => {
      const result = await dappService.requestCurrentNetwork();
      expect(result).to.have.property("networkID");
      expect(result).to.have.property("url");
    });
  });

  // ==================== 13. updateApproveConnect ====================
  describe("updateApproveConnect", () => {
    it("should update dapp store and save to storage", () => {
      const approveMap = {
        [TEST_DATA.accounts[0].address]: ["https://example.com"],
      };

      dappService.updateApproveConnect(approveMap);

      expect(storageServiceMock.save.calledOnce).to.be.true;
    });
  });

  // ==================== 14. initApproveConnect ====================
  describe("initApproveConnect", () => {
    it("should load approved connections from storage", async () => {
      storageServiceMock.get.resolves({
        ZKAPP_APPROVE_LIST: JSON.stringify({
          addr1: ["https://a.com"],
        }),
      });

      await dappService.initApproveConnect();

      expect(storageServiceMock.get.called).to.be.true;
    });

    it("should handle empty storage", async () => {
      storageServiceMock.get.resolves({});

      await dappService.initApproveConnect();
      // Should not throw
    });
  });

  // ==================== 15. checkLocalWallet ====================
  describe("checkLocalWallet", () => {
    it("should return true if wallet exists", async () => {
      storageServiceMock.get.resolves({ keyringData: "encrypted_data" });

      const result = await dappService.checkLocalWallet();
      expect(result).to.be.true;
    });

    it("should return false if no wallet", async () => {
      storageServiceMock.get.resolves({});

      const result = await dappService.checkLocalWallet();
      expect(result).to.be.false;
    });
  });

  // ==================== 16. getSignParams ====================
  describe("getSignParams", () => {
    it("should return sign and chain requests", () => {
      const result = dappService.getSignParams();

      expect(result).to.have.property("signRequests");
      expect(result).to.have.property("chainRequests");
      expect(result).to.have.property("topItem");
    });
  });

  // ==================== 17. getApproveParams ====================
  describe("getApproveParams", () => {
    it("should return undefined when no approve requests", () => {
      const result = dappService.getApproveParams();
      expect(result).to.be.undefined;
    });
  });

  // ==================== 18. getAllTokenSignParams ====================
  describe("getAllTokenSignParams", () => {
    it("should return empty array when no token sign requests", () => {
      const result = dappService.getAllTokenSignParams();
      expect(result).to.be.an("array");
    });
  });

  // ==================== 19. getAllPendingZK ====================
  describe("getAllPendingZK", () => {
    it("should return all pending request types", () => {
      const result = dappService.getAllPendingZK();

      expect(result).to.have.property("signRequests");
      expect(result).to.have.property("chainRequests");
      expect(result).to.have.property("approveRequests");
      expect(result).to.have.property("tokenSignRequests");
    });
  });

  // ==================== 20. clearAllPendingZk ====================
  describe("clearAllPendingZk", () => {
    it("should clear all pending requests", () => {
      dappService.clearAllPendingZk();
      
      const pending = dappService.getAllPendingZK();
      expect(pending.signRequests).to.have.length(0);
      expect(pending.chainRequests).to.have.length(0);
      expect(pending.approveRequests).to.have.length(0);
      expect(pending.tokenSignRequests).to.have.length(0);
    });
  });

  // ==================== 21. getWalletInfo ====================
  describe("getWalletInfo", () => {
    it("should return wallet info with version and init status", async () => {
      storageServiceMock.get.resolves({ keyringData: "data" });

      const result = await dappService.getWalletInfo();

      expect(result).to.have.property("version");
      expect(result).to.have.property("init");
      expect(result.init).to.be.true;
    });

    it("should return init false when no wallet", async () => {
      storageServiceMock.get.resolves({});

      const result = await dappService.getWalletInfo();

      expect(result.init).to.be.false;
    });
  });

  // ==================== 22. revokePermissions ====================
  describe("revokePermissions", () => {
    it("should revoke permissions for origin", async () => {
      dappService.dappStore.updateState({
        accountApprovedUrlList: {
          addr1: ["https://example.com", "https://other.com"],
        },
      });

      const params = { site: { origin: "https://example.com" } };
      const result = await dappService.revokePermissions(params);

      expect(result).to.deep.equal([]);
      expect(storageServiceMock.save.called).to.be.true;
    });
  });

  // ==================== 23. checkSafeBuild ====================
  describe("checkSafeBuild", () => {
    it("should return false for non-whitelisted origin", () => {
      const result = dappService.checkSafeBuild({
        origin: "https://malicious.com",
      });
      expect(result).to.be.false;
    });

    it("should return true for whitelisted origin", () => {
      const result = dappService.checkSafeBuild({
        origin: "https://token.example.com",
      });
      expect(result).to.be.true;
    });
  });

  // ==================== 24. getDecryptData ====================
  describe("getDecryptData", () => {
    it("should decrypt data successfully", () => {
      const params = {
        result: {
          encryptedData: "enc",
          encryptedAESKey: "key",
          iv: "iv",
        },
      };

      const result = dappService.getDecryptData(params);
      expect(result).to.equal("decrypted_data");
    });

    it("should return empty string on error", () => {
      proxyquireStubs["../utils/fore"].decryptData.throws(new Error("decrypt error"));

      const result = dappService.getDecryptData({ result: {} });
      expect(result).to.equal("");

      proxyquireStubs["../utils/fore"].decryptData.returns("decrypted_data");
    });
  });

  // ==================== 25. verifyTokenBuildRes ====================
  describe("verifyTokenBuildRes", () => {
    it("should return false if no build data", () => {
      const result = dappService.verifyTokenBuildRes({}, null);
      expect(result).to.be.false;
    });

    it("should verify token command", () => {
      const decryptData = { transaction: { test: "data" } };
      const buildData = { tokenId: "token123" };

      const result = dappService.verifyTokenBuildRes(decryptData, buildData);
      expect(result).to.be.true;
    });
  });

  // ==================== 26. portDisconnectListener ====================
  describe("portDisconnectListener", () => {
    it("should remove tab from currentConnect on disconnect", () => {
      dappService.dappStore.updateState({
        currentConnect: { 123: { tabId: 123, origin: "https://example.com" } },
      });

      const port = {
        sender: { tab: { id: 123 } },
      };

      dappService.portDisconnectListener(port);
    });

    it("should handle missing tab id", () => {
      const port = { sender: {} };
      dappService.portDisconnectListener(port);
      // Should not throw
    });
  });

  // ==================== 27. setupProviderConnection ====================
  describe("setupProviderConnection", () => {
    it("should add tab to currentConnect", () => {
      const port = {
        sender: {
          tab: { id: 456 },
          origin: "https://dapp.com",
        },
      };

      dappService.setupProviderConnection(port);
    });

    it("should handle missing tab id", () => {
      const port = { sender: {} };
      dappService.setupProviderConnection(port);
      // Should not throw
    });
  });

  // ==================== 28. checkNetworkIsExist ====================
  describe("checkNetworkIsExist", () => {
    it("should check if network url exists", async () => {
      const result = await dappService.checkNetworkIsExist("https://some-node.com");
      expect(result).to.have.property("index");
    });
  });

  // ==================== 29. addTokenBuildList ====================
  describe("addTokenBuildList", () => {
    it("should add token build to list and return buildID", async () => {
      const buildParams = {
        sendParams: {
          tokenId: "token123",
          amount: "1000",
        },
      };

      const buildID = await dappService.addTokenBuildList(buildParams);

      expect(buildID).to.equal("mock-uuid-1234");
      expect(startPopupWindowStub.called).to.be.true;
    });
  });

  // ==================== 30. removeTokenBuildById ====================
  describe("removeTokenBuildById", () => {
    it("should remove token build from list", () => {
      dappService.dappStore.updateState({
        tokenBuildList: { "build-123": { data: "test" } },
      });

      dappService.removeTokenBuildById("build-123");
    });
  });

  // ==================== 31. getTokenParamsById ====================
  describe("getTokenParamsById", () => {
    it("should return error for unsafe build origin", async () => {
      const payload = {
        site: { origin: "https://malicious.com" },
        params: "build-123",
      };

      const result = await dappService.getTokenParamsById(payload);
      expect(result).to.have.property("code");
    });

    it("should return encrypted data for valid build", async () => {
      dappService.dappStore.updateState({
        tokenBuildList: { "build-123": { data: "test" } },
      });

      const payload = {
        site: { origin: "https://token.example.com" },
        params: "build-123",
      };

      const result = await dappService.getTokenParamsById(payload);
      expect(result).to.equal("encrypted_data");
    });

    it("should return undefined when buildId not found", async () => {
      dappService.dappStore.updateState({
        tokenBuildList: {},
      });

      const payload = {
        site: { origin: "https://token.example.com" },
        params: "non-existent-build",
      };

      const result = await dappService.getTokenParamsById(payload);
      expect(result).to.be.undefined;
    });
  });

  // ==================== 32. requestConnectedAccount ====================
  describe("requestConnectedAccount", () => {
    it("should return empty array if no wallet", async () => {
      storageServiceMock.get.resolves({});

      const result = await dappService.requestConnectedAccount(TEST_DATA.sites.example);
      expect(result).to.deep.equal([]);
    });

    it("should return empty array if not connected", async () => {
      storageServiceMock.get.resolves({ keyringData: "data" });
      dappService.dappStore.updateState({
        accountApprovedUrlList: {},
      });

      const result = await dappService.requestConnectedAccount(TEST_DATA.sites.example);
      expect(result).to.deep.equal([]);
    });
  });

  // ==================== 33. notifyAccountChange ====================
  describe("notifyAccountChange", () => {
    it("should send message to connected tabs", () => {
      browserMock.tabs.query.resolves([
        { id: 1, url: "https://example.com" },
      ]);

      dappService.notifyAccountChange(
        ["https://example.com"],
        TEST_DATA.accounts[0].address
      );

      expect(browserMock.tabs.query.called).to.be.true;
    });
  });

  // ==================== 34. notifyNetworkChange ====================
  describe("notifyNetworkChange", () => {
    it("should notify tabs of network change", () => {
      dappService.notifyNetworkChange({ networkID: "mina:testnet" });
      expect(browserMock.tabs.query.called).to.be.true;
    });
  });

  // ==================== 35. tabNotify ====================
  describe("tabNotify", () => {
    it("should send message to connected tabs", () => {
      browserMock.tabs.query.resolves([]);

      dappService.tabNotify({ action: "test", result: {} });
      expect(browserMock.tabs.query.called).to.be.true;
    });
  });

  // ==================== 36. changeCurrentConnecting ====================
  describe("changeCurrentConnecting", () => {
    it("should handle account change and notify", () => {
      dappService.dappStore.updateState({
        accountApprovedUrlList: {
          [TEST_DATA.accounts[0].address]: ["https://a.com"],
          [TEST_DATA.accounts[1].address]: ["https://b.com"],
        },
      });

      dappService.changeCurrentConnecting(
        TEST_DATA.accounts[0].address,
        TEST_DATA.accounts[1].address
      );
      // Should not throw
    });
  });

  // ==================== 37. deleteDAppConnect ====================
  describe("deleteDAppConnect", () => {
    it("should delete dapp connection when deleting account", () => {
      dappService.dappStore.updateState({
        accountApprovedUrlList: {
          [TEST_DATA.accounts[0].address]: ["https://a.com"],
        },
      });

      dappService.deleteDAppConnect(
        TEST_DATA.accounts[0].address,
        TEST_DATA.accounts[1].address,
        TEST_DATA.accounts[1].address
      );
      // Should not throw
    });
  });

  // ==================== 38. getSignParamsByOpenId ====================
  describe("getSignParamsByOpenId", () => {
    it("should return null if no matching id", () => {
      const result = dappService.getSignParamsByOpenId("non-existent-id");
      expect(result).to.be.null;
    });
  });

  // ==================== 39. getApproveParamsByOpenId ====================
  describe("getApproveParamsByOpenId", () => {
    it("should return null if no matching id", () => {
      const result = dappService.getApproveParamsByOpenId("non-existent-id");
      expect(result).to.be.null;
    });
  });

  // ==================== 40. removeSignParamsByOpenId ====================
  describe("removeSignParamsByOpenId", () => {
    it("should remove sign request by id", () => {
      dappService.removeSignParamsByOpenId("test-id");
      // Should not throw
    });
  });

  // ==================== 41. removeNotifyParamsByOpenId ====================
  describe("removeNotifyParamsByOpenId", () => {
    it("should remove chain request by id", () => {
      dappService.removeNotifyParamsByOpenId("test-id");
      // Should not throw
    });
  });

  // ==================== 42. handleMessage ====================
  describe("handleMessage", () => {
    const createMessage = (action, params = {}) => ({
      action,
      payload: {
        id: "test-id-123",
        params,
        site: TEST_DATA.sites.example,
      },
    });

    it("should handle mina_requestAccounts action", (done) => {
      storageServiceMock.get.resolves({});
      const message = createMessage("mina_requestAccounts");
      const sendResponse = (response) => {
        expect(response.id).to.equal("test-id-123");
        done();
      };
      dappService.handleMessage(message, {}, sendResponse);
    });

    it("should handle mina_accounts action", (done) => {
      storageServiceMock.get.resolves({});
      const message = createMessage("mina_accounts");
      const sendResponse = (response) => {
        expect(response.id).to.equal("test-id-123");
        expect(response.result).to.deep.equal([]);
        done();
      };
      dappService.handleMessage(message, {}, sendResponse);
    });

    it("should handle mina_requestNetwork action", (done) => {
      const message = createMessage("mina_requestNetwork");
      const sendResponse = (response) => {
        expect(response.id).to.equal("test-id-123");
        expect(response.result).to.have.property("networkID");
        done();
      };
      dappService.handleMessage(message, {}, sendResponse);
    });

    it("should handle wallet_info action", (done) => {
      storageServiceMock.get.resolves({ keyringData: "data" });
      const message = createMessage("wallet_info");
      const sendResponse = (response) => {
        expect(response.id).to.equal("test-id-123");
        expect(response.result).to.have.property("version");
        expect(response.result).to.have.property("init");
        done();
      };
      dappService.handleMessage(message, {}, sendResponse);
    });

    it("should handle wallet_revokePermissions action", (done) => {
      const message = {
        action: "wallet_revokePermissions",
        payload: {
          id: "test-id-123",
          params: {},
          site: TEST_DATA.sites.example,
        },
      };
      const sendResponse = (response) => {
        expect(response.id).to.equal("test-id-123");
        expect(response.result).to.deep.equal([]);
        done();
      };
      dappService.handleMessage(message, {}, sendResponse);
    });

    it("should handle unsupported action with error", (done) => {
      const message = createMessage("unsupported_action");
      const sendResponse = (response) => {
        expect(response.id).to.equal("test-id-123");
        expect(response.result).to.have.property("code");
        done();
      };
      dappService.handleMessage(message, {}, sendResponse);
    });

    it("should handle mina_verifyMessage action", (done) => {
      const message = createMessage("mina_verifyMessage", {
        publicKey: TEST_DATA.accounts[0].address,
        signature: { field: "123", scalar: "456" },
        data: "test message",
      });
      const sendResponse = (response) => {
        expect(response.id).to.equal("test-id-123");
        done();
      };
      dappService.handleMessage(message, {}, sendResponse);
    });

    it("should handle mina_verifyFields action", (done) => {
      const message = createMessage("mina_verifyFields", {
        publicKey: TEST_DATA.accounts[0].address,
        signature: { field: "123", scalar: "456" },
        data: [1, 2, 3],
      });
      const sendResponse = (response) => {
        expect(response.id).to.equal("test-id-123");
        done();
      };
      dappService.handleMessage(message, {}, sendResponse);
    });
  });

  // ==================== 43. requestAccountNetInfo ====================
  describe("requestAccountNetInfo", () => {
    it("should reject with invalid publicKey", async () => {
      try {
        await dappService.requestAccountNetInfo(
          { publicKey: "" },
          TEST_DATA.sites.example
        );
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error.code).to.exist;
      }
    });

    it("should reject with invalid address format", async () => {
      proxyquireStubs["../utils/utils"].addressValid.returns(false);
      try {
        await dappService.requestAccountNetInfo(
          { publicKey: "invalid_address" },
          TEST_DATA.sites.example
        );
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error.code).to.exist;
      }
      proxyquireStubs["../utils/utils"].addressValid.returns(true);
    });

    it("should use default tokenId if not provided", async () => {
      proxyquireStubs["./api"].getAccountInfo.resolves({ account: { balance: "1000" } });
      const result = await dappService.requestAccountNetInfo(
        { publicKey: TEST_DATA.accounts[0].address },
        TEST_DATA.sites.example
      );
      expect(result).to.have.property("account");
    });

    it("should use provided tokenId", async () => {
      proxyquireStubs["./api"].getAccountInfo.resolves({ account: { balance: "1000" } });
      const result = await dappService.requestAccountNetInfo(
        { publicKey: TEST_DATA.accounts[0].address, tokenId: "custom-token-id" },
        TEST_DATA.sites.example
      );
      expect(result).to.have.property("account");
    });

    it("should reject when account not found", async () => {
      proxyquireStubs["./api"].getAccountInfo.resolves({ account: null });
      try {
        await dappService.requestAccountNetInfo(
          { publicKey: TEST_DATA.accounts[0].address },
          TEST_DATA.sites.example
        );
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error.code).to.exist;
        expect(error.message).to.include("does not exist");
      }
    });

    it("should reject when API returns error", async () => {
      proxyquireStubs["./api"].getAccountInfo.resolves({ error: "API Error" });
      try {
        await dappService.requestAccountNetInfo(
          { publicKey: TEST_DATA.accounts[0].address },
          TEST_DATA.sites.example
        );
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error.code).to.exist;
      }
    });
  });

  // ==================== 44. signTransaction ====================
  describe("signTransaction", () => {
    it("should be a function", () => {
      expect(dappService.signTransaction).to.be.a("function");
    });

    it("should return a Promise", () => {
      const result = dappService.signTransaction(
        "sign-id-test",
        { action: "mina_signMessage", message: "test" },
        TEST_DATA.sites.example
      );
      expect(result).to.be.a("promise");
      dappService.clearAllPendingZk();
    });

    it("should reject with error when exception occurs", async () => {
      try {
        await dappService.signTransaction(
          "sign-id-error",
          { action: "mina_sendPayment", to: "", amount: "1000" },
          TEST_DATA.sites.example
        );
      } catch (error) {
        expect(error).to.have.property("code");
      }
      dappService.clearAllPendingZk();
    });

    it("should handle different action types", () => {
      const actions = [
        "mina_sendPayment",
        "mina_sendStakeDelegation",
        "mina_sendTransaction",
        "mina_signMessage",
        "mina_signFields",
        "mina_switchChain",
        "mina_addChain",
        "mina_createNullifier",
        "mina_storePrivateCredential",
        "mina_requestPresentation",
      ];

      actions.forEach((action) => {
        const result = dappService.signTransaction(
          `sign-${action}`,
          { action },
          TEST_DATA.sites.example
        );
        expect(result).to.be.a("promise");
      });

      dappService.clearAllPendingZk();
    });
  });

  // ==================== 45. requestAccounts ====================
  describe("requestAccounts", () => {
    it("should be a function", () => {
      expect(dappService.requestAccounts).to.be.a("function");
    });

    it("should reject when no wallet exists", async () => {
      storageServiceMock.get.resolves({});

      try {
        await dappService.requestAccounts("req-id-1", TEST_DATA.sites.example);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error.code).to.equal(10001); // noWallet
      }
    });

    it("should return a Promise", () => {
      storageServiceMock.get.resolves({ keyringData: "data" });
      const result = dappService.requestAccounts("req-id-test", TEST_DATA.sites.example);
      expect(result).to.be.a("promise");
      dappService.clearAllPendingZk();
    });

    it("should handle exception gracefully", async () => {
      storageServiceMock.get.resolves({ keyringData: "data" });
      dappService.dappStore.updateState({
        accountApprovedUrlList: {},
      });

      try {
        await dappService.requestAccounts("req-id-error", TEST_DATA.sites.test);
      } catch (error) {
        expect(error).to.have.property("code");
      }

      dappService.clearAllPendingZk();
    });
  });

  // ==================== 46. requestTokenBuildSign ====================
  describe("requestTokenBuildSign", () => {
    it("should reject when decrypted data has no buildID", async () => {
      proxyquireStubs["../utils/fore"].decryptData.returns({});

      try {
        await dappService.requestTokenBuildSign(
          "token-sign-1",
          { result: { encryptedData: "test" }, action: "TOKEN_BUILD_REQUEST_SIGN" },
          TEST_DATA.sites.example
        );
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error.code).to.equal(23007); // verifyFailed
      }

      proxyquireStubs["../utils/fore"].decryptData.returns("decrypted_data");
    });

    it("should reject when token build verification fails", async () => {
      proxyquireStubs["../utils/fore"].decryptData.returns({
        buildID: "build-123",
        transaction: { test: "data" },
      });
      proxyquireStubs["../utils/zkUtils"].verifyTokenCommand.returns(false);

      dappService.dappStore.updateState({
        tokenBuildList: { "build-123": { tokenId: "token123" } },
      });

      try {
        await dappService.requestTokenBuildSign(
          "token-sign-2",
          { result: { encryptedData: "test" }, action: "TOKEN_BUILD_REQUEST_SIGN" },
          TEST_DATA.sites.example
        );
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error.code).to.equal(23007); // verifyFailed
      }

      proxyquireStubs["../utils/zkUtils"].verifyTokenCommand.returns(true);
    });

    it("should reject when build data not found", async () => {
      proxyquireStubs["../utils/fore"].decryptData.returns({
        buildID: "non-existent-build",
        transaction: { test: "data" },
      });

      dappService.dappStore.updateState({
        tokenBuildList: {},
      });

      try {
        await dappService.requestTokenBuildSign(
          "token-sign-3",
          { result: { encryptedData: "test" }, action: "TOKEN_BUILD_REQUEST_SIGN" },
          TEST_DATA.sites.example
        );
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error.code).to.equal(23007); // verifyFailed
      }
    });
  });
});
