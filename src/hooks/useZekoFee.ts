import { useCallback, useEffect, useMemo, useState } from "react";

import { getZekoNetFee } from "@/background/api";
import { TRANSACTION_FEE, ZEKO_FEE_INTERVAL_TIME } from "@/constant";
import { parsedZekoFee } from "@/utils/fee";

interface UseZekoFeeOptions {
  isZeko: boolean;
  weight?: number;
  shouldFetch?: boolean;
  shouldPoll?: boolean;
}

export function useZekoFee({
  isZeko,
  weight = 1,
  shouldFetch = true,
  shouldPoll = true,
}: UseZekoFeeOptions) {
  const [zekoFee, setZekoFee] = useState(TRANSACTION_FEE);

  const fetchZekoFee = useCallback(async () => {
    if (!isZeko || !shouldFetch) {
      return;
    }
    const fee = await getZekoNetFee(weight);
    setZekoFee(parsedZekoFee(fee as string));
  }, [isZeko, shouldFetch, weight]);

  useEffect(() => {
    fetchZekoFee();
  }, [fetchZekoFee]);

  const feeIntervalTime = useMemo(() => {
    if (!isZeko || !shouldFetch || !shouldPoll) {
      return 0;
    }
    return ZEKO_FEE_INTERVAL_TIME;
  }, [isZeko, shouldFetch, shouldPoll]);

  return {
    zekoFee,
    feeIntervalTime,
    refreshZekoFee: fetchZekoFee,
  };
}
