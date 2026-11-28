import { useEffect, useRef } from "react";
import { useStore } from "react-redux";
import { useAppDispatch, useAppSelector, type RootState } from "./useStore";
import {
  nftListKey,
  restoreNFTList,
  startNFTListLoad,
  updateNFTList,
  setNFTListError,
} from "@/reducers/nft";
import {
  loadLocalNFTs,
  readNFTListCache,
  writeNFTListCache,
  clearNFTListCache,
} from "@/utils/nft";

export default function useNFTList() {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const node = useAppSelector((state) => state.network.currentNode);
  const owner = useAppSelector(
    (state) => state.accountInfo.currentAccount.address,
  );
  const lists = useAppSelector((state) => state.nft.lists);
  const previousLists = useRef(lists);
  const key = nftListKey(node.networkID || "", owner || "");
  const requested = !!lists[key];
  const revision = lists[key]?.revision;

  useEffect(() => {
    const previous = previousLists.current;
    previousLists.current = lists;
    if (!Object.keys(lists).length && Object.keys(previous).length)
      clearNFTListCache();
    for (const [listKey, entry] of Object.entries(lists)) {
      if (entry !== previous[listKey] && entry.loaded && !entry.stale) {
        writeNFTListCache(listKey, {
          items: entry.items,
          partial: entry.partial,
        });
      }
    }
  }, [lists]);

  useEffect(() => {
    if (!requested || !node.networkID || !owner) return;
    const entry = store.getState().nft.lists[key]!;
    if (!entry.stale && (entry.status === "ready" || entry.status === "error"))
      return;
    if (!entry.loaded) {
      const cached = readNFTListCache(key);
      if (cached) dispatch(restoreNFTList(key, cached));
    }
    const controller = new AbortController();
    const requestId = crypto.randomUUID();
    dispatch(startNFTListLoad(key, requestId));
    const isCurrent = () => {
      const state = store.getState();
      return (
        !controller.signal.aborted &&
        state.accountInfo.currentAccount.address === owner &&
        state.network.currentNode.url === node.url &&
        state.network.currentNode.networkID === node.networkID
      );
    };
    void loadLocalNFTs(node.networkID, owner, controller.signal)
      .then((data) => {
        if (isCurrent()) dispatch(updateNFTList(key, requestId, data));
      })
      .catch(() => {
        if (isCurrent()) dispatch(setNFTListError(key, requestId));
      });
    return () => controller.abort();
  }, [
    key,
    requested,
    revision,
    node.networkID,
    node.url,
    owner,
    dispatch,
    store,
  ]);
}
