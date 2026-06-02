import BigNumber from "bignumber.js";

import { MAIN_COIN_CONFIG, TRANSACTION_FEE } from "@/constant";
import { amountDecimals } from "@/utils/utils";

export const parsedZekoFee = (
  fee: string | number | undefined,
  buffer: number = 0.1
): number => {
  const hasFee = fee !== undefined && fee !== null && fee !== "";
  if (!hasFee) {
    return TRANSACTION_FEE;
  }

  const normalizedFee = amountDecimals(fee as string | number, MAIN_COIN_CONFIG.decimals);
  let feePerWeightUnit = new BigNumber(normalizedFee);

  if (!feePerWeightUnit.isFinite() || feePerWeightUnit.lte(0)) {
    return TRANSACTION_FEE;
  }

  if (buffer) {
    feePerWeightUnit = feePerWeightUnit.multipliedBy(buffer + 1);
  }

  return Number(
    feePerWeightUnit
      .decimalPlaces(MAIN_COIN_CONFIG.decimals, BigNumber.ROUND_DOWN)
      .toString()
  );
};

export const getFeeWithZekoMinimum = (
  fee: string | number,
  isZeko: boolean,
  zekoMinFee: string | number
): string | number => {
  if (!isZeko) {
    return fee;
  }
  return BigNumber.max(fee || 0, zekoMinFee || 0).toString();
};
