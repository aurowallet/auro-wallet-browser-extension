export const POWER_BY = "aurowallet.com";

/** coin config */
export const MAIN_COIN_CONFIG = {
  name: "Mina Protocol",
  segwitAvailable: true,
  coinType: 12586,
  network: null,
  symbol: "MINA",
  decimals: 9,
};

/** current currency list */
export const CURRENCY_UNIT = [
  { key: "usd", value: "USD", symbol: "$" },
  { key: "cny", value: "CNY", symbol: "￥" },
  { key: "rub", value: "RUB", symbol: "₽" },

  { key: "eur", value: "EUR", symbol: "€" },
  { key: "gbp", value: "GBP", symbol: "£" },
  { key: "try", value: "TRY", symbol: "₺" },
  { key: "uah", value: "UAH", symbol: "₴" },
];

/** default lock time */
export const LOCK_TIME_DEFAULT = 30 * 60 * 1000;

export const lockDuration = {
  duration_1: 5 * 60 * 1000,
  duration_2: 10 * 60 * 1000,
  duration_3: 30 * 60 * 1000,
  duration_4: 1 * 60 * 60 * 1000,
  duration_5: 8 * 60 * 60 * 1000,
  duration_6: -1,
};

export const AUTO_LOCK_TIME_LIST = [
  {
    label: "lockTime_5m",
    value: lockDuration.duration_1,
  },
  {
    label: "lockTime_10m",
    value: lockDuration.duration_2,
  },
  {
    label: "lockTime_30m",
    value: lockDuration.duration_3,
  },
  {
    label: "lockTime_1h",
    value: lockDuration.duration_4,
  },
  {
    label: "lockTime_8h",
    value: lockDuration.duration_5,
  },
  {
    label: "lockTime_never",
    value: lockDuration.duration_6,
  },
];

/** default language */
export const DEFAULT_LANGUAGE = "en";

/** default tx length */
export const DEFAULT_TX_REQUEST_LENGTH = 10;

/** used for default zk zpp feePayer address, generate by PublicKey.empty().toBase58() that from o1js */
export const ZK_EMPTY_PUBLICKEY =
  "B62qiTKpEPjGTSHZrtM8uXiKgn8So916pLmNJKDhKeyBQL9TDb3nvBG";

/** default token id , generate by Field(1) */
export const ZK_DEFAULT_TOKEN_ID =
  "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf";

export const ContributeMoreLanguage =
  "https://hosted.weblate.org/projects/aurowallet/";

export const Terms_default = {
  terms_and_contions: "https://www.aurowallet.com/terms-and-conditions",
  privacy_policy: "https://www.aurowallet.com/privacy-policy",
};

export const Default_Follow_Link = [
  {
    website: "https://www.aurowallet.com",
    name: "Website",
    icon: "/img/ic_website.svg",
  },
  {
    website: "https://twitter.com/aurowallet_com",
    name: "X",
    icon: "/img/ic_x.svg",
  },
  {
    website: "https://t.me/aurowallet",
    name: "Telegram",
    icon: "/img/ic_telegram.svg",
  },
];


export const ValidatorsLaunch = 'https://github.com/aurowallet/launch/tree/master/validators'
export const TokenLaunch = ""