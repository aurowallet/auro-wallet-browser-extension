import { fetchStakingList, fetchDaemonStatus,fetchBlockInfo } from "../background/api";
import { getAmountDisplay, getAmountForUI, getDisplayAmount } from '../utils/utils';
import { cointypes } from "../../config";

const UPDATE_STAKING_LIST = 'UPDATE_STAKING_LIST';
const FETCH_STAKING_LIST = 'FETCH_STAKING_LIST';


const UPDATE_DAEMON_STATUS = 'UPDATE_DAEMON_STATUS';
const UPDATE_BLOCK_INFO = 'UPDATE_BLOCK_INFO';
const UPDATE_DELEGATION_INFO = 'UPDATE_DELEGATION_INFO';
const UPDATE_VALIDATOR_DETAIL = 'UPDATE_VALIDATOR_DETAIL';
/**
 * 请求节点列表
 */
export function getStakingList() {
  return async (dispatch) => {
    const stakingListFromServer = await fetchStakingList();
    const stakingList = stakingListFromServer.map(node => {
      return {
        nodeAddress: node.public_key,
        nodeName: node.identity_name,
        totalStake: getAmountForUI(node.stake),
      };
    })
    dispatch(updateStakingList({ stakingList }));
  }
}
/**
 * 更新节点列表
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


export function updateValidatorDetail(validatorDetail ) {
  return {
    type: UPDATE_VALIDATOR_DETAIL,
    validatorDetail,
  };
}


const initState = {
  stakingList: [],
  daemonStatus: {},
  block: {},
  account:{},
  validatorDetail:{}
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
      case UPDATE_VALIDATOR_DETAIL:
        return {
          ...state,
          validatorDetail: action.validatorDetail
        };
    default:
      return state;
  }
}

export default staking;
