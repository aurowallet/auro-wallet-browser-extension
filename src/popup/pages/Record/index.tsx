import SvgIcon from "@/popup/component/SvgIcon";
import browser from "webextension-polyfill";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import { useLocation } from "react-router-dom";
import styled, { css } from "styled-components";
import { MAIN_COIN_CONFIG, ZK_DEFAULT_TOKEN_ID } from "../../../constant";
import { FROM_BACK_TO_RECORD, TX_SUCCESS } from "../../../constant/msgTypes";
import { updateShouldRequest } from "../../../reducers/accountReducer";
import { openTab } from "../../../utils/commonMsg";
import {
  decodeMemo,
  getBalanceForUI,
  getShowTime,
  getTimeGMT,
} from "../../../utils/utils";
import { copyText } from "../../../utils/browserUtils";
import CustomView from "../../component/CustomView";
import Toast from "../../component/Toast";
import { getZkAppUpdateInfo } from "../../../utils/zkUtils";
import {
  StyledContainer,
  StyledDividedLine,
  StyledRowContainer,
  StyledRowTitle,
  StyledRowContent,
  StyledScamTag,
  StyledExplorerOuter,
  StyledExplorerContainer,
  StyledExplorerTitle,
} from "./index.styled";

const STATUS = {
  TX_STATUS_PENDING: "PENDING",
  TX_STATUS_INCLUDED: "INCLUDED",
  TX_STATUS_UNKNOWN: "UNKNOWN",

  TX_STATUS_SUCCESS: "applied",
  TX_STATUS_FAILED: "failed",
};
const StyledWrapper = styled.div`
  overflow-y: auto;
  height: calc(100% - 130px);
`;

const Record = () => {

  const location = useLocation();
  const netConfig = useAppSelector((state) => state.network);
  const currentAccount = useAppSelector(
    (state) => state.accountInfo.currentAccount
  );
  const dispatch = useAppDispatch();

  const { txDetail, tokenInfo } = useMemo(() => {
    let params = location.state || {};
    let txDetail = params?.txDetail || {};
    let tokenInfo = params?.tokenInfo || {};
    return {
      txDetail,
      tokenInfo,
    };
  }, [location]);

  const { contentList, isZkReceive, isMainCoin } = useMemo(() => {
    let kindLow = txDetail.kind?.toLowerCase();
    let typeCamelCase = kindLow !== "zkapp";
    let isMainCoin = tokenInfo?.tokenBaseInfo?.isMainToken;
    let showAmount: string | number = 0;
    let showFrom = txDetail.from;
    let showTo;
    let isZkReceive;
    if (isMainCoin) {
      if (!typeCamelCase) {
        const accountUpdates = txDetail.body.zkappCommand.accountUpdates;
        const result = getZkAppUpdateInfo(
          accountUpdates,
          currentAccount?.address || '',
          txDetail.from as string,
          ZK_DEFAULT_TOKEN_ID
        );
        let showAmountStr = getBalanceForUI(
          result.totalBalanceChange,
          MAIN_COIN_CONFIG.decimals,
          MAIN_COIN_CONFIG.decimals
        );
        showAmount = showAmountStr + " " + MAIN_COIN_CONFIG.symbol;
        showTo = result.to;
        showFrom = result.from;
      } else {
        showAmount =
          String(getBalanceForUI(
            txDetail.amount,
            MAIN_COIN_CONFIG.decimals,
            MAIN_COIN_CONFIG.decimals
          )) +
          " " +
          MAIN_COIN_CONFIG.symbol;
        showTo = txDetail.to;
      }
    } else {
      const accountUpdates = txDetail.body.zkappCommand?.accountUpdates;
      const result = getZkAppUpdateInfo(
        accountUpdates,
        currentAccount?.address || '',
        txDetail.from as string,
        tokenInfo.tokenId
      );
      const tokenDecimal = tokenInfo?.tokenBaseInfo?.decimals;
      let showAmountStr2 = getBalanceForUI(
        result?.totalBalanceChange,
        tokenDecimal,
        tokenDecimal
      );
      showAmount = showAmountStr2 + " " + tokenInfo?.tokenNetInfo?.tokenSymbol;
      showTo = result.to;
      showFrom = result.from;
    }

    let memo = txDetail.memo || "";
    let fee =
      getBalanceForUI(
        txDetail.fee,
        MAIN_COIN_CONFIG.decimals,
        MAIN_COIN_CONFIG.decimals
      ) +
      " " +
      MAIN_COIN_CONFIG.symbol;
    let txTime = txDetail.dateTime ? getShowTime(txDetail.dateTime) : "";
    let nonce = String(txDetail.nonce);
    let txHash = txDetail.hash;
    let txType = txDetail.kind;
    if (kindLow == "stake_delegation") {
      txType = "delegation";
    }

    let contentList = [
      {
        title: i18n.t("txType"),
        content: txType,
        isCamelCase: typeCamelCase,
      },
      {
        title: i18n.t("amount"),
        content: showAmount,
      },
      {
        title: i18n.t("to"),
        content: showTo,
      },
      {
        title: i18n.t("from"),
        content: showFrom,
        showScamTag: txDetail.isFromAddressScam,
      },
    ];
    let showMemo = decodeMemo(memo);
    if (showMemo) {
      contentList.push({
        title: "Memo",
        content: showMemo,
      });
    }
    contentList.push(
      {
        title: "Nonce",
        content: nonce,
      },
      {
        title: i18n.t("fee"),
        content: fee,
      }
    );

    if (txTime) {
      contentList.push({
        title: i18n.t("time"),
        content: txTime + " " + getTimeGMT(txDetail.dateTime),
      });
    }
    contentList.push({
      title: i18n.t("transactionHash"),
      content: txHash,
    });
    return {
      contentList,
      isZkReceive,
      isMainCoin,
    };
  }, [i18n, txDetail, tokenInfo, currentAccount]);

  const getExplorerUrl = useCallback(() => {
    let currentNode = netConfig.currentNode;
    return currentNode.explorer;
  }, [netConfig]);

  const [showExplorer, setShowExplorer] = useState(() => {
    return !!getExplorerUrl();
  });

  useEffect(() => {
    setShowExplorer(!!getExplorerUrl());
  }, [netConfig.currentNode]);

  const onGoExplorer = useCallback(() => {
    let url = getExplorerUrl() + "/tx/" + txDetail.hash;
    openTab(url);
  }, [netConfig, txDetail]);

  useEffect(() => {
    let onMessageListening = (message: { type: string; action: string; hash: string }, sender: browser.Runtime.MessageSender, sendResponse: () => void) => {
      const { type, action, hash } = message;
      if (
        type === FROM_BACK_TO_RECORD &&
        action === TX_SUCCESS &&
        hash === txDetail.hash
      ) {
        dispatch(updateShouldRequest(true, true));
        sendResponse();
        return true;
      }
      return false;
    };
    browser.runtime.onMessage.addListener(onMessageListening as Parameters<typeof browser.runtime.onMessage.addListener>[0]);
    return () => {
      browser.runtime.onMessage.removeListener(onMessageListening as Parameters<typeof browser.runtime.onMessage.removeListener>[0]);
    };
  }, []);

  return (
    <CustomView title={i18n.t("details")} ContentWrapper={StyledContainer}>
      <StatusRow
        txDetail={txDetail}
        isZkReceive={isZkReceive}
        isMainCoin={isMainCoin}
      />
      <StyledDividedLine />
      <StyledWrapper>
        {contentList.map((item, index) => {
          return <DetailRow key={index} {...item} />;
        })}
      </StyledWrapper>
      {showExplorer && (
        <StyledExplorerOuter>
          <StyledExplorerContainer onClick={onGoExplorer}>
            <StyledExplorerTitle>{i18n.t("queryDetails")}</StyledExplorerTitle>
            <img src="/img/icon_link.svg" />
          </StyledExplorerContainer>
        </StyledExplorerOuter>
      )}
    </CustomView>
  );
};

interface DetailRowProps {
  title?: string;
  content?: string | number;
  showScamTag?: boolean;
  isCamelCase?: boolean;
}

const DetailRow = ({ title, content, showScamTag, isCamelCase }: DetailRowProps) => {
  const onCopy = useCallback(() => {
    copyText(String(content || '')).then(() => {
      Toast.info(i18n.t("copySuccess"));
    });
  }, [title, content]);

  return (
    <StyledRowContainer onClick={onCopy}>
      <StyledRowTitle>{title}</StyledRowTitle>
      <StyledRowContent $camelCase={isCamelCase}>
        {content}
        {showScamTag && <StyledScamTag>{i18n.t("scam")}</StyledScamTag>}
      </StyledRowContent>
    </StyledRowContainer>
  );
};
const STATUS_COLOR = {
  pending: "#E4B200",
  applied: "#0DB27C",
  failed: "#D65A5A",
};

const rotateCss = css`
  -webkit-transform: rotate(180deg);
  -moz-transform: rotate(180deg);
  -o-transform: rotate(180deg);
  -ms-transform: rotate(180deg);
  transform: rotate(180deg);
`;
const StyledRowWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  margin-bottom: 10px;
`;
interface StyledIconWrapperProps {
  $rotate?: string;
}
const StyledIconWrapper = styled.div<StyledIconWrapperProps>`
  ${(props) => props.$rotate == "true" && rotateCss}
`;
const StyledTitle = styled.div`
  font-weight: 600;
  font-size: 14px;
  margin-top: 10px;
`;
interface StatusRowProps {
  txDetail?: Record<string, unknown>;
  isMainCoin?: boolean;
  isZkReceive?: boolean;
}

const StatusRow = ({ txDetail, isMainCoin, isZkReceive }: StatusRowProps) => {
  const currentAccount = useAppSelector(
    (state) => state.accountInfo.currentAccount
  );
  const { statusTitle, StatusIcon, isReceive, icon_color } = useMemo(() => {
    let statusTitle = "";
    let icon_color = "";
    let StatusIcon = <></>;
    let isReceive = false;

    if (txDetail?.status === STATUS.TX_STATUS_PENDING) {
      statusTitle = i18n.t("PENDING");
      icon_color = STATUS_COLOR.pending;
    } else {
      if (txDetail?.failureReason) {
        statusTitle = i18n.t("FAILED");
        icon_color = STATUS_COLOR.failed;
      } else {
        statusTitle = i18n.t("APPLIED");
        icon_color = STATUS_COLOR.applied;
      }
    }

    let typeCamelCase = (txDetail?.kind as string)?.toLowerCase();
    switch (typeCamelCase) {
      case "payment":
        StatusIcon = <SvgIcon src="/img/icon_tx_payment.svg" color={icon_color} />;
        isReceive =
          (txDetail?.to as string)?.toLowerCase() === currentAccount?.address?.toLowerCase();
        break;
      case "delegation":
      case "stake_delegation":
        StatusIcon = <SvgIcon src="/img/icon_tx_delegation.svg" color={icon_color} />;
        break;
      case "zkapp":
        StatusIcon = <SvgIcon src="/img/icon_tx_zkapp.svg" color={icon_color} />;
        if (!isMainCoin) {
          StatusIcon = <SvgIcon src="/img/icon_tx_payment.svg" color={icon_color} />;
          isReceive = isZkReceive ?? false;
        }
        break;
      default:
        break;
    }
    return {
      statusTitle,
      StatusIcon,
      isReceive,
      icon_color,
    };
  }, [txDetail, currentAccount, isMainCoin, isZkReceive]);

  return (
    <StyledRowWrapper>
      <StyledIconWrapper $rotate={String(isReceive)}>
        {StatusIcon}
      </StyledIconWrapper>
      <StyledTitle style={{ color: icon_color }} color={icon_color}>
        {statusTitle}
      </StyledTitle>
    </StyledRowWrapper>
  );
};

export default Record;
