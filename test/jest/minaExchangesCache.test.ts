import browser from "webextension-polyfill";
import useMinaExchangesCache from "@/hooks/useMinaExchangesCache";
import { useAppDispatch } from "@/hooks/useStore";
import { refreshMinaExchanges } from "@/background/api";
import cacheReducer, { updateMinaExchangesConfig } from "@/reducers/cache";
import { MINA_EXCHANGES_CACHE_KEY } from "@/constant/storageKey";

let mockCleanup: (() => void) | undefined;
jest.mock("react", () => ({ useEffect: (effect: () => (() => void)) => { mockCleanup = effect(); } }));
jest.mock("@/hooks/useStore", () => ({ useAppDispatch: jest.fn() }));
jest.mock("@/background/api", () => ({ refreshMinaExchanges: jest.fn().mockResolvedValue(undefined) }));

const config = (enabled = true) => ({ schemaVersion: 1, enabled, exchanges: [] });
const cache = (enabled = true) => ({ config: config(enabled) });

describe("exchange cache synchronization", () => {
  let reduxState = cacheReducer(undefined, updateMinaExchangesConfig(null));
  const dispatch = jest.fn((action: Parameters<typeof cacheReducer>[1]) => {
    reduxState = cacheReducer(reduxState, action);
  });
  let finishRead: (value: Record<string, unknown>) => void;
  beforeEach(() => {
    mockCleanup = undefined;
    reduxState = cacheReducer(undefined, updateMinaExchangesConfig(null));
    jest.mocked(useAppDispatch).mockReturnValue(dispatch);
    jest.mocked(browser.storage.local.get).mockReturnValue(new Promise(resolve => { finishRead = resolve; }));
  });
  afterEach(() => { mockCleanup?.(); });

  it("loads cache and refreshes even without a wallet background connection", async () => {
    useMinaExchangesCache();
    expect(refreshMinaExchanges).toHaveBeenCalledTimes(1);
    finishRead({ [MINA_EXCHANGES_CACHE_KEY]: cache() });
    await Promise.resolve();
    expect(reduxState.minaExchangesConfig).toEqual(config());
  });

  it("does not restore stale cache after a newer disable response or cache removal", async () => {
    useMinaExchangesCache();
    const changed = jest.mocked(browser.storage.onChanged.addListener).mock.calls[0]![0];
    changed({ [MINA_EXCHANGES_CACHE_KEY]: { newValue: cache(false) } }, "local");
    finishRead({ [MINA_EXCHANGES_CACHE_KEY]: cache() });
    await Promise.resolve();
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(reduxState.minaExchangesConfig).toEqual(config(false));
    changed({ [MINA_EXCHANGES_CACHE_KEY]: { oldValue: cache(false) } }, "local");
    expect(reduxState.minaExchangesConfig).toBeNull();
  });

  it("ignores other storage areas and late initial reads after unmount", async () => {
    useMinaExchangesCache();
    const changed = jest.mocked(browser.storage.onChanged.addListener).mock.calls[0]![0];
    changed({ [MINA_EXCHANGES_CACHE_KEY]: { newValue: cache(false) } }, "sync");
    mockCleanup?.();
    mockCleanup = undefined;
    finishRead({ [MINA_EXCHANGES_CACHE_KEY]: cache() });
    await Promise.resolve();
    expect(dispatch).not.toHaveBeenCalled();
    expect(browser.storage.onChanged.removeListener).toHaveBeenCalledWith(changed);
  });
});
