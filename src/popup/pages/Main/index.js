import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getNetworkList } from "../../../background/api";
import { getLocal } from "../../../background/localStorage";
import { LOCAL_CACHE_KEYS } from "../../../constant/storageKey";
import { updateAccountTx, updateNetAccount } from "../../../reducers/accountReducer";
import { updateCurrentPrice } from "../../../reducers/cache";
import { updateNetChainIdConfig } from "../../../reducers/network";
import { updateBlockInfo, updateDaemonStatus, updateDelegationInfo, updateStakingList, updateValidatorDetail } from "../../../reducers/stakingReducer";
import { getNetTypeNotSupportHistory, isNumber } from "../../../utils/utils";
import Wallet from "../Wallet";

const HomePage = () => {

  const netConfig = useSelector(state => state.network)
  const currentAccount = useSelector(state => state.accountInfo.currentAccount)
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
    if (localHistory) {
      let localHistoryJson = safeJsonParse(localHistory)
      txList = localHistoryJson ? localHistoryJson[address] : []
    }
    let localPendingHistory = getLocal(LOCAL_CACHE_KEYS.PENDING_TRANSACTION_HISTORY)
    if (localPendingHistory) {
      let localPendingJson = safeJsonParse(localPendingHistory)
      pendingTxList = localPendingJson ? localPendingJson[address] : []
    }
    let updateTxList = txList && Array.isArray(txList) ? txList : []
    let updatePendingTxList = pendingTxList && Array.isArray(pendingTxList) ? pendingTxList : []
    dispatch(updateAccountTx(updateTxList, updatePendingTxList))
  }, [])

  const updateLocalAccount = useCallback((address) => {
    let localAccount = getLocal(LOCAL_CACHE_KEYS.ACCOUNT_BALANCE)
    if (localAccount) {
      let localAccountJson = safeJsonParse(localAccount)
      let netAccount = localAccountJson ? localAccountJson[address] : ""
      if (netAccount && netAccount.publicKey) {
        dispatch(updateNetAccount(netAccount, true))
      }
    }
  }, [])

  const updateLocalPrice = useCallback(() => {
    let localPrice = getLocal(LOCAL_CACHE_KEYS.COIN_PRICE)
    if (localPrice) {
      let localPriceJson = safeJsonParse(localPrice)
      if (localPriceJson && isNumber(localPriceJson.price)) {
        dispatch(updateCurrentPrice(localPriceJson.price))
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

  const updateLocalValidator = useCallback(() => {
    let localValidatorDetail = getLocal(LOCAL_CACHE_KEYS.VALIDATOR_DETAIL)
    if (localValidatorDetail) {
      let localValidatorDetailJson = safeJsonParse(localValidatorDetail)
      if (localValidatorDetailJson) {
        dispatch(updateValidatorDetail(localValidatorDetailJson))
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

  const getlocalCache = useCallback(() => {
    const netType = netConfig.currentConfig?.netType
    let address = currentAccount?.address || ""

    if (!getNetTypeNotSupportHistory(netType)) {
      shouldUpdateTxList(address)
    }
    updateLocalAccount(address)
    updateLocalPrice()


    updateLocalDaemonStatus()
    updateLocalDelegation(address)
    updateLocalBlock()
    updateLocalValidator()
    updateLocalStaking()
  }, [netConfig, currentAccount,
    shouldUpdateTxList, updateLocalAccount, updateLocalPrice, updateLocalDaemonStatus,
    updateLocalDelegation, updateLocalBlock, updateLocalValidator, updateLocalStaking])

    const getNetConfig = useCallback(async()=>{
      let network = await getNetworkList()
      if(Array.isArray(network) &&  network.length>0){
        dispatch(updateNetChainIdConfig(network)) 
      }
    },[])
  useEffect(() => {
    getlocalCache()
    getNetConfig()
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