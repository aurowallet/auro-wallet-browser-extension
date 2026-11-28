import browser from 'webextension-polyfill';
import {closePopupWindow, lastWindowIds} from '@/utils/popup';

it('consumes a tracked window once when review and completion both close it', async () => {
  lastWindowIds.nftSign_test = 17;
  closePopupWindow('nftSign_test');
  closePopupWindow('nftSign_test');
  await Promise.resolve();
  expect(browser.windows.remove).toHaveBeenCalledTimes(1);
  expect(browser.windows.remove).toHaveBeenCalledWith(17);
  expect(lastWindowIds.nftSign_test).toBeUndefined();
});

it('allows task cleanup after the user has already closed the window', async () => {
  jest.mocked(browser.windows.remove).mockRejectedValueOnce(Error('Window not found'));
  lastWindowIds.nftSign_closed = 18;
  closePopupWindow('nftSign_closed');
  await Promise.resolve();
  expect(lastWindowIds.nftSign_closed).toBeUndefined();
});
