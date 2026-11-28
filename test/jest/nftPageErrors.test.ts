import React, {act} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import NFTSend from '@/popup/pages/NFTSend';
import NFTSign from '@/popup/pages/NFTSign';
import TokenSign from '@/popup/pages/Send/SignView';
import {TOKEN_BUILD} from '@/constant/tokenMsgTypes';
import {QA_SIGN_TRANSACTION, WALLET_CHECK_TX_STATUS} from '@/constant/msgTypes';
import Toast from '@/popup/component/Toast';
import {useAppSelector, useAppDispatch} from '@/hooks/useStore';
import {ACCOUNT_TYPE, LEDGER_STATUS} from '@/constant/commonType';
import {loadLocalNFT, nftTransferBlock} from '@/utils/nft';
import {localTransfer, validateWebNFTTransaction, localTransferSigningPayload} from '@/utils/nftTransfer';
import {sendParty} from '@/background/api';
import {sendMsg, sendMsgV2} from '@/utils/commonMsg';
import ledgerManager from '@/utils/ledger';

const mockNavigate = jest.fn();
const mockFeeConfig = {transactionFee: {medium: '0.1'}};
const mockNFT = {network: 'mina:devnet', collectionAddress: 'collection', nftAddress: 'nft'};
jest.mock('react-router-dom', () => ({
  useLocation: () => ({state: {nft: mockNFT}}),
  useNavigate: () => mockNavigate,
  Navigate: () => null,
}));
jest.mock('i18next', () => ({t: (key: string) => key}));
jest.mock('react-i18next', () => ({Trans: () => null}));
jest.mock('styled-components', () => ({
  __esModule: true,
  default: Object.fromEntries(['div', 'section', 'p', 'span'].map(tag => [
    tag, () => ({children}: any) => React.createElement(tag, null, children),
  ])),
}));
jest.mock('@/hooks/useStore', () => ({useAppSelector: jest.fn(), useAppDispatch: jest.fn()}));
jest.mock('@/hooks/useFeeValidation', () => ({useFeeValidation: () => ({feeConfig: mockFeeConfig, validateFee: jest.fn()})}));
jest.mock('@/hooks/useZekoFee', () => ({useZekoFee: () => ({zekoFee: '0.1', feeIntervalTime: 0})}));
jest.mock('@/hooks/TimerContext', () => ({TimerProvider: ({children}: any) => children}));
jest.mock('@/utils/zkUtils', () => ({
  getAccountUpdateCount: () => 3,
  extractTokenTransferInfo: () => ({success: true, data: {sender: 'sender', receiver: 'recipient', amount: '1', memo: ''}}),
}));
jest.mock('@/utils/utils', () => ({
  addressSlice: (value: string) => value,
  trimSpace: (value: unknown) => String(value ?? '').trim(),
  isNaturalNumber: jest.requireActual('@/utils/utils').isNaturalNumber,
  isZekoNet: () => false,
  amountDecimals: jest.requireActual('@/utils/utils').amountDecimals,
  toNonExponential: jest.requireActual('@/utils/utils').toNonExponential,
  getBalanceForUI: (value: string | number) => String(value),
  getRealErrorMsg: (value: any) => value?.message || '',
  addressValid: (value: string) => value === 'recipient',
  isNumber: jest.requireActual('@/utils/utils').isNumber,
}));
jest.mock('@/utils/commonMsg', () => ({sendMsgV2: jest.fn(), sendMsg: jest.fn()}));
jest.mock('@/background/api', () => ({sendParty: jest.fn()}));
jest.mock('@/utils/ledger', () => ({signZkApp: jest.fn(), status: 'READY'}));
jest.mock('@/reducers/nft', () => ({invalidateNFTLists: jest.fn(), updateNFTDetail: jest.fn()}));
jest.mock('@/reducers/ledger', () => ({updateLedgerConnectStatus: jest.fn()}));
jest.mock('@/utils/nft', () => ({
  loadLocalNFT: jest.fn(), nftTransferBlock: jest.fn(), clearNFTListCache: jest.fn(),
}));
jest.mock('@/utils/nftTransfer', () => ({
  localTransfer: {review: jest.fn(), preflight: jest.fn(), prepare: jest.fn(), removeBuild: jest.fn(), cancel: jest.fn()},
  validateWebNFTTransaction: jest.fn(),
  localTransferSigningPayload: jest.fn(),
}));
jest.mock('@/popup/component/Toast', () => ({info: jest.fn()}));
jest.mock('@/popup/component/Button', () => ({
  __esModule: true,
  default: ({children, onClick, disable, loading}: any) => React.createElement('button', {onClick, disabled: disable || loading}, children),
  button_size: {}, button_theme: {},
}));
jest.mock('@/popup/component/CustomView', () => ({children}: any) => React.createElement('main', null, children));
jest.mock('@/popup/component/Input', () => ({value, onChange}: any) => React.createElement('input', {value, onInput: onChange}));
jest.mock('@/popup/pages/NFTSend/RecipientInput', () => ({value, onChange}: any) => React.createElement('input', {value, onInput: onChange, 'data-recipient': true}));
jest.mock('@/popup/component/DAppAdvance', () => () => null);
jest.mock('@/popup/component/NetworkFee', () => ({onAdvanceConfirm, advanceFee, advanceNonce}: any) =>
  React.createElement('input', {value: advanceNonce || '', 'data-nonce': true,
    onInput: (event: any) => onAdvanceConfirm?.(advanceFee || '', event.target.value)}));
jest.mock('@/popup/component/StatusView/NetworkStatusView', () => () => null);
jest.mock('@/popup/component/DappWebsite', () => () => null);
jest.mock('@/popup/pages/NFTSign/CommonRow', () => () => null);
jest.mock('@/popup/component/ConfirmModal', () => ({ConfirmModal: () => null}));
jest.mock('@/popup/component/LedgerInfoModal', () => ({LedgerInfoModal: ({modalVisible}: any) => modalVisible ? React.createElement('div', null, 'ledger-connection') : null}));
jest.mock('@/popup/pages/Send/index.styled', () => {
  const view = ({children}: any) => React.createElement('div', null, children);
  return {StyledContainer: view, StyledContentContainer: view, StyledInputContainer: view, StyledBottomContainer: view};
});
jest.mock('@/popup/pages/Send/SignView/index.styled', () => {
  const view = ({children}: any) => React.createElement('div', null, children);
  return Object.fromEntries(['StyledSectionSign', 'StyledTitleRow', 'StyledTitle', 'StyledTitleRight', 'StyledContent',
    'StyledWebsiteContainer', 'StyledHighFeeTip', 'StyledErrorTip', 'StyledBtnGroup', 'StyledNetworkFeeWrapper', 'StyledAccountRow', 'StyledRowLeft',
    'StyledRowTitle', 'StyledRowContent', 'StyledRowDescContent', 'StyledRowArrow', 'StyledRowRight', 'StyledRightWrapper', 'StyledTypeRow'].map(key => [key, view]));
});

describe('Token and NFT transfer pages', () => {
  let dom: JSDOM, root: Root, container: HTMLDivElement;
  const originalWindow = globalThis.window, originalDocument = globalThis.document;
  const testGlobal = globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT?: boolean};
  const originalAct = testGlobal.IS_REACT_ACT_ENVIRONMENT;
  const originalLocks = navigator.locks;
  const onClose = jest.fn();
  const state = {
    accountInfo: {currentAccount: {address: 'sender', type: ACCOUNT_TYPE.WALLET_INSIDE as string},
      mainTokenNetInfo: {tokenBaseInfo: {showBalance: 100}}, tokenList: [{tokenId: 'token', tokenBaseInfo: {showBalance: 100}}]},
    network: {currentNode: {networkID: 'mina:devnet', url: 'https://node.example'}},
    cache: {popupLockStatus: false},
  };
  const job = {jobId: 'a'.repeat(48), state: 'ready', chain: 'mina:devnet', summary: {sender: 'sender', recipient: 'recipient', fee: '1'}} as any;
  const tokenParams = {id: 'token-build', site: {origin: 'https://builder.example'}, params: {
    buildData: {sender: 'sender', receiver: 'recipient', tokenId: 'token', amount: '1', networkID: 'mina:devnet'},
    result: {accountUpdates: [{authorization: {proof: 'token-proof'}}]},
  }};
  const render = async (page: 'send' | 'sign' | 'token') => {
    if (page === 'token') {
      await act(async () => root.render(React.createElement(TokenSign, {signParams: tokenParams, inferredNonce: '7'})));
      return;
    }
    await act(async () => root.render(page === 'send' ? React.createElement(NFTSend) : React.createElement(NFTSign, {jobId: job.jobId, onClose})));
  };
  const click = async (label: string) => {
    const button = [...container.querySelectorAll('button')].find(button => button.textContent === label);
    expect(button).toBeDefined();
    await act(async () => button!.click());
  };
  const fillRecipient = async (value = 'recipient') => {
    await act(async () => {
      const input = container.querySelector<HTMLInputElement>('[data-recipient]')!;
      input.value = value;
      input.dispatchEvent(new dom.window.Event('input', {bubbles: true}));
    });
  };
  beforeEach(() => {
    jest.resetAllMocks();
    dom = new JSDOM('<!doctype html><body></body>');
    Object.defineProperty(globalThis, 'window', {value: dom.window});
    Object.defineProperty(globalThis, 'document', {value: dom.window.document});
    Object.defineProperty(navigator, 'locks', {configurable: true, value: {request: (_id: string, callback: () => unknown) => callback()}});
    testGlobal.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
    state.accountInfo.currentAccount = {address: 'sender', type: ACCOUNT_TYPE.WALLET_INSIDE};
    state.cache.popupLockStatus = false;
    state.network.currentNode.networkID = 'mina:devnet';
    mockNFT.network = 'mina:devnet';
    mockNFT.nftAddress = 'nft';
    mockNFT.collectionAddress = 'collection';
    state.network.currentNode.url = 'https://node.example';
    job.jobId = 'a'.repeat(48);
    jest.mocked(useAppSelector).mockImplementation(selector => selector(state as never));
    jest.mocked(useAppDispatch).mockReturnValue(jest.fn());
    mockFeeConfig.transactionFee.medium = '0.1';
    jest.mocked(loadLocalNFT).mockResolvedValue(mockNFT as any);
    jest.mocked(localTransfer.preflight).mockResolvedValue(job.summary);
    jest.mocked(localTransfer.prepare).mockResolvedValue(job);
    jest.mocked(localTransfer.review).mockResolvedValue(job);
    jest.mocked(localTransferSigningPayload).mockReturnValue({} as any);
    jest.mocked(sendMsgV2).mockResolvedValue({zkappCommand: {}});
    jest.mocked(sendMsg).mockImplementation((_message, callback) => callback?.({}));
    jest.mocked(localTransfer.removeBuild).mockResolvedValue({removed: true});
    Object.assign(ledgerManager, {status: LEDGER_STATUS.READY});
  });
  afterEach(() => {
    act(() => root.unmount()); dom.window.close();
    Object.defineProperty(globalThis, 'window', {value: originalWindow});
    Object.defineProperty(globalThis, 'document', {value: originalDocument});
    Object.defineProperty(navigator, 'locks', {configurable: true, value: originalLocks});
    if (originalAct === undefined) delete testGlobal.IS_REACT_ACT_ENVIRONMENT;
    else testGlobal.IS_REACT_ACT_ENVIRONMENT = originalAct;
  });

  it('shows the existing address hint without starting a build', async () => {
    await render('send'); await fillRecipient('invalid'); await click('next');
    expect(Toast.info).toHaveBeenCalledWith('sendAddressError');
    expect(localTransfer.prepare).not.toHaveBeenCalled();
  });
  it.each(['fee', 'nonce'])('uses the existing %s hint for invalid input', async field => {
    if (field === 'fee') mockFeeConfig.transactionFee.medium = 'invalid';
    await render('send'); await fillRecipient();
    if (field === 'nonce') {
      await act(async () => {
        const input = container.querySelector<HTMLInputElement>('[data-nonce]')!;
        input.value = '1.5';
        input.dispatchEvent(new dom.window.Event('input', {bubbles: true}));
      });
    }
    await click('next');
    expect(Toast.info).toHaveBeenCalledWith(field === 'fee' ? 'inputFeeError' : 'inputNonceError');
    expect(localTransfer.prepare).not.toHaveBeenCalled();
  });
  it('converts the fee to nanomina and retains an explicit zero nonce', async () => {
    mockFeeConfig.transactionFee.medium = '0.000000001';
    await render('send'); await fillRecipient();
    await act(async () => {
      const input = container.querySelector<HTMLInputElement>('[data-nonce]')!;
      input.value = '0';
      input.dispatchEvent(new dom.window.Event('input', {bubbles: true}));
    });
    await click('next');
    expect(localTransfer.preflight).toHaveBeenCalledWith(
      expect.objectContaining({fee: '1', nonce: '0'}), expect.any(AbortSignal));
  });
  it.each([
    ['NOT_OWNER', 'nftNotOwned'],
    ['TRANSFER_DISABLED', 'nftTransferPermissionDenied'],
    ['APPROVAL_UNSUPPORTED', 'nftTransferPermissionDenied'],
  ])('shows the matching ownership or transfer permission hint for %s', async (code, message) => {
    jest.mocked(nftTransferBlock).mockReturnValue({code});
    await render('send'); await fillRecipient(); await click('next');
    expect(Toast.info).toHaveBeenCalledWith(message);
    expect(localTransfer.preflight).not.toHaveBeenCalled();
    expect(localTransfer.prepare).not.toHaveBeenCalled();
  });
  it('hides preparation internals and allows a later successful attempt', async () => {
    jest.mocked(localTransfer.preflight).mockRejectedValueOnce(Error('NFT packed state internal detail'));
    await render('send'); await fillRecipient(); await click('next');
    expect(Toast.info).toHaveBeenCalledTimes(1);
    expect(Toast.info).toHaveBeenCalledWith('buildFailed');
    expect(container.textContent).not.toContain('internal detail');
    await click('next'); expect(localTransfer.prepare).toHaveBeenCalledTimes(1);
  });
  it('keeps an unavailable review open with confirmation disabled and the existing cancel action', async () => {
    jest.mocked(localTransfer.review).mockRejectedValue(Error('JOB_NOT_FOUND: storage details'));
    await render('sign');
    expect(Toast.info).toHaveBeenCalledWith('buildFailed');
    expect(onClose).not.toHaveBeenCalled();
    expect(container.textContent).not.toContain('loading');
    expect([...container.querySelectorAll('button')].find(button => button.textContent === 'confirm')!.disabled).toBe(true);
    await click('cancel');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(localTransfer.cancel).not.toHaveBeenCalled();
  });
  it('does not display a stale review error after the account changes', async () => {
    let reject!: (error: Error) => void;
    jest.mocked(localTransfer.review).mockReturnValueOnce(new Promise((_resolve, fail) => {reject = fail;}));
    await render('sign');
    state.accountInfo.currentAccount.address = 'other'; await render('sign');
    await act(async () => reject(Error('old account failure')));
    expect(Toast.info).not.toHaveBeenCalled(); expect(onClose).not.toHaveBeenCalled();
  });
  it('keeps failed transaction validation from reaching signing or broadcast', async () => {
    jest.mocked(validateWebNFTTransaction).mockRejectedValue(Error('Unexpected NFT permission change'));
    await render('sign'); await click('confirm');
    expect(Toast.info).toHaveBeenCalledWith('buildFailed');
    expect(sendMsgV2).not.toHaveBeenCalled(); expect(sendParty).not.toHaveBeenCalled();
  });
  it('uses the existing Ledger rejection hint without broadcasting', async () => {
    state.accountInfo.currentAccount.type = ACCOUNT_TYPE.WALLET_LEDGER;
    jest.mocked(ledgerManager.signZkApp).mockResolvedValue({rejected: true} as any);
    await render('sign'); await click('confirm');
    expect(Toast.info).toHaveBeenCalledWith('ledgerRejected'); expect(sendParty).not.toHaveBeenCalled();
  });
  it('opens the existing Ledger connection dialog for a disconnected device', async () => {
    state.accountInfo.currentAccount.type = ACCOUNT_TYPE.WALLET_LEDGER;
    Object.assign(ledgerManager, {status: LEDGER_STATUS.LEDGER_DISCONNECT});
    jest.mocked(ledgerManager.signZkApp).mockResolvedValue({error: {message: 'transport details'}} as any);
    await render('sign'); await click('confirm');
    expect(container.textContent).toContain('ledger-connection');
    expect(Toast.info).not.toHaveBeenCalled(); expect(sendParty).not.toHaveBeenCalled();
  });
  it.each(['response', 'exception'])('uses the existing buttons and broadcast toast without resending (%s)', async mode => {
    if (mode === 'response') jest.mocked(sendParty).mockResolvedValue({error: 'node unavailable'});
    else jest.mocked(sendParty).mockRejectedValue(Error('backend details'));
    await render('sign'); await click('confirm');
    expect(container.textContent).not.toContain('nftSubmissionUnknown');
    expect(container.textContent).not.toContain('transaction-hash');
    expect([...container.querySelectorAll('button')].map(button => button.textContent)).toEqual(['cancel', 'confirm']);
    expect([...container.querySelectorAll('button')].find(button => button.textContent === 'confirm')!.disabled).toBe(true);
    await click('confirm');
    expect(sendParty).toHaveBeenCalledTimes(1); expect(onClose).not.toHaveBeenCalled();
    expect(Toast.info).toHaveBeenCalledTimes(1);
    expect(Toast.info).toHaveBeenCalledWith('postFailed');
    await click('cancel'); expect(onClose).toHaveBeenCalledTimes(1);
    expect(localTransfer.cancel).not.toHaveBeenCalled();
  });
  it('ignores a signing error returned after cancellation', async () => {
    let finish!: (result: unknown) => void;
    jest.mocked(sendMsgV2).mockReturnValueOnce(new Promise(resolve => {finish = resolve;}));
    await render('sign'); await click('confirm'); await click('cancel');
    await act(async () => finish({error: 'late signing failure'}));
    expect(Toast.info).not.toHaveBeenCalled(); expect(sendParty).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it('does not offer signing for an observation account', async () => {
    state.accountInfo.currentAccount.type = ACCOUNT_TYPE.WALLET_WATCH;
    await render('sign');
    expect(onClose).toHaveBeenCalledTimes(1); expect(Toast.info).not.toHaveBeenCalled();
    expect(localTransfer.review).not.toHaveBeenCalled();
  });
  it.each(['mina:mainnet', 'mina:devnet'])('prepares using the NFT network (%s)', async network => {
    state.network.currentNode.networkID = network;
    mockNFT.network = network;
    await render('send'); await fillRecipient(); await click('next');
    expect(localTransfer.preflight).toHaveBeenCalledWith(expect.objectContaining({chain: network}), expect.any(AbortSignal));
    expect(localTransfer.prepare).toHaveBeenCalledTimes(1);
  });
  it('does not build for an observation account', async () => {
    state.accountInfo.currentAccount.type = ACCOUNT_TYPE.WALLET_WATCH;
    await render('send'); await fillRecipient(); await click('next');
    expect(localTransfer.preflight).not.toHaveBeenCalled();
    expect(localTransfer.prepare).not.toHaveBeenCalled();
  });
  it('uses the normal signing path without a separate software account allowlist', async () => {
    state.accountInfo.currentAccount.type = 'software-account';
    state.network.currentNode.networkID = 'mina:mainnet';
    jest.mocked(sendParty).mockResolvedValue({sendZkapp: {zkapp: {hash: 'transaction-hash'}}});
    await render('sign'); await click('confirm');
    expect(sendMsgV2).toHaveBeenCalledTimes(1);
    expect(sendParty).toHaveBeenCalledTimes(1);
  });
  it('ignores a signing result after the popup is unmounted for locking', async () => {
    let finish!: (result: unknown) => void;
    jest.mocked(sendMsgV2).mockReturnValueOnce(new Promise(resolve => {finish = resolve;}));
    await render('sign'); await click('confirm');
    await act(async () => root.render(null));
    await act(async () => finish({error: 'late signing failure'}));
    expect(sendParty).not.toHaveBeenCalled();
    expect(Toast.info).not.toHaveBeenCalled();
  });
  it('closes a successful submission without an error prompt', async () => {
    jest.mocked(sendParty).mockResolvedValue({sendZkapp: {zkapp: {hash: 'transaction-hash'}}});
    await render('sign'); await click('confirm');
    expect(onClose).toHaveBeenCalledTimes(1); expect(Toast.info).not.toHaveBeenCalled();
    expect(container.textContent).not.toContain('nftSubmissionUnknown');
  });
  it.each(['account', 'node', 'network', 'nft', 'lock'])(
    'resets the send form and ignores an old asset response after changing %s', async change => {
      let finish!: (value: any) => void;
      jest.mocked(loadLocalNFT).mockReturnValueOnce(new Promise(resolve => {finish = resolve;}));
      await render('send'); await fillRecipient(); await click('next');
      const signal = jest.mocked(loadLocalNFT).mock.calls[0][2]!;
      if (change === 'account') state.accountInfo.currentAccount.address = 'other';
      if (change === 'node') state.network.currentNode.url = 'https://other-node.example';
      if (change === 'network') {state.network.currentNode.networkID = 'mina:mainnet'; mockNFT.network = 'mina:mainnet';}
      if (change === 'nft') mockNFT.nftAddress = 'other-nft';
      if (change === 'lock') state.cache.popupLockStatus = true;
      await render('send');
      expect(signal.aborted).toBe(true);
      expect(container.querySelector<HTMLInputElement>('[data-recipient]')!.value).toBe('');
      await act(async () => finish(mockNFT));
      expect(localTransfer.preflight).not.toHaveBeenCalled();
      expect(localTransfer.prepare).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(Toast.info).not.toHaveBeenCalled();
    },
  );

  it('keeps form input on an ordinary rerender', async () => {
    await render('send'); await fillRecipient(); await render('send');
    expect(container.querySelector<HTMLInputElement>('[data-recipient]')!.value).toBe('recipient');
    expect(container.textContent).not.toContain('loading');
  });

  it.each(['account', 'node', 'job', 'lock'])(
    'does not broadcast a late signature after changing %s', async change => {
      let finish!: (value: unknown) => void;
      jest.mocked(sendMsgV2).mockReturnValueOnce(new Promise(resolve => {finish = resolve;}));
      await render('sign'); await click('confirm');
      const signal = jest.mocked(localTransfer.review).mock.calls[1][1]!;
      if (change === 'account') state.accountInfo.currentAccount.address = 'other';
      if (change === 'node') state.network.currentNode.url = 'https://other-node.example';
      if (change === 'job') job.jobId = 'next-job';
      if (change === 'lock') state.cache.popupLockStatus = true;
      await render('sign');
      expect(signal.aborted).toBe(true);
      await act(async () => finish({}));
      expect(localTransfer.removeBuild).not.toHaveBeenCalled();
      expect(sendParty).not.toHaveBeenCalled();
      expect(Toast.info).not.toHaveBeenCalled();
    },
  );

  it('aborts a pending cancellation when the confirmation page unmounts', async () => {
    let finish!: (value: any) => void;
    jest.mocked(localTransfer.cancel).mockReturnValueOnce(new Promise(resolve => {finish = resolve;}));
    await render('sign'); await click('cancel');
    const signal = jest.mocked(localTransfer.cancel).mock.calls[0][2]!;
    await act(async () => root.render(null));
    expect(signal.aborted).toBe(true);
    await act(async () => finish(undefined));
    expect(onClose).not.toHaveBeenCalled();
    expect(Toast.info).not.toHaveBeenCalled();
  });

  it.each([ACCOUNT_TYPE.WALLET_INSIDE, ACCOUNT_TYPE.WALLET_LEDGER])(
    'submits a Token transfer through the shared signer and broadcaster (%s)', async type => {
      state.accountInfo.currentAccount.type = type;
      const command = {feePayer: {authorization: 'wallet-signature'}, accountUpdates: [{authorization: {proof: 'token-proof'}}]};
      jest.mocked(sendMsgV2).mockResolvedValue({zkappCommand: command});
      jest.mocked(ledgerManager.signZkApp).mockResolvedValue({signedZkApp: {data: {zkappCommand: command}}} as any);
      jest.mocked(sendParty).mockResolvedValue({sendZkapp: {zkapp: {id: 'tx-id', hash: 'node-hash'}}});
      await render('token'); await click('confirm');
      if (type === ACCOUNT_TYPE.WALLET_INSIDE) {
        expect(sendMsgV2).toHaveBeenCalledWith(expect.objectContaining({action: QA_SIGN_TRANSACTION,
          payload: expect.objectContaining({zkOnlySign: true, fromAddress: 'sender', nonce: '7'})}));
        expect(ledgerManager.signZkApp).not.toHaveBeenCalled();
      } else {
        expect(ledgerManager.signZkApp).toHaveBeenCalledWith(expect.objectContaining({fromAddress: 'sender', nonce: '7'}), 0, expect.any(Function));
        expect(sendMsgV2).not.toHaveBeenCalled();
      }
      expect(sendParty).toHaveBeenCalledTimes(1);
      expect(sendParty).toHaveBeenCalledWith(command);
      expect(sendMsg).toHaveBeenCalledWith({action: WALLET_CHECK_TX_STATUS,
        payload: {paymentId: 'tx-id', hash: 'node-hash', type: 'ZKAPP_TX'}});
      expect(sendMsg).toHaveBeenCalledWith({action: TOKEN_BUILD.requestSign,
        payload: {id: 'token-build', resultOrigin: 'https://builder.example', hash: 'node-hash'}}, expect.any(Function));
      expect(validateWebNFTTransaction).not.toHaveBeenCalled();
      expect(localTransfer.removeBuild).not.toHaveBeenCalled();
      expect(Toast.info).not.toHaveBeenCalled();
    },
  );

  it('does not broadcast a Token transfer when signing fails', async () => {
    jest.mocked(sendMsgV2).mockResolvedValue({error: {message: 'signing failed'}});
    await render('token'); await click('confirm');
    expect(sendParty).not.toHaveBeenCalled();
    expect(Toast.info).toHaveBeenCalledWith('signing failed');
  });

  it('does not report Token success when the node returns no hash', async () => {
    jest.mocked(sendParty).mockResolvedValue({});
    await render('token'); await click('confirm');
    expect(Toast.info).toHaveBeenCalledWith('postFailed');
    expect(sendMsg).not.toHaveBeenCalled();
  });

  it('sends the NFT signed command through the same broadcaster and removes its build first', async () => {
    const command = {accountUpdates: [{authorization: {proof: 'nft-proof'}}]};
    jest.mocked(sendMsgV2).mockResolvedValue({zkappCommand: command});
    jest.mocked(sendParty).mockImplementation(async () => {
      expect(localTransfer.removeBuild).toHaveBeenCalledTimes(1);
      return {sendZkapp: {zkapp: {hash: 'node-hash'}}};
    });
    await render('sign'); await click('confirm');
    expect(sendParty).toHaveBeenCalledWith(command);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

});
