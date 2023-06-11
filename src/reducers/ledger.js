const UPDATE_LEDGER_CONNECT_STATUS = "UPDATE_LEDGER_CONNECT_STATUS";

/**
 * update ledger config
 * @param {*} data
 */
export function updateLedgerConnectStatus(status) {
  return {
    type: UPDATE_LEDGER_CONNECT_STATUS,
    ledgerConnectStatus: status,
  };
}

const initState = {
  ledgerConnectStatus: "",
};

const ledger = (state = initState, action) => {
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
