import cls from "classnames";
import i18n from "i18next";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { LEDGER_STATUS } from "../../../constant/ledger";
import styles from "./index.module.scss";

const LedgerStatusView = () => {
  const ledgerStatus = useSelector((state) => state.ledger.ledgerConnectStatus);
  const { showStatus } = useMemo(() => {
    let showStatus = false;
    if (ledgerStatus === LEDGER_STATUS.READY) {
      showStatus = true;
    }
    return {
      showStatus,
    };
  }, [ledgerStatus]);
  if (!ledgerStatus) {
    return <></>;
  }
  return (
    <div className={styles.ledgerCon}>
      <div
        className={cls(styles.statusDot, {
          [styles.dotWin]: showStatus,
        })}
      />
      <span className={styles.statusContent}>{i18n.t("ledgerStatus")}</span>
    </div>
  );
};

export default LedgerStatusView;
