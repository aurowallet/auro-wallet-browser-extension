import { fetchStakingList } from "../background/api";
import type { Dispatch } from "redux";

// ============ Action Types ============

const UPDATE_STAKING_LIST = "UPDATE_STAKING_LIST";
const UPDATE_DAEMON_STATUS = "UPDATE_DAEMON_STATUS";
const UPDATE_BLOCK_INFO = "UPDATE_BLOCK_INFO";
const UPDATE_DELEGATION_INFO = "UPDATE_DELEGATION_INFO";
const UPDATE_DELEGATION_PUBLICKEY = "UPDATE_DELEGATION_PUBLICKEY";

// ============ Interfaces ============

export interface StakingItem {
  nodeAddress: string;
  nodeName: string;
  totalStake: string;
  delegations: number;
  icon: string;
}

export interface DaemonStatus {
  syncStatus?: string;
  blockchainLength?: number;
  [key: string]: unknown;
}

export interface BlockInfo {
  blockHeight?: number;
  epoch?: number;
  slot?: number;
  [key: string]: unknown;
}

export interface DelegationAccount {
  delegate?: string;
  delegateAccount?: { publicKey: string };
  [key: string]: unknown;
}

export interface StakingState {
  stakingList: StakingItem[];
  daemonStatus: DaemonStatus;
  block: BlockInfo;
  account: DelegationAccount;
  delegationKey?: string;
}

// ============ Action Interfaces ============

interface UpdateStakingListAction {
  type: typeof UPDATE_STAKING_LIST;
  stakingList: StakingItem[];
}

interface UpdateDaemonStatusAction {
  type: typeof UPDATE_DAEMON_STATUS;
  daemonStatus: DaemonStatus;
}

interface UpdateBlockInfoAction {
  type: typeof UPDATE_BLOCK_INFO;
  block: BlockInfo;
}

interface UpdateDelegationInfoAction {
  type: typeof UPDATE_DELEGATION_INFO;
  account: DelegationAccount;
}

interface UpdateDelegationKeyAction {
  type: typeof UPDATE_DELEGATION_PUBLICKEY;
  delegationKey: string;
}

type StakingAction =
  | UpdateStakingListAction
  | UpdateDaemonStatusAction
  | UpdateBlockInfoAction
  | UpdateDelegationInfoAction
  | UpdateDelegationKeyAction;

// ============ Action Creators ============

export function getStakingList() {
  return async (dispatch: Dispatch) => {
    const stakingList = await fetchStakingList() as StakingItem[];
    if (stakingList && stakingList.length > 0) {
      dispatch(updateStakingList({ stakingList }));
    }
  };
}

export function updateStakingList({ stakingList }: { stakingList: StakingItem[] }) {
  return { type: UPDATE_STAKING_LIST, stakingList };
}

export function updateDaemonStatus(daemonStatus: DaemonStatus) {
  return { type: UPDATE_DAEMON_STATUS, daemonStatus };
}

export function updateBlockInfo(block: BlockInfo) {
  return { type: UPDATE_BLOCK_INFO, block };
}

export function updateDelegationInfo(account: DelegationAccount) {
  return { type: UPDATE_DELEGATION_INFO, account };
}

export function updateDelegationKey(delegationKey: string) {
  return { type: UPDATE_DELEGATION_PUBLICKEY, delegationKey };
}

// ============ Initial State ============

const initState: StakingState = {
  stakingList: [],
  daemonStatus: {},
  block: {},
  account: {},
};

// ============ Reducer ============

const staking = (state: StakingState = initState, action: StakingAction): StakingState => {
  switch (action.type) {
    case UPDATE_STAKING_LIST:
      return { ...state, stakingList: action.stakingList };
    case UPDATE_DAEMON_STATUS:
      return { ...state, daemonStatus: action.daemonStatus };
    case UPDATE_BLOCK_INFO:
      return { ...state, block: action.block };
    case UPDATE_DELEGATION_INFO:
      return { ...state, account: action.account };
    case UPDATE_DELEGATION_PUBLICKEY:
      return { ...state, delegationKey: action.delegationKey };
    default:
      return state;
  }
};

export default staking;
