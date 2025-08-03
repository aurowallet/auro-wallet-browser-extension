import cls from "classnames";
import i18n from "i18next";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Button, { button_theme } from "../Button";
import CountdownTimer from "../CountdownTimer";
import LedgerStatusView from "../StatusView/LedgerStatusView";
import NetworkStatusView from "../StatusView/NetworkStatusView";
import styles from "./index.module.scss";

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
}) => {
  return (
    <>
      {modalVisible && (
        <div className={styles.outerContainer}>
          <div className={styles.innerContent}>
            <div className={styles.contentContainer}>
              <div className={styles.titleRow}>
                <span className={styles.rowTitle}>{title}</span>
                {!waitingLedger && (
                  <div className={styles.rightRow}>
                    <LedgerStatusView />
                    <div style={{ marginRight: "6px" }} />
                    <NetworkStatusView />
                  </div>
                )}
                {showCloseIcon && (
                  <div className={styles.rightRow}>
                    <img
                      onClick={onClickClose}
                      className={styles.rowClose}
                      src="/img/icon_nav_close.svg"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className={styles.dividedLine} />

            {waitingLedger && (
              <div className={styles.ledgerContent}>
                <img
                  className={styles.waitingIcon}
                  src="/img/detail_pending.svg"
                />
                <p className={styles.waitingTitle}>
                  {i18n.t("waitingLedgerConfirm") + "..."}
                </p>
                <p className={styles.waitingContent}>
                  {i18n.t("waitingLedgerConfirmTip")}
                </p>
                <p className={styles.waitingTip}>
                  <Trans
                    i18nKey={"waitingLedgerConfirmTip_3"}
                    components={{
                      b: <span className={styles.accountRepeatName} />,
                      red: <span className={styles.redFont} />,
                    }}
                  />
                </p>
              </div>
            )}

            {!waitingLedger && (
              <div className={cls(styles.bottomContent)}>
                <div className={styles.highlightContainer}>
                  <span className={styles.highlightTitle}>
                    {highlightTitle}
                  </span>
                  <div className={styles.highlightCon}>
                    <span className={styles.highlightContent}>
                      {highlightContent}
                    </span>
                    <p className={styles.subHighlightContent}>
                      {subHighlightContent}
                    </p>
                  </div>
                </div>
                {contentList.map((content, index) => (
                  <div key={index} className={styles.contentItemContainer}>
                    <p className={styles.contentTitle}>{content.label}</p>
                    <StyledWrapper>
                      <p className={styles.contentValue}>{content.value}</p>
                      {content.showTimer && <CountdownTimer />}
                    </StyledWrapper>
                  </div>
                ))}
              </div>
            )}

            {!waitingLedger && (
              <div className={styles.bottomContainer}>
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
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ConfirmModal;
