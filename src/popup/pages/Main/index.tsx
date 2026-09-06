import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import { NetworkID_MAP } from "@/constant/network";
import { getLocal } from "../../../background/localStorage";
import { LOCAL_CACHE_KEYS, STABLE_LOCAL_ACCOUNT_CACHE_KEYS } from "../../../constant/storageKey";
import { updateAccountTxV2, updateCurrentPrice, updateLocalShowedTokenId, updateLocalTokenConfig, updateShouldRequest, updateTokenAssets } from "../../../reducers/accountReducer";
import { updateBlockInfo, updateDaemonStatus, updateDelegationInfo, updateStakingAPR, updateStakingList } from "../../../reducers/stakingReducer";
import { getTxHistoryCacheKey } from "../../../utils/utils";
import Wallet from "../Wallet";

const HomePage = () => {

  const currentAccount = useAppSelector((state) => state.accountInfo.currentAccount)
  const currentNode = useAppSelector((state) => state.network.currentNode)

  const dispatch = useAppDispatch()

  const safeJsonParse = (data: string | null) => {
    try {
      return JSON.parse(data || '{}')
    } catch (error) {
      return {}
    }
  }
  const shouldUpdateTxList = useCallback((address: string) => {
    const txHistory = getLocal(LOCAL_CACHE_KEYS.ALL_TX_HISTORY_V2);
    const currentHistory = safeJsonParse(txHistory);
    const cacheKey = getTxHistoryCacheKey(address, currentNode?.networkID);
    if (currentHistory?.[cacheKey]) {
      const targetHistory = currentHistory?.[cacheKey]
      const tokenIdList = Object.keys(targetHistory)
      for (let index = 0; index < tokenIdList.length; index++) {
        const tokenId = tokenIdList[index]
        if (tokenId) {
          const tokenTxHistory = targetHistory[tokenId];
          dispatch(
            updateAccountTxV2(tokenTxHistory, tokenId)
          );
        }
      }
    }
  }, [currentNode?.networkID])

  const updateLocalAccount = useCallback((address: string, networkID?: string) => {
     let localShowedTokenIds = getLocal(STABLE_LOCAL_ACCOUNT_CACHE_KEYS.SHOWED_TOKEN)
     if (localShowedTokenIds) {
       let tokenIdsMap = safeJsonParse(localShowedTokenIds)
       let tokenIds = tokenIdsMap ? tokenIdsMap[address] : ""
        dispatch(updateLocalShowedTokenId(Array.isArray(tokenIds) ? tokenIds:[]));
     }

    let localTokenConfig = getLocal(STABLE_LOCAL_ACCOUNT_CACHE_KEYS.TOKEN_CONFIG)
    if(localTokenConfig){
      let tokenConfigMap = safeJsonParse(localTokenConfig)
      if(tokenConfigMap && tokenConfigMap[address]){
        let tokenConfig = tokenConfigMap[address]
        dispatch(updateLocalTokenConfig(tokenConfig, ''))
      }
    }

    let localTokenAssets = getLocal(LOCAL_CACHE_KEYS.BASE_TOKEN_ASSETS_V2)
    if (localTokenAssets) {
      let tokenAssetsMap = safeJsonParse(localTokenAssets)
      let tokenAssets = networkID ? tokenAssetsMap?.[networkID]?.[address] : undefined
      if (tokenAssets) {
        dispatch(updateTokenAssets(tokenAssets,true));
      } else {
        dispatch(updateTokenAssets([], true));
      }
    } else {
      dispatch(updateTokenAssets([], true));
    }
  }, [dispatch])

  const updateLocalPrice = useCallback(() => {
    let localTokenPrice = getLocal(LOCAL_CACHE_KEYS.COIN_PRICE)
    if (localTokenPrice) {
      let localPriceJson = safeJsonParse(localTokenPrice)
      if (Object.keys(localPriceJson).length>0) {
        dispatch(updateCurrentPrice(localPriceJson,true))
      }
    }
  }, [])

  const updateLocalDaemonStatus = useCallback(() => {
    let localDaemonStatus = getLocal(LOCAL_CACHE_KEYS.DAEMON_STATUS_MAP)
    if (localDaemonStatus) {
      let localDaemonStatusMap = safeJsonParse(localDaemonStatus)
      let networkID = currentNode?.networkID || ""
      let daemonStatusJson = localDaemonStatusMap ? localDaemonStatusMap[networkID] : ""
      if (daemonStatusJson) {
        dispatch(updateDaemonStatus(daemonStatusJson))
      } else {
        dispatch(updateDaemonStatus({}))
      }
    } else {
      dispatch(updateDaemonStatus({}))
    }
  }, [currentNode?.networkID])

  const updateLocalDelegation = useCallback((address: string, networkID?: string) => {
    let localDelegationInfo = getLocal(LOCAL_CACHE_KEYS.DELEGATION_INFO_V2)
    if (localDelegationInfo) {
      let localDelegationInfoJson = safeJsonParse(localDelegationInfo)
      let delegationInfoJson = networkID
        ? localDelegationInfoJson?.[networkID]?.[address]
        : undefined
      dispatch(updateDelegationInfo(delegationInfoJson || {}))
    } else {
      dispatch(updateDelegationInfo({}))
    }
  }, [dispatch])

  const updateLocalBlock = useCallback((networkID?: string) => {
    let localBlockInfo = getLocal(LOCAL_CACHE_KEYS.BLOCK_INFO_V2)
    if (localBlockInfo) {
      let localBlockInfoJson = safeJsonParse(localBlockInfo)
      const blockInfo = networkID ? localBlockInfoJson?.[networkID] : undefined
      dispatch(updateBlockInfo(blockInfo || {}))
    } else {
      dispatch(updateBlockInfo({}))
    }
  }, [dispatch])

  const updateLocalStaking = useCallback((networkID?: string) => {
    if (networkID !== NetworkID_MAP.mainnet) {
      dispatch(updateStakingList({ stakingList: { active: [], inactive: [] } }))
      dispatch(updateStakingAPR(null))
      return
    }
    let localStakingList = getLocal(LOCAL_CACHE_KEYS.STAKING_LIST)
    const localStakingListJson = localStakingList ? safeJsonParse(localStakingList) : undefined
    if (
      localStakingListJson &&
      Array.isArray(localStakingListJson.active) &&
      Array.isArray(localStakingListJson.inactive)
    ) {
      dispatch(updateStakingList({ stakingList: localStakingListJson }))
    } else {
      dispatch(updateStakingList({ stakingList: { active: [], inactive: [] } }))
    }
  }, [dispatch])

  const getLocalCache = useCallback(() => {
    let address = currentAccount?.address || ""
    let networkID = currentNode?.networkID || ""
    shouldUpdateTxList(address)
    updateLocalPrice()
    updateLocalDelegation(address, networkID)
    updateLocalBlock(networkID)
    updateLocalStaking(networkID)
  }, [currentAccount?.address, currentNode?.networkID,
    shouldUpdateTxList, updateLocalPrice,
    updateLocalDelegation, updateLocalBlock, updateLocalStaking])

  useEffect(() => {
    getLocalCache()
  }, [getLocalCache])

  useEffect(() => {
    shouldUpdateTxList(currentAccount?.address || '')
  }, [currentAccount?.address, currentNode?.networkID, shouldUpdateTxList])

  useEffect(() => {
    updateLocalDaemonStatus()
  }, [currentNode?.networkID])

  useEffect(()=>{
    updateLocalAccount(currentAccount?.address || '', currentNode?.networkID)
  },[currentAccount?.address, currentNode?.networkID, updateLocalAccount])

  return (<div
    style={{
      width: "100%",
      height: "100%",
      position: "relative",
    }}
  >
    <Wallet />
  </div>)
}
export default HomePage
