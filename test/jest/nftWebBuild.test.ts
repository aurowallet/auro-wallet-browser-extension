import browser from 'webextension-polyfill';
import {nftWebBuild} from '@/background/nftWebBuild';
import {memStore} from '@/store';
import {getCurrentNodeConfig} from '@/utils/browserUtils';
import {startPopupWindow, closePopupWindow, startExtensionPopup} from '@/utils/popup';
import {LANGUAGE_CONFIG} from '@/constant/storageKey';
import type {ILocalTransferSummary, ILocalTransferJob} from '@/types/nft';
import {TOKEN_BUILD_URL} from '../../config';

jest.mock('@/utils/browserUtils', () => ({getCurrentNodeConfig: jest.fn()}));
jest.mock('@/utils/popup', () => ({startPopupWindow: jest.fn(), closePopupWindow: jest.fn(), startExtensionPopup: jest.fn()}));

const origin = new URL(TOKEN_BUILD_URL).origin;
const summary: ILocalTransferSummary = {
  chain: 'mina:devnet', gqlUrl: 'https://node.example/graphql', sender: 'sender', recipient: 'recipient',
  collectionAddress: 'collection', nftAddress: 'nft', fee: '100000000', memo: '', owner: 'sender',
  tokenId: 'token', nonce: '3', nftVersion: '1', collectionTransferFee: '0', feeRecipient: 'creator',
  totalDebit: '100000000', collectionVk: 'collection-vk', nftVk: 'nft-vk', metadataRoot: '123',
  chainId: 'current-node-chain-id',
  accountCreationFee: '0', provingFee: '0', checkedAt: '2026-11-27T00:00:00.000Z',
};
const transaction = () => ({
  feePayer: {body: {publicKey: summary.sender, fee: summary.fee, nonce: summary.nonce}, authorization: ''},
  memo: '', accountUpdates: [{body: {
    authorizationKind: {isProved: true, isSigned: false},
    update: {appState: Array(32).fill(null)}, preconditions: {account: {state: Array(32).fill(null)}},
  }, authorization: {proof: 'proof'}}],
});
const report = (jobId: string, event: string, extra = {}) =>
  nftWebBuild.result({buildID: jobId, kind: 'nft', protocol: 'auro-nft-web-v1', event, ...extra}, origin, 7);
const ready = async () => {
  const job = await nftWebBuild.create({...summary});
  await report(job.jobId, 'result', {transaction: transaction()});
  return await nftWebBuild.review(job.jobId);
};
const originalFetch = globalThis.fetch;
const fetchMock = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  memStore.reset();
  memStore.unlock({currentAccount: {address: summary.sender}});
  jest.mocked(getCurrentNodeConfig).mockResolvedValue({networkID: summary.chain, url: summary.gqlUrl} as any);
  jest.mocked(browser.storage.local.get).mockResolvedValue({[LANGUAGE_CONFIG]: 'zh_CN'});
  jest.mocked(startPopupWindow).mockResolvedValue(10);
  jest.mocked(browser.tabs.query).mockResolvedValue([{id: 7}] as any);
  jest.mocked(browser.tabs.update).mockResolvedValue({} as any);
  jest.mocked(browser.runtime.sendMessage).mockResolvedValue(true);
  fetchMock.mockReset().mockResolvedValue({ok: true, json: async () => ({data: {sendZkapp: {zkapp: {hash: 'expected-hash'}}}})});
  globalThis.fetch = fetchMock;
});
afterAll(() => {globalThis.fetch = originalFetch; memStore.reset();});

describe('NFT build lifecycle', () => {
  it('uses the common popup, current node and in-memory build list', async () => {
    const job = await nftWebBuild.create(summary);
    expect(job.jobId).toMatch(/^[a-f0-9]{48}$/);
    expect(startPopupWindow).toHaveBeenCalledWith('about:blank', 'nftSign_' + job.jobId);
    expect(browser.tabs.update).toHaveBeenCalledWith(7, {url: `${origin}/zh_CN/nft?buildid=${job.jobId}`});
    expect(browser.storage.local.set).not.toHaveBeenCalled();
    expect(await nftWebBuild.getParams(job.jobId, origin, 7)).toMatchObject({
      gqlUrl: summary.gqlUrl, networkID: summary.chain, summary: {chainId: summary.chainId},
    });
    expect(memStore.getState().nftBuildList[job.jobId]).toMatchObject({state: 'queued'});
    await report(job.jobId, 'progress', {phase: 'compiling-NFT'});
    expect(await nftWebBuild.pending()).toEqual([]);
    await report(job.jobId, 'result', {transaction: transaction()});
    expect(await nftWebBuild.pending()).toEqual([job.jobId]);
  });

  it('binds the builder tab before navigating it to the site', async () => {
    jest.mocked(browser.tabs.update).mockImplementation(async () => {
      const job = Object.values(memStore.getState().nftBuildList)[0];
      expect(await nftWebBuild.getParams(job.jobId, origin, 7)).toMatchObject({buildID: job.jobId});
      return {} as any;
    });
    await nftWebBuild.create(summary);
  });

  it.each([[origin, 8], ['https://other.example', 7], [origin, undefined]])(
    'rejects results from a different origin or tab (%s, %s)', async (senderOrigin, tabId) => {
      const job = await nftWebBuild.create(summary);
      await expect(nftWebBuild.getParams(job.jobId, senderOrigin as string, tabId as number)).rejects.toThrow();
    },
  );

  it('replaces only the unfinished build for the same account, network and NFT', async () => {
    const old = await nftWebBuild.create(summary);
    const other = await nftWebBuild.create({...summary, nftAddress: 'other-nft'});
    const next = await nftWebBuild.create(summary);
    expect(nftWebBuild.hasJob(old.jobId)).toBe(false);
    expect(nftWebBuild.hasJob(other.jobId)).toBe(true);
    expect(nftWebBuild.hasJob(next.jobId)).toBe(true);
    await expect(report(old.jobId, 'result', {transaction: transaction()})).rejects.toThrow();
  });

  it.each(['cancel', 'error'])('discards %s without storing a historical task', async event => {
    const job = await nftWebBuild.create(summary);
    memStore.lock();
    await expect(report(job.jobId, event)).resolves.toEqual({accepted: true});
    expect(nftWebBuild.hasJob(job.jobId)).toBe(false);
    expect(closePopupWindow).not.toHaveBeenCalled();
  });

  it('cannot resurrect a cancelled build while its window is opening', async () => {
    let open!: (id: number) => void;
    jest.mocked(startPopupWindow).mockImplementationOnce(() => new Promise(resolve => {open = resolve;}));
    const creating = nftWebBuild.create(summary);
    // Allow context and language reads to finish before cancelling the registered build.
    while (!open) await Promise.resolve();
    nftWebBuild.cancel(summary);
    open(10);
    await expect(creating).rejects.toThrow();
    expect(memStore.getState().nftBuildList).toEqual({});
    expect(browser.tabs.update).not.toHaveBeenCalled();
  });

  it('keeps a ready task available when the signing popup cannot be opened', async () => {
    jest.mocked(browser.runtime.sendMessage).mockResolvedValue(undefined);
    jest.mocked(startExtensionPopup).mockRejectedValueOnce(Error('Window unavailable'));
    const job = await nftWebBuild.create(summary);
    await expect(report(job.jobId, 'result', {transaction: transaction()})).rejects.toThrow();
    expect(await nftWebBuild.pending()).toEqual([job.jobId]);
  });

  it('opens the common wallet popup when no popup receives the result', async () => {
    jest.mocked(browser.runtime.sendMessage).mockResolvedValueOnce(undefined).mockResolvedValue(true);
    await ready();
    expect(startExtensionPopup).toHaveBeenCalledWith(true);
    expect(browser.runtime.sendMessage).toHaveBeenCalledTimes(2);
  });

  it('accepts only one of two concurrent completion messages', async () => {
    const job = await nftWebBuild.create(summary);
    const results = await Promise.allSettled([
      report(job.jobId, 'result', {transaction: transaction()}),
      report(job.jobId, 'result', {transaction: transaction()}),
    ]);
    expect(results.map(result => result.status).sort()).toEqual(['fulfilled', 'rejected']);
    expect(browser.runtime.sendMessage).toHaveBeenCalledTimes(1);
  });

  it.each(['account', 'network', 'node', 'lock'])('hides and rejects a ready build after a %s change', async change => {
    const job = await ready();
    if (change === 'account') memStore.setCurrentAccount({address: 'other'});
    if (change === 'lock') memStore.lock();
    if (change === 'network') jest.mocked(getCurrentNodeConfig).mockResolvedValue({networkID: 'mina:mainnet', url: summary.gqlUrl} as any);
    if (change === 'node') jest.mocked(getCurrentNodeConfig).mockResolvedValue({networkID: summary.chain, url: 'https://other-node.example'} as any);
    expect(await nftWebBuild.pending()).toEqual([]);
    await expect(nftWebBuild.review(job.jobId)).rejects.toThrow();
    await expect(nftWebBuild.removeBuild(job.jobId)).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('clears pending builds on wallet reset', async () => {
    const job = await ready();
    memStore.reset();
    expect(nftWebBuild.hasJob(job.jobId)).toBe(false);
    await expect(nftWebBuild.review(job.jobId)).rejects.toThrow();
  });
});

describe('NFT build cleanup before shared submission', () => {
  it('removes a signed build without broadcasting or retaining transaction history', async () => {
    const job = await ready();
    await expect(nftWebBuild.removeBuild(job.jobId)).resolves.toEqual({removed: true});
    expect(nftWebBuild.hasJob(job.jobId)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(nftWebBuild.removeBuild(job.jobId)).rejects.toThrow();
  });

  it('allows only one popup to consume a ready build', async () => {
    const job = await ready();
    const results = await Promise.allSettled([
      nftWebBuild.removeBuild(job.jobId), nftWebBuild.removeBuild(job.jobId),
    ]);
    expect(results.map(result => result.status).sort()).toEqual(['fulfilled', 'rejected']);
    expect(await nftWebBuild.pending()).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps an unfinished build until it is ready or cancelled', async () => {
    const job = await nftWebBuild.create(summary);
    await expect(nftWebBuild.removeBuild(job.jobId)).rejects.toThrow();
    expect(nftWebBuild.hasJob(job.jobId)).toBe(true);
  });
});
