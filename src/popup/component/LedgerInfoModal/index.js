import cls from "classnames";
import extension from "extensionizer";
import i18n from "i18next";
import { useCallback, useMemo } from "react";
import { Trans } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { LEDGER_PAGE_TYPE, LEDGER_STATUS } from "../../../constant/commonType";
import { updateLedgerConnectStatus } from "../../../reducers/ledger";
import { getLedgerStatus } from "../../../utils/ledger";
import Button from "../Button";
import styles from "./index.module.scss";

export const LedgerInfoModal = ({
  modalVisable = false,
  title = "",
  onConfirm = () => {},
  onClickClose = () => {},
}) => {
  const dispatch = useDispatch();

  const ledgerStatus = useSelector((state) => state.ledger.ledgerConnectStatus);

  const { nextLedgerTip } = useMemo(() => {
    let nextLedgerTip = "";
    switch (ledgerStatus) {
      case LEDGER_STATUS.LEDGER_DISCONNECT:
        nextLedgerTip = "ledgerNotConnectTip";
        break;
      case LEDGER_STATUS.LEDGER_CONNECT_APP_NOT_OPEN:
        nextLedgerTip = "ledgerAppConnectTip";
        break;
      default:
        break;
    }
    return {
      nextLedgerTip,
    };
  }, [ledgerStatus]);

  const onClickReminder = useCallback(() => {
    const ledgerPageType = LEDGER_PAGE_TYPE.permissionGrant;
    let openParams = new URLSearchParams({ ledgerPageType }).toString();
    extension.tabs.create({
      url: "popup.html#/ledger_page?" + openParams,
    });
  }, [ledgerStatus]);

  const onClickConfirm = useCallback(async () => {
    const ledger = await getLedgerStatus();
    dispatch(updateLedgerConnectStatus(ledger.status));
    if (ledger.status === LEDGER_STATUS.READY) {
      onConfirm(ledger);
    }
  }, [onConfirm]);

  return (
    <>
      {modalVisable && (
        <div className={styles.outerContainer}>
          <div className={styles.innerContent}>
            <div className={styles.contentContainer}>
              <div className={styles.titleRow}>
                <span className={styles.rowTitle}>
                  {title || i18n.t("connectHardwareWallet")}
                </span>

                <div className={styles.rightRow}>
                  <img
                    onClick={onClickClose}
                    className={styles.rowClose}
                    src="/img/icon_nav_close.svg"
                  />
                </div>
              </div>
            </div>
            <div className={styles.dividedLine} />
            <div className={styles.stepOuterContainer}>
              <div className={styles.stepContainer}>
                <div className={styles.stepNumber}>1</div>
                <span className={styles.stepContent}>
                  {i18n.t("ledgerConnect_1")}
                </span>
              </div>
              <div className={styles.stepContainer}>
                <div className={styles.stepNumber}>2</div>
                <span className={styles.stepContent}>
                  <Trans
                    i18nKey={"ledgerConnect_2"}
                    components={{
                      b: <span className={styles.stepContentLight} />,
                    }}
                  />
                </span>
              </div>
            </div>
            {nextLedgerTip && (
              <div className={styles.reminderContainer}>
                <Trans
                  i18nKey={nextLedgerTip}
                  components={{
                    click: (
                      <span
                        onClick={onClickReminder}
                        className={styles.clickItem}
                      />
                    ),
                  }}
                />
              </div>
            )}
            <div className={cls(styles.bottomContainer)}>
              <Button onClick={onClickConfirm}>{i18n.t("confirm")}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
