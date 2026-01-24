import { ACCOUNT_TYPE, LEDGER_STATUS, LedgerStatusType } from "@/constant/commonType";
import { updateLedgerConnectStatus } from "@/reducers/ledger";
import ledgerManager from "@/utils/ledger";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";

export default function LedgerStatusSyncer() {
  const dispatch = useAppDispatch();

  const currentAccount = useAppSelector(
    (state) => state.accountInfo.currentAccount
  );
  const isLedgerAccount = currentAccount?.type === ACCOUNT_TYPE.WALLET_LEDGER;

  useEffect(() => {
    if (!isLedgerAccount) {
      dispatch(updateLedgerConnectStatus(LEDGER_STATUS.LEDGER_DISCONNECT));
      return;
    }

    const syncStatus = (status: LedgerStatusType) => {
      dispatch(updateLedgerConnectStatus(status));
    };

    ledgerManager.addStatusListener(syncStatus);
    ledgerManager.ensureConnect?.();

    return () => {
      ledgerManager.removeStatusListener(syncStatus);
    };
  }, [dispatch, isLedgerAccount]);

  return null;
}
