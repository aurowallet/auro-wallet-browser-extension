import i18n from "i18next";
import styled, { css } from "styled-components";
import {
  StyledHistoryContainer,
  StyledLoadingCon,
  StyledRefreshLoading,
  StyledLoadingContent,
  StyledEmptyIcon,
  StyledEmptyContent,
} from "./index.styled";

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
  min-height: 22px;
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

interface StyledRefreshWrapperProps {
  $isRefresh?: boolean;
}

const StyledRefreshWrapper = styled.div<StyledRefreshWrapperProps>`
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

const StyledEmptyWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  min-height: 240px;

  font-weight: 400;
  font-size: 12px;
  line-height: 17px;
  color: rgba(0, 0, 0, 0.3);
`;
interface HistoryHeaderProps {
  isRefresh?: boolean;
  onClickRefresh?: () => void;
  showRefresh?: boolean;
}

export const HistoryHeader = ({ isRefresh, onClickRefresh, showRefresh }: HistoryHeaderProps) => {
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
    <StyledHistoryContainer>
      <StyledLoadingCon>
        <StyledRefreshLoading src="/img/loading_purple.svg" />
        <StyledLoadingContent>{i18n.t("loading") + "..."}</StyledLoadingContent>
      </StyledLoadingCon>
    </StyledHistoryContainer>
  );
};

export const TxNotSupportView = () => {
  return (
    <StyledEmptyWrapper>
      <StyledEmptyIcon src="/img/icon_empty.svg" />
      <StyledEmptyContent>{i18n.t("txHistoryTip")}</StyledEmptyContent>
    </StyledEmptyWrapper>
  );
};

export const EmptyTxListView = () => {
  return (
    <StyledEmptyWrapper>
      <StyledEmptyIcon src="/img/icon_empty.svg" />
      <StyledEmptyContent>{i18n.t("noTxHistory")}</StyledEmptyContent>
    </StyledEmptyWrapper>
  );
};
