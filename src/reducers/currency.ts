// ============ Action Types ============

const CHANGE_CURRENCY_SELECT = "CHANGE_CURRENCY_SELECT";

// ============ Interfaces ============

export interface CurrencyItem {
  key: string;
  value: string;
  symbol: string;
  isSelect?: boolean;
}

interface ChangeCurrencySelectAction {
  type: typeof CHANGE_CURRENCY_SELECT;
  list: CurrencyItem[];
}

type CurrencyAction = ChangeCurrencySelectAction;

// ============ State Interface ============

export interface CurrencyState {
  currencyList: CurrencyItem[];
  currentCurrency: CurrencyItem | Record<string, never>;
}

// ============ Action Creators ============

export function updateCurrencyConfig(list: CurrencyItem[]): ChangeCurrencySelectAction {
  return {
    type: CHANGE_CURRENCY_SELECT,
    list,
  };
}

// ============ Initial State ============

const initState: CurrencyState = {
  currencyList: [],
  currentCurrency: {},
};

// ============ Reducer ============

const currency = (
  state: CurrencyState = initState,
  action: CurrencyAction
): CurrencyState => {
  switch (action.type) {
    case CHANGE_CURRENCY_SELECT:
      const list = action.list;
      let selectedCurrency = list.filter((item) => item.isSelect);
      const currentCurrency = selectedCurrency.length > 0 ? selectedCurrency[0] : {};
      return {
        ...state,
        currencyList: action.list,
        currentCurrency: currentCurrency as CurrencyItem | Record<string, never>,
      };
    default:
      return state;
  }
};

export default currency;
