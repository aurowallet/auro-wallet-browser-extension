import i18n from "i18next";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import { ACCOUNT_NAME_FROM_TYPE } from "../../../constant/pageType";
import { updateAccoutType } from "../../../reducers/cache";
import CustomView from "../../component/CustomView";
import styles from "./index.module.scss";

const ImportPage = ({ }) => {
  const dispatch = useDispatch()
  const history = useHistory()
  const onPrivateKey = useCallback(() => {
    dispatch(updateAccoutType(ACCOUNT_NAME_FROM_TYPE.OUTSIDE))
    history.push('account_name')
  }, [])
  const onKeystore = useCallback(() => {
    dispatch(updateAccoutType(ACCOUNT_NAME_FROM_TYPE.KEYPAIR))
    history.push('account_name')
  }, [])
  return (<CustomView title={i18n.t('importAccount')} contentClassName={styles.container}>
    <ImportRow title={i18n.t('privateKey')} onClick={onPrivateKey} />
    <ImportRow title={"Keystore"} onClick={onKeystore} />
  </CustomView>)
}

const ImportRow = ({ title, onClick = () => { } }) => {
  return (<div className={styles.rowContainer} onClick={onClick}>
    <span className={styles.rowTitle}>
      {title}
    </span>
    <img src="/img/icon_arrow.svg" />
  </div>)
}


export default ImportPage