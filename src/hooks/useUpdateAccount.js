import { getAllTokenAssets, getAllTokenInfoV2 } from "@/background/api";
import { getLocal } from "@/background/localStorage";
import { STABLE_LOCAL_ACCOUNT_CACHE_KEYS } from "@/constant/storageKey";
import Toast from "@/popup/component/Toast";
import {
  updateLocalTokenConfig,
  updateShouldRequest,
  updateTokenAssets,
} from "@/reducers/accountReducer";
import i18n from "i18next";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";

const useFetchAccountData = (currentAccount) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const dispatch = useDispatch();
  let isRequest = false;
  const fetchAccountData = useCallback(async () => {
    setIsLoading(true);
    let address = currentAccount.address;
    if (isRequest) {
      return;
    }
    isRequest = true;
    try {
      const account = await getAllTokenAssets(address);
      if (Array.isArray(account.accounts) && account.accounts.length > 0) {
        const tokenIds = account.accounts.map((token) => token.tokenId);
        const accountsWithTokenInfoV2 = await getAllTokenInfoV2(tokenIds);

        if (accountsWithTokenInfoV2.error) {
          Toast.info(i18n.t("nodeError"));
        } else {
          const lastTokenList = account.accounts.map((token) => ({
            ...token,
            tokenNetInfo: accountsWithTokenInfoV2[token.tokenId],
          }));

          let localTokenConfig = getLocal(
            STABLE_LOCAL_ACCOUNT_CACHE_KEYS.TOKEN_CONFIG
          );
          if (localTokenConfig) {
            let tokenConfigMap = JSON.parse(localTokenConfig);
            if (tokenConfigMap && tokenConfigMap[address]) {
              let tokenConfig = tokenConfigMap[address];
              dispatch(updateLocalTokenConfig(tokenConfig));
            }
          }
          dispatch(updateTokenAssets(lastTokenList));
          setResult(lastTokenList);
        }
      } else {
        dispatch(updateTokenAssets([]));
        setResult([]);
      }
    } catch (error) {
      console.error(error);
      dispatch(updateTokenAssets([]));
      setResult([]);
    } finally {
      dispatch(updateShouldRequest(false));
      setIsLoading(false);
      isRequest = false;
    }
  }, [currentAccount, dispatch]);

  return { isLoading, fetchAccountData, result };
};

export default useFetchAccountData;