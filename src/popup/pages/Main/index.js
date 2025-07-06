import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getLocal } from "../../../background/localStorage";
import { LOCAL_CACHE_KEYS, STABLE_LOCAL_ACCOUNT_CACHE_KEYS } from "../../../constant/storageKey";
import { updateAccountTx, updateAccountTxV2, updateCurrentPrice, updateLocalShowedTokenId, updateLocalTokenConfig, updateShouldRequest, updateTokenAssets } from "../../../reducers/accountReducer";
import { updateBlockInfo, updateDaemonStatus, updateDelegationInfo, updateStakingList } from "../../../reducers/stakingReducer";
import Wallet from "../Wallet";

const HomePage = () => {

  const currentAccount = useSelector(state => state.accountInfo.currentAccount)
  const currentNode = useSelector(state => state.network.currentNode)

  const dispatch = useDispatch()

  const safeJsonParse = (data) => {
    try {
      return JSON.parse(data)
    } catch (error) {
      return ""
    }
  }
  const shouldUpdateTxList = useCallback((address) => {
    const txHistory = getLocal(LOCAL_CACHE_KEYS.ALL_TX_HISTORY_V2);
    const currentHistory = JSON.parse(txHistory);
    if (currentHistory?.[address]) {
      const targetHistory = currentHistory?.[address]
      const tokenIdList = Object.keys(targetHistory)
      for (let index = 0; index < tokenIdList.length; index++) {
        const tokenId = tokenIdList[index]
        const tokenTxHistory = targetHistory[tokenId];
        dispatch(
          updateAccountTxV2(tokenTxHistory, tokenId)
        );
      }
    }
  }, [currentNode])

  const updateLocalAccount = useCallback((address) => {
     let localShowedTokenIds = getLocal(STABLE_LOCAL_ACCOUNT_CACHE_KEYS.SHOWED_TOKEN)
     if (localShowedTokenIds) {
       let tokenIdsMap = safeJsonParse(localShowedTokenIds)
       let tokenIds = tokenIdsMap ? tokenIdsMap[address] : ""
        dispatch(updateLocalShowedTokenId(Array.isArray(tokenIds) ? tokenIds:[]));
     }

    let localTokenAssets = getLocal(LOCAL_CACHE_KEYS.BASE_TOKEN_ASSETS)
    if (localTokenAssets) {
      let tokenAssetsMap = safeJsonParse(localTokenAssets)
      let tokenAssets = tokenAssetsMap ? tokenAssetsMap[address] : ""
      if (tokenAssets) {
        dispatch(updateTokenAssets(tokenAssets,true));

        let localTokenConfig = getLocal(STABLE_LOCAL_ACCOUNT_CACHE_KEYS.TOKEN_CONFIG)
        if(localTokenConfig){
          let tokenConfigMap = safeJsonParse(localTokenConfig)
          if(tokenConfigMap && tokenConfigMap[address]){
            let tokenConfig = tokenConfigMap[address]
            dispatch(updateLocalTokenConfig(tokenConfig))
          }
        }

      }
    }
  }, [])

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
    let localDaemonStatus = getLocal(LOCAL_CACHE_KEYS.DAEMON_STATUS)
    if (localDaemonStatus) {
      let localDaemonStatusJson = safeJsonParse(localDaemonStatus)
      if (localDaemonStatusJson) {
        dispatch(updateDaemonStatus(localDaemonStatusJson))
      }
    }
  }, [])

  const updateLocalDelegation = useCallback((address) => {
    let localDelegationInfo = getLocal(LOCAL_CACHE_KEYS.DELEGATION_INFO)
    if (localDelegationInfo) {
      let localDelegationInfoJson = safeJsonParse(localDelegationInfo)
      let delegationInfoJson = localDelegationInfoJson ? localDelegationInfoJson[address] : ""
      if (delegationInfoJson) {
        dispatch(updateDelegationInfo(delegationInfoJson))
      }
    }
  }, [])

  const updateLocalBlock = useCallback(() => {
    let localBlockInfo = getLocal(LOCAL_CACHE_KEYS.BLOCK_INFO)
    if (localBlockInfo) {
      let localBlockInfoJson = safeJsonParse(localBlockInfo)
      if (localBlockInfoJson) {
        dispatch(updateBlockInfo(localBlockInfoJson))
      }
    }
  }, [])

  const updateLocalStaking = useCallback(() => {
    let localStakingList = getLocal(LOCAL_CACHE_KEYS.STAKING_LIST)
    if (localStakingList) {
      let localStakingListJson = safeJsonParse(localStakingList)
      if (localStakingListJson) {
        dispatch(updateStakingList({ stakingList: localStakingListJson }))
      }
    }
  }, [])

  const getLocalCache = useCallback(() => {
    let address = currentAccount?.address || ""
    shouldUpdateTxList(address)
    updateLocalPrice()


    updateLocalDaemonStatus()
    updateLocalDelegation(address)
    updateLocalBlock()
    updateLocalStaking()
  }, [currentAccount,
    shouldUpdateTxList, updateLocalAccount, updateLocalPrice, updateLocalDaemonStatus,
    updateLocalDelegation, updateLocalBlock, updateLocalStaking])

  useEffect(() => {
    getLocalCache()
  }, [])

  useEffect(()=>{
    updateLocalAccount(currentAccount?.address)
  },[currentAccount?.address])

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