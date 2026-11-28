import axios, {AxiosError, type InternalAxiosRequestConfig} from 'axios';
import {sendParty} from '@/background/api';
import {startFetchMyQuery} from '@/background/request';

jest.mock('@/background/extensionStorage', () => ({
  extGetLocal: jest.fn(async () => ({currentNode: {url: 'https://selected-node.example/graphql'}})),
  extSaveLocal: jest.fn(),
}));
jest.mock('@/utils/browserUtils', () => ({getCurrentNodeConfig: jest.fn()}));
jest.mock('@/utils/utils', () => ({getRealErrorMsg: (value: any) => value?.message || 'node error'}));

const originalAdapter = axios.defaults.adapter;
afterEach(() => {axios.defaults.adapter = originalAdapter;});

it('submits the unchanged zkApp command to the selected node and returns its hash', async () => {
  const command = {feePayer: {authorization: 'wallet-signature'}, accountUpdates: [{authorization: {proof: 'web-proof'}}]};
  const adapter = jest.fn(async (config: InternalAxiosRequestConfig) => ({
    config, status: 200, statusText: 'OK', headers: {},
    data: {data: {sendZkapp: {zkapp: {hash: 'node-hash', id: 'node-id'}}}},
  }));
  axios.defaults.adapter = adapter;
  await expect(sendParty(command)).resolves.toEqual({sendZkapp: {zkapp: {hash: 'node-hash', id: 'node-id'}}});
  expect(adapter).toHaveBeenCalledTimes(1);
  const config = adapter.mock.calls[0]![0];
  expect(config.url).toBe('https://selected-node.example/graphql');
  expect(JSON.parse(config.data).variables.zkappCommandInput).toEqual(command);
});

it('retries the same signed zkApp command after a transient timeout', async () => {
  const command = {feePayer: {authorization: 'signature'}, accountUpdates: []};
  const adapter = jest.fn(async (config: InternalAxiosRequestConfig) => {
    if (adapter.mock.calls.length === 1) throw new AxiosError('timeout', 'ECONNABORTED', config);
    return {config, status: 200, statusText: 'OK', headers: {},
      data: {data: {sendZkapp: {zkapp: {hash: 'node-hash'}}}}};
  });
  axios.defaults.adapter = adapter;
  await expect(sendParty(command)).resolves.toEqual({sendZkapp: {zkapp: {hash: 'node-hash'}}});
  expect(adapter).toHaveBeenCalledTimes(2);
  for (const [config] of adapter.mock.calls) {
    expect(JSON.parse(config.data).variables.zkappCommandInput).toEqual(command);
  }
});

it('returns a GraphQL transaction rejection without retrying', async () => {
  const adapter = jest.fn(async (config: InternalAxiosRequestConfig) => ({
    config, status: 200, statusText: 'OK', headers: {},
    data: {errors: [{message: 'Invalid nonce'}]},
  }));
  axios.defaults.adapter = adapter;
  await expect(sendParty({accountUpdates: []})).resolves.toEqual({error: 'node error'});
  expect(adapter).toHaveBeenCalledTimes(1);
});

it('preserves the existing retry policy for chain queries', async () => {
  const adapter = jest.fn(async (config: InternalAxiosRequestConfig) => ({
    config, status: 200, statusText: 'OK', headers: {}, data: {data: {account: null}},
  }));
  axios.defaults.adapter = adapter;
  await startFetchMyQuery('query { account { nonce } }');
  expect(adapter.mock.calls[0]![0]['axios-retry']?.retries).toBe(3);
});
