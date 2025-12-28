// test/babel-register.js

const Module = require('module');
const path = require('path');
const originalRequire = Module.prototype.require;

const mockPath = path.resolve(__dirname, 'mocks', 'webextension-polyfill.js');
const mockBrowser = require(mockPath);

Module.prototype.require = function (id) {
  if (id === 'webextension-polyfill' || id.includes('webextension-polyfill')) {
    return mockBrowser;
  }
  return originalRequire.apply(this, arguments);
};

global.crypto = global.crypto || {
  randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9),
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