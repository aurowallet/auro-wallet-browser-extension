import cls from "classnames";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import Button from "../Button";
import Input from "../Input";
import styles from "./index.module.scss";

const DAppAdvance = ({
    modalVisable = false,
    title = '',
    onConfirm = () => { },
    onClickClose = () => { },

    feeValue = "",
    feePlaceHolder="",
    onFeeInput = () => { },
    feeErrorTip = "",

    nonceValue = "",
    onNonceInput = () => { },
}) => {

    const netAccount = useSelector(state => state.accountInfo.netAccount)
    const nonceHolder = useMemo(() => {
        return netAccount.inferredNonce ? netAccount.inferredNonce : ""
    }, [netAccount])

    const onClickOuter = useCallback((e) => {
        onClickClose()
    }, [onClickClose])

    const onClickContent = useCallback((e) => {
        e.stopPropagation();
    }, [onClickClose])

    const [modalBg, setModalBg] = useState(modalVisable)

    useEffect(() => {
        if (modalVisable) {
            setModalBg(modalVisable)
        } else {
            setTimeout(() => {
                setModalBg(modalVisable)
            }, 300);
        }
    }, [modalVisable])

    return (
        <>
            <div className={cls(styles.outerContainer, {
                [styles.outerContainerShow]: modalBg
            })} onClick={onClickOuter}>
                <div className={cls(styles.innerContent, {
                    [styles.innerContentShow]: modalVisable
                })} onClick={onClickContent}>
                    <div className={styles.contentContainer}>
                        <div className={styles.titleRow}>
                            <span className={styles.rowTitle}>
                                {title}
                            </span>
                            <img onClick={onClickClose} className={styles.rowClose} src="/img/icon_nav_close.svg" />
                        </div>
                    </div>
                    <div className={styles.dividedLine} />
                    <div className={styles.bottomContent}>
                        <Input
                            label={i18n.t('transactionFee')}
                            onChange={onFeeInput}
                            value={feeValue}
                            inputType={'text'}
                            showBottomTip={true}
                            placeholder={feePlaceHolder}
                            bottomTip={feeErrorTip}
                            bottomTipClass={styles.waringTip}
                        />
                        <Input
                            label={"Nonce"}
                            onChange={onNonceInput}
                            value={nonceValue}
                            inputType={'text'}
                            placeholder={nonceHolder}
                        />
                    </div>

                    <div className={cls(styles.bottomContainer, {
                        [styles.bottomContainerShow]: modalVisable
                    })}>
                        <Button
                            onClick={onConfirm}>
                            {i18n.t('confirm')}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    )
}
export default DAppAdvance