import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { AUTO_LOCK_TIME_LIST } from "../../../constant";
import { WALLET_GET_LOCK_TIME } from "../../../constant/msgTypes";
import { languageOption } from "../../../i18n";
import { sendMsg } from "../../../utils/commonMsg";
import CustomView from "../../component/CustomView";
import styles from "./index.module.scss";

const Preferences = ({}) => {
  const history = useHistory();
  const currency = useSelector((state) => state.currencyConfig.currentCurrency);
  const [currentLockTime, setCurrentLockTime] = useState("");
  useEffect(() => {
    sendMsg(
      {
        action: WALLET_GET_LOCK_TIME,
      },
      (time) => {
        setCurrentLockTime(time);
      }
    );
  }, []);

  const { displayLanguage, displayCurrency, displayLockTime } = useMemo(() => {
    let currentLanguage = languageOption.filter((language) => {
      return language.key === i18n.language;
    });
    let displayLanguage =
      currentLanguage.length > 0 ? currentLanguage[0].value : "";
    let displayCurrency = currency.value;

    let displayLockTime = "";
    let lockTime = AUTO_LOCK_TIME_LIST.filter((time) => {
      return time.value === currentLockTime;
    });
    if (lockTime.length > 0) {
      lockTime = lockTime[0];
      displayLockTime = i18n.t(lockTime.label);
    }

    return {
      displayLanguage,
      displayCurrency,
      displayLockTime,
    };
  }, [i18n, currency, currentLockTime]);

  const goToPage = useCallback((nextRoute) => {
    history.push(nextRoute);
  }, []);

  return (
    <CustomView
      title={i18n.t("preferences")}
      contentClassName={styles.container}
    >
      <RowItem
        title={i18n.t("language")}
        content={displayLanguage}
        onClickItem={() => {
          goToPage("language_management_page");
        }}
      />
      <RowItem
        title={i18n.t("currency")}
        content={displayCurrency}
        onClickItem={() => {
          goToPage("currency_unit");
        }}
      />
      <RowItem
        title={i18n.t("autoLock")}
        content={displayLockTime}
        onClickItem={() => {
          goToPage("auto_lock");
        }}
      />
    </CustomView>
  );
};

const RowItem = ({ title = "", content = "", onClickItem = () => {} }) => {
  return (
    <div className={styles.rowContainer} onClick={onClickItem}>
      <div>
        <p className={styles.rowTitle}>{title}</p>
      </div>
      <div className={styles.rowLeft}>
        <p className={styles.rowContent}>{content}</p>
        <img src="/img/icon_arrow.svg" />
      </div>
    </div>
  );
};
export default Preferences;
