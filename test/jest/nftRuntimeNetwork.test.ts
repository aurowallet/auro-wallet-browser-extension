import axios, {AxiosError, type InternalAxiosRequestConfig} from 'axios';
import {preflightNFT, validateNFTTransaction} from '@/utils/nftTransfer';
import {readNFTInfo, readNFTInfos} from '@/utils/nft';
import {nftSandboxRequest} from '@/utils/nftSandbox';
import {handleNFTOperation} from '@/sandbox/nftMessages';

jest.mock('@/utils/nftSandbox', () => ({nftSandboxRequest: jest.fn()}));

jest.mock('@/background/extensionStorage', () => ({extGetLocal: jest.fn()}));

let mockMetadataCid = 'b' + 'a'.repeat(32);

jest.mock('o1js', () => ({
  Field: (value: unknown) => ({toString: () => String(value)}),
  PublicKey: {
    fromBase58: (value: string) => ({isEmpty: () => ({toBoolean: () => false}), toBase58: () => value}),
    fromFields: () => ({toBase58: () => 'creator'}),
    empty: () => ({}),
  },
  TokenId: {default: 'default-token', derive: () => 'token', toBase58: (value: string) => value},
  UInt64: {from: (value: bigint) => ({toString: () => String(value)})},
  Mina: {Transaction: {fromJSON: async (value: any) => ({transaction: {memo: (typeof value === 'string' ? JSON.parse(value) : value).memo}})}},
}));
jest.mock('@silvana-one/nft', () => ({
  NFTStateStruct: {fromFields: () => ({packedData: {}, metadata: {toString: () => '123'}, name: {}, storage: {toString: () => mockMetadataCid}})},
  NFTData: {unpack: () => ({
    owner: {toBase58: () => 'sender'}, version: {toString: () => '1'},
    canTransfer: {toBoolean: () => true}, isPaused: {toBoolean: () => false},
    pack() {return {owner: this.owner.toBase58()};},
  })},
  NFTDataPacked: {toFields: (data: {owner: string}) => data.owner === 'recipient' ? ['11', '22', '2', '0'] : ['0', '0', '0', '0']},
  CollectionData: {unpack: () => ({
    isPaused: {toBoolean: () => false}, requireTransferApproval: {toBoolean: () => false},
    transferFee: {toString: () => '0'},
  })},
  fieldToString: () => 'collection',
  Metadata: {fromJSON: jest.fn()},
}));

const originalAdapter = axios.defaults.adapter;
let requestMock: jest.Mock;
beforeEach(() => {
  jest.mocked(nftSandboxRequest).mockImplementation(async (operation, payload, signal) => {
    signal?.throwIfAborted();
    const response = await handleNFTOperation({operation, payload: structuredClone(payload), requestId: crypto.randomUUID()});
    if (response.error) throw new Error((response.error as {message: string}).message);
    return structuredClone(response.result) as any;
  });
  requestMock = jest.fn();
  axios.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const result = await requestMock(config.url, config);
    return {config, status: 200, statusText: 'OK', headers: {}, data: await result.json()};
  };
});
afterEach(() => {axios.defaults.adapter = originalAdapter;});
const input = {
  chain: 'mina:devnet', gqlUrl: 'https://current-node.example/graphql',
  collectionAddress: 'collection', nftAddress: 'nft', sender: 'sender', recipient: 'recipient', fee: '1', memo: '',
} as const;
function response(chainId: string, syncStatus = 'SYNCED') {
  const account = (publicKey: string) => ({publicKey, zkappState: Array(32).fill('0'), verificationKey: {hash: '1'}});
  return {ok: true, json: async () => ({data: {
    syncStatus, daemonStatus: {chainId}, collection: account('collection'), nft: account('nft'),
    account: {publicKey: 'sender', nonce: '1', balance: {total: '100', liquid: '100'}},
  }})};
}

it.each(['current-chain', 'chain-after-upgrade'])('uses the selected node chain ID (%s) in the transfer summary', async chainId => {
  requestMock.mockResolvedValue(response(chainId));
  const summary = await preflightNFT(input);
  expect(summary).toMatchObject({chainId, gqlUrl: input.gqlUrl, chain: input.chain, sender: input.sender});
  expect(requestMock.mock.calls.every(([url]) => url === input.gqlUrl)).toBe(true);
});

it('does not block otherwise available account data on node sync status', async () => {
  requestMock = jest.fn().mockResolvedValue(response('current-chain', 'CATCHUP'));
  await expect(preflightNFT(input)).resolves.toMatchObject({sender: input.sender});
});

it.each(['mina:mainnet', 'mina:devnet', 'zeko:mainnet', 'zeko:testnet'] as const)(
  'preflights the supplied network without replacing it (%s)', async chain => {
    requestMock = jest.fn().mockResolvedValue(response('current-chain'));
    const summary = await preflightNFT({...input, chain});
    expect(summary.chain).toBe(chain);
    expect(summary).not.toHaveProperty('signerNetwork');
    expect(summary).not.toHaveProperty('signerEra');
  },
);

it.each(['https://nft-images.example:8443/art.png', 'http://nft-images.example/art.png'])(
  'accepts HTTPS NFT images without a domain or port allowlist (%s)', async image => {
    mockMetadataCid = 'b' + (image.startsWith('https:') ? 'c' : 'd').repeat(32);
    requestMock = jest.fn().mockImplementation(async url => String(url).startsWith(input.gqlUrl)
      ? response('current-chain')
      : {ok: true, json: async () => ({name: 'collection', metadataRoot: '123', image})});
    const result = readNFTInfo({...input, chain: 'mina:mainnet'});
    if (image.startsWith('https:')) await expect(result).resolves.toMatchObject({nft: {chain: 'mina:mainnet', image}});
    else await expect(result).rejects.toThrow('Unsupported NFT image URL');
  },
);

it.each(['50', '0'])('checks spendable balance instead of banning timed accounts (liquid=%s)', async liquid => {
  const nodeResponse = response('current-chain');
  const json = await nodeResponse.json();
  Object.assign(json.data.account, {balance: {total: '100', liquid}, timing: {initialMinimumBalance: '100'}});
  requestMock = jest.fn().mockResolvedValue({ok: true, json: async () => json});
  const result = preflightNFT(input);
  if (liquid === '0') await expect(result).rejects.toThrow('Insufficient balance');
  else await expect(result).resolves.toMatchObject({sender: input.sender});
});

it('still binds displayed metadata to the on-chain root', async () => {
  mockMetadataCid = 'metadata-root-mismatch';
  requestMock = jest.fn().mockImplementation(async url => String(url).startsWith(input.gqlUrl)
    ? response('current-chain')
    : {ok: true, json: async () => ({name: 'collection', metadataRoot: '456', image: 'https://image.example/nft.png'})});
  await expect(readNFTInfo(input)).rejects.toThrow('NFT metadata differs from chain');
});

it('encodes the metadata location without imposing a CID format allowlist', async () => {
  mockMetadataCid = 'another-cid-format?path=1';
  requestMock = jest.fn().mockImplementation(async url => String(url).startsWith(input.gqlUrl)
    ? response('current-chain')
    : {ok: true, json: async () => ({name: 'collection', metadataRoot: '123', image: 'https://image.example/nft.png'})});
  await expect(readNFTInfo(input)).resolves.toMatchObject({nft: {metadataRoot: '123'}});
  expect(requestMock).toHaveBeenCalledWith('https://gateway.pinata.cloud/ipfs/another-cid-format%3Fpath%3D1', expect.any(Object));
});

it('still rejects a chain change between preparation and signing', async () => {
  requestMock = jest.fn().mockResolvedValue(response('current-chain'));
  const summary = await preflightNFT(input);
  requestMock = jest.fn().mockResolvedValue(response('different-chain'));
  await expect(validateNFTTransaction({summary, transaction: {}})).rejects.toThrow('Transfer details changed');
});

function transferTransaction() {
  const roles = [
    {publicKey: 'collection', tokenId: 'default-token', callDepth: 0},
    {publicKey: 'nft', tokenId: 'token', callDepth: 1},
    {publicKey: 'sender', tokenId: 'default-token', callDepth: 1},
    {publicKey: 'creator', tokenId: 'default-token', callDepth: 2},
  ];
  return {
    feePayer: {body: {publicKey: 'sender', fee: '1', nonce: '1', validUntil: null}},
    memo: '',
    accountUpdates: roles.map((role, i) => {
      const appState = Array(32).fill(null);
      if (i === 1) appState.splice(4, 3, '11', '22', '2');
      const state = Array(32).fill(null);
      for (const index of i === 0 ? [1, 2, 6] : i === 1 ? [4, 5, 6] : []) state[index] = '0';
      return {
        body: {
          ...role, incrementNonce: false, implicitAccountCreationFee: false, actions: [],
          balanceChange: {magnitude: '0', sgn: 'Positive'},
          update: {appState, permissions: null}, preconditions: {account: {state}},
          mayUseToken: {parentsOwnToken: i === 1, inheritFromParent: false},
          authorizationKind: {isProved: i < 2, isSigned: i === 2, verificationKeyHash: '1'},
          useFullCommitment: i === 2,
        },
        authorization: {proof: i < 2 ? 'builder-proof' : null},
      };
    }),
  };
}

it('checks transfer contents using chain key hashes without local key or proof verification', async () => {
  requestMock = jest.fn().mockResolvedValue(response('current-chain'));
  const summary = await preflightNFT(input);
  await expect(validateNFTTransaction({summary, transaction: transferTransaction()})).resolves.toEqual({valid: true});
});

it.each(['recipient', 'debit', 'fee', 'memo', 'permissions', 'proof'])(
  'rejects a built transfer with an altered %s', async field => {
    requestMock = jest.fn().mockResolvedValue(response('current-chain'));
    const summary = await preflightNFT(input);
    const transaction = transferTransaction();
    if (field === 'recipient') transaction.accountUpdates[1]!.body.update.appState[4] = 'other-owner';
    if (field === 'debit') transaction.accountUpdates[2]!.body.balanceChange.magnitude = '100';
    if (field === 'fee') transaction.feePayer.body.fee = '100';
    if (field === 'memo') transaction.memo = 'changed';
    if (field === 'permissions') Object.assign(transaction.accountUpdates[2]!.body.update, {permissions: {editState: 'None'}});
    if (field === 'proof') transaction.accountUpdates[0]!.authorization.proof = null;
    await expect(validateNFTTransaction({summary, transaction})).rejects.toThrow();
  },
);

it('uses the shared timeout and retry policy for NFT queries', async () => {
  requestMock.mockImplementation(async (_url: string, config: InternalAxiosRequestConfig) => {
    if (requestMock.mock.calls.length === 1) {
      expect(config.timeout).toBe(60000);
      throw new AxiosError('timeout', 'ECONNABORTED', config);
    }
    return response('current-chain');
  });
  await expect(preflightNFT(input)).resolves.toMatchObject({sender: input.sender});
  expect(requestMock).toHaveBeenCalledTimes(3);
  const first = requestMock.mock.calls[0]![1];
  const retry = requestMock.mock.calls[1]![1];
  expect(first['axios-retry'].retries).toBe(3);
  expect(retry.data).toBe(first.data);
});

it('rejects a GraphQL error without decoding it or retrying it', async () => {
  requestMock.mockResolvedValue({json: async () => ({errors: [{message: 'Node rejected query'}]})});
  await expect(preflightNFT(input)).rejects.toThrow();
  expect(requestMock).toHaveBeenCalledTimes(1);
});

it('keeps failed metadata requests retryable through the shared GET helper', async () => {
  mockMetadataCid = 'metadata-retry-shared-request';
  let gatewayCalls = 0;
  requestMock.mockImplementation(async (url: string, config: InternalAxiosRequestConfig) => {
    if (url === input.gqlUrl) return response('current-chain');
    expect(config.method).toBe('get');
    expect(config.timeout).toBe(60000);
    gatewayCalls++;
    if (gatewayCalls === 1) {
      throw new AxiosError('Not found', 'ERR_BAD_REQUEST', config, undefined,
        {config, status: 404, statusText: 'Not Found', headers: {}, data: {}});
    }
    return {json: async () => ({name: 'collection', metadataRoot: '123', image: 'https://image.example/nft.png'})};
  });
  await expect(readNFTInfo(input)).rejects.toThrow('NFT metadata unavailable');
  await expect(readNFTInfo(input)).resolves.toMatchObject({nft: {metadataRoot: '123'}});
  expect(gatewayCalls).toBe(2);
});

it('uses the selected node for batch discovery and propagates query failures', async () => {
  requestMock.mockResolvedValue({json: async () => ({errors: [{message: 'Node rejected query'}]})});
  await expect(readNFTInfos({...input, identities: [input]})).rejects.toThrow();
  expect(requestMock).toHaveBeenCalledTimes(1);
  const [url, config] = requestMock.mock.calls[0]!;
  expect(url).toBe(input.gqlUrl);
  expect(JSON.parse(config.data).variables).toEqual({c0: 'collection', n0: 'nft', t0: 'token'});
});

it('keeps available batch results when another NFT cannot be decoded', async () => {
  mockMetadataCid = 'partial-batch-metadata';
  const json = await response('current-chain').json();
  requestMock.mockImplementation(async (url: string) => url === input.gqlUrl
    ? {json: async () => ({data: {c0: json.data.collection, n0: json.data.nft, n1: null}})}
    : {json: async () => ({name: 'collection', metadataRoot: '123', image: 'https://image.example/nft.png'})});
  const result = await readNFTInfos({...input, owner: 'sender', identities: [input, {...input, nftAddress: 'missing'}]});
  expect(result[0]).toMatchObject({info: {nft: {tokenAddress: 'nft', owner: 'sender'}}});
  expect(result[1]).toEqual({error: true});
});

it('skips metadata requests for NFTs owned by another account', async () => {
  requestMock.mockResolvedValue(response('current-chain'));
  await expect(readNFTInfo({...input, owner: 'other'})).resolves.toBeNull();
  expect(requestMock).toHaveBeenCalledTimes(1);
  expect(jest.mocked(nftSandboxRequest).mock.calls.map(([operation]) => operation)).not.toContain('validate-metadata');
});

it('stops before decoding when the request is cancelled during its node query', async () => {
  const controller = new AbortController();
  requestMock.mockImplementation(async () => {
    controller.abort();
    return response('current-chain');
  });
  await expect(readNFTInfo(input, controller.signal)).rejects.toThrow();
  const operations = jest.mocked(nftSandboxRequest).mock.calls.map(([operation]) => operation);
  expect(operations).not.toContain('validate-metadata');
  expect(requestMock).toHaveBeenCalledTimes(1);
});
