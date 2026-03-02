import { LOCK_TIME_DEFAULT } from "../../src/constant";
import { memStore } from "../../src/store";

describe("memStore unlock", () => {
  beforeEach(() => {
    memStore._directSet({
      isUnlocked: false,
      data: null,
      cryptoKey: null,
      vaultSalt: "",
      currentAccount: {},
      mne: "",
      autoLockTime: LOCK_TIME_DEFAULT,
      accountApprovedUrlList: {},
      currentConnect: {},
      tokenBuildList: {},
    });
  });

  it("should keep autoLockTime=0 instead of falling back to default", () => {
    memStore.unlock({ autoLockTime: 0 });
    expect(memStore.getState().autoLockTime).toBe(0);
  });

  it("should fallback to default when autoLockTime is undefined", () => {
    memStore.unlock({});
    expect(memStore.getState().autoLockTime).toBe(LOCK_TIME_DEFAULT);
  });
});
