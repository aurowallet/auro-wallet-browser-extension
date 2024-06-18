import i18n from "i18next";
import styled, { css } from "styled-components";
import styles from "./index.module.scss";

const StyledHistoryHeadWrapper = styled.div`
  width: 100%;
  z-index: 2;
  padding: 8px 0px;
  position: sticky;
  top: 0;
  background: #ffffff;

  border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
`;
const StyledHistoryRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0px 20px;
`;

const StyledHistoryTitle = styled.div`
  font-size: 14px;
  line-height: 16px;
  font-weight: 600;
  text-align: center;
  color: #000000;
  text-transform: uppercase;
`;
const animationCss = css`
  transform-origin: 11px 11px;
  animation: refreshAni 0.8s infinite linear;

  @keyframes refreshAni {
    0% {
      transform: rotate(0);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const StyledRefreshWrapper = styled.div`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  ${(props) => props.$isRefresh && animationCss}

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;
const StyledRefreshIcon = styled.img`
  width: 100%;
  height: 100%;
  padding: 4px;
`;
export const HistoryHeader = ({ isRefresh, onClickRefresh, showRefresh }) => {
  return (
    <StyledHistoryHeadWrapper>
      <StyledHistoryRow>
        <StyledHistoryTitle>{i18n.t("history")}</StyledHistoryTitle>
        {showRefresh && (
          <StyledRefreshWrapper onClick={onClickRefresh} $isRefresh={isRefresh}>
            <StyledRefreshIcon src="/img/refresh.svg" />
          </StyledRefreshWrapper>
        )}
      </StyledHistoryRow>
    </StyledHistoryHeadWrapper>
  );
};

export const LoadingView = () => {
  return (
    <div className={styles.historyContainer}>
      <div className={styles.loadingCon}>
        <img className={styles.refreshLoading} src="/img/loading_purple.svg" />
        <p className={styles.loadingContent}>{i18n.t("loading") + "..."}</p>
      </div>
    </div>
  );
};

export const TxNotSupportView = () => {
  return (
    <StyledHistoryHeadWrapper>
      <StyledHistoryTitle>{i18n.t("history")}</StyledHistoryTitle>
      <div className={styles.emptyContainer}>
        <img src="/img/icon_empty.svg" className={styles.emptyIcon} />
        <span className={styles.emptyContent}>{i18n.t("txHistoryTip")}</span>
      </div>
    </StyledHistoryHeadWrapper>
  ); 
};


export const EmptyTxListView = () => {
  return (
    <StyledHistoryHeadWrapper>
      <StyledHistoryTitle>{i18n.t("history")}</StyledHistoryTitle>
      <div className={styles.emptyContainer}>
        <img src="/img/icon_empty.svg" className={styles.emptyIcon} />
        <span className={styles.emptyContent}>{i18n.t("noTxHistory")}</span>
      </div>
    </StyledHistoryHeadWrapper>
  ); 
};
