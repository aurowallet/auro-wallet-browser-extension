import { fetchStakingList } from "../background/api";

const UPDATE_STAKING_LIST = 'UPDATE_STAKING_LIST';

const UPDATE_DAEMON_STATUS = 'UPDATE_DAEMON_STATUS';
const UPDATE_BLOCK_INFO = 'UPDATE_BLOCK_INFO';
const UPDATE_DELEGATION_INFO = 'UPDATE_DELEGATION_INFO';


const UPDATE_DELEGATION_PUBLICKEY = 'UPDATE_DELEGATION_PUBLICKEY';
const UPDATE_STAKING_APY = 'UPDATE_STAKING_APY';
/**
 * request net list
 */
export function getStakingList() {
  return async (dispatch) => {
    const stakingList = await fetchStakingList();
    if(stakingList && (stakingList.active?.length > 0 || stakingList.inactive?.length > 0)){
      dispatch(updateStakingList({ stakingList }));
    }
  }
}

export function updateStakingAPY(stakingAPY) {
  return {
    type: UPDATE_STAKING_APY,
    stakingAPY,
  };
}
/**
 * update staking list
 */
export function updateStakingList({ stakingList, submitBpUrl }) {
  return {
    type: UPDATE_STAKING_LIST,
    stakingList,
  };
}

export function updateDaemonStatus(daemonStatus) {
  return {
    type: UPDATE_DAEMON_STATUS,
    daemonStatus,
  };
}

export function updateBlockInfo(block) {
  return {
    type: UPDATE_BLOCK_INFO,
    block,
  };
}

export function updateDelegationInfo( account ) {
  return {
    type: UPDATE_DELEGATION_INFO,
    account,
  };
}

export function updateDelegationKey(delegationKey) {
  return {
    type: UPDATE_DELEGATION_PUBLICKEY,
    delegationKey,
  };
}

const initState = {
  stakingList: { active: [], inactive: [] },
  stakingAPY: null,
  daemonStatus: {},
  block: {},
  account:{},
  delegationKey: "",
};

const staking = (state = initState, action) => {
  switch (action.type) {
    case UPDATE_STAKING_LIST:
      return { ...state, stakingList: action.stakingList };
    case UPDATE_DAEMON_STATUS:
      return {
        ...state,
        daemonStatus: action.daemonStatus
      };
    case UPDATE_BLOCK_INFO:
      return {
        ...state,
        block: action.block
      };
      case UPDATE_DELEGATION_INFO:
        return {
          ...state,
          account: action.account
        };
      case UPDATE_DELEGATION_PUBLICKEY:
        return {
          ...state,
          delegationKey: action.delegationKey
        };
      case UPDATE_STAKING_APY:
        return {
          ...state,
          stakingAPY: action.stakingAPY
        };
      
    default:
      return state;
  }
}

export default staking;
