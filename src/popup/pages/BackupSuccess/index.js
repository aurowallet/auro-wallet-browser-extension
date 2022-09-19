import i18n from "i18next";
import { useCallback, useMemo } from "react";
import { useHistory } from 'react-router-dom';
import BottomBtn from "../../component/BottomBtn";
import styles from "./index.module.scss";

export const BackupSuccess = () => {
  let history = useHistory();
  const {
    showTip
  } = useMemo(() => {
    let location = history.location
    let type = location?.params?.type ?? "";

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
  }, [history])

  const goToNext = useCallback(() => {
    history.push("/homepage")
  }, [history])

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