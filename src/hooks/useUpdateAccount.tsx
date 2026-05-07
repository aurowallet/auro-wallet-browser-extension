import { getAllTokenAssets, getAllTokenInfoV2 } from "@/background/api";
import { getLocal, saveLocal } from "@/background/localStorage";
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

const useFetchAccountData = (currentAccount: CurrentAccount, isDev = false): UseFetchAccountDataResult => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<unknown[] | null>(null);
  const dispatch = useAppDispatch();
  const currentNodeUrl = useAppSelector((state) => state.network.currentNode?.url);
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
              let existingTokenAssets = {};
              try { existingTokenAssets = JSON.parse(getLocal(LOCAL_CACHE_KEYS.BASE_TOKEN_ASSETS) || '{}'); } catch (e) { /* corrupted localStorage */ }
              if (!existingTokenAssets || typeof existingTokenAssets !== 'object' || Array.isArray(existingTokenAssets)) existingTokenAssets = {};
              saveLocal(
                LOCAL_CACHE_KEYS.BASE_TOKEN_ASSETS,
                JSON.stringify({ ...existingTokenAssets, [currentAccount.address]: lastTokenList })
              );
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
              let existingTokenAssets = {};
              try { existingTokenAssets = JSON.parse(getLocal(LOCAL_CACHE_KEYS.BASE_TOKEN_ASSETS) || '{}'); } catch (e) { /* corrupted localStorage */ }
              if (!existingTokenAssets || typeof existingTokenAssets !== 'object' || Array.isArray(existingTokenAssets)) existingTokenAssets = {};
              saveLocal(
                LOCAL_CACHE_KEYS.BASE_TOKEN_ASSETS,
                JSON.stringify({ ...existingTokenAssets, [currentAccount.address]: [] })
              );
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
  }, [currentAccount, dispatch, currentNodeUrl]);

  return { isLoading, fetchAccountData, result };
};

export default useFetchAccountData;
