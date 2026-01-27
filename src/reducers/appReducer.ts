import { DEFAULT_LANGUAGE } from "../constant";

// ============ Action Types ============

const SET_LANGUAGE = "SET_LANGUAGE";

// ============ Action Interfaces ============

interface SetLanguageAction {
  type: typeof SET_LANGUAGE;
  language: string;
}

type AppAction = SetLanguageAction;

// ============ State Interface ============

export interface AppState {
  language: string;
}

// ============ Action Creators ============

export function setLanguage(language: string): SetLanguageAction {
  return {
    type: SET_LANGUAGE,
    language,
  };
}

// ============ Initial State ============

const initState: AppState = {
  language: DEFAULT_LANGUAGE,
};

// ============ Reducer ============

const appReducer = (state: AppState = initState, action: AppAction): AppState => {
  switch (action.type) {
    case SET_LANGUAGE:
      const language = action.language;
      return {
        language,
      };
    default:
      return state;
  }
};

export default appReducer;
