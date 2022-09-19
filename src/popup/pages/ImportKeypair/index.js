import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useHistory } from 'react-router-dom';
import { WALLET_IMPORT_KEY_STORE } from "../../../constant/types";
import { updateCurrentAccount } from "../../../reducers/accountReducer";
import { sendMsg } from "../../../utils/commonMsg";
import Toast from "../../component/Toast";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import Input from "../../component/Input";
import TextArea from "../../component/TextArea";
import styles from "./index.module.scss";

const ImportKeypair = ({ }) => {
  const [keystoreValue, setKeystoreValue] = useState("")
  const [pwdValue, setPwdValue] = useState('')
  const [btnStatus, setBtnStatus] = useState(false)
  const [loading, setLoading] = useState(false)


  const history = useHistory()
  const dispatch = useDispatch()

  const [accountName, setAccountName] = useState(() => {
    return history.location?.params?.accountName ?? "";
  })

  useEffect(() => {
    if (keystoreValue.length > 0 && pwdValue.length > 0) {
      setBtnStatus(true)
    } else {
      setBtnStatus(false)
    }
  }, [pwdValue, keystoreValue])

  const onInpuKeystore = useCallback((e) => {
    setKeystoreValue(e.target.value)
  }, [])

  const onInpuPwd = useCallback((e) => {
    setPwdValue(e.target.value)
  }, [])

  const onConfirm = useCallback((e) => {
    setLoading(true)
    sendMsg({
      action: WALLET_IMPORT_KEY_STORE,
      payload: {
        keypair: keystoreValue,
        password: pwdValue,
        accountName: accountName
      }
    }, 
      async (account) => {
        setLoading(false)
        if (account.error) {
          if (account.type === "local") {
            Toast.info(i18n.t(account.error))
          } else {
            Toast.info(account.error)
          }
          return
        } else {
          dispatch(updateCurrentAccount(account))
          setTimeout(() => {
            history.replace("account_manage")
          }, 300);
        }
      })
  }, [keystoreValue, pwdValue, accountName])
  return (<CustomView title={i18n.t('importKeystone')} >
    <p className={styles.title}>{i18n.t('pleaseInputKeyPair')}</p>
    <div className={styles.textAreaContainer}>
      <TextArea
        onChange={onInpuKeystore}
        value={keystoreValue}
      />
    </div>
    <Input
      label={i18n.t('keystorePassword')}
      onChange={onInpuPwd}
      value={pwdValue}
      inputType={'password'}
    />
    <div className={styles.descContainer}>
      <p className={styles.desc}>{i18n.t('importAccount_2')}</p>
      <p className={styles.desc}>{i18n.t('importAccount_3')}</p>
    </div>
    <div className={styles.hold} />
    <div className={styles.bottomContainer}>
      <Button
        disable={!btnStatus}
        loading={loading}
        onClick={onConfirm}>
        {i18n.t('confirm')}
      </Button>
    </div>
  </CustomView>)

}
export default ImportKeypair