import { useEffect } from "react";
import browser from "webextension-polyfill";
import { refreshMinaExchanges } from "@/background/api";
import { useAppDispatch } from "./useStore";
import { updateMinaExchangesConfig } from "@/reducers/cache";
import { MINA_EXCHANGES_CACHE_KEY } from "@/constant/storageKey";
import { parseMinaExchangesCache } from "@/utils/minaExchanges";

export default function useMinaExchangesCache(): void {
  const dispatch = useAppDispatch();
  useEffect(() => {
    let active = true;
    let changed = false;
    const apply = (value: unknown) => {
      dispatch(updateMinaExchangesConfig(parseMinaExchangesCache(value)));
    };
    const onChanged = (changes: Record<string, browser.Storage.StorageChange>, area: string) => {
      if (area === "local" && Object.hasOwn(changes, MINA_EXCHANGES_CACHE_KEY)) {
        changed = true;
        apply(changes[MINA_EXCHANGES_CACHE_KEY]?.newValue);
      }
    };
    browser.storage.onChanged.addListener(onChanged);
    void browser.storage.local.get(MINA_EXCHANGES_CACHE_KEY).then((values) => {
      if (active && !changed) apply(values[MINA_EXCHANGES_CACHE_KEY]);
    }).catch(() => {});
    void refreshMinaExchanges();
    return () => {
      active = false;
      browser.storage.onChanged.removeListener(onChanged);
    };
  }, [dispatch]);
}
