/**
 * messageListener sender.id verification tests
 *
 * Verifies that internalMessageListener rejects messages
 * from senders whose id !== browser.runtime.id (defense-in-depth).
 */

// ============ Mocks ============

const SELF_EXTENSION_ID = 'auro-wallet-extension-id';
const FAKE_EXTENSION_ID = 'malicious-extension-id';

const mockOnMessageAddListener = jest.fn();
const mockOnConnectAddListener = jest.fn();
const mockOnClickedAddListener = jest.fn();
const mockOnRemovedAddListener = jest.fn();
const mockOnStartupAddListener = jest.fn();

const mockMsgBrowser = {
  runtime: {
    id: SELF_EXTENSION_ID,
    getManifest: jest.fn(() => ({ manifest_version: 3 })),
    sendMessage: jest.fn().mockResolvedValue(undefined),
    onMessage: { addListener: mockOnMessageAddListener, removeListener: jest.fn() },
    onConnect: { addListener: mockOnConnectAddListener },
    onStartup: { addListener: mockOnStartupAddListener },
    getURL: jest.fn((path: string) => `chrome-extension://${SELF_EXTENSION_ID}/${path}`),
  },
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
    },
  },
  tabs: {
    query: jest.fn().mockResolvedValue([]),
    sendMessage: jest.fn().mockResolvedValue(undefined),
    create: jest.fn().mockResolvedValue({ id: 1 }),
    onRemoved: { addListener: mockOnRemovedAddListener },
  },
  action: {
    onClicked: { addListener: mockOnClickedAddListener },
    setIcon: jest.fn().mockResolvedValue(undefined),
    setBadgeText: jest.fn().mockResolvedValue(undefined),
    setBadgeBackgroundColor: jest.fn().mockResolvedValue(undefined),
  },
  browserAction: {
    onClicked: { addListener: mockOnClickedAddListener },
    setIcon: jest.fn().mockResolvedValue(undefined),
  },
  windows: {
    create: jest.fn().mockResolvedValue({ id: 1 }),
    getAll: jest.fn().mockResolvedValue([]),
  },
  notifications: {
    create: jest.fn().mockResolvedValue('notification-id'),
  },
  alarms: {
    create: jest.fn(),
    onAlarm: { addListener: jest.fn() },
  },
};

jest.mock('webextension-polyfill', () => mockMsgBrowser);
export {}; // Make this file a module to avoid TS block-scope conflicts

// Mock apiService to prevent real initialization
jest.mock('@/background/apiService', () => ({
  __esModule: true,
  default: {
    getLockStatus: jest.fn().mockReturnValue(false),
    getCurrentAccount: jest.fn().mockResolvedValue(null),
    getAllAccount: jest.fn().mockReturnValue([]),
    setLastActiveTime: jest.fn(),
    getCurrentAutoLockTime: jest.fn().mockReturnValue(5),
    getVaultVersion: jest.fn().mockReturnValue('v3'),
  },
}));

jest.mock('@/background/DappService', () => ({
  __esModule: true,
  default: {
    handleMessage: jest.fn().mockResolvedValue(undefined),
    clearAllPendingZk: jest.fn(),
    getSignParamsByOpenId: jest.fn(),
    getSignParams: jest.fn().mockReturnValue([]),
    getAllPendingZK: jest.fn().mockReturnValue([]),
    getAllTokenSignParams: jest.fn().mockReturnValue([]),
    getApproveParams: jest.fn(),
    setupProviderConnection: jest.fn(),
    portDisconnectListener: jest.fn(),
  },
}));

jest.mock('@/background/storageService', () => ({
  get: jest.fn().mockResolvedValue({}),
  save: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/utils/popup', () => ({
  startExtensionPopup: jest.fn(),
  createOrActivateTab: jest.fn(),
  lastWindowIds: {},
  PopupSize: { width: 375, height: 600 },
  startPopupWindow: jest.fn(),
  closePopupWindow: jest.fn(),
}));

jest.mock('@/utils/browserUtils', () => ({
  getExtensionAction: jest.fn(() => ({
    onClicked: { addListener: jest.fn() },
  })),
  getCurrentNodeConfig: jest.fn(),
  getLocalNetworkList: jest.fn(),
}));

// Mock `self` for Service Worker environment
(globalThis as any).self = globalThis;

// Mock `chrome` for offscreen API
(globalThis as any).chrome = {};

// ============ Tests ============

describe('messageListener sender.id verification', () => {
  let internalMessageListener: Function;

  beforeAll(() => {
    // Import the module and call setupMessageListeners to register the listener
    const { setupMessageListeners } = require('@/background/messageListener');
    setupMessageListeners();

    // Extract the registered listener from the mock
    expect(mockOnMessageAddListener).toHaveBeenCalled();
    internalMessageListener = mockOnMessageAddListener.mock.calls[0][0];
    expect(typeof internalMessageListener).toBe('function');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Restore runtime.id after each test (in case a test modifies it)
    mockMsgBrowser.runtime.id = SELF_EXTENSION_ID;
  });

  // ---- Test 1: Same extension sender passes ----
  describe('same extension (legitimate sender)', () => {
    it('should process message when sender.id matches browser.runtime.id', () => {
      const sender = { id: SELF_EXTENSION_ID };
      const sendResponse = jest.fn();
      const message = { action: 'GET_WALLET_LOCK_STATUS' };

      const result = internalMessageListener(message, sender, sendResponse);

      // Should return true (message was handled)
      expect(result).toBe(true);
      // sendResponse should have been called (GET_WALLET_LOCK_STATUS is synchronous)
      expect(sendResponse).toHaveBeenCalled();
    });

    it('should process DApp messages when sender.id matches', () => {
      const sender = { id: SELF_EXTENSION_ID };
      const sendResponse = jest.fn();
      const message = {
        messageSource: 'messageFromDapp',
        action: 'mina_requestAccounts',
        payload: { id: '1', site: { origin: 'https://example.com' } },
      };

      const result = internalMessageListener(message, sender, sendResponse);
      expect(result).toBe(true);
    });
  });

  // ---- Test 2: Foreign extension sender rejected ----
  describe('foreign extension (malicious sender)', () => {
    it('should reject message when sender.id does not match', () => {
      const sender = { id: FAKE_EXTENSION_ID };
      const sendResponse = jest.fn();
      const message = { action: 'GET_WALLET_LOCK_STATUS' };

      const result = internalMessageListener(message, sender, sendResponse);

      // Should return false (message was rejected)
      expect(result).toBe(false);
      // sendResponse should NOT have been called
      expect(sendResponse).not.toHaveBeenCalled();
    });

    it('should reject sensitive operations from foreign sender', () => {
      const sender = { id: FAKE_EXTENSION_ID };
      const sendResponse = jest.fn();

      // Attempt to get mnemonic
      const mneMsg = {
        action: 'WALLET_GET_MNE',
        payload: { password: 'attacker-guess' },
      };
      expect(internalMessageListener(mneMsg, sender, sendResponse)).toBe(false);
      expect(sendResponse).not.toHaveBeenCalled();

      // Attempt to get private key
      const pkMsg = {
        action: 'WALLET_GET_PRIVATE_KEY',
        payload: { address: 'B62q...', password: 'attacker-guess' },
      };
      expect(internalMessageListener(pkMsg, sender, sendResponse)).toBe(false);
      expect(sendResponse).not.toHaveBeenCalled();

      // Attempt to submit password
      const pwdMsg = {
        action: 'WALLET_APP_SUBMIT_PWD',
        payload: { password: 'attacker-guess' },
      };
      expect(internalMessageListener(pwdMsg, sender, sendResponse)).toBe(false);
      expect(sendResponse).not.toHaveBeenCalled();
    });

    it('should reject DApp messages from foreign sender', () => {
      const sender = { id: FAKE_EXTENSION_ID };
      const sendResponse = jest.fn();
      const message = {
        messageSource: 'messageFromDapp',
        action: 'mina_requestAccounts',
        payload: { id: '1', site: { origin: 'https://evil.com' } },
      };

      const result = internalMessageListener(message, sender, sendResponse);
      expect(result).toBe(false);
      expect(sendResponse).not.toHaveBeenCalled();
    });

    it('should reject when sender.id is undefined', () => {
      const sender = { id: undefined };
      const sendResponse = jest.fn();
      const message = { action: 'GET_WALLET_LOCK_STATUS' };

      const result = internalMessageListener(message, sender, sendResponse);
      expect(result).toBe(false);
      expect(sendResponse).not.toHaveBeenCalled();
    });
  });

  // ---- Test 3: Edge cases ----
  describe('edge cases', () => {
    it('should still reject null/invalid messages from same extension after sender check passes', () => {
      const sender = { id: SELF_EXTENSION_ID };
      const sendResponse = jest.fn();

      // null message - passes sender check, then rejected by message validation
      expect(internalMessageListener(null, sender, sendResponse)).toBe(false);

      // non-object message
      expect(internalMessageListener('string', sender, sendResponse)).toBe(false);
    });

    it('should reject empty string sender.id', () => {
      const sender = { id: '' };
      const sendResponse = jest.fn();
      const message = { action: 'GET_WALLET_LOCK_STATUS' };

      const result = internalMessageListener(message, sender, sendResponse);
      expect(result).toBe(false);
    });
  });
});
