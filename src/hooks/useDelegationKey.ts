import { useSelector } from "react-redux";
import type { RootState } from "@/reducers";

/**
 * Hook to get the validated delegation key from cache.
 * Returns null if cache is invalid (wrong account or network).
 * Returns the delegation key (possibly empty string "") if cache is valid.
 */
export function useDelegationKey(): string | null {
  const delegationCache = useSelector((state: RootState) => state.staking.delegationCache);
  const currentAddress = useSelector(
    (state: RootState) => state.accountInfo.currentAccount.address
  );
  const networkID = useSelector(
    (state: RootState) => state.network.currentNode.networkID
  );

  if (!currentAddress || !networkID) {
    return null;
  }

  const isValid =
    delegationCache?.owner === currentAddress &&
    delegationCache?.network === networkID;

  return isValid ? delegationCache.key : null;
}

export default useDelegationKey;
