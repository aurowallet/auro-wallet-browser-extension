import cls from "classnames";
import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useHistory } from 'react-router-dom';
import { WALLET_GET_CREATE_MNEMONIC } from "../../../constant/msgTypes";
import { sendMsg } from "../../../utils/commonMsg";
import BottomBtn from "../../component/BottomBtn";
import CustomView from "../../component/CustomView";
import styles from "./index.module.scss";

export const ShowMnemonic = () => {
  
  const [mneList, setMneList] = useState([])

  useEffect(() => {
    sendMsg({
      action: WALLET_GET_CREATE_MNEMONIC,
      payload: {
        isNewMne: true
      }
    }, (mnemonic) => {
      let list = mnemonic.split(" ")
      setMneList(list)
    })
  }, [])

  let history = useHistory();
  const goToNext = useCallback(() => {
    history.push("/backup_mnemonic")
  }, [])

  return (
    <CustomView title={i18n.t('backupMnemonicPhrase')}>
      <p className={styles.backTitle}>
        {i18n.t('revealMneTip')}
      </p>
      <div className={styles.mne_container}>
        {mneList.map((mne, index) => {
          return <MneItem key={index} mne={mne} index={index} />
        })}
      </div>
      <BottomBtn
        onClick={goToNext}
        rightBtnContent={i18n.t('show_seed_button')}
      />
    </CustomView>
  )
}

export const MneItem = ({ mne, index, canClick = false, onClick = () => { }, contentColorStatus = false}) => {
  const [showSmallMne, setShowSmallMne] = useState(mne.length >= 8)
  return (<div
    className={cls(styles.mneItemContainer, {
      [styles.clickAble]: canClick,
      [styles.colorStatus]:contentColorStatus
    })}
    onClick={onClick}>
    <p className={cls(styles.mneIndex, {
      [styles.smallStyle]: showSmallMne,
      [styles.colorIndexStatus]:contentColorStatus
    })}>
      {(index + 1) + "."}
    </p>
    <span className={cls(styles.mneItem, {
      [styles.smallStyle]: showSmallMne
    })}>
      {mne}
    </span>
  </div>)
}