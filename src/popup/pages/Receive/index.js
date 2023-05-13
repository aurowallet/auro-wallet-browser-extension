import i18n from "i18next";
import QRCode from 'qrcode.react';
import { useCallback, useState } from "react";
import { useSelector } from 'react-redux';
import { POWER_BY } from "../../../constant";
import { copyText } from '../../../utils/utils';
import CustomView from '../../component/CustomView';
import Toast from "../../component/Toast";
import styles from "./index.module.scss";

const ReceivePage = ({ }) => {

  const accountInfo = useSelector(state => state.accountInfo)
  const [currentAccount, setCurrentAccount] = useState(accountInfo.currentAccount)

  const onCopy = useCallback(() => {
    copyText(currentAccount.address).then(() => {
      Toast.info(i18n.t('copySuccess'))
    })

  }, [i18n, currentAccount])

  return (<CustomView
    isReceive={true}
    title={i18n.t('receive')}
    contentClassName={styles.container}>

    <div className={styles.content}>
      <p className={styles.title}>{i18n.t('scanPay')}</p>
      <div className={styles.dividedLine} />
      <p className={styles.receiveTip}>
        {i18n.t('addressQrTip')}
      </p>
      <div className={styles.qrCodeContainer}>
        <QRCode
          value={currentAccount.address}
          size={150}
          level={"H"}
          fgColor="#000000"
          imageSettings={{
            src: '/img/logo/128.png',
            height: 30,
            width: 30,
            excavate: true
          }}
        />
      </div>
      <p className={styles.address}>
        {currentAccount.address}
      </p>
      <div className={styles.dividedLine2} />
      <div className={styles.copyOuterContainer} onClick={onCopy}>
        <div className={styles.copyContainer}>
          <img src='/img/icon_copy.svg' className={styles.copyIcon} />
          <p className={styles.copyTxt}>
            {i18n.t('copy')}
          </p>
        </div>
      </div>
    </div>
    <p className={styles.bottomTip}>
      {POWER_BY}
    </p>
  </CustomView>)
}

export default ReceivePage

