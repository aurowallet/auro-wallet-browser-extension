// ============ Action Types ============

const TOKEN_MODAL = {
  TOKEN_MODAL_STATUS: "TOKEN_MODAL_STATUS",
  TOKEN_MODAL_REFRESH: "TOKEN_MODAL_REFRESH",
} as const;

const APPROVE_MODAL = {
  APPROVE_MODAL_STATUS: "APPROVE_MODAL_STATUS",
} as const;

const SIGN_ZK_MODAL = {
  SIGN_ZK_MODAL_STATUS: "SIGN_ZK_MODAL_STATUS",
  SIGN_ZK_MODAL_REFRESH: "SIGN_ZK_MODAL_REFRESH",
} as const;

// ============ Action Interfaces ============

interface TokenModalStatusAction {
  type: typeof TOKEN_MODAL.TOKEN_MODAL_STATUS;
  status: boolean;
}

interface TokenModalRefreshAction {
  type: typeof TOKEN_MODAL.TOKEN_MODAL_REFRESH;
  status: boolean;
}

interface ApproveModalStatusAction {
  type: typeof APPROVE_MODAL.APPROVE_MODAL_STATUS;
  status: boolean;
}

interface SignZkModalStatusAction {
  type: typeof SIGN_ZK_MODAL.SIGN_ZK_MODAL_STATUS;
  status: boolean;
}

interface SignZkModalRefreshAction {
  type: typeof SIGN_ZK_MODAL.SIGN_ZK_MODAL_REFRESH;
  status: boolean;
}

type PopupAction =
  | TokenModalStatusAction
  | TokenModalRefreshAction
  | ApproveModalStatusAction
  | SignZkModalStatusAction
  | SignZkModalRefreshAction;

// ============ State Interface ============

export interface PopupState {
  tokenModalStatus: boolean;
  tokenSignRefresh: boolean;
  approveModalStatus: boolean;
  signZkModalStatus: boolean;
  signZkRefresh: boolean;
}

// ============ Action Creators ============

export function updateTokenSignStatus(status: boolean) {
  return { type: TOKEN_MODAL.TOKEN_MODAL_STATUS, status };
}

export function refreshTokenSignPopup(status: boolean) {
  return { type: TOKEN_MODAL.TOKEN_MODAL_REFRESH, status };
}

export function updateApproveStatus(status: boolean) {
  return { type: APPROVE_MODAL.APPROVE_MODAL_STATUS, status };
}

export function updateSignZkModalStatus(status: boolean) {
  return { type: SIGN_ZK_MODAL.SIGN_ZK_MODAL_STATUS, status };
}

export function refreshZkSignPopup(status: boolean) {
  return { type: SIGN_ZK_MODAL.SIGN_ZK_MODAL_REFRESH, status };
}

// ============ Initial State ============

const initialState: PopupState = {
  tokenModalStatus: false,
  tokenSignRefresh: false,
  approveModalStatus: false,
  signZkModalStatus: false,
  signZkRefresh: false,
};

// ============ Reducer ============

function popupReducer(state: PopupState = initialState, action: PopupAction): PopupState {
  switch (action.type) {
    case TOKEN_MODAL.TOKEN_MODAL_STATUS:
      let nextTokenStatus = state.tokenSignRefresh;
      if (action.status) {
        nextTokenStatus = true;
      }
      return {
        ...state,
        tokenModalStatus: action.status,
        tokenSignRefresh: nextTokenStatus,
      };
    case TOKEN_MODAL.TOKEN_MODAL_REFRESH:
      return { ...state, tokenSignRefresh: action.status };
    case APPROVE_MODAL.APPROVE_MODAL_STATUS:
      return { ...state, approveModalStatus: action.status };
    case SIGN_ZK_MODAL.SIGN_ZK_MODAL_STATUS:
      let nextZkStatus = state.signZkRefresh;
      if (action.status) {
        nextZkStatus = true;
      }
      return {
        ...state,
        signZkModalStatus: action.status,
        signZkRefresh: nextZkStatus,
      };
    case SIGN_ZK_MODAL.SIGN_ZK_MODAL_REFRESH:
      return { ...state, signZkRefresh: action.status };
    default:
      return state;
  }
}

export default popupReducer;
