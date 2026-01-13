import { AUTO_LOCK_TIME_LIST } from "@/constant";
import { WALLET_GET_LOCK_TIME } from "@/constant/msgTypes";
import { sendMsg } from "@/utils/commonMsg";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomView from "../../component/CustomView";
import styles from "./index.module.scss";

const Security = ({}) => {
  const navigate = useNavigate();
 
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
  const { displayLockTime } = useMemo(() => {
    let displayLockTime = "";
    let lockTime = AUTO_LOCK_TIME_LIST.filter((time) => {
      return time.value === currentLockTime;
    });
    if (lockTime.length > 0) {
      lockTime = lockTime[0];
      displayLockTime = i18n.t(lockTime.label);
    }

    return {
      displayLockTime,
    };
  }, [i18n, currentLockTime]);
   const goToPage = useCallback((nextRoute) => {
    navigate(nextRoute);
  }, []);
  return (
    <CustomView title={i18n.t("security")} contentClassName={styles.container}>
      <RowItem
        title={i18n.t("changePassword")}
        onClickItem={()=>goToPage("/reset_password")}
      />
      <RowItem
        title={i18n.t("autoLock")}
        content={displayLockTime}
        onClickItem={() => {
          goToPage("/auto_lock");
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
export default Security;
