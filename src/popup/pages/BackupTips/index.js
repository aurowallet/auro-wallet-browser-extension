import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useHistory } from 'react-router-dom';
import BottomBtn from "../../component/BottomBtn";
import { CheckBox } from "../../component/CheckBox";
import CustomView from "../../component/CustomView";
import styles from "./index.module.scss";

export const BackupTips = () => {
  let history = useHistory();
  const goToCreate = useCallback(() => {
    history.push("/showmnemonic")
  }, [])

  const [btnClick, setBtnClick] = useState(false)

  const [checkBox_1, setCheckBox_1] = useState(false)
  const [checkBox_2, setCheckBox_2] = useState(false)


  const onClickCheckbox_1 = useCallback(() => {
    setCheckBox_1(state => !state)
  }, [])
  const onClickCheckbox_2 = useCallback(() => {
    setCheckBox_2(state => !state)
  }, [])

  useEffect(() => {
    setBtnClick(checkBox_1 && checkBox_2)
  }, [checkBox_1, checkBox_2])


  return (
    <CustomView title={i18n.t('backTips_title')}>
      <p className={styles.title_1}>
        {i18n.t("backTips_1")}
      </p>
      <p className={styles.content}>
        {i18n.t("backTips_2")}
      </p>
      <p className={styles.content}>
        {i18n.t("backTips_3")}
      </p>

      <BottomBtn disable={!btnClick} onClick={goToCreate} rightBtnContent={i18n.t('next')} >
        <div>
          <RowCheckLine checkStatus={checkBox_1} onClick={onClickCheckbox_1} content={i18n.t('backup_checkbox_1')} />
          <RowCheckLine checkStatus={checkBox_2} onClick={onClickCheckbox_2} content={i18n.t('backup_checkbox_2')} />
        </div>
      </BottomBtn>
    </CustomView>
  )
}

const RowCheckLine = ({ content, onClick, checkStatus }) => {
  return (<div className={styles.rowLine} onClick={onClick}>
    <CheckBox status={checkStatus} />
    <p className={styles.rowContent}>
      {content}
    </p>
  </div>)
}