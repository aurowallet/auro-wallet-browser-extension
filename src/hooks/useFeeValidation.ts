import { useCallback, useState } from "react";
import BigNumber from "bignumber.js";
import i18n from "i18next";
import { DEFAULT_FEE_CONFIG } from "@/constant";
import type { FeeConfig } from "@/types/tx.types";
import { useAppSelector } from "@/hooks/useStore";

/**
 * Centralized fee validation hook.
 *
 * Reads `feeCap` from the Redux store (`feeConfig`) and provides:
 * - `feeErrorTip`   – the current error message (empty when valid)
 * - `validateFee`   – call with a fee value to update `feeErrorTip`
 * - `setFeeErrorTip` – escape-hatch for manual resets (e.g. closing advance mode)
 * - `feeConfig`     – the full FeeConfig from the store (avoids a second useAppSelector)
 */
export function useFeeValidation() {
  const feeConfig = useAppSelector((state) => state.cache.feeRecommend);
  const [feeErrorTip, setFeeErrorTip] = useState("");

  const validateFee = useCallback(
    (value: string | number) => {
      const bn = BigNumber(value);
      if (bn.isNaN()) {
        setFeeErrorTip("");
        return;
      }
      const feeCap = feeConfig?.feeCap ?? DEFAULT_FEE_CONFIG.feeCap;
      if (bn.gt(feeCap)) {
        setFeeErrorTip(i18n.t("feeTooHigh"));
      } else {
        setFeeErrorTip("");
      }
    },
    [feeConfig]
  );

  return { feeErrorTip, setFeeErrorTip, validateFee, feeConfig };
}

/**
 * Pure utility – returns true when `fee` exceeds the cap.
 * Useful outside of React components.
 */
export function isFeeExceedsCap(
  fee: string | number,
  feeConfig?: FeeConfig
): boolean {
  const feeCap = feeConfig?.feeCap ?? DEFAULT_FEE_CONFIG.feeCap;
  return BigNumber(fee).gt(feeCap);
}
