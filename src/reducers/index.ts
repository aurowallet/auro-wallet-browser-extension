import { combineReducers, Reducer, AnyAction } from "redux";
import accountInfo from "./accountReducer";
import appReducer, { AppState } from "./appReducer";
import cacheReducer from "./cache";
import entryRouteReducer from "./entryRouteReducer";
import network, { NetworkState } from "./network";
import staking from "./stakingReducer";
import tabRouteConfig from "./tabRouteReducer";
import currencyConfig from "./currency";
import ledger, { LedgerState } from "./ledger";
import popupReducer from "./popupReducer";

// ============ Action Types ============

export const RESET_DATA = "RESET_DATA";

// ============ Action Interfaces ============

interface ResetDataAction {
  type: typeof RESET_DATA;
}

// ============ Action Creators ============

export function resetWallet(): ResetDataAction {
  return {
    type: RESET_DATA,
  };
}

// ============ Root State Type ============

// TODO: Complete type definitions as each reducer is migrated
export interface RootState {
  entryRouteReducer: ReturnType<typeof entryRouteReducer>;
  appReducer: AppState;
  tabRouteConfig: ReturnType<typeof tabRouteConfig>;
  network: NetworkState;
  accountInfo: ReturnType<typeof accountInfo>;
  cache: ReturnType<typeof cacheReducer>;
  staking: ReturnType<typeof staking>;
  currencyConfig: ReturnType<typeof currencyConfig>;
  ledger: LedgerState;
  popupReducer: ReturnType<typeof popupReducer>;
}

// ============ Combined Reducer ============

const appRootReducer = combineReducers({
  entryRouteReducer: entryRouteReducer,
  appReducer: appReducer,
  tabRouteConfig,
  network,
  accountInfo,
  cache: cacheReducer,
  staking,
  currencyConfig,
  ledger,
  popupReducer,
});

// ============ Root Reducer with Reset ============

const rootReducer: Reducer<RootState, AnyAction> = (state, action) => {
  if (action.type === RESET_DATA) {
    return appRootReducer(undefined, action as Parameters<typeof appRootReducer>[1]);
  }
  return appRootReducer(state, action as Parameters<typeof appRootReducer>[1]);
};

export default rootReducer;
