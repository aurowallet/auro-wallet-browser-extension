const POPUP_MODAL_STATUS = "POPUP_MODAL_STATUS";
const POPUP_TOKEN_REFRESH = "POPUP_TOKEN_REFRESH";

const initialState = {
  tokenSignStatus: false,
  tokenSignRefresh: false,
};

export function updateTokenSignStatus(status) {
  return {
    type: POPUP_MODAL_STATUS,
    status,
  };
}

export function refreshTokenSignPopup(status) {
  return {
    type: POPUP_TOKEN_REFRESH,
    status,
  };
}
// Reducer function to update the state
function popupReducer(state = initialState, action) {
  switch (action.type) {
    case POPUP_MODAL_STATUS:
      return {
        ...state,
        tokenSignStatus: action.status,
        tokenSignRefresh: true,
      };
    case POPUP_TOKEN_REFRESH:
      return {
        ...state,
        tokenSignRefresh: action.status,
      };
    default:
      return state;
  }
}

export default popupReducer;
