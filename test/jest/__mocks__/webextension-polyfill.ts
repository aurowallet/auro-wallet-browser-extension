/**
 * Mock for webextension-polyfill
 * Used by Jest for testing browser extension APIs
 */

const browser = {
  runtime: {
    getManifest: jest.fn(() => ({ manifest_version: 3 })),
    sendMessage: jest.fn().mockResolvedValue(undefined),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    id: 'mock-extension-id',
    getURL: jest.fn((path: string) => `chrome-extension://mock-id/${path}`),
  },
  
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
    },
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  
  tabs: {
    query: jest.fn().mockResolvedValue([]),
    sendMessage: jest.fn().mockResolvedValue(undefined),
    create: jest.fn().mockResolvedValue({ id: 1 }),
    update: jest.fn().mockResolvedValue({}),
  },
  
  windows: {
    create: jest.fn().mockResolvedValue({ id: 1 }),
    update: jest.fn().mockResolvedValue({}),
    remove: jest.fn().mockResolvedValue(undefined),
    getAll: jest.fn().mockResolvedValue([]),
    getCurrent: jest.fn().mockResolvedValue({ id: 1 }),
  },
  
  action: {
    setIcon: jest.fn().mockResolvedValue(undefined),
    setBadgeText: jest.fn().mockResolvedValue(undefined),
    setBadgeBackgroundColor: jest.fn().mockResolvedValue(undefined),
  },
  
  browserAction: {
    setIcon: jest.fn().mockResolvedValue(undefined),
    setBadgeText: jest.fn().mockResolvedValue(undefined),
    setBadgeBackgroundColor: jest.fn().mockResolvedValue(undefined),
  },
  
  alarms: {
    create: jest.fn(),
    clear: jest.fn().mockResolvedValue(true),
    onAlarm: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  
  notifications: {
    create: jest.fn().mockResolvedValue('notification-id'),
    clear: jest.fn().mockResolvedValue(true),
  },
};

export default browser;
module.exports = browser;
module.exports.default = browser;
