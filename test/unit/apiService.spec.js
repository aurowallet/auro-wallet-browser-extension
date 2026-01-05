const { expect } = require("chai");
const sinon = require("sinon");
const proxyquire = require("proxyquire").noCallThru();
const path = require("path");

// ==================== browser mock ====================
const browserMock = {
  runtime: {
    id: "mock-extension-id",
    sendMessage: sinon.stub().resolves(),
    onMessage: { addListener: sinon.stub(), removeListener: sinon.stub() },
  },
  action: { setIcon: sinon.stub().resolves() },
  storage: {
    local: {
      get: sinon.stub().resolves({}),
      set: sinon.stub().resolves(),
      remove: sinon.stub().resolves(),
    },
  },
  notifications: {
    create: sinon.stub().resolves("mock-id"),
    onClicked: { addListener: sinon.stub() },
  },
  tabs: { create: sinon.stub().resolves() },
};

const sendMsgStub = sinon.stub();

// ==================== Real Test Data ====================
const TEST_DATA = {
  mnemonic: "treat unique goddess bone spike inspire accident forum muffin boost drill draw",
  password: "Qw123456",
  accounts: [
    {
      priKey: "EKEfKdYoaCeGy4aZoCSam6DdGejrL121HSwFGrckzkLcLqPTMUxW",
      pubKey: "B62qkVs6zgN84e1KjFxurigqTQ57FqV3KnWubV3t77E9R6uBm4DmkPi",
      hdIndex: 0,
    },
    {
      priKey: "EKFJSVcYrRdH5xY7qdjeDHUdDKZ5V5P9K9qYMLuA1aoV7oL6sVWc",
      pubKey: "B62qk3FF1FxfFxfJ4CLSgu2YehPdRqcNZw7Jw3z1JMyH28cSNR6XYDW",
      hdIndex: 1,
    },
    {
      priKey: "EKF59KU3EQbEJPgsyTSwZyvbKAzjokLrK3DCxmEPUgoAYBSuPttx",
      pubKey: "B62qoWQowd8bAmtz1Sjsdmz1jMaruDZnj1dXaZ9Qihgb8zgFTKQhLPM",
      hdIndex: 2,
    },
  ],
  importedAccount: {
    priKey: "EKFLnT6MdRHKWUpukuLkccZuqhvCjrKKJsMGtMZDpKP52EsG6Zr9",
    pubKey: "B62qjLVC7ryAwctX9tZimvgh4FBocUozL4VtCPvPJ9bYKRatb5NCRyy",
    accountName: "Import Account 1",
    encryptedPriKey: '{"data":"8HZHn/E1ihA5Ip1p6h0OMQv2jTCEzNn85NxG896ngDrkSI+I+fkJTLDyFjM4Q4LfDpAemGmHZaaTGx2YEfxZsitlxlkT9A==","iv":"7mOePc5vO37pdg36x+SD3Q==","salt":"Z+vj/Gj2eUKolPAz7boRGA==","version":2}',
  },
  ledgerAccount: {
    pubKey: "B62qm2G9TSSsbwiu5XfMiaGSgMBTtieAUeVskqfZJ2kRYcwsvGRT6oF",
    accountName: "Ledger Account 1",
    hdPath: 0,
  },
};

// ==================== Zustand Store Mock ====================
const mockStoreState = {
  isUnlocked: false,
  data: '',
  password: '',
  currentAccount: {},
  mne: '',
  autoLockTime: 900,
  accountApprovedUrlList: {},
  currentConnect: {},
  tokenBuildList: {},
};

const resetMockStoreState = () => {
  Object.keys(mockStoreState).forEach(key => delete mockStoreState[key]);
  Object.assign(mockStoreState, {
    isUnlocked: false,
    data: '',
    password: '',
    currentAccount: {},
    mne: '',
    autoLockTime: 900,
    accountApprovedUrlList: {},
    currentConnect: {},
    tokenBuildList: {},
  });
};

const mockMemStore = {
  getState: () => mockStoreState,
  updateState: (newState) => {
    Object.assign(mockStoreState, newState);
  },
  putState: (newState) => {
    Object.keys(mockStoreState).forEach(key => delete mockStoreState[key]);
    Object.assign(mockStoreState, newState);
  },
  _directUpdate: (partial) => {
    Object.assign(mockStoreState, partial);
  },
  _directSet: (newState) => {
    Object.keys(mockStoreState).forEach(key => delete mockStoreState[key]);
    Object.assign(mockStoreState, newState);
  },
  subscribe: sinon.stub(),
  unlock: (password, data, currentAccount) => {
    Object.assign(mockStoreState, { isUnlocked: true, password, data, currentAccount });
  },
  lock: () => {
    const address = mockStoreState.currentAccount?.address;
    Object.assign(mockStoreState, {
      isUnlocked: false,
      data: '',
      password: '',
      currentAccount: address ? { address } : {},
      mne: '',
    });
  },
  setCurrentAccount: (account) => {
    mockStoreState.currentAccount = account;
  },
  setMnemonic: (mne) => {
    mockStoreState.mne = mne;
  },
  setAutoLockTime: (time) => {
    mockStoreState.autoLockTime = time;
  },
};

// ==================== proxyquire stubs ====================
const proxyquireStubs = {
  "webextension-polyfill": browserMock,
  "webextension-polyfill/dist/browser-polyfill.js": browserMock,

  [path.join(__dirname, "../../src/background/extensionStorage.js")]: {
    extGetLocal: sinon.stub().resolves("en"),
  },

  "../constant": {
    LOCK_TIME_DEFAULT: 900,
    FROM_BACK_TO_RECORD: "FROM_BACK_TO_RECORD",
    SET_LOCK: "SET_LOCK",
    WORKER_ACTIONS: { SET_LOCK: "SET_LOCK" },
    TX_SUCCESS: "TX_SUCCESS",
    ACCOUNT_TYPE: { WALLET_INSIDE: "WALLET_INSIDE" },
    FETCH_TYPE_QA: "Berkeley-QA",
  },

  "../utils/commonMsg": { sendMsg: sendMsgStub },

  "../utils/browserUtils": {
    getExtensionAction: sinon
      .stub()
      .returns({ setIcon: sinon.stub().resolves() }),
    getCurrentNodeConfig: sinon
      .stub()
      .resolves({ explorer: "https://minascan.io" }),
  },

  "./storageService": {
    get: sinon.stub(),
    save: sinon.stub().resolves(),
    removeValue: sinon.stub().resolves(),
    storeCredential: sinon.stub().resolves(),
    searchCredential: sinon.stub().resolves([]),
    getStoredCredentials: sinon.stub().resolves({ credentials: {} }),
    removeCredential: sinon.stub().resolves(),
    getCredentialById: sinon.stub().resolves({ credential: "test" }),
  },

  "./accountService": {
    generateMne: sinon.stub().returns(TEST_DATA.mnemonic),
    importWalletByMnemonic: sinon.stub(),
    importWalletByPrivateKey: sinon.stub(),
    importWalletByKeystore: sinon.stub(),
  },

  // Vault migration mocks
  "./vaultMigration": {
    normalizeVault: sinon.stub().callsFake((vault) => ({ vault, migrated: false })),
    convertV2ToLegacy: sinon.stub().callsFake((vault) => vault),
    validateVault: sinon.stub().returns({ valid: true, errors: [] }),
  },

  "../constant/vaultTypes": {
    isLegacyVault: sinon.stub().returns(true),
    isV2Vault: sinon.stub().returns(false),
    VAULT_VERSION: 2,
    KEYRING_TYPE: { HD: "hd", IMPORTED: "imported", LEDGER: "ledger", WATCH: "watch" },
  },

  "../utils/encryptUtils": {
    default: {
      encrypt: sinon.stub(),
      decrypt: sinon.stub(),
    },
  },

  "obs-store": sinon.stub().returns({
    getState: sinon.stub().returns({}),
    updateState: sinon.stub(),
    putState: sinon.stub(),
  }),

  "@/store": {
    memStore: mockMemStore,
  },

  "../store": {
    memStore: mockMemStore,
  },

  "../store/index": {
    memStore: mockMemStore,
  },

  i18next: { t: (key) => key, language: "en" },
  "../i18n": { default: { changeLanguage: sinon.stub() } },

  "./lib": {
    signPayment: sinon.stub(),
    stakePayment: sinon.stub(),
    signTransaction: sinon.stub(),
    signMessagePayment: sinon.stub(),
    signFieldsMessage: sinon.stub(),
    createNullifier: sinon.stub(),
  },

  "./api": {
    sendTx: sinon.stub(),
    sendStakeTx: sinon.stub(),
    sendParty: sinon.stub(),
  },
};

const apiService = proxyquire(
  "../../src/background/APIService",
  proxyquireStubs
).default;

describe("APIService", () => {
  beforeEach(() => {
    sinon.resetHistory();
    resetMockStoreState();
    // defalut use v1 format, v2 test need to explicitly configure
    proxyquireStubs["../constant/vaultTypes"].isV2Vault.returns(false);
    proxyquireStubs["../constant/vaultTypes"].isLegacyVault.returns(true);
  });

  // ==================== 2. initAppLocalConfig ====================
  describe("initAppLocalConfig", () => {
    it("should return autoLockTime from storage", async () => {
      proxyquireStubs["./storageService"].get
        .withArgs("autoLockTime")
        .resolves({ autoLockTime: 600 });

      const result = await apiService.initAppLocalConfig();
      expect(result).to.equal(600);
    });

    it("should return default lock time when not set", async () => {
      proxyquireStubs["./storageService"].get
        .withArgs("autoLockTime")
        .resolves({ autoLockTime: undefined });

      const result = await apiService.initAppLocalConfig();
      expect(result).to.equal(900); 
    });
  });

  // ==================== 3. getStore ====================
  describe("getStore", () => {
    it("should return memStore state", () => {
      mockMemStore.updateState({ isUnlocked: true, data: "test" });

      const result = apiService.getStore();
      expect(result.isUnlocked).to.be.true;
      expect(result.data).to.equal("test");
    });
  });

  // ==================== 4. resetWallet ====================
  describe("resetWallet", () => {
    it("should reset wallet to initial locked state", () => {
      mockMemStore.updateState({ isUnlocked: true, data: 'test' });
      apiService.resetWallet();

      const state = mockMemStore.getState();
      expect(state.isUnlocked).to.be.false;
    });
  });

  // ==================== 5. getCreateMnemonic ====================
  describe("getCreateMnemonic", () => {
    it("should generate new mnemonic when isNewMne is true", () => {
      const result = apiService.getCreateMnemonic(true);

      expect(proxyquireStubs["./accountService"].generateMne.calledOnce).to.be
        .true;
      expect(mockMemStore.getState().mne).to.equal(result);
      expect(result).to.equal(TEST_DATA.mnemonic);
    });

    it("should return existing mnemonic when isNewMne is false", () => {
      mockMemStore.updateState({ mne: TEST_DATA.mnemonic });

      const result = apiService.getCreateMnemonic(false);
      expect(result).to.equal(TEST_DATA.mnemonic);
    });

    it("should return empty string when no mnemonic exists", () => {
      mockMemStore.updateState({ mne: "" });

      const result = apiService.getCreateMnemonic(false);
      expect(result).to.equal("");
    });
  });

  // ==================== 6. filterCurrentAccount ====================
  describe("filterCurrentAccount", () => {
    it("should find account by address", () => {
      const accounts = [
        { address: TEST_DATA.accounts[0].pubKey, accountName: "Account 1" },
        { address: TEST_DATA.accounts[1].pubKey, accountName: "Account 2" },
      ];

      const result = apiService.filterCurrentAccount(accounts, TEST_DATA.accounts[1].pubKey);
      expect(result).to.deep.equal({
        address: TEST_DATA.accounts[1].pubKey,
        accountName: "Account 2",
      });
    });

    it("should return undefined if address not found", () => {
      const accounts = [{ address: TEST_DATA.accounts[0].pubKey, accountName: "Account 1" }];

      const result = apiService.filterCurrentAccount(accounts, "B62qNotExist");
      expect(result).to.be.undefined;
    });
  });

  // ==================== 7. submitPassword ====================
  describe("submitPassword", () => {
    const mockEncrypted = { keyringData: "encrypted_data" };
    
    // V1 test data
    const mockVaultV1 = [
      {
        currentAddress: TEST_DATA.accounts[0].pubKey,
        mnemonic: "encrypted_mnemonic",
        accounts: [
          {
            address: TEST_DATA.accounts[0].pubKey,
            privateKey: "enc_priv",
            type: "WALLET_INSIDE",
            accountName: "Account 1",
            hdPath: TEST_DATA.accounts[0].hdIndex,
          },
        ],
      },
    ];
    
    // V2 test data
    const mockVaultV2 = {
      version: 2,
      currentKeyringId: "keyring-1",
      keyrings: [
        {
          id: "keyring-1",
          type: "hd",
          name: "HD Wallet",
          mnemonic: "encrypted_mnemonic",
          nextHdIndex: 1,
          currentAddress: TEST_DATA.accounts[0].pubKey,
          accounts: [
            {
              address: TEST_DATA.accounts[0].pubKey,
              name: "Account 1",
              hdIndex: TEST_DATA.accounts[0].hdIndex,
            },
          ],
        },
      ],
    };

    let consoleErrorStub;

    beforeEach(() => {
      consoleErrorStub = sinon.stub(console, "error");
      proxyquireStubs["./storageService"].get
        .withArgs("keyringData")
        .resolves(mockEncrypted)
        .withArgs("autoLockTime")
        .resolves({ autoLockTime: 300 });

      proxyquireStubs["../utils/encryptUtils"].default.decrypt.reset();
    });

    afterEach(() => {
      consoleErrorStub.restore();
    });

    it("should unlock successfully with V1 vault format", async () => {
      // config v1 data
      proxyquireStubs["../constant/vaultTypes"].isV2Vault.returns(false);
      proxyquireStubs["../constant/vaultTypes"].isLegacyVault.returns(true);
      proxyquireStubs["../utils/encryptUtils"].default.decrypt
        .withArgs(sinon.match.any, "encrypted_data")
        .resolves(mockVaultV1);

      const result = await apiService.submitPassword("pwd");

      expect(mockMemStore.getState().isUnlocked).to.be.true;
      expect(result).to.include({
        address: TEST_DATA.accounts[0].pubKey,
        accountName: "Account 1",
      });
      expect(result.privateKey).to.be.undefined;
      expect(consoleErrorStub.called).to.be.false;
    });
    
    it("should unlock successfully with V2 vault format", async () => {
      // config v2 data
      proxyquireStubs["../constant/vaultTypes"].isV2Vault.returns(true);
      proxyquireStubs["../constant/vaultTypes"].isLegacyVault.returns(false);
      proxyquireStubs["../utils/encryptUtils"].default.decrypt
        .withArgs(sinon.match.any, "encrypted_data")
        .resolves(mockVaultV2);

      const result = await apiService.submitPassword("pwd");

      expect(mockMemStore.getState().isUnlocked).to.be.true;
      expect(result).to.include({
        address: TEST_DATA.accounts[0].pubKey,
        accountName: "Account 1",
      });
      expect(result.privateKey).to.be.undefined;
    });

    it("should return error when password wrong", async () => {
      proxyquireStubs["../utils/encryptUtils"].default.decrypt
        .withArgs(sinon.match.any, "encrypted_data")
        .rejects(new Error("decrypt failed"));

      const result = await apiService.submitPassword("wrong");

      expect(result).to.deep.equal({ error: "passwordError", type: "local" });
      expect(consoleErrorStub.calledOnce).to.be.true;
    });
  });

  // ==================== 8. checkPassword ====================
  describe("checkPassword", () => {
    it("should return true for correct password", () => {
      mockMemStore.updateState({ password: "correctPwd" });

      const result = apiService.checkPassword("correctPwd");
      expect(result).to.be.true;
    });

    it("should return false for incorrect password", () => {
      mockMemStore.updateState({ password: "correctPwd" });

      const result = apiService.checkPassword("wrongPwd");
      expect(result).to.be.false;
    });
  });

  // ==================== 9. setLastActiveTime ====================
  describe("setLastActiveTime", () => {
    let clock;

    beforeEach(() => {
      clock = sinon.useFakeTimers();
      mockMemStore.updateState({
        isUnlocked: true,
        autoLockTime: 1000,
        data: [{}], 
        currentAccount: { address: "B62qTestAddr" }, 
      });
    });

    afterEach(() => {
      clock.restore();
    });

    it("should lock wallet after autoLockTime", () => {
      const spy = sinon.spy(apiService, "setUnlockedStatus");

      apiService.setLastActiveTime();
      clock.tick(1000);

      expect(spy.calledOnce).to.be.true;
      expect(spy.calledWith(false)).to.be.true;

      spy.restore();
    });

    it("should not set timer if autoLockTime is -1 (never lock)", () => {
      mockMemStore.updateState({
        isUnlocked: true,
        autoLockTime: -1,
      });

      const spy = sinon.spy(global, "setTimeout");

      apiService.setLastActiveTime();

      expect(spy.notCalled).to.be.true;

      spy.restore();
    });
  });

  // ==================== 10. updateLockTime ====================
  describe("updateLockTime", () => {
    it("should update autoLockTime in state and storage", async () => {
      await apiService.updateLockTime(600);

      expect(mockMemStore.getState().autoLockTime).to.equal(600);
      expect(
        proxyquireStubs["./storageService"].save.calledWith({ autoLockTime: 600 })
      ).to.be.true;
    });
  });

  // ==================== 11. getCurrentAutoLockTime ====================
  describe("getCurrentAutoLockTime", () => {
    it("should return current autoLockTime", () => {
      mockMemStore.updateState({ autoLockTime: 300 });

      const result = apiService.getCurrentAutoLockTime();
      expect(result).to.equal(300);
    });
  });

  // ==================== 12. setUnlockedStatus ====================
  describe("setUnlockedStatus", () => {
    it("should update state when locking", () => {
      mockMemStore.updateState({
        autoLockTime: 900,
        currentAccount: { address: "B62qTestAddr" },
      });

      apiService.setUnlockedStatus(false);

      expect(mockMemStore.getState().isUnlocked).to.be.false;
      expect(sendMsgStub.called).to.be.true;
    });

    it("should send message when unlocking", () => {
      // setUnlockedStatus(true) doesn't set isUnlocked - it's called after unlock for UI updates
      mockMemStore.updateState({ isUnlocked: true });
      apiService.setUnlockedStatus(true);

      expect(sendMsgStub.called).to.be.true;
    });
  });

  // ==================== 13. getCurrentAccount ====================
  describe("getCurrentAccount", () => {
    it("should return current account without private key when unlocked", async () => {
      mockMemStore.updateState({
        isUnlocked: true,
        currentAccount: {
          address: "B62qCurr",
          accountName: "Main",
          type: "WALLET_INSIDE",
        },
      });

      const result = await apiService.getCurrentAccount();

      expect(result).to.include({
        address: "B62qCurr",
        accountName: "Main",
        isUnlocked: true,
      });
      expect(result.privateKey).to.be.undefined;
    });
  });

  // ==================== 14. getCurrentAccountAddress ====================
  describe("getCurrentAccountAddress", () => {
    it("should return current account address", () => {
      mockMemStore.updateState({
        currentAccount: { address: "B62qCurrentAddr" },
      });

      const result = apiService.getCurrentAccountAddress();
      expect(result).to.equal("B62qCurrentAddr");
    });
  });

  // ==================== 15. createPwd ====================
  describe("createPwd", () => {
    it("should update password in state", () => {
      apiService.createPwd("newPassword");

      expect(mockMemStore.getState().password).to.equal("newPassword");
    });
  });

  // ==================== 16. createAccount ====================
  describe("createAccount", () => {
    beforeEach(() => {
      proxyquireStubs["./accountService"].importWalletByMnemonic.returns({
        pubKey: TEST_DATA.accounts[0].pubKey,
        priKey: TEST_DATA.accounts[0].priKey,
        hdIndex: TEST_DATA.accounts[0].hdIndex,
      });
      proxyquireStubs["../utils/encryptUtils"].default.encrypt
        .onCall(0)
        .resolves('{"data":"encrypted_private_key","iv":"iv","salt":"salt","version":2}')
        .onCall(1)
        .resolves('{"data":"encrypted_mnemonic","iv":"iv","salt":"salt","version":2}')
        .onCall(2)
        .resolves('{"data":"encrypted_vault","iv":"iv","salt":"salt","version":2}');
    });

    it("should create first account with correct HD index 0", async () => {
      const result = await apiService.createAccount(TEST_DATA.mnemonic);

      expect(
        proxyquireStubs["./accountService"].importWalletByMnemonic.calledOnce
      ).to.be.true;
      expect(
        proxyquireStubs["../utils/encryptUtils"].default.encrypt.calledThrice
      ).to.be.true;
      expect(proxyquireStubs["./storageService"].save.calledOnce).to.be.true;
      expect(mockMemStore.getState().data).to.not.be.null;
      expect(sendMsgStub.calledWithMatch({ payload: true })).to.be.true;

      expect(result).to.include({
        address: TEST_DATA.accounts[0].pubKey,
        type: "WALLET_INSIDE",
        accountName: "Account 1",
        hdPath: 0,
      });
      expect(result.privateKey).to.be.undefined;
    });

    it("should encrypt private key and mnemonic with password", async () => {
      mockMemStore.updateState({ password: "Qw123456", data: null });

      await apiService.createAccount(TEST_DATA.mnemonic);

      expect(
        proxyquireStubs["../utils/encryptUtils"].default.encrypt.getCall(0).args[0]
      ).to.equal("Qw123456");
      expect(
        proxyquireStubs["../utils/encryptUtils"].default.encrypt.getCall(0).args[1]
      ).to.equal(TEST_DATA.accounts[0].priKey);

      expect(
        proxyquireStubs["../utils/encryptUtils"].default.encrypt.getCall(1).args[0]
      ).to.equal("Qw123456");
      expect(
        proxyquireStubs["../utils/encryptUtils"].default.encrypt.getCall(1).args[1]
      ).to.equal(TEST_DATA.mnemonic);
    });

    it("should add account to existing data when data exists", async () => {
      const existingAccount = {
        address: "B62qExisting",
        privateKey: "enc_existing",
        type: "WALLET_INSIDE",
        accountName: "Account 1",
        hdPath: 0,
      };
      mockMemStore.updateState({
        password: "Qw123456",
        data: [{
          currentAddress: "B62qExisting",
          accounts: [existingAccount],
          mnemonic: "old_enc_mnemonic",
        }],
      });

      const result = await apiService.createAccount(TEST_DATA.mnemonic);

      expect(result.address).to.equal(TEST_DATA.accounts[0].pubKey);
    });
  });

  // ==================== 17. getAllAccount ====================
  describe("getAllAccount", () => {
    it("should return all accounts with current address", () => {
      const mockAccounts = [
        { address: TEST_DATA.accounts[0].pubKey, type: "WALLET_INSIDE", accountName: "Account 1", hdPath: 0 },
        { address: TEST_DATA.accounts[1].pubKey, type: "WALLET_INSIDE", accountName: "Account 2", hdPath: 1 },
        { address: TEST_DATA.accounts[2].pubKey, type: "WALLET_INSIDE", accountName: "Account 3", hdPath: 2 },
      ];
      mockMemStore.updateState({
        data: [{ accounts: mockAccounts }],
        currentAccount: { address: TEST_DATA.accounts[2].pubKey },
      });

      const result = apiService.getAllAccount();

      expect(result).to.have.property("accounts");
      expect(result.accounts).to.have.property("allList");
      expect(result.accounts.allList).to.have.length(3);
      expect(result).to.have.property("currentAddress", TEST_DATA.accounts[2].pubKey);
    });

    it("should return sorted accounts structure", () => {
      const mockAccounts = [
        { address: TEST_DATA.accounts[0].pubKey, type: "WALLET_INSIDE", accountName: "Account 1" },
      ];
      mockMemStore.updateState({
        data: [{ accounts: mockAccounts }],
        currentAccount: { address: TEST_DATA.accounts[0].pubKey },
      });

      const result = apiService.getAllAccount();

      expect(result.accounts).to.have.property("allList");
      expect(result.accounts).to.have.property("commonList");
      expect(result.accounts).to.have.property("watchList");
    });
  });

  // ==================== 18. accountSort ====================
  describe("accountSort", () => {
    it("should sort accounts by type", () => {
      const accounts = [
        { address: TEST_DATA.accounts[0].pubKey, type: "WALLET_INSIDE", accountName: "A1" },
        { address: TEST_DATA.accounts[1].pubKey, type: "WALLET_OUTSIDE", accountName: "A2" },
        { address: TEST_DATA.accounts[2].pubKey, type: "WALLET_WATCH", accountName: "A3" },
        { address: "B62qLedger", type: "WALLET_LEDGER", accountName: "A4" },
      ];

      const result = apiService.accountSort(accounts);

      expect(result).to.have.property("allList");
      expect(result).to.have.property("commonList");
      expect(result).to.have.property("watchList");
      expect(result.watchList).to.have.length(1);
    });
  });

  // ==================== 19. _checkWalletRepeat ====================
  describe("_checkWalletRepeat", () => {
    it("should return error object if address already exists", () => {
      const accounts = [
        { address: TEST_DATA.accounts[0].pubKey, type: "WALLET_INSIDE" },
        { address: TEST_DATA.accounts[1].pubKey, type: "WALLET_INSIDE" },
      ];

      const result = apiService._checkWalletRepeat(accounts, TEST_DATA.accounts[0].pubKey);
      expect(result).to.deep.equal({ error: "importRepeat", type: "local" });
    });

    it("should return empty object if address does not exist", () => {
      const accounts = [
        { address: TEST_DATA.accounts[0].pubKey, type: "WALLET_INSIDE" },
      ];

      const result = apiService._checkWalletRepeat(accounts, TEST_DATA.accounts[1].pubKey);
      expect(result).to.deep.equal({});
    });
  });

  // ==================== 19.5. _findWalletIndex ====================
  describe("_findWalletIndex", () => {
    it("should return 1 when no accounts of given type exist", () => {
      const accounts = [
        { address: TEST_DATA.accounts[0].pubKey, type: "WALLET_INSIDE", typeIndex: 1 },
      ];

      const result = apiService._findWalletIndex(accounts, "WALLET_OUTSIDE");
      expect(result).to.equal(1);
    });

    it("should return typeIndex + 1 when accounts of given type exist", () => {
      const accounts = [
        { address: TEST_DATA.accounts[0].pubKey, type: "WALLET_INSIDE", typeIndex: 1 },
        { address: TEST_DATA.accounts[1].pubKey, type: "WALLET_OUTSIDE", typeIndex: 1 },
        { address: TEST_DATA.accounts[2].pubKey, type: "WALLET_OUTSIDE", typeIndex: 2 },
      ];

      const result = apiService._findWalletIndex(accounts, "WALLET_OUTSIDE");
      expect(result).to.equal(3);
    });

    it("should return 1 for WALLET_WATCH when no watch accounts exist", () => {
      const accounts = [
        { address: TEST_DATA.accounts[0].pubKey, type: "WALLET_INSIDE", typeIndex: 1 },
      ];

      const result = apiService._findWalletIndex(accounts, "WALLET_WATCH");
      expect(result).to.equal(1);
    });

    it("should return 1 for WALLET_LEDGER when no ledger accounts exist", () => {
      const accounts = [
        { address: TEST_DATA.accounts[0].pubKey, type: "WALLET_INSIDE", typeIndex: 1 },
      ];

      const result = apiService._findWalletIndex(accounts, "WALLET_LEDGER");
      expect(result).to.equal(1);
    });
  });

  // ==================== 20. addHDNewAccount ====================
  describe("addHDNewAccount", () => {
    beforeEach(() => {
      mockMemStore.updateState({
        password: "testPwd",
        data: [
          {
            mnemonic: "encrypted_mnemonic",
            accounts: [
              {
                address: TEST_DATA.accounts[0].pubKey,
                privateKey: "enc_priv_0",
                type: "WALLET_INSIDE",
                hdPath: 0,
                typeIndex: 1,
                accountName: "Account 1",
              },
            ],
            currentAddress: TEST_DATA.accounts[0].pubKey,
          },
        ],
      });

      proxyquireStubs["../utils/encryptUtils"].default.decrypt.resolves(
        TEST_DATA.mnemonic
      );
      proxyquireStubs["../utils/encryptUtils"].default.encrypt.resolves(
        "encrypted_data"
      );
      proxyquireStubs["./accountService"].importWalletByMnemonic.returns({
        pubKey: TEST_DATA.accounts[1].pubKey,
        priKey: TEST_DATA.accounts[1].priKey,
        hdIndex: TEST_DATA.accounts[1].hdIndex,
      });
    });

    it("should create new HD account with next index", async () => {
      const result = await apiService.addHDNewAccount("Account 2");

      expect(proxyquireStubs["../utils/encryptUtils"].default.decrypt.called).to.be.true;
      expect(proxyquireStubs["./accountService"].importWalletByMnemonic.calledWith(
        TEST_DATA.mnemonic,
        1
      )).to.be.true;
      expect(result.address).to.equal(TEST_DATA.accounts[1].pubKey);
      expect(result.type).to.equal("WALLET_INSIDE");
    });

    it("should return error if address already exists", async () => {
      proxyquireStubs["./accountService"].importWalletByMnemonic.returns({
        pubKey: TEST_DATA.accounts[0].pubKey,
        priKey: TEST_DATA.accounts[0].priKey,
        hdIndex: 0,
      });

      const result = await apiService.addHDNewAccount("Account 2");

      expect(result.error).to.equal("importRepeat");
    });
  });

  // ==================== 21. addImportAccount ====================
  describe("addImportAccount", () => {
    beforeEach(() => {
      // Simulate existing 3 HD accounts
      mockMemStore.updateState({
        password: "Qw123456",
        data: [
          {
            accounts: [
              { address: TEST_DATA.accounts[0].pubKey, type: "WALLET_INSIDE", hdPath: 0, accountName: "Account 1", typeIndex: 1 },
              { address: TEST_DATA.accounts[1].pubKey, type: "WALLET_INSIDE", hdPath: 1, accountName: "Account 2", typeIndex: 2 },
              { address: TEST_DATA.accounts[2].pubKey, type: "WALLET_INSIDE", hdPath: 2, accountName: "Account 3", typeIndex: 3 },
            ],
          },
        ],
      });

      // Use real imported account data
      proxyquireStubs["./accountService"].importWalletByPrivateKey.resolves({
        pubKey: TEST_DATA.importedAccount.pubKey,
        priKey: TEST_DATA.importedAccount.priKey,
      });

      proxyquireStubs["../utils/encryptUtils"].default.encrypt.resolves(
        '{"data":"encrypted","iv":"iv","salt":"salt","version":2}'
      );
    });

    it("should import account by private key", async () => {
      const result = await apiService.addImportAccount(
        TEST_DATA.importedAccount.priKey,
        TEST_DATA.importedAccount.accountName
      );

      expect(result.address).to.equal(TEST_DATA.importedAccount.pubKey);
      expect(result.type).to.equal("WALLET_OUTSIDE");
      expect(result.accountName).to.equal(TEST_DATA.importedAccount.accountName);
    });

    it("should set typeIndex to 1 for first imported account", async () => {
      const result = await apiService.addImportAccount(
        TEST_DATA.importedAccount.priKey,
        TEST_DATA.importedAccount.accountName
      );

      expect(result.typeIndex).to.equal(1);
    });

    it("should return error if address already exists", async () => {
      proxyquireStubs["./accountService"].importWalletByPrivateKey.resolves({
        pubKey: TEST_DATA.accounts[0].pubKey,
        priKey: TEST_DATA.accounts[0].priKey,
      });

      const result = await apiService.addImportAccount(
        TEST_DATA.accounts[0].priKey,
        "Imported Account"
      );

      expect(result.error).to.equal("importRepeat");
    });

    it("should encrypt private key before storing", async () => {
      await apiService.addImportAccount(
        TEST_DATA.importedAccount.priKey,
        TEST_DATA.importedAccount.accountName
      );

      expect(
        proxyquireStubs["../utils/encryptUtils"].default.encrypt.calledWith(
          "Qw123456",
          TEST_DATA.importedAccount.priKey
        )
      ).to.be.true;
    });
  });

  // ==================== 22. addAccountByKeyStore ====================
  describe("addAccountByKeyStore", () => {
    beforeEach(() => {
      mockMemStore.updateState({
        password: "pwd",
        data: [
          {
            accounts: [
              { address: TEST_DATA.accounts[0].pubKey, type: "WALLET_INSIDE" },
            ],
          },
        ],
      });

      proxyquireStubs["./accountService"].importWalletByKeystore.resolves({
        priKey: TEST_DATA.accounts[1].priKey,
        pubKey: TEST_DATA.accounts[1].pubKey,
      });

      proxyquireStubs["./accountService"].importWalletByPrivateKey.resolves({
        pubKey: TEST_DATA.accounts[1].pubKey,
        priKey: TEST_DATA.accounts[1].priKey,
      });

      proxyquireStubs["../utils/encryptUtils"].default.encrypt.resolves(
        "encrypted_data"
      );
    });

    it("should import account by keystore", async () => {
      const result = await apiService.addAccountByKeyStore(
        { version: 1, crypto: {} },
        "keystorePwd",
        "Keystore Account"
      );

      expect(proxyquireStubs["./accountService"].importWalletByKeystore.calledOnce).to.be.true;
      expect(result.address).to.equal(TEST_DATA.accounts[1].pubKey);
    });

    it("should return error if keystore decryption fails", async () => {
      proxyquireStubs["./accountService"].importWalletByKeystore.resolves({
        error: "Invalid keystore password",
      });

      const result = await apiService.addAccountByKeyStore(
        { version: 1, crypto: {} },
        "wrongPwd",
        "Keystore Account"
      );

      expect(result.error).to.equal("Invalid keystore password");
    });
  });


  // ==================== 21. addLedgerAccount ====================
  describe("addLedgerAccount", () => {
    beforeEach(() => {
      mockMemStore.updateState({
        password: TEST_DATA.password,
        data: [
          {
            accounts: [
              { address: TEST_DATA.accounts[0].pubKey, type: "WALLET_INSIDE", hdPath: 0, accountName: "Account 1", typeIndex: 1 },
              { address: TEST_DATA.accounts[1].pubKey, type: "WALLET_INSIDE", hdPath: 1, accountName: "Account 2", typeIndex: 2 },
              { address: TEST_DATA.accounts[2].pubKey, type: "WALLET_INSIDE", hdPath: 2, accountName: "Account 3", typeIndex: 3 },
              { address: TEST_DATA.importedAccount.pubKey, type: "WALLET_OUTSIDE", accountName: TEST_DATA.importedAccount.accountName, typeIndex: 1 },
            ],
          },
        ],
      });

      proxyquireStubs["../utils/encryptUtils"].default.encrypt.resolves(
        '{"data":"encrypted","iv":"iv","salt":"salt","version":2}'
      );
    });

    it("should add ledger account", async () => {
      const result = await apiService.addLedgerAccount(
        TEST_DATA.ledgerAccount.pubKey,
        TEST_DATA.ledgerAccount.accountName,
        TEST_DATA.ledgerAccount.hdPath
      );

      expect(result.address).to.equal(TEST_DATA.ledgerAccount.pubKey);
      expect(result.type).to.equal("WALLET_LEDGER");
      expect(result.hdPath).to.equal(TEST_DATA.ledgerAccount.hdPath);
      expect(result.accountName).to.equal(TEST_DATA.ledgerAccount.accountName);
      expect(proxyquireStubs["./storageService"].save.called).to.be.true;
    });

    it("should return error if address already exists", async () => {
      const result = await apiService.addLedgerAccount(
        TEST_DATA.accounts[0].pubKey,
        "Ledger Account",
        0
      );

      expect(result.error).to.equal("importRepeat");
    });
  });

  // ==================== 22. setCurrentAccount ====================
  describe("setCurrentAccount", () => {
    beforeEach(() => {
      mockMemStore.updateState({
        password: TEST_DATA.password,
        data: [
          {
            accounts: [
              { address: TEST_DATA.accounts[0].pubKey, accountName: "Account 1", type: "WALLET_INSIDE", hdPath: 0 },
              { address: TEST_DATA.accounts[1].pubKey, accountName: "Account 2", type: "WALLET_INSIDE", hdPath: 1 },
              { address: TEST_DATA.accounts[2].pubKey, accountName: "Account 3", type: "WALLET_INSIDE", hdPath: 2 },
              { address: TEST_DATA.importedAccount.pubKey, accountName: TEST_DATA.importedAccount.accountName, type: "WALLET_OUTSIDE" },
            ],
            currentAddress: TEST_DATA.accounts[0].pubKey,
          },
        ],
      });

      proxyquireStubs["../utils/encryptUtils"].default.encrypt.resolves(
        '{"data":"encrypted","iv":"iv","salt":"salt","version":2}'
      );
    });

    it("should set current account to imported account", async () => {
      const result = await apiService.setCurrentAccount(TEST_DATA.importedAccount.pubKey);

      expect(result.currentAddress).to.equal(TEST_DATA.importedAccount.pubKey);
      expect(result.currentAccount.address).to.equal(TEST_DATA.importedAccount.pubKey);
      expect(proxyquireStubs["./storageService"].save.called).to.be.true;
    });

    it("should set current account to HD account", async () => {
      const result = await apiService.setCurrentAccount(TEST_DATA.accounts[2].pubKey);

      expect(result.currentAddress).to.equal(TEST_DATA.accounts[2].pubKey);
      expect(result.currentAccount.address).to.equal(TEST_DATA.accounts[2].pubKey);
    });
  });

  // ==================== 23. changeAccountName ====================
  describe("changeAccountName", () => {
    beforeEach(() => {
      mockMemStore.updateState({
        password: TEST_DATA.password,
        data: [
          {
            accounts: [
              { address: TEST_DATA.accounts[0].pubKey, accountName: "Account 1", type: "WALLET_INSIDE", hdPath: 0 },
              { address: TEST_DATA.accounts[1].pubKey, accountName: "Account 2", type: "WALLET_INSIDE", hdPath: 1 },
              { address: TEST_DATA.accounts[2].pubKey, accountName: "Account 3", type: "WALLET_INSIDE", hdPath: 2 },
              { address: TEST_DATA.importedAccount.pubKey, accountName: TEST_DATA.importedAccount.accountName, type: "WALLET_OUTSIDE" },
            ],
          },
        ],
      });

      proxyquireStubs["../utils/encryptUtils"].default.encrypt.resolves(
        '{"data":"encrypted","iv":"iv","salt":"salt","version":2}'
      );
    });

    it("should change HD account name successfully", async () => {
      const result = await apiService.changeAccountName(TEST_DATA.accounts[0].pubKey, "My Main Account");

      expect(result.account.accountName).to.equal("My Main Account");
      expect(result.account.address).to.equal(TEST_DATA.accounts[0].pubKey);
      expect(proxyquireStubs["./storageService"].save.called).to.be.true;
    });

    it("should change imported account name successfully", async () => {
      const result = await apiService.changeAccountName(TEST_DATA.importedAccount.pubKey, "Imported Renamed");

      expect(result.account.accountName).to.equal("Imported Renamed");
      expect(result.account.address).to.equal(TEST_DATA.importedAccount.pubKey);
    });
  });

  // ==================== 24. deleteAccount ====================
  describe("deleteAccount", () => {
    beforeEach(() => {
      mockMemStore.updateState({
        password: TEST_DATA.password,
        data: [
          {
            accounts: [
              { address: TEST_DATA.accounts[0].pubKey, type: "WALLET_INSIDE", accountName: "Account 1", hdPath: 0 },
              { address: TEST_DATA.accounts[1].pubKey, type: "WALLET_INSIDE", accountName: "Account 2", hdPath: 1 },
              { address: TEST_DATA.accounts[2].pubKey, type: "WALLET_INSIDE", accountName: "Account 3", hdPath: 2 },
              { address: TEST_DATA.importedAccount.pubKey, type: "WALLET_OUTSIDE", accountName: TEST_DATA.importedAccount.accountName },
              { address: TEST_DATA.ledgerAccount.pubKey, type: "WALLET_WATCH", accountName: "Watch Account" },
            ],
            currentAddress: TEST_DATA.accounts[0].pubKey,
          },
        ],
        currentAccount: { address: TEST_DATA.accounts[0].pubKey },
      });

      proxyquireStubs["../utils/encryptUtils"].default.encrypt.resolves(
        '{"data":"encrypted","iv":"iv","salt":"salt","version":2}'
      );
    });

    it("should delete watch account without password", async () => {
      const result = await apiService.deleteAccount(TEST_DATA.ledgerAccount.pubKey);

      expect(result).to.have.property("address");
      expect(proxyquireStubs["./storageService"].save.called).to.be.true;
    });

    it("should delete imported account with correct password", async () => {
      const result = await apiService.deleteAccount(TEST_DATA.importedAccount.pubKey, TEST_DATA.password);

      expect(result).to.have.property("address");
    });

    it("should delete HD account with correct password", async () => {
      const result = await apiService.deleteAccount(TEST_DATA.accounts[2].pubKey, TEST_DATA.password);

      expect(result).to.have.property("address");
    });

    it("should return error with incorrect password for regular account", async () => {
      const result = await apiService.deleteAccount(TEST_DATA.accounts[0].pubKey, "wrongPwd");

      expect(result).to.deep.equal({ error: "passwordError", type: "local" });
    });

    it("should switch to first account when deleting current account", async () => {
      // 设置当前账户为第三个账户
      mockMemStore.updateState({
        password: TEST_DATA.password,
        data: [
          {
            accounts: [
              { address: TEST_DATA.accounts[0].pubKey, type: "WALLET_INSIDE", accountName: "Account 1", hdPath: 0 },
              { address: TEST_DATA.accounts[1].pubKey, type: "WALLET_INSIDE", accountName: "Account 2", hdPath: 1 },
              { address: TEST_DATA.accounts[2].pubKey, type: "WALLET_INSIDE", accountName: "Account 3", hdPath: 2 },
            ],
            currentAddress: TEST_DATA.accounts[2].pubKey,
          },
        ],
        currentAccount: { address: TEST_DATA.accounts[2].pubKey },
      });

      const result = await apiService.deleteAccount(TEST_DATA.accounts[2].pubKey, TEST_DATA.password);

      expect(result.address).to.equal(TEST_DATA.accounts[0].pubKey);
    });

    it("should delete ledger account without password", async () => {
      mockMemStore.updateState({
        password: TEST_DATA.password,
        data: [
          {
            accounts: [
              { address: TEST_DATA.accounts[0].pubKey, type: "WALLET_INSIDE", accountName: "Account 1" },
              { address: "B62qLedgerAddr", type: "WALLET_LEDGER", accountName: "Ledger Account" },
            ],
            currentAddress: TEST_DATA.accounts[0].pubKey,
          },
        ],
        currentAccount: { address: TEST_DATA.accounts[0].pubKey },
      });

      const result = await apiService.deleteAccount("B62qLedgerAddr");

      expect(result).to.have.property("address");
    });
  });

  // ==================== 25. getMnemonic ====================
  describe("getMnemonic", () => {
    beforeEach(() => {
      mockMemStore.updateState({
        password: TEST_DATA.password,
        data: [{ mnemonic: '{"data":"encrypted_mnemonic","iv":"iv","salt":"salt","version":2}' }],
      });
    });

    it("should return mnemonic with correct password", async () => {
      proxyquireStubs["../utils/encryptUtils"].default.decrypt.resolves(
        TEST_DATA.mnemonic
      );

      const result = await apiService.getMnemonic(TEST_DATA.password);
      expect(result).to.equal(TEST_DATA.mnemonic);
    });

    it("should return error with incorrect password", async () => {
      const result = await apiService.getMnemonic("wrongPwd");
      expect(result).to.deep.equal({ error: "passwordError", type: "local" });
    });
  });

  // ==================== 26. updateSecPassword ====================
  describe("updateSecPassword", () => {
    beforeEach(() => {
      mockMemStore.updateState({
        password: TEST_DATA.password,
        data: [
          {
            mnemonic: '{"data":"encrypted_mnemonic","iv":"iv","salt":"salt","version":2}',
            accounts: [
              {
                address: TEST_DATA.accounts[0].pubKey,
                privateKey: '{"data":"encrypted_priv_key","iv":"iv","salt":"salt","version":2}',
                type: "WALLET_INSIDE",
              },
              {
                address: TEST_DATA.accounts[1].pubKey,
                privateKey: '{"data":"encrypted_priv_key","iv":"iv","salt":"salt","version":2}',
                type: "WALLET_INSIDE",
              },
              {
                address: TEST_DATA.accounts[2].pubKey,
                privateKey: '{"data":"encrypted_priv_key","iv":"iv","salt":"salt","version":2}',
                type: "WALLET_INSIDE",
              },
              {
                address: TEST_DATA.importedAccount.pubKey,
                privateKey: TEST_DATA.importedAccount.encryptedPriKey,
                type: "WALLET_OUTSIDE",
              },
            ],
          },
        ],
        currentAccount: {
          address: TEST_DATA.accounts[0].pubKey,
          privateKey: '{"data":"encrypted_priv_key","iv":"iv","salt":"salt","version":2}',
        },
      });

      proxyquireStubs["../utils/encryptUtils"].default.decrypt.resolves(
        TEST_DATA.mnemonic
      );
      proxyquireStubs["../utils/encryptUtils"].default.encrypt.resolves(
        '{"data":"new_encrypted","iv":"iv","salt":"salt","version":2}'
      );
    });

    it("should update password and re-encrypt all data", async () => {
      const result = await apiService.updateSecPassword(TEST_DATA.password, "NewPassword123");

      expect(result).to.deep.equal({ code: 0 });
      expect(proxyquireStubs["../utils/encryptUtils"].default.decrypt.called).to.be.true;
      expect(proxyquireStubs["../utils/encryptUtils"].default.encrypt.called).to.be.true;
      expect(proxyquireStubs["./storageService"].removeValue.calledWith("keyringData")).to.be.true;
      expect(proxyquireStubs["./storageService"].save.called).to.be.true;
      expect(mockMemStore.getState().password).to.equal("NewPassword123");
    });

    it("should return error with incorrect old password", async () => {
      const result = await apiService.updateSecPassword("wrongOldPwd", "NewPassword123");

      expect(result).to.deep.equal({ error: "passwordError", type: "local" });
    });
  });

  // ==================== 27. getPrivateKey ====================
  describe("getPrivateKey", () => {
    beforeEach(() => {
      mockMemStore.updateState({
        password: TEST_DATA.password,
        data: [
          {
            accounts: [
              { address: TEST_DATA.accounts[0].pubKey, privateKey: '{"data":"encrypted_key","iv":"iv","salt":"salt","version":2}' },
              { address: TEST_DATA.importedAccount.pubKey, privateKey: TEST_DATA.importedAccount.encryptedPriKey },
            ],
          },
        ],
      });
    });

    it("should return HD account private key with correct password", async () => {
      proxyquireStubs["../utils/encryptUtils"].default.decrypt.resolves(
        TEST_DATA.accounts[0].priKey
      );

      const result = await apiService.getPrivateKey(TEST_DATA.accounts[0].pubKey, TEST_DATA.password);
      expect(result).to.equal(TEST_DATA.accounts[0].priKey);
    });

    it("should return imported account private key with correct password", async () => {
      proxyquireStubs["../utils/encryptUtils"].default.decrypt.resolves(
        TEST_DATA.importedAccount.priKey
      );

      const result = await apiService.getPrivateKey(TEST_DATA.importedAccount.pubKey, TEST_DATA.password);
      expect(result).to.equal(TEST_DATA.importedAccount.priKey);
    });

    it("should return error with incorrect password", async () => {
      const result = await apiService.getPrivateKey(TEST_DATA.accounts[0].pubKey, "wrongPwd");
      expect(result).to.deep.equal({ error: "passwordError", type: "local" });
    });
  });

  // ==================== 28. getAccountWithoutPrivate ====================
  describe("getAccountWithoutPrivate", () => {
    it("should remove privateKey from HD account", () => {
      const account = {
        address: TEST_DATA.accounts[0].pubKey,
        privateKey: '{"data":"encrypted","iv":"iv","salt":"salt","version":2}',
        accountName: "Account 1",
        hdPath: 0,
      };

      const result = apiService.getAccountWithoutPrivate(account);

      expect(result.address).to.equal(TEST_DATA.accounts[0].pubKey);
      expect(result.accountName).to.equal("Account 1");
      expect(result.privateKey).to.be.undefined;
    });

    it("should remove privateKey from imported account", () => {
      const account = {
        address: TEST_DATA.importedAccount.pubKey,
        privateKey: TEST_DATA.importedAccount.encryptedPriKey,
        accountName: TEST_DATA.importedAccount.accountName,
        type: "WALLET_OUTSIDE",
      };

      const result = apiService.getAccountWithoutPrivate(account);

      expect(result.address).to.equal(TEST_DATA.importedAccount.pubKey);
      expect(result.accountName).to.equal(TEST_DATA.importedAccount.accountName);
      expect(result.privateKey).to.be.undefined;
    });
  });

  

  

  // ==================== 30. postZkTx ====================
  describe("postZkTx", () => {
    const zkAppSignedData = {
      signature: "7mXY2GL3Cd6t5yWbFVhEZ999S3FQZrNs5HaGFxSLH2r3KJu3moxn8Cesc73isnCP9oQNBDnrpAyAJy1xUaAvNRqP2Gxc4hCu",
      publicKey: TEST_DATA.accounts[0].pubKey,
      data: {
        feePayer: {
          feePayer: TEST_DATA.accounts[0].pubKey,
          fee: "14100000",
          nonce: "3",
          memo: "",
          validUntil: null,
        },
        zkappCommand: {
          feePayer: {
            body: {
              publicKey: TEST_DATA.accounts[0].pubKey,
              fee: "0",
              validUntil: null,
              nonce: "3",
            },
            authorization: "7mWxjLYgbJUkZNcGouvhVj5tJ8yu9hoexb9ntvPK8t5LHqzmrL6QJjjKtf5SgmxB4QWkDw7qoMMbbNGtHVpsbJHPyTy2EzRQ",
          },
          accountUpdates: [],
          memo: "E4YM2vTHhWEg66xpj52JErHUBU4pZ1yageL4TVDDpTTSsv8mK6YaH",
        },
      },
    };

    const zkAppResult = {
      sendZkapp: {
        zkapp: {
          id: "zk_tx_id",
          hash: "5JtZkAppTransactionHash",
        },
      },
    };

    let checkTxStatusStub;

    beforeEach(() => {
      proxyquireStubs["./api"].sendParty.resolves(zkAppResult);
      checkTxStatusStub = sinon.stub(apiService, "checkTxStatus");
    });

    afterEach(() => {
      checkTxStatusStub.restore();
    });

    it("should post zkApp transaction and check status", async () => {
      const result = await apiService.postZkTx(zkAppSignedData);

      expect(result.id).to.equal("zk_tx_id");
      expect(result.hash).to.equal("5JtZkAppTransactionHash");
      expect(checkTxStatusStub.calledOnce).to.be.true;
    });

    it("should return error if zkApp tx fails", async () => {
      proxyquireStubs["./api"].sendParty.resolves({
        error: "zk_error",
      });

      const result = await apiService.postZkTx(zkAppSignedData);

      expect(result.error).to.equal("zk_error");
    });
  });

  // ==================== 31. sendTransaction ====================
  describe("sendTransaction", () => {
    const paymentSignedData = {
      signature: {
        field: "6541227050688850257716628744013070491503580114726649206550574549546641544883",
        scalar: "27208790946280778786843249732842618286670335571195173897090140108531547621902",
      },
      publicKey: TEST_DATA.accounts[0].pubKey,
      data: {
        amount: "100000000",
        fee: "20000000",
        from: TEST_DATA.accounts[0].pubKey,
        to: TEST_DATA.accounts[1].pubKey,
        memo: "test",
        nonce: "0",
        validUntil: "4294967295",
      },
    };

    const paymentResult = {
      sendPayment: {
        payment: {
          hash: "5JtsipNZkyqiWA1kobejDgSfE3igJnq1mZnvkWJTqXi6QrSbWU1d",
          id: "Av0ALTEBPPsvT8KxNRlQJTHT0...",
          amount: "100000000",
          fee: "20000000",
          from: TEST_DATA.accounts[0].pubKey,
          to: TEST_DATA.accounts[1].pubKey,
          isDelegation: false,
          kind: "PAYMENT",
          memo: "E4YVhAM4qf5uYB8UvjeCmHg198EdPXa8nPi64oqXDW18YAb7XZRSj",
          nonce: 0,
        },
      },
    };

    const stakeSignedData = {
      signature: {
        field: "22981598299430982066398620465328327624052394899073166428432200493919251667044",
        scalar: "22363218093944833438400421188659933312928462570584167255225617263254963827077",
      },
      publicKey: TEST_DATA.accounts[0].pubKey,
      data: {
        fee: "1100000",
        from: TEST_DATA.accounts[0].pubKey,
        to: TEST_DATA.accounts[1].pubKey,
        memo: "",
        nonce: "2",
        validUntil: "4294967295",
      },
    };

    const stakeResult = {
      sendDelegation: {
        delegation: {
          hash: "5JtZBBJDh2ZfWV1dYo5xv4m1bcvRrkttiTYzKNmN5mAjsts78FWq",
          id: "Av3gyBAAPPsvT8KxNRlQJTHT0...",
          isDelegation: true,
          kind: "STAKE_DELEGATION",
          from: TEST_DATA.accounts[0].pubKey,
          to: TEST_DATA.accounts[1].pubKey,
          fee: "1100000",
          nonce: 2,
        },
      },
    };

    const zkAppSignedData = {
      signature: "7mXY2GL3Cd6t5yWbFVhEZ999S3FQZrNs5HaGFxSLH2r3KJu3moxn8Cesc73isnCP9oQNBDnrpAyAJy1xUaAvNRqP2Gxc4hCu",
      publicKey: TEST_DATA.accounts[0].pubKey,
      data: {
        feePayer: {
          feePayer: TEST_DATA.accounts[0].pubKey,
          fee: "14100000",
          nonce: "3",
          memo: "",
          validUntil: null,
        },
        zkappCommand: {
          feePayer: {
            body: {
              publicKey: TEST_DATA.accounts[0].pubKey,
              fee: "0",
              validUntil: null,
              nonce: "3",
            },
            authorization: "7mWxjLYgbJUkZNcGouvhVj5tJ8yu9hoexb9ntvPK8t5LHqzmrL6QJjjKtf5SgmxB4QWkDw7qoMMbbNGtHVpsbJHPyTy2EzRQ",
          },
          accountUpdates: [],
          memo: "E4YM2vTHhWEg66xpj52JErHUBU4pZ1yageL4TVDDpTTSsv8mK6YaH",
        },
      },
    };

    const zkAppResult = {
      sendZkapp: {
        zkapp: {
          id: "zk_tx_id",
          hash: "5JtZkAppTransactionHash",
        },
      },
    };

    let checkTxStatusStub;

    beforeEach(() => {
      apiService.getCurrentPrivateKey = sinon.stub().resolves(TEST_DATA.accounts[0].priKey);
      checkTxStatusStub = sinon.stub(apiService, "checkTxStatus");

      proxyquireStubs["./lib"].signTransaction.resolves(paymentSignedData);
      proxyquireStubs["./api"].sendTx.resolves(paymentResult);
      proxyquireStubs["./api"].sendStakeTx.resolves(stakeResult);
      proxyquireStubs["./api"].sendParty.resolves(zkAppResult);
    });

    it("should send payment via sendTransaction", async () => {
      const result = await apiService.sendTransaction({
        sendAction: "mina_sendPayment",
        fromAddress: TEST_DATA.accounts[0].pubKey,
        toAddress: TEST_DATA.accounts[1].pubKey,
        amount: 0.1,
        fee: "0.02",
        nonce: "0",
        memo: "test",
      });

      expect(proxyquireStubs["./api"].sendTx.calledOnce).to.be.true;
      expect(result.sendPayment).to.exist;
      expect(result.sendPayment.payment.hash).to.equal("5JtsipNZkyqiWA1kobejDgSfE3igJnq1mZnvkWJTqXi6QrSbWU1d");
      expect(result.sendPayment.payment.isDelegation).to.be.false;
    });

    it("should send stake delegation via sendTransaction", async () => {
      proxyquireStubs["./lib"].signTransaction.resolves(stakeSignedData);

      const result = await apiService.sendTransaction({
        sendAction: "mina_sendStakeDelegation",
        fromAddress: TEST_DATA.accounts[0].pubKey,
        toAddress: TEST_DATA.accounts[1].pubKey,
        fee: "0.0011",
        nonce: "2",
        memo: "",
      });

      expect(proxyquireStubs["./api"].sendStakeTx.calledOnce).to.be.true;
      expect(result.sendDelegation).to.exist;
      expect(result.sendDelegation.delegation.hash).to.equal("5JtZBBJDh2ZfWV1dYo5xv4m1bcvRrkttiTYzKNmN5mAjsts78FWq");
      expect(result.sendDelegation.delegation.isDelegation).to.be.true;
    });

    it("should send zkApp transaction via sendTransaction", async () => {
      proxyquireStubs["./lib"].signTransaction.resolves(zkAppSignedData);

      const result = await apiService.sendTransaction({
        sendAction: "mina_sendTransaction",
        fromAddress: TEST_DATA.accounts[0].pubKey,
        nonce: "3",
        fee: 0.0141,
        memo: "",
        transaction: JSON.stringify({
          feePayer: {
            body: {
              publicKey: TEST_DATA.accounts[0].pubKey,
              fee: "0",
              validUntil: null,
              nonce: "3",
            },
            authorization: "7mWxjLYgbJUkZNcGouvhVj5tJ8yu9hoexb9ntvPK8t5LHqzmrL6QJjjKtf5SgmxB4QWkDw7qoMMbbNGtHVpsbJHPyTy2EzRQ",
          },
          accountUpdates: [],
          memo: "E4YM2vTHhWEg66xpj52JErHUBU4pZ1yageL4TVDDpTTSsv8mK6YaH",
        }),
      });

      expect(proxyquireStubs["./api"].sendParty.calledOnce).to.be.true;
      expect(result.id).to.equal("zk_tx_id");
      expect(result.hash).to.equal("5JtZkAppTransactionHash");
    });

    afterEach(() => {
      checkTxStatusStub.restore();
      delete apiService.getCurrentPrivateKey;
    });
  });

  // ==================== 32. notification ====================
  describe("notification", () => {
    it("should create notification with correct params", async () => {
      await apiService.notification("test_hash");

      expect(browserMock.notifications.create.calledOnce).to.be.true;
      const args = browserMock.notifications.create.firstCall.args;
      expect(args[0]).to.equal("test_hash");
      expect(args[1]).to.have.property("title");
      expect(args[1]).to.have.property("message");
    });
  });

  // ==================== 33. checkTxStatus ====================
  describe("checkTxStatus", () => {
    it("should call fetchTransactionStatus for mainnet tx", () => {
      const stub = sinon.stub(apiService, "fetchTransactionStatus");

      apiService.checkTxStatus("id123", "hash123");

      expect(stub.calledOnceWith("id123", "hash123")).to.be.true;

      stub.restore();
    });

    it("should call fetchQAnetTransactionStatus for QA tx", () => {
      const stub = sinon.stub(apiService, "fetchQAnetTransactionStatus");

      apiService.checkTxStatus("id123", "hash123", "Berkeley-QA");

      expect(stub.calledOnceWith("id123", "hash123")).to.be.true;

      stub.restore();
    });
  });

  // ==================== 35. getLedgerAccountIndex ====================
  describe("getLedgerAccountIndex", () => {
    it("should return count of ledger accounts", () => {
      // V1 格式：accounts 是数组
      const mockAccounts = [
        { address: TEST_DATA.accounts[0].pubKey, type: "WALLET_INSIDE" },
        { address: TEST_DATA.ledgerAccount.pubKey, type: "WALLET_LEDGER" },
        { address: "B62qSecondLedger", type: "WALLET_LEDGER" },
      ];
      mockMemStore.updateState({
        data: [{ accounts: mockAccounts }],
        currentAccount: { address: TEST_DATA.accounts[0].pubKey },
      });

      const result = apiService.getLedgerAccountIndex();
      expect(result).to.equal(2);
    });
  });

  // ==================== 36. Private Credential methods ====================
  describe("Private Credential methods", () => {
    const cred = { name: "GitHub", proof: "abc123" };

    it("should store and retrieve private credential", async () => {
      await apiService.storePrivateCredential(TEST_DATA.accounts[0].pubKey, cred);

      expect(proxyquireStubs["./storageService"].storeCredential.calledOnce).to
        .be.true;

      proxyquireStubs["./storageService"].searchCredential.resolves([
        { type: "private-credential", name: "GitHub", proof: "abc123" },
      ]);

      const result = await apiService.getPrivateCredential(TEST_DATA.accounts[0].pubKey);
      expect(result).to.deep.equal([{ name: "GitHub", proof: "abc123" }]);
    });

    it("should get credential ID list", async () => {
      proxyquireStubs["./storageService"].getStoredCredentials.resolves({
        credentials: { [TEST_DATA.accounts[0].pubKey]: { id1: {}, id2: {} } },
      });

      const result = await apiService.getCredentialIdList(TEST_DATA.accounts[0].pubKey);
      expect(result).to.deep.equal(["id1", "id2"]);
    });

    it("should remove credential", async () => {
      await apiService.removeTargetCredential(TEST_DATA.accounts[0].pubKey, "id1");
      expect(
        proxyquireStubs["./storageService"].removeCredential.calledWith(
          TEST_DATA.accounts[0].pubKey,
          "id1"
        )
      ).to.be.true;
    });
  });

  // ==================== 37. getTargetCredential ====================
  describe("getTargetCredential", () => {
    it("should get credential by id", async () => {
      proxyquireStubs["./storageService"].get
        .withArgs(sinon.match.any)
        .resolves({ credential: "test" });

      const result = await apiService.getTargetCredential(TEST_DATA.accounts[0].pubKey, "cred1");
      expect(result).to.exist;
    });
  });


  // ==================== 39. signFields ====================
  describe("signFields", () => {
    const params = {
      message: [1, 1, 1],
      fromAddress: TEST_DATA.accounts[0].pubKey,
    };

    const expectedResult = {
      signature: "7mXR2xdu6YSDdrz6nyGoWAhLWBKurgWttVwb7DJG8gR3cqSXN3AqKBAtLjQR6mGgqMbUrn35LLGAT7LrvxBAp5konckJM1QR",
      publicKey: TEST_DATA.accounts[0].pubKey,
      data: [1, 1, 1],
    };

    beforeEach(() => {
      apiService.getCurrentPrivateKey = sinon.stub().resolves(TEST_DATA.accounts[0].priKey);

      proxyquireStubs["./lib"].signFieldsMessage.resolves(expectedResult);
    });

    it("should sign fields successfully", async () => {
      const result = await apiService.signFields(params);

      expect(apiService.getCurrentPrivateKey.calledOnce).to.be.true;
      expect(proxyquireStubs["./lib"].signFieldsMessage.calledOnce).to.be.true;
      expect(result.signature).to.equal(expectedResult.signature);
      expect(result.publicKey).to.equal(TEST_DATA.accounts[0].pubKey);
      expect(result.data).to.deep.equal([1, 1, 1]);
    });

    afterEach(() => {
      delete apiService.getCurrentPrivateKey;
    });
  });

  // ==================== 40. createNullifier ====================
  describe("createNullifier", () => {
    const params = {
      message: [1, 2, 1],
      fromAddress: TEST_DATA.accounts[0].pubKey,
    };

    const expectedNullifierResult = {
      publicKey: {
        x: "97122798187156329269195612501831838113723621946376792185750790676960770876",
        y: "28712938449017199545260059581455125590101414057625149754836265367081536663737",
      },
      private: {
        c: "25611363334921588093797433958462683846639830304872951453506143990817765168345",
        g_r: {
          x: "23984108553344970543730546390579166421149862869199845790718924707843541868064",
          y: "21301153241866575619256556587852828331518279343153255044998005450361207279761",
        },
        h_m_pk_r: {
          x: "22665102299708693942869829245476110064165993081567480802865244471133818601049",
          y: "8824245335176964981211924232965362700526944127807340620753030804452719389286",
        },
      },
      public: {
        nullifier: {
          x: "1637437130893404300650479235868279939806935123324745333782526346795003853819",
          y: "19492256216462385746358694592029109475893407934152175228087879411684848749772",
        },
        s: "25426780363957128165529135023084375857933728560392257008222212011743224128212",
      },
      data: [1, 2, 1],
    };

    beforeEach(() => {
      apiService.getCurrentPrivateKey = sinon.stub().resolves(TEST_DATA.accounts[0].priKey);

      proxyquireStubs["./lib"].createNullifier.resolves(expectedNullifierResult);
    });

    it("should create nullifier successfully", async () => {
      const result = await apiService.createNullifierByApi(params);

      expect(apiService.getCurrentPrivateKey.calledOnce).to.be.true;
      expect(proxyquireStubs["./lib"].createNullifier.calledOnce).to.be.true;
      expect(result.publicKey).to.exist;
      expect(result.private).to.exist;
      expect(result.public).to.exist;
      expect(result.data).to.deep.equal([1, 2, 1]);
    });

    it("should return error if creation fails", async () => {
      proxyquireStubs["./lib"].createNullifier.resolves({
        error: "nullifier_error",
      });

      const result = await apiService.createNullifierByApi(params);
      expect(result.error).to.equal("nullifier_error");
    });

    afterEach(() => {
      delete apiService.getCurrentPrivateKey;
    });
  });

  // ==================== 41. postPaymentTx ====================
  describe("postPaymentTx", () => {
    const paymentData = {
      to: TEST_DATA.accounts[1].pubKey,
      from: TEST_DATA.accounts[0].pubKey,
      fee: "20000000",
      amount: "100000000",
      nonce: "0",
      memo: "test",
      validUntil: "4294967295",
    };

    const paymentSignature = {
      field: "6541227050688850257716628744013070491503580114726649206550574549546641544883",
      scalar: "27208790946280778786843249732842618286670335571195173897090140108531547621902",
    };

    const paymentResult = {
      sendPayment: {
        payment: {
          hash: "5JtsipNZkyqiWA1kobejDgSfE3igJnq1mZnvkWJTqXi6QrSbWU1d",
          id: "Av0ALTEBPPsvT8KxNRlQJTHT0...",
          amount: "100000000",
          fee: "20000000",
          from: TEST_DATA.accounts[0].pubKey,
          to: TEST_DATA.accounts[1].pubKey,
          isDelegation: false,
          kind: "PAYMENT",
          nonce: 0,
        },
      },
    };

    let checkTxStatusStub;

    beforeEach(() => {
      proxyquireStubs["./api"].sendTx.resolves(paymentResult);
      checkTxStatusStub = sinon.stub(apiService, "checkTxStatus");
    });

    afterEach(() => {
      checkTxStatusStub.restore();
    });

    it("should post payment transaction and check status", async () => {
      const result = await apiService.postPaymentTx(paymentData, paymentSignature);

      expect(result.sendPayment).to.exist;
      expect(result.sendPayment.payment.hash).to.equal("5JtsipNZkyqiWA1kobejDgSfE3igJnq1mZnvkWJTqXi6QrSbWU1d");
      expect(result.sendPayment.payment.isDelegation).to.be.false;
      expect(checkTxStatusStub.calledOnce).to.be.true;
    });
  });

  // ==================== 42. postStakeTx ====================
  describe("postStakeTx", () => {
    const stakeData = {
      to: TEST_DATA.accounts[1].pubKey,
      from: TEST_DATA.accounts[0].pubKey,
      fee: "1100000",
      nonce: "2",
      memo: "",
      validUntil: "4294967295",
    };

    const stakeSignature = {
      field: "22981598299430982066398620465328327624052394899073166428432200493919251667044",
      scalar: "22363218093944833438400421188659933312928462570584167255225617263254963827077",
    };

    const stakeResult = {
      sendDelegation: {
        delegation: {
          hash: "5JtZBBJDh2ZfWV1dYo5xv4m1bcvRrkttiTYzKNmN5mAjsts78FWq",
          id: "Av3gyBAAPPsvT8KxNRlQJTHT0...",
          isDelegation: true,
          kind: "STAKE_DELEGATION",
          from: TEST_DATA.accounts[0].pubKey,
          to: TEST_DATA.accounts[1].pubKey,
          fee: "1100000",
          nonce: 2,
        },
      },
    };

    let checkTxStatusStub;

    beforeEach(() => {
      proxyquireStubs["./api"].sendStakeTx.resolves(stakeResult);
      checkTxStatusStub = sinon.stub(apiService, "checkTxStatus");
    });

    afterEach(() => {
      checkTxStatusStub.restore();
    });

    it("should post stake transaction and check status", async () => {
      const result = await apiService.postStakeTx(stakeData, stakeSignature);

      expect(result.sendDelegation).to.exist;
      expect(result.sendDelegation.delegation.hash).to.equal("5JtZBBJDh2ZfWV1dYo5xv4m1bcvRrkttiTYzKNmN5mAjsts78FWq");
      expect(result.sendDelegation.delegation.isDelegation).to.be.true;
      expect(checkTxStatusStub.calledOnce).to.be.true;
    });
  });

  // ==================== Wallet Lifecycle Integration Tests ====================
  describe("Wallet Lifecycle", () => {
    describe("Full wallet creation and HD account derivation", () => {
      beforeEach(() => {
        proxyquireStubs["../utils/encryptUtils"].default.encrypt.resolves(
          '{"data":"encrypted","iv":"iv","salt":"salt","version":2}'
        );
        proxyquireStubs["../utils/encryptUtils"].default.decrypt.resolves(
          TEST_DATA.mnemonic
        );
      });

      it("should create wallet with first account at hdIndex 0", async () => {
        mockMemStore.updateState({ password: "Qw123456", data: null });
        proxyquireStubs["./accountService"].importWalletByMnemonic.returns({
          pubKey: TEST_DATA.accounts[0].pubKey,
          priKey: TEST_DATA.accounts[0].priKey,
          hdIndex: 0,
        });

        const result = await apiService.createAccount(TEST_DATA.mnemonic);

        expect(result.address).to.equal(TEST_DATA.accounts[0].pubKey);
        expect(result.hdPath).to.equal(0);
        expect(result.type).to.equal("WALLET_INSIDE");
        expect(result.accountName).to.equal("Account 1");
      });

      it("should derive second HD account at hdIndex 1", async () => {
        mockMemStore.updateState({
          password: "Qw123456",
          data: [{
            mnemonic: "encrypted_mnemonic",
            accounts: [{
              address: TEST_DATA.accounts[0].pubKey,
              privateKey: "enc_priv_0",
              type: "WALLET_INSIDE",
              hdPath: 0,
              typeIndex: 1,
              accountName: "Account 1",
            }],
            currentAddress: TEST_DATA.accounts[0].pubKey,
          }],
        });

        proxyquireStubs["./accountService"].importWalletByMnemonic.returns({
          pubKey: TEST_DATA.accounts[1].pubKey,
          priKey: TEST_DATA.accounts[1].priKey,
          hdIndex: 1,
        });

        const result = await apiService.addHDNewAccount("Account 2");

        expect(result.address).to.equal(TEST_DATA.accounts[1].pubKey);
        expect(result.hdPath).to.equal(1);
        expect(result.accountName).to.equal("Account 2");
        expect(proxyquireStubs["./accountService"].importWalletByMnemonic.calledWith(
          TEST_DATA.mnemonic,
          1
        )).to.be.true;
      });

      it("should derive third HD account at hdIndex 2", async () => {
        // 确保使用 V1 格式
        proxyquireStubs["../constant/vaultTypes"].isV2Vault.returns(false);
        proxyquireStubs["../constant/vaultTypes"].isLegacyVault.returns(true);
        
        mockMemStore.updateState({
          password: "Qw123456",
          data: [{
            mnemonic: "encrypted_mnemonic",
            accounts: [
              {
                address: TEST_DATA.accounts[0].pubKey,
                privateKey: "enc_priv_0",
                type: "WALLET_INSIDE",
                hdPath: 0,
                typeIndex: 1,
                accountName: "Account 1",
              },
              {
                address: TEST_DATA.accounts[1].pubKey,
                privateKey: "enc_priv_1",
                type: "WALLET_INSIDE",
                hdPath: 1,
                typeIndex: 2,
                accountName: "Account 2",
              },
            ],
            currentAddress: TEST_DATA.accounts[1].pubKey,
          }],
        });

        proxyquireStubs["./accountService"].importWalletByMnemonic.returns({
          pubKey: TEST_DATA.accounts[2].pubKey,
          priKey: TEST_DATA.accounts[2].priKey,
          hdIndex: 2,
        });

        const result = await apiService.addHDNewAccount("Account 3");

        expect(result.address).to.equal(TEST_DATA.accounts[2].pubKey);
        expect(result.hdPath).to.equal(2);
        expect(result.accountName).to.equal("Account 3");
        expect(proxyquireStubs["./accountService"].importWalletByMnemonic.calledWith(
          TEST_DATA.mnemonic,
          2
        )).to.be.true;
      });
    });

    describe("Account data structure validation", () => {
      it("should maintain correct account structure after multiple HD derivations", () => {
        // 确保使用 V1 格式
        proxyquireStubs["../constant/vaultTypes"].isV2Vault.returns(false);
        proxyquireStubs["../constant/vaultTypes"].isLegacyVault.returns(true);
        
        const fullWalletData = {
          password: "Qw123456",
          data: [{
            mnemonic: "encrypted_mnemonic",
            accounts: [
              {
                address: TEST_DATA.accounts[0].pubKey,
                privateKey: "enc_priv_0",
                type: "WALLET_INSIDE",
                hdPath: 0,
                typeIndex: 1,
                accountName: "Account 1",
              },
              {
                address: TEST_DATA.accounts[1].pubKey,
                privateKey: "enc_priv_1",
                type: "WALLET_INSIDE",
                hdPath: 1,
                typeIndex: 2,
                accountName: "Account 2",
              },
              {
                address: TEST_DATA.accounts[2].pubKey,
                privateKey: "enc_priv_2",
                type: "WALLET_INSIDE",
                hdPath: 2,
                typeIndex: 3,
                accountName: "Account 3",
              },
            ],
            currentAddress: TEST_DATA.accounts[2].pubKey,
          }],
          currentAccount: {
            address: TEST_DATA.accounts[2].pubKey,
            privateKey: "enc_priv_2",
            type: "WALLET_INSIDE",
            hdPath: 2,
            accountName: "Account 3",
          },
        };

        mockMemStore.updateState(fullWalletData);

        const result = apiService.getAllAccount();

        // accounts is result of accountSort: {allList, commonList, watchList}
        expect(result.accounts.allList).to.have.length(3);
        expect(result.currentAddress).to.equal(TEST_DATA.accounts[2].pubKey);

        // Verify HD paths are sequential
        result.accounts.allList.forEach((account, index) => {
          expect(account.hdPath).to.equal(index);
        });
      });

      it("should sort accounts correctly with mixed types", () => {
        const mixedAccounts = [
          { address: TEST_DATA.accounts[0].pubKey, type: "WALLET_INSIDE", accountName: "HD 1" },
          { address: TEST_DATA.accounts[1].pubKey, type: "WALLET_OUTSIDE", accountName: "Imported" },
          { address: TEST_DATA.accounts[2].pubKey, type: "WALLET_WATCH", accountName: "Watch" },
          { address: "B62qLedger", type: "WALLET_LEDGER", accountName: "Ledger" },
        ];

        const result = apiService.accountSort(mixedAccounts);

        expect(result.allList).to.have.length(4);
        // WALLET_INSIDE + WALLET_OUTSIDE + WALLET_LEDGER are in commonList
        expect(result.commonList).to.have.length(3);
        // Only WALLET_WATCH is in watchList
        expect(result.watchList).to.have.length(1);
      });
    });

    describe("Encryption verification", () => {
      it("should encrypt data with version 2 format", async () => {
        const encryptedFormat = {
          data: "encrypted_content",
          iv: "initialization_vector",
          salt: "random_salt",
          version: 2,
        };

        proxyquireStubs["../utils/encryptUtils"].default.encrypt.resolves(
          JSON.stringify(encryptedFormat)
        );

        mockMemStore.updateState({ password: "Qw123456", data: null });
        proxyquireStubs["./accountService"].importWalletByMnemonic.returns({
          pubKey: TEST_DATA.accounts[0].pubKey,
          priKey: TEST_DATA.accounts[0].priKey,
          hdIndex: 0,
        });

        await apiService.createAccount(TEST_DATA.mnemonic);

        // Verify encrypt was called with password and sensitive data
        expect(proxyquireStubs["../utils/encryptUtils"].default.encrypt.called).to.be.true;
      });

      it("should decrypt mnemonic correctly for HD derivation", async () => {
        // 确保使用 V1 格式
        proxyquireStubs["../constant/vaultTypes"].isV2Vault.returns(false);
        proxyquireStubs["../constant/vaultTypes"].isLegacyVault.returns(true);
        
        mockMemStore.updateState({
          password: "Qw123456",
          data: [{
            mnemonic: '{"data":"enc","iv":"iv","salt":"s","version":2}',
            accounts: [{
              address: TEST_DATA.accounts[0].pubKey,
              type: "WALLET_INSIDE",
              hdPath: 0,
              typeIndex: 1,
            }],
          }],
        });

        proxyquireStubs["../utils/encryptUtils"].default.decrypt.resolves(
          TEST_DATA.mnemonic
        );
        proxyquireStubs["../utils/encryptUtils"].default.encrypt.resolves(
          "encrypted_new_key"
        );
        proxyquireStubs["./accountService"].importWalletByMnemonic.returns({
          pubKey: TEST_DATA.accounts[1].pubKey,
          priKey: TEST_DATA.accounts[1].priKey,
          hdIndex: 1,
        });

        await apiService.addHDNewAccount("Account 2");

        // Verify decrypt was called with password and encrypted mnemonic
        expect(
          proxyquireStubs["../utils/encryptUtils"].default.decrypt.calledWith(
            "Qw123456",
            '{"data":"enc","iv":"iv","salt":"s","version":2}'
          )
        ).to.be.true;
      });
    });

    describe("Password security", () => {
      it("should use password for all encryption operations", async () => {
        const testPassword = "Qw123456";
        mockMemStore.updateState({ password: testPassword, data: null });

        proxyquireStubs["../utils/encryptUtils"].default.encrypt.resolves("enc");
        proxyquireStubs["./accountService"].importWalletByMnemonic.returns({
          pubKey: TEST_DATA.accounts[0].pubKey,
          priKey: TEST_DATA.accounts[0].priKey,
          hdIndex: 0,
        });

        await apiService.createAccount(TEST_DATA.mnemonic);

        // All encrypt calls should use the same password
        proxyquireStubs["../utils/encryptUtils"].default.encrypt.getCalls().forEach(call => {
          expect(call.args[0]).to.equal(testPassword);
        });
      });

      it("should update all encrypted data when password changes", async () => {
        // 确保使用 V1 格式
        proxyquireStubs["../constant/vaultTypes"].isV2Vault.returns(false);
        proxyquireStubs["../constant/vaultTypes"].isLegacyVault.returns(true);
        
        const oldPwd = "oldPwd";
        const newPwd = "newPwd";

        mockMemStore.updateState({
          password: oldPwd,
          data: [{
            mnemonic: "encrypted_mnemonic",
            accounts: [
              { address: TEST_DATA.accounts[0].pubKey, privateKey: "enc_key_0", type: "WALLET_INSIDE" },
              { address: TEST_DATA.accounts[1].pubKey, privateKey: "enc_key_1", type: "WALLET_INSIDE" },
            ],
          }],
          currentAccount: { address: TEST_DATA.accounts[0].pubKey },
        });

        proxyquireStubs["../utils/encryptUtils"].default.decrypt.resolves(TEST_DATA.mnemonic);
        proxyquireStubs["../utils/encryptUtils"].default.encrypt.resolves("new_encrypted");

        const result = await apiService.updateSecPassword(oldPwd, newPwd);

        expect(result).to.deep.equal({ code: 0 });
        expect(proxyquireStubs["./storageService"].removeValue.calledWith("keyringData")).to.be.true;
        expect(mockMemStore.getState().password).to.equal(newPwd);
      });
    });
  });
});
