import { useCallback, useMemo, useState } from "react";
import Transport from "@ledgerhq/hw-transport-webusb";
import { MinaApp } from "@zondax/ledger-mina-js";
import { LEDGER_CONNECTED_SUCCESSFULLY } from "../../../constant/msgTypes";
import { sendMsg } from "../../../utils/commonMsg";

import styles from "./index.module.scss";
import cls from "classnames";
import { Helmet } from "react-helmet";

import i18n from "i18next";
import LedgerConnected from "../../component/LedgerConnected";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";

const LedgerConnect = ({ }) => {

  const [connectCompleted, setConnectCompleted] = useState(false)
  const [connected, setConnected] = useState(false)
  const [opened, setOpened] = useState(false)


  const { steps } = useMemo(() => {
    const steps = [
      {
        title: i18n.t('firstStep'),
        content: i18n.t('pleaseConnectLedger'),
        bool: connected
      },
      {
        title: i18n.t('secondStep'),
        content: i18n.t('pleaseOpenInLedger'),
        bool: opened
      }
    ]
    return {
      steps
    }
  }, [connected, opened, i18n])

  const onDisconnected = useCallback(() => {
    setConnected(false)
  }, [])

  const goToNext = useCallback(async () => {
    let tempConnected = connected
    let tempOpened = opened
    var transport
    try {
      if (transport) {
        transport.off('disconnect', onDisconnected)
        try {
          await transport.close()
        } catch (e) {

        }
      }
      transport = await Transport.create()
      tempConnected = true
      transport.on('disconnect', onDisconnected)

    } catch (e) {
      tempConnected = false
    }
    try {
      var app = new MinaApp(transport)
      const result = await app.getAppName()
      if (result.name === 'Mina') {
        tempOpened = true
      } else {
        tempOpened = false
      }
    } catch (e) {
      tempOpened = false
    }
    setConnected(tempConnected)
    setOpened(tempOpened) 

    if (tempConnected && tempOpened) {
      sendMsg({
        action: LEDGER_CONNECTED_SUCCESSFULLY,
      }, () => {
        transport.close()
        transport = null
        setConnectCompleted(true)
      });
    }

  }, [connected, opened])

  return (<CustomView title={i18n.t('connectLedger')} noBack>
    <Helmet>
      <meta charSet="utf-8" />
      <link rel="canonical" href="./popup.html#/ledger_connect" />
    </Helmet>
    <div className={styles.stepsContainer}>
      <div className={styles.ledgerIconContainer}>
        <img src='/img/ledger_logo.svg' />
      </div>
      {
        connectCompleted ? <LedgerConnected tips={['back2extension', 'dontclose']} /> :
          steps.map((step, index) => {
            return <div key={index} className={cls(styles.stepContainer, {
              [styles.checked]: step.bool
            })}>
              <div className={styles.contentContainer}>
                <p className={styles.title}>{step.title}</p>
                <p className={styles.content}>{step.content}</p>
              </div>
              {step.bool && <div className={styles.checkContainer}>
                <img src="/img/icon_green_checked.svg" />
              </div>}
            </div>
          })
      }
    </div>
    <div className={styles.hold} />
    {!connectCompleted && <div className={styles.bottomContainer}>
      <Button
        onClick={goToNext}>
        {i18n.t('next')}
      </Button>
    </div>}
  </CustomView>)
}

export default LedgerConnect