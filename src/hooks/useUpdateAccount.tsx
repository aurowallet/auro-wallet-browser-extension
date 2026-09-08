import { getAllTokenAssets, getAllTokenInfoV2 } from "@/background/api";
import { getLocal, getLocalJsonObject, saveLocal } from "@/background/localStorage";
import {
  LOCAL_CACHE_KEYS,
  STABLE_LOCAL_ACCOUNT_CACHE_KEYS,
} from "@/constant/storageKey";
import Toast from "@/popup/component/Toast";
import {
  updateLocalTokenConfig,
  updateShouldRequest,
  updateTokenAssets,
} from "@/reducers/accountReducer";
import i18n from "i18next";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";

interface CurrentAccount {
  address: string;
  [key: string]: unknown;
}

interface TokenAccount {
  tokenId: string;
  [key: string]: unknown;
}

interface TokenAssetsResponse {
  accounts?: TokenAccount[];
  [key: string]: unknown;
}

interface TokenInfoResponse {
  error?: unknown;
  [tokenId: string]: unknown;
}

interface UseFetchAccountDataResult {
  isLoading: boolean;
  fetchAccountData: () => Promise<unknown>;
  result: unknown[] | null;
}

function saveTokenAssetsCache(
  networkID: string | undefined,
  address: string,
  assets: unknown[],
): void {
  if (!networkID) return;

  const cache = getLocalJsonObject(LOCAL_CACHE_KEYS.BASE_TOKEN_ASSETS_V2) as Record<string, Record<string, unknown>>;

  const networkCache =
    cache[networkID] &&
    typeof cache[networkID] === "object" &&
    !Array.isArray(cache[networkID])
      ? cache[networkID]
      : {};
  saveLocal(
    LOCAL_CACHE_KEYS.BASE_TOKEN_ASSETS_V2,
    JSON.stringify({
      ...cache,
      [networkID]: { ...networkCache, [address]: assets },
    }),
  );
}

const useFetchAccountData = (currentAccount: CurrentAccount, isDev = false): UseFetchAccountDataResult => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<unknown[] | null>(null);
  const dispatch = useAppDispatch();
  const currentNodeUrl = useAppSelector((state) => state.network.currentNode?.url);
  const currentNetworkID = useAppSelector((state) => state.network.currentNode?.networkID);
  const isSilentRefresh = useAppSelector((state) => state.accountInfo.isSilentRefresh);
  const isSilentRef = useRef(isSilentRefresh);
  isSilentRef.current = isSilentRefresh;
  const fetchGenerationRef = useRef(0);

  useEffect(() => {
    fetchGenerationRef.current++;
  }, [currentAccount.address, currentNodeUrl]);

  const fetchAccountData = useCallback(async (): Promise<unknown> => {
    setIsLoading(true);
    const address = currentAccount.address;
    const generation = ++fetchGenerationRef.current;
    try {
      const account = await getAllTokenAssets(address) as TokenAssetsResponse;
      if (generation !== fetchGenerationRef.current) {
        return undefined;
      }
      if (Array.isArray(account?.accounts)) {
        if (account.accounts.length > 0) {
          const tokenIds = account.accounts.map((token: TokenAccount) => token.tokenId);
          const accountsWithTokenInfoV2 = await getAllTokenInfoV2(tokenIds) as TokenInfoResponse;
          if (generation !== fetchGenerationRef.current) {
            return undefined;
          }
          if (accountsWithTokenInfoV2?.error) {
            if (!isDev) {
              Toast.info(i18n.t("nodeError"), 2000, false);
              if (!isSilentRef.current) {
                dispatch(updateTokenAssets([]));
                setResult([]);
              }
            }
            return [];
          } else {
            const lastTokenList = account.accounts.map((token: TokenAccount) => ({
              ...token,
              tokenNetInfo: accountsWithTokenInfoV2[token.tokenId],
            }));
            const localTokenConfig = getLocal(
              STABLE_LOCAL_ACCOUNT_CACHE_KEYS.TOKEN_CONFIG
            );
            if (localTokenConfig) {
              let tokenConfigMap;
              try { tokenConfigMap = JSON.parse(localTokenConfig); } catch (e) { /* corrupted localStorage */ }
              if (tokenConfigMap && tokenConfigMap[address]) {
                const tokenConfig = tokenConfigMap[address];
                if (!isDev && tokenConfig) {
                  dispatch(updateLocalTokenConfig(tokenConfig, ''));
                }
              }
            }
            if (!isDev) {
              dispatch(updateTokenAssets(lastTokenList));
              setResult(lastTokenList);
              saveTokenAssetsCache(currentNetworkID, currentAccount.address, lastTokenList);
              return lastTokenList;
            } else {
              return lastTokenList;
            }
          }
        } else {
          if (!isDev) {
            if (!isSilentRef.current) {
              dispatch(updateTokenAssets([]));
              setResult([]);
              saveTokenAssetsCache(currentNetworkID, currentAccount.address, []);
            }
            return [];
          } else {
            return [];
          }
        }
      } else {
        if (!isDev && !isSilentRef.current) {
          dispatch(updateTokenAssets([]));
          setResult([]);
        }
        return [];
      }
    } catch (error) {
      console.error(error);
      if (generation === fetchGenerationRef.current) {
        if (!isDev && !isSilentRef.current) {
          dispatch(updateTokenAssets([]));
          setResult(null);
        }
      }
      return isDev ? error : undefined;
    } finally {
      if (generation === fetchGenerationRef.current) {
        if (!isDev) {
          dispatch(updateShouldRequest(false));
        }
        setIsLoading(false);
      }
    }
  }, [currentAccount, currentNetworkID, dispatch, currentNodeUrl]);

  return { isLoading, fetchAccountData, result };
};

export default useFetchAccountData;
