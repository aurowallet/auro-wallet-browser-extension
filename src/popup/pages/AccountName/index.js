import i18n from "i18next";
import { useCallback, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { ACCOUNT_NAME_FROM_TYPE } from "../../../constant/pageType";
import { WALLET_CREATE_HD_ACCOUNT } from "../../../constant/types";
import { updateCurrentAccount } from "../../../reducers/accountReducer";
import { sendMsg } from "../../../utils/commonMsg";
import { checkLedgerConnect } from "../../../utils/ledger";
import { isNumber } from "../../../utils/utils";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import Input from "../../component/Input";
import { PopupModal } from "../../component/PopupModal";
import Toast from "../../component/Toast";
import styles from "./index.module.scss";

const AccountName = ({ }) => {
  const cache = useSelector(state => state.cache)

  const dispatch = useDispatch()
  const history = useHistory()

  const [accountName, setAccountName] = useState("")
  const [reminderModalStatus, setReminderModalStatus] = useState(false)
  const [accountIndex, setAccountIndex] = useState(0)
  const [repeatAccount, setRepeatAccount] = useState({})
  const [btnLoadingStatus,setBtnLoadingStatus] = useState(false)
  const [isOpenAdvance,setIsOpenAdvance] = useState(false)

  const onSubmit = (event) => {
    event.preventDefault();
  }
  const onNameInput = useCallback((e) => {
    let value = e.target.value
    if (value.length <= 16) {
      setAccountName(value)
    }
  }, [])




  const {
    buttonText, placeholderText, fromType, isLedger
  } = useMemo(() => {
    let buttonText = i18n.t('next')
    let fromType = cache.fromType

    let accountCount = cache.accountCount
    let placeholderText = ""
    let isLedger = false
    switch (fromType) {
      case ACCOUNT_NAME_FROM_TYPE.OUTSIDE:
        placeholderText = "Import Account "
        break;
      case ACCOUNT_NAME_FROM_TYPE.LEDGER:
        placeholderText = "Ledger Account "
        isLedger = true
        break;
      case ACCOUNT_NAME_FROM_TYPE.KEYPAIR:
        placeholderText = "Import Account "
        break;

      case ACCOUNT_NAME_FROM_TYPE.INSIDE:
      default:
        placeholderText = "Account "
        buttonText = i18n.t('confirm')
        break;
    }
    placeholderText = placeholderText + accountCount

    return {
      buttonText, placeholderText, fromType, isLedger
    }
  }, [cache, i18n])


  const onConfirm = useCallback(async () => {
    let accountText = ""
    if (accountName.length <= 0) {
      accountText = placeholderText
    } else {
      accountText = accountName
    }
    if (fromType === ACCOUNT_NAME_FROM_TYPE.OUTSIDE) {
      history.push({
        pathname: "import_account",
        params: { accountName: accountText }
      })
    } else if (fromType === ACCOUNT_NAME_FROM_TYPE.LEDGER) {
      if (isNumber(accountIndex) && accountIndex >= 0) {
        await checkLedgerConnect()
        history.replace({
          pathname: "ledger_import",
          params: {
            accountName: accountText,
            accountIndex: accountIndex
          }
        })
      } else {
        Toast.info(i18n.t('pathError'))
      }
    } else if (fromType === ACCOUNT_NAME_FROM_TYPE.KEYPAIR) {
      history.push({
        pathname: "import_keypair",
        params: { accountName: accountText }
      })
    } else {
      setBtnLoadingStatus(true)
      sendMsg({
        action: WALLET_CREATE_HD_ACCOUNT,
        payload: { accountName: accountText }
      }, (account) => {
        setBtnLoadingStatus(false)
        if (account.error) {
          if (account.error === "improtRepeat") {
            setReminderModalStatus(true)
            setRepeatAccount(account.account)
          }
        } else {
          dispatch(updateCurrentAccount(account))
          history.goBack()
        }
      })
    }


  }, [accountName, placeholderText, fromType, accountIndex])

  const onCloseModal = useCallback(() => {
    setReminderModalStatus(false)
  }, [])





  const onAccountIndexChange = useCallback((e) => {
    let value = e.target.value
    value = value.replace(/[^\d]/g, '')
    let accountIndex = parseFloat(value)
    if (accountIndex < 0) {
      accountIndex = 0
    }
    setAccountIndex(accountIndex)
  }, [])

  const onAdd = useCallback(() => {
    setAccountIndex(accountIndex + 1)
  }, [accountIndex])
  const onMinus = useCallback(() => {
    if (accountIndex <= 0) {
      return
    }
    setAccountIndex(accountIndex - 1)
  }, [accountIndex])

  const onClickAdvance = useCallback(()=>{
    setIsOpenAdvance(state=>!state)
  },[])

  return (
    <CustomView title={i18n.t('accountName')} >
      <form onSubmit={onSubmit} className={styles.container}>
        <div >
          <Input
            label={i18n.t('accountName')}
            onChange={onNameInput}
            value={accountName}
            inputType={'text'}
            placeholder={placeholderText}
          />
        </div>
        {isLedger && <div className={styles.advanceEntry} onClick={onClickAdvance}>
              <p className={styles.advanceTitle}>{i18n.t("advanceMode")}</p>
              <img className={isOpenAdvance ? styles.openAdvance : styles.closeAdvance} src="/img/icon_unfold_Default.svg" />
          </div>}
        {isLedger && isOpenAdvance && <LedgerAdvance value={accountIndex} onChange={onAccountIndexChange} onAdd={onAdd} onMinus={onMinus} />}
        <div className={styles.hold} />
        <div className={styles.bottomContainer}>
          <Button
            loading={btnLoadingStatus}
            onClick={onConfirm}>
            {buttonText}
          </Button>
        </div>
      </form>
      <PopupModal
        title={i18n.t('tips')}
        rightBtnContent={i18n.t('ok')}
        onRightBtnClick={onCloseModal}
        componentContent={
          <div className={styles.tipContainer}>
            <p className={styles.tip}>{i18n.t('importSameAccount_1')}</p>
            <p className={styles.address}>{repeatAccount?.address}</p>
            <Trans
              i18nKey={"importSameAccount_2"}
              values={{ accountName: repeatAccount?.accountName }}
              components={{
                b: <span className={styles.accountRepeatName} />,
                click: <span className={styles.accountRepeatClick} />
              }}
            />
          </div>
        }
        modalVisable={reminderModalStatus} />
    </CustomView>
  )
}

const LedgerAdvance = ({
  value,
  onChange = () => { },
  onAdd = () => { },
  onMinus = () => { }
}) => {
  return (<div className={styles.ledgerContainer}>
    <p className={styles.ledgerTitle}>{i18n.t('hdDerivedPath')}</p>
    <div className={styles.ledgerPath}>m / 44' / 12586' /
      <InputNumber value={value} onChange={onChange} onAdd={onAdd} onMinus={onMinus} />
      ' / 0 / 0</div>
  </div>)
}



const InputNumber = ({
  value,
  onChange = () => { },
  onAdd = () => { },
  onMinus = () => { }
}) => {

  return (<div className={styles.inputNumberContainer}>
    <input
      type='number'
      min="0"
      step="1"
      onChange={onChange}
      value={value}
      className={styles.customeInput}
    />
    <div className={styles.imgContainer}>
      <img src="/img/icon_fold_Default.svg" className={styles.topArrow} onClick={onAdd} />
      <img src="/img/icon_fold_Default.svg" className={styles.bottomArrow} onClick={onMinus} />
    </div>
  </div>)
}
export default AccountName