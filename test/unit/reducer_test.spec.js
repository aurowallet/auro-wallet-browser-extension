import assert from "assert";
import {
  processTokenList,
  processTokenShowStatus,
  processNewTokenStatus,
  formatPendingTx,
  setScamAndTxList,
  formatAllTxHistory,
} from "../../src/utils/reducer";

describe("Reducer Utils Test", function () {
  describe("processTokenList", () => {
    it("should return parse token assets", () => {
      assert.deepStrictEqual(
        processTokenList(
          [
            {
              tokenId: "xvoiUpngKPVLAqjqKb5qXQvQBmk9DncPEaGJXzehoRSNrDB45r",
              name: "TEST",
              symbol: "pqhx2",
              decimal: "8",
              address:
                "B62qjZkcgoTT4W1KB2GvmRxe4EX5W5quTDyzRiFjRPJXbhFAG1m2rkt",
              iconUrl:
                "https://raw.githubusercontent.com/aurowallet/launch/master/token/mina_mainnet/assets/xvoiUpngKPVLAqjqKb5qXQvQBmk9DncPEaGJXzehoRSNrDB45r/icon.png",
            },
            {
              tokenId: "y9udmffu2J1Wrgnwwp4WeYtQcHT1ApQmSDJ1xAwmUKeMooJhDR",
              name: "Wrap ETH",
              symbol: "WETH",
              decimal: "9",
              address:
                "B62qoNVDNgu3TAjPWE8DXD44Vgz69CWVSDYgZXFz6kFHTy3Pdy1zYee",
              iconUrl:
                "https://raw.githubusercontent.com/aurowallet/launch/master/token/mina_mainnet/assets/y9udmffu2J1Wrgnwwp4WeYtQcHT1ApQmSDJ1xAwmUKeMooJhDR/icon.png",
            },
          ],
          [
            {
              balance: { total: "19331533399", liquid: "19331533399" },
              inferredNonce: "918",
              delegateAccount: {
                publicKey:
                  "B62qq3TQ8AP7MFYPVtMx5tZGF3kWLJukfwG1A1RGvaBW1jfTPTkDBW6",
              },
              tokenId: "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: null,
            },
            {
              balance: { total: "0", liquid: "0" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "y96qmT865fCMGGHdKAQ448uUwqs7dEfqnGBGVrv3tiRKTC2hxE",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qpN6sE9Bg9vzYVfs4ZBajgnv2sobb8fy76wZPB5vWM27s9GgtUTA",
                tokenSymbol: "Httpz",
                zkappState: [
                  "9",
                  "18963488805645248627756258675847459723430916634705919778566043433748216778309",
                  "1",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
            },
            {
              balance: { total: "4803254321", liquid: "4803254321" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "xvoiUpngKPVLAqjqKb5qXQvQBmk9DncPEaGJXzehoRSNrDB45r",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qjZkcgoTT4W1KB2GvmRxe4EX5W5quTDyzRiFjRPJXbhFAG1m2rkt",
                tokenSymbol: "pqhx2",
                zkappState: [
                  "8",
                  "25902362010904379203937754849593382060026416826875923209187771478254681684448",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
            },
            {
              balance: { total: "0", liquid: "0" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "y9udmffu2J1Wrgnwwp4WeYtQcHT1ApQmSDJ1xAwmUKeMooJhDR",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qoNVDNgu3TAjPWE8DXD44Vgz69CWVSDYgZXFz6kFHTy3Pdy1zYee",
                tokenSymbol: "WETH",
                zkappState: [
                  "9",
                  "9767683965161123823933144097224389482022700061951665309216207193404125342816",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
            },
            {
              balance: { total: "1938204987", liquid: "1938204987" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "xLpobAxWSYZeyKuiEb4kzHHYQKn6X1vKmFR4Dmz9TCADLrYTD1",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qmMv99rMLCjnApLERcvof6fP4YD4wqeCXUrFuthHfTNoHbYgmy1i",
                tokenSymbol: "7UjV6",
                zkappState: [
                  "6",
                  "9938549834568348486024228125160774343795968951916393733251207678857993787005",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
            },
          ],
          { wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf: 0.166733 },
          [],
          {}
        ),
        {
          tokenList: [
            {
              balance: { total: "19331533399", liquid: "19331533399" },
              inferredNonce: "918",
              delegateAccount: {
                publicKey:
                  "B62qq3TQ8AP7MFYPVtMx5tZGF3kWLJukfwG1A1RGvaBW1jfTPTkDBW6",
              },
              tokenId: "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: null,
              localConfig: { hideToken: false },
              tokenBaseInfo: {
                isScam: false,
                iconUrl: "img/mina_color.svg",
                decimals: 9,
                isMainToken: true,
                isDelegation: true,
                showBalance: "19.331533399",
                showAmount: "3.223204558215467",
                tokenShowed: false,
              },
            },
            {
              balance: { total: "1938204987", liquid: "1938204987" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "xLpobAxWSYZeyKuiEb4kzHHYQKn6X1vKmFR4Dmz9TCADLrYTD1",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qmMv99rMLCjnApLERcvof6fP4YD4wqeCXUrFuthHfTNoHbYgmy1i",
                tokenSymbol: "7UjV6",
                zkappState: [
                  "6",
                  "9938549834568348486024228125160774343795968951916393733251207678857993787005",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
              localConfig: { hideToken: true },
              tokenBaseInfo: {
                isScam: false,
                iconUrl: "",
                decimals: "6",
                showBalance: "1938.204987",
                tokenShowed: false,
              },
            },
            {
              balance: { total: "4803254321", liquid: "4803254321" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "xvoiUpngKPVLAqjqKb5qXQvQBmk9DncPEaGJXzehoRSNrDB45r",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qjZkcgoTT4W1KB2GvmRxe4EX5W5quTDyzRiFjRPJXbhFAG1m2rkt",
                tokenSymbol: "pqhx2",
                zkappState: [
                  "8",
                  "25902362010904379203937754849593382060026416826875923209187771478254681684448",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
              localConfig: { hideToken: false },
              tokenBaseInfo: {
                isScam: false,
                iconUrl:
                  "https://raw.githubusercontent.com/aurowallet/launch/master/token/mina_mainnet/assets/xvoiUpngKPVLAqjqKb5qXQvQBmk9DncPEaGJXzehoRSNrDB45r/icon.png",
                decimals: "8",
                showBalance: "48.03254321",
                tokenShowed: false,
              },
            },
            {
              balance: { total: "0", liquid: "0" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "y96qmT865fCMGGHdKAQ448uUwqs7dEfqnGBGVrv3tiRKTC2hxE",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qpN6sE9Bg9vzYVfs4ZBajgnv2sobb8fy76wZPB5vWM27s9GgtUTA",
                tokenSymbol: "Httpz",
                zkappState: [
                  "9",
                  "18963488805645248627756258675847459723430916634705919778566043433748216778309",
                  "1",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
              localConfig: { hideToken: true },
              tokenBaseInfo: {
                isScam: false,
                iconUrl: "",
                decimals: "9",
                showBalance: "0",
                tokenShowed: false,
              },
            },
            {
              balance: { total: "0", liquid: "0" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "y9udmffu2J1Wrgnwwp4WeYtQcHT1ApQmSDJ1xAwmUKeMooJhDR",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qoNVDNgu3TAjPWE8DXD44Vgz69CWVSDYgZXFz6kFHTy3Pdy1zYee",
                tokenSymbol: "WETH",
                zkappState: [
                  "9",
                  "9767683965161123823933144097224389482022700061951665309216207193404125342816",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
              localConfig: { hideToken: false },
              tokenBaseInfo: {
                isScam: false,
                iconUrl:
                  "https://raw.githubusercontent.com/aurowallet/launch/master/token/mina_mainnet/assets/y9udmffu2J1Wrgnwwp4WeYtQcHT1ApQmSDJ1xAwmUKeMooJhDR/icon.png",
                decimals: "9",
                showBalance: "0",
                tokenShowed: false,
              },
            },
          ],
          tokenTotalAmount: "3.223204558215467",
          tokenShowList: [
            {
              balance: { total: "19331533399", liquid: "19331533399" },
              inferredNonce: "918",
              delegateAccount: {
                publicKey:
                  "B62qq3TQ8AP7MFYPVtMx5tZGF3kWLJukfwG1A1RGvaBW1jfTPTkDBW6",
              },
              tokenId: "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: null,
              localConfig: { hideToken: false },
              tokenBaseInfo: {
                isScam: false,
                iconUrl: "img/mina_color.svg",
                decimals: 9,
                isMainToken: true,
                isDelegation: true,
                showBalance: "19.331533399",
                showAmount: "3.223204558215467",
                tokenShowed: false,
              },
            },
            {
              balance: { total: "4803254321", liquid: "4803254321" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "xvoiUpngKPVLAqjqKb5qXQvQBmk9DncPEaGJXzehoRSNrDB45r",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qjZkcgoTT4W1KB2GvmRxe4EX5W5quTDyzRiFjRPJXbhFAG1m2rkt",
                tokenSymbol: "pqhx2",
                zkappState: [
                  "8",
                  "25902362010904379203937754849593382060026416826875923209187771478254681684448",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
              localConfig: { hideToken: false },
              tokenBaseInfo: {
                isScam: false,
                iconUrl:
                  "https://raw.githubusercontent.com/aurowallet/launch/master/token/mina_mainnet/assets/xvoiUpngKPVLAqjqKb5qXQvQBmk9DncPEaGJXzehoRSNrDB45r/icon.png",
                decimals: "8",
                showBalance: "48.03254321",
                tokenShowed: false,
              },
            },
            {
              balance: { total: "0", liquid: "0" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "y9udmffu2J1Wrgnwwp4WeYtQcHT1ApQmSDJ1xAwmUKeMooJhDR",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qoNVDNgu3TAjPWE8DXD44Vgz69CWVSDYgZXFz6kFHTy3Pdy1zYee",
                tokenSymbol: "WETH",
                zkappState: [
                  "9",
                  "9767683965161123823933144097224389482022700061951665309216207193404125342816",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
              localConfig: { hideToken: false },
              tokenBaseInfo: {
                isScam: false,
                iconUrl:
                  "https://raw.githubusercontent.com/aurowallet/launch/master/token/mina_mainnet/assets/y9udmffu2J1Wrgnwwp4WeYtQcHT1ApQmSDJ1xAwmUKeMooJhDR/icon.png",
                decimals: "9",
                showBalance: "0",
                tokenShowed: false,
              },
            },
          ],
          mainTokenNetInfo: {
            balance: { total: "19331533399", liquid: "19331533399" },
            inferredNonce: "918",
            delegateAccount: {
              publicKey:
                "B62qq3TQ8AP7MFYPVtMx5tZGF3kWLJukfwG1A1RGvaBW1jfTPTkDBW6",
            },
            tokenId: "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
            publicKey:
              "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
            zkappUri: null,
            tokenNetInfo: null,
            localConfig: { hideToken: false },
            tokenBaseInfo: {
              isScam: false,
              iconUrl: "img/mina_color.svg",
              decimals: 9,
              isMainToken: true,
              isDelegation: true,
              showBalance: "19.331533399",
              showAmount: "3.223204558215467",
              tokenShowed: false,
            },
          },
          newTokenCount: 4,
        }
      );
    });
  });

  describe("processTokenShowStatus", () => {
    it("should update token display status", () => {
      assert.deepStrictEqual(
        processTokenShowStatus(
          [
            {
              balance: { total: "19331533399", liquid: "19331533399" },
              inferredNonce: "918",
              delegateAccount: {
                publicKey:
                  "B62qq3TQ8AP7MFYPVtMx5tZGF3kWLJukfwG1A1RGvaBW1jfTPTkDBW6",
              },
              tokenId: "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: null,
              localConfig: { hideToken: false },
              tokenBaseInfo: {
                isScam: false,
                iconUrl: "img/mina_color.svg",
                decimals: 9,
                isMainToken: true,
                isDelegation: true,
                showBalance: "19.331533399",
                showAmount: "3.218159027998328",
                tokenShowed: false,
              },
            },
            {
              balance: { total: "1938204987", liquid: "1938204987" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "xLpobAxWSYZeyKuiEb4kzHHYQKn6X1vKmFR4Dmz9TCADLrYTD1",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qmMv99rMLCjnApLERcvof6fP4YD4wqeCXUrFuthHfTNoHbYgmy1i",
                tokenSymbol: "7UjV6",
                zkappState: [
                  "6",
                  "9938549834568348486024228125160774343795968951916393733251207678857993787005",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
              localConfig: { hideToken: true },
              tokenBaseInfo: {
                isScam: false,
                iconUrl: "",
                decimals: "6",
                showBalance: "1938.204987",
                tokenShowed: false,
              },
            },
            {
              balance: { total: "4803254321", liquid: "4803254321" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "xvoiUpngKPVLAqjqKb5qXQvQBmk9DncPEaGJXzehoRSNrDB45r",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qjZkcgoTT4W1KB2GvmRxe4EX5W5quTDyzRiFjRPJXbhFAG1m2rkt",
                tokenSymbol: "pqhx2",
                zkappState: [
                  "8",
                  "25902362010904379203937754849593382060026416826875923209187771478254681684448",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
              localConfig: { hideToken: false },
              tokenBaseInfo: {
                isScam: false,
                iconUrl:
                  "https://raw.githubusercontent.com/aurowallet/launch/master/token/mina_mainnet/assets/xvoiUpngKPVLAqjqKb5qXQvQBmk9DncPEaGJXzehoRSNrDB45r/icon.png",
                decimals: "8",
                showBalance: "48.03254321",
                tokenShowed: false,
              },
            },
            {
              balance: { total: "0", liquid: "0" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "y96qmT865fCMGGHdKAQ448uUwqs7dEfqnGBGVrv3tiRKTC2hxE",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qpN6sE9Bg9vzYVfs4ZBajgnv2sobb8fy76wZPB5vWM27s9GgtUTA",
                tokenSymbol: "Httpz",
                zkappState: [
                  "9",
                  "18963488805645248627756258675847459723430916634705919778566043433748216778309",
                  "1",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
              localConfig: { hideToken: true },
              tokenBaseInfo: {
                isScam: false,
                iconUrl: "",
                decimals: "9",
                showBalance: "0",
                tokenShowed: false,
              },
            },
            {
              balance: { total: "0", liquid: "0" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "y9udmffu2J1Wrgnwwp4WeYtQcHT1ApQmSDJ1xAwmUKeMooJhDR",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qoNVDNgu3TAjPWE8DXD44Vgz69CWVSDYgZXFz6kFHTy3Pdy1zYee",
                tokenSymbol: "WETH",
                zkappState: [
                  "9",
                  "9767683965161123823933144097224389482022700061951665309216207193404125342816",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
              localConfig: { hideToken: false },
              tokenBaseInfo: {
                isScam: false,
                iconUrl:
                  "https://raw.githubusercontent.com/aurowallet/launch/master/token/mina_mainnet/assets/y9udmffu2J1Wrgnwwp4WeYtQcHT1ApQmSDJ1xAwmUKeMooJhDR/icon.png",
                decimals: "9",
                showBalance: "0",
                tokenShowed: false,
              },
            },
          ],
          {
            xLpobAxWSYZeyKuiEb4kzHHYQKn6X1vKmFR4Dmz9TCADLrYTD1: {
              hideToken: false,
            },
          },
          "xLpobAxWSYZeyKuiEb4kzHHYQKn6X1vKmFR4Dmz9TCADLrYTD1"
        ),
        {
          tokenList: [
            {
              balance: { total: "19331533399", liquid: "19331533399" },
              inferredNonce: "918",
              delegateAccount: {
                publicKey:
                  "B62qq3TQ8AP7MFYPVtMx5tZGF3kWLJukfwG1A1RGvaBW1jfTPTkDBW6",
              },
              tokenId: "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: null,
              localConfig: { hideToken: false },
              tokenBaseInfo: {
                isScam: false,
                iconUrl: "img/mina_color.svg",
                decimals: 9,
                isMainToken: true,
                isDelegation: true,
                showBalance: "19.331533399",
                showAmount: "3.218159027998328",
                tokenShowed: false,
              },
            },
            {
              balance: { total: "1938204987", liquid: "1938204987" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "xLpobAxWSYZeyKuiEb4kzHHYQKn6X1vKmFR4Dmz9TCADLrYTD1",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qmMv99rMLCjnApLERcvof6fP4YD4wqeCXUrFuthHfTNoHbYgmy1i",
                tokenSymbol: "7UjV6",
                zkappState: [
                  "6",
                  "9938549834568348486024228125160774343795968951916393733251207678857993787005",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
              localConfig: { hideToken: false },
              tokenBaseInfo: {
                isScam: false,
                iconUrl: "",
                decimals: "6",
                showBalance: "1938.204987",
                tokenShowed: false,
              },
            },
            {
              balance: { total: "4803254321", liquid: "4803254321" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "xvoiUpngKPVLAqjqKb5qXQvQBmk9DncPEaGJXzehoRSNrDB45r",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qjZkcgoTT4W1KB2GvmRxe4EX5W5quTDyzRiFjRPJXbhFAG1m2rkt",
                tokenSymbol: "pqhx2",
                zkappState: [
                  "8",
                  "25902362010904379203937754849593382060026416826875923209187771478254681684448",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
              localConfig: { hideToken: false },
              tokenBaseInfo: {
                isScam: false,
                iconUrl:
                  "https://raw.githubusercontent.com/aurowallet/launch/master/token/mina_mainnet/assets/xvoiUpngKPVLAqjqKb5qXQvQBmk9DncPEaGJXzehoRSNrDB45r/icon.png",
                decimals: "8",
                showBalance: "48.03254321",
                tokenShowed: false,
              },
            },
            {
              balance: { total: "0", liquid: "0" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "y96qmT865fCMGGHdKAQ448uUwqs7dEfqnGBGVrv3tiRKTC2hxE",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qpN6sE9Bg9vzYVfs4ZBajgnv2sobb8fy76wZPB5vWM27s9GgtUTA",
                tokenSymbol: "Httpz",
                zkappState: [
                  "9",
                  "18963488805645248627756258675847459723430916634705919778566043433748216778309",
                  "1",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
              localConfig: { hideToken: true },
              tokenBaseInfo: {
                isScam: false,
                iconUrl: "",
                decimals: "9",
                showBalance: "0",
                tokenShowed: false,
              },
            },
            {
              balance: { total: "0", liquid: "0" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "y9udmffu2J1Wrgnwwp4WeYtQcHT1ApQmSDJ1xAwmUKeMooJhDR",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qoNVDNgu3TAjPWE8DXD44Vgz69CWVSDYgZXFz6kFHTy3Pdy1zYee",
                tokenSymbol: "WETH",
                zkappState: [
                  "9",
                  "9767683965161123823933144097224389482022700061951665309216207193404125342816",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
              localConfig: { hideToken: false },
              tokenBaseInfo: {
                isScam: false,
                iconUrl:
                  "https://raw.githubusercontent.com/aurowallet/launch/master/token/mina_mainnet/assets/y9udmffu2J1Wrgnwwp4WeYtQcHT1ApQmSDJ1xAwmUKeMooJhDR/icon.png",
                decimals: "9",
                showBalance: "0",
                tokenShowed: false,
              },
            },
          ],
          tokenShowList: [
            {
              balance: { total: "19331533399", liquid: "19331533399" },
              inferredNonce: "918",
              delegateAccount: {
                publicKey:
                  "B62qq3TQ8AP7MFYPVtMx5tZGF3kWLJukfwG1A1RGvaBW1jfTPTkDBW6",
              },
              tokenId: "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: null,
              localConfig: { hideToken: false },
              tokenBaseInfo: {
                isScam: false,
                iconUrl: "img/mina_color.svg",
                decimals: 9,
                isMainToken: true,
                isDelegation: true,
                showBalance: "19.331533399",
                showAmount: "3.218159027998328",
                tokenShowed: false,
              },
            },
            {
              balance: { total: "1938204987", liquid: "1938204987" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "xLpobAxWSYZeyKuiEb4kzHHYQKn6X1vKmFR4Dmz9TCADLrYTD1",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qmMv99rMLCjnApLERcvof6fP4YD4wqeCXUrFuthHfTNoHbYgmy1i",
                tokenSymbol: "7UjV6",
                zkappState: [
                  "6",
                  "9938549834568348486024228125160774343795968951916393733251207678857993787005",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
              localConfig: { hideToken: true },
              tokenBaseInfo: {
                isScam: false,
                iconUrl: "",
                decimals: "6",
                showBalance: "1938.204987",
                tokenShowed: false,
              },
            },
            {
              balance: { total: "4803254321", liquid: "4803254321" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "xvoiUpngKPVLAqjqKb5qXQvQBmk9DncPEaGJXzehoRSNrDB45r",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qjZkcgoTT4W1KB2GvmRxe4EX5W5quTDyzRiFjRPJXbhFAG1m2rkt",
                tokenSymbol: "pqhx2",
                zkappState: [
                  "8",
                  "25902362010904379203937754849593382060026416826875923209187771478254681684448",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
              localConfig: { hideToken: false },
              tokenBaseInfo: {
                isScam: false,
                iconUrl:
                  "https://raw.githubusercontent.com/aurowallet/launch/master/token/mina_mainnet/assets/xvoiUpngKPVLAqjqKb5qXQvQBmk9DncPEaGJXzehoRSNrDB45r/icon.png",
                decimals: "8",
                showBalance: "48.03254321",
                tokenShowed: false,
              },
            },
            {
              balance: { total: "0", liquid: "0" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "y9udmffu2J1Wrgnwwp4WeYtQcHT1ApQmSDJ1xAwmUKeMooJhDR",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qoNVDNgu3TAjPWE8DXD44Vgz69CWVSDYgZXFz6kFHTy3Pdy1zYee",
                tokenSymbol: "WETH",
                zkappState: [
                  "9",
                  "9767683965161123823933144097224389482022700061951665309216207193404125342816",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
              localConfig: { hideToken: false },
              tokenBaseInfo: {
                isScam: false,
                iconUrl:
                  "https://raw.githubusercontent.com/aurowallet/launch/master/token/mina_mainnet/assets/y9udmffu2J1Wrgnwwp4WeYtQcHT1ApQmSDJ1xAwmUKeMooJhDR/icon.png",
                decimals: "9",
                showBalance: "0",
                tokenShowed: false,
              },
            },
          ],
          totalShowAmount: "3.218159027998328",
        }
      );
    });
  });

  describe("processNewTokenStatus", () => {
    it("should ignore new token tip", () => {
      assert.deepStrictEqual(
        processNewTokenStatus(
          [
            {
              balance: { total: "19331533399", liquid: "19331533399" },
              inferredNonce: "918",
              delegateAccount: {
                publicKey:
                  "B62qq3TQ8AP7MFYPVtMx5tZGF3kWLJukfwG1A1RGvaBW1jfTPTkDBW6",
              },
              tokenId: "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: null,
              localConfig: { hideToken: false },
              tokenBaseInfo: {
                isScam: false,
                iconUrl: "img/mina_color.svg",
                decimals: 9,
                isMainToken: true,
                isDelegation: true,
                showBalance: "19.331533399",
                showAmount: "3.218159027998328",
                tokenShowed: false,
              },
            },
            {
              balance: { total: "1938204987", liquid: "1938204987" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "xLpobAxWSYZeyKuiEb4kzHHYQKn6X1vKmFR4Dmz9TCADLrYTD1",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qmMv99rMLCjnApLERcvof6fP4YD4wqeCXUrFuthHfTNoHbYgmy1i",
                tokenSymbol: "7UjV6",
                zkappState: [
                  "6",
                  "9938549834568348486024228125160774343795968951916393733251207678857993787005",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
              localConfig: { hideToken: false },
              tokenBaseInfo: {
                isScam: false,
                iconUrl: "",
                decimals: "6",
                showBalance: "1938.204987",
                tokenShowed: false,
              },
            },
            {
              balance: { total: "4803254321", liquid: "4803254321" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "xvoiUpngKPVLAqjqKb5qXQvQBmk9DncPEaGJXzehoRSNrDB45r",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qjZkcgoTT4W1KB2GvmRxe4EX5W5quTDyzRiFjRPJXbhFAG1m2rkt",
                tokenSymbol: "pqhx2",
                zkappState: [
                  "8",
                  "25902362010904379203937754849593382060026416826875923209187771478254681684448",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
              localConfig: { hideToken: false },
              tokenBaseInfo: {
                isScam: false,
                iconUrl:
                  "https://raw.githubusercontent.com/aurowallet/launch/master/token/mina_mainnet/assets/xvoiUpngKPVLAqjqKb5qXQvQBmk9DncPEaGJXzehoRSNrDB45r/icon.png",
                decimals: "8",
                showBalance: "48.03254321",
                tokenShowed: false,
              },
            },
            {
              balance: { total: "0", liquid: "0" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "y96qmT865fCMGGHdKAQ448uUwqs7dEfqnGBGVrv3tiRKTC2hxE",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qpN6sE9Bg9vzYVfs4ZBajgnv2sobb8fy76wZPB5vWM27s9GgtUTA",
                tokenSymbol: "Httpz",
                zkappState: [
                  "9",
                  "18963488805645248627756258675847459723430916634705919778566043433748216778309",
                  "1",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
              localConfig: { hideToken: true },
              tokenBaseInfo: {
                isScam: false,
                iconUrl: "",
                decimals: "9",
                showBalance: "0",
                tokenShowed: false,
              },
            },
            {
              balance: { total: "0", liquid: "0" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "y9udmffu2J1Wrgnwwp4WeYtQcHT1ApQmSDJ1xAwmUKeMooJhDR",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qoNVDNgu3TAjPWE8DXD44Vgz69CWVSDYgZXFz6kFHTy3Pdy1zYee",
                tokenSymbol: "WETH",
                zkappState: [
                  "9",
                  "9767683965161123823933144097224389482022700061951665309216207193404125342816",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
              localConfig: { hideToken: false },
              tokenBaseInfo: {
                isScam: false,
                iconUrl:
                  "https://raw.githubusercontent.com/aurowallet/launch/master/token/mina_mainnet/assets/y9udmffu2J1Wrgnwwp4WeYtQcHT1ApQmSDJ1xAwmUKeMooJhDR/icon.png",
                decimals: "9",
                showBalance: "0",
                tokenShowed: false,
              },
            },
          ],
          [
            "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
            "xLpobAxWSYZeyKuiEb4kzHHYQKn6X1vKmFR4Dmz9TCADLrYTD1",
            "xvoiUpngKPVLAqjqKb5qXQvQBmk9DncPEaGJXzehoRSNrDB45r",
            "y96qmT865fCMGGHdKAQ448uUwqs7dEfqnGBGVrv3tiRKTC2hxE",
            "y9udmffu2J1Wrgnwwp4WeYtQcHT1ApQmSDJ1xAwmUKeMooJhDR",
          ]
        ),
        {
          tokenList: [
            {
              balance: { total: "19331533399", liquid: "19331533399" },
              inferredNonce: "918",
              delegateAccount: {
                publicKey:
                  "B62qq3TQ8AP7MFYPVtMx5tZGF3kWLJukfwG1A1RGvaBW1jfTPTkDBW6",
              },
              tokenId: "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: null,
              localConfig: { hideToken: false },
              tokenBaseInfo: {
                isScam: false,
                iconUrl: "img/mina_color.svg",
                decimals: 9,
                isMainToken: true,
                isDelegation: true,
                showBalance: "19.331533399",
                showAmount: "3.218159027998328",
                tokenShowed: true,
              },
            },
            {
              balance: { total: "1938204987", liquid: "1938204987" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "xLpobAxWSYZeyKuiEb4kzHHYQKn6X1vKmFR4Dmz9TCADLrYTD1",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qmMv99rMLCjnApLERcvof6fP4YD4wqeCXUrFuthHfTNoHbYgmy1i",
                tokenSymbol: "7UjV6",
                zkappState: [
                  "6",
                  "9938549834568348486024228125160774343795968951916393733251207678857993787005",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
              localConfig: { hideToken: false },
              tokenBaseInfo: {
                isScam: false,
                iconUrl: "",
                decimals: "6",
                showBalance: "1938.204987",
                tokenShowed: true,
              },
            },
            {
              balance: { total: "4803254321", liquid: "4803254321" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "xvoiUpngKPVLAqjqKb5qXQvQBmk9DncPEaGJXzehoRSNrDB45r",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qjZkcgoTT4W1KB2GvmRxe4EX5W5quTDyzRiFjRPJXbhFAG1m2rkt",
                tokenSymbol: "pqhx2",
                zkappState: [
                  "8",
                  "25902362010904379203937754849593382060026416826875923209187771478254681684448",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
              localConfig: { hideToken: false },
              tokenBaseInfo: {
                isScam: false,
                iconUrl:
                  "https://raw.githubusercontent.com/aurowallet/launch/master/token/mina_mainnet/assets/xvoiUpngKPVLAqjqKb5qXQvQBmk9DncPEaGJXzehoRSNrDB45r/icon.png",
                decimals: "8",
                showBalance: "48.03254321",
                tokenShowed: true,
              },
            },
            {
              balance: { total: "0", liquid: "0" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "y96qmT865fCMGGHdKAQ448uUwqs7dEfqnGBGVrv3tiRKTC2hxE",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qpN6sE9Bg9vzYVfs4ZBajgnv2sobb8fy76wZPB5vWM27s9GgtUTA",
                tokenSymbol: "Httpz",
                zkappState: [
                  "9",
                  "18963488805645248627756258675847459723430916634705919778566043433748216778309",
                  "1",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
              localConfig: { hideToken: true },
              tokenBaseInfo: {
                isScam: false,
                iconUrl: "",
                decimals: "9",
                showBalance: "0",
                tokenShowed: true,
              },
            },
            {
              balance: { total: "0", liquid: "0" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "y9udmffu2J1Wrgnwwp4WeYtQcHT1ApQmSDJ1xAwmUKeMooJhDR",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qoNVDNgu3TAjPWE8DXD44Vgz69CWVSDYgZXFz6kFHTy3Pdy1zYee",
                tokenSymbol: "WETH",
                zkappState: [
                  "9",
                  "9767683965161123823933144097224389482022700061951665309216207193404125342816",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
              localConfig: { hideToken: false },
              tokenBaseInfo: {
                isScam: false,
                iconUrl:
                  "https://raw.githubusercontent.com/aurowallet/launch/master/token/mina_mainnet/assets/y9udmffu2J1Wrgnwwp4WeYtQcHT1ApQmSDJ1xAwmUKeMooJhDR/icon.png",
                decimals: "9",
                showBalance: "0",
                tokenShowed: true,
              },
            },
          ],
          tokenShowList: [
            {
              balance: { total: "19331533399", liquid: "19331533399" },
              inferredNonce: "918",
              delegateAccount: {
                publicKey:
                  "B62qq3TQ8AP7MFYPVtMx5tZGF3kWLJukfwG1A1RGvaBW1jfTPTkDBW6",
              },
              tokenId: "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: null,
              localConfig: { hideToken: false },
              tokenBaseInfo: {
                isScam: false,
                iconUrl: "img/mina_color.svg",
                decimals: 9,
                isMainToken: true,
                isDelegation: true,
                showBalance: "19.331533399",
                showAmount: "3.218159027998328",
                tokenShowed: true,
              },
            },
            {
              balance: { total: "1938204987", liquid: "1938204987" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "xLpobAxWSYZeyKuiEb4kzHHYQKn6X1vKmFR4Dmz9TCADLrYTD1",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qmMv99rMLCjnApLERcvof6fP4YD4wqeCXUrFuthHfTNoHbYgmy1i",
                tokenSymbol: "7UjV6",
                zkappState: [
                  "6",
                  "9938549834568348486024228125160774343795968951916393733251207678857993787005",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
              localConfig: { hideToken: false },
              tokenBaseInfo: {
                isScam: false,
                iconUrl: "",
                decimals: "6",
                showBalance: "1938.204987",
                tokenShowed: true,
              },
            },
            {
              balance: { total: "4803254321", liquid: "4803254321" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "xvoiUpngKPVLAqjqKb5qXQvQBmk9DncPEaGJXzehoRSNrDB45r",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qjZkcgoTT4W1KB2GvmRxe4EX5W5quTDyzRiFjRPJXbhFAG1m2rkt",
                tokenSymbol: "pqhx2",
                zkappState: [
                  "8",
                  "25902362010904379203937754849593382060026416826875923209187771478254681684448",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
              localConfig: { hideToken: false },
              tokenBaseInfo: {
                isScam: false,
                iconUrl:
                  "https://raw.githubusercontent.com/aurowallet/launch/master/token/mina_mainnet/assets/xvoiUpngKPVLAqjqKb5qXQvQBmk9DncPEaGJXzehoRSNrDB45r/icon.png",
                decimals: "8",
                showBalance: "48.03254321",
                tokenShowed: true,
              },
            },
            {
              balance: { total: "0", liquid: "0" },
              inferredNonce: "0",
              delegateAccount: null,
              tokenId: "y9udmffu2J1Wrgnwwp4WeYtQcHT1ApQmSDJ1xAwmUKeMooJhDR",
              publicKey:
                "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              zkappUri: null,
              tokenNetInfo: {
                publicKey:
                  "B62qoNVDNgu3TAjPWE8DXD44Vgz69CWVSDYgZXFz6kFHTy3Pdy1zYee",
                tokenSymbol: "WETH",
                zkappState: [
                  "9",
                  "9767683965161123823933144097224389482022700061951665309216207193404125342816",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                  "0",
                ],
              },
              localConfig: { hideToken: false },
              tokenBaseInfo: {
                isScam: false,
                iconUrl:
                  "https://raw.githubusercontent.com/aurowallet/launch/master/token/mina_mainnet/assets/y9udmffu2J1Wrgnwwp4WeYtQcHT1ApQmSDJ1xAwmUKeMooJhDR/icon.png",
                decimals: "9",
                showBalance: "0",
                tokenShowed: true,
              },
            },
          ],
          mainTokenNetInfo: {
            balance: { total: "19331533399", liquid: "19331533399" },
            inferredNonce: "918",
            delegateAccount: {
              publicKey:
                "B62qq3TQ8AP7MFYPVtMx5tZGF3kWLJukfwG1A1RGvaBW1jfTPTkDBW6",
            },
            tokenId: "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
            publicKey:
              "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
            zkappUri: null,
            tokenNetInfo: null,
            localConfig: { hideToken: false },
            tokenBaseInfo: {
              isScam: false,
              iconUrl: "img/mina_color.svg",
              decimals: 9,
              isMainToken: true,
              isDelegation: true,
              showBalance: "19.331533399",
              showAmount: "3.218159027998328",
              tokenShowed: true,
            },
          },
          newTokenCount: 0,
        }
      );
    });
  });

  describe("formatPendingTx", () => {
    it("should fortmat PendingTx to common struct", () => {
      assert.deepStrictEqual(
        formatPendingTx([
          {
            id: "Av0gHZoAu5Shw9EGvWzNCsa+lvVwzAQpMIEknzctxt5O/tlVdRoB/l8CAP//IgEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATT+KATVjgGPy/mE9oZtJYm2Awpm3b5qSJeXkNEe5cRoA/QDKmju7lKHD0Qa9bM0Kxr6W9XDMBCkwgSSfNy3G3k7+2VV1GgGMB116TxlB24+xnnkLhLqaabb3mWpGuNCjh9mI1uehKddGmwi54PmVYnIUmjSAFc1hrAxfOMu0+6/GXVktosoV",
            nonce: 607,
            memo: "E4YM2vTHhWEg66xpj52JErHUBU4pZ1yageL4TVDDpTTSsv8mK6YaH",
            isDelegation: false,
            kind: "PAYMENT",
            hash: "5JuRUDnBi4ak8Ga6eamWvpYNBxKWFP4No6p9ibxHrM5ovsdzXwpY",
            from: "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
            feeToken: "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
            fee: "10100000",
            amount: "1000000000",
            to: "B62qm3V7qSQ97Stgo2MXv4Apof2cVezZyP1VYJ8DfrVNy9yfqKZxLQf",
          },
        ]),
        [
          {
            id: "Av0gHZoAu5Shw9EGvWzNCsa+lvVwzAQpMIEknzctxt5O/tlVdRoB/l8CAP//IgEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATT+KATVjgGPy/mE9oZtJYm2Awpm3b5qSJeXkNEe5cRoA/QDKmju7lKHD0Qa9bM0Kxr6W9XDMBCkwgSSfNy3G3k7+2VV1GgGMB116TxlB24+xnnkLhLqaabb3mWpGuNCjh9mI1uehKddGmwi54PmVYnIUmjSAFc1hrAxfOMu0+6/GXVktosoV",
            hash: "5JuRUDnBi4ak8Ga6eamWvpYNBxKWFP4No6p9ibxHrM5ovsdzXwpY",
            kind: "PAYMENT",
            from: "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
            to: "B62qm3V7qSQ97Stgo2MXv4Apof2cVezZyP1VYJ8DfrVNy9yfqKZxLQf",
            amount: "1000000000",
            fee: "10100000",
            nonce: 607,
            memo: "E4YM2vTHhWEg66xpj52JErHUBU4pZ1yageL4TVDDpTTSsv8mK6YaH",
            status: "PENDING",
          },
        ]
      );
    });
  });

  describe("setScamAndTxList", () => {
    it("should tip scam tx list", () => {
      assert.deepStrictEqual(
        setScamAndTxList(
          [
            {
              address:
                "b62qr4azfgphk3g246q3lhekngmwxggsu3hcujgkkuj9ssy2p1uf6ly",
              info: "Clorio Phishing campaign on 10/12/2021",
            },
            {
              address:
                "b62qq7ecvbqzqk68dwstl27888nekzjwnxnfjtyu3xpqcfx5ubivcu6",
              info: "MinaScamWatcher auto-report 2024-07-08T09:28:14.389Z - Memo \u0012minanft.io airdrop",
            },
          ],
          [
            {
              fee: 10100000,
              from: "b62qr4azfgphk3g246q3lhekngmwxggsu3hcujgkkuj9ssy2p1uf6ly",
              to: "B62qm3V7qSQ97Stgo2MXv4Apof2cVezZyP1VYJ8DfrVNy9yfqKZxLQf",
              nonce: 607,
              amount: 1000000000,
              memo: "E4YM2vTHhWEg66xpj52JErHUBU4pZ1yageL4TVDDpTTSsv8mK6YaH",
              hash: "5JuRUDnBi4ak8Ga6eamWvpYNBxKWFP4No6p9ibxHrM5ovsdzXwpY",
              kind: "payment",
              dateTime: "2025-07-05T13:06:00.000Z",
              failureReason: null,
              isFromAddressScam: false,
            },
            {
              fee: 10100000,
              from: "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              to: "B62qm3V7qSQ97Stgo2MXv4Apof2cVezZyP1VYJ8DfrVNy9yfqKZxLQf",
              nonce: 606,
              amount: 1000000000,
              memo: "E4YM2vTHhWEg66xpj52JErHUBU4pZ1yageL4TVDDpTTSsv8mK6YaH",
              hash: "5JtmnPPmAieocoZVuRypLMArNoQUVVfxjjPDUM4hUgLGYJWc1qV7",
              kind: "payment",
              dateTime: "2025-07-05T13:00:00.000Z",
              failureReason: null,
              isFromAddressScam: false,
            },
            {
              id: "",
              hash: "5JupjwHEyhjavCtfZh5szMHpwn7S2xGtfJQHSSPvesi5Pq8NfZxK",
              kind: "zkApp",
              dateTime: "2025-07-02T16:48:00.000Z",
              from: "b62qr4azfgphk3g246q3lhekngmwxggsu3hcujgkkuj9ssy2p1uf6ly",
              to: "B62qqFbciM2QqnwWeXQ8xFLZUYvhhdko1aBWhrneoEzgaVD9xFwNPpJ",
              amount: "0",
              fee: 10000000,
              nonce: 605,
              memo: "E4YhMdQTXtPEumBuZroDzbWUVwQNHTeNeaxjRJ6KmoyTNE9A7UPe9",
              status: "applied",
              type: "zkApp",
              body: {
                hash: "5JupjwHEyhjavCtfZh5szMHpwn7S2xGtfJQHSSPvesi5Pq8NfZxK",
                dateTime: "2025-07-02T16:48:00.000Z",
                failureReasons: [],
                zkappCommand: {
                  feePayer: {
                    body: {
                      nonce: 605,
                      publicKey:
                        "b62qr4azfgphk3g246q3lhekngmwxggsu3hcujgkkuj9ssy2p1uf6ly",
                      fee: 10000000,
                    },
                  },
                  memo: "E4YhMdQTXtPEumBuZroDzbWUVwQNHTeNeaxjRJ6KmoyTNE9A7UPe9",
                  accountUpdates: [
                    {
                      body: {
                        publicKey:
                          "B62qqFbciM2QqnwWeXQ8xFLZUYvhhdko1aBWhrneoEzgaVD9xFwNPpJ",
                        tokenId:
                          "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
                        balanceChange: { magnitude: "0", sgn: "Positive" },
                        update: {
                          appState: [
                            "13",
                            "NULL",
                            "NULL",
                            "NULL",
                            "NULL",
                            "NULL",
                            "NULL",
                            "NULL",
                          ],
                          tokenSymbol: "NULL",
                          zkappUri: null,
                        },
                      },
                    },
                  ],
                },
              },
              timestamp: 1751474880000,
              failureReason: "",
              isFromAddressScam: false,
            },
            {
              id: "",
              hash: "5JtWu8dhyH6RuALpYAG3NLNWa8gAL5B2FhWTh9PL7T2QoY1Hen8t",
              kind: "zkApp",
              dateTime: "2025-07-02T16:03:00.000Z",
              from: "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              to: "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              amount: "0",
              fee: 14100000,
              nonce: 604,
              memo: "E4YM2vTHhWEg66xpj52JErHUBU4pZ1yageL4TVDDpTTSsv8mK6YaH",
              status: "applied",
              type: "zkApp",
              body: {
                hash: "5JtWu8dhyH6RuALpYAG3NLNWa8gAL5B2FhWTh9PL7T2QoY1Hen8t",
                dateTime: "2025-07-02T16:03:00.000Z",
                failureReasons: [],
                zkappCommand: {
                  feePayer: {
                    body: {
                      nonce: 604,
                      publicKey:
                        "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
                      fee: 14100000,
                    },
                  },
                  memo: "E4YM2vTHhWEg66xpj52JErHUBU4pZ1yageL4TVDDpTTSsv8mK6YaH",
                  accountUpdates: [
                    {
                      body: {
                        publicKey:
                          "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
                        tokenId:
                          "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
                        balanceChange: {
                          magnitude: "-1000000000",
                          sgn: "Negative",
                        },
                        update: {
                          appState: [
                            "NULL",
                            "NULL",
                            "NULL",
                            "NULL",
                            "NULL",
                            "NULL",
                            "NULL",
                            "NULL",
                          ],
                          tokenSymbol: "NULL",
                          zkappUri: null,
                        },
                      },
                    },
                    {
                      body: {
                        publicKey:
                          "B62qiTTrUPRuG25WtXZHVNvmHcBx9tEVruBY4A4i2NkB9v5ZvfpjY5r",
                        tokenId:
                          "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
                        balanceChange: { magnitude: "0", sgn: "Positive" },
                        update: {
                          appState: ["1", "0", "0", "0", "0", "0", "0", "0"],
                          tokenSymbol: "NULL",
                          zkappUri: null,
                        },
                      },
                    },
                  ],
                },
              },
              timestamp: 1751472180000,
              failureReason: "",
              isFromAddressScam: false,
            },
            { showExplorer: true },
          ]
        ),
        [
          {
            fee: 10100000,
            from: "b62qr4azfgphk3g246q3lhekngmwxggsu3hcujgkkuj9ssy2p1uf6ly",
            to: "B62qm3V7qSQ97Stgo2MXv4Apof2cVezZyP1VYJ8DfrVNy9yfqKZxLQf",
            nonce: 607,
            amount: 1000000000,
            memo: "E4YM2vTHhWEg66xpj52JErHUBU4pZ1yageL4TVDDpTTSsv8mK6YaH",
            hash: "5JuRUDnBi4ak8Ga6eamWvpYNBxKWFP4No6p9ibxHrM5ovsdzXwpY",
            kind: "payment",
            dateTime: "2025-07-05T13:06:00.000Z",
            failureReason: null,
            isFromAddressScam: true,
          },
          {
            fee: 10100000,
            from: "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
            to: "B62qm3V7qSQ97Stgo2MXv4Apof2cVezZyP1VYJ8DfrVNy9yfqKZxLQf",
            nonce: 606,
            amount: 1000000000,
            memo: "E4YM2vTHhWEg66xpj52JErHUBU4pZ1yageL4TVDDpTTSsv8mK6YaH",
            hash: "5JtmnPPmAieocoZVuRypLMArNoQUVVfxjjPDUM4hUgLGYJWc1qV7",
            kind: "payment",
            dateTime: "2025-07-05T13:00:00.000Z",
            failureReason: null,
            isFromAddressScam: false,
          },
          {
            id: "",
            hash: "5JupjwHEyhjavCtfZh5szMHpwn7S2xGtfJQHSSPvesi5Pq8NfZxK",
            kind: "zkApp",
            dateTime: "2025-07-02T16:48:00.000Z",
            from: "b62qr4azfgphk3g246q3lhekngmwxggsu3hcujgkkuj9ssy2p1uf6ly",
            to: "B62qqFbciM2QqnwWeXQ8xFLZUYvhhdko1aBWhrneoEzgaVD9xFwNPpJ",
            amount: "0",
            fee: 10000000,
            nonce: 605,
            memo: "E4YhMdQTXtPEumBuZroDzbWUVwQNHTeNeaxjRJ6KmoyTNE9A7UPe9",
            status: "applied",
            type: "zkApp",
            body: {
              hash: "5JupjwHEyhjavCtfZh5szMHpwn7S2xGtfJQHSSPvesi5Pq8NfZxK",
              dateTime: "2025-07-02T16:48:00.000Z",
              failureReasons: [],
              zkappCommand: {
                feePayer: {
                  body: {
                    nonce: 605,
                    publicKey:
                      "b62qr4azfgphk3g246q3lhekngmwxggsu3hcujgkkuj9ssy2p1uf6ly",
                    fee: 10000000,
                  },
                },
                memo: "E4YhMdQTXtPEumBuZroDzbWUVwQNHTeNeaxjRJ6KmoyTNE9A7UPe9",
                accountUpdates: [
                  {
                    body: {
                      publicKey:
                        "B62qqFbciM2QqnwWeXQ8xFLZUYvhhdko1aBWhrneoEzgaVD9xFwNPpJ",
                      tokenId:
                        "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
                      balanceChange: { magnitude: "0", sgn: "Positive" },
                      update: {
                        appState: [
                          "13",
                          "NULL",
                          "NULL",
                          "NULL",
                          "NULL",
                          "NULL",
                          "NULL",
                          "NULL",
                        ],
                        tokenSymbol: "NULL",
                        zkappUri: null,
                      },
                    },
                  },
                ],
              },
            },
            timestamp: 1751474880000,
            failureReason: "",
            isFromAddressScam: true,
          },
          {
            id: "",
            hash: "5JtWu8dhyH6RuALpYAG3NLNWa8gAL5B2FhWTh9PL7T2QoY1Hen8t",
            kind: "zkApp",
            dateTime: "2025-07-02T16:03:00.000Z",
            from: "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
            to: "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
            amount: "0",
            fee: 14100000,
            nonce: 604,
            memo: "E4YM2vTHhWEg66xpj52JErHUBU4pZ1yageL4TVDDpTTSsv8mK6YaH",
            status: "applied",
            type: "zkApp",
            body: {
              hash: "5JtWu8dhyH6RuALpYAG3NLNWa8gAL5B2FhWTh9PL7T2QoY1Hen8t",
              dateTime: "2025-07-02T16:03:00.000Z",
              failureReasons: [],
              zkappCommand: {
                feePayer: {
                  body: {
                    nonce: 604,
                    publicKey:
                      "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
                    fee: 14100000,
                  },
                },
                memo: "E4YM2vTHhWEg66xpj52JErHUBU4pZ1yageL4TVDDpTTSsv8mK6YaH",
                accountUpdates: [
                  {
                    body: {
                      publicKey:
                        "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
                      tokenId:
                        "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
                      balanceChange: {
                        magnitude: "-1000000000",
                        sgn: "Negative",
                      },
                      update: {
                        appState: [
                          "NULL",
                          "NULL",
                          "NULL",
                          "NULL",
                          "NULL",
                          "NULL",
                          "NULL",
                          "NULL",
                        ],
                        tokenSymbol: "NULL",
                        zkappUri: null,
                      },
                    },
                  },
                  {
                    body: {
                      publicKey:
                        "B62qiTTrUPRuG25WtXZHVNvmHcBx9tEVruBY4A4i2NkB9v5ZvfpjY5r",
                      tokenId:
                        "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
                      balanceChange: { magnitude: "0", sgn: "Positive" },
                      update: {
                        appState: ["1", "0", "0", "0", "0", "0", "0", "0"],
                        tokenSymbol: "NULL",
                        zkappUri: null,
                      },
                    },
                  },
                ],
              },
            },
            timestamp: 1751472180000,
            failureReason: "",
            isFromAddressScam: false,
          },
          { showExplorer: true },
        ]
      );
    });
  });

  describe("formatAllTxHistory", () => {
    it("should format all tx history", () => {
      assert.deepStrictEqual(
        formatAllTxHistory({
          type: "CHANGE_ACCOUNT_TX_HISTORY_V2",
          txPendingList: [
            {
              id: "Av0gHZoAu5Shw9EGvWzNCsa+lvVwzAQpMIEknzctxt5O/tlVdRoB/mACAP//IgEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATT+KATVjgGPy/mE9oZtJYm2Awpm3b5qSJeXkNEe5cRoA/QDKmju7lKHD0Qa9bM0Kxr6W9XDMBCkwgSSfNy3G3k7+2VV1GgHRV3u8BScHWFI2oWvDBwsc+ZIWd4sj7zDFr03RNLcvJrL/ibDWxNy2N91tNyc4sgGtsR4kQf85CtyFG1t0I+kF",
              nonce: 608,
              memo: "E4YM2vTHhWEg66xpj52JErHUBU4pZ1yageL4TVDDpTTSsv8mK6YaH",
              isDelegation: false,
              kind: "PAYMENT",
              hash: "5JvJ4B5tVtUoZVdh4H7w2jMKPb4fGB4NY7wwxUGkkDFCVbWZciNF",
              from: "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
              feeToken: "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
              fee: "10100000",
              amount: "1000000000",
              to: "B62qm3V7qSQ97Stgo2MXv4Apof2cVezZyP1VYJ8DfrVNy9yfqKZxLQf",
            },
          ],
          zkPendingList: [],
          fullTxList: [
            {
              nonce: 607,
              timestamp: "1751720760000",
              kind: "payment",
              body: {
                fee: 10100000,
                from: "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
                to: "B62qm3V7qSQ97Stgo2MXv4Apof2cVezZyP1VYJ8DfrVNy9yfqKZxLQf",
                nonce: 607,
                amount: 1000000000,
                memo: "E4YM2vTHhWEg66xpj52JErHUBU4pZ1yageL4TVDDpTTSsv8mK6YaH",
                hash: "5JuRUDnBi4ak8Ga6eamWvpYNBxKWFP4No6p9ibxHrM5ovsdzXwpY",
                kind: "payment",
                dateTime: "2025-07-05T13:06:00.000Z",
                failureReason: null,
              },
              zkAppBody: null,
            },
            {
              nonce: 606,
              timestamp: "1751720400000",
              kind: "payment",
              body: {
                fee: 10100000,
                from: "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
                to: "B62qm3V7qSQ97Stgo2MXv4Apof2cVezZyP1VYJ8DfrVNy9yfqKZxLQf",
                nonce: 606,
                amount: 1000000000,
                memo: "E4YM2vTHhWEg66xpj52JErHUBU4pZ1yageL4TVDDpTTSsv8mK6YaH",
                hash: "5JtmnPPmAieocoZVuRypLMArNoQUVVfxjjPDUM4hUgLGYJWc1qV7",
                kind: "payment",
                dateTime: "2025-07-05T13:00:00.000Z",
                failureReason: null,
              },
              zkAppBody: null,
            },
            {
              nonce: 605,
              timestamp: "1751474880000",
              kind: "zkApp",
              body: null,
              zkAppBody: {
                hash: "5JupjwHEyhjavCtfZh5szMHpwn7S2xGtfJQHSSPvesi5Pq8NfZxK",
                dateTime: "2025-07-02T16:48:00.000Z",
                failureReasons: [],
                zkappCommand: {
                  feePayer: {
                    body: {
                      nonce: 605,
                      publicKey:
                        "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
                      fee: 10000000,
                    },
                  },
                  memo: "E4YhMdQTXtPEumBuZroDzbWUVwQNHTeNeaxjRJ6KmoyTNE9A7UPe9",
                  accountUpdates: [
                    {
                      body: {
                        publicKey:
                          "B62qqFbciM2QqnwWeXQ8xFLZUYvhhdko1aBWhrneoEzgaVD9xFwNPpJ",
                        tokenId:
                          "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
                        balanceChange: { magnitude: "0", sgn: "Positive" },
                        update: {
                          appState: [
                            "13",
                            "NULL",
                            "NULL",
                            "NULL",
                            "NULL",
                            "NULL",
                            "NULL",
                            "NULL",
                          ],
                          tokenSymbol: "NULL",
                          zkappUri: null,
                        },
                      },
                    },
                  ],
                },
              },
            },
            {
              nonce: 604,
              timestamp: "1751472180000",
              kind: "zkApp",
              body: null,
              zkAppBody: {
                hash: "5JtWu8dhyH6RuALpYAG3NLNWa8gAL5B2FhWTh9PL7T2QoY1Hen8t",
                dateTime: "2025-07-02T16:03:00.000Z",
                failureReasons: [],
                zkappCommand: {
                  feePayer: {
                    body: {
                      nonce: 604,
                      publicKey:
                        "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
                      fee: 14100000,
                    },
                  },
                  memo: "E4YM2vTHhWEg66xpj52JErHUBU4pZ1yageL4TVDDpTTSsv8mK6YaH",
                  accountUpdates: [
                    {
                      body: {
                        publicKey:
                          "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
                        tokenId:
                          "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
                        balanceChange: {
                          magnitude: "-1000000000",
                          sgn: "Negative",
                        },
                        update: {
                          appState: [
                            "NULL",
                            "NULL",
                            "NULL",
                            "NULL",
                            "NULL",
                            "NULL",
                            "NULL",
                            "NULL",
                          ],
                          tokenSymbol: "NULL",
                          zkappUri: null,
                        },
                      },
                    },
                    {
                      body: {
                        publicKey:
                          "B62qiTTrUPRuG25WtXZHVNvmHcBx9tEVruBY4A4i2NkB9v5ZvfpjY5r",
                        tokenId:
                          "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
                        balanceChange: { magnitude: "0", sgn: "Positive" },
                        update: {
                          appState: ["1", "0", "0", "0", "0", "0", "0", "0"],
                          tokenSymbol: "NULL",
                          zkappUri: null,
                        },
                      },
                    },
                  ],
                },
              },
            },
          ],
          tokenId: "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
        }),
        [
          {
            id: "Av0gHZoAu5Shw9EGvWzNCsa+lvVwzAQpMIEknzctxt5O/tlVdRoB/mACAP//IgEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATT+KATVjgGPy/mE9oZtJYm2Awpm3b5qSJeXkNEe5cRoA/QDKmju7lKHD0Qa9bM0Kxr6W9XDMBCkwgSSfNy3G3k7+2VV1GgHRV3u8BScHWFI2oWvDBwsc+ZIWd4sj7zDFr03RNLcvJrL/ibDWxNy2N91tNyc4sgGtsR4kQf85CtyFG1t0I+kF",
            hash: "5JvJ4B5tVtUoZVdh4H7w2jMKPb4fGB4NY7wwxUGkkDFCVbWZciNF",
            kind: "PAYMENT",
            from: "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
            to: "B62qm3V7qSQ97Stgo2MXv4Apof2cVezZyP1VYJ8DfrVNy9yfqKZxLQf",
            amount: "1000000000",
            fee: "10100000",
            nonce: 608,
            memo: "E4YM2vTHhWEg66xpj52JErHUBU4pZ1yageL4TVDDpTTSsv8mK6YaH",
            status: "PENDING",
            showSpeedUp: true,
          },
          {
            fee: 10100000,
            from: "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
            to: "B62qm3V7qSQ97Stgo2MXv4Apof2cVezZyP1VYJ8DfrVNy9yfqKZxLQf",
            nonce: 607,
            amount: 1000000000,
            memo: "E4YM2vTHhWEg66xpj52JErHUBU4pZ1yageL4TVDDpTTSsv8mK6YaH",
            hash: "5JuRUDnBi4ak8Ga6eamWvpYNBxKWFP4No6p9ibxHrM5ovsdzXwpY",
            kind: "payment",
            dateTime: "2025-07-05T13:06:00.000Z",
            failureReason: null,
          },
          {
            fee: 10100000,
            from: "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
            to: "B62qm3V7qSQ97Stgo2MXv4Apof2cVezZyP1VYJ8DfrVNy9yfqKZxLQf",
            nonce: 606,
            amount: 1000000000,
            memo: "E4YM2vTHhWEg66xpj52JErHUBU4pZ1yageL4TVDDpTTSsv8mK6YaH",
            hash: "5JtmnPPmAieocoZVuRypLMArNoQUVVfxjjPDUM4hUgLGYJWc1qV7",
            kind: "payment",
            dateTime: "2025-07-05T13:00:00.000Z",
            failureReason: null,
          },
          {
            id: "",
            hash: "5JupjwHEyhjavCtfZh5szMHpwn7S2xGtfJQHSSPvesi5Pq8NfZxK",
            kind: "zkApp",
            dateTime: "2025-07-02T16:48:00.000Z",
            from: "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
            to: "B62qqFbciM2QqnwWeXQ8xFLZUYvhhdko1aBWhrneoEzgaVD9xFwNPpJ",
            amount: "0",
            fee: 10000000,
            nonce: 605,
            memo: "E4YhMdQTXtPEumBuZroDzbWUVwQNHTeNeaxjRJ6KmoyTNE9A7UPe9",
            status: "applied",
            type: "zkApp",
            body: {
              hash: "5JupjwHEyhjavCtfZh5szMHpwn7S2xGtfJQHSSPvesi5Pq8NfZxK",
              dateTime: "2025-07-02T16:48:00.000Z",
              failureReasons: [],
              zkappCommand: {
                feePayer: {
                  body: {
                    nonce: 605,
                    publicKey:
                      "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
                    fee: 10000000,
                  },
                },
                memo: "E4YhMdQTXtPEumBuZroDzbWUVwQNHTeNeaxjRJ6KmoyTNE9A7UPe9",
                accountUpdates: [
                  {
                    body: {
                      publicKey:
                        "B62qqFbciM2QqnwWeXQ8xFLZUYvhhdko1aBWhrneoEzgaVD9xFwNPpJ",
                      tokenId:
                        "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
                      balanceChange: { magnitude: "0", sgn: "Positive" },
                      update: {
                        appState: [
                          "13",
                          "NULL",
                          "NULL",
                          "NULL",
                          "NULL",
                          "NULL",
                          "NULL",
                          "NULL",
                        ],
                        tokenSymbol: "NULL",
                        zkappUri: null,
                      },
                    },
                  },
                ],
              },
            },
            timestamp: 1751474880000,
            failureReason: "",
          },
          {
            id: "",
            hash: "5JtWu8dhyH6RuALpYAG3NLNWa8gAL5B2FhWTh9PL7T2QoY1Hen8t",
            kind: "zkApp",
            dateTime: "2025-07-02T16:03:00.000Z",
            from: "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
            to: "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
            amount: "0",
            fee: 14100000,
            nonce: 604,
            memo: "E4YM2vTHhWEg66xpj52JErHUBU4pZ1yageL4TVDDpTTSsv8mK6YaH",
            status: "applied",
            type: "zkApp",
            body: {
              hash: "5JtWu8dhyH6RuALpYAG3NLNWa8gAL5B2FhWTh9PL7T2QoY1Hen8t",
              dateTime: "2025-07-02T16:03:00.000Z",
              failureReasons: [],
              zkappCommand: {
                feePayer: {
                  body: {
                    nonce: 604,
                    publicKey:
                      "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
                    fee: 14100000,
                  },
                },
                memo: "E4YM2vTHhWEg66xpj52JErHUBU4pZ1yageL4TVDDpTTSsv8mK6YaH",
                accountUpdates: [
                  {
                    body: {
                      publicKey:
                        "B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32",
                      tokenId:
                        "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
                      balanceChange: {
                        magnitude: "-1000000000",
                        sgn: "Negative",
                      },
                      update: {
                        appState: [
                          "NULL",
                          "NULL",
                          "NULL",
                          "NULL",
                          "NULL",
                          "NULL",
                          "NULL",
                          "NULL",
                        ],
                        tokenSymbol: "NULL",
                        zkappUri: null,
                      },
                    },
                  },
                  {
                    body: {
                      publicKey:
                        "B62qiTTrUPRuG25WtXZHVNvmHcBx9tEVruBY4A4i2NkB9v5ZvfpjY5r",
                      tokenId:
                        "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
                      balanceChange: { magnitude: "0", sgn: "Positive" },
                      update: {
                        appState: ["1", "0", "0", "0", "0", "0", "0", "0"],
                        tokenSymbol: "NULL",
                        zkappUri: null,
                      },
                    },
                  },
                ],
              },
            },
            timestamp: 1751472180000,
            failureReason: "",
          },
          { showExplorer: true },
        ]
      );
    });
  });
});
