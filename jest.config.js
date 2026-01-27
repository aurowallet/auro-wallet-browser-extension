/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/test/jest/**/*.test.ts',
    '<rootDir>/test/jest/**/*.test.js',
  ],
  
  // Module path aliases (match tsconfig.json paths)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^webextension-polyfill$': '<rootDir>/test/jest/__mocks__/webextension-polyfill.ts',
  },
  
  // Transform TypeScript and JavaScript files
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
    }],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/test/jest/setup.ts'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Timeout
  testTimeout: 10000,

  // Transform ESM modules in node_modules and test data
  transformIgnorePatterns: [
    '/node_modules/(?!(@aurowallet/mina-provider|@scure|@noble|mina-signer)/)',
  ],

  // Allow test data files to be transformed
  modulePathIgnorePatterns: [],
};
