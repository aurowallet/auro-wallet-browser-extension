import { combineReducers } from 'redux';
import accountInfo from "./accountReducer";
import appReducer from './appReducer';
import cacheReducer from "./cache";
import entryRouteReducer from './entryRouteReducer';
import network from './network';
import staking from "./stakingReducer";
import tabRouteConfig from './tabRouteReducer';
import currencyConfig from './currency';


const rootReducer = combineReducers({
  entryRouteReducer: entryRouteReducer,
  appReducer: appReducer,
  tabRouteConfig,
  network,
  accountInfo,
  cache: cacheReducer,
  staking,
  currencyConfig
});

export default rootReducer;
