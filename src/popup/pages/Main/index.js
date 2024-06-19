import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getLocal } from "../../../background/localStorage";
import { LOCAL_CACHE_KEYS } from "../../../constant/storageKey";
import { updateAccountTx, updateCurrentPrice, updateLocalShowedTokenId, updateLocalTokenConfig, updateShouldRequest, updateTokenAssets } from "../../../reducers/accountReducer";
import { updateBlockInfo, updateDaemonStatus, updateDelegationInfo, updateStakingList } from "../../../reducers/stakingReducer";
import { isNumber } from "../../../utils/utils";
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
    let localHistory = getLocal(LOCAL_CACHE_KEYS.TRANSACTION_HISTORY)
    let txList = []
    let pendingTxList = []
    let zkList = []
    let zkPendingList = []
    if (localHistory) {
      let localHistoryJson = safeJsonParse(localHistory)
      txList = localHistoryJson ? localHistoryJson[address] : []
    }
    let localPendingHistory = getLocal(LOCAL_CACHE_KEYS.PENDING_TRANSACTION_HISTORY)
    if (localPendingHistory) {
      let localPendingJson = safeJsonParse(localPendingHistory)
      pendingTxList = localPendingJson ? localPendingJson[address] : []
    }

    let localZkAppHistory = getLocal(LOCAL_CACHE_KEYS.ZKAPP_TX_LIST)
    if (localZkAppHistory) {
      let localZkAppHistoryJson = safeJsonParse(localZkAppHistory)
      zkList = localZkAppHistoryJson ? localZkAppHistoryJson[address] : []
    }
    let localZkAppPendingHistory = getLocal(LOCAL_CACHE_KEYS.ZKAPP_PENDING_TX_LIST)
    if (localZkAppPendingHistory) {
      let localZkAppPendingHistoryJson = safeJsonParse(localZkAppPendingHistory)
      zkPendingList = localZkAppPendingHistoryJson ? localZkAppPendingHistoryJson[address] : []
    }
    

    let updateTxList = txList && Array.isArray(txList) ? txList : []
    let updatePendingTxList = pendingTxList && Array.isArray(pendingTxList) ? pendingTxList : []
    let updateZkList = zkList && Array.isArray(zkList) ? zkList : []
    let updateZkPendingList = zkPendingList && Array.isArray(zkPendingList) ? zkPendingList : []
    

    dispatch(updateAccountTx(updateTxList, updatePendingTxList,updateZkList,updateZkPendingList))

    let totalList = [...updateTxList,...updatePendingTxList,...updateZkList,...updateZkPendingList]
    if(totalList.length != 0 || !currentNode.gqlTxUrl){
      dispatch(updateShouldRequest(false))
    }
  }, [currentNode])

  const updateLocalAccount = useCallback((address) => {
     let localShowedTokenIds = getLocal(LOCAL_CACHE_KEYS.SHOWED_TOKEN)
     if (localShowedTokenIds) {
       let tokenIdsMap = safeJsonParse(localShowedTokenIds)
       let tokenIds = tokenIdsMap ? tokenIdsMap[address] : ""
       if(Array.isArray(tokenIds) && tokenIds.length> 0){
        dispatch(updateLocalShowedTokenId(tokenIds));
       }
     }

    let localTokenAssets = getLocal(LOCAL_CACHE_KEYS.BASE_TOKEN_ASSETS)
    if (localTokenAssets) {
      let tokenAssetsMap = safeJsonParse(localTokenAssets)
      let tokenAssets = tokenAssetsMap ? tokenAssetsMap[address] : ""
      if (tokenAssets) {
        dispatch(updateTokenAssets(tokenAssets,true));

        let localTokenConfig = getLocal(LOCAL_CACHE_KEYS.TOKEN_CONFIG)
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
    updateLocalAccount(address)
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