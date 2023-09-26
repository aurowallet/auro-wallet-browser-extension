/**
 * speed up and speed cancel modal
 */
import cls from "classnames";
import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { Trans } from "react-i18next";
import { cointypes } from "../../../../config";
import { AdvancedModal } from "../AdvancedModal";
import Button from "../Button";
import LedgerStatusView from "../LedgerStatusView";
import styles from "./index.module.scss";

export const TransactionModalType = {
  speedUp: "SPEED_UP",
  cancel: "CANCEL",
};
export const TransactionModal = ({
  modalVisable = false,
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
  const [advanceModalVisable, setAdvanceModalVisable] = useState(false);
  const [nextInputFee, setNextInputFee] = useState(nextFee);

  useEffect(() => {
    if (modalVisable && nextFee) {
      setNextInputFee(nextFee);
    }
  }, [nextFee, modalVisable]);

  const onClickAdvance = useCallback(() => {
    setAdvanceModalVisable(true);
  }, []);
  const onAdvanceConfirm = useCallback((nextFee) => {
    if (nextFee) {
      setNextInputFee(nextFee);
    }
    setAdvanceModalVisable(false);
  }, []);
  const onClickAdvanceClose = useCallback(() => {
    setAdvanceModalVisable(false);
  }, []);

  return (
    <>
      {modalVisable && (
        <div className={styles.outerContainer}>
          <div className={styles.innerContent}>
            <div className={styles.contentContainer}>
              <div className={styles.titleRow}>
                <span className={styles.rowTitle}>{title}</span>
                <div className={styles.rightRow}>
                  <LedgerStatusView />
                  <img
                    onClick={() => {
                      onClickClose();
                    }}
                    className={styles.rowClose}
                    src="/img/icon_nav_close.svg"
                  />
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
                        {currentFee + " " + cointypes.symbol}
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
                        {nextInputFee + " " + cointypes.symbol}
                      </div>
                    </div>
                  </div>
                  {modalType === TransactionModalType.speedUp && (
                    <div className={styles.changeCls} onClick={onClickAdvance}>
                      {i18n.t("change")}
                    </div>
                  )}
                </div>
                <div className={cls(styles.bottomContainer)}>
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
        modalVisable={advanceModalVisable}
        onConfirm={onAdvanceConfirm}
        onClickClose={onClickAdvanceClose}
        currentFee={currentFee}
        currentNonce={currentNonce}
      />
    </>
  );
};
