/**
 * Utils Test Suite - Migrated from Mocha to Jest
 */
import {
  addressSlice,
  addressValid,
  amountDecimals,
  checkNodeExist,
  checkValidStrInList,
  createCredentialHash,
  decodeMemo,
  getAmountForUI,
  getBalanceForUI,
  getCredentialDisplayData,
  getMessageFromCode,
  getOriginFromUrl,
  getQueryStringArgs,
  getReadableNetworkId,
  getRealErrorMsg,
  getShowTime,
  getTimeGMT,
  isNaturalNumber,
  isNumber,
  isTrueNumber,
  isZekoNet,
  mergeLocalConfigToNetToken,
  nameLengthCheck,
  numberFormat,
  parsedZekoFee,
  parseStakingList,
  removeUrlFromArrays,
  showNameSlice,
  toNonExponential,
  trimSpace,
  urlValid,
  validatePassword,
} from '@/utils/utils';

const TRANSACTION_FEE = 0.1001;

describe('Utils Test', () => {
  describe('addressSlice', () => {
    it('should return slice address', () => {
      const validAddress = 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32';
      expect(addressSlice(validAddress)).toBe('B62qpjxUpg...HfHoY2VH32');
    });
  });

  describe('showNameSlice', () => {
    it('should return slice name with default length', () => {
      const testName = 'CustomNameForTesting';
      expect(showNameSlice(testName)).toBe('CustomNa...');
    });
    it('should return slice name with length 12', () => {
      const testName = 'CustomNameForTesting';
      expect(showNameSlice(testName, 12)).toBe('CustomNameFo...');
    });
  });

  describe('toNonExponential', () => {
    it('should return without Exponential(v1)', () => {
      const validNumber = '1e-2';
      expect(toNonExponential(validNumber)).toBe('0.01');
    });
    it('should return without Exponential(v2)', () => {
      const validNumber = '0.01';
      expect(toNonExponential(validNumber)).toBe('0.01');
    });
  });

  describe('amountDecimals', () => {
    it('should return without amountDecimals string number', () => {
      expect(amountDecimals('19331533399', 9)).toBe('19.331533399');
    });
    it('should return without amountDecimals number', () => {
      expect(amountDecimals('19331533399', 9)).toBe('19.331533399');
    });
  });

  describe('getBalanceForUI', () => {
    it('should return without getBalanceForUI', () => {
      expect(getBalanceForUI('19.331533399', 0, 4)).toBe('19.3315');
    });
    it('should return without amountDecimals number', () => {
      expect(getBalanceForUI(19.331533399, 0, 4)).toBe('19.3315');
    });
  });

  describe('getAmountForUI', () => {
    it('should return without getAmountForUI', () => {
      expect(getAmountForUI(3.464694073435775, 0, 2)).toBe('3.46');
    });
  });

  describe('trimSpace', () => {
    it('should return without trimSpace', () => {
      expect(trimSpace(' 123 ')).toBe('123');
    });
  });

  describe('urlValid', () => {
    it('should return without urlValid true', () => {
      expect(urlValid('https://test-zkapp.aurowallet.com/')).toBe(true);
    });
    it('should return without urlValid false', () => {
      expect(urlValid('ftp://test-zkapp.aurowallet.com/')).toBe(false);
    });
  });

  describe('isNumber', () => {
    it('should return without isNumber true', () => {
      expect(isNumber('1938.204987')).toBe(true);
    });
    it('should return without isNumberscientific', () => {
      expect(isNumber('1e18', true)).toBe(true);
    });
    it('should return without isNumber scientific v1', () => {
      expect(isNumber('1e18')).toBe(false);
    });
    it('should return without isNumber false', () => {
      expect(isNumber('1938.2.04987')).toBe(false);
    });
  });

  describe('isTrueNumber', () => {
    it('should return without isTrueNumber true', () => {
      expect(isTrueNumber(15)).toBe(true);
    });
    it('should return without isTrueNumber false', () => {
      expect(isTrueNumber(-1)).toBe(false);
    });
  });

  describe('isNaturalNumber', () => {
    it('should return without isNaturalNumber true', () => {
      expect(isNaturalNumber(10)).toBe(true);
    });
    it('should return without isNaturalNumber 0', () => {
      expect(isNaturalNumber(0)).toBe(true);
    });
    it('should return without isNaturalNumber false', () => {
      expect(isNaturalNumber(-1)).toBe(false);
    });
  });

  describe('nameLengthCheck', () => {
    it('should return without nameLengthCheck true', () => {
      expect(nameLengthCheck('Import Account 1')).toBe(true);
    });
    it('should return without nameLengthCheck false', () => {
      expect(nameLengthCheck('Import Account 12')).toBe(false);
    });
  });

  describe('getOriginFromUrl', () => {
    it('should return without getOriginFromUrl true', () => {
      expect(getOriginFromUrl('https://test-zkapp.aurowallet.com/')).toBe(
        'https://test-zkapp.aurowallet.com'
      );
    });
    it('should return without getOriginFromUrl empty', () => {
      expect(getOriginFromUrl('xxx')).toBe('');
    });
  });

  describe('getQueryStringArgs', () => {
    it('should return without getQueryStringArgs true', () => {
      expect(
        getQueryStringArgs(
          'chrome-extension://extension-id/popup.html#/ledger_page?ledgerPageType=permissionGrant'
        )
      ).toEqual({ ledgerPageType: 'permissionGrant' });
    });
  });

  describe('getRealErrorMsg', () => {
    it('should return without getRealErrorMsg true', () => {
      expect(
        getRealErrorMsg(
          `Couldn't send user command: Error creating user command: {"payload":{"common":{"fee":"0.0101","fee_payer_pk":"B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32","nonce":"9","valid_until":"4294967295","memo":"E4YM2vTHhWEg66xpj52JErHUBU4pZ1yageL4TVDDpTTSsv8mK6YaH"},"body":["Payment",{"receiver_pk":"B62qm3V7qSQ97Stgo2MXv4Apof2cVezZyP1VYJ8DfrVNy9yfqKZxLQf","amount":"1000000000"}]},"signer":"B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32","signature":["Signature","7mWzJmg8GpnzjxxRTQmCN8Ra6rKFn4H5oPUPqzbAxDk6zR2kV7iWox2Lv22skL7Rjuc7nZWRdLPub8ZK4qUwPYqCahUmw7MH"]} Error: Input nonce 9 either different from inferred nonce 918 or below minimum_nonce 918`
        )
      ).toBe(
        'Error: Input nonce 9 either different from inferred nonce 918 or below minimum_nonce 918'
      );
    });
  });

  describe('parseStakingList', () => {
    it('should return without parseStakingList true', () => {
      expect(
        parseStakingList([
          {
            public_key: 'B62qq3TQ8AP7MFYPVtMx5tZGF3kWLJukfwG1A1RGvaBW1jfTPTkDBW6',
            validator_logo:
              'https://raw.githubusercontent.com/aurowallet/launch/master/validators/assets/B62qq3TQ8AP7MFYPVtMx5tZGF3kWLJukfwG1A1RGvaBW1jfTPTkDBW6/logo.png',
            identity_name: 'Auro Wallet',
            description: 'A simple yet powerful Mina Protocol Wallet',
            website: 'https://www.aurowallet.com',
            stake: '0',
            delegations: 0,
            blocks_created: 0,
          } as { public_key: string; identity_name: string; stake: string; delegations: number; validator_logo: string; blocks_created: number },
        ])
      ).toEqual({
        active: [],
        inactive: [{
          nodeAddress: 'B62qq3TQ8AP7MFYPVtMx5tZGF3kWLJukfwG1A1RGvaBW1jfTPTkDBW6',
          nodeName: 'Auro Wallet',
          totalStake: '0',
          delegations: 0,
          icon: 'https://raw.githubusercontent.com/aurowallet/launch/master/validators/assets/B62qq3TQ8AP7MFYPVtMx5tZGF3kWLJukfwG1A1RGvaBW1jfTPTkDBW6/logo.png',
          fee: undefined,
          blocksCreated: 0,
          isActive: false,
        }],
      });
    });
  });

  describe('getShowTime', () => {
    it('should return without getShowTime true', () => {
      expect(getShowTime('2025-07-03T13:51:00.000Z', false)).toBe('2025-07-03 21:51');
    });
    it('should return without getShowTime default', () => {
      expect(getShowTime('')).toBe('date-time');
    });
  });

  describe('decodeMemo', () => {
    it('should return without decodeMemo true', () => {
      expect(decodeMemo('E4YPuPxSgXAApcnAgjDn8eSCbdHzmt9VHf1MauqXBJb6RJUNdVkY7')).toBe('z');
    });
  });

  describe('getTimeGMT', () => {
    it('should return without getTimeGMT true', () => {
      expect(getTimeGMT('2025-07-03T13:51:00.000Z')).toBe('GMT+0800');
    });
  });

  describe('numberFormat', () => {
    it('should return without numberFormat true', () => {
      expect(numberFormat('12.1233a')).toBe('12.1233');
    });
  });

  describe('checkNodeExist', () => {
    it('should return without checkNodeExist exist', () => {
      expect(
        checkNodeExist(
          [{ url: 'https://test-url.io/graphql', name: 'Testnet' }] as Parameters<typeof checkNodeExist>[0],
          'https://test-url.io/graphql'
        )
      ).toEqual({
        index: 0,
        config: { url: 'https://test-url.io/graphql', name: 'Testnet' },
      });
    });
    it('should return without checkNodeExist new', () => {
      expect(
        checkNodeExist(
          [{ url: 'https://test-url.io/graphql', name: 'Testnet' }] as Parameters<typeof checkNodeExist>[0],
          'https://test-url.io/'
        )
      ).toEqual({
        index: -1,
        config: undefined,
      });
    });
  });

  describe('getMessageFromCode', () => {
    const errorCodes = {
      userRejectedRequest: 1002,
      userDisconnect: 1001,
      noWallet: 20001,
      verifyFailed: 20002,
      invalidParams: 20003,
      notSupportChain: 20004,
      zkChainPending: 20005,
      unsupportedMethod: 20006,
      internal: 21001,
      throwError: 22001,
      originDismatch: 23001,
      notFound: 404,
    };
    it('should return without getMessageFromCode true', () => {
      expect(getMessageFromCode(errorCodes.invalidParams)).toBe(
        'Invalid method parameter(s).'
      );
    });
  });

  describe('checkValidStrInList', () => {
    it('should return without checkValidStrInList true', () => {
      expect(
        checkValidStrInList(['mina:mainnet', '', '  ', 123, null, 'test'] as any)
      ).toEqual(['mina:mainnet', 'test']);
    });
  });

  describe('getReadableNetworkId', () => {
    it('should return without getReadableNetworkId true', () => {
      expect(getReadableNetworkId('mina:mainnet')).toBe('mina_mainnet');
    });
  });

  describe('createCredentialHash', () => {
    it('should return without createCredentialHash true', () => {
      expect(
        createCredentialHash({
          version: 'v0',
          witness: {
            type: 'native',
            issuer: {
              _type: 'PublicKey',
              value: 'B62qp6y93m7HztH5jvn12gHJphzAZrZq3daD792hi8a6WSivDS62M6y',
            },
            issuerSignature: {
              _type: 'Signature',
              value: {
                r: '24764829275973110534791589238836422406155308756366194858902346711165768986647',
                s: '22841785286224613031590225596530372228046391476317406103757933601764989729704',
              },
            },
          },
          credential: {
            owner: {
              _type: 'PublicKey',
              value: 'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32',
            },
            data: {
              nationality: 'CN',
              name: 'gsOsBr',
              birthDate: {
                _type: 'Int64',
                value: { magnitude: '623300600191', sgn: 'Positive' },
              },
              id: {
                _type: 'Bytes',
                size: 16,
                value: 'debb279830131111932914974c225da2',
              },
              expiresAt: { _type: 'UInt64', value: '1783178154614' },
            },
          },
        })
      ).toBe('1dbe30f2df639b4a1e923cb99c3103945fdd2a80fc9ba666a9285bc0f7a4f39b');
    });
  });

  describe('getCredentialDisplayData', () => {
    it('should return without getCredentialDisplayData true', () => {
      expect(
        getCredentialDisplayData({
          nationality: 'US',
          name: 'zlrlXX',
          birthDate: { magnitude: '1101266856456', sgn: 'Negative' },
          id: 'a4d1d13fe4bdf7cb96ecb474220ae77d',
          expiresAt: '1780846580871',
        })
      ).toEqual({
        nationality: 'US',
        name: 'zlrlXX',
        birthDate: -1101266856456,
        id: 'a4d1d13fe4bdf7cb96ecb474220ae77d',
        expiresAt: '2026-06-07 23:36',
      });
    });
  });

  describe('removeUrlFromArrays', () => {
    it('should return without removeUrlFromArrays true', () => {
      expect(
        removeUrlFromArrays(
          {
            B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32: [
              'https://test-zkapp.aurowallet.com',
              'http://localhost:3000',
            ],
            B62qq43TNomycQX3WR2v2KRU1xV2HUx5vPQVnPXonR5M5ps9SKKXEWB: [
              'http://localhost:3000',
            ],
            B62qm3V7qSQ97Stgo2MXv4Apof2cVezZyP1VYJ8DfrVNy9yfqKZxLQf: [
              'https://test-zkapp.aurowallet.com',
            ],
          },
          'https://test-zkapp.aurowallet.com'
        )
      ).toEqual({
        B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32: [
          'http://localhost:3000',
        ],
        B62qq43TNomycQX3WR2v2KRU1xV2HUx5vPQVnPXonR5M5ps9SKKXEWB: [
          'http://localhost:3000',
        ],
        B62qm3V7qSQ97Stgo2MXv4Apof2cVezZyP1VYJ8DfrVNy9yfqKZxLQf: [],
      });
    });
  });

  describe('addressValid', () => {
    it('should return without addressValid true', () => {
      expect(
        addressValid('B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32')
      ).toBe(true);
    });
    it('should return without addressValid false', () => {
      expect(
        addressValid('B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH33')
      ).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should return correct validation for a strong password', () => {
      const password = 'Test1234';
      const result = validatePassword(password);

      expect(result).toEqual([
        { text: 'passwordRequires', expression: /^.{8,32}$/, bool: true },
        { text: 'atLeastOneUppercaseLetter', expression: /[A-Z]+/, bool: true },
        { text: 'atLeastOneLowercaseLetter', expression: /[a-z]+/, bool: true },
        { text: 'atLeastOneNumber', expression: /[0-9]+/, bool: true },
      ]);
    });

    it('should return false for password shorter than 8 characters', () => {
      const password = 'Test12';
      const result = validatePassword(password);
      expect(result[0]!.bool).toBe(false);
    });

    it('should return false for password without uppercase letters', () => {
      const password = 'test1234';
      const result = validatePassword(password);
      expect(result[1]!.bool).toBe(false);
    });

    it('should return false for password without numbers', () => {
      const password = 'Testabcd';
      const result = validatePassword(password);
      expect(result[3]!.bool).toBe(false);
    });

    it('should return false for password longer than 32 characters', () => {
      const password = 'Test1234AbcdEfghIjklMnopQrstUvwxyza';
      const result = validatePassword(password);
      expect(result[0]!.bool).toBe(false);
    });
  });

  describe('parsedZekoFee', () => {
    it('should correctly parse fee with buffer and 4 decimal places', () => {
      const fee = '11051709180756478';
      const result = parsedZekoFee(fee, 0.1);
      expect(result).toBe('12156880.0988');
    });

    it('should handle fee as number input', () => {
      const fee = 11051709180756478;
      const result = parsedZekoFee(fee, 0.1);
      expect(result).toBe('12156880.0988');
    });

    it('should return default TRANSACTION_FEE when fee is undefined', () => {
      const result = parsedZekoFee(undefined);
      expect(result).toBe(TRANSACTION_FEE);
    });

    it('should handle zero buffer correctly', () => {
      const fee = '1000000000';
      const result = parsedZekoFee(fee, 0);
      expect(result).toBe('1');
    });

    it('should handle string fee with decimals', () => {
      const fee = '123456789.123456789';
      const result = parsedZekoFee(fee, 0.1);
      expect(result).toBe('0.1358');
    });

    it('should handle small fee values', () => {
      const fee = '1000';
      const result = parsedZekoFee(fee, 0.1);
      expect(result).toBe('0');
    });
  });

  describe('isZekoNet', () => {
    it("should return true for networkID starting with 'zeko'", () => {
      expect(isZekoNet('zeko:mainnet')).toBe(true);
    });

    it("should return true for networkID starting with 'zeko' with different case", () => {
      expect(isZekoNet('Zeko:testnet')).toBe(false);
    });

    it("should return false for networkID not starting with 'zeko'", () => {
      expect(isZekoNet('mina:mainnet')).toBe(false);
    });

    it('should return false for undefined networkID', () => {
      expect(isZekoNet(undefined as any)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isZekoNet('')).toBe(false);
    });

    it('should return false for non-string input', () => {
      expect(isZekoNet(123 as any)).toBe(false);
    });
  });

  describe('mergeLocalConfigToNetToken', () => {
    it('should merge local config to net token', () => {
      const netTokenList = [
        {
          balance: { total: '1960520', liquid: '1960520' },
          inferredNonce: '2',
          delegateAccount: {
            publicKey: 'B62qkhhWkJdZx9MAZHd67VqBAX7FVbzSizqsFYqMKvQu4kPNyFxxCmB',
          },
          tokenId: 'wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf',
          publicKey: 'B62qkhhWkJdZx9MAZHd67VqBAX7FVbzSizqsFYqMKvQu4kPNyFxxCmB',
          zkappUri: null,
          tokenNetInfo: null,
        },
      ];
      const localTokenList = [
        {
          balance: { total: '1960520', liquid: '1960520' },
          inferredNonce: '2',
          delegateAccount: {
            publicKey: 'B62qkhhWkJdZx9MAZHd67VqBAX7FVbzSizqsFYqMKvQu4kPNyFxxCmB',
          },
          tokenId: 'wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf',
          publicKey: 'B62qkhhWkJdZx9MAZHd67VqBAX7FVbzSizqsFYqMKvQu4kPNyFxxCmB',
          zkappUri: null,
          tokenNetInfo: null,
          localConfig: { hideToken: false },
          tokenBaseInfo: {
            isScam: false,
            iconUrl: 'img/mina_color.svg',
            decimals: 9,
            isMainToken: true,
            isDelegation: false,
            showBalance: '0.00196052',
            showAmount: '0.00034638859464',
            tokenShowed: false,
          },
        },
      ];
      const result = mergeLocalConfigToNetToken(netTokenList as any, localTokenList as any);
      expect(result[0]!.localConfig).toEqual({ hideToken: false });
    });
  });
});
