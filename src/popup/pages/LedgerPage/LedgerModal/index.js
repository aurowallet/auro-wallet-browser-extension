import i18n from "i18next";
import { Trans } from "react-i18next";
import styles from "./index.module.scss";

export const LedgerModal = ({ modalVisible }) => {
  return (
    <>
      {modalVisible && (
        <div className={styles.outerContainer}>
          <div className={styles.contentContainer}>
            <div className={styles.tipTitle}>{i18n.t("tips")}</div>
            <div className={styles.tipContent}>
              {i18n.t("ledgerConentTip_1")}
            </div>
            <div className={styles.ledgerStep}>
              <span>{"Get Address > Generate > Approve"}</span>
            </div>
            <div className={styles.tipContent}>
              <Trans
                i18nKey={"ledgerCloseWarning"}
                components={{
                  red: <span className={styles.redFont} />,
                }}
              />
            </div>
            <div className={styles.tipContent}>{i18n.t("ledgerCloseTip")}</div>
            <div className={styles.dividedLine} />
            <img
              className={styles.ledgerLoading}
              src={"/img/ledgerLoading.svg"}
            />
          </div>
        </div>
      )}
    </>
  );
};
