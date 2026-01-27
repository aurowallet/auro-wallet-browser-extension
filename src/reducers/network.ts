import { Default_Network_List, NetworkConfig } from "@/constant/network";

// ============ Action Types ============

const UPDATE_CURRENT_NODE = "UPDATE_CURRENT_NODE";
const UPDATE_CUSTOM_NODE_LIST = "UPDATE_CUSTOM_NODE_LIST";

// ============ Action Interfaces ============

interface UpdateCurrentNodeAction {
  type: typeof UPDATE_CURRENT_NODE;
  node: NetworkConfig;
}

interface UpdateCustomNodeListAction {
  type: typeof UPDATE_CUSTOM_NODE_LIST;
  nodeList: NetworkConfig[];
}

type NetworkAction = UpdateCurrentNodeAction | UpdateCustomNodeListAction;

// ============ State Interface ============

export interface NetworkState {
  currentNode: NetworkConfig | Record<string, never>;
  customNodeList: NetworkConfig[];
  allNodeList: NetworkConfig[];
}

// ============ Action Creators ============

export function updateCurrentNode(node: NetworkConfig): UpdateCurrentNodeAction {
  return {
    type: UPDATE_CURRENT_NODE,
    node,
  };
}

export function updateCustomNodeList(
  nodeList: NetworkConfig[]
): UpdateCustomNodeListAction {
  return {
    type: UPDATE_CUSTOM_NODE_LIST,
    nodeList,
  };
}

// ============ Initial State ============

const initState: NetworkState = {
  currentNode: {},
  customNodeList: [],
  allNodeList: Default_Network_List,
};

// ============ Reducer ============

const network = (
  state: NetworkState = initState,
  action: NetworkAction
): NetworkState => {
  switch (action.type) {
    case UPDATE_CURRENT_NODE:
      return {
        ...state,
        currentNode: action.node,
      };
    case UPDATE_CUSTOM_NODE_LIST:
      const nextNodeList = Array.isArray(action.nodeList) ? action.nodeList : [];
      return {
        ...state,
        customNodeList: action.nodeList,
        allNodeList: [...Default_Network_List, ...nextNodeList],
      };
    default:
      return state;
  }
};

export default network;
