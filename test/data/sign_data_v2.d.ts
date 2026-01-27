/**
 * Type declarations for sign_data_v2.js
 */
export interface SignDataV2 {
  testAccount: {
    privateKey: string;
    publicKey: string;
  };
  signPayment: {
    mainnet: {
      signParams: Record<string, unknown>;
      signResult: Record<string, unknown>;
    };
    testnet: {
      signParams: Record<string, unknown>;
      signResult: Record<string, unknown>;
    };
  };
  signStakeTransaction: {
    mainnet: {
      signParams: Record<string, unknown>;
      signResult: Record<string, unknown>;
    };
    testnet: {
      signParams: Record<string, unknown>;
      signResult: Record<string, unknown>;
    };
  };
  signZkTransaction: {
    mainnet: {
      signParams: Record<string, unknown>;
      signResult: Record<string, unknown>;
    };
    testnet: {
      signParams: Record<string, unknown>;
      signResult: Record<string, unknown>;
    };
  };
  signMessage: {
    mainnet: {
      signParams: Record<string, unknown>;
      signResult: Record<string, unknown>;
    };
    testnet: {
      signParams: Record<string, unknown>;
      signResult: Record<string, unknown>;
    };
  };
  signFileds: {
    mainnet: {
      signParams: Record<string, unknown>;
      signResult: {
        signature: string;
        publicKey: string;
        data: string[];
      };
    };
    testnet: {
      signParams: Record<string, unknown>;
      signResult: {
        signature: string;
        publicKey: string;
        data: string[];
      };
    };
  };
  nullifierData: {
    mainnet: {
      signParams: Record<string, unknown>;
    };
    testnet: {
      signParams: Record<string, unknown>;
    };
  };
}

export const signDataV2: SignDataV2;
