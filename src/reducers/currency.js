

const CHANGE_CURRENCY_SELECT = "CHANGE_CURRENCY_SELECT"


/**
 * 更改网络配置
 * @param {*} data 
 */
export function updateCurrencyConfig(list) {
    return {
        type: CHANGE_CURRENCY_SELECT,
        list
    };
}

const initState = {
    currencyList:[],
    currentCurrency:{}
};

const currency = (state = initState, action) => {
    switch (action.type) {
        case CHANGE_CURRENCY_SELECT:
            let list = action.list
            let currenct = list.filter((item)=>{
                return item.isSelect
            })
            currenct = currenct.length >0 ? currenct[0] :{}
            return {
                ...state,
                currencyList: action.list,
                currentCurrency: currenct,
            };
        default:
            return state;
    }
};

export default currency;
