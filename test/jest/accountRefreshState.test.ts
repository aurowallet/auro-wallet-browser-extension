import accountReducer, { updateCurrentAccount, updateShouldRequest, updateTokenAssets } from "@/reducers/accountReducer";

describe("Get MINA balance readiness", () => {
  it("keeps account-switch loading active when a timer fires with a cached zero balance", () => {
    let state = accountReducer(undefined, updateCurrentAccount({ address: "current" }));
    state = accountReducer(state, updateTokenAssets([], true));
    expect(state.mainTokenNetInfo?.balance.total).toBe("0");
    const refreshed = accountReducer(state, updateShouldRequest(true, true));
    expect(refreshed.shouldRefresh).toBe(true);
    expect(refreshed.isSilentRefresh).toBe(false);
  });

  it("publishes the confirmed zero balance and readiness in one update", () => {
    let state = accountReducer(undefined, updateCurrentAccount({ address: "current" }));
    state = accountReducer(state, updateTokenAssets([], true));
    expect(state.shouldRefresh).toBe(true);
    const loaded = accountReducer(state, updateTokenAssets([], false, true));
    expect(loaded.mainTokenNetInfo?.balance.total).toBe("0");
    expect(loaded.shouldRefresh).toBe(false);
    expect(loaded.isSilentRefresh).toBe(false);
  });

  it("does not treat cache restoration or network reset as a completed balance request", () => {
    const state = accountReducer(undefined, updateCurrentAccount({ address: "current" }));
    expect(accountReducer(state, updateTokenAssets([], true)).shouldRefresh).toBe(true);
    expect(accountReducer(state, updateTokenAssets([])).shouldRefresh).toBe(true);
  });

  it("allows silent refresh after the foreground request has completed", () => {
    let state = accountReducer(undefined, updateCurrentAccount({ address: "current" }));
    state = accountReducer(state, updateShouldRequest(false));
    state = accountReducer(state, updateShouldRequest(true, true));
    expect(state.shouldRefresh).toBe(true);
    expect(state.isSilentRefresh).toBe(true);
  });
});
