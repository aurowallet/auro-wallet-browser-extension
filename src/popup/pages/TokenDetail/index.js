import {
  getPendingTxList,
  getTxHistory,
  getZkAppPendingTx,
  getZkAppTxHistory,
} from "@/background/api";
import { getLocal, saveLocal } from "@/background/localStorage";
import { MAIN_COIN_CONFIG } from "@/constant";
import { LOCAL_CACHE_KEYS } from "@/constant/storageKey";
import Clock from "@/popup/component/Clock";
import CustomViewV2 from "@/popup/component/CustomViewV2";
import {
  updateAccountTxV2,
  updateShouldRequest,
} from "@/reducers/accountReducer";
import {
  addressSlice,
  getAmountForUI,
  getBalanceForUI,
  isNaturalNumber,
} from "@/utils/utils";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import styled, { css } from "styled-components";
import {
  EmptyTxListView,
  HistoryHeader,
  LoadingView,
  TxNotSupportView,
} from "../Wallet/component/StatusView";
import TokenIcon from "../Wallet/component/TokenIcon";
import TxListView from "../Wallet/component/TxListView";
import useFetchAccountData from "../../../hooks/useUpdateAccount";
import { FROM_BACK_TO_RECORD, TX_SUCCESS } from "../../../constant/msgTypes";
import extension from "extensionizer";
const StyledTopWrapper = styled.div`
  background: #f9fafc;
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 30px 20px;
`;
const StyledBalanceRow = styled.div`
  color: #000;
  text-align: center;
  font-size: 22px;
  font-weight: 500;
  margin-top: 10px;
`;
const StyledAmountRow = styled.div`
  color: rgba(0, 0, 0, 0.5);
  text-align: center;
  font-size: 12px;
  font-weight: 400;
`;
const StyledActionRow = styled.div`
  margin-top: 16px;
  display: flex;
  align-items: center;
  > :not(:first-of-type) {
    margin-left: 10px;
  }
`;
const StyledHistoryWrapper = styled.div`
  box-sizing: content-box;
`;

const TokenDetail = () => {
  const token = useSelector((state) => state.cache.nextTokenDetail);
  const tokenList = useSelector((state) => state.accountInfo.tokenList);
  const nextTokenInfo = useMemo(()=>{
    let tokenInfo = tokenList.find((item) => {
      if (item.tokenId === token?.tokenId) {
        return item
      }
    })
    if(!tokenInfo){
      return token
    }
    return tokenInfo
  },[tokenList,token])

  const txHistoryMap = useSelector((state) => state.accountInfo.txHistoryMap);
  const currencyConfig = useSelector((state) => state.currencyConfig);
  const currentNode = useSelector((state) => state.network.currentNode);
  const currentAccount = useSelector(
    (state) => state.accountInfo.currentAccount
  );
  const mainTokenNetInfo = useSelector(
    (state) => state.accountInfo.mainTokenNetInfo
  );
  const dispatch = useDispatch();
  const isMounted = useRef(true);
  const shouldRefresh = useSelector((state) => state.accountInfo.shouldRefresh);
  const { fetchAccountData } = useFetchAccountData(currentAccount);

  const [showLoading, setShowLoading] = useState(true);

  const isSilentRefresh = useSelector(
    (state) => state.accountInfo.isSilentRefresh
  );
  let isFirstRequest = useRef(false);

  let isRequest = false;

  const {
    tokenIconUrl,
    tokenSymbol,
    displayBalance,
    displayAmount,
    tokenName,
    isFungibleToken,
  } = useMemo(() => {
    const isFungibleToken = !nextTokenInfo.tokenBaseInfo.isMainToken;

    let tokenIconUrl = nextTokenInfo.tokenBaseInfo.iconUrl;
    let tokenSymbol;
    let tokenName;
    if (isFungibleToken) {
      tokenSymbol = nextTokenInfo?.tokenNetInfo?.tokenSymbol;
      tokenName = addressSlice(nextTokenInfo.tokenId, 6);
    } else {
      tokenSymbol = MAIN_COIN_CONFIG.symbol;
      tokenName = MAIN_COIN_CONFIG.name;
    }

    let displayBalance = getBalanceForUI(nextTokenInfo.tokenBaseInfo.showBalance);

    let displayAmount = nextTokenInfo.tokenBaseInfo.showAmount || "";
    if (nextTokenInfo.tokenBaseInfo.showAmount) {
      displayAmount =
        currencyConfig.currentCurrency.symbol +
        " " +
        getAmountForUI(displayAmount, 0, 2);
    }

    return {
      tokenIconUrl,
      token:nextTokenInfo,
      isFungibleToken,
      tokenSymbol,
      tokenName,
      displayBalance,
      displayAmount,
    };
  }, [nextTokenInfo]);

  const showTxHistory = useMemo(() => {
    let list = txHistoryMap[token.tokenId] || [];
    return list;
  }, [txHistoryMap, token.tokenId]);

  useEffect(() => {
    if (showTxHistory.length == 0 && isFirstRequest.current) {
      setShowLoading(true);
    } else if (showTxHistory.length > 0) {
      setShowLoading(false);
    }
  }, [showTxHistory]);

  const saveToLocal = useCallback(
    (newHistory) => {
      const txHistory = getLocal(LOCAL_CACHE_KEYS.ALL_TX_HISTORY);
      const currentHistory = JSON.parse(txHistory);
      if (currentHistory?.[currentAccount.address]) {
        let newSaveHistory = {
          ...currentHistory[currentAccount.address],
          [token.tokenId]: newHistory,
        };
        saveLocal(
          LOCAL_CACHE_KEYS.ALL_TX_HISTORY,
          JSON.stringify({
            [currentAccount.address]: newSaveHistory,
          })
        );
      } else {
        saveLocal(
          LOCAL_CACHE_KEYS.ALL_TX_HISTORY,
          JSON.stringify({
            [currentAccount.address]: {
              [token.tokenId]: newHistory,
            },
          })
        );
      }
    },
    [currentAccount.address, token.tokenId]
  );
  const requestHistory = useCallback(
    async (address = currentAccount.address) => {
      if (isRequest) {
        return;
      }
      isRequest = true;

      let zkAppTxList = getZkAppTxHistory(address, token.tokenId).catch(
        (err) => err
      );
      let getZkAppPending = getZkAppPendingTx(address, token.tokenId).catch(
        (err) => err
      );
      let txResponse;
      if (isFungibleToken) {
        txResponse = await Promise.all([zkAppTxList, getZkAppPending]); //.catch(err=>err);
        let zkStatus = txResponse[0]?.address == currentAccount.address;
        let zkPendingStatus = txResponse[1]?.address == currentAccount.address;
        let zkAppList = zkStatus ? txResponse[0].txList : [];
        let zkPendingList = zkPendingStatus ? txResponse[1].txList : [];

        let history = {};
        if (zkStatus) {
          history.zkAppList = zkAppList;
        }
        if (zkPendingStatus) {
          history.zkPendingList = zkPendingList;
        }
        dispatch(updateAccountTxV2(history, token.tokenId));
        dispatch(updateShouldRequest(false));
        saveToLocal(history);
      } else {
        let pendingTxList = getPendingTxList(address).catch((err) => err);
        let gqlTxList = getTxHistory(address).catch((err) => err);
        txResponse = await Promise.all([
          gqlTxList,
          pendingTxList,
          zkAppTxList,
          getZkAppPending,
        ]).catch((err) => err);
        let dataStatus_tx = txResponse[0]?.address == currentAccount.address;
        let dataStatus_txPending =
          txResponse[1]?.address == currentAccount.address;

        let zkStatus = txResponse[2]?.address == currentAccount.address;
        let zkPendingStatus = txResponse[3]?.address == currentAccount.address;

        let txList = dataStatus_tx ? txResponse[0].txList : [];
        let txPendingList = dataStatus_txPending ? txResponse[1].txList : [];
        let zkAppList = zkStatus ? txResponse[2].txList : [];
        let zkPendingList = zkPendingStatus ? txResponse[3].txList : [];
        let history = {};
        if (dataStatus_tx) {
          history.txList = txList;
        }
        if (dataStatus_txPending) {
          history.txPendingList = txPendingList;
        }
        if (zkStatus) {
          history.zkAppList = zkAppList;
        }
        if (zkPendingStatus) {
          history.zkPendingList = zkPendingList;
        }
        dispatch(updateAccountTxV2(history, token.tokenId));
        dispatch(updateShouldRequest(false));
        saveToLocal(history);
      }
      
      isFirstRequest.current = false;
      setShowLoading(false);
      isRequest = false;
    },
    [currentAccount.address, isFungibleToken, token.tokenId, saveToLocal]
  );

  const onClickRefresh = useCallback(() => {
    dispatch(updateShouldRequest(true, true));
  }, [requestHistory]);

  useEffect(() => {
    requestHistory();
  }, []);

  useEffect(() => {
    if (shouldRefresh) {
      requestHistory();
    }
  }, [shouldRefresh, requestHistory]);

  useEffect(() => {
    if (shouldRefresh) {
      fetchAccountData();
    }
  }, [shouldRefresh, fetchAccountData]);
 
  useEffect(() => {
    let onMessageListening = (message, sender, sendResponse) => {
      const { type, action, hash } = message;
      if (
        type === FROM_BACK_TO_RECORD &&
        action === TX_SUCCESS
      ) {
        dispatch(updateShouldRequest(true, true));
        sendResponse();
      }
      return true;
    };
    extension.runtime.onMessage.addListener(onMessageListening);
    return () => {
      extension.runtime.onMessage.removeListener(onMessageListening);
    };
  }, []);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return (
    <CustomViewV2
      title={tokenSymbol}
      subTitle={tokenName}
      copyContent={isFungibleToken ? token.tokenId : ""}
    >
      <StyledTopWrapper>
        <TokenIcon
          iconUrl={tokenIconUrl}
          tokenSymbol={tokenSymbol}
          size={"50px"}
        />
        <StyledBalanceRow>{displayBalance}</StyledBalanceRow>
        <StyledAmountRow>{displayAmount}</StyledAmountRow>
        <StyledActionRow>
          <TokenAction type={token_action_type.send} isFungibleToken={isFungibleToken} />
          <TokenAction type={token_action_type.receive} isFungibleToken={isFungibleToken}/>
          {!isFungibleToken && (
            <TokenAction type={token_action_type.delegation} isFungibleToken={isFungibleToken}/>
          )}
        </StyledActionRow>
      </StyledTopWrapper>
      <StyledHistoryWrapper>
        <HistoryHeader
          showRefresh={!!currentNode.gqlTxUrl && showTxHistory.length > 0}
          isRefresh={shouldRefresh}
          onClickRefresh={onClickRefresh}
        />
        {showLoading ? (
          <LoadingView />
        ) : showTxHistory.length !== 0 ? (
          <TxListView history={showTxHistory} tokenInfo={token} />
        ) : isNaturalNumber(mainTokenNetInfo?.inferredNonce) ? (
          <TxNotSupportView />
        ) : (
          <EmptyTxListView />
        )}
      </StyledHistoryWrapper>

      <Clock
        schemeEvent={() => {
          requestHistory();
          fetchAccountData();
        }}
      />
    </CustomViewV2>
  );
};

const token_action_type = {
  send: "send",
  receive: "receive",
  delegation: "delegation",
};
const StyledActionTitle = styled.div`
  color: #594af1;
  text-align: center;
  font-size: 12px;
  font-weight: 400;
  margin-top: 4px;
`;
const rotateCss = css`
  -webkit-transform: rotate(180deg);
  -moz-transform: rotate(180deg);
  -o-transform: rotate(180deg);
  -ms-transform: rotate(180deg);
  transform: rotate(180deg);
`;
const StyledIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  ${(props) => props.rotate == "true" && rotateCss}
`;

const StyledActionItemWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  min-width: 50px;
  padding: 4px 0px;
  cursor: pointer;
  &:hover {
    ${StyledIconWrapper} {
      border-radius: 100%;
      filter: brightness(95%); // Darkens the image by 5%
    }

    ${StyledActionTitle} {
      color: #5045c7; // Darkened #594af1 by 5%
    }
  }
`;

export const TokenAction = ({ type,isFungibleToken }) => {
  const history = useHistory();
  const { title, nextRouter, actionIconUrl, isReceive } = useMemo(() => {
    let title = "";
    let nextRouter = "";
    let actionIconUrl = "";
    let isReceive = false;
    switch (type) {
      case token_action_type.send:
        title = i18n.t("send");
        nextRouter = "send_page";
        actionIconUrl = "img/tx_send2.svg";
        break;
      case token_action_type.receive:
        title = i18n.t("receive");
        nextRouter = "receive_page";
        actionIconUrl = "img/tx_send2.svg";
        isReceive = true;
        break;
      case token_action_type.delegation:
        title = i18n.t("staking");
        nextRouter = "staking";
        actionIconUrl = "img/tx_delegation.svg";
        break;

      default:
        break;
    }
    return { title, nextRouter, actionIconUrl, isReceive };
  }, [type]);
  const onClickActionBtn = useCallback(() => {
    history.push({
      pathname: nextRouter,
      params: { isFromTokenPage: true,isFungibleToken },
    });
  }, [nextRouter,isFungibleToken]);
  return (
    <StyledActionItemWrapper onClick={onClickActionBtn}>
      <StyledIconWrapper rotate={String(isReceive)}>
        <img src={actionIconUrl} />
      </StyledIconWrapper>
      <StyledActionTitle>{title}</StyledActionTitle>
    </StyledActionItemWrapper>
  );
};

export default TokenDetail;
