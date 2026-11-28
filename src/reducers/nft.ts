import type { ILocalNFTItem } from "@/utils/nft";

export interface INFTListEntry {
  items: ILocalNFTItem[];
  partial: boolean;
  loaded: boolean;
  status: "idle" | "loading" | "ready" | "error";
  revision: number;
  stale: boolean;
  requestId?: string;
}
export interface INFTState {
  lists: Record<string, INFTListEntry>;
}
export const nftListKey = (network: string, account: string) =>
  JSON.stringify([network, account]);
const emptyEntry = (): INFTListEntry => ({
  items: [],
  partial: false,
  loaded: false,
  status: "idle",
  revision: 0,
  stale: false,
});
export const initNFTList = (network: string, owner: string) => ({
  type: "INIT_NFT_LIST" as const,
  key: nftListKey(network, owner),
});
export const startNFTListLoad = (key: string, requestId: string) => ({
  type: "START_NFT_LIST_LOAD" as const,
  key,
  requestId,
});
export const restoreNFTList = (
  key: string,
  data: { items: ILocalNFTItem[]; partial: boolean },
) => ({ type: "RESTORE_NFT_LIST" as const, key, data });
export const updateNFTList = (
  key: string,
  requestId: string,
  data: { items: ILocalNFTItem[]; partial: boolean },
) => ({ type: "UPDATE_NFT_LIST" as const, key, requestId, data });
export const setNFTListError = (key: string, requestId: string) => ({
  type: "SET_NFT_LIST_ERROR" as const,
  key,
  requestId,
});
export const updateNFTDetail = (nft: ILocalNFTItem) => ({
  type: "UPDATE_NFT_DETAIL" as const,
  nft,
});
export const invalidateNFTLists = (network: string) => ({
  type: "INVALIDATE_NFT_LISTS" as const,
  network,
});
type Action =
  | ReturnType<
      | typeof restoreNFTList
      | typeof startNFTListLoad
      | typeof updateNFTList
      | typeof setNFTListError
      | typeof initNFTList
      | typeof updateNFTDetail
      | typeof invalidateNFTLists
    >
  | {
      type: "UPDATE_NET_HOME_REFRESH";
      shouldRefresh: boolean;
      isSilent?: boolean;
    }
  | { type: "UPDATE_CURRENT_NODE" };

export default function nftReducer(
  state: INFTState = { lists: {} },
  action: Action,
): INFTState {
  switch (action.type) {
    case "INIT_NFT_LIST":
      return state.lists[action.key]
        ? state
        : { lists: { ...state.lists, [action.key]: emptyEntry() } };
    case "RESTORE_NFT_LIST": {
      const entry = state.lists[action.key];
      if (entry?.loaded) return state;
      return {
        lists: {
          ...state.lists,
          [action.key]: {
            ...emptyEntry(),
            ...entry,
            ...action.data,
            loaded: true,
            stale: true,
            status: entry?.requestId ? "loading" : "ready",
          },
        },
      };
    }
    case "UPDATE_CURRENT_NODE":
    case "UPDATE_NET_HOME_REFRESH":
      if (action.type === "UPDATE_NET_HOME_REFRESH" && !action.shouldRefresh)
        return state;
      return {
        lists: Object.fromEntries(
          Object.entries(state.lists).map(([key, entry]) => [
            key,
            action.type === "UPDATE_NET_HOME_REFRESH" &&
            action.isSilent &&
            entry.status === "loading"
              ? entry
              : {
                  ...entry,
                  stale: true,
                  revision: entry.revision + 1,
                  requestId: undefined,
                  status: entry.loaded ? "ready" : "idle",
                },
          ]),
        ),
      };
    case "START_NFT_LIST_LOAD": {
      const entry = state.lists[action.key] || emptyEntry();
      return {
        lists: {
          ...state.lists,
          [action.key]: {
            ...entry,
            status: "loading",
            requestId: action.requestId,
          },
        },
      };
    }
    case "UPDATE_NFT_LIST":
    case "SET_NFT_LIST_ERROR": {
      const entry = state.lists[action.key];
      if (!entry || entry.requestId !== action.requestId) return state;
      const next: INFTListEntry =
        action.type === "UPDATE_NFT_LIST"
          ? {
              ...entry,
              ...action.data,
              items: action.data.items.filter(
                (item) => nftListKey(item.network, item.owner) === action.key,
              ),
              loaded: true,
              status: "ready",
              stale: false,
              requestId: undefined,
            }
          : { ...entry, requestId: undefined, stale: false, status: "error" };
      return { lists: { ...state.lists, [action.key]: next } };
    }
    case "UPDATE_NFT_DETAIL":
      return {
        lists: Object.fromEntries(
          Object.entries(state.lists).map(([key, entry]) => [
            key,
            {
              ...entry,
              items: entry.items
                .map((item) =>
                  item.network === action.nft.network &&
                  item.id === action.nft.id
                    ? action.nft
                    : item,
                )
                .filter((item) => nftListKey(item.network, item.owner) === key),
            },
          ]),
        ),
      };
    case "INVALIDATE_NFT_LISTS":
      return {
        lists: Object.fromEntries(
          Object.entries(state.lists).map(([key, entry]) => [
            key,
            JSON.parse(key)[0] === action.network
              ? {
                  ...entry,
                  stale: true,
                  revision: entry.revision + 1,
                  requestId: undefined,
                  status: entry.loaded ? "ready" : "idle",
                }
              : entry,
          ]),
        ),
      };
    default:
      return state;
  }
}
