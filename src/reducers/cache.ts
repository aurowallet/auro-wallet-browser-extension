import { Terms_default, DEFAULT_FEE_CONFIG } from "@/constant";
import type { FeeConfig } from "@/types/tx.types";

// ============ Action Types ============

const SET_ACCOUNT_INFO = "SET_ACCOUNT_INFO";
const SET_WELCOME_NEXT_ROUTE = "SET_WELCOME_NEXT_ROUTE";
const SET_WELCOME_NEXT_TYPE = "SET_WELCOME_NEXT_TYPE";
const UPDATE_ACCOUNT_TYPE_FROM = "UPDATE_ACCOUNT_TYPE_FROM";
const UPDATE_EXTENSION_BASE_INFO = "UPDATE_EXTENSION_BASE_INFO";
const UPDATE_ADDRESS_DETAIL = "UPDATE_ADDRESS_DETAIL";
const UPDATE_ADDRESS_BOOK_FROM = "UPDATE_ADDRESS_BOOK_FROM";
const UPDATE_DAPP_ACCOUNT_LIST = "UPDATE_DAPP_ACCOUNT_LIST";
const UPDATE_ACCOUNT_BALANCE_LIST = "UPDATE_ACCOUNT_BALANCE_LIST";
const UPDATE_RECOMMEND_FEE_LIST = "UPDATE_RECOMMEND_FEE_LIST";
const UPDATE_ACCOUNT_TYPE_COUNT = "UPDATE_ACCOUNT_TYPE_COUNT";
const UPDATE_NEXT_TOKEN_DETAIL = "UPDATE_NEXT_TOKEN_DETAIL";
const UPDATE_POPUP_LOCK_STATUS = "UPDATE_POPUP_LOCK_STATUS";
const SET_KEYRING_INFO = "SET_KEYRING_INFO";

// ============ Interfaces ============

export interface AddressDetail {
  address?: string;
  name?: string;
  [key: string]: unknown;
}

export interface AccountTypeCount {
  create: number;
  import: number;
  ledger: number;
}


export interface ExtensionBaseInfo {
  changelog?: string;
  changelog_app?: string;
  followus?: unknown[];
  privacy_policy?: string;
  privacy_policy_cn?: string;
  staking_guide?: string;
  staking_guide_cn?: string;
  terms_and_contions?: string;
  terms_and_contions_cn?: string;
}

export interface CacheState {
  fromType: string;
  accountInfo: Record<string, unknown>;
  welcomeNextRoute: string;
  welcomeNextType: string;
  changelog: string;
  changelog_app: string;
  followus: unknown[];
  privacy_policy: string;
  privacy_policy_cn: string;
  staking_guide: string;
  staking_guide_cn: string;
  terms_and_contions: string;
  terms_and_contions_cn: string;
  addressDetail: AddressDetail;
  addressBookFrom: string;
  dappAccountList: unknown[];
  accountBalanceList: Record<string, unknown>;
  feeRecommend: FeeConfig;
  accountTypeCount: AccountTypeCount;
  nextTokenDetail: Record<string, unknown>;
  popupLockStatus: boolean;
  keyringInfo: Record<string, unknown>;
}

// ============ Action Interfaces ============

interface SetAccountInfoAction {
  type: typeof SET_ACCOUNT_INFO;
  info: Record<string, unknown>;
}

interface SetWelcomeNextRouteAction {
  type: typeof SET_WELCOME_NEXT_ROUTE;
  nextRoute: string;
}

interface SetWelcomeNextTypeAction {
  type: typeof SET_WELCOME_NEXT_TYPE;
  nextType: string;
}

interface UpdateAccountTypeFromAction {
  type: typeof UPDATE_ACCOUNT_TYPE_FROM;
  fromType: string;
}

interface UpdateExtensionBaseInfoAction {
  type: typeof UPDATE_EXTENSION_BASE_INFO;
  data: ExtensionBaseInfo;
}

interface UpdateAddressDetailAction {
  type: typeof UPDATE_ADDRESS_DETAIL;
  addressDetail: AddressDetail;
}

interface UpdateAddressBookFromAction {
  type: typeof UPDATE_ADDRESS_BOOK_FROM;
  from: string;
}

interface UpdateDappAccountListAction {
  type: typeof UPDATE_DAPP_ACCOUNT_LIST;
  selectList: unknown[];
}

interface UpdateAccountBalanceListAction {
  type: typeof UPDATE_ACCOUNT_BALANCE_LIST;
  accountDetail: Record<string, { publicKey: string }>;
}

interface UpdateRecommendFeeListAction {
  type: typeof UPDATE_RECOMMEND_FEE_LIST;
  feeRecommend: FeeConfig;
}

interface UpdateAccountTypeCountAction {
  type: typeof UPDATE_ACCOUNT_TYPE_COUNT;
  countMap: AccountTypeCount;
}

interface UpdateNextTokenDetailAction {
  type: typeof UPDATE_NEXT_TOKEN_DETAIL;
  token: Record<string, unknown>;
}

interface UpdatePopupLockStatusAction {
  type: typeof UPDATE_POPUP_LOCK_STATUS;
  status: boolean;
}

interface SetKeyringInfoAction {
  type: typeof SET_KEYRING_INFO;
  keyringInfo: Record<string, unknown>;
}

type CacheAction =
  | SetAccountInfoAction
  | SetWelcomeNextRouteAction
  | SetWelcomeNextTypeAction
  | UpdateAccountTypeFromAction
  | UpdateExtensionBaseInfoAction
  | UpdateAddressDetailAction
  | UpdateAddressBookFromAction
  | UpdateDappAccountListAction
  | UpdateAccountBalanceListAction
  | UpdateRecommendFeeListAction
  | UpdateAccountTypeCountAction
  | UpdateNextTokenDetailAction
  | UpdatePopupLockStatusAction
  | SetKeyringInfoAction;

// ============ Action Creators ============

export function updatePopupLockStatus(status: boolean) {
  return { type: UPDATE_POPUP_LOCK_STATUS, status };
}

export function setKeyringInfo(keyringInfo: Record<string, unknown>) {
  return { type: SET_KEYRING_INFO, keyringInfo };
}

export function updateAddressDetail(addressDetail: AddressDetail) {
  return { type: UPDATE_ADDRESS_DETAIL, addressDetail };
}

export function updateAddressBookFrom(from: string) {
  return { type: UPDATE_ADDRESS_BOOK_FROM, from };
}

export function updateExtensionBaseInfo(data: ExtensionBaseInfo) {
  return { type: UPDATE_EXTENSION_BASE_INFO, data };
}

export function setAccountInfo(info: Record<string, unknown>) {
  return { type: SET_ACCOUNT_INFO, info };
}

export function setWelcomeNextRoute(nextRoute: string) {
  return { type: SET_WELCOME_NEXT_ROUTE, nextRoute };
}

export function setWelcomeNextType(nextType: string) {
  return { type: SET_WELCOME_NEXT_TYPE, nextType };
}

export function updateAccountType(fromType: string) {
  return { type: UPDATE_ACCOUNT_TYPE_FROM, fromType };
}

export function updateDappSelectList(selectList: unknown[]) {
  return { type: UPDATE_DAPP_ACCOUNT_LIST, selectList };
}

export function updateAccountBalanceList(accountDetail: Record<string, { publicKey: string }>) {
  return { type: UPDATE_ACCOUNT_BALANCE_LIST, accountDetail };
}

export function updateRecommendFee(feeConfig: FeeConfig) {
  return { type: UPDATE_RECOMMEND_FEE_LIST, feeRecommend: feeConfig };
}

export function updateAccountTypeCount(countMap: AccountTypeCount) {
  return { type: UPDATE_ACCOUNT_TYPE_COUNT, countMap };
}

export function updateNextTokenDetail(token: Record<string, unknown>) {
  return { type: UPDATE_NEXT_TOKEN_DETAIL, token };
}

// ============ Initial State ============

const initState: CacheState = {
  fromType: "",
  accountInfo: {},
  welcomeNextRoute: "",
  welcomeNextType: "",
  changelog: "",
  changelog_app: "",
  followus: [],
  privacy_policy: Terms_default.privacy_policy,
  privacy_policy_cn: Terms_default.privacy_policy,
  staking_guide: "",
  staking_guide_cn: "",
  terms_and_contions: Terms_default.terms_and_contions,
  terms_and_contions_cn: Terms_default.terms_and_contions,
  addressDetail: {},
  addressBookFrom: "",
  dappAccountList: [],
  accountBalanceList: {},
  feeRecommend: DEFAULT_FEE_CONFIG,
  accountTypeCount: { create: 1, import: 1, ledger: 1 },
  nextTokenDetail: {},
  popupLockStatus: false,
  keyringInfo: {},
};

// ============ Reducer ============

const cacheReducer = (state: CacheState = initState, action: CacheAction): CacheState => {
  switch (action.type) {
    case SET_ACCOUNT_INFO:
      return { ...state, accountInfo: action.info };
    case SET_WELCOME_NEXT_ROUTE:
      return { ...state, welcomeNextRoute: action.nextRoute };
    case SET_WELCOME_NEXT_TYPE:
      return { ...state, welcomeNextType: action.nextType };
    case UPDATE_ACCOUNT_TYPE_FROM:
      return { ...state, fromType: action.fromType };
    case UPDATE_EXTENSION_BASE_INFO:
      return {
        ...state,
        changelog: action.data.changelog ?? state.changelog,
        changelog_app: action.data.changelog_app ?? state.changelog_app,
        followus: action.data.followus ?? state.followus,
        privacy_policy: action.data.privacy_policy ?? state.privacy_policy,
        privacy_policy_cn: action.data.privacy_policy_cn ?? state.privacy_policy_cn,
        staking_guide: action.data.staking_guide ?? state.staking_guide,
        staking_guide_cn: action.data.staking_guide_cn ?? state.staking_guide_cn,
        terms_and_contions: action.data.terms_and_contions ?? state.terms_and_contions,
        terms_and_contions_cn: action.data.terms_and_contions_cn ?? state.terms_and_contions_cn,
      };
    case UPDATE_ADDRESS_DETAIL:
      return { ...state, addressDetail: action.addressDetail };
    case UPDATE_ADDRESS_BOOK_FROM:
      return { ...state, addressBookFrom: action.from };
    case UPDATE_DAPP_ACCOUNT_LIST:
      return { ...state, dappAccountList: action.selectList };
    case UPDATE_ACCOUNT_BALANCE_LIST:
      const accountBalanceDetail = action.accountDetail;
      const accountList = { ...state.accountBalanceList };
      const keys = Object.keys(accountBalanceDetail);
      for (let index = 0; index < keys.length; index++) {
        const key = keys[index];
        const detail = accountBalanceDetail[key as string];
        if (detail?.publicKey) {
          accountList[detail.publicKey] = detail;
        }
      }
      return { ...state, accountBalanceList: accountList };
    case UPDATE_RECOMMEND_FEE_LIST:
      return { ...state, feeRecommend: action.feeRecommend };
    case UPDATE_ACCOUNT_TYPE_COUNT:
      return { ...state, accountTypeCount: { ...action.countMap } };
    case UPDATE_NEXT_TOKEN_DETAIL:
      return { ...state, nextTokenDetail: action.token || {} };
    case UPDATE_POPUP_LOCK_STATUS:
      return { ...state, popupLockStatus: action.status };
    case SET_KEYRING_INFO:
      return { ...state, keyringInfo: action.keyringInfo };
    default:
      return state;
  }
};

export default cacheReducer;
