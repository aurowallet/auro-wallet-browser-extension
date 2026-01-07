import { SEC_FROM_TYPE } from "../../../constant/commonType";
import { WALLET_GET_MNE, WALLET_GET_KEYRING_MNEMONIC } from "../../../constant/msgTypes";
import { sendMsg } from "../../../utils/commonMsg";
import SecurityPwd from "../../component/SecurityPwd";
import Toast from "../../component/Toast";

import i18n from "i18next";
import { useCallback, useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import { MneItem } from "../ShowMnemonic";
import styles from "./index.module.scss";

const RevealSeedPage = ({ }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { keyringId } = location.state || {}
  const [mneList, setMneList] = useState([])
  const [showSecurity, setShowSecurity] = useState(true)

  const onClickCheck = useCallback((password) => {
    // If keyringId is provided, get mnemonic for specific keyring (V2)
    // Otherwise fallback to general getMnemonic (V1 compatible)
    const action = keyringId ? WALLET_GET_KEYRING_MNEMONIC : WALLET_GET_MNE;
    const payload = keyringId 
      ? { keyringId, password } 
      : { password };

    sendMsg({ action, payload }, async (result) => {
      if (result && result.error) {
        if (result.type === "local") {
          Toast.info(i18n.t(result.error))
        } else {
          Toast.info(result.error)
        }
      } else {
        // Handle both V1 (direct mnemonic string) and V2 (object with mnemonic property)
        const mnemonic = typeof result === 'string' ? result : result.mnemonic;
        let list = mnemonic.split(" ")
        setMneList(list)
        setShowSecurity(false)
      }
    })
  }, [keyringId])
  const goToNext = useCallback(() => {
    navigate(-1)
  }, [])
  if (showSecurity) { 
    return <SecurityPwd onClickCheck={onClickCheck} action={SEC_FROM_TYPE.SEC_SHOW_MNEMONIC} />
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