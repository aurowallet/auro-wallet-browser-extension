import {
  getGqlTxHistory,
  getPendingTxList,
  getZkAppPendingTx,
  getZkAppTxHistory,
} from "@/background/api";
import { MAIN_COIN_CONFIG, ZK_DEFAULT_TOKEN_ID } from "@/constant";
import Clock from "@/popup/component/Clock";
import CustomViewV2 from "@/popup/component/CustomViewV2";
import {
  updateAccountTx,
  updateShouldRequest,
} from "@/reducers/accountReducer";
import {
  addressSlice,
  amountDecimals,
  getAmountForUI,
  getDisplayAmount,
  getNetTypeNotSupportHistory,
} from "@/utils/utils";
import BigNumber from "bignumber.js";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import styled, { css } from "styled-components";
import { HistoryHeader, LoadingView } from "../Wallet/component/StatusView";
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
  const txList = useSelector((state) => state.accountInfo.txList);
  const cache = useSelector((state) => state.cache);
  const currencyConfig = useSelector((state) => state.currencyConfig);
  const currentConfig = useSelector((state) => state.network.currentConfig);
  const currentAccount = useSelector(
    (state) => state.accountInfo.currentAccount
  );
  const netType = currentConfig?.netType;
  const dispatch = useDispatch();
  const isMounted = useRef(true);

  const [txRefreshStatus, setTxRefreshStatus] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const [showHistoryStatus, setShowHistoryStatus] = useState(() => {
    return !getNetTypeNotSupportHistory(netType);
  });

  const {
    tokenUrl,
    tokenSymbol,
    displayBalance,
    displayAmount,
    tokenName,
    isFungibleToken,
  } = useMemo(() => {
    const isFungibleToken = ZK_DEFAULT_TOKEN_ID !== token.tokenId;

    let tokenUrl;
    let tokenSymbol = "xx";
    let tokenName = "aaa";
    if (isFungibleToken) {
      tokenName = addressSlice(token.tokenId, 6);
    } else {
      tokenUrl = "img/mina_color.svg";
      tokenSymbol = MAIN_COIN_CONFIG.symbol;
      tokenName = MAIN_COIN_CONFIG.name;
    }
    let amount = amountDecimals(
      token?.balance?.total || 0,
      MAIN_COIN_CONFIG.decimals
    );
    let displayBalance = getDisplayAmount(amount) + " " + tokenSymbol;

    let displayAmount = "";
    if (cache.currentPrice) {
      displayAmount = new BigNumber(cache.currentPrice)
        .multipliedBy(amount)
        .toString();

      displayAmount =
        "≈ " +
        currencyConfig.currentCurrency.symbol +
        getAmountForUI(displayAmount, 0, 2);
    }

    return {
      tokenUrl,
      token,
      isFungibleToken,
      tokenSymbol,
      tokenName,
      displayBalance,
      displayAmount,
    };
  }, [token]);

  const requestHistory = useCallback(
    async (address = currentAccount.address) => {
      if (!getNetTypeNotSupportHistory(netType)) {
        let pendingTxList = getPendingTxList(address);
        let gqlTxList = getGqlTxHistory(address);
        let zkAppTxList = getZkAppTxHistory(address);
        let getZkAppPending = getZkAppPendingTx(address);
        await Promise.all([
          gqlTxList,
          pendingTxList,
          zkAppTxList,
          getZkAppPending,
        ])
          .then((data) => {
            let newList = data[0];
            let txPendingData = data[1];
            let zkApp = data[2];
            let txPendingList = txPendingData.txList;
            let zkPendingList = data[3];
            dispatch(
              updateAccountTx(newList, txPendingList, zkApp, zkPendingList)
            );
          })
          .finally(() => {
            if (isMounted.current) {
              setTxRefreshStatus(false);
              dispatch(updateShouldRequest(false));
              setLoadingStatus(false);
            }
          });
      }
    },
    [currentAccount.address, netType]
  );

  useEffect(() => {
    if (getNetTypeNotSupportHistory(netType)) {
      setShowHistoryStatus(false);
      setLoadingStatus(false);
    } else {
      setShowHistoryStatus(true);
    }
  }, [netType]);

  const onClickRefresh = useCallback(() => {
    setTxRefreshStatus(true);
    requestHistory();
  }, []);

  useEffect(() => {
    requestHistory();
  }, []);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return (
    <CustomViewV2 title={tokenSymbol} subTitle={tokenName}>
      <StyledTopWrapper>
        <TokenIcon iconUrl={tokenUrl} tokenName={tokenName} size={"50px"} />
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
          showRefresh={showHistoryStatus}
          isRefresh={txRefreshStatus}
          onClickRefresh={onClickRefresh}
        />
        {loadingStatus ? <LoadingView /> : <TxListView history={txList} />}
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
