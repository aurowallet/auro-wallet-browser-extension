const TOKEN_MODAL = {
  TOKEN_MODAL_STATUS: "TOKEN_MODAL_STATUS",
  TOKEN_MODAL_REFRESH: "TOKEN_MODAL_REFRESH",
};

const APPRPVE_MODAL = {
  APPROVE_MODAL_STATUS: "APPROVE_MODAL_STATUS",
};

export function updateTokenSignStatus(status) {
  return {
    type: TOKEN_MODAL.TOKEN_MODAL_STATUS,
    status,
  };
}

export function refreshTokenSignPopup(status) {
  return {
    type: TOKEN_MODAL.TOKEN_MODAL_REFRESH,
    status,
  };
}

export function updateApproveStatus(status) {
  return {
    type: APPRPVE_MODAL.APPROVE_MODAL_STATUS,
    status,
  };
}
const initialState = {
  tokenModalStatus: false,
  tokenSignRefresh: false,
  approveModalStatus: false,
};

// Reducer function to update the state
function popupReducer(state = initialState, action) {
  switch (action.type) {
    case TOKEN_MODAL.TOKEN_MODAL_STATUS:
      return {
        ...state,
        tokenModalStatus: action.status,
        tokenSignRefresh: true,
      };
    case TOKEN_MODAL.TOKEN_MODAL_REFRESH:
      return {
        ...state,
        tokenSignRefresh: action.status,
      };
    case APPRPVE_MODAL.APPROVE_MODAL_STATUS:
      return {
        ...state,
        approveModalStatus: action.status,
      };
    default:
      return state;
  }
}

export default popupReducer;
