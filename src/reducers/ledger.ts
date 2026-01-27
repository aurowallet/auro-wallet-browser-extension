import { LEDGER_STATUS, LedgerStatusType } from "@/constant/commonType";

// ============ Action Types ============

const UPDATE_LEDGER_CONNECT_STATUS = "UPDATE_LEDGER_CONNECT_STATUS";

// ============ Action Interfaces ============

interface UpdateLedgerConnectStatusAction {
  type: typeof UPDATE_LEDGER_CONNECT_STATUS;
  ledgerConnectStatus: LedgerStatusType;
}

type LedgerAction = UpdateLedgerConnectStatusAction;

// ============ State Interface ============

export interface LedgerState {
  ledgerConnectStatus: LedgerStatusType;
}

// ============ Action Creators ============

export function updateLedgerConnectStatus(
  status: LedgerStatusType
): UpdateLedgerConnectStatusAction {
  return {
    type: UPDATE_LEDGER_CONNECT_STATUS,
    ledgerConnectStatus: status,
  };
}

// ============ Initial State ============

const initState: LedgerState = {
  ledgerConnectStatus: LEDGER_STATUS.LEDGER_DISCONNECT,
};

// ============ Reducer ============

const ledger = (
  state: LedgerState = initState,
  action: LedgerAction
): LedgerState => {
  switch (action.type) {
    case UPDATE_LEDGER_CONNECT_STATUS:
      return {
        ...state,
        ledgerConnectStatus: action.ledgerConnectStatus,
      };
    default:
      return state;
  }
};

export default ledger;
