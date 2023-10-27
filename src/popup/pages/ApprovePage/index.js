import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from 'react-router-dom';
import { DAPP_ACTION_CLOSE_WINDOW, DAPP_ACTION_GET_ACCOUNT, DAPP_GET_CURRENT_ACCOUNT_CONNECT_STATUS, WALLET_GET_CURRENT_ACCOUNT } from "../../../constant/msgTypes";
import { updateDAppOpenWindow } from "../../../reducers/cache";
import { ENTRY_WITCH_ROUTE, updateEntryWitchRoute } from "../../../reducers/entryRouteReducer";
import { sendMsg } from "../../../utils/commonMsg";
import { addressSlice, getQueryStringArgs } from "../../../utils/utils";
import Button, { button_size, button_theme } from "../../component/Button";
import DappWebsite from "../../component/DappWebsite";
import { LockPage } from "../Lock";
import styles from "./index.module.scss";

const ApprovePage = () => {
  const dispatch = useDispatch()
  const history = useHistory()

  const dappWindow = useSelector(state => state.cache.dappWindow)
  const currentAccount = useSelector(state => state.accountInfo.currentAccount)

  const [lockStatus, setLockStatus] = useState(false)

  const [params, setParams] = useState(() => {
    let url = dappWindow.url || window.location?.href || ""
    return getQueryStringArgs(url)
  })

  const goToHome = useCallback(() => {
    let url = dappWindow?.url
    if (url) {
      dispatch(updateEntryWitchRoute(ENTRY_WITCH_ROUTE.HOME_PAGE))
    }
    dispatch(updateDAppOpenWindow({}))
  }, [dappWindow])


  useEffect(() => {
    sendMsg({
      action: WALLET_GET_CURRENT_ACCOUNT,
    }, async (currentAccount) => {
      setLockStatus(currentAccount.isUnlocked)
    })
  }, [])

  const onCancel = useCallback(() => {
    sendMsg({
      action: DAPP_ACTION_GET_ACCOUNT,
      payload: {
        selectAccount: [],
        currentAddress: currentAccount.address,
        resultOrigin: params.siteUrl,
      }
    }, async () => {
      goToHome()
    })
  }, [currentAccount, goToHome, params])

  const onConfirm = useCallback(() => {
    let selectAccount = [currentAccount]
    sendMsg({
      action: DAPP_ACTION_GET_ACCOUNT,
      payload: {
        selectAccount,
        resultOrigin: params.siteUrl,
      },
    }, () => {
      goToHome()
    })
  }, [goToHome, params, currentAccount])

  const onClickUnLock = useCallback(() => {
    let siteUrl = params.siteUrl || ""
    sendMsg({
      action: DAPP_GET_CURRENT_ACCOUNT_CONNECT_STATUS,
      payload: {
        siteUrl: siteUrl,
        currentAddress: currentAccount.address,
      }
    }, async (currentAccountConnectStatus) => {

      if (currentAccountConnectStatus) {
        sendMsg({
          action: DAPP_ACTION_CLOSE_WINDOW,
          payload: {
            page: "approve_page",
            account: currentAccount.address,
            resultOrigin: siteUrl,
          },
        }, (params) => {
        })
      } else {
        setLockStatus(true)
      }
    })
  }, [currentAccount, params])

  const showAccountInfo = useMemo(()=>{
    return currentAccount.accountName +"("+ addressSlice(currentAccount.address,6)  + ")"
  },[currentAccount])

  if (!lockStatus) {
    return <LockPage onDappConfirm={true} onClickUnLock={onClickUnLock} history={history} />;
  }
  return (<div className={styles.conatiner}>

    <div className={styles.titleRow}>
      <p className={styles.title}>
        {i18n.t('connectionRequest')}
      </p>
    </div>
    <div className={styles.content}>

      <div className={styles.websiteContainer}>
        <DappWebsite siteIcon={params.siteIcon} siteUrl={params.siteUrl} />
      </div>
      <p className={styles.accountTip}>{i18n.t('approveTip') + ":"}</p>
      <p className={styles.accountAddress}>{
        showAccountInfo
      }</p>
      <p className={styles.warningTip}>{'* ' + i18n.t('approveWaring')}</p>


    </div>
    <div className={styles.btnGroup}>
      <Button
        onClick={onCancel}
        theme={button_theme.BUTTON_THEME_LIGHT}
        size={button_size.middle}>{i18n.t('cancel')}</Button>
      <Button
        size={button_size.middle}
        onClick={onConfirm}
      >{i18n.t('connect')}</Button>
    </div>
  </div>)
}

export default ApprovePage