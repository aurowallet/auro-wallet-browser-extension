

const CHANGE_CURRENCY_SELECT = "CHANGE_CURRENCY_SELECT"


/**
 * update currency config
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
            let currency = list.filter((item)=>{
                return item.isSelect
            })
            currency = currency.length >0 ? currency[0] :{}
            return {
                ...state,
                currencyList: action.list,
                currentCurrency: currency,
            };
        default:
            return state;
    }
};

export default currency;
