import i18n from "i18next";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { changeLanguage, languageOption } from "../../../i18n";
import { setLanguage } from "../../../reducers/appReducer";
import CustomView from "../../component/CustomView";
import styles from "./index.module.scss";
import { ContributeMoreLanguage } from "../../../constant";


const LanguageManagementPage = ({ }) => {

  const [currentLanguage, setCurrentLanguage] = useState(i18n.language)

  const dispatch = useDispatch()
  const navigate = useNavigate();

  const onSelect = useCallback((item) => {
    setCurrentLanguage(item.key)
    if (item.key !== i18n.language) {
      changeLanguage(item.key)
      dispatch(setLanguage(item.key))
      navigate(-1)
    }
  }, [i18n])

  return (
    <CustomView title={i18n.t('language')} contentClassName={styles.contentClassName}>
      {
        languageOption.map((item, index) => {
          let isChecked = currentLanguage === item.key
          return <div className={styles.rowContainer} key={index} onClick={() => onSelect(item)} >
            <span>{item.value}</span>
            {isChecked && <img src="/img/icon_checked.svg" />}
          </div>
        })
      }
      <div className={styles.bottomCon}>
        <a className={styles.tipContainer} href={ContributeMoreLanguage} target="_blank">
          {i18n.t('contributeLanguage')}
        </a>
      </div>
    </CustomView>
  )
}
export default LanguageManagementPage