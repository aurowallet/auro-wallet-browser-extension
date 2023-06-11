import cls from "classnames";
import i18n from "i18next";
import { useMemo } from "react";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import { LEDGER_STATUS } from "../../../constant/ledger";
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
}) => {
  
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
                                    <LedgerStatusView/>
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
                                i18nKey={"waitingLedgerConfirmTip_3"}
                                components={{
                                    b: <span className={styles.accountRepeatName} />,
                                    red: <span className={styles.redFont} />,
                                }}
                                />
                            </p>
                        </div>}

                        {!waitingLedger && <div className={cls(styles.bottomContent,{
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
const LedgerStatusView = () => {
    const ledgerStatus = useSelector(state=>state.ledger.ledgerConnectStatus)
  const {showStatus} = useMemo(() => {
    
    let showStatus = false
    if(ledgerStatus === LEDGER_STATUS.READY){
        showStatus = true
    }
    return {
        showStatus
    }
  }, [ledgerStatus]);
  if(!ledgerStatus){
    return<></>
  }
  return (
    <div className={styles.ledgerCon}>
        <div className={cls(styles.statusDot,{
            [styles.dotWin]:showStatus
        })}/>
        <span className={styles.statusContent}>
            {i18n.t('ledgerStatus')}
        </span>
    </div>
  );
};