import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { DAPP_CONNECTION_LIST, DAPP_DISCONNECT_SITE } from "../../../constant/types";
import { sendMsg } from "../../../utils/commonMsg";
import CustomView from "../../component/CustomView";
import Toast from "../../component/Toast";
import styles from "./index.module.scss";

const AppConnection = ({ }) => {

  const currentAddress = useSelector(state => state.accountInfo.currentAccount.address)

  const [connectList, setConnectList] = useState([])

  useEffect(() => {
    sendMsg({
      action: DAPP_CONNECTION_LIST,
      payload: {
        address: currentAddress
      }
    }, (list) => {
      setConnectList(list)
    })
  }, [])


  const onDeleteConnect = useCallback((item, index) => {
    sendMsg({
      action: DAPP_DISCONNECT_SITE,
      payload: {
        siteUrl: item,
        address: currentAddress
      }
    }, (status) => {
      if (status) {
        let newList = [...connectList]
        newList.splice(index, 1)
        setConnectList(newList)
      } else {
        Toast.info(i18n.t('disconnectFailed'))
      }
    })
  }, [connectList, i18n, currentAddress])


  return (
    <CustomView title={i18n.t("appConnection")} >
      {
        connectList.map((item, index) => {
          return (<div className={styles.rowContainer} key={index}>
            <span>{item}</span>
            <img src="/img/icon_delete.svg" onClick={() => onDeleteConnect(item, index)} />
          </div>)
        })
      }
    </CustomView>
  )
}
export default AppConnection
