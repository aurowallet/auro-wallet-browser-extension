import cls from "classnames";
import i18n from "i18next";
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
    waitingLedger = false
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
                                <img onClick={onClickClose} className={styles.rowClose} src="/img/icon_nav_close.svg" />
                            </div>
                        </div>
                        <div className={styles.dividedLine} />

                        {waitingLedger && <div className={styles.ledgerContent}>
                            <img className={styles.waitingIcon} src="/img/detail_pending.svg"/>
                            <p className={styles.waitingTitle}>{i18n.t('waitingLedgerConfirm')+"..."}</p>
                            <p className={styles.waitingContent}>{i18n.t('waitingLedgerConfirmTip')}</p>
                            <p className={styles.waitingTip}>{i18n.t('waitingLedgerConfirmTip_2')}</p>
                        </div>}

                        {!waitingLedger && <div className={styles.bottomContent}>
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