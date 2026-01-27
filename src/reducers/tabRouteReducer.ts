// ============ Action Types ============

const CHANGE_HOME_PAGE_INDEX = "CHANGE_HOME_PAGE_INDEX";
const CHANGE_COIN_DETAIL_TAB_INDEX = "CHANGE_COIN_DETAIL_TAB_INDEX";

// ============ Action Interfaces ============

interface UpdateHomeIndexAction {
  type: typeof CHANGE_HOME_PAGE_INDEX;
  index: number;
}

interface UpdateCoinDetailIndexAction {
  type: typeof CHANGE_COIN_DETAIL_TAB_INDEX;
  index: number;
}

type TabRouteAction = UpdateHomeIndexAction | UpdateCoinDetailIndexAction;

// ============ State Interface ============

export interface TabRouteState {
  homePageRouteIndex: number;
  coin_detail_index: number;
}

// ============ Action Creators ============

export function updateHomeIndex(index: number): UpdateHomeIndexAction {
  return { type: CHANGE_HOME_PAGE_INDEX, index };
}

export function updateCoinDetailIndex(index: number): UpdateCoinDetailIndexAction {
  return { type: CHANGE_COIN_DETAIL_TAB_INDEX, index };
}

// ============ Initial State ============

const initState: TabRouteState = {
  homePageRouteIndex: 0,
  coin_detail_index: 0,
};

// ============ Reducer ============

const tabRouteConfig = (
  state: TabRouteState = initState,
  action: TabRouteAction
): TabRouteState => {
  switch (action.type) {
    case CHANGE_HOME_PAGE_INDEX:
      return { ...state, homePageRouteIndex: action.index };
    case CHANGE_COIN_DETAIL_TAB_INDEX:
      return { ...state, coin_detail_index: action.index };
    default:
      return state;
  }
};

export default tabRouteConfig;
