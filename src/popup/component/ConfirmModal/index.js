import cls from "classnames";
import i18n from "i18next";
import { Trans } from "react-i18next";
import Button, { button_theme } from "../Button";
import LedgerStatusView from "../StatusView/LedgerStatusView";
import NetworkStatusView from "../StatusView/NetworkStatusView";
import styles from "./index.module.scss";

export const ConfirmModal = ({
  modalVisable = false,
  title = "",
  highlightTitle = "",
  highlightContent = "",
  subHighlightContent = "",

  contentList = [],

  onConfirm = () => {},
  loadingStatus = false,
  onClickClose = () => {},
  waitingLedger = false,
}) => {
  return (
    <>
      {modalVisable && (
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
              <div className={cls(styles.bottomContent, {})}>
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
                {contentList.map((content, index) => {
                  return (
                    <div key={index} className={styles.contentItemContainer}>
                      <p className={styles.contentTitle}>{content.label}</p>
                      <p className={styles.contentValue}>{content.value}</p>
                    </div>
                  );
                })}
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
                  {i18n.t("confirm")}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
