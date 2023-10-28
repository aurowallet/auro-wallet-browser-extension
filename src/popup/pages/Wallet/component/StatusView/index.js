import cls from "classnames";
import i18n from "i18next";
import styles from "./index.module.scss";

export const HistoryHeader = ({
  historyRefreshing,
  onClickRefesh,
  showHistoryStatus,
}) => { 
  return (
    <div className={styles.historyHead}>
      <span className={styles.historyTitle}>{i18n.t("history")}</span>
      {showHistoryStatus && (
        <div
          className={cls(styles.refreshContainer, {
            [styles.refresh]: historyRefreshing,
          })}
          onClick={onClickRefesh}
        >
          <img src="/img/refresh.svg" className={styles.refreshIcon} />
        </div>
      )}
    </div>
  );
};

export const LoadingView = () => {
  return (
    <div className={styles.historyContainer}>
      <HistoryHeader showHistoryStatus={false} />
      <div className={styles.loadingCon}>
        <img className={styles.refreshLoading} src="/img/loading_purple.svg" />
        <p className={styles.loadingContent}>{i18n.t("loading") + "..."}</p>
      </div>
    </div>
  );
};
export const UnknownInfoView = () => {
  return (
    <div className={styles.historyContainer}>
      <div className={styles.historyHead}>
        <span className={styles.historyTitle}>{i18n.t("history")}</span>
      </div>
      <div className={styles.emptyContainer}>
        <img src="/img/icon_empty.svg" className={styles.emptyIcon} />
        <span className={styles.emptyContent}>{i18n.t("txHistoryTip")}</span>
      </div>
    </div>
  );
};
export const NoBalanceDetail = () => {
  return (
    <div className={styles.noBalanceContainer}>
      <div className={styles.noBalanceTopContainer}>
        <img src="/img/reminder.svg" className={styles.reminderIcon} />
        <p className={styles.reminderTitle}>{i18n.t("reminder")}</p>
      </div>
      <p className={styles.reminderContent}>{i18n.t("notActiveAccountTip")}</p>
    </div>
  );
};
