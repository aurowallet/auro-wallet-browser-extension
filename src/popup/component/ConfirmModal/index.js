import cls from "classnames";
import i18n from "i18next";
import { useMemo } from "react";
import { Trans } from "react-i18next";
import { LEDGER_STATUS } from "../../../utils/ledger";
import Button from "../Button";
import styles from "./index.module.scss";

export const ConfirmModal = ({
    modalVisable = false,
    title = "",
    highlightTitle = "",
    highlightContent = "",
    subHighlightContent = "",

    contentList = [],

    onConfirm = () => { },
    loadingStatus = false,
    onClickClose = () => { },
    waitingLedger = false,
    ledgerStatus="",
    onClickReminder=()=>{}
}) => {
    const {showLedgerTip,nextLedgerTip} = useMemo(()=>{
        let nextLedgerTip = ""
        switch (ledgerStatus) {
            case LEDGER_STATUS.LEDGER_DISCONNECT:
                nextLedgerTip = "ledgerNotConnectTip"
              break;
            case LEDGER_STATUS.LEDGER_CONNECT_APP_NOT_OPEN:
                nextLedgerTip = "ledgerAppConnectTip"
              break;
            default:
              break;
          }
        const showLedgerTip = !!nextLedgerTip
        return {
            showLedgerTip,nextLedgerTip
        }
    },[ledgerStatus])
    
  
    return ( 
        <>
            {
                modalVisable && <div className={styles.outerContainer}>
                    <div className={styles.innerContent}>
                        <div className={styles.contentContainer}>
                            <div className={styles.titleRow}>
                                <span className={styles.rowTitle}>
                                    {title}
                                </span>
                                
                                <div className={styles.rightRow}>
                                    {ledgerStatus && <LedgerStatusView status={ledgerStatus}/>}
                                    <img onClick={onClickClose} className={styles.rowClose} src="/img/icon_nav_close.svg" />
                                </div>
                            </div>
                        </div>
                        <div className={styles.dividedLine} />

                        {waitingLedger && <div className={styles.ledgerContent}>
                            <img className={styles.waitingIcon} src="/img/detail_pending.svg"/>
                            <p className={styles.waitingTitle}>{i18n.t('waitingLedgerConfirm')+"..."}</p>
                            <p className={styles.waitingContent}>{i18n.t('waitingLedgerConfirmTip')}</p>
                            <p className={styles.waitingTip}>
                            <Trans
                                i18nKey={"waitingLedgerConfirmTip_2"}
                                components={{
                                    b: <span className={styles.accountRepeatName} />,
                                }}
                                />
                            </p>
                        </div>}

                        {!waitingLedger && <div className={cls(styles.bottomContent,{
                            [styles.ledgerTip]:showLedgerTip
                        })}>
                            <div className={styles.highlightContainer}>
                                <span className={styles.highlightTitle}>
                                    {highlightTitle}
                                </span>
                                <div className={styles.highlightCon}>
                                    <span className={styles.highlightContent}>
                                        {highlightContent}
                                    </span>
                                    <p className={styles.subHighlightContent}>
                                        {subHighlightContent}
                                    </p>
                                </div>
                            </div>
                            {
                                contentList.map((content, index) => {
                                    return <div key={index} className={styles.contentItemContainer}>
                                        <p className={styles.contentTitle}>{content.label}</p>
                                        <p className={styles.contentValue}>{content.value}</p>
                                    </div>
                                })
                            }
                        </div>}



                        {nextLedgerTip && <div className={styles.reminderContainer}>
                            <Trans
                                i18nKey={nextLedgerTip}
                                components={{
                                    click: <span onClick={onClickReminder} className={styles.clickItem} />
                                }}
                                />
                        </div>}
                        {!waitingLedger && <div className={cls(styles.bottomContainer)}>
                            <Button
                                loading={loadingStatus}
                                onClick={onConfirm}>
                                {i18n.t('confirm')}
                            </Button>
                        </div>}
                    </div>
                </div>
            }
        </>
    )
} 
const LedgerStatusView = ({ status }) => {
  const {showStatus,innerStatus} = useMemo(() => {
    let innerStatus = false
    let showStatus = false
    switch (status) {
      case LEDGER_STATUS.LEDGER_DISCONNECT:
        showStatus = false
        break;
      case LEDGER_STATUS.LEDGER_CONNECT_APP_NOT_OPEN:
        showStatus = true
        innerStatus = true
        break;
      case LEDGER_STATUS.READY:
        showStatus = true
        break;
      default:
        break;
    }
    return {
        showStatus,innerStatus
    }
  }, [status]);

  return (
    <div className={styles.ledgerCon}>
        <div className={cls(styles.statusDot,{
            [styles.dotWin]:showStatus
        })}>
            {innerStatus && <div className={styles.miniDot}/>}
        </div>
        <span className={styles.statusContent}>
            {i18n.t('ledgerStatus')}
        </span>
    </div>
  );
};