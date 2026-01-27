// ============ Entry Route Constants ============

export const ENTRY_WITCH_ROUTE = {
  HOME_PAGE: "ENTRY_WITCH_ROUTE_HOME_PAGE",
  WELCOME: "ENTRY_WITCH_ROUTE_WELCOME",
  LOCK_PAGE: "ENTRY_WITCH_LOCK_PAGE",
  UPDATE_ENTRY_WITCH_ROUTE: "UPDATE_ENTRY_WITCH_ROUTE",
  DAPP_APPROVE_PAGE: "DAPP_APPROVE_PAGE",
  DAPP_SIGN_PAGE: "DAPP_SIGN_PAGE",
  DAPP_TOKEN_SIGN: "DAPP_TOKEN_SIGN",
} as const;

export type EntryRoute = (typeof ENTRY_WITCH_ROUTE)[keyof typeof ENTRY_WITCH_ROUTE];

// ============ Action Interfaces ============

interface UpdateEntryRouteAction {
  type: typeof ENTRY_WITCH_ROUTE.UPDATE_ENTRY_WITCH_ROUTE;
  entryWitchRoute: string;
}

type EntryRouteAction = UpdateEntryRouteAction;

// ============ State Interface ============

export interface EntryRouteState {
  entryWitchRoute: string;
}

// ============ Action Creators ============

export function updateEntryWitchRoute(entryWitchRoute: string): UpdateEntryRouteAction {
  return {
    type: ENTRY_WITCH_ROUTE.UPDATE_ENTRY_WITCH_ROUTE,
    entryWitchRoute,
  };
}

// ============ Initial State ============

const initState: EntryRouteState = {
  entryWitchRoute: "",
};

// ============ Reducer ============

const entryRouteReducer = (
  state: EntryRouteState = initState,
  action: EntryRouteAction
): EntryRouteState => {
  switch (action.type) {
    case ENTRY_WITCH_ROUTE.UPDATE_ENTRY_WITCH_ROUTE:
      return {
        entryWitchRoute: action.entryWitchRoute,
      };
    default:
      return state;
  }
};

export default entryRouteReducer;
