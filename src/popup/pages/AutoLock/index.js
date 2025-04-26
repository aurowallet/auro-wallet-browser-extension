import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { AUTO_LOCK_TIME_LIST } from "../../../constant";
import { WALLET_GET_LOCK_TIME, WALLET_UPDATE_LOCK_TIME } from "../../../constant/msgTypes";
import { sendMsg } from "../../../utils/commonMsg";
import CustomView from "../../component/CustomView";
import styles from "./index.module.scss";



const AutoLock = ({ }) => {
  const [currentLockDuration, setCurrentLockDuration] = useState()
  const history = useHistory()

  const onSelect = useCallback((data) => {
    setCurrentLockDuration(data.value)
  
    sendMsg({
      action: WALLET_UPDATE_LOCK_TIME,
      payload: data.value
    }, () => {
      history.goBack()
    })
  }, [i18n])

  useEffect(()=>{
    sendMsg({
      action: WALLET_GET_LOCK_TIME,
    }, (data) => {
      setCurrentLockDuration(data)
    })
  },[])
  return (
    <CustomView title={i18n.t('autoLock')} contentClassName={styles.contentClassName}>
      {
        AUTO_LOCK_TIME_LIST.map((item, index) => {
          let isChecked = currentLockDuration === item.value
          return <div className={styles.rowContainer} key={index} onClick={() => onSelect(item)} >
            <span>{i18n.t(item.label)}</span>
            {isChecked && <img src="/img/icon_checked.svg" />}
          </div>
        })
      }
    </CustomView>
  )
}
export default AutoLock