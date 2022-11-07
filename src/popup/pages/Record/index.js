import cls from "classnames";
import extension from 'extensionizer';
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from 'react-router-dom';
import { cointypes } from '../../../../config';
import { FROM_BACK_TO_RECORD, TX_SUCCESS } from '../../../constant/types';
import { updateShouldRequest } from "../../../reducers/accountReducer";
import { openTab } from '../../../utils/commonMsg';
import { copyText, getAmountDisplay, getShowTime } from "../../../utils/utils";
import CustomView from "../../component/CustomView";
import Toast from "../../component/Toast";
import styles from "./index.module.scss";

const STATUS = {
  TX_STATUS_PENDING: "PENDING",
  TX_STATUS_INCLUDED: "INCLUDED",
  TX_STATUS_UNKNOWN: "UNKNOWN",

  TX_STATUS_SUCCESS: "applied",
  TX_STATUS_FAILED: "failed",
}

const Record = ({ }) => {

  const netConfig = useSelector(state => state.network)
  const dispatch = useDispatch()


  const history = useHistory()
  const [txDetail, setTxDetail] = useState(history.location.params?.txDetail || {})
  const {
    statusIcon, statusTitle, statusClass,
    contentList
  } = useMemo(() => {
    let statusIcon, statusTitle, statusClass = ''

    if(txDetail.status === STATUS.TX_STATUS_PENDING){
        statusIcon = "/img/detail_pending.svg"
        statusTitle = i18n.t('wait')
        statusClass = styles.txPending
    }else{
      if(txDetail.failureReason){
        statusIcon = "/img/detail_failed.svg"
        statusTitle = i18n.t('failed')
        statusClass = styles.txFailed
      }else{
        statusIcon = "/img/detail_success.svg"
        statusTitle = i18n.t('success')
        statusClass = styles.txSuccess
      }
    }

    let amount = getAmountDisplay(txDetail.amount, cointypes.decimals, cointypes.decimals) + " " + cointypes.symbol
    let receiveAddress = txDetail.to 
    let sendAddress = txDetail.from
    let memo = txDetail.memo || ""
    let fee = getAmountDisplay(txDetail.fee, cointypes.decimals, cointypes.decimals) + " " + cointypes.symbol
    let txTime = txDetail.dateTime ? getShowTime(txDetail.dateTime) : ""
    let nonce = String(txDetail.nonce)
    let txHash = txDetail.hash


    let contentList = [
      {
        title: i18n.t('amount'),
        content: amount
      },
      {
        title: i18n.t('to'),
        content: receiveAddress
      },
      {
        title: i18n.t('from'),
        content: sendAddress
      }
    ]
    if (memo) {
      contentList.push({
        title: 'Memo',
        content: memo
      })
    }
    contentList.push({
      title: i18n.t('fee'),
      content: fee
    })

    if (txTime) {
      contentList.push({
        title: i18n.t('time'),
        content: txTime
      })
    }
    contentList.push({
      title: "Nonce",
      content: nonce
    }, {
      title: i18n.t('transationHash'),
      content: txHash
    })
    return {
      statusIcon, statusTitle, statusClass,
      contentList,
    }
  }, [i18n, txDetail])

  const getExplorerUrl = useCallback(() => {
    let currentConfig = netConfig.currentConfig
    return currentConfig.explorer
  }, [netConfig])

  const [showExplorer, setShowExplorer] = useState(() => {
    return !!getExplorerUrl()
  })

  useEffect(() => {
    setShowExplorer(!!getExplorerUrl())
  }, [netConfig.currentConfig])

  const onGoExplorer = useCallback(() => {
    let url = getExplorerUrl() + "/transaction/" + txDetail.hash
    openTab(url)
  }, [netConfig, txDetail])


  useEffect(() => {
    let onMessageListening = (message, sender, sendResponse) => {
      const { type, action, hash } = message;
      if (type === FROM_BACK_TO_RECORD && action === TX_SUCCESS && hash === txDetail.hash) {
        setTxStatus(STATUS.TX_STATUS_INCLUDED)
        dispatch(updateShouldRequest(true, true))
        sendResponse();
      }
      return true;
    }
    extension.runtime.onMessage.addListener(onMessageListening);
    return () => {
      extension.runtime.onMessage.removeListener(onMessageListening);
    };
  }, []);


  return (<CustomView title={i18n.t('details')} contentClassName={styles.container}>
    <div className={styles.statusContainer}>
      <img src={statusIcon} />
      <p className={cls(styles.detailTitle, statusClass)}>
        {statusTitle}
      </p>
    </div>
    <div className={styles.dividedLine} />
    {contentList.map((item, index) => {
      return <DetailRow key={index} title={item.title} content={item.content} />
    }, [])}
    {showExplorer && <div className={styles.explorerContainer} onClick={onGoExplorer}>
      <p className={styles.explorerTitle}>
        {i18n.t('queryDetails')}
      </p>
      <img src="/img/icon_link.svg" className={styles.iconLink} />
    </div>}
  </CustomView>)
}

const DetailRow = ({ title, content }) => {
  const onCopy = useCallback(() => {
    copyText(content).then(() => {
      Toast.info(i18n.t('copySuccess'))
    })
  }, [title, content])

  return (<div className={styles.rowContainer} onClick={onCopy}>
    <p className={styles.rowTitle}>{title}</p>
    <p className={styles.rowContent}>{content}</p>
  </div>)
}


export default Record