/**
 * Reducer Utils Test - Migrated from Mocha to Jest
 */
import {
  processTokenList,
  processTokenShowStatus,
  processNewTokenStatus,
  formatPendingTx,
  setScamAndTxList,
  formatAllTxHistory,
} from '@/utils/reducer';

describe('Reducer Utils Test', () => {
  // Test data
  const tokenNetInfo = [
    {
      tokenId: 'xvoiUpngKPVLAqjqKb5qXQvQBmk9DncPEaGJXzehoRSNrDB45r',
      name: 'TEST',
      symbol: 'pqhx2',
      decimal: '8',
      address: 'B62qjZkcgoTT4W1KB2GvmRxe4EX5W5quTDyzRiFjRPJXbhFAG1m2rkt',
      iconUrl: 'https://example.com/icon.png',
    },
  ];

  const accountTokens = [
    {
      balance: { total: '19331533399', liquid: '19331533399' },
      inferredNonce: '918',
      delegateAccount: {
        publicKey: 'B62qq3TQ8AP7MFYPVtMx5tZGF3kWLJukfwG1A1RGvaBW1jfTPTkDBW6',
      },
      tokenId: 'wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf',
      publicKey: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32',
      zkappUri: null,
      tokenNetInfo: null,
    },
    {
      balance: { total: '4803254321', liquid: '4803254321' },
      inferredNonce: '0',
      delegateAccount: null,
      tokenId: 'xvoiUpngKPVLAqjqKb5qXQvQBmk9DncPEaGJXzehoRSNrDB45r',
      publicKey: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32',
      zkappUri: null,
      tokenNetInfo: {
        publicKey: 'B62qjZkcgoTT4W1KB2GvmRxe4EX5W5quTDyzRiFjRPJXbhFAG1m2rkt',
        tokenSymbol: 'pqhx2',
        zkappState: ['8', '0', '0', '0', '0', '0', '0', '0'],
      },
    },
  ];

  describe('processTokenList', () => {
    it('should return parse token assets', () => {
      const result = processTokenList(
        tokenNetInfo as any,
        accountTokens as any,
        { wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf: 0.166733 },
        [],
        {}
      );

      expect(result).toHaveProperty('tokenList');
      expect(result).toHaveProperty('tokenShowList');
      expect(result).toHaveProperty('mainTokenNetInfo');
    });
  });

  describe('processTokenShowStatus', () => {
    it('should update token display status', () => {
      const tokenList = [
        {
          tokenId: 'wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf',
          localConfig: { hideToken: false },
          tokenBaseInfo: { tokenShowed: false, showAmount: '0' },
        },
        {
          tokenId: 'xLpobAxWSYZeyKuiEb4kzHHYQKn6X1vKmFR4Dmz9TCADLrYTD1',
          localConfig: { hideToken: true },
          tokenBaseInfo: { tokenShowed: false, showAmount: '0' },
        },
      ];

      const localConfigChange = {
        xLpobAxWSYZeyKuiEb4kzHHYQKn6X1vKmFR4Dmz9TCADLrYTD1: { hideToken: false },
      };

      const result = processTokenShowStatus(
        tokenList as any,
        localConfigChange,
        'xLpobAxWSYZeyKuiEb4kzHHYQKn6X1vKmFR4Dmz9TCADLrYTD1'
      );

      expect(result).toHaveProperty('tokenList');
      expect(result).toHaveProperty('tokenShowList');
      expect(Array.isArray(result.tokenList)).toBe(true);
      const updatedToken = result.tokenList.find(
        (t: any) => t.tokenId === 'xLpobAxWSYZeyKuiEb4kzHHYQKn6X1vKmFR4Dmz9TCADLrYTD1'
      );
      expect(updatedToken?.localConfig?.hideToken).toBe(false);
    });
  });

  describe('processNewTokenStatus', () => {
    it('should update new token display status', () => {
      const tokenList = [
        {
          tokenId: 'token1',
          localConfig: { hideToken: false },
          tokenBaseInfo: { tokenShowed: false },
        },
        {
          tokenId: 'token2',
          localConfig: { hideToken: false },
          tokenBaseInfo: { tokenShowed: false },
        },
      ];

      // Pass array of already shown token IDs
      const result = processNewTokenStatus(tokenList as any, ['token2']);

      expect(result).toHaveProperty('tokenList');
      expect(Array.isArray(result.tokenList)).toBe(true);
      // token1 is NOT in showedTokenIdList, so tokenShowed should be false
      const token1 = result.tokenList.find((t: any) => t.tokenId === 'token1');
      expect(token1?.tokenBaseInfo.tokenShowed).toBe(false);
      // token2 IS in showedTokenIdList, so tokenShowed should be true
      const token2 = result.tokenList.find((t: any) => t.tokenId === 'token2');
      expect(token2?.tokenBaseInfo.tokenShowed).toBe(true);
    });
  });

  describe('formatPendingTx', () => {
    it('should format pending transaction list', () => {
      const pendingTxList = [
        {
          id: 'tx123',
          hash: '5Jv...',
          kind: 'PAYMENT',
          from: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32',
          to: 'B62qm3V7qSQ97Stgo2MXv4Apof2cVezZyP1VYJ8DfrVNy9yfqKZxLQf',
          amount: '1000000000',
          fee: '10100000',
          nonce: 608,
          memo: 'test',
          status: 'PENDING',
        },
      ];

      const result = formatPendingTx(pendingTxList as any);

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('hash');
      expect(result[0]).toHaveProperty('kind');
      expect(result[0]).toHaveProperty('from');
      expect(result[0]).toHaveProperty('to');
    });
  });

  describe('setScamAndTxList', () => {
    it('should set scam status and transaction list', () => {
      const txHistory = [
        {
          hash: '5Jv1',
          from: 'B62q1',
          to: 'B62q2',
          amount: '1000000000',
        },
      ];

      const scamList = ['B62qScam'];

      const result = setScamAndTxList(txHistory as unknown as Parameters<typeof setScamAndTxList>[0], scamList as unknown as Parameters<typeof setScamAndTxList>[1]);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('formatAllTxHistory', () => {
    it('should format all transaction history', () => {
      const params = {
        currentAddress: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32',
        pendingTx: [],
        txList: [
          {
            nonce: 607,
            timestamp: '1751720760000',
            kind: 'payment',
            body: {
              hash: '5JuRUDnBi4ak8Ga6eamWvpYNBxKWFP4No6p9ibxHrM5ovsdzXwpY',
              from: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32',
              to: 'B62qm3V7qSQ97Stgo2MXv4Apof2cVezZyP1VYJ8DfrVNy9yfqKZxLQf',
              fee: 10100000,
              amount: 1000000000,
              memo: 'E4YM2vTHhWEg66xpj52JErHUBU4pZ1yageL4TVDDpTTSsv8mK6YaH',
              kind: 'payment',
              dateTime: '2025-07-05T13:06:00.000Z',
              failureReason: null,
            },
            zkAppBody: null,
          },
        ],
        tokenId: 'wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf',
      };

      const result = formatAllTxHistory(params as any);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle zkApp transactions', () => {
      const params = {
        currentAddress: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32',
        pendingTx: [],
        txList: [
          {
            nonce: 605,
            timestamp: '1751474880000',
            kind: 'zkApp',
            body: null,
            zkAppBody: {
              hash: '5JupjwHEyhjavCtfZh5szMHpwn7S2xGtfJQHSSPvesi5Pq8NfZxK',
              dateTime: '2025-07-02T16:48:00.000Z',
              failureReasons: [],
              zkappCommand: {
                feePayer: {
                  body: {
                    nonce: 605,
                    publicKey: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32',
                    fee: 10000000,
                  },
                },
                memo: 'E4YhMdQTXtPEumBuZroDzbWUVwQNHTeNeaxjRJ6KmoyTNE9A7UPe9',
                accountUpdates: [
                  {
                    body: {
                      publicKey: 'B62qqFbciM2QqnwWeXQ8xFLZUYvhhdko1aBWhrneoEzgaVD9xFwNPpJ',
                      tokenId: 'wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf',
                      balanceChange: { magnitude: '0', sgn: 'Positive' },
                    },
                  },
                ],
              },
            },
          },
        ],
        tokenId: 'wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf',
      };

      const result = formatAllTxHistory(params as any);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should return array result for valid input', () => {
      const params = {
        currentAddress: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32',
        pendingTx: [],
        txList: [],
        tokenId: 'wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf',
      };

      const result = formatAllTxHistory(params as any);
      
      // Result should be an array
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
