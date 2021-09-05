const CHANGE_CURRENT_NETWORK = "CHANGE_CURRENT_NETWORK"
const UPDATE_NET_LIST = "UPDATE_NET_LIST"
const UPDATE_NET_CONFIG = "UPDATE_NET_CONFIG"

export const NET_CONFIG_DEFAULT = "DEFAULT"
export const NET_CONFIG_ADD = "ADD"


/**
 * 更改网络索引
 * @param {*} id 
 */
export function updateCurrentNetwork(url, netType) {
    return {
        type: CHANGE_CURRENT_NETWORK,
        url,
        netType
    };
}

/**
 * 增加网络配置
 * @param {*} data 
 */
export function updateNetList(netList) {
    return {
        type: UPDATE_NET_LIST,
        netList
    };
}


/**
 * 更改网络配置
 * @param {*} data 
 */
export function updateNetConfig(data) {
    return {
        type: UPDATE_NET_CONFIG,
        data
    };
}



const initState = {
    netList: [],
    currentUrl: "",
    netType: NET_CONFIG_DEFAULT
};

const network = (state = initState, action) => {
    switch (action.type) {
        case CHANGE_CURRENT_NETWORK:
            return {
                ...state,
                currentUrl: action.url,
                netType: action.netType,
            };
        case UPDATE_NET_LIST:
            return {
                ...state,
                netList: action.netList,
            }
        case UPDATE_NET_CONFIG:
            let netList = action.data.netList
            let currentUrl = action.data.currentUrl
            let netType = state.netType
            for (let index = 0; index < netList.length; index++) {
                const netConfig = netList[index];
                if(currentUrl === netConfig.url){
                    netType = netConfig.type
                    break
                }
            }
            return {
                ...state,
                netList,
                currentUrl,
                netType
            }
        default:
            return state;
    }
};

export default network;
