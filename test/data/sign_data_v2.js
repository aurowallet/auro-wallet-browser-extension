const {DAppActions} = require("@aurowallet/mina-provider")

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
    mainnet: {
      signParams: {
        sendAction: DAppActions.mina_sendPayment,
        privateKey: "EKEfKdYoaCeGy4aZoCSam6DdGejrL121HSwFGrckzkLcLqPTMUxW",
        fromAddress: "B62qkVs6zgN84e1KjFxurigqTQ57FqV3KnWubV3t77E9R6uBm4DmkPi",
        toAddress: "B62qk3FF1FxfFxfJ4CLSgu2YehPdRqcNZw7Jw3z1JMyH28cSNR6XYDW",
        amount: 2,
        fee: "0.0101",
        nonce: 0,
        memo: "test",
      },
      signResult: {
        signature: {
          field:
            "20311706319359642986780891923520743692135877298935584691213957835956555795643",
          scalar:
            "13140592006985835984040193443421181226751048988610893490079171121434041489504",
        },
        publicKey: "B62qkVs6zgN84e1KjFxurigqTQ57FqV3KnWubV3t77E9R6uBm4DmkPi",
        data: {
          to: "B62qk3FF1FxfFxfJ4CLSgu2YehPdRqcNZw7Jw3z1JMyH28cSNR6XYDW",
          from: "B62qkVs6zgN84e1KjFxurigqTQ57FqV3KnWubV3t77E9R6uBm4DmkPi",
          fee: "10100000",
          amount: "2000000000",
          nonce: "0",
          memo: "test",
          validUntil: "4294967295",
        },
      },
    },
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
  },
  signStakeTransaction: {
    testnet: {
      signParams: {
        sendAction: DAppActions.mina_sendStakeDelegation,
        privateKey: "EKEfKdYoaCeGy4aZoCSam6DdGejrL121HSwFGrckzkLcLqPTMUxW",
        fee: "0.0101",
        fromAddress: "B62qkVs6zgN84e1KjFxurigqTQ57FqV3KnWubV3t77E9R6uBm4DmkPi",
        memo: "",
        nonce: "1",
        toAddress: "B62qq3TQ8AP7MFYPVtMx5tZGF3kWLJukfwG1A1RGvaBW1jfTPTkDBW6",
      },
      signResult: {
        signature: {
          field:
            "17483660890110438926466750737662918625669120723026518332424067073684081587587",
          scalar:
            "22012784960050638352505737214335769684778127445772268079256066240929149921687",
        },
        publicKey: "B62qkVs6zgN84e1KjFxurigqTQ57FqV3KnWubV3t77E9R6uBm4DmkPi",
        data: {
          to: "B62qq3TQ8AP7MFYPVtMx5tZGF3kWLJukfwG1A1RGvaBW1jfTPTkDBW6",
          from: "B62qkVs6zgN84e1KjFxurigqTQ57FqV3KnWubV3t77E9R6uBm4DmkPi",
          fee: "10100000",
          nonce: "1",
          memo: "",
          validUntil: "4294967295",
        },
      },
    },
  },
};
