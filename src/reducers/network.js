const UPDATE_NET_CONFIG = "UPDATE_NET_CONFIG"

export const NET_CONFIG_DEFAULT = "DEFAULT"
export const NET_CONFIG_ADD = "ADD"

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

function getNetConfigData(state, config) {
    let netList = config.netList
    let currentConfig = config.currentConfig
    let selectList = []
    let currentNetName = ""


    currentNetName = currentConfig.name
    for (let index = 0; index < netList.length; index++) {
        const netConfig = netList[index];
        selectList.push({
            "key": netConfig.url,
            "value": netConfig.name
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
    currentNetName: ""
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
        default:
            return state;
    }
};

export default network;
