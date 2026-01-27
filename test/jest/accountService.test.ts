/**
 * Account Service Tests - Migrated from Mocha to Jest
 */
import accountData from '../data/account_service_test.json';
import * as Account from '@/background/accountService';

describe('Account Util Test', () => {
  const mnemonic = 'strike robot soon rug census all intact oil turtle burst into habit';

  describe('generate Mnemonic', () => {
    it('generate & validate mnemonic', async () => {
      const mne = Account.generateMne();
      const result = Account.validateMnemonic(mne);
      expect(result).toBeTruthy();
    });
  });

  describe('import Wallet By Mnemonic', () => {
    it('importWalletByMnemonic', async () => {
      const account = Account.importWalletByMnemonic(mnemonic);
      expect(JSON.stringify(account)).toBe(
        JSON.stringify(accountData.importWalletByMnemonic)
      );
    });
  });

  describe('import Wallet', () => {
    it('importWalletByKeystore', async () => {
      const account = await Account.importWalletByKeystore(
        JSON.stringify(accountData.importWalletByKeystore.keystore),
        accountData.importWalletByKeystore.password
      );
      expect(JSON.stringify(account)).toBe(
        JSON.stringify(accountData.importWalletByKeystore.result)
      );
    });

    it('importWalletByPrivateKey', async () => {
      const account = await Account.importWalletByPrivateKey(
        accountData.importWalletByPrivateKey.privateKey
      );
      expect(JSON.stringify(account)).toBe(
        JSON.stringify(accountData.importWalletByPrivateKey.result)
      );
    });
  });
});
