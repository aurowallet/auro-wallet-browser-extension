const CHANGE_HOME_PAGE_INDEX = "CHANGE_HOME_PAGE_INDEX"
const CHANGE_COIN_DETAIL_TAB_INDEX = "CHANGE_COIN_DETAIL_TAB_INDEX"

export function updateHomeIndex(index) {
  return {
    type: CHANGE_HOME_PAGE_INDEX,
    index
  };
}

export function updateCoinDetailIndex(index) {
  return {
    type: CHANGE_COIN_DETAIL_TAB_INDEX,
    index
  };
}



const initState = {
  homePageRouteIndex: 0,
  coin_detail_index: 0
};

const tabRouteConfig = (state = initState, action) => {
  switch (action.type) {
    case CHANGE_HOME_PAGE_INDEX:
      return {
        ...state,
        homePageRouteIndex: action.index,
      };
    case CHANGE_COIN_DETAIL_TAB_INDEX:
      return {
        ...state,
        coin_detail_index: action.index,
      };
    default:
      return state;
  }
};

export default tabRouteConfig;
