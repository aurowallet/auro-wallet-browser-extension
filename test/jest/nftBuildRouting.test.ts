import browser from 'webextension-polyfill';
import dappService from '@/background/DappService';
import { nftWebBuild } from '@/background/nftWebBuild';
import { memStore } from '@/store';
import { TOKEN_BUILD } from '@/constant/tokenMsgTypes';
import { TOKEN_BUILD_URL } from '../../config';
import { errorCodes } from '@/constant/dappError';

jest.mock('@/utils/o1jsUtils', () => ({}));
jest.mock('@/utils/zkUtils', () => ({}));
jest.mock('@/utils/browserUtils', () => ({}));
jest.mock('@/utils/commonMsg', () => ({}));
jest.mock('@/utils/popup', () => ({}));
jest.mock('@/utils/utils', () => ({
  ...jest.requireActual('@/utils/utils'),
  getMessageFromCode: () => 'Error', getRealErrorMsg: () => '',
}));
jest.mock('@/background/apiService', () => ({}));
jest.mock('@/background/lib', () => ({}));
jest.mock('@/background/storageService', () => ({}));
jest.mock('@/store', () => ({ memStore: { getState: jest.fn() } }));
jest.mock('@/utils/fore', () => ({
  encryptData: (value: string) => ({ encrypted: value }),
}));

describe('NFT and Token build routing', () => {
  const origin = new URL(TOKEN_BUILD_URL).origin;
  const sender = { url: `${origin}/nft`, tab: { id: 7 } } as browser.Runtime.MessageSender;
  const hexId = 'a'.repeat(48);

  beforeEach(() => {
    jest.mocked(browser.storage.local.get).mockResolvedValue({});
    jest.mocked(memStore.getState).mockReturnValue({ tokenBuildList: {}, nftBuildList: {} } as any);
  });

  afterEach(() => jest.restoreAllMocks());

  it.each(['', '?view=full', '#/nft_send'])(
    'handles an internal popup request without a DApp result wrapper (%s)', async suffix => {
      const result = ['saved-job'];
      const handle = jest.spyOn(nftWebBuild, 'handle').mockResolvedValue(result);
      const response = await new Promise(resolve => {
        expect(dappService.handleNFTBuild({route: 'transaction/pending', body: {}}, {
          id: browser.runtime.id, url: browser.runtime.getURL('popup.html') + suffix,
        }, resolve)).toBe(true);
      });
      expect(response).toEqual(result);
      expect(handle).toHaveBeenCalledWith('transaction/pending', {});
    },
  );

  it.each([
    undefined, 'invalid-url', 'https://builder.example/popup.html',
    'background.html', 'popup.html.evil', 'popup.html/other',
  ])('rejects non-popup senders (%s)', url => {
    const handle = jest.spyOn(nftWebBuild, 'handle');
    const respond = jest.fn();
    const senderUrl = url === 'background.html' || url?.startsWith('popup.')
      ? browser.runtime.getURL(url) : url;
    expect(dappService.handleNFTBuild({route: 'nft/remove-build', body: {}}, {
      id: browser.runtime.id, url: senderUrl,
      tab: {id: 1, url: browser.runtime.getURL('popup.html')},
    }, respond)).toBe(false);
    expect(handle).not.toHaveBeenCalled();
    expect(respond).not.toHaveBeenCalled();
  });

  it('rejects another extension even with a popup URL', () => {
    const handle = jest.spyOn(nftWebBuild, 'handle');
    expect(dappService.handleNFTBuild({route: 'nft/remove-build', body: {}}, {
      id: 'other-extension', url: browser.runtime.getURL('popup.html'),
    }, jest.fn())).toBe(false);
    expect(handle).not.toHaveBeenCalled();
  });

  it.each([false, true])('normalizes NFT errors using the existing DApp format (sync=%s)', async sync => {
    const error = Object.assign(new Error('Task unavailable'), {code: 'JOB_NOT_FOUND', status: 404});
    const handle = jest.spyOn(nftWebBuild, 'handle');
    if (sync) handle.mockImplementation(() => {throw error;});
    else handle.mockRejectedValue(error);
    const response = await new Promise(resolve => {
      dappService.handleNFTBuild({route: 'transaction/review', body: {}}, {
        id: browser.runtime.id, url: browser.runtime.getURL('popup.html'),
      }, resolve);
    });
    expect(response).toEqual({error: {code: errorCodes.throwError, message: 'Task unavailable'}});
  });

  it('does not expose internal NFT management through the DApp handler', async () => {
    const handle = jest.spyOn(nftWebBuild, 'handle');
    const response = await new Promise(resolve => {
      void dappService.handleMessage({action: 'NFT_WEB_BUILD', payload: {
        id: 'external', params: {}, site: {origin}, route: 'nft/remove-build', body: {},
      }}, sender, resolve);
    });
    expect(response).toMatchObject({error: {code: errorCodes.unsupportedMethod}});
    expect(handle).not.toHaveBeenCalled();
  });

  it('reads an NFT task from the current build list using the sender', async () => {
    jest.mocked(memStore.getState).mockReturnValue({
      nftBuildList: { [hexId]: { jobId: hexId } }, tokenBuildList: {},
    } as any);
    const params = { kind: 'nft', buildID: hexId };
    const getParams = jest.spyOn(nftWebBuild, 'getParams').mockResolvedValue(params as any);

    await expect(dappService.getTokenParamsById({
      site: { origin }, params: hexId,
    }, sender)).resolves.toEqual({ encrypted: JSON.stringify(params) });
    expect(getParams).toHaveBeenCalledWith(hexId, origin, 7);
  });

  it('does not treat an unknown 48-character ID as an NFT task', async () => {
    const getParams = jest.spyOn(nftWebBuild, 'getParams');
    await expect(dappService.getTokenParamsById({
      site: { origin }, params: hexId,
    }, sender)).resolves.toBeUndefined();
    expect(getParams).not.toHaveBeenCalled();
  });

  it('reads an existing Token task even when its ID looks like an NFT ID', async () => {
    const params = { buildID: hexId, tokenSymbol: 'TEST' };
    jest.mocked(memStore.getState).mockReturnValue({
      tokenBuildList: { [hexId]: params }, nftBuildList: {},
    } as any);
    await expect(dappService.getTokenParamsById({
      site: { origin }, params: hexId,
    }, sender)).resolves.toEqual({ encrypted: JSON.stringify(params) });
  });

  it.each([undefined, 'token', 'nft'])(
    'routes a build result by kind (%s), regardless of its 48-character ID', async kind => {
      jest.spyOn(dappService, 'getDecryptData').mockReturnValue({ kind, buildID: hexId });
      const nftResult = jest.spyOn(nftWebBuild, 'result').mockResolvedValue({ accepted: true });
      const tokenResult = jest.spyOn(dappService, 'requestTokenBuildSign').mockResolvedValue('token');
      const response = await new Promise(resolve => {
        void dappService.handleMessage({
          action: TOKEN_BUILD.requestSign,
          payload: { id: 'request', params: {}, site: { origin } },
        }, sender, resolve);
      });

      expect(response).toEqual({ id: 'request', result: kind === 'nft' ? { accepted: true } : 'token' });
      if (kind === 'nft') {
        expect(nftResult).toHaveBeenCalledWith({ kind, buildID: hexId }, origin, 7);
        expect(tokenResult).not.toHaveBeenCalled();
      } else {
        expect(tokenResult).toHaveBeenCalledTimes(1);
        expect(nftResult).not.toHaveBeenCalled();
      }
    },
  );
});
