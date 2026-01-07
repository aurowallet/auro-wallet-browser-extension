// test/babel-register.js

const Module = require('module');
const path = require('path');
const originalRequire = Module.prototype.require;

const mockPath = path.resolve(__dirname, 'mocks', 'webextension-polyfill.js');
const mockBrowser = require(mockPath);

// Mock browser extension polyfill BEFORE any other imports
Module.prototype.require = function (id) {
  // Mock webextension-polyfill
  if (id === 'webextension-polyfill' || id.includes('webextension-polyfill')) {
    return mockBrowser;
  }
  return originalRequire.apply(this, arguments);
};

// Setup global crypto for UUID generation
global.crypto = global.crypto || {
  randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9),
  getRandomValues: (arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  },
};

// Setup global window/document mocks for browser-specific code
global.window = global.window || {
  crypto: global.crypto,
  location: { 
    origin: 'chrome-extension://mock-id',
    href: 'chrome-extension://mock-id/index.html',
  },
};

// Fix for node-forge URL issue in Node.js environment
if (typeof global.location === 'undefined') {
  global.location = global.window.location;
}

global.document = global.document || {
  createElement: () => ({}),
  body: { appendChild: () => {}, removeChild: () => {} },
};

// Setup localStorage mock
global.localStorage = global.localStorage || {
  data: {},
  getItem(key) { return this.data[key]; },
  setItem(key, value) { this.data[key] = value; },
  removeItem(key) { delete this.data[key]; },
  clear() { this.data = {}; },
};

// Setup navigator mock
global.navigator = global.navigator || {
  userAgent: 'node',
  language: 'en-US',
};

require("@babel/register")({
  extensions: [".js", ".jsx", ".ts", ".tsx"],
  ignore: [/node_modules\/(?!@aurowallet\/mina-provider)/],
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    "@babel/preset-react"
  ],
  plugins: [
    "@babel/plugin-transform-class-properties",
    ["@babel/plugin-transform-runtime", { regenerator: true }],
    ["module-resolver", { root: ["./"], alias: { "@": "./src" } }],
  ],
});