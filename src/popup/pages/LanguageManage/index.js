import i18n from "i18next";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import { changeLanguage, languageOption } from "../../../i18n";
import { setLanguage } from "../../../reducers/appReducer";
import CustomView from "../../component/CustomView";
import styles from "./index.module.scss";


const LanguageManagementPage = ({ }) => {

  const [currentLangeuage, setCurrentLangeuage] = useState(i18n.language)

  const dispatch = useDispatch()
  let history = useHistory();

  const onSelect = useCallback((item) => {
    setCurrentLangeuage(item.key)
    if (item.key !== i18n.language) {
      changeLanguage(item.key)
      dispatch(setLanguage(item.key))
      history.goBack()
    }
  }, [i18n])

  return (
    <CustomView title={i18n.t('language')} contentClassName={styles.contentClassName}>
      {
        languageOption.map((item, index) => {
          let isChecked = currentLangeuage === item.key
          return <div className={styles.rowContainer} key={index} onClick={() => onSelect(item)} >
            <span>{item.value}</span>
            {isChecked && <img src="/img/icon_checked.svg" />}
          </div>
        })
      }
    </CustomView>
  )
}
export default LanguageManagementPage