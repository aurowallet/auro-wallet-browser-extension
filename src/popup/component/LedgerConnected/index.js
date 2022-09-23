import { Trans } from 'react-i18next';
import styles from './index.module.scss';

import i18n from "i18next";
 
const LedgerConnected = ({ tips=['back2extension', 'dontclose'] }) => {
  return (<div className={styles.connectContainer}>
    <div className={styles.imgContainer}>
      <img src='/img/ledgerConnect.svg'/>
    </div>
    <p className={styles.connectTip}>{i18n.t('dappConnect')}</p>
    {
      tips.map((tip, index) => {
        return <div key={index + ""} className={styles.tipsContainer}>
          <Trans
            i18nKey={tip}
            components={{ b: <span className={styles.boldTxt}/> ,red:<span className={styles.redTxt}/>}}
          />
        </div>
      })
    }
  </div>)
}

export default LedgerConnected