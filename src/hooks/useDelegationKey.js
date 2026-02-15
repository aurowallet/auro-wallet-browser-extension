import { useSelector } from "react-redux";

/**
 * Hook to get the validated delegation key from cache.
 * Returns null if cache is invalid (wrong account or network).
 * Returns the delegation key (possibly empty string "") if cache is valid.
 */
export function useDelegationKey() {
  const delegationCache = useSelector((state) => state.staking.delegationCache);
  const currentAddress = useSelector(
    (state) => state.accountInfo.currentAccount.address
  );
  const networkID = useSelector(
    (state) => state.network.currentNode.networkID
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
