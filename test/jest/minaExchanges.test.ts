import browser from "webextension-polyfill";
import { BASE_INFO_URL } from "../../config";
import { MINA_EXCHANGES_CACHE_KEY } from "@/constant/storageKey";
import { commonFetch } from "@/background/request";

import { refreshMinaExchanges } from "@/background/api";
import {
  getExchangeDescription,
  parseMinaExchangesCache, parseMinaExchangesConfig,
} from "@/utils/minaExchanges";

jest.mock("@/background/request", () => ({ commonFetch: jest.fn() }));

const config = () => ({
  schemaVersion: 1, enabled: true,
  exchanges: [{
    id: "sample", enabled: true, name: "Sample", iconUrl: "/assets/exchanges/sample.svg",
    url: "https://example.com/", description: { en: "Example", zh_CN: "示例" },
  }],
});
const cache = () => ({
  config: config(),
});
describe("exchange configuration validation", () => {
  it("resolves asset paths and falls back across locale variants", () => {
    const parsed = parseMinaExchangesConfig(config())!;
    expect(parsed.exchanges[0]!.iconUrl).toBe(new URL("/assets/exchanges/sample.svg", BASE_INFO_URL).href);
    expect(getExchangeDescription(parsed.exchanges[0]!, "zh-CN")).toBe("示例");
    expect(getExchangeDescription(parsed.exchanges[0]!, "zh")).toBe("示例");
    expect(getExchangeDescription(parsed.exchanges[0]!, "ru")).toBe("Example");
    const exchange = { ...parsed.exchanges[0]!, description: { en: "Example", ru: "Пример" } };
    expect(getExchangeDescription(exchange, "ru-RU")).toBe("Пример");
    expect(getExchangeDescription({ ...exchange, description: {} }, "ru")).toBe("");
  });

  it("rejects missing configuration structure and incompatible schemas", () => {
    for (const value of [null, {}, { ...config(), exchanges: null }, { ...config(), schemaVersion: 2 }]) {
      expect(parseMinaExchangesConfig(value)).toBeNull();
    }
    expect(parseMinaExchangesCache(null)).toBeNull();
    expect(parseMinaExchangesCache({})).toBeNull();
    expect(parseMinaExchangesCache(cache())).toEqual(parseMinaExchangesConfig(config()));
  });

  it("accepts disabled and empty configurations and preserves server array order", () => {
    expect(parseMinaExchangesConfig({ ...config(), enabled: false, exchanges: [] })?.exchanges).toEqual([]);
    const value = config(); value.exchanges.push({ ...value.exchanges[0]!, id: "aaa" });
    expect(parseMinaExchangesConfig(value)?.exchanges.map((entry) => entry.id)).toEqual(["sample", "aaa"]);
  });
});

describe("persistent exchange cache refresh", () => {
  const request = jest.mocked(commonFetch);
  let errorLog: jest.SpyInstance;
  beforeEach(() => {
    errorLog = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.mocked(browser.storage.local.set).mockResolvedValue(undefined);
  });

  afterEach(() => { errorLog.mockRestore(); });

  it("persists valid API results", async () => {
    request.mockResolvedValue(config());
    await refreshMinaExchanges();
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(BASE_INFO_URL + "/v1/config/mina-exchanges");
    const saved = parseMinaExchangesCache(jest.mocked(browser.storage.local.set).mock.calls[0]![0][MINA_EXCHANGES_CACHE_KEY])!;
    expect(saved).toEqual(parseMinaExchangesConfig(config()));
    expect(browser.storage.local.set).toHaveBeenCalledWith({
      [MINA_EXCHANGES_CACHE_KEY]: { config: saved },
    });
  });

  it("preserves old cache on request failures and malformed responses", async () => {
    for (const value of [null, {}, "<html>unavailable</html>"]) {
      request.mockResolvedValueOnce(value);
      await refreshMinaExchanges();
    }
    request.mockRejectedValueOnce(new Error("offline"));
    await refreshMinaExchanges();
    expect(browser.storage.local.set).not.toHaveBeenCalled();
  });

  it("logs errors returned by the shared request wrapper without replacing cache", async () => {
    const error = new Error("network unavailable");
    request.mockResolvedValueOnce({ error });
    await refreshMinaExchanges();
    expect(errorLog).toHaveBeenCalledWith("Failed to refresh MINA exchanges", error);
    expect(browser.storage.local.set).not.toHaveBeenCalled();
  });

  it.each([true, false])("replaces cache with a valid empty list (enabled=%s)", async (enabled) => {
    request.mockResolvedValue({ ...config(), enabled, exchanges: [] });
    await refreshMinaExchanges();
    const saved = parseMinaExchangesCache(jest.mocked(browser.storage.local.set).mock.calls[0]![0][MINA_EXCHANGES_CACHE_KEY])!;
    expect(saved).toMatchObject({ schemaVersion: 1, enabled, exchanges: [] });
  });

  it("logs a storage failure and leaves the previous cache untouched", async () => {
    const error = new Error("storage unavailable");
    request.mockResolvedValue(config());
    jest.mocked(browser.storage.local.set).mockRejectedValueOnce(error);
    await expect(refreshMinaExchanges()).resolves.toBeUndefined();
    expect(errorLog).toHaveBeenCalledWith("Failed to refresh MINA exchanges", error);
    expect(browser.storage.local.remove).not.toHaveBeenCalled();
    expect(browser.storage.local.clear).not.toHaveBeenCalled();
  });
});
