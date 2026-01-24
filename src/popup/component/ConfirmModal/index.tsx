import i18n from "i18next";
import { ReactNode } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Button, { button_theme } from "../Button";

interface ContentItem {
  label: string;
  value: string;
  showTimer?: boolean;
}

interface ConfirmModalProps {
  modalVisible?: boolean;
  title?: string;
  highlightTitle?: string;
  highlightContent?: string;
  subHighlightContent?: string;
  contentList?: ContentItem[];
  onConfirm?: () => void;
  loadingStatus?: boolean;
  onClickClose?: () => void;
  waitingLedger?: boolean;
  showCloseIcon?: boolean;
  rightBtnCom?: ReactNode;
}
import CountdownTimer from "../CountdownTimer";
import LedgerStatusView from "../StatusView/LedgerStatusView";
import NetworkStatusView from "../StatusView/NetworkStatusView";
import {
  StyledOuterContainer,
  StyledInnerContent,
  StyledTitleRow,
  StyledRowTitle,
  StyledRowClose,
  StyledRightRow,
  StyledDividedLine,
  StyledBottomContent,
  StyledHighlightContainer,
  StyledHighlightTitle,
  StyledHighlightCon,
  StyledHighlightContent,
  StyledSubHighlightContent,
  StyledContentItemContainer,
  StyledContentTitle,
  StyledContentValue,
  StyledLedgerContent,
  StyledWaitingIcon,
  StyledWaitingTitle,
  StyledWaitingContent,
  StyledWaitingTip,
  StyledAccountRepeatName,
  StyledRedFont,
  StyledBottomContainer,
} from "./index.styled";

const StyledWrapper = styled.div`
  display: flex;
  align-items: center;
  margin: 4px 0px 0px;
`;

export const ConfirmModal = ({
  modalVisible = false,
  title = "",
  highlightTitle = "",
  highlightContent = "",
  subHighlightContent = "",
  contentList = [],
  onConfirm = () => {},
  loadingStatus = false,
  onClickClose = () => {},
  waitingLedger = false,
  showCloseIcon = false,
  rightBtnCom = <></>,
}: ConfirmModalProps) => {
  return (
    <>
      {modalVisible && (
        <StyledOuterContainer>
          <StyledInnerContent>
            <div>
              <StyledTitleRow>
                <StyledRowTitle>{title}</StyledRowTitle>
                {!waitingLedger && (
                  <StyledRightRow>
                    <LedgerStatusView />
                    <div style={{ marginRight: "6px" }} />
                    <NetworkStatusView />
                  </StyledRightRow>
                )}
                {showCloseIcon && (
                  <StyledRightRow>
                    <StyledRowClose
                      onClick={onClickClose}
                      src="/img/icon_nav_close.svg"
                    />
                  </StyledRightRow>
                )}
              </StyledTitleRow>
            </div>
            <StyledDividedLine />
            {waitingLedger && (
              <StyledLedgerContent>
                <StyledWaitingIcon src="/img/detail_pending.svg" />
                <StyledWaitingTitle>
                  {i18n.t("waitingLedgerConfirm") + "..."}
                </StyledWaitingTitle>
                <StyledWaitingContent>
                  {i18n.t("waitingLedgerConfirmTip")}
                </StyledWaitingContent>
                <StyledWaitingTip>
                  <Trans
                    i18nKey={"waitingLedgerConfirmTip_3"}
                    components={{
                      b: <StyledAccountRepeatName />,
                      red: <StyledRedFont />,
                    }}
                  />
                </StyledWaitingTip>
              </StyledLedgerContent>
            )}
            {!waitingLedger && (
              <StyledBottomContent>
                <StyledHighlightContainer>
                  <StyledHighlightTitle>{highlightTitle}</StyledHighlightTitle>
                  <StyledHighlightCon>
                    <StyledHighlightContent>
                      {highlightContent}
                    </StyledHighlightContent>
                    <StyledSubHighlightContent>
                      {subHighlightContent}
                    </StyledSubHighlightContent>
                  </StyledHighlightCon>
                </StyledHighlightContainer>
                {contentList.map((content, index) => (
                  <StyledContentItemContainer key={index}>
                    <StyledContentTitle>{content.label}</StyledContentTitle>
                    <StyledWrapper>
                      <StyledContentValue>{content.value}</StyledContentValue>
                      {content.showTimer && <CountdownTimer />}
                    </StyledWrapper>
                  </StyledContentItemContainer>
                ))}
              </StyledBottomContent>
            )}
            {!waitingLedger && (
              <StyledBottomContainer>
                <Button
                  onClick={onClickClose}
                  theme={button_theme.BUTTON_THEME_LIGHT}
                >
                  {i18n.t("cancel")}
                </Button>
                <Button loading={loadingStatus} onClick={onConfirm}>
                  <StyledWrapper>
                    {i18n.t("confirm")}
                    {rightBtnCom}
                  </StyledWrapper>
                </Button>
              </StyledBottomContainer>
            )}
          </StyledInnerContent>
        </StyledOuterContainer>
      )}
    </>
  );
};

export default ConfirmModal;
