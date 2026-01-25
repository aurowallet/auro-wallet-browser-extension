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
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import { useNavigate } from "react-router-dom";
import styled, { css } from "styled-components";
import browser from "webextension-polyfill";
import {
  getAllTxHistory,
  getPendingTxList,
  getZkAppPendingTx,
} from "../../../background/api";
import { FROM_BACK_TO_RECORD, TX_SUCCESS } from "../../../constant/msgTypes";
import useFetchAccountData from "../../../hooks/useUpdateAccount";
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
const StyledHistoryWrapper = styled.div`
  box-sizing: content-box;
`;

const TokenDetail = () => {
  const token = useAppSelector((state) => state.cache.nextTokenDetail);
  const tokenList = useAppSelector((state) => state.accountInfo.tokenList);
  const nextTokenInfo = useMemo(() => {
    let tokenInfo = tokenList.find((item) => item.tokenId === token?.tokenId);
    if (!tokenInfo) {
      return token;
    }
    return tokenInfo;
  }, [tokenList, token]);

  const txHistoryMap = useAppSelector((state) => state.accountInfo.txHistoryMap);
  const currencyConfig = useAppSelector((state) => state.currencyConfig);
  const currentNode = useAppSelector((state) => state.network.currentNode);
  const currentAccount = useAppSelector(
    (state) => state.accountInfo.currentAccount
  );
  const mainTokenNetInfo = useAppSelector(
    (state) => state.accountInfo.mainTokenNetInfo
  );
  const dispatch = useAppDispatch();
  const isMounted = useRef(true);
  const shouldRefresh = useAppSelector((state) => state.accountInfo.shouldRefresh);
  const { fetchAccountData } = useFetchAccountData(currentAccount as Parameters<typeof useFetchAccountData>[0]);

  const [showLoading, setShowLoading] = useState(true);

  const isSilentRefresh = useAppSelector(
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
    const tokenBaseInfo = nextTokenInfo?.tokenBaseInfo as { isMainToken?: boolean; iconUrl?: string; showBalance?: string; decimals?: number; showAmount?: string } | undefined;
    const tokenNetInfo = nextTokenInfo?.tokenNetInfo as { tokenSymbol?: string } | undefined;
    
    const isFungibleToken = !tokenBaseInfo?.isMainToken;

    let tokenIconUrl = tokenBaseInfo?.iconUrl;
    let tokenSymbol;
    let tokenName;
    if (isFungibleToken) {
      tokenSymbol =
        tokenNetInfo?.tokenSymbol && tokenNetInfo.tokenSymbol.length > 0
          ? tokenNetInfo.tokenSymbol
          : "UNKNOWN";
      tokenName = addressSlice(String(nextTokenInfo?.tokenId || ""), 6);
    } else {
      tokenSymbol = MAIN_COIN_CONFIG.symbol;
      tokenName = MAIN_COIN_CONFIG.name;
    }

    let displayBalance =
      getBalanceForUI(
        tokenBaseInfo?.showBalance || "",
        0,
        tokenBaseInfo?.decimals || 0
      ) +
      " " +
      tokenSymbol;

    let displayAmount = tokenBaseInfo?.showAmount || "";
    if (tokenBaseInfo?.showAmount) {
      displayAmount =
        currencyConfig.currentCurrency.symbol +
        " " +
        getAmountForUI(displayAmount, 0, 2);
    }

    return {
      tokenIconUrl,
      token: nextTokenInfo,
      isFungibleToken,
      tokenSymbol,
      tokenName,
      displayBalance,
      displayAmount,
    };
  }, [nextTokenInfo]);

  const showTxHistory = useMemo(() => {
    const tokenId = String(token?.tokenId || "");
    let list = txHistoryMap[tokenId] || [];
    return list;
  }, [txHistoryMap, token?.tokenId]);

  useEffect(() => {
    if (showTxHistory.length == 0 && isFirstRequest.current) {
      setShowLoading(true);
    } else if (showTxHistory.length > 0) {
      setShowLoading(false);
    }
  }, [showTxHistory]);

  const saveToLocal = useCallback(
    (newHistory: Record<string, unknown>[]) => {
      const address = currentAccount.address || "";
      const txHistory = getLocal(LOCAL_CACHE_KEYS.ALL_TX_HISTORY_V2);
      const currentHistory = JSON.parse(txHistory || '{}');
      if (currentHistory?.[address]) {
        let newSaveHistory = {
          ...currentHistory[address],
          [token.tokenId as string]: newHistory,
        };
        saveLocal(
          LOCAL_CACHE_KEYS.ALL_TX_HISTORY_V2,
          JSON.stringify({
            [address]: newSaveHistory,
          })
        );
      } else {
        saveLocal(
          LOCAL_CACHE_KEYS.ALL_TX_HISTORY_V2,
          JSON.stringify({
            [address]: {
              [token.tokenId as string]: newHistory,
            },
          })
        );
      }
    },
    [currentAccount.address, token.tokenId]
  );
  const requestHistory = useCallback(
    async (address = currentAccount.address || "") => {
      if (isRequest) {
        return;
      }
      isRequest = true;
      let fullTxRequest = getAllTxHistory(address, token.tokenId as string).catch(
        (err) => err
      );
      let getZkAppPendingRequest = getZkAppPendingTx(
        address
      ).catch((err) => err);
      let txResponse;
      if (isFungibleToken) {
        txResponse = await Promise.all([fullTxRequest, getZkAppPendingRequest]);
        let zkStatus = txResponse[0]?.address == currentAccount.address;
        let zkPendingStatus = txResponse[1]?.address == currentAccount.address;
        let fullTxList = zkStatus ? txResponse[0].txList : [];
        let zkPendingList = zkPendingStatus ? txResponse[1].txList : [];

        let history: { fullTxList?: unknown[]; zkPendingList?: unknown[]; txPendingList?: unknown[] } = {};
        if (zkStatus) {
          history.fullTxList = fullTxList;
        }
        if (zkPendingStatus) {
          history.zkPendingList = zkPendingList;
        }
        dispatch(updateAccountTxV2(history as Parameters<typeof updateAccountTxV2>[0], token.tokenId as string));
        dispatch(updateShouldRequest(false));
        saveToLocal(history as Record<string, unknown>[]);
      } else {
        let pendingTxRequest = getPendingTxList(address).catch((err) => err);
        txResponse = await Promise.all([
          pendingTxRequest,
          getZkAppPendingRequest,
          fullTxRequest,
        ]).catch((err) => err);
        let dataStatus_txPending =
          txResponse[0]?.address == currentAccount.address;
        let zkPendingStatus = txResponse[1]?.address == currentAccount.address;
        let dataStatus_tx = txResponse[2]?.address == currentAccount.address;
        let txPendingList = dataStatus_txPending ? txResponse[0].txList : [];
        let zkPendingList = zkPendingStatus ? txResponse[1].txList : [];
        let fullTxList = dataStatus_tx ? txResponse[2].txList : [];
        let history: { fullTxList?: unknown[]; zkPendingList?: unknown[]; txPendingList?: unknown[] } = {};
        if (dataStatus_txPending) {
          history.txPendingList = txPendingList;
        }
        if (dataStatus_tx) {
          history.fullTxList = fullTxList;
        }
        if (zkPendingStatus) {
          history.zkPendingList = zkPendingList;
        }
        dispatch(updateAccountTxV2(history as Parameters<typeof updateAccountTxV2>[0], token.tokenId as string));
        dispatch(updateShouldRequest(false));
        saveToLocal(history as Record<string, unknown>[]);
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
    let onMessageListening = (message: { type: string; action: string; hash?: string }, sender: browser.Runtime.MessageSender, sendResponse: () => void) => {
      const { type, action, hash } = message;
      if (type === FROM_BACK_TO_RECORD && action === TX_SUCCESS) {
        dispatch(updateShouldRequest(true, true));
        sendResponse();
      }
      return true;
    };
    browser.runtime.onMessage.addListener(onMessageListening as Parameters<typeof browser.runtime.onMessage.addListener>[0]);
    return () => {
      browser.runtime.onMessage.removeListener(onMessageListening as Parameters<typeof browser.runtime.onMessage.removeListener>[0]);
    };
  }, []);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const { showStaking } = useMemo(() => {
    const networkID = currentNode.networkID;
    let showStaking = networkID?.startsWith("mina");
    return {
      showStaking,
    };
  }, [currentNode.networkID]);

  return (
    <CustomViewV2
      title={tokenSymbol}
      subTitle={tokenName}
      copyContent={isFungibleToken ? (token.tokenId as string) : ""}
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
          <TokenAction
            type={token_action_type.send}
            isFungibleToken={isFungibleToken}
          />
          <TokenAction
            type={token_action_type.receive}
            isFungibleToken={isFungibleToken}
          />
          {!isFungibleToken && showStaking && (
            <TokenAction
              type={token_action_type.delegation}
              isFungibleToken={isFungibleToken}
            />
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
          <TxListView history={showTxHistory as Parameters<typeof TxListView>[0]["history"]} tokenInfo={token} />
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
interface StyledIconWrapperProps {
  rotate?: string;
}

const StyledIconWrapper = styled.div<StyledIconWrapperProps>`
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

interface TokenActionProps {
  type: string;
  isFungibleToken?: boolean;
}

export const TokenAction = ({ type, isFungibleToken }: TokenActionProps) => {
  const navigate = useNavigate();
  const { title, nextRouter, actionIconUrl, isReceive } = useMemo(() => {
    let title = "";
    let nextRouter = "";
    let actionIconUrl = "";
    let isReceive = false;
    switch (type) {
      case token_action_type.send:
        title = i18n.t("send");
        nextRouter = "/send_page";
        actionIconUrl = "img/tx_send2.svg";
        break;
      case token_action_type.receive:
        title = i18n.t("receive");
        nextRouter = "/receive_page";
        actionIconUrl = "img/tx_send2.svg";
        isReceive = true;
        break;
      case token_action_type.delegation:
        title = i18n.t("staking");
        nextRouter = "/staking";
        actionIconUrl = "img/tx_delegation.svg";
        break;

      default:
        break;
    }
    return { title, nextRouter, actionIconUrl, isReceive };
  }, [type]);
  const onClickActionBtn = useCallback(() => {
    navigate(nextRouter, { state: { isFromTokenPage: true, isFungibleToken } });
  }, [nextRouter, isFungibleToken]);
  return (
    <StyledActionItemWrapper onClick={onClickActionBtn}>
      <StyledIconWrapper rotate={String(isReceive)}>
        {actionIconUrl && <img src={actionIconUrl} />}
      </StyledIconWrapper>
      <StyledActionTitle>{title}</StyledActionTitle>
    </StyledActionItemWrapper>
  );
};

export default TokenDetail;
