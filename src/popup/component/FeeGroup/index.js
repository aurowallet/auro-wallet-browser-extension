import BigNumber from "bignumber.js";
import cls from "classnames";
import i18n from "i18next";
import { useMemo } from "react";
import styles from "./index.module.scss";
import { MAIN_COIN_CONFIG } from "@/constant";


const FeeGroup = ({
    currentFee,
    netFeeList = [],
    onClickFee = () => { }
}) => {
    const {
        feeList
    } = useMemo(() => {
        let feeList = [
            {
                text: i18n.t("fee_slow"),
                fee: " "
            }, {
                text: i18n.t("fee_default"),
                fee: " "
            },
            {
                text: i18n.t("fee_fast"),
                fee: " "
            }
        ]
        if (netFeeList.length >= feeList.length) {
            feeList.map((item, index) => {
                return item.fee = netFeeList[index].value
            })
        }
        return {
            feeList
        }
    }, [i18n, netFeeList])


    return (<div className={styles.feeContainer}>
        <div className={styles.topContainer}>
            <p className={styles.feeTitle}>{i18n.t("fee")}</p>
            <p className={styles.feeAmount}>{currentFee + " " + MAIN_COIN_CONFIG.symbol}</p>
        </div>
        <div className={styles.btnGroup}>
            {
                feeList.map((fee, index) => {
                    let selectStatus = new BigNumber(fee.fee).isEqualTo(currentFee)
                    return (<div key={index}
                        onClick={() => onClickFee(fee)}
                        className={cls(styles.btn, styles.common, {
                            [styles.checked]: selectStatus
                        })}>{fee.text}</div>)
                })
            }
        </div>
    </div>)
}

export default FeeGroup