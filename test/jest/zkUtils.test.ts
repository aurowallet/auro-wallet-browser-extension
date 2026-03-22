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
  extractTokenTransferInfo,
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
      const result = getZkFee(JSON.stringify(sampleZkCommand));
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

  describe('verifyTokenCommand', () => {
    const validTokenId = 'wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf';
    const sender = 'B62qSender123';
    const receiver = 'B62qReceiver456';
    const amount = '1000000';

    it('should accept valid token transfer (3 accountUpdates)', () => {
      const validCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: {},
              callDepth: 0,
              events: [],
              actions: [],
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
              events: [],
              actions: [],
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
              events: [],
              actions: [],
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(validCommand)
      );
      expect(result).toBe(true);
    });

    it('should reject transaction with permission updates', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: { permissions: { editState: 'Proof' } },
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(false);
    });

    it('should reject transaction with verificationKey update', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: { verificationKey: { data: 'malicious', hash: 'hash123' } },
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(false);
    });

    it('should accept transaction with appState in update (standard Mina protocol field)', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: { appState: ['1', '2', '3'] },
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(true);
    });

    it('should accept transaction with events (standard Mina protocol field)', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: {},
              callDepth: 0,
              events: ['malicious_event'],
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(true);
    });

    it('should accept transaction with non-zero callDepth (standard Mina protocol field)', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: {},
              callDepth: 1,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(true);
    });

    it('should accept transaction with proof authorization (standard Mina protocol field)', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: {},
              callDepth: 0,
            },
            authorization: { proof: 'malicious_proof' },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(true);
    });

    it('should accept transaction with incrementNonce set to true (standard Mina protocol field)', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: {},
              callDepth: 0,
              incrementNonce: true,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(true);
    });

    it('should accept transaction with useFullCommitment set to true (standard Mina protocol field)', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: {},
              callDepth: 0,
              useFullCommitment: true,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(true);
    });

    it('should accept transaction with implicitAccountCreationFee set to true (standard Mina protocol field)', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: {},
              callDepth: 0,
              implicitAccountCreationFee: true,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(true);
    });

    it('should accept transaction with mayUseToken set (standard Mina protocol field)', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: {},
              callDepth: 0,
              mayUseToken: { parentsOwnToken: true, inheritFromParent: false },
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(true);
    });

    it('should accept transaction with preconditions (standard Mina protocol field)', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: {},
              callDepth: 0,
              preconditions: { account: { nonce: { lower: '1', upper: '10' } } },
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(true);
    });

    it('should reject transaction with negative fee', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '-100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(false);
    });

    it('should reject transaction with wrong fee payer', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: 'B62qMaliciousFeePayer', fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(false);
    });

    it('should reject transaction with missing balanceChange for different tokenId', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: 'differentTokenId',
              update: {},
              callDepth: 0,
            } as any,
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(false);
    });

    it('should accept valid token transfer with new account (4 accountUpdates)', () => {
      const validCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: {},
              callDepth: 0,
              events: [],
              actions: [],
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
              events: [],
              actions: [],
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
              events: [],
              actions: [],
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qNewAccount',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
              events: [],
              actions: [],
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: true },
        validTokenId,
        JSON.stringify(validCommand)
      );
      expect(result).toBe(true);
    });

    it('should reject transaction with tokenSymbol update', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: { tokenSymbol: 'MALICIOUS' },
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(false);
    });

    it('should accept transaction with callData (standard Mina protocol field)', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: {},
              callDepth: 0,
              callData: 'malicious_data',
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(true);
    });

    it('should reject transaction with non-null permissions in update', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: { appState: [null, null, null, null, null, null, null, null], permissions: { editState: 'Signature' }, tokenSymbol: null },
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: { tokenSymbol: null },
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: { tokenSymbol: null },
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(false);
    });

    it('should reject transaction with non-null verificationKey in update', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: { verificationKey: { data: 'malicious', hash: '123' }, tokenSymbol: null },
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: { tokenSymbol: null },
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: { tokenSymbol: null },
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(false);
    });

    it('should reject transaction with non-null delegate in update', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: { delegate: 'B62qAttacker999', tokenSymbol: null },
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: { tokenSymbol: null },
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: { tokenSymbol: null },
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(false);
    });

    it('should accept contract account update with non-null permissions/verificationKey/delegate', () => {
      const validCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: { appState: [null, null, null, null, null, null, null, null], delegate: null, verificationKey: null, permissions: null, tokenSymbol: null },
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: { permissions: { editState: 'Proof' }, delegate: 'B62qSomeDelegate', verificationKey: { data: 'vk_data', hash: 'vk_hash' }, tokenSymbol: null },
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: { permissions: { editState: 'Proof' }, delegate: 'B62qContractDelegate', verificationKey: { data: 'contract_vk', hash: 'contract_hash' }, tokenSymbol: null },
            },
            authorization: { proof: 'contract_proof' },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(validCommand)
      );
      expect(result).toBe(true);
    });

    it('should accept transaction with all null update fields (real Mina format)', () => {
      const validCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: { appState: [null, null, null, null, null, null, null, null], delegate: null, verificationKey: null, permissions: null, zkappUri: null, tokenSymbol: null, timing: null, votingFor: null },
              preconditions: { network: { snarkedLedgerHash: null }, account: { nonce: null }, validWhile: null },
              authorizationKind: { isSigned: true, isProved: false, verificationKeyHash: '0' },
              callData: '0',
              callDepth: 0,
              incrementNonce: false,
              useFullCommitment: true,
              mayUseToken: { parentsOwnToken: false, inheritFromParent: false },
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: { appState: [null, null, null, null, null, null, null, null], delegate: null, verificationKey: null, permissions: null, zkappUri: null, tokenSymbol: null, timing: null, votingFor: null },
              preconditions: { network: { snarkedLedgerHash: null }, account: { nonce: null }, validWhile: null },
              authorizationKind: { isSigned: false, isProved: true, verificationKeyHash: '123' },
              callData: '999',
              callDepth: 1,
              mayUseToken: { parentsOwnToken: true, inheritFromParent: false },
            },
            authorization: { proof: 'some_proof_data' },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: { appState: ['7', null, null, null, null, null, null, null], delegate: null, verificationKey: null, permissions: null, zkappUri: null, tokenSymbol: null, timing: null, votingFor: null },
              preconditions: { account: { state: ['5', null, null, null, null, null, null, null] } },
              authorizationKind: { isSigned: false, isProved: true, verificationKeyHash: '9096063867506814087051735556724932477478970458119733821996743293439928290006' },
              callData: '24914480197780443987743304147516945470857467753081118411495678981231202664195',
            },
            authorization: { proof: 'KChzdGF0ZW1lbnQ...' },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(validCommand)
      );
      expect(result).toBe(true);
    });

    it('should accept transaction with zero fee', () => {
      const validCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '0', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: {},
              callDepth: 0,
              events: [],
              actions: [],
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
              events: [],
              actions: [],
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
              events: [],
              actions: [],
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(validCommand)
      );
      expect(result).toBe(true);
    });

    it('should reject transaction with missing fee payer body', () => {
      const maliciousCommand = {
        feePayer: {
          authorization: '7mX...',
        } as any,
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(false);
    });

    it('should reject transaction with malformed balanceChange', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount } as any,
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(false);
    });

    it('should reject transaction with invalid sgn on non-target token', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: 'differentTokenId',
              balanceChange: { magnitude: '0', sgn: 'Invalid' } as any,
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(false);
    });

    it('should reject transaction with null accountUpdate', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          null as any,
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(false);
    });

    it('should reject transaction with non-numeric magnitude', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: 'abc', sgn: 'Negative' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(false);
    });

    it('should reject transaction with missing publicKey in accountUpdate', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: {},
              callDepth: 0,
            } as any,
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(false);
    });

    it('should reject transaction with missing accountUpdate body', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          { authorization: { signature: null } } as any,
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(false);
    });

    it('should reject transaction with non-zero balance on third-party account with matching tokenId', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qVictim999',
              tokenId: validTokenId,
              balanceChange: { magnitude: '5000000', sgn: 'Negative' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(false);
    });

    it('should allow zero balance on third-party account with matching tokenId', () => {
      const validCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(validCommand)
      );
      expect(result).toBe(true);
    });

    it('should reject transaction with delegate in update field', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: { delegate: 'B62qAttacker000' },
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(false);
    });

    it('should reject transaction with zkappUri in update field', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: { zkappUri: 'https://malicious.example.com' },
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(false);
    });

    it('should reject transaction with votingFor in update field', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: { votingFor: 'malicious_vote_target' },
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(false);
    });

    it('should accept transaction with tokenSymbol in isSome:false flagged format on sender', () => {
      const validCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: { tokenSymbol: { isSome: false } },
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(validCommand)
      );
      expect(result).toBe(true);
    });

    it('should reject transaction with tokenSymbol in isSome:true flagged format on sender', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: sender, fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: sender,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Negative' },
              update: { tokenSymbol: { isSome: true, value: 'EVIL' } },
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: receiver,
              tokenId: validTokenId,
              balanceChange: { magnitude: amount, sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {},
              callDepth: 0,
            },
            authorization: { signature: null },
          },
        ],
      };

      const result = verifyTokenCommand(
        { sender, receiver, amount, isNewAccount: false },
        validTokenId,
        JSON.stringify(maliciousCommand)
      );
      expect(result).toBe(false);
    });
  });

  describe('extractTokenTransferInfo', () => {
    const validTokenId = 'wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf';

    it('should extract transfer info from valid transaction', () => {
      const validCommand = {
        feePayer: {
          body: { publicKey: 'B62qFeePayer', fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: 'B62qSender123',
              tokenId: validTokenId,
              balanceChange: { magnitude: '1000000', sgn: 'Negative' },
            },
          },
          {
            body: {
              publicKey: 'B62qReceiver456',
              tokenId: validTokenId,
              balanceChange: { magnitude: '1000000', sgn: 'Positive' },
            },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
            },
          },
        ],
      };

      const result = extractTokenTransferInfo(
        JSON.stringify(validCommand),
        validTokenId
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sender).toBe('B62qSender123');
        expect(result.data.receiver).toBe('B62qReceiver456');
        expect(result.data.amount).toBe('1000000');
        expect(result.data.tokenId).toBe(validTokenId);
        expect(result.data.isNewAccount).toBe(false);
      }
    });

    it('should extract correctly when receiver appears before sender', () => {
      const command = {
        feePayer: {
          body: { publicKey: 'B62qFeePayer', fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: 'B62qReceiver456',
              tokenId: validTokenId,
              balanceChange: { magnitude: '1000000', sgn: 'Positive' },
            },
          },
          {
            body: {
              publicKey: 'B62qSender123',
              tokenId: validTokenId,
              balanceChange: { magnitude: '1000000', sgn: 'Negative' },
            },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
            },
          },
        ],
      };

      const result = extractTokenTransferInfo(
        JSON.stringify(command),
        validTokenId
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sender).toBe('B62qSender123');
        expect(result.data.receiver).toBe('B62qReceiver456');
        expect(result.data.amount).toBe('1000000');
      }
    });

    it('should detect new account creation (4 accountUpdates)', () => {
      const newAccountCommand = {
        feePayer: {
          body: { publicKey: 'B62qFeePayer', fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: 'B62qSender123',
              tokenId: validTokenId,
              balanceChange: { magnitude: '1000000', sgn: 'Negative' },
            },
          },
          {
            body: {
              publicKey: 'B62qReceiver456',
              tokenId: validTokenId,
              balanceChange: { magnitude: '1000000', sgn: 'Positive' },
            },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
            },
          },
          {
            body: {
              publicKey: 'B62qNewAccount',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
            },
          },
        ],
      };

      const result = extractTokenTransferInfo(
        JSON.stringify(newAccountCommand),
        validTokenId
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isNewAccount).toBe(true);
      }
    });

    it('should return failure for missing sender', () => {
      const invalidCommand = {
        feePayer: {
          body: { publicKey: 'B62qFeePayer', fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: 'B62qReceiver456',
              tokenId: validTokenId,
              balanceChange: { magnitude: '1000000', sgn: 'Positive' },
            },
          },
        ],
      };

      const result = extractTokenTransferInfo(
        JSON.stringify(invalidCommand),
        validTokenId
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Sender');
      }
    });

    it('should return failure for missing receiver', () => {
      const invalidCommand = {
        feePayer: {
          body: { publicKey: 'B62qFeePayer', fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: 'B62qSender123',
              tokenId: validTokenId,
              balanceChange: { magnitude: '1000000', sgn: 'Negative' },
            },
          },
        ],
      };

      const result = extractTokenTransferInfo(
        JSON.stringify(invalidCommand),
        validTokenId
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Receiver');
      }
    });

    it('should return failure for invalid JSON', () => {
      const result = extractTokenTransferInfo(
        'invalid json',
        validTokenId
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Parse error');
      }
    });

    it('should return failure when sender and receiver amounts do not match', () => {
      const mismatchCommand = {
        feePayer: {
          body: { publicKey: 'B62qFeePayer', fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: 'B62qSender123',
              tokenId: validTokenId,
              balanceChange: { magnitude: '1000000', sgn: 'Negative' },
            },
          },
          {
            body: {
              publicKey: 'B62qReceiver456',
              tokenId: validTokenId,
              balanceChange: { magnitude: '2000000', sgn: 'Positive' },
            },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
            },
          },
        ],
      };

      const result = extractTokenTransferInfo(
        JSON.stringify(mismatchCommand),
        validTokenId
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Amount mismatch');
      }
    });

    it('should reject transaction with multiple senders', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: 'B62qFeePayer', fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: 'B62qVictim999',
              tokenId: validTokenId,
              balanceChange: { magnitude: '5000000', sgn: 'Negative' },
            },
          },
          {
            body: {
              publicKey: 'B62qSender123',
              tokenId: validTokenId,
              balanceChange: { magnitude: '1000000', sgn: 'Negative' },
            },
          },
          {
            body: {
              publicKey: 'B62qReceiver456',
              tokenId: validTokenId,
              balanceChange: { magnitude: '1000000', sgn: 'Positive' },
            },
          },
        ],
      };

      const result = extractTokenTransferInfo(
        JSON.stringify(maliciousCommand),
        validTokenId
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Multiple senders');
      }
    });

    it('should reject transaction with multiple receivers', () => {
      const maliciousCommand = {
        feePayer: {
          body: { publicKey: 'B62qFeePayer', fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: 'B62qSender123',
              tokenId: validTokenId,
              balanceChange: { magnitude: '1000000', sgn: 'Negative' },
            },
          },
          {
            body: {
              publicKey: 'B62qReceiver456',
              tokenId: validTokenId,
              balanceChange: { magnitude: '1000000', sgn: 'Positive' },
            },
          },
          {
            body: {
              publicKey: 'B62qAttacker000',
              tokenId: validTokenId,
              balanceChange: { magnitude: '5000000', sgn: 'Positive' },
            },
          },
        ],
      };

      const result = extractTokenTransferInfo(
        JSON.stringify(maliciousCommand),
        validTokenId
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Multiple receivers');
      }
    });

    it('should extract memo from transaction', () => {
      const commandWithMemo = {
        feePayer: {
          body: { publicKey: 'B62qFeePayer', fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        memo: 'test memo',
        accountUpdates: [
          {
            body: {
              publicKey: 'B62qSender123',
              tokenId: validTokenId,
              balanceChange: { magnitude: '1000000', sgn: 'Negative' },
            },
          },
          {
            body: {
              publicKey: 'B62qReceiver456',
              tokenId: validTokenId,
              balanceChange: { magnitude: '1000000', sgn: 'Positive' },
            },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
            },
          },
        ],
      };

      const result = extractTokenTransferInfo(
        JSON.stringify(commandWithMemo),
        validTokenId
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.memo).toBe('test memo');
      }
    });

    it('should return empty memo when not present in transaction', () => {
      const commandNoMemo = {
        feePayer: {
          body: { publicKey: 'B62qFeePayer', fee: '100000000', validUntil: null },
          authorization: '7mX...',
        },
        accountUpdates: [
          {
            body: {
              publicKey: 'B62qSender123',
              tokenId: validTokenId,
              balanceChange: { magnitude: '1000000', sgn: 'Negative' },
            },
          },
          {
            body: {
              publicKey: 'B62qReceiver456',
              tokenId: validTokenId,
              balanceChange: { magnitude: '1000000', sgn: 'Positive' },
            },
          },
          {
            body: {
              publicKey: 'B62qContract789',
              tokenId: validTokenId,
              balanceChange: { magnitude: '0', sgn: 'Positive' },
            },
          },
        ],
      };

      const result = extractTokenTransferInfo(
        JSON.stringify(commandNoMemo),
        validTokenId
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.memo).toBe('');
      }
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

  describe('getZkInfo with sensitive changes', () => {
    it('should include permission change warnings in formatted output', () => {
      const cmd = JSON.stringify({
        feePayer: {
          body: { publicKey: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32', fee: '100000000', validUntil: null },
          authorization: '7mWxjLYgbJUkZNcGouvhVj5tJ8yu9hoexb9ntvPK8t5LHqzmrL6QJjjKtf5SgmxB4QWkDw7qoMMbbNGtHVpsbJHPyTy2EzRQ',
        },
        accountUpdates: [{
          body: {
            publicKey: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32',
            tokenId: 'wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf',
            balanceChange: { magnitude: '0', sgn: 'Positive' },
            update: {
              permissions: {
                isSome: true,
                value: { editState: 'Proof', send: 'Impossible' },
              },
              delegate: { isSome: false },
            },
          },
        }],
      });

      const result = getZkInfo(cmd, 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32');
      expect(result.length).toBe(2);

      const accountUpdates = result[1] as { label: string; children?: any[] };
      expect(accountUpdates.label).toBe('accountUpdates');

      const account1 = accountUpdates.children![0];
      const warnChildren = account1.children.filter((c: any) => c.warn === true);
      expect(warnChildren.length).toBeGreaterThan(0);
      expect(warnChildren[0].label).toContain('Permissions');
      expect(warnChildren[0].children).toBeDefined();
      expect(warnChildren[0].children.length).toBe(2);
    });

    it('should match exact structure for full Test Case 1 data (permissions change)', () => {
      const cmd = JSON.stringify({
        feePayer: {
          body: {
            publicKey: 'B62qiTKpEPjGTSHZrtM8uXiKgn8So916pLmNJKDhKeyBQL9TDb3nvBG',
            fee: '100000000',
            validUntil: null,
            nonce: '0',
          },
          authorization: '7mXGPCbSJUiYgZnGioezZm7GCy4PVwoFMAQEVizUagKuECMK4LG4M9GUnYxbcJzLBjDqTv5LpUhvvzhSAdqoF8N99X6K9RY',
        },
        accountUpdates: [{
          body: {
            publicKey: 'B62qiTKpEPjGTSHZrtM8uXiKgn8So916pLmNJKDhKeyBQL9TDb3nvBG',
            tokenId: 'wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf',
            balanceChange: { magnitude: '0', sgn: 'Positive' },
            update: {
              appState: [
                { isSome: false }, { isSome: false }, { isSome: false }, { isSome: false },
                { isSome: false }, { isSome: false }, { isSome: false }, { isSome: false },
              ],
              delegate: { isSome: false },
              verificationKey: { isSome: false },
              permissions: {
                isSome: true,
                value: {
                  editState: 'Proof',
                  access: 'None',
                  send: 'Proof',
                  receive: 'None',
                  setDelegate: 'Impossible',
                  setPermissions: 'Impossible',
                  setVerificationKey: { auth: 'Impossible', txnVersion: '3' },
                  setZkappUri: 'Impossible',
                  editActionState: 'Proof',
                  setTokenSymbol: 'Impossible',
                  incrementNonce: 'Signature',
                  setVotingFor: 'Impossible',
                  setTiming: 'Impossible',
                },
              },
              zkappUri: { isSome: false },
              tokenSymbol: { isSome: false },
              timing: { isSome: false },
              votingFor: { isSome: false },
            },
          },
          authorization: { proof: null, signature: null },
        }],
        memo: 'E4Yq8qMsqsjb3bR2tCBkGR2YN5HcS8drT7kH88m5YBqG8DEqcDXYM',
      });

      const result = getZkInfo(cmd, 'B62qiTKpEPjGTSHZrtM8uXiKgn8So916pLmNJKDhKeyBQL9TDb3nvBG');
      expect(result.length).toBe(2);

      const [feePayer, accountUpdatesItem] = result as any[];
      expect(feePayer.label).toBe('feePayer');
      expect(accountUpdatesItem.label).toBe('accountUpdates');
      expect(accountUpdatesItem.children.length).toBe(1);

      const account1 = accountUpdatesItem.children[0];
      expect(account1.label).toBe('Account #1');
      expect(account1.children.length).toBe(4);
      expect(account1.children[0].label).toBe('publicKey');
      expect(account1.children[1].label).toBe('tokenId');
      expect(account1.children[2].label).toBe('balanceChange');
      expect(account1.children[2].value).toBe('0 MINA');

      const permItem = account1.children[3];
      expect(permItem.label).toBe('Permissions');
      expect(permItem.warn).toBe(true);
      expect(permItem.children.length).toBe(13);
      expect(permItem.children[0]).toEqual({ label: 'editState', value: 'Proof', warn: true });
      expect(permItem.children[4]).toEqual({ label: 'setDelegate', value: 'Impossible', warn: true });
    });

    it('should show sensitive changes for multiple accounts', () => {
      const cmd = JSON.stringify({
        feePayer: {
          body: { publicKey: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32', fee: '100000000', validUntil: null },
          authorization: '7mWxjLYgbJUkZNcGouvhVj5tJ8yu9hoexb9ntvPK8t5LHqzmrL6QJjjKtf5SgmxB4QWkDw7qoMMbbNGtHVpsbJHPyTy2EzRQ',
        },
        accountUpdates: [
          {
            body: {
              publicKey: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32',
              tokenId: 'wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf',
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {
                permissions: { isSome: true, value: { editState: 'Proof', send: 'Impossible' } },
                delegate: { isSome: false },
              },
            },
          },
          {
            body: {
              publicKey: 'B62qq6g5TAd8kgn8hVX4KiPLfrPrsyTq544Mt48SCuvKau3EXgwbmGM',
              tokenId: 'wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf',
              balanceChange: { magnitude: '0', sgn: 'Positive' },
              update: {
                delegate: { isSome: true, value: 'B62qnewDelegateAddress12345' },
                permissions: { isSome: false },
              },
            },
          },
        ],
      });

      const result = getZkInfo(cmd, 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32');
      const accountUpdates = result[1] as any;

      const account1 = accountUpdates.children[0];
      const account1Warn = account1.children.filter((c: any) => c.warn === true);
      expect(account1Warn.length).toBe(1);
      expect(account1Warn[0].label).toBe('Permissions');

      const account2 = accountUpdates.children[1];
      const account2Warn = account2.children.filter((c: any) => c.warn === true);
      expect(account2Warn.length).toBe(1);
      expect(account2Warn[0].label).toBe('Delegate');
    });

    it('should NOT include warnings when no sensitive changes', () => {
      const cmd = JSON.stringify({
        feePayer: {
          body: { publicKey: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32', fee: '0', validUntil: null },
          authorization: '7mWxjLYgbJUkZNcGouvhVj5tJ8yu9hoexb9ntvPK8t5LHqzmrL6QJjjKtf5SgmxB4QWkDw7qoMMbbNGtHVpsbJHPyTy2EzRQ',
        },
        accountUpdates: [{
          body: {
            publicKey: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32',
            tokenId: 'wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf',
            balanceChange: { magnitude: '1000000000', sgn: 'Negative' },
            update: {
              appState: [{ isSome: false }, { isSome: false }, { isSome: false }, { isSome: false }, { isSome: false }, { isSome: false }, { isSome: false }, { isSome: false }],
              delegate: { isSome: false },
              permissions: { isSome: false },
              verificationKey: { isSome: false },
              timing: { isSome: false },
              votingFor: { isSome: false },
              tokenSymbol: { isSome: false },
              zkappUri: { isSome: false },
            },
          },
        }],
      });

      const result = getZkInfo(cmd, 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32');
      const accountUpdates = result[1] as { label: string; children?: any[] };
      const account1 = accountUpdates.children![0];
      const warnChildren = account1.children.filter((c: any) => c.warn === true);
      expect(warnChildren.length).toBe(0);
    });

    it('should include zkappUri change as sensitive warning', () => {
      const cmd = JSON.stringify({
        feePayer: {
          body: { publicKey: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32', fee: '100000000', validUntil: null },
          authorization: '7mWxjLYgbJUkZNcGouvhVj5tJ8yu9hoexb9ntvPK8t5LHqzmrL6QJjjKtf5SgmxB4QWkDw7qoMMbbNGtHVpsbJHPyTy2EzRQ',
        },
        accountUpdates: [{
          body: {
            publicKey: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32',
            tokenId: 'wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf',
            balanceChange: { magnitude: '0', sgn: 'Positive' },
            update: {
              zkappUri: { isSome: true, value: 'https://malicious.example.com' },
              delegate: { isSome: false },
              permissions: { isSome: false },
            },
          },
        }],
      });

      const result = getZkInfo(cmd, 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32');
      const accountUpdates = result[1] as any;
      const account1 = accountUpdates.children[0];
      const warnChildren = account1.children.filter((c: any) => c.warn === true);
      expect(warnChildren.length).toBe(1);
      expect(warnChildren[0].label).toBe('zkApp URI');
      expect(warnChildren[0].value).toBe('https://malicious.example.com');
      expect(warnChildren[0].warn).toBe(true);
    });

    it('should resolve tokenSymbol from tokenSymbolMap for custom token', () => {
      const customTokenId = 'xajT4UZbYBicT2C7iJtM4CAFHH6dcwFPCbJ2nv3AeCn6t3s9Ze';
      const cmd = JSON.stringify({
        feePayer: {
          body: { publicKey: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32', fee: '100000000', validUntil: null },
          authorization: '7mWxjLYgbJUkZNcGouvhVj5tJ8yu9hoexb9ntvPK8t5LHqzmrL6QJjjKtf5SgmxB4QWkDw7qoMMbbNGtHVpsbJHPyTy2EzRQ',
        },
        accountUpdates: [{
          body: {
            publicKey: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32',
            tokenId: customTokenId,
            balanceChange: { magnitude: '1000000', sgn: 'Negative' },
            update: {
              tokenSymbol: { isSome: false },
            },
          },
        }],
      });

      const tokenSymbolMap: Record<string, string> = {
        [customTokenId]: 'MYTOKEN',
      };

      const result = getZkInfo(cmd, 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32', tokenSymbolMap);
      const accountUpdates = result[1] as any;
      const account1 = accountUpdates.children[0];
      const balanceItem = account1.children.find((c: any) => c.label === 'balanceChange');
      expect(balanceItem.value).toContain('MYTOKEN');
    });

    it('should resolve tokenSymbol from isSome/value format in update body', () => {
      const customTokenId = 'xajT4UZbYBicT2C7iJtM4CAFHH6dcwFPCbJ2nv3AeCn6t3s9Ze';
      const cmd = JSON.stringify({
        feePayer: {
          body: { publicKey: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32', fee: '100000000', validUntil: null },
          authorization: '7mWxjLYgbJUkZNcGouvhVj5tJ8yu9hoexb9ntvPK8t5LHqzmrL6QJjjKtf5SgmxB4QWkDw7qoMMbbNGtHVpsbJHPyTy2EzRQ',
        },
        accountUpdates: [{
          body: {
            publicKey: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32',
            tokenId: customTokenId,
            balanceChange: { magnitude: '500000', sgn: 'Positive' },
            update: {
              tokenSymbol: { isSome: true, value: 'FLAGGED_TOKEN' },
            },
          },
        }],
      });

      const result = getZkInfo(cmd, 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32');
      const accountUpdates = result[1] as any;
      const account1 = accountUpdates.children[0];
      const balanceItem = account1.children.find((c: any) => c.label === 'balanceChange');
      expect(balanceItem.value).toContain('FLAGGED_TOKEN');
    });

    it('should fallback to UNKNOWN for custom token without tokenSymbolMap or update body symbol', () => {
      const customTokenId = 'xajT4UZbYBicT2C7iJtM4CAFHH6dcwFPCbJ2nv3AeCn6t3s9Ze';
      const cmd = JSON.stringify({
        feePayer: {
          body: { publicKey: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32', fee: '100000000', validUntil: null },
          authorization: '7mWxjLYgbJUkZNcGouvhVj5tJ8yu9hoexb9ntvPK8t5LHqzmrL6QJjjKtf5SgmxB4QWkDw7qoMMbbNGtHVpsbJHPyTy2EzRQ',
        },
        accountUpdates: [{
          body: {
            publicKey: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32',
            tokenId: customTokenId,
            balanceChange: { magnitude: '0', sgn: 'Positive' },
            update: {
              tokenSymbol: { isSome: false },
            },
          },
        }],
      });

      const result = getZkInfo(cmd, 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32');
      const accountUpdates = result[1] as any;
      const account1 = accountUpdates.children[0];
      const balanceItem = account1.children.find((c: any) => c.label === 'balanceChange');
      expect(balanceItem.value).toContain('UNKNOWN');
    });

    it('should resolve main coin symbol from tokenSymbolMap when provided', () => {
      const defaultTokenId = 'wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf';
      const cmd = JSON.stringify({
        feePayer: {
          body: { publicKey: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32', fee: '100000000', validUntil: null },
          authorization: '7mWxjLYgbJUkZNcGouvhVj5tJ8yu9hoexb9ntvPK8t5LHqzmrL6QJjjKtf5SgmxB4QWkDw7qoMMbbNGtHVpsbJHPyTy2EzRQ',
        },
        accountUpdates: [{
          body: {
            publicKey: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32',
            tokenId: defaultTokenId,
            balanceChange: { magnitude: '1000000000', sgn: 'Negative' },
            update: {
              tokenSymbol: { isSome: false },
            },
          },
        }],
      });

      const tokenSymbolMap: Record<string, string> = {
        [defaultTokenId]: 'MINA',
      };

      const result = getZkInfo(cmd, 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32', tokenSymbolMap);
      const accountUpdates = result[1] as any;
      const account1 = accountUpdates.children[0];
      const balanceItem = account1.children.find((c: any) => c.label === 'balanceChange');
      expect(balanceItem.value).toContain('MINA');
    });

    it('should prioritize tokenSymbol from update body over tokenSymbolMap', () => {
      const customTokenId = 'xajT4UZbYBicT2C7iJtM4CAFHH6dcwFPCbJ2nv3AeCn6t3s9Ze';
      const cmd = JSON.stringify({
        feePayer: {
          body: { publicKey: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32', fee: '100000000', validUntil: null },
          authorization: '7mWxjLYgbJUkZNcGouvhVj5tJ8yu9hoexb9ntvPK8t5LHqzmrL6QJjjKtf5SgmxB4QWkDw7qoMMbbNGtHVpsbJHPyTy2EzRQ',
        },
        accountUpdates: [{
          body: {
            publicKey: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32',
            tokenId: customTokenId,
            balanceChange: { magnitude: '500000', sgn: 'Positive' },
            update: {
              tokenSymbol: { isSome: true, value: 'BODY_TOKEN' },
            },
          },
        }],
      });

      const tokenSymbolMap: Record<string, string> = {
        [customTokenId]: 'MAP_TOKEN',
      };

      const result = getZkInfo(cmd, 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32', tokenSymbolMap);
      const accountUpdates = result[1] as any;
      const account1 = accountUpdates.children[0];
      const balanceItem = account1.children.find((c: any) => c.label === 'balanceChange');
      expect(balanceItem.value).toContain('BODY_TOKEN');
      expect(balanceItem.value).not.toContain('MAP_TOKEN');
    });
  });

  describe('sensitive field display in getZkInfo', () => {
    const addr = 'B62qiTKpEPjGTSHZrtM8uXiKgn8So916pLmNJKDhKeyBQL9TDb3nvBG';
    const defaultTokenId = 'wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf';

    function makeCommand(updateFields: Record<string, unknown>) {
      return JSON.stringify({
        feePayer: {
          body: { publicKey: addr, fee: '100000000', validUntil: null, nonce: '0' },
          authorization: '7mXGPCbSJUiYgZnGioezZm7GCy4PVwoFMAQEVizUagKuECMK4LG4M9GUnYxbcJzLBjDqTv5LpUhvvzhSAdqoF8N99X6K9RY',
        },
        accountUpdates: [{
          body: {
            publicKey: addr,
            tokenId: defaultTokenId,
            balanceChange: { magnitude: '0', sgn: 'Positive' },
            update: updateFields,
          },
          authorization: { proof: null, signature: null },
        }],
        memo: 'E4Yq8qMsqsjb3bR2tCBkGR2YN5HcS8drT7kH88m5YBqG8DEqcDXYM',
      });
    }

    function getAccount1Children(cmd: string) {
      const result = getZkInfo(cmd, addr);
      const accountUpdates = result[1] as any;
      return accountUpdates.children[0].children;
    }

    it('should show permissions with warn:true and child items for flagged isSome:true', () => {
      const cmd = makeCommand({
        permissions: {
          isSome: true,
          value: {
            editState: 'Proof',
            send: 'Impossible',
            setDelegate: 'Impossible',
          },
        },
        delegate: { isSome: false },
        verificationKey: { isSome: false },
        tokenSymbol: { isSome: false },
      });
      const children = getAccount1Children(cmd);
      const permItem = children.find((c: any) => c.label === 'Permissions');
      expect(permItem).toBeDefined();
      expect(permItem.warn).toBe(true);
      expect(permItem.children).toHaveLength(3);
      expect(permItem.children[0].label).toBe('editState');
      expect(permItem.children[0].value).toBe('Proof');
      expect(permItem.children[0].warn).toBe(true);
      expect(permItem.children[1].label).toBe('send');
      expect(permItem.children[2].label).toBe('setDelegate');
    });

    it('should show all 13 permission fields when full permissions are set', () => {
      const cmd = makeCommand({
        permissions: {
          isSome: true,
          value: {
            editState: 'Proof', access: 'None', send: 'Proof', receive: 'None',
            setDelegate: 'Impossible', setPermissions: 'Impossible',
            setVerificationKey: { auth: 'Impossible', txnVersion: '3' },
            setZkappUri: 'Impossible', editActionState: 'Proof',
            setTokenSymbol: 'Impossible', incrementNonce: 'Signature',
            setVotingFor: 'Impossible', setTiming: 'Impossible',
          },
        },
        delegate: { isSome: false },
        tokenSymbol: { isSome: false },
      });
      const children = getAccount1Children(cmd);
      const permItem = children.find((c: any) => c.label === 'Permissions');
      expect(permItem).toBeDefined();
      expect(permItem.children).toHaveLength(13);
      const svkItem = permItem.children.find((c: any) => c.label === 'setVerificationKey');
      expect(svkItem.value).toBe(JSON.stringify({ auth: 'Impossible', txnVersion: '3' }));
    });

    it('should show delegate with warn:true and sliced address', () => {
      const delegateAddr = 'B62qq6g5TAd8kgn8hVX4KiPLfrPrsyTq544Mt48SCuvKau3EXgwbmGM';
      const cmd = makeCommand({
        delegate: { isSome: true, value: delegateAddr },
        permissions: { isSome: false },
        tokenSymbol: { isSome: false },
      });
      const children = getAccount1Children(cmd);
      const delegateItem = children.find((c: any) => c.label === 'Delegate');
      expect(delegateItem).toBeDefined();
      expect(delegateItem.warn).toBe(true);
      expect(delegateItem.value).toContain('...');
      expect(delegateItem.children).toBeUndefined();
    });

    it('should show verificationKey with warn:true and sliced hash', () => {
      const cmd = makeCommand({
        verificationKey: {
          isSome: true,
          value: { data: 'vk_data_long_string', hash: '12345678901234567890123456789012345678901234567890' },
        },
        permissions: { isSome: false },
        tokenSymbol: { isSome: false },
      });
      const children = getAccount1Children(cmd);
      const vkItem = children.find((c: any) => c.label === 'Verification Key');
      expect(vkItem).toBeDefined();
      expect(vkItem.warn).toBe(true);
      expect(vkItem.value).toContain('...');
    });

    it('should show verificationKey as "Updated" when hash is missing', () => {
      const cmd = makeCommand({
        verificationKey: { isSome: true, value: { data: 'some_data' } },
        permissions: { isSome: false },
        tokenSymbol: { isSome: false },
      });
      const children = getAccount1Children(cmd);
      const vkItem = children.find((c: any) => c.label === 'Verification Key');
      expect(vkItem).toBeDefined();
      expect(vkItem.value).toBe('Updated');
    });

    it('should show timing/vesting with warn:true and child items', () => {
      const cmd = makeCommand({
        timing: {
          isSome: true,
          value: {
            initialMinimumBalance: '5000000000',
            cliffTime: '500',
            cliffAmount: '2500000000',
            vestingPeriod: '100',
            vestingIncrement: '500000000',
          },
        },
        permissions: { isSome: false },
        tokenSymbol: { isSome: false },
      });
      const children = getAccount1Children(cmd);
      const timingItem = children.find((c: any) => c.label === 'Timing / Vesting');
      expect(timingItem).toBeDefined();
      expect(timingItem.warn).toBe(true);
      expect(timingItem.children).toHaveLength(5);
      expect(timingItem.children[0].label).toBe('initialMinimumBalance');
      expect(timingItem.children[0].value).toBe('5000000000');
    });

    it('should show votingFor with warn:true', () => {
      const cmd = makeCommand({
        votingFor: 'some_voting_target',
        permissions: { isSome: false },
        tokenSymbol: { isSome: false },
      });
      const children = getAccount1Children(cmd);
      const vfItem = children.find((c: any) => c.label === 'Voting For');
      expect(vfItem).toBeDefined();
      expect(vfItem.warn).toBe(true);
      expect(vfItem.value).toBe('some_voting_target');
    });

    it('should show zkappUri with warn:true', () => {
      const cmd = makeCommand({
        zkappUri: { isSome: true, value: 'https://example.com/zkapp' },
        permissions: { isSome: false },
        tokenSymbol: { isSome: false },
      });
      const children = getAccount1Children(cmd);
      const uriItem = children.find((c: any) => c.label === 'zkApp URI');
      expect(uriItem).toBeDefined();
      expect(uriItem.warn).toBe(true);
      expect(uriItem.value).toBe('https://example.com/zkapp');
    });

    it('should NOT show sensitive items when all fields are isSome:false', () => {
      const cmd = makeCommand({
        delegate: { isSome: false },
        verificationKey: { isSome: false },
        permissions: { isSome: false },
        zkappUri: { isSome: false },
        tokenSymbol: { isSome: false },
        timing: { isSome: false },
        votingFor: { isSome: false },
      });
      const children = getAccount1Children(cmd);
      const warnItems = children.filter((c: any) => c.warn === true);
      expect(warnItems).toHaveLength(0);
    });

    it('should NOT show sensitive items when all fields are null', () => {
      const cmd = makeCommand({
        delegate: null,
        verificationKey: null,
        permissions: null,
        zkappUri: null,
        tokenSymbol: null,
        timing: null,
        votingFor: null,
      });
      const children = getAccount1Children(cmd);
      const warnItems = children.filter((c: any) => c.warn === true);
      expect(warnItems).toHaveLength(0);
    });

    it('should show multiple sensitive items on same account update', () => {
      const cmd = makeCommand({
        permissions: {
          isSome: true,
          value: { editState: 'Proof', send: 'Impossible' },
        },
        delegate: {
          isSome: true,
          value: 'B62qq6g5TAd8kgn8hVX4KiPLfrPrsyTq544Mt48SCuvKau3EXgwbmGM',
        },
        timing: {
          isSome: true,
          value: { cliffTime: '100', vestingPeriod: '50' },
        },
        tokenSymbol: { isSome: false },
      });
      const children = getAccount1Children(cmd);
      const warnItems = children.filter((c: any) => c.warn === true);
      expect(warnItems.length).toBe(3);
      expect(warnItems.map((i: any) => i.label).sort()).toEqual(['Delegate', 'Permissions', 'Timing / Vesting']);
    });
  });

  describe('token decimals in getZkInfo', () => {
    const addr = 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32';
    const customTokenId = 'xajT4UZbYBicT2C7iJtM4CAFHH6dcwFPCbJ2nv3AeCn6t3s9Ze';

    it('should use custom decimals from tokenDecimalsMap for custom token', () => {
      const cmd = JSON.stringify({
        feePayer: {
          body: { publicKey: addr, fee: '100000000', validUntil: null },
          authorization: '7mWxjLYgbJUkZNcGouvhVj5tJ8yu9hoexb9ntvPK8t5LHqzmrL6QJjjKtf5SgmxB4QWkDw7qoMMbbNGtHVpsbJHPyTy2EzRQ',
        },
        accountUpdates: [{
          body: {
            publicKey: addr,
            tokenId: customTokenId,
            balanceChange: { magnitude: '1000000', sgn: 'Negative' },
            update: {},
          },
        }],
      });

      const tokenSymbolMap = { [customTokenId]: 'USDC' };
      const tokenDecimalsMap = { [customTokenId]: 6 };
      const result = getZkInfo(cmd, addr, tokenSymbolMap, tokenDecimalsMap);
      const accountUpdates = result[1] as any;
      const balanceItem = accountUpdates.children[0].children.find((c: any) => c.label === 'balanceChange');
      expect(balanceItem.value).toBe('-1 USDC');
    });

    it('should fallback to MINA decimals when tokenDecimalsMap is empty', () => {
      const cmd = JSON.stringify({
        feePayer: {
          body: { publicKey: addr, fee: '100000000', validUntil: null },
          authorization: '7mWxjLYgbJUkZNcGouvhVj5tJ8yu9hoexb9ntvPK8t5LHqzmrL6QJjjKtf5SgmxB4QWkDw7qoMMbbNGtHVpsbJHPyTy2EzRQ',
        },
        accountUpdates: [{
          body: {
            publicKey: addr,
            tokenId: customTokenId,
            balanceChange: { magnitude: '1000000', sgn: 'Negative' },
            update: {},
          },
        }],
      });

      const result = getZkInfo(cmd, addr, { [customTokenId]: 'USDC' });
      const accountUpdates = result[1] as any;
      const balanceItem = accountUpdates.children[0].children.find((c: any) => c.label === 'balanceChange');
      expect(balanceItem.value).toBe('-0.001 USDC');
    });

    it('should use MINA decimals for default token even with tokenDecimalsMap', () => {
      const defaultTokenId = 'wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf';
      const cmd = JSON.stringify({
        feePayer: {
          body: { publicKey: addr, fee: '100000000', validUntil: null },
          authorization: '7mWxjLYgbJUkZNcGouvhVj5tJ8yu9hoexb9ntvPK8t5LHqzmrL6QJjjKtf5SgmxB4QWkDw7qoMMbbNGtHVpsbJHPyTy2EzRQ',
        },
        accountUpdates: [{
          body: {
            publicKey: addr,
            tokenId: defaultTokenId,
            balanceChange: { magnitude: '1000000000', sgn: 'Negative' },
            update: {},
          },
        }],
      });

      const tokenDecimalsMap = { [defaultTokenId]: 9 };
      const result = getZkInfo(cmd, addr, undefined, tokenDecimalsMap);
      const accountUpdates = result[1] as any;
      const balanceItem = accountUpdates.children[0].children.find((c: any) => c.label === 'balanceChange');
      expect(balanceItem.value).toBe('-1 MINA');
    });
  });
});
