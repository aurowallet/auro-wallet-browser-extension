import { useMemo } from "react";
import { useSelector } from "react-redux";
import i18n from "i18next";
import Input from "../../component/Input";
import styles from "./index.module.scss";
import { isNaturalNumber } from "@/utils/utils";

const AdvanceMode = ({
    isOpenAdvance = false,
    onClickAdvance = () => { },

    feeValue = "",
    feePlaceholder = "",
    onFeeInput = () => { },
    feeErrorTip = "",

    nonceValue = "",
    onNonceInput = () => { },

    type ="",
}) => {
    const mainTokenNetInfo = useSelector(state => state.accountInfo.mainTokenNetInfo)
    const nonceHolder = useMemo(() => {
        return isNaturalNumber(mainTokenNetInfo?.inferredNonce) ? mainTokenNetInfo?.inferredNonce : ""
    }, [mainTokenNetInfo])

    return (
        <div className={styles.advanceContainer}>
            {!type && <div className={styles.advanceEntry} onClick={onClickAdvance}>
                <p className={styles.advanceTitle}>{i18n.t("advanceMode")}</p>
                <img className={isOpenAdvance ? styles.openAdvance : styles.closeAdvance} src="/img/icon_unfold_Default.svg" />
            </div>}
            {isOpenAdvance && <div className={styles.advanceInput}>
                <Input
                    label={i18n.t('transactionFee')}
                    onChange={onFeeInput}
                    value={feeValue}
                    inputType={'numric'}
                    placeholder={feePlaceholder}
                    showBottomTip={true}
                    bottomTip={feeErrorTip}
                    bottomTipClass={styles.waringTip}
                />
                <Input
                    label={"Nonce"}
                    onChange={onNonceInput}
                    value={nonceValue}
                    inputType={'numric'}
                    placeholder={nonceHolder}
                    inputDisable={!!type}
                />
            </div>}
        </div>
    )
}


export default AdvanceMode