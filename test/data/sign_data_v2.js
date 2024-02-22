import { DAppActions } from "@aurowallet/mina-provider";

/**
 * data for runTransactionTest
 * generate by auro wallet extension & mina signer 3.0.0
 */
export const signDataV2 = {
  testAccount: {
    privateKey: "EKEfKdYoaCeGy4aZoCSam6DdGejrL121HSwFGrckzkLcLqPTMUxW",
    publicKey: "B62qkVs6zgN84e1KjFxurigqTQ57FqV3KnWubV3t77E9R6uBm4DmkPi",
  },
  signPayment: {
    testnet: {
      signParams: {
        sendAction: DAppActions.mina_sendPayment,
        privateKey: "EKEfKdYoaCeGy4aZoCSam6DdGejrL121HSwFGrckzkLcLqPTMUxW",
        fromAddress: "B62qkVs6zgN84e1KjFxurigqTQ57FqV3KnWubV3t77E9R6uBm4DmkPi",
        toAddress: "B62qk3FF1FxfFxfJ4CLSgu2YehPdRqcNZw7Jw3z1JMyH28cSNR6XYDW",
        amount: 2,
        fee: "0.0101",
        nonce: "0",
        memo: "memo",
      },
      signResult: {
        signature: {
          field:
            "7288970118831265138684977356943337637625457123865384401402653589992336460146",
          scalar:
            "7605452881258363256115790706062603959517087732555830155142578942068647425310",
        },
        publicKey: "B62qkVs6zgN84e1KjFxurigqTQ57FqV3KnWubV3t77E9R6uBm4DmkPi",
        data: {
          to: "B62qk3FF1FxfFxfJ4CLSgu2YehPdRqcNZw7Jw3z1JMyH28cSNR6XYDW",
          from: "B62qkVs6zgN84e1KjFxurigqTQ57FqV3KnWubV3t77E9R6uBm4DmkPi",
          fee: "10100000",
          amount: "2000000000",
          nonce: "0",
          memo: "memo",
          validUntil: "4294967295",
        },
      },
    },
  }
};
