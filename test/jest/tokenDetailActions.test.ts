import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { JSDOM } from "jsdom";
import TokenDetail from "@/popup/pages/TokenDetail";
import { useAppSelector } from "@/hooks/useStore";
import { useNavigate } from "react-router-dom";
import { openTab } from "@/utils/commonMsg";
import { ACCOUNT_TYPE } from "@/constant/commonType";

jest.mock("i18next", () => ({ __esModule: true, default: { t: (key: string) => key } }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }) }));
jest.mock("react-router-dom", () => ({ useNavigate: jest.fn() }));
jest.mock("@/hooks/useStore", () => ({ useAppSelector: jest.fn(), useAppDispatch: () => jest.fn() }));
jest.mock("@/hooks/useUpdateAccount", () => ({ __esModule: true, default: () => ({ fetchAccountData: jest.fn() }) }));
jest.mock("@/background/api", () => ({
  getAllTxHistory: jest.fn().mockResolvedValue({}),
  getPendingTxList: jest.fn().mockResolvedValue({}),
  getZkAppPendingTx: jest.fn().mockResolvedValue({}),
}));
jest.mock("@/background/localStorage", () => ({ getLocal: jest.fn(), saveLocal: jest.fn() }));
jest.mock("@/reducers/accountReducer", () => ({ updateAccountTxV2: jest.fn(), updateShouldRequest: jest.fn() }));
jest.mock("@/utils/commonMsg", () => ({ openTab: jest.fn() }));
jest.mock("styled-components", () => ({
  __esModule: true,
  default: {
    div: () => ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => React.createElement("div", { onClick }, children),
    button: () => "button", img: () => "img", span: () => "span",
  },
  css: () => "",
}));
jest.mock("@/utils/utils", () => ({
  addressSlice: (value: string) => value,
  getAmountForUI: (value: string) => value,
  getBalanceForUI: (value: string) => value,
  getTxHistoryCacheKey: jest.fn(),
  isZekoNet: (network: string) => network.startsWith("zeko"),
}));
jest.mock("@/popup/component/Clock", () => () => null);
jest.mock("@/popup/component/CustomViewV2", () => ({ children }: { children: React.ReactNode }) => children);
jest.mock("@/popup/pages/Wallet/component/TokenIcon", () => () => null);
jest.mock("@/popup/pages/Wallet/component/TxListView", () => () => null);
jest.mock("@/popup/pages/Wallet/component/StatusView", () => ({
  EmptyTxListView: () => null, HistoryHeader: () => null,
  LoadingView: () => null, TxNotSupportView: () => null,
}));
jest.mock("@/popup/component/FooterPopup", () => ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) =>
  React.createElement("section", null, React.createElement("button", { onClick: onClose }, "Close"), children));

const exchange = { id: "test", enabled: true, name: "Exchange", url: "https://example.com/", iconUrl: "https://example.com/icon.svg", description: { en: "Description" } };
const makeState = () => ({
  network: { currentNode: { networkID: "mina:mainnet", url: "node", gqlTxUrl: "history" } },
  accountInfo: {
    currentAccount: { address: "current", type: "WALLET_INSIDE" },
    tokenList: [], txHistoryMap: {}, shouldRefresh: false, isSilentRefresh: false,
    mainTokenNetInfo: { balance: { total: "0" } },
  },
  cache: {
    nextTokenDetail: { tokenId: "1", tokenBaseInfo: { isMainToken: true, showBalance: "0" } },
    minaExchangesConfig: { enabled: true, exchanges: [exchange] },
  },
  currencyConfig: { currentCurrency: { symbol: "$" } },
});

describe("Token detail actions", () => {
  let dom: JSDOM;
  let root: Root;
  let container: HTMLDivElement;
  let state: ReturnType<typeof makeState>;
  const navigate = jest.fn();
  const globals = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const originals = { window: globalThis.window, document: globalThis.document, sessionStorage: globalThis.sessionStorage, act: globals.IS_REACT_ACT_ENVIRONMENT };
  const render = async () => { await act(async () => { root.render(React.createElement(TokenDetail)); }); };
  const label = (text: string) => Array.from(container.querySelectorAll("div, button")).find(node => node.textContent === text && node.children.length === 0) as HTMLElement | undefined;
  const click = async (text: string) => { await act(async () => { label(text)!.click(); }); };

  beforeEach(() => {
    dom = new JSDOM("<!doctype html><body></body>", { url: "https://wallet.example" });
    Object.defineProperty(globalThis, "window", { value: dom.window });
    Object.defineProperty(globalThis, "document", { value: dom.window.document });
    Object.defineProperty(globalThis, "sessionStorage", { value: dom.window.sessionStorage, configurable: true });
    globals.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    state = makeState();
    jest.mocked(useAppSelector).mockImplementation(selector => selector(state as never));
    jest.mocked(useNavigate).mockReturnValue(navigate);
  });
  afterEach(() => {
    act(() => root.unmount());
    dom.window.close();
    Object.defineProperty(globalThis, "window", { value: originals.window });
    Object.defineProperty(globalThis, "document", { value: originals.document });
    Object.defineProperty(globalThis, "sessionStorage", { value: originals.sessionStorage });
    if (originals.act === undefined) delete globals.IS_REACT_ACT_ENVIRONMENT;
    else globals.IS_REACT_ACT_ENVIRONMENT = originals.act;
  });

  it.each(Object.values(ACCOUNT_TYPE))("shows Buy and Earn for funded %s accounts", async type => {
    state.accountInfo.currentAccount.type = type;
    state.accountInfo.mainTokenNetInfo.balance.total = "200000000000";
    state.cache.nextTokenDetail.tokenBaseInfo.showBalance = "200";
    await render();
    expect(label("buy")).toBeDefined();
    expect(label("earn")).toBeDefined();
  });

  it.each([
    ["mina:mainnet", true, true], ["mina:devnet", false, true],
    ["mina:custom", false, true], ["zeko:mainnet", false, false], ["zeko:testnet", false, false],
  ])("gates actions on %s", async (network, buy, earn) => {
    state.network.currentNode.networkID = network as string;
    await render();
    expect(!!label("buy")).toBe(buy);
    expect(!!label("earn")).toBe(earn);
    expect(label("send")).toBeDefined();
    expect(label("receive")).toBeDefined();
  });

  it("keeps only Send and Receive for a fungible token", async () => {
    state.cache.nextTokenDetail.tokenBaseInfo.isMainToken = false;
    await render();
    expect(label("buy")).toBeUndefined();
    expect(label("earn")).toBeUndefined();
    await click("send");
    expect(navigate).toHaveBeenLastCalledWith("/send_page", { state: { isFromTokenPage: true, isFungibleToken: true } });
    await click("receive");
    expect(navigate).toHaveBeenLastCalledWith("/receive_page", { state: { isFromTokenPage: true, isFungibleToken: true } });
  });

  it("opens exchanges from Buy and the staking home from Earn", async () => {
    await render();
    await click("buy");
    expect(container.querySelector("section")).not.toBeNull();
    expect(navigate).not.toHaveBeenCalled();
    await act(async () => { container.querySelectorAll("section button")[1]!.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })); });
    expect(openTab).toHaveBeenCalledWith(exchange.url);
    await click("Close");
    expect(container.querySelector("section")).toBeNull();
    await click("earn");
    expect(navigate).toHaveBeenLastCalledWith("/staking", { state: { isFromTokenPage: true, isFungibleToken: false } });
    expect(sessionStorage.getItem("staking_origin")).toBe("token_detail");
  });

  it.each(["account", "network", "node", "token"])("closes the exchange popup when %s changes", async context => {
    await render();
    await click("buy");
    if (context === "account") state.accountInfo.currentAccount.address = "other";
    if (context === "network") state.network.currentNode.networkID = "mina:devnet";
    if (context === "node") state.network.currentNode.url = "other-node";
    if (context === "token") state.cache.nextTokenDetail = { tokenId: "custom", tokenBaseInfo: { isMainToken: false, showBalance: "0" } };
    await render();
    expect(container.querySelector("section")).toBeNull();
  });

  it.each(["disabled", "empty", "disabled-exchange"])("hides Buy for %s configuration while retaining Earn", async config => {
    if (config === "disabled") state.cache.minaExchangesConfig.enabled = false;
    if (config === "empty") state.cache.minaExchangesConfig.exchanges = [];
    if (config === "disabled-exchange") state.cache.minaExchangesConfig.exchanges = [{ ...exchange, enabled: false }];
    await render();
    expect(label("buy")).toBeUndefined();
    expect(label("earn")).toBeDefined();
  });

  it("closes an unavailable exchange list without reopening it when configuration returns", async () => {
    await render();
    await click("buy");
    state.cache.minaExchangesConfig.enabled = false;
    await render();
    expect(container.querySelector("section")).toBeNull();
    state.cache.minaExchangesConfig.enabled = true;
    await render();
    expect(label("buy")).toBeDefined();
    expect(container.querySelector("section")).toBeNull();
  });
});
