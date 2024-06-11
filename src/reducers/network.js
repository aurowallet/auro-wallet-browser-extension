import { Default_Network_List } from "@/constant/network";

const UPDATE_CURRENT_NODE = "UPDATE_CURRENT_NODE";

const UPDATE_CUSTOM_NODE_LIST = "UPDATE_CUSTOM_NODE_LIST";

/**
 * @param {*} data
 */
export function updateCurrentNode(node) {
  return {
    type: UPDATE_CURRENT_NODE,
    node,
  };
}

/**
 * @param {*} data
 */
export function updateCustomNodeList(nodeList) {
  return {
    type: UPDATE_CUSTOM_NODE_LIST,
    nodeList,
  };
}

const initState = {
  currentNode: {},
  customNodeList: [],
  allNodeList:Default_Network_List,
};

const network = (state = initState, action) => {
  switch (action.type) {
    case UPDATE_CURRENT_NODE: 
      return {
        ...state,
        currentNode: action.node,
      };
    case UPDATE_CUSTOM_NODE_LIST:
      let nextNodeList = Array.isArray(action.nodeList) ? action.nodeList:[]
      return {
        ...state,
        customNodeList: action.nodeList,
        allNodeList:[...Default_Network_List,...nextNodeList]
      };
    default:
      return state;
  }
};

export default network;
