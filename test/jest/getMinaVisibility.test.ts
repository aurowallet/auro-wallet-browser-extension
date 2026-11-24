import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { JSDOM } from "jsdom";
import GetMina from "@/popup/pages/Wallet/component/GetMina";
import { useAppSelector } from "@/hooks/useStore";
import { openTab } from "@/utils/commonMsg";

jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }) }));
jest.mock("@/hooks/useStore", () => ({ useAppSelector: jest.fn() }));
jest.mock("@/utils/commonMsg", () => ({ openTab: jest.fn() }));
jest.mock("styled-components", () => ({
  __esModule: true,
  default: { button: () => "button", img: () => "img", span: () => "span" },
}));
jest.mock("@/popup/component/FooterPopup", () => ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) =>
  React.createElement("section", null, React.createElement("button", { "data-close": true, onClick: onClose }, "Close"), children));

const exchange = { id: "test", enabled: true, name: "Exchange", url: "https://example.com/", iconUrl: "https://example.com/icon.svg", description: { en: "Description" } };

describe("Get MINA display lifetime", () => {
  let dom: JSDOM;
  let root: Root;
  let container: HTMLDivElement;
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const testGlobal = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const originalActEnvironment = testGlobal.IS_REACT_ACT_ENVIRONMENT;
  const state = {
    network: { currentNode: { networkID: "mina:mainnet", url: "node" } },
    accountInfo: {
      currentAccount: { address: "current" },
      mainTokenNetInfo: { balance: { total: "0" } },
      shouldRefresh: true, isSilentRefresh: false,
    },
    cache: { minaExchangesConfig: { enabled: true, exchanges: [exchange] } },
  };
  const render = () => act(() => { root.render(React.createElement(GetMina)); });
  const buttons = () => container.querySelectorAll<HTMLButtonElement>("button:not([data-close])");
  const click = (index: number) => act(() => { buttons()[index]!.click(); });

  beforeEach(() => {
    dom = new JSDOM("<!doctype html><body></body>");
    Object.defineProperty(globalThis, "window", { value: dom.window });
    Object.defineProperty(globalThis, "document", { value: dom.window.document });
    testGlobal.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    state.network.currentNode = { networkID: "mina:mainnet", url: "node" };
    state.accountInfo.currentAccount.address = "current";
    state.cache.minaExchangesConfig = { enabled: true, exchanges: [exchange] };
    state.accountInfo.shouldRefresh = true;
    state.accountInfo.isSilentRefresh = false;
    state.accountInfo.mainTokenNetInfo.balance.total = "0";
    jest.mocked(useAppSelector).mockImplementation(selector => selector(state as never));
  });
  afterEach(() => {
    try {
      act(() => root.unmount());
    } finally {
      dom.window.close();
      Object.defineProperty(globalThis, "window", { value: originalWindow });
      Object.defineProperty(globalThis, "document", { value: originalDocument });
      if (originalActEnvironment === undefined) delete testGlobal.IS_REACT_ACT_ENVIRONMENT;
      else testGlobal.IS_REACT_ACT_ENVIRONMENT = originalActEnvironment;
    }
  });

  it("waits for the balance and does not show for a funded account", () => {
    render(); expect(buttons()).toHaveLength(0);
    state.accountInfo.mainTokenNetInfo.balance.total = "1000000000";
    state.accountInfo.shouldRefresh = false;
    render(); expect(buttons()).toHaveLength(0);
  });

  it.each(["mina:devnet", "zeko:mainnet"])("does not initially display on %s", networkID => {
    state.accountInfo.shouldRefresh = false;
    state.network.currentNode.networkID = networkID;
    render(); expect(buttons()).toHaveLength(0);
  });

  it("appears when configuration becomes available after balance loading", () => {
    state.accountInfo.shouldRefresh = false;
    state.cache.minaExchangesConfig.enabled = false;
    render(); expect(buttons()).toHaveLength(0);
    state.cache.minaExchangesConfig = { enabled: true, exchanges: [] };
    render(); expect(buttons()).toHaveLength(0);
    state.cache.minaExchangesConfig.exchanges = [{ ...exchange, enabled: false }];
    render(); expect(buttons()).toHaveLength(0);
    state.cache.minaExchangesConfig.exchanges = [exchange];
    render(); expect(buttons()).toHaveLength(1);
  });

  it("keeps an open list, images and links working when remote config is disabled or replaced", () => {
    state.accountInfo.shouldRefresh = false;
    render(); click(0);
    expect(buttons()).toHaveLength(2);
    state.cache.minaExchangesConfig = { enabled: false, exchanges: [] };
    render();
    expect(buttons()).toHaveLength(2);
    expect(container.querySelector('img[src="https://example.com/icon.svg"]')).not.toBeNull();
    click(1); expect(openTab).toHaveBeenLastCalledWith(exchange.url);
    state.cache.minaExchangesConfig = { enabled: true, exchanges: [{ ...exchange, url: "https://changed.example/" }] };
    render(); click(1);
    expect(openTab).toHaveBeenLastCalledWith(exchange.url);
  });

  it("retains the displayed list when an enabled config is emptied, including after reopening the popup", () => {
    state.accountInfo.shouldRefresh = false;
    render(); click(0);
    state.cache.minaExchangesConfig = { enabled: true, exchanges: [] };
    render(); expect(buttons()).toHaveLength(2);
    act(() => {
      container.querySelector<HTMLButtonElement>("[data-close]")!.click();
    });
    expect(buttons()).toHaveLength(1);
    click(0); click(1);
    expect(openTab).toHaveBeenLastCalledWith(exchange.url);
  });

  it.each(["account", "network", "node"])("resets the displayed list when %s changes", context => {
    state.accountInfo.shouldRefresh = false;
    render(); click(0);
    state.cache.minaExchangesConfig = { enabled: false, exchanges: [] };
    if (context === "account") state.accountInfo.currentAccount.address = "other";
    if (context === "network") state.network.currentNode.networkID = "mina:devnet";
    if (context === "node") state.network.currentNode.url = "other-node";
    render(); expect(buttons()).toHaveLength(0);
    state.network.currentNode.networkID = "mina:mainnet";
    state.cache.minaExchangesConfig = { enabled: true, exchanges: [exchange] };
    render(); expect(buttons()).toHaveLength(1);
  });

  it("keeps a displayed entry during later balance changes and refreshes", () => {
    state.accountInfo.shouldRefresh = false;
    render(); expect(buttons()).toHaveLength(1);
    state.accountInfo.shouldRefresh = true;
    state.accountInfo.isSilentRefresh = true;
    state.accountInfo.mainTokenNetInfo.balance.total = "1000000000";
    render(); expect(buttons()).toHaveLength(1);
  });
});
