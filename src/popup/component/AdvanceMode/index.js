import { useMemo } from "react";
import { useSelector } from "react-redux";
import i18n from "i18next";
import Input from "../../component/Input";
import styles from "./index.module.scss";

const AdvanceMode = ({
    isOpenAdvance = false,
    onClickAdvance = () => { },

    feeValue = "",
    onFeeInput = () => { },
    feeErrorTip = "",

    nonceValue = "",
    onNonceInput = () => { },

}) => {
    const netAccount = useSelector(state => state.accountInfo.netAccount)
    const nonceHolder = useMemo(() => {
        return netAccount.inferredNonce ? "Nonce " + netAccount.inferredNonce : "Nonce "
    }, [netAccount])

    return (
        <div className={styles.advanceContainer}>
            <div className={styles.advanceEntry} onClick={onClickAdvance}>
                <p className={styles.advanceTitle}>{i18n.t("advanceMode")}</p>
                <img className={isOpenAdvance ? styles.openAdvance : styles.closeAdvance} src="/img/icon_unfold_Default.svg" />
            </div>
            {isOpenAdvance && <div className={styles.advanceInput}>
                <Input
                    label={i18n.t('transactionFee')}
                    onChange={onFeeInput}
                    value={feeValue}
                    inputType={'text'}
                    showBottomTip={true}
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
            </div>}
        </div>
    )
}


export default AdvanceMode