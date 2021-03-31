const axios = require('axios');
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
        console.log(`request failed , retrying:${config.url}`);
        return axios(config);
    });
}
axios.interceptors.request.use(function (config) {
    const CancelToken = axios.CancelToken;
    const source = CancelToken.source();
    let token = setTimeout(() => source.cancel({ message: 'Timeout', config: config }), timeout);
    config.cancelToken = source.token;
    config.clearCancelToken = () => clearTimeout(token);
    return config;
});
axios.interceptors.response.use(function (response) {
    response.config.clearCancelToken();
    return response;
}, axiosRetryInterceptor);