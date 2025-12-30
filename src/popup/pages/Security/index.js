import i18n from "i18next";
import { useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import CustomView from "../../component/CustomView";
import styles from "./index.module.scss";


const Security = ({ }) => {
  const navigate = useNavigate()
  const onToSeedPage = useCallback(() => {
    navigate('/reveal_seed_page')
  }, [])
  const onResetPwd = useCallback(() => {
    navigate('/reset_password')
  }, [])
  return <CustomView title={i18n.t('security')} contentClassName={styles.container}>
    <RowItem title={i18n.t('backupMnemonicPhrase')} onClickItem={onToSeedPage} />
    <RowItem title={i18n.t('changePassword')} onClickItem={onResetPwd} />
  </CustomView>
}


const RowItem = ({
  title = "",
  onClickItem = () => { }
}) => {
  return (<div className={styles.rowContainer} onClick={onClickItem}>
    <p className={styles.rowTitle}>{title}</p>
    <img src="/img/icon_arrow.svg" />
  </div>)
}
export default Security