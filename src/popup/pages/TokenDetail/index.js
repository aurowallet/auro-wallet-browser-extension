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
const StyledHistoryWrapper = styled.div``;

const TokenDetail = () => {
  const token = useSelector((state) => state.cache.nextTokenDetail);
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
    const isFungibleToken = !token.tokenBaseInfo.isMainToken;

    let tokenIconUrl;
    let tokenSymbol;
    let tokenName;
    if (isFungibleToken) {
      tokenSymbol = token?.tokenNetInfo?.tokenSymbol;
      tokenName = addressSlice(token.tokenId, 6);
    } else {
      tokenIconUrl = "img/mina_color.svg";
      tokenSymbol = MAIN_COIN_CONFIG.symbol;
      tokenName = MAIN_COIN_CONFIG.name;
    }

    let displayBalance = getBalanceForUI(token.tokenBaseInfo.showBalance);

    let displayAmount = token.tokenBaseInfo.showAmount || "";
    if (token.tokenBaseInfo.showAmount) {
      displayAmount =
        currencyConfig.currentCurrency.symbol +
        " " +
        getAmountForUI(displayAmount, 0, 2);
    }

    return {
      tokenIconUrl,
      token,
      isFungibleToken,
      tokenSymbol,
      tokenName,
      displayBalance,
      displayAmount,
    };
  }, [token]);

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
        saveToLocal(history);
      } else {
        let pendingTxList = getPendingTxList(address);
        let gqlTxList = getTxHistory(address);
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
        saveToLocal(history);
      }
      isFirstRequest.current = false;
      setShowLoading(false);
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
          <TokenAction type={token_action_type.send} />
          <TokenAction type={token_action_type.receive} />
          {!isFungibleToken && (
            <TokenAction type={token_action_type.delegation} />
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
          <TxListView history={showTxHistory} />
        ) : isNaturalNumber(mainTokenNetInfo.inferredNonce) ? (
          <TxNotSupportView />
        ) : (
          <EmptyTxListView />
        )}
      </StyledHistoryWrapper>

      <Clock
        schemeEvent={() => {
          requestHistory();
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
const StyledActionItemWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  min-width: 50px;
  padding: 4px 0px;
  cursor: pointer;
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;
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
export const TokenAction = ({ type }) => {
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
    history.push(nextRouter);
  }, []);
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
