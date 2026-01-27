/**
 * Jest Setup File
 * This file runs before each test file
 */

// Use Node.js crypto for Web Crypto API
import { webcrypto } from 'crypto';

// Setup global crypto with full Web Crypto API support
Object.defineProperty(globalThis, 'crypto', {
  value: webcrypto,
  writable: true,
  configurable: true,
});

// Setup global window/document mocks for browser-specific code
Object.defineProperty(globalThis, 'window', {
  value: {
    crypto: globalThis.crypto,
    location: {
      origin: 'chrome-extension://mock-id',
      href: 'chrome-extension://mock-id/index.html',
    },
  },
  writable: true,
});

// Fix for node-forge URL issue in Node.js environment
Object.defineProperty(globalThis, 'location', {
  value: {
    origin: 'chrome-extension://mock-id',
    href: 'chrome-extension://mock-id/index.html',
  },
  writable: true,
});

Object.defineProperty(globalThis, 'document', {
  value: {
    createElement: () => ({}),
    body: { appendChild: () => {}, removeChild: () => {} },
  },
  writable: true,
});

// Setup localStorage mock
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    data: {} as Record<string, string>,
    getItem(key: string) { return this.data[key]; },
    setItem(key: string, value: string) { this.data[key] = value; },
    removeItem(key: string) { delete this.data[key]; },
    clear() { this.data = {}; },
  },
  writable: true,
});

// Setup navigator mock
Object.defineProperty(globalThis, 'navigator', {
  value: {
    userAgent: 'node',
    language: 'en-US',
  },
  writable: true,
});
