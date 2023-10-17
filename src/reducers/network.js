
import {NET_CONFIG_LIST} from '../constant/walletType'
const UPDATE_NET_CONFIG = "UPDATE_NET_CONFIG"

const UPDATE_NETWORK_CHAINID_CONFIG = "UPDATE_NETWORK_CHAINID_CONFIG"

export const NET_CONFIG_DEFAULT = "DEFAULT"
export const NET_CONFIG_ADD = "ADD"

/**
 * update net config
 * @param {*} data 
 */
export function updateNetConfig(data) {
    return {
        type: UPDATE_NET_CONFIG,
        data
    };
}


/**
 * update net config
 * @param {*} data 
 */
 export function updateNetChainIdConfig(data) {
    return {
        type: UPDATE_NETWORK_CHAINID_CONFIG,
        data
    };
}

function getNetConfigData(state, config) {
    let netList = config.netList
    let currentConfig = config.currentConfig
    let selectList = []
    let currentNetName = ""


    currentNetName = currentConfig.name
    for (let index = 0; index < netList.length; index++) {
        const netConfig = netList[index];
        selectList.push({
            "value": netConfig.url,
            "label": netConfig.name
        })
    }
    return {
        netList,
        currentConfig,
        selectList,
        currentNetName
    }
}

const initState = {
    netList: [],
    currentConfig: {},
    currentNetConfig: {},
    netSelectList: [],
    currentNetName: "",
    networkConfig:[]
};

const network = (state = initState, action) => {
    switch (action.type) {
        case UPDATE_NET_CONFIG:
            let data = getNetConfigData(state, action.data)
            return {
                ...state,
                netList: data.netList,
                currentConfig: data.currentConfig,
                netSelectList: data.selectList,
                currentNetName: data.currentNetName,
                currentNetConfig: action.data,
            }
        case UPDATE_NETWORK_CHAINID_CONFIG:
            let chainIdList = action.data
            let netConfigList = state.netList
            let typeAndIdMap = {}
            for (let index = 0; index < chainIdList.length; index++) {
                const chainItem = chainIdList[index];
                typeAndIdMap[chainItem.type] = chainItem.chain_id
            }
           
            let newNetConfigList = []
            for (let index = 0; index < netConfigList.length; index++) {
                let config = {...netConfigList[index]};
                if(config.type === NET_CONFIG_DEFAULT){
                    let type_id = NET_CONFIG_LIST[config.netType].type_id
                    config.chainId = typeAndIdMap[type_id]||""
                }
                newNetConfigList.push(config)
            }
            return {
                ...state,
                networkConfig: action.data,
                netList:newNetConfigList
            }
        default:
            return state;
    }
};

export default network;
