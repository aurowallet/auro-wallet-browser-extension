import { Terms_default } from "@/constant";

/**
 * Enter the user details interface
 */
const SET_ACCOUNT_INFO = "SET_ACCOUNT_INFO";

/**
 *  Update the next level routing of the welcome screen
 */
const SET_WELCOME_NEXT_ROUTE = "SET_WELCOME_NEXT_ROUTE";

const SET_WELCOME_NEXT_TYPE = "SET_WELCOME_NEXT_TYPE";

/**
 * Update Account Name page source
 */
const UPDATE_ACCOUNT_TYPE_FROM = "UPDATE_ACCOUNT_TYPE_FROM";

/**
 * Update the basic information
 */
const UPDATE_EXTENSION_BASE_INFO = "UPDATE_EXTENSION_BASE_INFO";

const UPDATE_ADDRESS_DETAIL = "UPDATE_ADDRESS_DETAIL";

const UPDATE_ADDRESS_BOOK_FROM = "UPDATE_ADDRESS_BOOK_FROM";

const UPDATE_CURRENT_PRICE = "UPDATE_CURRENT_PRICE";

const UPDATE_DAPP_ACCOUNT_LIST = "UPDATE_DAPP_ACCOUNT_LIST";

const UPDATE_ACCOUNT_BALANCE_LIST = "UPDATE_ACCOUNT_BALANCE_LIST";

export const UPDATE_DAPP_CURRENT_OPEN_WINDOW =
  "UPDATE_DAPP_CURRENT_OPEN_WINDOW";

const UPDATE_RECOMMOND_FEE_LIST = "UPDATE_RECOMMOND_FEE_LIST";

const UPDATE_ACCOUNT_TYPE_COUNT = "UPDATE_ACCOUNT_TYPE_COUNT";

export function updateCurrentPrice(price) {
  return {
    type: UPDATE_CURRENT_PRICE,
    price,
  };
}

export function updateAddressDetail(addressDetail) {
  return {
    type: UPDATE_ADDRESS_DETAIL,
    addressDetail,
  };
}

export function updateAddressBookFrom(from) {
  return {
    type: UPDATE_ADDRESS_BOOK_FROM,
    from,
  };
}
/**
 * update wallet info
 */
export function updateExtensionBaseInfo(data) {
  return {
    type: UPDATE_EXTENSION_BASE_INFO,
    data,
  };
}

export function setAccountInfo(info) {
  return {
    type: SET_ACCOUNT_INFO,
    info,
  };
}
/**
 * update welcome next route
 * @param {*} info
 */
export function setWelcomeNextRoute(nextRoute) {
  return {
    type: SET_WELCOME_NEXT_ROUTE,
    nextRoute,
  };
}

export function setWelcomeNextType(nextType) {
  return {
    type: SET_WELCOME_NEXT_TYPE,
    nextType,
  };
}

export function updateAccoutType(fromType) {
  return {
    type: UPDATE_ACCOUNT_TYPE_FROM,
    fromType,
  };
}

export function updateDappSelectList(selectList) {
  return {
    type: UPDATE_DAPP_ACCOUNT_LIST,
    selectList,
  };
}

/**
 * update dapp opened window
 * @param {*} dappWindow
 * @returns
 */
export function updateDAppOpenWindow(dappWindow) {
  return {
    type: UPDATE_DAPP_CURRENT_OPEN_WINDOW,
    dappWindow,
  };
}

export function updateAccountBalanceList(accountDetail) {
  return {
    type: UPDATE_ACCOUNT_BALANCE_LIST,
    accountDetail,
  };
}

export function updateRecomFee(feeList) {
  return {
    type: UPDATE_RECOMMOND_FEE_LIST,
    feeRecom: feeList,
  };
}

export function updateAccoutTypeCount(countMap) {
  return {
    type: UPDATE_ACCOUNT_TYPE_COUNT,
    countMap,
  };
}
const initState = {
  fromType: "",
  accountInfo: {},
  welcomeNextRoute: "",
  welcomeNextType: "",

  changelog: "",
  changelog_app: "",
  followus: [],
  gitReponame: "",
  gitReponame_app: "",
  privacy_policy: Terms_default.privacy_policy,
  privacy_policy_cn: Terms_default.privacy_policy,
  staking_guide: "",
  staking_guide_cn: "",
  terms_and_contions: Terms_default.terms_and_contions,
  terms_and_contions_cn: Terms_default.terms_and_contions,

  addressDetail: {},
  addressBookFrom: "",
  currentPrice: "",
  dappAccountList: [],

  dappWindow: {},
  accountBalanceList: {},
  feeRecom: [],

  accountTypeCount: {
    create: 1,
    import: 1,
    ledger: 1,
  },
};

const cacheReducer = (state = initState, action) => {
  switch (action.type) {
    case SET_ACCOUNT_INFO:
      let accountInfo = action.info;
      return {
        ...state,
        accountInfo,
      };
    case SET_WELCOME_NEXT_ROUTE:
      let nextRoute = action.nextRoute;
      return {
        ...state,
        welcomeNextRoute: nextRoute,
      };
    case SET_WELCOME_NEXT_TYPE:
      let nextType = action.nextType;
      return {
        ...state,
        welcomeNextType: nextType,
      };
    case UPDATE_ACCOUNT_TYPE_FROM:
      return {
        ...state,
        fromType: action.fromType,
      };
    case UPDATE_EXTENSION_BASE_INFO:
      return {
        ...state,

        changelog: action.data.changelog,
        changelog_app: action.data.changelog_app,
        followus: action.data.followus,
        gitReponame: action.data.gitReponame,
        gitReponame_app: action.data.gitReponame_app,
        privacy_policy: action.data.privacy_policy,
        privacy_policy_cn: action.data.privacy_policy_cn,
        staking_guide: action.data.staking_guide,
        staking_guide_cn: action.data.staking_guide_cn,
        terms_and_contions: action.data.terms_and_contions,
        terms_and_contions_cn: action.data.terms_and_contions_cn,
      };
    case UPDATE_ADDRESS_DETAIL:
      return {
        ...state,
        addressDetail: action.addressDetail,
      };
    case UPDATE_ADDRESS_BOOK_FROM:
      return {
        ...state,
        addressBookFrom: action.from,
      };

    case UPDATE_CURRENT_PRICE:
      return {
        ...state,
        currentPrice: action.price,
      };
    case UPDATE_DAPP_ACCOUNT_LIST:
      return {
        ...state,
        dappAccountList: action.selectList,
      };
    case UPDATE_DAPP_CURRENT_OPEN_WINDOW:
      return {
        ...state,
        dappWindow: action.dappWindow,
      };
    case UPDATE_ACCOUNT_BALANCE_LIST:
      let accountBalanceDetail = action.accountDetail;
      let accountList = { ...state.accountBalanceList };
      let keys = Object.keys(accountBalanceDetail);
      for (let index = 0; index < keys.length; index++) {
        const key = keys[index];
        const detail = accountBalanceDetail[key];
        accountList[detail.publicKey] = detail;
      }
      return {
        ...state,
        accountBalanceList: accountList,
      };
    case UPDATE_RECOMMOND_FEE_LIST:
      return {
        ...state,
        feeRecom: action.feeRecom,
      };
    case UPDATE_ACCOUNT_TYPE_COUNT:
      let accountTypeCount = {
        ...action.countMap,
      };
      return {
        ...state,
        accountTypeCount: accountTypeCount,
      };
    default:
      return state;
  }
};

export default cacheReducer;
