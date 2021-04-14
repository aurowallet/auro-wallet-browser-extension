const axios = require('axios');
const { ERROR_TYPE } = require('../../constant/errType');
const timeout = 10000;
axios.defaults.retry = 3;
axios.defaults.retryDelay = 1000;

function axiosRetryInterceptor(err) {
    var message, config;
    if (axios.isCancel(err)) {
        message = err.message.message;
        config = err.message.config;
    } else {
        message = err.message;
        config = err.config;
    }
    config.clearCancelToken();
    // If config does not exist or the retry option is not set, reject
    if (!config || !config.retry) return Promise.reject(new Error(message));
    // Set the variable for keeping track of the retry count
    config.__retryCount = config.__retryCount || 0;
    // Check if we've maxed out the total number of retries
    if (config.__retryCount >= config.retry) {
        // Reject with the error
        return Promise.reject(new Error(message));
    }
    // Increase the retry count
    config.__retryCount += 1;
    // Create new promise to handle exponential backoff
    var backoff = new Promise(function (resolve) {
        setTimeout(function () {
            resolve();
        }, config.retryDelay || 1);
    });
    // Return the promise in which recalls axios to retry the request
    return backoff.then(function () {
        let newConfig = config
        if(config.method === "post" && config.data){
            let queryData = config.data
            let variables =queryData.variables
            if(variables){
                if(variables.requestType){
                    newConfig.data.variables.requestType = ""
                }
            }else{
                 let data = queryData.replace("extensionAccountInfo", "");
                newConfig = {...config,data}
            }
        }
        newConfig.isRetrying = true
        return axios(newConfig);
    });
}
let queue = [];
// // axios内置的中断ajax的方法
const cancelToken = axios.CancelToken;
const token = (config) => {
    let newConfig = {...config}
    let requestSession = ""
    if(newConfig.method === "get"){
        let index = newConfig.url.indexOf("?")
        if(index !== -1){
            requestSession = newConfig.url.slice(0,index)
        }else{
            requestSession = newConfig.url
        }
    }else{
        let queryData = config.data
        let expectIndex
        if(queryData.variables){//是个对象
            let variables = queryData.variables
            expectIndex = variables && variables.requestType && variables.requestType === "extensionAccountInfo" || ""
            let query = queryData.query
            let publicKeyIndex = query.indexOf("publicKey")
            if(publicKeyIndex !== -1){
                requestSession = query.slice(0,publicKeyIndex)
            }else{
                requestSession = query
            }
        }else{//是个字符串
            expectIndex = queryData.indexOf("extensionAccountInfo")
            if(expectIndex === -1){ // 如果没有
                requestSession = queryData
            }else { // 如果是给定的字符串
                requestSession = queryData.slice(0,expectIndex)
            }
        }
    }
    return requestSession
}
// 中断重复的请求，并从队列中移除
const removeQueue = (config) => {
    let configSession = token(config)
    for (let i = 0, size = queue.length; i < size; i++) {
        const task = queue[i];
        if (task && task.token === configSession) {
            task.cancel({ message: ERROR_TYPE.CanceRequest, config: config });
            queue.splice(i, 1);
        }
    }
}

// 先看数组里面有吗
// 如果有，则取消之前的请求，并删除数组中的元素
//如果没有，则继续往下
axios.interceptors.request.use(function (config) {
    //重试阶段 不移除
    if(!config.isRetrying){
        removeQueue(config);
    }
    config.cancelToken = new cancelToken((c) => {
        let tokenItem = { token: token(config), cancel: c }
        queue.push(tokenItem);
        let timeToken = setTimeout(() => tokenItem.cancel({ message: 'Timeout', config: config }), timeout);
        config.clearCancelToken = () => clearTimeout(timeToken);
    });
    return config;
});
axios.interceptors.response.use(function (response) {
    removeQueue(response.config);
    return response;
}, axiosRetryInterceptor);