import i18n from "i18next";
import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { saveLocal } from "../../../background/localStorage";
import { CURRENCY_UNIT_CONFIG } from "../../../constant/storageKey";
import { updateShouldRequest } from "../../../reducers/accountReducer";
import { updateCurrencyConfig } from "../../../reducers/currency";
import CustomView from "../../component/CustomView";
import styles from "./index.module.scss";


const CurrencyUnit = ({ }) => {

  let history = useHistory();
  const currencyList = useSelector(state => state.currencyConfig.currencyList)
  const [oldCurrency, setOldCurrency] = useState(() => {
    let list = currencyList.filter((item) => {
      return item.isSelect
    })
    return list[0]
  })
  const [currentCurrency, setCurrentCurrency] = useState(() => {
    let list = currencyList.filter((item) => {
      return item.isSelect
    })
    return list[0]
  })

  const dispatch = useDispatch()

  const onSelect = useCallback((item) => {
    setCurrentCurrency(item)
    if (item !== oldCurrency) {
      let list = currencyList.map((mapItem, index) => {
        let newItem = { ...mapItem }
        if (newItem.key === item.key) {
          newItem.isSelect = true
          return newItem
        } else {
          newItem.isSelect = false
          return newItem
        }
      })
      dispatch(updateCurrencyConfig(list));
      saveLocal(CURRENCY_UNIT_CONFIG, JSON.stringify(item.key))
      history.goBack()
    }

  }, [i18n,oldCurrency])


  return (
    <CustomView title={i18n.t('currency')} contentClassName={styles.contentClassName}>
      {
        currencyList.map((item, index) => {
          let isChecked = currentCurrency.key === item.key
          return <div className={styles.rowContainer} key={index} onClick={() => onSelect(item)} >
            <span>{item.value}</span>
            {isChecked && <img src="/img/icon_checked.svg" />}
          </div>
        })
      }
    </CustomView>
  )
}
export default CurrencyUnit