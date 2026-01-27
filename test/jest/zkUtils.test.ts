/**
 * ZkUtils Test - Migrated from Mocha to Jest
 */
import {
  getZkInfo,
  zkCommondFormat,
  getZkFee,
  verifyTokenCommand,
  getAccountUpdateCount,
  getZkAppUpdateInfo,
} from '@/utils/zkUtils';

describe('ZkUtils Test Case', () => {
  const sampleZkCommand = {
    feePayer: {
      body: {
        publicKey: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32',
        fee: '0',
        validUntil: null,
        nonce: '609',
      },
      authorization: '7mWxjLYgbJUkZNcGouvhVj5tJ8yu9hoexb9ntvPK8t5LHqzmrL6QJjjKtf5SgmxB4QWkDw7qoMMbbNGtHVpsbJHPyTy2EzRQ',
    },
    accountUpdates: [
      {
        body: {
          publicKey: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32',
          tokenId: 'wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf',
          balanceChange: { magnitude: '1000000000', sgn: 'Negative' },
        },
      },
      {
        body: {
          publicKey: 'B62qq6g5TAd8kgn8hVX4KiPLfrPrsyTq544Mt48SCuvKau3EXgwbmGM',
          tokenId: 'wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf',
          balanceChange: { magnitude: '0', sgn: 'Positive' },
        },
      },
    ],
    memo: 'E4YM2vTHhWEg66xpj52JErHUBU4pZ1yageL4TVDDpTTSsv8mK6YaH',
  };

  describe('getZkInfo', () => {
    it('should return zk body base info', () => {
      const result = getZkInfo(
        JSON.stringify(sampleZkCommand),
        'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32'
      );
      
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]!.label).toBe('feePayer');
    });
  });

  describe('zkCommondFormat', () => {
    it('should format zk body from object', () => {
      const result = zkCommondFormat(sampleZkCommand);
      expect(typeof result).toBe('string');
      expect(result).toContain('feePayer');
    });

    it('should format zk body from string', () => {
      const result = zkCommondFormat(JSON.stringify(sampleZkCommand));
      expect(typeof result).toBe('string');
    });
  });

  describe('getZkFee', () => {
    it('should return fee from zk command', () => {
      const result = getZkFee(sampleZkCommand as any);
      expect(result).toBe(0);
    });
  });

  describe('getAccountUpdateCount', () => {
    it('should return zk update count', () => {
      const zkCommand = {
        accountUpdates: [
          { body: { publicKey: 'B62q1' } },
          { body: { publicKey: 'B62q2' } },
        ],
      };
      
      const result = getAccountUpdateCount(JSON.stringify(zkCommand));
      expect(result).toBe(2);
    });
  });

  describe('getZkAppUpdateInfo', () => {
    it('should return zk body update info', () => {
      const accountUpdates = [
        {
          body: {
            publicKey: 'B62qjRo6ZvobRG7kraAnyNU9X7Rw9wUxD8hz1Q2gTjS5FLAMk8We2Zz',
            tokenId: 'wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf',
            balanceChange: { magnitude: '0', sgn: 'Positive' },
            update: {
              appState: ['NULL', 'NULL', 'NULL', 'NULL', 'NULL', 'NULL', 'NULL', 'NULL'],
              tokenSymbol: 'NULL',
              zkappUri: null,
            },
          },
        },
        {
          body: {
            publicKey: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32',
            tokenId: 'xajT4UZbYBicT2C7iJtM4CAFHH6dcwFPCbJ2nv3AeCn6t3s9Ze',
            balanceChange: { magnitude: '-1300000000', sgn: 'Negative' },
            update: {
              appState: ['NULL', 'NULL', 'NULL', 'NULL', 'NULL', 'NULL', 'NULL', 'NULL'],
              tokenSymbol: 'NULL',
              zkappUri: null,
            },
          },
        },
        {
          body: {
            publicKey: 'B62qm3V7qSQ97Stgo2MXv4Apof2cVezZyP1VYJ8DfrVNy9yfqKZxLQf',
            tokenId: 'xajT4UZbYBicT2C7iJtM4CAFHH6dcwFPCbJ2nv3AeCn6t3s9Ze',
            balanceChange: { magnitude: '1300000000', sgn: 'Positive' },
            update: {
              appState: ['NULL', 'NULL', 'NULL', 'NULL', 'NULL', 'NULL', 'NULL', 'NULL'],
              tokenSymbol: 'NULL',
              zkappUri: null,
            },
          },
        },
      ];

      const result = getZkAppUpdateInfo(
        accountUpdates as any,
        'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32',
        'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32',
        'xajT4UZbYBicT2C7iJtM4CAFHH6dcwFPCbJ2nv3AeCn6t3s9Ze'
      );

      expect(result).toEqual({
        totalBalanceChange: '1300000000',
        symbol: '-',
        updateCount: '3',
        from: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32',
        to: 'B62qm3V7qSQ97Stgo2MXv4Apof2cVezZyP1VYJ8DfrVNy9yfqKZxLQf',
        isZkReceive: false,
      });
    });
  });
});
