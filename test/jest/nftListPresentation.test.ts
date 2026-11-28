import React, {act} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import NFTListView from '@/popup/pages/Wallet/component/NFTListView';
import {useAppDispatch, useAppSelector} from '@/hooks/useStore';
import {readNFTListCache} from '@/utils/nft';
import {nftListKey, type INFTListEntry} from '@/reducers/nft';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({useNavigate: () => mockNavigate}));
jest.mock('i18next', () => ({language: 'en', t: (key: string, options?: {count: number}) => options ? `${key}:${options.count}` : key}));
jest.mock('@/hooks/useStore', () => ({useAppSelector: jest.fn(), useAppDispatch: jest.fn()}));
jest.mock('@/utils/nft', () => ({
  readNFTListCache: jest.fn(),
  groupOwnedNFTs: jest.requireActual('@/utils/nft').groupOwnedNFTs,
}));
jest.mock('@/popup/pages/Wallet/component/StatusView', () => ({LoadingView: () => React.createElement('p', null, 'loading')}));
jest.mock('styled-components', () => ({
  __esModule: true,
  default: {div: () => 'div', img: () => 'img'},
  css: () => '', keyframes: () => '',
}));

describe('NFT list displays available content', () => {
  let dom: JSDOM, root: Root, container: HTMLDivElement;
  const originalWindow = globalThis.window, originalDocument = globalThis.document;
  const testGlobal = globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT?: boolean};
  const originalAct = testGlobal.IS_REACT_ACT_ENVIRONMENT;
  const key = nftListKey('mina:devnet', 'owner');
  const nft = {id: 'nft', name: 'Available NFT', owner: 'owner', network: 'mina:devnet', imageUrl: '', collectionAddress: 'collection', nftAddress: 'nft'} as any;
  const state = {
    accountInfo: {currentAccount: {address: 'owner'}},
    network: {currentNode: {networkID: 'mina:devnet'}},
    nft: {lists: {} as Record<string, INFTListEntry>},
  };
  const render = () => act(() => root.render(React.createElement(NFTListView)));
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(readNFTListCache).mockReturnValue(undefined);
    dom = new JSDOM('<!doctype html><body></body>');
    Object.defineProperty(globalThis, 'window', {value: dom.window});
    Object.defineProperty(globalThis, 'document', {value: dom.window.document});
    testGlobal.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
    state.network.currentNode.networkID = 'mina:devnet';
    state.nft.lists = {[key]: {items: [nft], partial: false, loaded: true, status: 'ready', revision: 0, stale: false}};
    jest.mocked(useAppSelector).mockImplementation(selector => selector(state as never));
    jest.mocked(useAppDispatch).mockReturnValue(jest.fn());
  });
  afterEach(() => {
    act(() => root.unmount()); dom.window.close();
    Object.defineProperty(globalThis, 'window', {value: originalWindow});
    Object.defineProperty(globalThis, 'document', {value: originalDocument});
    if (originalAct === undefined) delete testGlobal.IS_REACT_ACT_ENVIRONMENT;
    else testGlobal.IS_REACT_ACT_ENVIRONMENT = originalAct;
  });

  it.each(['partial', 'error', 'loading'] as const)('keeps loaded content and navigation without a %s banner', status => {
    if (status === 'partial') state.nft.lists[key]!.partial = true;
    else state.nft.lists[key]!.status = status;
    render();
    expect(container.textContent).toBe('Available NFTnftOwnedCount:1');
    expect(container.querySelector('[role="alert"]')).toBeNull();
    act(() => container.querySelectorAll('img')[0]!.click());
    expect(mockNavigate).toHaveBeenCalledWith('/nft_detail', {state: {nft}});
  });
  it('shows cached content when a refresh fails before restoring the store', () => {
    state.nft.lists[key] = {...state.nft.lists[key]!, loaded: false, items: [], status: 'error'};
    jest.mocked(readNFTListCache).mockReturnValue({items: [nft], partial: true});
    render(); expect(container.textContent).toBe('Available NFTnftOwnedCount:1');
  });
  it.each(['ready', 'error'] as const)('does not add a new empty or error message for an empty %s result', status => {
    state.nft.lists[key] = {...state.nft.lists[key]!, items: [], status};
    render(); expect(container.textContent).toBe('');
  });
  it('shows the shared loading view only while no result is available', () => {
    state.nft.lists = {};
    render(); expect(container.textContent).toBe('loading');
  });
  it('does not show a new network notice or another network’s assets', () => {
    state.network.currentNode.networkID = 'mina:mainnet';
    const mainnetKey = nftListKey('mina:mainnet', 'owner');
    state.nft.lists[mainnetKey] = {...state.nft.lists[key]!, items: [nft, {...nft, network: 'mina:mainnet', owner: 'other'}]};
    render(); expect(container.textContent).toBe(''); expect(container.querySelector('img')).toBeNull();
  });
  it('displays current-network holdings without a Devnet-only page gate', () => {
    state.network.currentNode.networkID = 'mina:mainnet';
    const mainnetKey = nftListKey('mina:mainnet', 'owner');
    state.nft.lists[mainnetKey] = {...state.nft.lists[key]!, items: [{...nft, network: 'mina:mainnet'}]};
    render(); expect(container.textContent).toBe('Available NFTnftOwnedCount:1');
  });
});
