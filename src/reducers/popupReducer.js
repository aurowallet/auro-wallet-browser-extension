const TOKEN_MODAL = {
  TOKEN_MODAL_STATUS: "TOKEN_MODAL_STATUS",
  TOKEN_MODAL_REFRESH: "TOKEN_MODAL_REFRESH",
};

const APPROVE_MODAL = {
  APPROVE_MODAL_STATUS: "APPROVE_MODAL_STATUS",
};

const SIGN_ZK_MODAL = {
  SIGN_ZK_MODAL_STATUS: "SIGN_ZK_MODAL_STATUS",
  SIGN_ZK_MODAL_REFRESH: "SIGN_ZK_MODAL_REFRESH",
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
    type: APPROVE_MODAL.APPROVE_MODAL_STATUS,
    status,
  };
}
export function updateSignZkModalStatus(status) {
  return {
    type: SIGN_ZK_MODAL.SIGN_ZK_MODAL_STATUS,
    status,
  };
}
export function refreshZkSignPopup(status) {
  return {
    type: SIGN_ZK_MODAL.SIGN_ZK_MODAL_REFRESH,
    status,
  };
}
const initialState = {
  tokenModalStatus: false,
  tokenSignRefresh: false,
  approveModalStatus: false,
  signZkModalStatus: false,
  signZkRefresh:false
};

// Reducer function to update the state
function popupReducer(state = initialState, action) {
  switch (action.type) {
    case TOKEN_MODAL.TOKEN_MODAL_STATUS:
      let nextTokenStatus = state.tokenSignRefresh
      if(action.status){
        nextTokenStatus = true
      }
      return {
        ...state,
        tokenModalStatus: action.status,
        tokenSignRefresh: nextTokenStatus, 
      };
    case TOKEN_MODAL.TOKEN_MODAL_REFRESH:
      return {
        ...state,
        tokenSignRefresh: action.status,
      };
    case APPROVE_MODAL.APPROVE_MODAL_STATUS:
      return {
        ...state,
        approveModalStatus: action.status,
      };
    case SIGN_ZK_MODAL.SIGN_ZK_MODAL_STATUS:
      let nextZkStatus = state.signZkRefresh
      if(action.status){
        nextZkStatus = true
      }
      return {
        ...state,
        signZkModalStatus: action.status,
        signZkRefresh:nextZkStatus
      };
    case SIGN_ZK_MODAL.SIGN_ZK_MODAL_REFRESH:
      return {
        ...state,
        signZkRefresh: action.status,
      };
    default:
      return state;
  }
}

export default popupReducer;
