import React, {act} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {Provider} from 'react-redux';
import {JSDOM} from 'jsdom';
import {configureStore} from '@reduxjs/toolkit';
import rootReducer, {resetWallet} from '@/reducers';
import {updateCurrentNode} from '@/reducers/network';
import {DefaultMainnetConfig} from '@/constant/network';
import {nftListKey, invalidateNFTLists, updateNFTDetail, initNFTList} from '@/reducers/nft';
import useNFTList from '@/hooks/useNFTList';
import {loadLocalNFTs, readNFTListCache, writeNFTListCache, clearNFTListCache} from '@/utils/nft';

jest.mock('@/utils/nft', () => ({
  loadLocalNFTs: jest.fn(), readNFTListCache: jest.fn(), writeNFTListCache: jest.fn(), clearNFTListCache: jest.fn(),
}));

const network = 'mina:mainnet', owner = 'owner', key = nftListKey(network, owner);
const item = {id: 'collection.nft', network, owner, name: 'Available NFT'} as any;
const snapshot = {items: [item], partial: false};
const createStore = () => configureStore({reducer: rootReducer,
  middleware: getDefault => getDefault({serializableCheck: false}),
});
const Harness = ({page}: {page: string}) => {useNFTList(); return React.createElement('p', null, page);};
let store: ReturnType<typeof createStore>, root: Root, dom: JSDOM;
const originalWindow = globalThis.window, originalDocument = globalThis.document;
const testGlobal = globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT?: boolean};
const originalAct = testGlobal.IS_REACT_ACT_ENVIRONMENT;
const render = (page = 'NFT list') => act(async () => {
  root.render(React.createElement(Provider, {store, children: React.createElement(Harness, {page})}));
});
const dispatch = async (action: Parameters<typeof store.dispatch>[0]) => {await act(async () => {store.dispatch(action);});};

beforeEach(async () => {
  jest.resetAllMocks();
  dom = new JSDOM('<!doctype html><body><div id="root"></div></body>');
  Object.defineProperty(globalThis, 'window', {value: dom.window});
  Object.defineProperty(globalThis, 'document', {value: dom.window.document});
  testGlobal.IS_REACT_ACT_ENVIRONMENT = true;
  root = createRoot(document.getElementById('root')!);
  store = createStore();
  store.dispatch(updateCurrentNode(DefaultMainnetConfig));
  store.dispatch({type: 'UPDATE_CURRENT_ACCOUNT', account: {address: owner}});
  await render();
});
afterEach(async () => {
  await act(async () => root.unmount()); dom.window.close();
  Object.defineProperty(globalThis, 'window', {value: originalWindow});
  Object.defineProperty(globalThis, 'document', {value: originalDocument});
  if (originalAct === undefined) delete testGlobal.IS_REACT_ACT_ENVIRONMENT;
  else testGlobal.IS_REACT_ACT_ENVIRONMENT = originalAct;
});

it('restores cached holdings and shares a pending query across repeated page requests', async () => {
  let finish!: (value: typeof snapshot) => void;
  jest.mocked(readNFTListCache).mockReturnValue(snapshot);
  jest.mocked(loadLocalNFTs).mockReturnValue(new Promise(resolve => {finish = resolve;}));
  await dispatch(initNFTList(network, owner));
  await dispatch(initNFTList(network, owner));
  expect(store.getState().nft.lists[key]).toMatchObject({loaded: true, status: 'loading', items: [item]});
  expect(loadLocalNFTs).toHaveBeenCalledTimes(1);
  await render('NFT detail');
  expect(jest.mocked(loadLocalNFTs).mock.calls[0][2]!.aborted).toBe(false);
  await act(async () => finish(snapshot));
  expect(store.getState().nft.lists[key]).toMatchObject({loaded: true, status: 'ready', items: [item]});
  await render(); await dispatch(initNFTList(network, owner));
  expect(loadLocalNFTs).toHaveBeenCalledTimes(1);
  expect(writeNFTListCache).toHaveBeenCalledWith(key, snapshot);
});

it('keeps cached content when refreshing it fails', async () => {
  jest.mocked(readNFTListCache).mockReturnValue(snapshot);
  jest.mocked(loadLocalNFTs).mockRejectedValue(Error('Node unavailable'));
  await dispatch(initNFTList(network, owner));
  expect(store.getState().nft.lists[key]).toMatchObject({loaded: true, status: 'error', items: [item]});
  expect(clearNFTListCache).not.toHaveBeenCalled();
});

it.each(['unrelated', 'silent'])('does not interrupt a pending query on %s actions', async operation => {
  jest.mocked(loadLocalNFTs).mockReturnValue(new Promise(() => {}));
  await dispatch(initNFTList(network, owner));
  const signal = jest.mocked(loadLocalNFTs).mock.calls[0][2]!;
  await dispatch(operation === 'silent' ? {type: 'UPDATE_NET_HOME_REFRESH', shouldRefresh: true, isSilent: true} : {type: 'UNRELATED_ACTION'});
  expect(signal.aborted).toBe(false);
  expect(loadLocalNFTs).toHaveBeenCalledTimes(1);
});

it.each(['reset', 'invalidate', 'node', 'refresh', 'account'])(
  'rejects a late query result after %s without rewriting the cache', async operation => {
    let finish!: (value: typeof snapshot) => void;
    jest.mocked(loadLocalNFTs).mockReturnValueOnce(new Promise(resolve => {finish = resolve;}))
      .mockImplementation(() => new Promise(() => {}));
    await dispatch(initNFTList(network, owner));
    const signal = jest.mocked(loadLocalNFTs).mock.calls[0][2]!;
    await act(async () => {
      if (operation === 'reset') store.dispatch(resetWallet());
      if (operation === 'invalidate') store.dispatch(invalidateNFTLists(network));
      if (operation === 'node') store.dispatch(updateCurrentNode({...DefaultMainnetConfig, url: 'https://other-node.example'}));
      if (operation === 'refresh') store.dispatch({type: 'UPDATE_NET_HOME_REFRESH', shouldRefresh: true, isSilent: false});
      if (operation === 'account') store.dispatch({type: 'UPDATE_CURRENT_ACCOUNT', account: {address: 'other-owner'}});
      // Resolve before React effect cleanup, to cover an already queued response.
      finish(snapshot);
    });
    expect(signal.aborted).toBe(true);
    expect(store.getState().nft.lists[key]?.items || []).toEqual([]);
    expect(writeNFTListCache).not.toHaveBeenCalled();
    if (operation === 'reset') expect(clearNFTListCache).toHaveBeenCalledWith();
  },
);

it('preserves displayed and persistent holdings during a manual refresh', async () => {
  jest.mocked(loadLocalNFTs).mockResolvedValueOnce(snapshot).mockImplementation(() => new Promise(() => {}));
  await dispatch(initNFTList(network, owner));
  jest.mocked(writeNFTListCache).mockClear();
  await dispatch({type: 'UPDATE_NET_HOME_REFRESH', shouldRefresh: true, isSilent: false});
  expect(store.getState().nft.lists[key]).toMatchObject({items: [item], loaded: true, status: 'loading'});
  expect(clearNFTListCache).not.toHaveBeenCalled();
  expect(writeNFTListCache).not.toHaveBeenCalled();
});

it('refreshes completed holdings silently and persists fresh detail updates', async () => {
  jest.mocked(loadLocalNFTs).mockResolvedValue(snapshot);
  await dispatch(initNFTList(network, owner));
  await dispatch({type: 'UPDATE_NET_HOME_REFRESH', shouldRefresh: true, isSilent: true});
  expect(loadLocalNFTs).toHaveBeenCalledTimes(2);
  await dispatch(updateNFTDetail({...item, owner: 'recipient'}));
  expect(store.getState().nft.lists[key]!.items).toEqual([]);
  expect(writeNFTListCache).toHaveBeenLastCalledWith(key, {items: [], partial: false});
});
