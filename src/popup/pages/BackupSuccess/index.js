import i18n from "i18next";
import { useCallback, useMemo } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import BottomBtn from "../../component/BottomBtn";
import styles from "./index.module.scss";

export const BackupSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    showTip
  } = useMemo(() => {
    let type = location?.state?.type ?? "";

    let showTip = ""
    if (type === "restore") {
      showTip = "backup_success_restore"
    } else if (type === "ledger") {
      showTip = "ledgerSuccessTip"
    } else {
      showTip = "backup_success"
    }

    return {
      showTip
    }
  }, [location])

  const goToNext = useCallback(() => {
    navigate("/homepage")
  }, [navigate])

  return (
    <div className={styles.container}>
      <img src="/img/backup_success.svg" />
      <p className={styles.backupTitle}>
        {i18n.t('success')}
      </p>
      <p className={styles.backupContent}>
        {i18n.t(showTip)}
      </p>
      <BottomBtn
        containerClass={styles.bottomCon}
        onClick={goToNext}
        rightBtnContent={i18n.t('start')}
      />
    </div>
  )
}