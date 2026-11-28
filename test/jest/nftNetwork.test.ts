import {localTransfer, localTransferSigningPayload} from "@/utils/nftTransfer";
import {loadLocalNFTs, loadLocalNFT, readNFTListCache, writeNFTListCache} from '@/utils/nft';
import {getCurrentNodeConfig} from '@/utils/browserUtils';
import {sendMsgV2} from '@/utils/commonMsg';
import {nftSandboxRequest} from '@/utils/nftSandbox';
import {startFetchMyQuery, commonFetch} from '@/background/request';

jest.mock('@/background/request', () => ({startFetchMyQuery: jest.fn(), commonFetch: jest.fn()}));

jest.mock('@/utils/browserUtils', () => ({getCurrentNodeConfig: jest.fn()}));
jest.mock('@/utils/commonMsg', () => ({sendMsgV2: jest.fn()}));
jest.mock('@/utils/nftCatalog.json', () => [
  {chain: 'mina:devnet', collectionAddress: 'dev-collection', nftAddress: 'dev-nft'},
  {chain: 'mina:mainnet', collectionAddress: 'main-collection', nftAddress: 'main-nft'},
]);

const originalWindow = globalThis.window, originalDocument = globalThis.document;
const listeners = new Set<(event: unknown) => void>();
let autoReply = true;
let decodeError = false;
let transformState = (value: any): any => value;
const requested: any[] = [];
function resultFor(message: any) {
  if (message.operation === 'derive-identities') return message.payload.map((id: any) => ({...id, tokenId: 'token'}));
  if (message.operation === 'validate-metadata') return {valid: true};
  return transformState({name: 'NFT', storage: message.payload.id.nftAddress, metadataRoot: '123', owner: 'owner',
    version: '1', canTransfer: true, isPaused: false,
    collection: {name: 'Collection', creator: 'creator', transferFee: '100', isPaused: false, requireTransferApproval: false}});
}
const target = {postMessage: (message: any) => {
  requested.push(message);
  if (!autoReply) return;
  const body = decodeError && message.operation === 'decode-state' ? {error: {message: 'NFT account not found'}} : {result: resultFor(message)};
  queueMicrotask(() => listeners.forEach(listener => listener({source: target, data: {
    type: `${message.type}-result`, requestId: message.requestId, ...body,
  }})));
}};

beforeEach(() => {
  autoReply = true;
  transformState = value => value;
  decodeError = false; requested.length = 0; listeners.clear();
  jest.mocked(startFetchMyQuery).mockResolvedValue({collection: {}, nft: {}});
  jest.mocked(commonFetch).mockResolvedValue({name: 'NFT', metadataRoot: '123', image: 'https://images.example/nft.png',
    description: 'NFT description', traits: [{key: 'Edition', value: '2'}]});
  localStorage.clear();
  Object.defineProperty(globalThis, 'window', {value: {
    addEventListener: (_name: string, listener: (event: unknown) => void) => listeners.add(listener),
    removeEventListener: (_name: string, listener: (event: unknown) => void) => listeners.delete(listener),
  }});
  Object.defineProperty(globalThis, 'document', {value: {getElementById: () => ({
    contentWindow: target, addEventListener: () => {}, removeEventListener: () => {},
  })}});
});
afterEach(() => {
  Object.defineProperty(globalThis, 'window', {value: originalWindow});
  Object.defineProperty(globalThis, 'document', {value: originalDocument});
});

it.each(['mina:mainnet', 'mina:devnet'])('queries and caches only the selected network (%s)', async network => {
  jest.mocked(getCurrentNodeConfig).mockResolvedValue({networkID: network, url: 'https://node.example'} as any);
  const result = await loadLocalNFTs(network, 'owner');
  const prefix = network === 'mina:mainnet' ? 'main' : 'dev';
  expect(result.items).toHaveLength(1);
  expect(result.items[0]).toMatchObject({network, nftAddress: `${prefix}-nft`, collectionAddress: `${prefix}-collection`});
  const listRequest = requested.find(message => message.operation === 'derive-identities');
  expect(listRequest.payload).toEqual([{chain: network, nftAddress: `${prefix}-nft`, collectionAddress: `${prefix}-collection`}]);
  expect(requested.map(message => message.operation)).toEqual(expect.arrayContaining(['derive-identities', 'decode-state']));
  expect(startFetchMyQuery).toHaveBeenCalledWith(expect.any(String), expect.any(Object), 'https://node.example');
  const key = JSON.stringify([network, 'owner']);
  writeNFTListCache(key, result);
  expect(readNFTListCache(key)).toEqual(result);
  expect(readNFTListCache(JSON.stringify([network, 'other-owner']))).toBeUndefined();
});

it('returns an empty list without querying unrelated catalog entries', async () => {
  jest.mocked(getCurrentNodeConfig).mockResolvedValue({networkID: 'zeko:testnet', url: 'https://node.example'} as any);
  await expect(loadLocalNFTs('zeko:testnet', 'owner')).resolves.toEqual({items: [], partial: false});
  expect(requested).toEqual([]);
});

it('rejects a detail request after switching to a different network', async () => {
  jest.mocked(getCurrentNodeConfig).mockResolvedValue({networkID: 'mina:devnet', url: 'https://node.example'} as any);
  await expect(loadLocalNFT('mina:mainnet', {collectionAddress: 'main-collection', nftAddress: 'main-nft'})).rejects.toThrow();
});

it('keeps a cache entry from being reused under another network key', async () => {
  jest.mocked(getCurrentNodeConfig).mockResolvedValue({networkID: 'mina:devnet', url: 'https://node.example'} as any);
  const result = await loadLocalNFTs('mina:devnet', 'owner');
  const wrongKey = JSON.stringify(['mina:mainnet', 'owner']);
  writeNFTListCache(wrongKey, result);
  expect(readNFTListCache(wrongKey)).toBeUndefined();
});

it('uses the task network when preparing and signing, without requiring a particular ID format', async () => {
  const summary = {
    chain: 'mina:mainnet', gqlUrl: 'https://node.example', sender: 'owner', recipient: 'recipient', owner: 'owner',
    collectionAddress: 'collection', nftAddress: 'nft', fee: '1', memo: '', nonce: '1', tokenId: 'token', nftVersion: '1',
    collectionTransferFee: '0', feeRecipient: 'creator', totalDebit: '1', collectionVk: '1', nftVk: '1',
    metadataRoot: '123', chainId: 'current-chain', accountCreationFee: '0', provingFee: '0', checkedAt: new Date().toISOString(),
  } as const;
  const job = {jobId: 'runtime-build-id', chain: summary.chain, summary, state: 'ready', phase: 'ready', createdAt: Date.now(),
    transaction: {feePayer: {body: {publicKey: 'owner', fee: '1', nonce: '1'}}, memo: '', accountUpdates: [{
      body: {authorizationKind: {isProved: true}, update: {appState: Array(32).fill(null)}, preconditions: {account: {state: Array(32).fill(null)}}},
      authorization: {proof: 'proof'},
    }]},
  } as const;
  jest.mocked(sendMsgV2).mockResolvedValue(job);
  const prepared = await localTransfer.prepare(summary);
  expect(prepared.jobId).toBe('runtime-build-id');
  expect(sendMsgV2).toHaveBeenCalledWith(expect.objectContaining({payload: {route: 'nft/transfer', body: summary}}));
  expect(localTransferSigningPayload(prepared, 'mina:mainnet', 'owner')).toMatchObject({fromAddress: 'owner', fee: '0.000000001'});
  expect(() => localTransferSigningPayload(prepared, 'mina:devnet', 'owner')).toThrow();
});

it('rejects a sandbox response for a different asset', async () => {
  jest.mocked(getCurrentNodeConfig).mockResolvedValue({networkID: 'mina:mainnet', url: 'https://node.example'} as any);
  decodeError = true;
  await expect(loadLocalNFT('mina:mainnet', {collectionAddress: 'main-collection', nftAddress: 'main-nft'})).rejects.toThrow();
});

it('normalizes metadata attributes outside the sandbox and retains the transfer fee', async () => {
  jest.mocked(getCurrentNodeConfig).mockResolvedValue({networkID: 'mina:mainnet', url: 'https://node.example'} as any);
  transformState = value => ({...value, collection: {...value.collection, creator: 'owner'}});
  const item = await loadLocalNFT('mina:mainnet', {collectionAddress: 'main-collection', nftAddress: 'main-nft'});
  expect(item).toMatchObject({description: 'NFT description', attributes: [{name: 'Edition', value: '2'}],
    collectionTransferFee: '0', feeRecipient: 'owner'});
  expect(requested.map(message => message.operation)).toContain('decode-state');
});

it('cancels a stored build without revalidating addresses or requiring the sandbox', async () => {
  Object.defineProperty(globalThis, 'document', {value: {getElementById: () => null}});
  jest.mocked(sendMsgV2).mockResolvedValue({cancelled: true});
  await localTransfer.cancel({chain: 'mina:mainnet', collectionAddress: 'collection', nftAddress: 'nft',
    sender: 'owner', recipient: 'recipient', fee: '1', memo: ''}, 'existing-build');
  expect(sendMsgV2).toHaveBeenCalledWith(expect.objectContaining({payload: {route: 'transaction/cancel', body: {
    chain: 'mina:mainnet', sender: 'owner', collectionAddress: 'collection', nftAddress: 'nft', jobId: 'existing-build',
  }}}));
  expect(requested).toEqual([]);
});

it('rejects a missing background response', async () => {
  jest.mocked(sendMsgV2).mockResolvedValue(undefined);
  await expect(localTransfer.review('existing-build')).rejects.toThrow();
});

it('keeps simultaneous replies bound to their iframe and request', async () => {
  autoReply = false;
  jest.mocked(getCurrentNodeConfig).mockResolvedValue({networkID: 'mina:mainnet', url: 'https://node.example'} as any);
  const firstId = {collectionAddress: 'main-collection', nftAddress: 'first'};
  const secondId = {collectionAddress: 'main-collection', nftAddress: 'second'};
  const first = nftSandboxRequest('derive-identities', [firstId]);
  const second = nftSandboxRequest('derive-identities', [secondId]);
  await Promise.resolve();
  expect(listeners.size).toBe(2);
  const reply = (message: any, source = target, requestId = message.requestId) => {
    listeners.forEach(listener => listener({source, data: {type: 'nft-operation-result', requestId,
      result: resultFor(message)}}));
  };
  reply(requested[0], {} as typeof target);
  reply(requested[0], target, 'another-request');
  expect(listeners.size).toBe(2);
  reply(requested[1]); reply(requested[0]);
  await expect(first).resolves.toEqual([{...firstId, tokenId: 'token'}]);
  await expect(second).resolves.toEqual([{...secondId, tokenId: 'token'}]);
  expect(listeners.size).toBe(0);
});

it('cleans up a pending sandbox request on cancellation', async () => {
  autoReply = false;
  jest.mocked(getCurrentNodeConfig).mockResolvedValue({networkID: 'mina:mainnet', url: 'https://node.example'} as any);
  const controller = new AbortController();
  const pending = loadLocalNFT('mina:mainnet', {collectionAddress: 'collection', nftAddress: 'nft'}, controller.signal);
  const rejected = expect(pending).rejects.toThrow();
  await Promise.resolve();
  expect(listeners.size).toBe(1);
  controller.abort();
  await rejected;
  expect(listeners.size).toBe(0);
});

it('does not leave a query loading forever if the sandbox never replies', async () => {
  jest.useFakeTimers();
  try {
    autoReply = false;
    jest.mocked(getCurrentNodeConfig).mockResolvedValue({networkID: 'mina:mainnet', url: 'https://node.example'} as any);
    const pending = loadLocalNFT('mina:mainnet', {collectionAddress: 'collection', nftAddress: 'nft'});
    const rejected = expect(pending).rejects.toThrow();
    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(150000);
    await rejected;
    expect(listeners.size).toBe(0);
  } finally {jest.useRealTimers();}
});
