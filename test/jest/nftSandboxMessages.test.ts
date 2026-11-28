jest.mock('@/sandbox/nftRuntime', () => ({
  deriveNFTIdentities: jest.fn(), decodeNFTState: jest.fn(), validateNFTMetadata: jest.fn(),
  decodeNFTTransfer: jest.fn(),
}));
// This package exposes ESM imports only; Jest's CommonJS resolver needs a virtual mock.
jest.mock('mina-attestations', () => ({
  Credential: {fromJSON: jest.fn(async value => value), validate: jest.fn(), toJSON: jest.fn(value => value)},
  Presentation: {}, PresentationRequest: {},
}), {virtual: true});
jest.mock('o1js', () => ({Signature: {}}));
jest.mock('serialize-error', () => ({serializeError: (error: Error) => ({message: error.message})}));

const originalWindow = globalThis.window;

describe('Chrome sandbox message entry', () => {
  let receive: (event: MessageEvent) => Promise<void>;
  let parent: {postMessage: jest.Mock};
  let runtime: jest.Mocked<typeof import('@/sandbox/nftRuntime')>;
  let addListener: jest.Mock;
  const origin = 'chrome-extension://test-extension';
  const data = {type: 'nft-operation', operation: 'decode-transfer', requestId: 'request-1', payload: {nftAddress: 'nft'}};
  const send = (message = data, source: unknown = parent) => receive({data: message, source, origin} as MessageEvent);

  beforeEach(async () => {
    jest.resetModules();
    parent = {postMessage: jest.fn()};
    addListener = jest.fn((_type, handler) => {receive = handler;});
    Object.defineProperty(globalThis, 'window', {value: {parent, addEventListener: addListener}});
    await import('@/sandbox/index');
    runtime = jest.mocked(await import('@/sandbox/nftRuntime'));
    runtime.decodeNFTTransfer.mockResolvedValue({nft: {name: 'NFT'}} as any);
  });
  afterEach(() => {Object.defineProperty(globalThis, 'window', {value: originalWindow});});

  it('uses one listener and responds to NFT queries before credential initialization', async () => {
    expect(addListener).toHaveBeenCalledTimes(1);
    await send();
    expect(runtime.decodeNFTTransfer).toHaveBeenCalledWith(data.payload);
    expect(parent.postMessage).toHaveBeenCalledWith({type: 'nft-operation-result', requestId: data.requestId,
      result: {nft: {name: 'NFT'}}}, origin);
  });

  it('ignores NFT requests from a different window', async () => {
    await send(data, {});
    expect(runtime.decodeNFTTransfer).not.toHaveBeenCalled();
    expect(parent.postMessage).not.toHaveBeenCalled();
  });

  it('shares an in-flight operation when the parent resends the same request', async () => {
    let finish!: (value: any) => void;
    runtime.decodeNFTTransfer.mockReturnValue(new Promise(resolve => {finish = resolve;}));
    const first = send(), second = send();
    await Promise.resolve(); await Promise.resolve();
    finish({nft: {name: 'NFT'}});
    await Promise.all([first, second]);
    expect(runtime.decodeNFTTransfer).toHaveBeenCalledTimes(1);
    expect(parent.postMessage).toHaveBeenCalledTimes(2);
  });

  it('returns operation errors with the original request ID', async () => {
    runtime.decodeNFTTransfer.mockRejectedValue(new Error('Node unavailable'));
    await send();
    expect(parent.postMessage).toHaveBeenCalledWith({type: 'nft-operation-result', requestId: data.requestId,
      error: {message: 'Node unavailable'}}, origin);
  });

  it('rejects an unknown operation', async () => {
    await send({...data, operation: 'unknown'});
    expect(parent.postMessage).toHaveBeenCalledWith(expect.objectContaining({
      error: {message: 'Unknown NFT operation'}, requestId: data.requestId,
    }), origin);
  });

  it('retains the existing credential behavior', async () => {
    const credential = {type: 'validate-credential', payload: {credential: 'example'}};
    await receive({source: parent, origin, data: {type: 'init-sandbox', parentOrigin: origin}} as unknown as MessageEvent);
    await receive({source: parent, origin, data: credential} as unknown as MessageEvent);
    expect(parent.postMessage).toHaveBeenCalledWith({type: 'validate-credential-result', result: credential.payload}, '*');
    expect(runtime.decodeNFTTransfer).not.toHaveBeenCalled();
  });
});


describe('Firefox sandbox unsupported operations', () => {
  let receive: (event: MessageEvent) => void;
  let postMessage: jest.Mock;
  beforeEach(async () => {
    jest.resetModules();
    postMessage = jest.fn();
    Object.defineProperty(globalThis, 'window', {value: {
      parent: {postMessage}, addEventListener: (_type: string, handler: typeof receive) => {receive = handler;},
    }});
    await import('@/sandbox/index.firefox');
  });
  afterEach(() => {Object.defineProperty(globalThis, 'window', {value: originalWindow});});

  it.each(['derive-identities', 'decode-state', 'validate-metadata', 'decode-transfer'])(
    'returns an immediate correlated unsupported response for NFT %s', operation => {
      receive({data: {type: 'nft-operation', requestId: 'nft-request', operation}} as MessageEvent);
      expect(postMessage).toHaveBeenCalledWith({type: 'nft-operation-result', requestId: 'nft-request',
        error: {message: 'Not supported yet'}}, '*');
      expect(require.cache[require.resolve('@/sandbox/nftMessages')]).toBeUndefined();
      expect(require.cache[require.resolve('@/sandbox/nftRuntime')]).toBeUndefined();
    },
  );

  it.each(['validate-credential', 'presentation'])('keeps the existing %s response', type => {
    receive({data: {type}} as MessageEvent);
    expect(postMessage).toHaveBeenCalledWith({type: `${type}-result`, error: {message: 'Not supported yet'}}, '*');
  });
});
