import IconDelegation from "@/popup/component/SVG/icon_delegation";
import IconPayment from "@/popup/component/SVG/icon_payment";
import IconZkApp from "@/popup/component/SVG/icon_zkApp";
import cls from "classnames";
import extension from "extensionizer";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import styled, { css } from "styled-components";
import { MAIN_COIN_CONFIG } from "../../../constant";
import { FROM_BACK_TO_RECORD, TX_SUCCESS } from "../../../constant/msgTypes";
import { updateShouldRequest } from "../../../reducers/accountReducer";
import { openTab } from "../../../utils/commonMsg";
import {
  copyText,
  decodeMemo,
  getAmountDisplay,
  getShowTime,
  getTimeGMT,
} from "../../../utils/utils";
import CustomView from "../../component/CustomView";
import Toast from "../../component/Toast";
import styles from "./index.module.scss";

const STATUS = {
  TX_STATUS_PENDING: "PENDING",
  TX_STATUS_INCLUDED: "INCLUDED",
  TX_STATUS_UNKNOWN: "UNKNOWN",

  TX_STATUS_SUCCESS: "applied",
  TX_STATUS_FAILED: "failed",
};

const Record = ({}) => {
  const netConfig = useSelector((state) => state.network);
  const dispatch = useDispatch();
  const history = useHistory();

  const txDetail = useMemo(() => {
    return history.location.params?.txDetail || {};
  }, [history]);

  const { contentList } = useMemo(() => {
    let amount =
      getAmountDisplay(
        txDetail.amount,
        MAIN_COIN_CONFIG.decimals,
        MAIN_COIN_CONFIG.decimals
      ) +
      " " +
      MAIN_COIN_CONFIG.symbol;
    let receiveAddress = txDetail.to;
    let sendAddress = txDetail.from;
    let memo = txDetail.memo || "";
    let fee =
      getAmountDisplay(
        txDetail.fee,
        MAIN_COIN_CONFIG.decimals,
        MAIN_COIN_CONFIG.decimals
      ) +
      " " +
      MAIN_COIN_CONFIG.symbol;
    let txTime = txDetail.dateTime ? getShowTime(txDetail.dateTime) : "";
    let nonce = String(txDetail.nonce);
    let txHash = txDetail.hash;
    let kindLow = txDetail.kind?.toLowerCase();
    let typeCamelCase = kindLow!== "zkapp";
    let txType = txDetail.kind
    if(kindLow == "stake_delegation"){
      txType = "delegation"
    }

    let contentList = [
      {
        title: i18n.t("txType"),
        content: txType,
        isCamelCase: typeCamelCase,
      },
      {
        title: i18n.t("amount"),
        content: amount,
      },
      {
        title: i18n.t("to"),
        content: receiveAddress,
      },
      {
        title: i18n.t("from"),
        content: sendAddress,
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
    contentList.push({
      title: i18n.t("fee"),
      content: fee,
    });

    if (txTime) {
      contentList.push({
        title: i18n.t("time"),
        content: txTime + " " + getTimeGMT(txDetail.dateTime),
      });
    }
    contentList.push(
      {
        title: "Nonce",
        content: nonce,
      },
      {
        title: i18n.t("transationHash"),
        content: txHash,
      }
    );
    return {
      contentList,
    };
  }, [i18n, txDetail]);

  const getExplorerUrl = useCallback(() => {
    let currentConfig = netConfig.currentConfig;
    return currentConfig.explorer;
  }, [netConfig]);

  const [showExplorer, setShowExplorer] = useState(() => {
    return !!getExplorerUrl();
  });

  useEffect(() => {
    setShowExplorer(!!getExplorerUrl());
  }, [netConfig.currentConfig]);

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
        setTxStatus(STATUS.TX_STATUS_INCLUDED);
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

  return (
    <CustomView title={i18n.t("details")} contentClassName={styles.container}>
      <StatusRow txDetail={txDetail} />
      <div className={styles.dividedLine} />
      {contentList.map((item, index) => {
        return <DetailRow key={index} {...item} />;
      }, [])}
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
const StatusRow = ({ txDetail }) => {
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
  }, [txDetail, currentAccount]);

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
