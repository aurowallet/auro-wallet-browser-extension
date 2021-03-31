/**
 * 更新入口界面的 reducer
 */
export const ENTRY_WITCH_ROUTE = {
  HOME_PAGE: 'ENTRY_WITCH_ROUTE_HOME_PAGE',
  WELCOME: 'ENTRY_WITCH_ROUTE_WELCOME',
  LOCK_PAGE: 'ENTRY_WITCH_LOCK_PAGE',
  UPDATA_ENTRY_WITCH_ROUTE: "UPDATA_ENTRY_WITCH_ROUTE"
};



export function updateEntryWitchRoute(entryWitchRoute) {
  return {
    type: ENTRY_WITCH_ROUTE.UPDATA_ENTRY_WITCH_ROUTE,
    entryWitchRoute
  };
}

const initState = {
  entryWitchRoute: ""
};


const entryRouteReducer = (state = initState, action) => {
  switch (action.type) {
    case ENTRY_WITCH_ROUTE.UPDATA_ENTRY_WITCH_ROUTE:
      return {
        entryWitchRoute: action.entryWitchRoute,
      };
    default:
      return state;
  }
};

export default entryRouteReducer;
