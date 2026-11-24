import { getAllTokenAssets, getAllTokenInfoV2 } from "@/background/api";
import useFetchAccountData from "@/hooks/useUpdateAccount";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import { saveLocal } from "@/background/localStorage";
import { updateTokenAssets } from "@/reducers/accountReducer";

const mockEffectCleanups: Array<() => void> = [];

jest.mock("react", () => ({
  useCallback: (callback: unknown) => callback,
  useEffect: (effect: () => void | (() => void)) => {
    const cleanup = effect();
    if (cleanup) mockEffectCleanups.push(cleanup);
  },
  useRef: (current: unknown) => ({ current }),
  useState: (value: unknown) => [value, jest.fn()],
}));
jest.mock("@/background/api", () => ({ getAllTokenAssets: jest.fn(), getAllTokenInfoV2: jest.fn() }));
jest.mock("@/background/localStorage", () => ({ getLocal: jest.fn(), getLocalJsonObject: () => ({}), saveLocal: jest.fn() }));
jest.mock("@/hooks/useStore", () => ({ useAppDispatch: jest.fn(), useAppSelector: jest.fn() }));
jest.mock("@/popup/component/Toast", () => ({ info: jest.fn() }));
jest.mock("@/reducers/accountReducer", () => ({
  updateTokenAssets: jest.fn((list) => ({ type: "assets", list })),
  updateShouldRequest: (value: boolean) => ({ type: "refresh", value }),
  updateLocalTokenConfig: jest.fn(),
}));

describe("balance refresh used by Get MINA", () => {
  const dispatch = jest.fn();
  const state = {
    network: { currentNode: { url: "https://node.example/graphql", networkID: "mina:mainnet" } },
    accountInfo: { isSilentRefresh: false },
  };
  beforeEach(() => {
    mockEffectCleanups.length = 0;
    state.accountInfo.isSilentRefresh = false;
    jest.mocked(useAppDispatch).mockReturnValue(dispatch);
    jest.mocked(useAppSelector).mockImplementation((selector) => selector(state as never));
  });

  it("does not turn unknown or previously loaded balances into zero on API errors", async () => {
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      for (const silent of [false, true]) {
        state.accountInfo.isSilentRefresh = silent;
        const { fetchAccountData } = useFetchAccountData({ address: "account" });
        jest.mocked(getAllTokenAssets).mockResolvedValueOnce({ error: "offline" } as never);
        await fetchAccountData();
        jest.mocked(getAllTokenAssets).mockRejectedValueOnce(new Error("offline"));
        await fetchAccountData();
        jest.mocked(getAllTokenAssets).mockResolvedValueOnce({ accounts: [{ tokenId: "1" }] } as never);
        jest.mocked(getAllTokenInfoV2).mockResolvedValueOnce({ error: "offline" } as never);
        await fetchAccountData();
      }
      expect(updateTokenAssets).not.toHaveBeenCalled();
      expect(saveLocal).not.toHaveBeenCalled();
    } finally { log.mockRestore(); }
  });

  it.each(["assets", "metadata"])("ignores a late %s response after leaving the account page", async (phase) => {
    let finish!: (value: unknown) => void;
    const pending = new Promise(resolve => { finish = resolve; });
    if (phase === "assets") {
      jest.mocked(getAllTokenAssets).mockReturnValueOnce(pending as never);
    } else {
      jest.mocked(getAllTokenAssets).mockResolvedValueOnce({ accounts: [{ tokenId: "1" }] } as never);
      jest.mocked(getAllTokenInfoV2).mockReturnValueOnce(pending as never);
    }
    const { fetchAccountData } = useFetchAccountData({ address: "previous" });
    const request = fetchAccountData();
    await Promise.resolve();
    mockEffectCleanups.forEach(cleanup => cleanup());
    finish(phase === "assets" ? { accounts: [] } : {});
    await request;
    expect(dispatch).not.toHaveBeenCalled();
    expect(saveLocal).not.toHaveBeenCalled();
  });

  it("publishes a nonempty response with readiness and caches the same assets", async () => {
    const accounts = [{ tokenId: "1", balance: { total: "1000000000" } }];
    jest.mocked(getAllTokenAssets).mockResolvedValueOnce({ accounts } as never);
    jest.mocked(getAllTokenInfoV2).mockResolvedValueOnce({ "1": null } as never);
    const { fetchAccountData } = useFetchAccountData({ address: "account" });
    await fetchAccountData();
    const assets = [{ ...accounts[0], tokenNetInfo: null }];
    expect(updateTokenAssets).toHaveBeenCalledWith(assets, false, true);
    expect(saveLocal).toHaveBeenCalledWith(expect.any(String), JSON.stringify({ "mina:mainnet": { account: assets } }));
  });

  it.each([false, true])("replaces old balances and cache after a successful empty response (silent=%s)", async (silent) => {
    state.accountInfo.isSilentRefresh = silent;
    jest.mocked(getAllTokenAssets).mockResolvedValueOnce({ accounts: [] } as never);
    const { fetchAccountData } = useFetchAccountData({ address: "account" });
    await fetchAccountData();
    expect(dispatch).toHaveBeenCalledWith({ type: "assets", list: [] });
    expect(updateTokenAssets).toHaveBeenCalledWith([], false, true);
    expect(saveLocal).toHaveBeenCalledWith(expect.any(String), JSON.stringify({ "mina:mainnet": { account: [] } }));
  });
});
