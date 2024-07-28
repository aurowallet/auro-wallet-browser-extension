/**
 * speed up and speed cancel modal
 */
import cls from "classnames";
import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { Trans } from "react-i18next";
import { MAIN_COIN_CONFIG } from "../../../constant";
import { AdvancedModal } from "../AdvancedModal";
import Button, { button_theme } from "../Button";
import LedgerStatusView from "../StatusView/LedgerStatusView";
import NetworkStatusView from "../StatusView/NetworkStatusView";
import styles from "./index.module.scss";

export const TransactionModalType = {
  speedUp: "SPEED_UP",
  cancel: "CANCEL",
};
export const TransactionModal = ({
  modalVisible = false,
  title = "",
  modalContent = "",
  onConfirm = () => {},
  onClickClose = () => {},

  currentFee = "",
  nextFee = "",
  modalType = "",
  currentNonce = "",
  btnLoading = false,
  waitingLedger = false,
}) => {
  const [advanceModalVisible, setAdvanceModalVisible] = useState(false);
  const [nextInputFee, setNextInputFee] = useState(nextFee);

  useEffect(() => {
    if (modalVisible && nextFee) {
      setNextInputFee(nextFee);
    }
  }, [nextFee, modalVisible]);

  const onClickAdvance = useCallback(() => {
    setAdvanceModalVisible(true);
  }, []);
  const onAdvanceConfirm = useCallback((nextFee) => {
    if (nextFee) {
      setNextInputFee(nextFee);
    }
    setAdvanceModalVisible(false);
  }, []);
  const onClickAdvanceClose = useCallback(() => {
    setAdvanceModalVisible(false);
  }, []);

  return (
    <>
      {modalVisible && (
        <div className={styles.outerContainer}>
          <div className={styles.innerContent}>
            <div className={styles.contentContainer}>
              <div className={styles.titleRow}>
                <span className={styles.rowTitle}>{title}</span>
                <div className={styles.rightRow}>
                  <LedgerStatusView />
                  <div style={{ marginRight: "6px" }} />
                  <NetworkStatusView />
                </div>
              </div>
            </div>
            <div className={styles.dividedLine} />
            {waitingLedger ? (
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
            ) : (
              <>
                <div className={styles.modalContentCls}>
                  <Trans
                    i18nKey={modalContent}
                    components={{
                      light: <span className={styles.lightFont} />,
                    }}
                  />
                </div>
                <div className={styles.bottomContent}>
                  <div className={styles.feeContainer}>
                    <div className={styles.feeItem}>
                      <div className={styles.feeTitle}>
                        {i18n.t("currentFee")}
                      </div>
                      <div className={styles.feeContent}>
                        {currentFee + " " + MAIN_COIN_CONFIG.symbol}
                      </div>
                    </div>
                    <div className={styles.feeArrow}>
                      <img
                        className={styles.arrowCls}
                        src="/img/icon_arrow_purple.svg"
                      />
                    </div>
                    <div className={styles.feeItem}>
                      <div className={cls(styles.feeTitle, styles.rightFee)}>
                        {i18n.t("newFee")}
                      </div>
                      <div className={cls(styles.feeContent, styles.rightFee)}>
                        {nextInputFee + " " + MAIN_COIN_CONFIG.symbol}
                      </div>
                    </div>
                  </div>
                  <div className={styles.changeWrapper}>
                    <div className={styles.changeCls} onClick={onClickAdvance}>
                      {i18n.t("change")}
                    </div>
                  </div>
                </div>
                <div className={styles.bottomContainer}>
                  <Button
                    onClick={onClickClose}
                    theme={button_theme.BUTTON_THEME_LIGHT}
                  >
                    {i18n.t("cancel")}
                  </Button>
                  <Button
                    loading={btnLoading}
                    onClick={() => {
                      onConfirm(nextInputFee);
                    }}
                  >
                    {i18n.t("confirm")}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <AdvancedModal
        modalVisible={advanceModalVisible}
        onConfirm={onAdvanceConfirm}
        onClickClose={onClickAdvanceClose}
        currentFee={currentFee}
        currentNonce={currentNonce}
      />
    </>
  );
};
