import { useCallback, useState } from "react";
import { WALLET_IMPORT_LEDGER } from "../../../constant/types";
import { updateCurrentAccount } from "../../../reducers/accountReducer";
import { sendMsg } from "../../../utils/commonMsg";
import { checkLedgerConnect, requestAccount } from "../../../utils/ledger";
import LedgerConnected from "../../component/LedgerConnected";
import Loading from "../../component/Loading";
import Toast from "../../component/Toast";
import styles from "./index.module.scss";

import i18n from "i18next";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import { useDispatch } from "react-redux";
import { useHistory } from 'react-router-dom';

const LedgerImport = ({ }) => {

  const dispatch = useDispatch()
  const history = useHistory()

  const [accountName, setAccountName] = useState(() => {
    return history.location?.params?.accountName ?? "";
  })
  const [accountIndex, setAccountIndex] = useState(() => {
    return history.location?.params?.accountIndex ?? "";
  })

  const goToNext = useCallback(async () => {
    Loading.show()
    const { ledgerApp } = await checkLedgerConnect()
    if (ledgerApp) {
      Loading.show()
      const { publicKey, rejected } = await requestAccount(ledgerApp, accountIndex)
      Loading.hide()
      if (rejected) {
        Toast.info(i18n.t('ledgerRejected'))
      } else {
        sendMsg({
          payload: {
            address: publicKey,
            accountIndex: accountIndex,
            accountName: accountName
          },
          action: WALLET_IMPORT_LEDGER
        }, (account) => {
          if (account.error) {
            if (account.type === "local") {
              Toast.info(i18n.t(account.error))
            } else {
              Toast.info(account.error)
            }
          } else {
            dispatch(updateCurrentAccount(account))
            history.goBack()
          }
        })
      }
    }
  }, [accountIndex, accountName])
  return (<CustomView title={i18n.t('connectLedger')} >
    <div className={styles.ledgerIconContainer}>
      <img src='/img/ledger_logo.svg' />
    </div>
    <LedgerConnected tips={['ledgerImportTip']} />
    <div className={styles.hold} />
    <div className={styles.bottomContainer}>
      <Button
        onClick={goToNext}>
        {i18n.t('import')}
      </Button>
    </div>
  </CustomView>)
}

export default LedgerImport