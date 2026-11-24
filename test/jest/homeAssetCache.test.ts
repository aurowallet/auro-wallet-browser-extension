import HomePage from "@/popup/pages/Main";
import { getLocal } from "@/background/localStorage";
import { LOCAL_CACHE_KEYS } from "@/constant/storageKey";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import { updateTokenAssets } from "@/reducers/accountReducer";

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useCallback: (callback: unknown) => callback,
  useEffect: (effect: () => void) => effect(),
}));
jest.mock("@/hooks/useStore", () => ({ useAppDispatch: jest.fn(), useAppSelector: jest.fn() }));
jest.mock("@/background/localStorage", () => ({ getLocal: jest.fn() }));
jest.mock("@/popup/pages/Wallet", () => ({ __esModule: true, default: () => null }));
jest.mock("@/reducers/accountReducer", () => ({
  updateTokenAssets: jest.fn((list, isCache) => ({ type: "assets", list, isCache })),
  updateAccountTxV2: jest.fn(), updateCurrentPrice: jest.fn(),
  updateLocalShowedTokenId: jest.fn(), updateLocalTokenConfig: jest.fn(),
}));
jest.mock("@/reducers/stakingReducer", () => ({
  updateBlockInfo: jest.fn(), updateDaemonStatus: jest.fn(),
  updateDelegationInfo: jest.fn(), updateStakingAPR: jest.fn(), updateStakingList: jest.fn(),
}));
jest.mock("@/utils/utils", () => ({ getTxHistoryCacheKey: () => "history" }));

describe("home balance cache on account switch", () => {
  beforeEach(() => {
    jest.mocked(useAppDispatch).mockReturnValue(jest.fn());
    jest.mocked(useAppSelector).mockImplementation(selector => selector({
      accountInfo: { currentAccount: { address: "current" } },
      network: { currentNode: { networkID: "mina:mainnet" } },
    } as never));
  });

  it.each([
    null, "{", JSON.stringify({}),
    JSON.stringify({ "mina:mainnet": { previous: [] } }),
    JSON.stringify({ "mina:devnet": { current: [] } }),
    JSON.stringify({ "mina:mainnet": { current: {} } }),
  ])("does not create a zero balance from missing or invalid cache (%s)", cache => {
    jest.mocked(getLocal).mockImplementation(key => key === LOCAL_CACHE_KEYS.BASE_TOKEN_ASSETS_V2 ? cache : null);
    HomePage();
    expect(updateTokenAssets).not.toHaveBeenCalled();
  });

  it.each([{ assets: [] }, { assets: [{ tokenId: "1", balance: { total: "1000000000" } }] }])(
    "restores a real cached balance, including a confirmed empty asset list (%j)", ({ assets }) => {
      jest.mocked(getLocal).mockImplementation(key => key === LOCAL_CACHE_KEYS.BASE_TOKEN_ASSETS_V2
        ? JSON.stringify({ "mina:mainnet": { current: assets } }) : null);
      HomePage();
      expect(updateTokenAssets).toHaveBeenCalledWith(assets, true);
      expect(updateTokenAssets).toHaveBeenCalledTimes(1);
    },
  );
});
