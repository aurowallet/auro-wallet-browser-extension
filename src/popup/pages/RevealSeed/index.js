import { SEC_SHOW_MNEMONIC } from "../../../constant/secTypes";
import { WALLET_GET_MNE } from "../../../constant/types";
import { sendMsg } from "../../../utils/commonMsg";
import SecurityPwd from "../../component/SecurityPwd";
import Toast from "../../component/Toast";

import i18n from "i18next";
import { useCallback, useState } from "react";
import { useHistory } from 'react-router-dom';
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import { MneItem } from "../ShowMnemonic";
import styles from "./index.module.scss";

const RevealSeedPage = ({ }) => {
  const history = useHistory()
  const [mneList, setMneList] = useState([])
  const [showSecurity, setShowSecurity] = useState(true)

  const onClickCheck = useCallback((password) => {
    sendMsg({
      action: WALLET_GET_MNE,
      payload: {
        password: password
      }
    },
      async (mnemonic) => {
        if (mnemonic && mnemonic.error) {
          if (mnemonic.type === "local") {
            Toast.info(i18n.t(mnemonic.error))
          } else {
            Toast.info(mnemonic.error)
          }
        } else {
          let list = mnemonic.split(" ")
          setMneList(list)
          setShowSecurity(false)
        }
      })
  }, [])
  const goToNext = useCallback(() => {
    history.goBack()
  }, [])
  if (showSecurity) { 
    return <SecurityPwd onClickCheck={onClickCheck} action={SEC_SHOW_MNEMONIC} />
  }
  return <CustomView title={i18n.t('backupMnemonicPhrase')} >
    <p className={styles.backTitle}>
      {i18n.t('revealMneTip')}
    </p>
    <div className={styles.mne_container}>
      {mneList.map((mne, index) => {
        return <MneItem key={index} mne={mne} index={index} />
      })}
    </div>
    <div className={styles.hold} />
    <div className={styles.mneReminderContainer}>
      <div className={styles.mneReminderTop}>
        <img src="/img/icon_error.svg" />
        <p className={styles.mneReminderTitle}>{i18n.t('mneReminder')}</p>
      </div>
      <p className={styles.mneReminderContent}>{i18n.t('mneReminderContent')}</p>
    </div>
    <div className={styles.bottomCon}>
      <Button
        onClick={goToNext}>
        {i18n.t('done')}
      </Button>
    </div>
  </CustomView>
}
export default RevealSeedPage