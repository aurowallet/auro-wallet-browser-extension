import { ACCOUNT_TYPE, LEDGER_STATUS } from "@/constant/commonType";
import { updateLedgerConnectStatus } from "@/reducers/ledger";
import ledgerManager from "@/utils/ledger";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function LedgerStatusSyncer() {
  const dispatch = useDispatch();

  const currentAccount = useSelector(
    (state) => state.accountInfo.currentAccount
  );
  const isLedgerAccount = currentAccount?.type === ACCOUNT_TYPE.WALLET_LEDGER;

  useEffect(() => {
    if (!isLedgerAccount) {
      dispatch(updateLedgerConnectStatus(LEDGER_STATUS.LEDGER_DISCONNECT));
      return;
    }

    const syncStatus = (status) => {
      dispatch(updateLedgerConnectStatus(status));
    };

    ledgerManager.addStatusListener(syncStatus);
    ledgerManager.ensureConnect?.();

    return () => {
      ledgerManager.removeStatusListener(syncStatus);
      console.log("LedgerStatusSyncer: STOP monitoring");
    };
  }, [dispatch, isLedgerAccount]);

  return null;
}
