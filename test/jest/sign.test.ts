/**
 * Sign Tests - Migrated from Mocha to Jest
 */
import { signDataV2 } from '../data/sign_data_v2';

// Mock dependencies
const mockGetCurrentNodeConfig = jest.fn();

jest.mock('@/utils/browserUtils', () => ({
  getCurrentNodeConfig: mockGetCurrentNodeConfig,
}));

jest.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue({}),
      remove: jest.fn().mockResolvedValue(undefined),
    },
  },
}));

// Import module after mocks are set up
import * as libModule from '@/background/lib';

describe('Functionality on mainnet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentNodeConfig.mockResolvedValue({ networkID: 'mina:mainnet' });
  });

  describe('signTransaction on mainnet', () => {
    it('should correctly send payment on mainnet', async () => {
      const signResult = await libModule.signTransaction(
        signDataV2.testAccount.privateKey,
        signDataV2.signPayment.mainnet.signParams as unknown as Parameters<typeof libModule.signTransaction>[1]
      );
      expect(JSON.stringify(signResult)).toBe(
        JSON.stringify(signDataV2.signPayment.mainnet.signResult)
      );
    });

    it('should correctly send stakeDelegation', async () => {
      const signResult = await libModule.signTransaction(
        signDataV2.testAccount.privateKey,
        signDataV2.signStakeTransaction.mainnet.signParams as unknown as Parameters<typeof libModule.signTransaction>[1]
      );
      expect(JSON.stringify(signResult)).toBe(
        JSON.stringify(signDataV2.signStakeTransaction.mainnet.signResult)
      );
    });

    it('should correctly sign message & verify message', async () => {
      const signResult = await libModule.signTransaction(
        signDataV2.testAccount.privateKey,
        signDataV2.signMessage.mainnet.signParams as unknown as Parameters<typeof libModule.signTransaction>[1]
      );
      expect(JSON.stringify(signResult)).toBe(
        JSON.stringify(signDataV2.signMessage.mainnet.signResult)
      );

      const verifyResult = await libModule.verifyMessage(
        (signResult as { publicKey: string }).publicKey,
        signResult.signature,
        (signResult as { data: string }).data
      );
      expect(verifyResult).toBe(true);
    });
  });

  describe('signFields on mainnet', () => {
    it('should correctly sign fields', async () => {
      const signResult = await libModule.signFieldsMessage(
        signDataV2.testAccount.privateKey,
        signDataV2.signFileds.mainnet.signParams as Parameters<typeof libModule.signFieldsMessage>[1]
      );
      expect(signResult.signature).toBe(
        signDataV2.signFileds.mainnet.signResult.signature
      );

      const verifyResult = await libModule.verifyFieldsMessage(
        (signResult as { publicKey: string }).publicKey,
        signResult.signature,
        (signResult as { data: string[] }).data
      );
      expect(verifyResult).toBe(true);
    });
  });

  describe('create nullifier on mainnet', () => {
    it('should correctly create nullifier', async () => {
      const signResult = await libModule.createNullifier(
        signDataV2.testAccount.privateKey,
        signDataV2.nullifierData.mainnet.signParams as Parameters<typeof libModule.createNullifier>[1]
      );
      expect(!!(signResult as { private: unknown }).private).toBe(true);
    });
  });
});

describe('Functionality on testnet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentNodeConfig.mockResolvedValue({ networkID: 'mina:testnet' });
  });

  describe('signTransaction on testnet', () => {
    it('should correctly send payment on testnet', async () => {
      const signResult = await libModule.signTransaction(
        signDataV2.testAccount.privateKey,
        signDataV2.signPayment.testnet.signParams as unknown as Parameters<typeof libModule.signTransaction>[1]
      );
      expect(JSON.stringify(signResult)).toBe(
        JSON.stringify(signDataV2.signPayment.testnet.signResult)
      );
    });

    it('should correctly send stakeDelegation', async () => {
      const signResult = await libModule.signTransaction(
        signDataV2.testAccount.privateKey,
        signDataV2.signStakeTransaction.testnet.signParams as unknown as Parameters<typeof libModule.signTransaction>[1]
      );
      expect(JSON.stringify(signResult)).toBe(
        JSON.stringify(signDataV2.signStakeTransaction.testnet.signResult)
      );
    });

    it('should correctly send zk transaction', async () => {
      const signResult = await libModule.signTransaction(
        signDataV2.testAccount.privateKey,
        signDataV2.signZkTransaction.testnet.signParams as unknown as Parameters<typeof libModule.signTransaction>[1]
      );
      expect(signResult).toEqual(signDataV2.signZkTransaction.testnet.signResult);
    });

    it('should correctly sign message & verify message', async () => {
      const signResult = await libModule.signTransaction(
        signDataV2.testAccount.privateKey,
        signDataV2.signMessage.testnet.signParams as unknown as Parameters<typeof libModule.signTransaction>[1]
      );
      expect(JSON.stringify(signResult)).toBe(
        JSON.stringify(signDataV2.signMessage.testnet.signResult)
      );

      const verifyResult = await libModule.verifyMessage(
        (signResult as { publicKey: string }).publicKey,
        signResult.signature,
        (signResult as { data: string }).data
      );
      expect(verifyResult).toBe(true);
    });
  });

  describe('signFields on testnet', () => {
    it('should correctly sign fields', async () => {
      const signResult = await libModule.signFieldsMessage(
        signDataV2.testAccount.privateKey,
        signDataV2.signFileds.testnet.signParams as Parameters<typeof libModule.signFieldsMessage>[1]
      );
      expect(signResult.signature).toBe(
        signDataV2.signFileds.testnet.signResult.signature
      );

      const verifyResult = await libModule.verifyFieldsMessage(
        (signResult as { publicKey: string }).publicKey,
        signResult.signature,
        (signResult as { data: string[] }).data
      );
      expect(verifyResult).toBe(true);
    });
  });

  describe('create nullifier on testnet', () => {
    it('should correctly create nullifier', async () => {
      const signResult = await libModule.createNullifier(
        signDataV2.testAccount.privateKey,
        signDataV2.nullifierData.testnet.signParams as Parameters<typeof libModule.createNullifier>[1]
      );
      expect(!!(signResult as { private: unknown }).private).toBe(true);
    });
  });
});
