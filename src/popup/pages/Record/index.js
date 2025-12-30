import IconDelegation from "@/popup/component/SVG/icon_delegation";
import IconPayment from "@/popup/component/SVG/icon_payment";
import IconZkApp from "@/popup/component/SVG/icon_zkApp";
import cls from "classnames";
import browser from 'webextension-polyfill';
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import {
  copyText,
} from "../../../utils/browserUtils";
import CustomView from "../../component/CustomView";
import Toast from "../../component/Toast";
import styles from "./index.module.scss";
import { getZkAppUpdateInfo } from "../../../utils/zkUtils";

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

const Record = ({}) => {
  const location = useLocation();
  const netConfig = useSelector((state) => state.network);
  const currentAccount = useSelector(
    (state) => state.accountInfo.currentAccount
  );
  const dispatch = useDispatch();

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
    let showAmount = 0;
    let showFrom = txDetail.from;
    let showTo;
    let isZkReceive;
    if (isMainCoin) {
      if (!typeCamelCase) {
        const accountUpdates = txDetail.body.zkappCommand.accountUpdates;
        const result = getZkAppUpdateInfo(
          accountUpdates,
          currentAccount.address,
          txDetail.from,
          ZK_DEFAULT_TOKEN_ID
        );
        showAmount = getBalanceForUI(
          result.totalBalanceChange,
          MAIN_COIN_CONFIG.decimals,
          MAIN_COIN_CONFIG.decimals
        );
        showAmount = showAmount + " " + MAIN_COIN_CONFIG.symbol;
        showTo = result.to;
        showFrom = result.from;
      } else {
        showAmount =
          getBalanceForUI(
            txDetail.amount,
            MAIN_COIN_CONFIG.decimals,
            MAIN_COIN_CONFIG.decimals
          ) +
          " " +
          MAIN_COIN_CONFIG.symbol;
        showTo = txDetail.to;
      }
    } else {
      const accountUpdates = txDetail.body.zkappCommand?.accountUpdates;
      const result = getZkAppUpdateInfo(
        accountUpdates,
        currentAccount.address,
        txDetail.from,
        tokenInfo.tokenId
      );
      const tokenDecimal = tokenInfo?.tokenBaseInfo?.decimals;
      showAmount = getBalanceForUI(
        result.totalBalanceChange,
        tokenDecimal,
        tokenDecimal
      );
      showAmount = showAmount + " " + tokenInfo?.tokenNetInfo?.tokenSymbol;
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
    let onMessageListening = (message, sender, sendResponse) => {
      const { type, action, hash } = message;
      if (
        type === FROM_BACK_TO_RECORD &&
        action === TX_SUCCESS &&
        hash === txDetail.hash
      ) {
        dispatch(updateShouldRequest(true, true));
        sendResponse();
      }
      return true;
    };
    browser.runtime.onMessage.addListener(onMessageListening);
    return () => {
      browser.runtime.onMessage.removeListener(onMessageListening);
    };
  }, []);

  return (
    <CustomView title={i18n.t("details")} contentClassName={styles.container}>
      <StatusRow
        txDetail={txDetail}
        isZkReceive={isZkReceive}
        isMainCoin={isMainCoin}
      />
      <div className={styles.dividedLine} />
      <StyledWrapper>
        {contentList.map((item, index) => {
          return <DetailRow key={index} {...item} />;
        })}
      </StyledWrapper>
      {showExplorer && (
        <div className={styles.explorerOuter}>
          <div className={styles.explorerContainer} onClick={onGoExplorer}>
            <p className={styles.explorerTitle}>{i18n.t("queryDetails")}</p>
            <img src="/img/icon_link.svg" className={styles.iconLink} />
          </div>
        </div>
      )}
    </CustomView>
  );
};

const DetailRow = ({ title, content, showScamTag, isCamelCase }) => {
  const onCopy = useCallback(() => {
    copyText(content).then(() => {
      Toast.info(i18n.t("copySuccess"));
    });
  }, [title, content]);

  return (
    <div className={styles.rowContainer} onClick={onCopy}>
      <p className={styles.rowTitle}>{title}</p>
      <p
        className={cls(styles.rowContent, {
          [styles.camelCase]: isCamelCase,
        })}
      >
        {content}
        {showScamTag && (
          <span className={styles.scamTag}>{i18n.t("scam")}</span>
        )}
      </p>
    </div>
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
const StyledIconWrapper = styled.div`
  ${(props) => props.rotate == "true" && rotateCss}
`;
const StyledTitle = styled.div`
  font-weight: 600;
  font-size: 14px;
  margin-top: 10px;
`;
const StatusRow = ({ txDetail, isMainCoin, isZkReceive }) => {
  const currentAccount = useSelector(
    (state) => state.accountInfo.currentAccount
  );
  const { statusTitle, StatusIcon, isReceive, icon_color } = useMemo(() => {
    let statusTitle = "";
    let icon_color = "";
    let StatusIcon = <></>;
    let isReceive = false;

    if (txDetail.status === STATUS.TX_STATUS_PENDING) {
      statusTitle = i18n.t("PENDING");
      icon_color = STATUS_COLOR.pending;
    } else {
      if (txDetail.failureReason) {
        statusTitle = i18n.t("FAILED");
        icon_color = STATUS_COLOR.failed;
      } else {
        statusTitle = i18n.t("APPLIED");
        icon_color = STATUS_COLOR.applied;
      }
    }

    let typeCamelCase = txDetail.kind?.toLowerCase();
    switch (typeCamelCase) {
      case "payment":
        StatusIcon = <IconPayment fill={icon_color} />;
        isReceive =
          txDetail.to.toLowerCase() === currentAccount.address.toLowerCase();
        break;
      case "delegation":
      case "stake_delegation":
        StatusIcon = <IconDelegation fill={icon_color} />;
        break;
      case "zkapp":
        StatusIcon = <IconZkApp fill={icon_color} />;
        if (!isMainCoin) {
          StatusIcon = <IconPayment fill={icon_color} />;
          isReceive = isZkReceive;
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
      <StyledIconWrapper rotate={String(isReceive)}>
        {StatusIcon}
      </StyledIconWrapper>
      <StyledTitle style={{ color: icon_color }} color={icon_color}>
        {statusTitle}
      </StyledTitle>
    </StyledRowWrapper>
  );
};

export default Record;
