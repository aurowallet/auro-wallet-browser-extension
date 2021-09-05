import { combineReducers } from 'redux';
import accountInfo from "./accountReducer";
import appReducer from './appReducer';
import cacheReducer from "./cache";
import entryRouteReducer from './entryRouteReducer';
import network from './network';
import staking from "./stakingReducer";
import tabRouteConfig from './tabRouteReducer';
import currencyConfig from './currency';


export const RESET_DATA = "RESET_DATA"

/**
 * Change network configuration
 * @param {*} data
 */
export function resetWallet() {
    return {
        type: RESET_DATA,
    };
}

const appRootReducer = combineReducers({
  entryRouteReducer: entryRouteReducer,
  appReducer: appReducer,
  tabRouteConfig,
  network,
  accountInfo,
  cache: cacheReducer,
  staking,
  currencyConfig
});

const rootReducer = (state, action) => {
  if (action.type === RESET_DATA) {
    return appRootReducer(undefined, action)
  }
  return appRootReducer(state, action)
}
export default rootReducer;
