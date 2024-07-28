import i18n from "i18next";
import { useCallback, useState } from "react";
import { useHistory } from 'react-router-dom';
import { SEC_FROM_TYPE } from "../../../constant/commonType";
import { WALLET_GET_PRIVATE_KEY } from "../../../constant/msgTypes";
import { sendMsg } from "../../../utils/commonMsg";
import { copyText } from '../../../utils/utils';
import SecurityPwd from "../../component/SecurityPwd";
import Toast from "../../component/Toast";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import { PopupModal } from "../../component/PopupModal";
import styles from "./index.module.scss";

const ShowPrivateKeyPage = ({ }) => {
  const history = useHistory()
  const [address, setAddress] = useState(history.location.params?.address || "")

  const [showSecurity, setShowSecurity] = useState(true)
  const [priKey, setPriKey] = useState('')
  const [confirmModalStatus, setConfirmModalStatus] = useState(false)


  const onClickCheck = useCallback((password) => {
    sendMsg({
      action: WALLET_GET_PRIVATE_KEY,
      payload: {
        password: password,
        address: address
      }
    },
      async (privateKey) => {
        if (privateKey.error) {
          if (privateKey.type === "local") {
            if(privateKey.error === "passwordError"){
              Toast.info(i18n.t("passwordError"))
            }else{
              Toast.info(i18n.t(privateKey.error))
            }
          } else {
            Toast.info(privateKey.error)
          }
        } else {
          setPriKey(privateKey)
          setShowSecurity(false)
        }
      })
  }, [i18n])
  const onConfirm = useCallback(() => {
    history.goBack()
  }, [])
  const onClickCopy = useCallback(() => {
    setConfirmModalStatus(true)
  }, [])

  const onConfirmCopy = useCallback(() => {
    setConfirmModalStatus(false)
    copyText(priKey).then(() => {
      Toast.info(i18n.t('copySuccess'))
    })
  }, [priKey,i18n])
  const onCloseModal = useCallback(() => {
    setConfirmModalStatus(false)
  }, [])
  if (showSecurity) {
    return <SecurityPwd pageTitle={i18n.t('privateKey')} onClickCheck={onClickCheck} action={SEC_FROM_TYPE.SEC_SHOW_PRIVATE_KEY} />
  }
  return (<CustomView title={i18n.t('privateKey')}>
    <div className={styles.addressContainer}>
      <p className={styles.addressTitle}>{i18n.t('walletAddress')}</p>
      <p className={styles.addressContent}>{address}</p>
    </div>
    <div className={styles.priContainer}>
      <p className={styles.privateKey}>{priKey}</p>
      <div className={styles.copyContainer} onClick={onClickCopy}>
        <img src="/img/icon_copy_purple.svg" />
        <p className={styles.copyDesc}>{i18n.t('copyToClipboard')}</p>
      </div>
    </div>
    <div className={styles.hold} />
    <div className={styles.bottomContainer}>
      <Button
        onClick={onConfirm}>
        {i18n.t('done')}
      </Button>
    </div>
    <PopupModal
      title={i18n.t('tips')}
      leftBtnContent={i18n.t('copyAnyway')}
      rightBtnContent={i18n.t("stopCopying")}
      onLeftBtnClick={onConfirmCopy}
      onRightBtnClick={onCloseModal}
      contentList={[i18n.t('copyTipContent'), i18n.t('confirmEnv')]}
      modalVisible={confirmModalStatus} />
  </CustomView>
  )
}

export default ShowPrivateKeyPage