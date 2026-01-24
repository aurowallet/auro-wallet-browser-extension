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
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";

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
  const dispatch = useDispatch();
  let isRequest = false;
  const fetchAccountData = useCallback(async (): Promise<unknown> => {
    setIsLoading(true);
    const address = currentAccount.address;
    if (isRequest) {
      return undefined;
    }
    isRequest = true;
    try {
      const account = await getAllTokenAssets(address) as TokenAssetsResponse;
      if (Array.isArray(account?.accounts)) {
        if (account.accounts.length > 0) {
          const tokenIds = account.accounts.map((token: TokenAccount) => token.tokenId);
          const accountsWithTokenInfoV2 = await getAllTokenInfoV2(tokenIds) as TokenInfoResponse;
          if (accountsWithTokenInfoV2?.error) {
            Toast.info(i18n.t("nodeError"), 2000, false);
            dispatch(updateTokenAssets([]));
          } else {
            const lastTokenList = account.accounts.map((token: TokenAccount) => ({
              ...token,
              tokenNetInfo: accountsWithTokenInfoV2[token.tokenId],
            }));
            const localTokenConfig = getLocal(
              STABLE_LOCAL_ACCOUNT_CACHE_KEYS.TOKEN_CONFIG
            );
            if (localTokenConfig) {
              const tokenConfigMap = JSON.parse(localTokenConfig);
              if (tokenConfigMap && tokenConfigMap[address]) {
                const tokenConfig = tokenConfigMap[address];
                if (!isDev && tokenConfig) {
                  // tokenConfig is per-address config, iterate through tokenIds
                  Object.keys(tokenConfig).forEach((tokenId: string) => {
                    dispatch(updateLocalTokenConfig(tokenConfig[tokenId], tokenId));
                  });
                }
              }
            }
            if (!isDev) {
              dispatch(updateTokenAssets(lastTokenList));
              setResult(lastTokenList);
              saveLocal(
                LOCAL_CACHE_KEYS.BASE_TOKEN_ASSETS,
                JSON.stringify({ [currentAccount.address]: lastTokenList })
              );
              return lastTokenList;
            } else {
              return lastTokenList;
            }
          }
        } else {
          if (!isDev) {
            dispatch(updateTokenAssets([]));
            setResult([]);
            saveLocal(
              LOCAL_CACHE_KEYS.BASE_TOKEN_ASSETS,
              JSON.stringify({ [currentAccount.address]: [] })
            );
            return [];
          } else {
            return [];
          }
        }
      } else {
        dispatch(updateTokenAssets([]));
        return [];
      }
      return undefined;
    } catch (error) {
      console.error(error);
      dispatch(updateTokenAssets([]));
      return isDev ? error : undefined;
    } finally {
      if (!isDev) {
        dispatch(updateShouldRequest(false));
        setIsLoading(false);
      }
      isRequest = false;
    }
  }, [currentAccount, dispatch]);

  return { isLoading, fetchAccountData, result };
};

export default useFetchAccountData;
