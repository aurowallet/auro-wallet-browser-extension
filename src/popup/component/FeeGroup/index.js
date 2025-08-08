import { MAIN_COIN_CONFIG } from "@/constant";
import BigNumber from "bignumber.js";
import cls from "classnames";
import i18n from "i18next";
import { useMemo } from "react";
import CountdownTimer from "../CountdownTimer";
import styles from "./index.module.scss";

const FeeGroup = ({
  currentFee,
  netFeeList = [],
  onClickFee = () => {},
  showFeeGroup = true,
  hideTimer = true,
}) => {
  const { feeList } = useMemo(() => {
    let feeList = [
      {
        text: i18n.t("fee_slow"),
        fee: " ",
      },
      {
        text: i18n.t("fee_default"),
        fee: " ",
      },
      {
        text: i18n.t("fee_fast"),
        fee: " ",
      },
    ];
    if (netFeeList.length >= feeList.length) {
      feeList = feeList.map((item, index) => ({
        ...item,
        fee: netFeeList[index].value,
      }));
    }
    return {
      feeList,
    };
  }, [netFeeList]);

  return (
    <div className={styles.feeContainer}>
      <div className={styles.topContainer}>
        <p className={styles.feeTitle}>{i18n.t("fee")}</p>
        <div className={styles.feeAmountWrapper}>
          <div>{currentFee + " " + MAIN_COIN_CONFIG.symbol}</div>
          {!hideTimer ? <CountdownTimer /> : <></>}
        </div>
      </div>
      {showFeeGroup ? (
        <div className={styles.btnGroup}>
          {feeList.map((fee, index) => {
            let selectStatus = new BigNumber(fee.fee).isEqualTo(currentFee);
            return (
              <div
                key={index}
                onClick={() => onClickFee(fee)}
                className={cls(styles.btn, styles.common, {
                  [styles.checked]: selectStatus,
                })}
              >
                {fee.text}
              </div>
            );
          })}
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

export default FeeGroup;
