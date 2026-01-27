import { MAIN_COIN_CONFIG, ZK_DEFAULT_TOKEN_ID } from "@/constant";
import BigNumber from "bignumber.js";
import { amountDecimals, toNonExponential } from "./utils";

// ============ Types ============

interface TokenBalance {
  total: string;
  liquid?: string;
}

interface TokenBaseInfo {
  isScam?: boolean;
  decimals: number;
  isMainToken?: boolean;
  showBalance: string;
  showAmount?: string;
  iconUrl?: string;
  isDelegation?: boolean;
  tokenShowed?: boolean;
}

interface TokenLocalConfig {
  hideToken?: boolean;
}

interface TokenNetInfo {
  tokenSymbol?: string;
  publicKey?: string;
  zkappState?: (number | string)[];
}

interface DelegateAccount {
  publicKey?: string;
}

export interface TokenItem {
  tokenId: string;
  balance: TokenBalance;
  inferredNonce?: number;
  delegateAccount?: DelegateAccount | null;
  publicKey?: string;
  tokenNetInfo?: TokenNetInfo | null;
  tokenBaseInfo: TokenBaseInfo;
  localConfig?: TokenLocalConfig;
}

interface SupportToken {
  tokenId: string;
  decimal?: number;
  iconUrl?: string;
}

interface TokenPrice {
  [tokenId: string]: number | string;
}

export interface TokenConfig {
  [tokenId: string]: TokenLocalConfig;
}

export interface ProcessTokenListResult {
  tokenList: TokenItem[];
  tokenTotalAmount: string | number;
  tokenShowList: TokenItem[];
  mainTokenNetInfo: TokenItem;
  newTokenCount: number;
}

export interface ProcessTokenShowStatusResult {
  tokenList: TokenItem[];
  tokenShowList: TokenItem[];
  totalShowAmount: string | number;
}

export interface ProcessNewTokenStatusResult {
  tokenList: TokenItem[];
  tokenShowList: TokenItem[];
  mainTokenNetInfo: TokenItem | undefined;
  newTokenCount: number;
}

// ============ Default Values ============

const defaultMinaAssets: TokenItem = {
  balance: { total: "0", liquid: "0" },
  inferredNonce: 0,
  delegateAccount: null,
  tokenId: ZK_DEFAULT_TOKEN_ID,
  publicKey: "",
  tokenNetInfo: null,
  tokenBaseInfo: {
    isScam: false,
    decimals: MAIN_COIN_CONFIG.decimals,
    isMainToken: true,
    showBalance: "0",
    showAmount: "0",
    iconUrl: "img/mina_color.svg",
  },
  localConfig: { hideToken: false },
};

// ============ Token Functions ============

function compareTokens(a: TokenItem, b: TokenItem): number {
  const amountA = a.tokenBaseInfo.showAmount
    ? parseFloat(a.tokenBaseInfo.showAmount)
    : null;
  const amountB = b.tokenBaseInfo.showAmount
    ? parseFloat(b.tokenBaseInfo.showAmount)
    : null;

  if (amountA !== null && amountB !== null) {
    if (amountA > amountB) return -1;
    if (amountA < amountB) return 1;
  } else if (amountA !== null) {
    return -1;
  } else if (amountB !== null) {
    return 1;
  }

  const balanceA = parseFloat(a.tokenBaseInfo.showBalance);
  const balanceB = parseFloat(b.tokenBaseInfo.showBalance);

  if (balanceA > balanceB) return -1;
  if (balanceA < balanceB) return 1;

  const symbolA = a.tokenNetInfo?.tokenSymbol || "";
  const symbolB = b.tokenNetInfo?.tokenSymbol || "";
  return symbolA.localeCompare(symbolB);
}

export function processTokenList(
  supportTokenList: SupportToken[],
  tokenAssetsList: TokenItem[],
  prices: TokenPrice,
  localShowedTokenIds: string[],
  localTokenConfig: TokenConfig
): ProcessTokenListResult {
  let newTokenCount = 0;
  let totalShowAmount: string | number = 0;

  const tokenListWithLocalConfig = tokenAssetsList.map((tokenItem) => {
    const localConfig = tokenItem.localConfig || {};
    let hideTokenStatus = false;

    const tokenConfig = localTokenConfig[tokenItem.tokenId];
    if (tokenConfig) {
      hideTokenStatus = tokenConfig.hideToken || false;
    } else {
      const supportInfo = supportTokenList.find(
        (token) => token.tokenId === tokenItem.tokenId
      );
      hideTokenStatus = !supportInfo;
    }

    if (tokenItem.tokenId === ZK_DEFAULT_TOKEN_ID) {
      hideTokenStatus = false;
    }

    return {
      ...tokenItem,
      localConfig: { ...localConfig, hideToken: hideTokenStatus },
    };
  });

  const nextTokenList = tokenListWithLocalConfig.map((tokenItem) => {
    const isMainToken = tokenItem.tokenId === ZK_DEFAULT_TOKEN_ID;
    const supportInfo = supportTokenList.find(
      (token) => token.tokenId === tokenItem.tokenId
    );

    const tempToken: TokenItem = {
      ...tokenItem,
      tokenBaseInfo: { ...tokenItem.tokenBaseInfo },
    };
    const tokenBaseInfo = tempToken.tokenBaseInfo;

    tokenBaseInfo.isScam = false;
    tokenBaseInfo.iconUrl = supportInfo?.iconUrl ?? "";

    let decimals = 0;
    if (supportInfo?.tokenId) {
      decimals = supportInfo.decimal || 0;
    } else if (isMainToken) {
      decimals = MAIN_COIN_CONFIG.decimals;
    } else if (tokenItem.tokenNetInfo?.publicKey) {
      const zkappState = tokenItem.tokenNetInfo.zkappState || [];
      if (Array.isArray(zkappState)) {
        decimals = Number(zkappState[0]) || 0;
      }
    }

    tokenBaseInfo.decimals = decimals;

    if (tokenItem.tokenNetInfo?.publicKey) {
      tokenBaseInfo.showBalance = toNonExponential(
        amountDecimals(tokenItem.balance.total, decimals)
      );
    } else if (isMainToken) {
      tokenBaseInfo.isMainToken = true;
      const delegateAccount = tokenItem.delegateAccount?.publicKey;
      tokenBaseInfo.isDelegation =
        !!delegateAccount && delegateAccount !== tokenItem.publicKey;
      tokenBaseInfo.showBalance = toNonExponential(
        amountDecimals(tokenItem.balance.total, tokenBaseInfo.decimals)
      );
      tokenBaseInfo.iconUrl = "img/mina_color.svg";
    } else {
      tokenBaseInfo.showBalance = toNonExponential(
        amountDecimals(tokenItem.balance.total, decimals)
      );
    }

    const tokenPrice = prices[tokenItem.tokenId];
    if (tokenPrice) {
      tokenBaseInfo.showAmount = new BigNumber(tokenBaseInfo.showBalance)
        .multipliedBy(tokenPrice)
        .toString();
      if (!tokenItem.localConfig?.hideToken) {
        totalShowAmount = new BigNumber(totalShowAmount)
          .plus(tokenBaseInfo.showAmount)
          .toString();
      }
    }

    tempToken.tokenBaseInfo.tokenShowed = localShowedTokenIds.includes(
      tempToken.tokenId
    );

    if (!tempToken.tokenBaseInfo.tokenShowed && !tempToken.tokenBaseInfo.isMainToken) {
      newTokenCount++;
    }

    return tempToken;
  });

  nextTokenList.sort(compareTokens);

  const defaultTokenIndex = nextTokenList.findIndex(
    (token) => token.tokenId === ZK_DEFAULT_TOKEN_ID
  );

  let mainTokenNetInfo: TokenItem = defaultMinaAssets;
  if (defaultTokenIndex !== -1) {
    const [defaultToken] = nextTokenList.splice(defaultTokenIndex, 1);
    if (defaultToken) {
      nextTokenList.unshift(defaultToken);
      mainTokenNetInfo = defaultToken;
    }
  } else {
    nextTokenList.unshift(defaultMinaAssets);
  }

  const tokenShowList = nextTokenList.filter(
    (tokenItem) => !tokenItem.localConfig?.hideToken
  );

  return {
    tokenList: nextTokenList,
    tokenTotalAmount: totalShowAmount,
    tokenShowList,
    mainTokenNetInfo,
    newTokenCount,
  };
}

export function processTokenShowStatus(
  tokenAssetsList: TokenItem[],
  tokenConfig: TokenConfig,
  clickTokenID: string
): ProcessTokenShowStatusResult {
  const tokenShowList: TokenItem[] = [];
  let totalShowAmount: string | number = 0;

  const nextTokenList = tokenAssetsList.map((tokenItem) => {
    if (tokenItem.tokenId === clickTokenID) {
      const tempLocalConfig = tokenConfig[clickTokenID];
      if (!tempLocalConfig?.hideToken) {
        tokenShowList.push(tokenItem);
        const tokenAmount = tokenItem.tokenBaseInfo.showAmount ?? 0;
        totalShowAmount = new BigNumber(totalShowAmount).plus(tokenAmount).toString();
      }
      return { ...tokenItem, localConfig: tempLocalConfig };
    } else {
      if (!tokenItem.localConfig?.hideToken) {
        tokenShowList.push(tokenItem);
        const tokenAmount = tokenItem.tokenBaseInfo.showAmount ?? 0;
        totalShowAmount = new BigNumber(totalShowAmount).plus(tokenAmount).toString();
      }
      return tokenItem;
    }
  });

  return { tokenList: nextTokenList, tokenShowList, totalShowAmount };
}

export function processNewTokenStatus(
  tokenAssetsList: TokenItem[],
  showedTokenIdList: string[]
): ProcessNewTokenStatusResult {
  let newTokenCount = 0;

  const nextTokenList = tokenAssetsList.map((tokenItem) => {
    const tokenNew = showedTokenIdList.indexOf(tokenItem.tokenId) === -1;
    if (tokenNew) newTokenCount++;

    return {
      ...tokenItem,
      tokenBaseInfo: {
        ...tokenItem.tokenBaseInfo,
        tokenShowed: !tokenNew,
      },
    };
  });

  const tokenShowList = nextTokenList.filter(
    (tokenItem) => !tokenItem.localConfig?.hideToken
  );

  const mainTokenNetInfo = nextTokenList.find(
    (token) => token.tokenId === ZK_DEFAULT_TOKEN_ID
  );

  return { tokenList: nextTokenList, tokenShowList, mainTokenNetInfo, newTokenCount };
}

// ============ Transaction Types ============

interface PendingTx {
  id?: string;
  hash: string;
  kind: string;
  from: string;
  to: string;
  amount: string;
  fee: string;
  nonce: number;
  memo?: string;
}

interface ZkAppCommand {
  feePayer: {
    body: {
      publicKey: string;
      fee: string;
      nonce: number;
    };
  };
  accountUpdates: Array<{
    body: {
      publicKey?: string;
      tokenId?: string;
    };
  }>;
  memo?: string;
}

interface ZkAppItem {
  hash: string;
  dateTime?: string;
  zkappCommand: ZkAppCommand;
  failureReason?: string[];
}

interface FullTxItem {
  kind: string;
  body?: Record<string, unknown>;
  zkAppBody?: ZkAppItem;
}

export interface FormattedTx {
  id?: string;
  hash: string;
  kind: string;
  from: string;
  to: string;
  amount: string;
  fee: string;
  nonce: number;
  memo?: string;
  status: string;
  dateTime?: string;
  type?: string;
  body?: unknown;
  timestamp?: number | string;
  failureReason?: string | string[];
  isFromAddressScam?: boolean;
  showSpeedUp?: boolean;
  showExplorer?: boolean;
}

interface ScamItem {
  address: string;
}

// ============ Transaction Functions ============

export function formatPendingTx(pendingTxList: PendingTx[]): FormattedTx[] {
  return pendingTxList.map((detail) => ({
    id: detail.id,
    hash: detail.hash,
    kind: detail.kind,
    from: detail.from,
    to: detail.to,
    amount: detail.amount,
    fee: detail.fee,
    nonce: detail.nonce,
    memo: detail.memo,
    status: "PENDING",
  }));
}

function getZkOtherAccount(zkApp: ZkAppItem): string {
  const accountUpdates = zkApp.zkappCommand.accountUpdates;
  if (Array.isArray(accountUpdates) && accountUpdates.length > 0) {
    return accountUpdates[0]?.body?.publicKey || "";
  }
  return "";
}

function formatZkTx(zkAppList: ZkAppItem[], isPending: boolean = false): FormattedTx[] {
  return zkAppList.map((zkApp) => {
    const isFailed =
      Array.isArray(zkApp.failureReason) && zkApp.failureReason.length > 0;
    const status = isPending ? "PENDING" : isFailed ? "failed" : "applied";

    return {
      id: "",
      hash: zkApp.hash,
      kind: "zkApp",
      dateTime: zkApp.dateTime || "",
      from: zkApp.zkappCommand.feePayer.body.publicKey,
      to: getZkOtherAccount(zkApp),
      amount: "0",
      fee: zkApp.zkappCommand.feePayer.body.fee,
      nonce: zkApp.zkappCommand.feePayer.body.nonce,
      memo: zkApp.zkappCommand.memo,
      status,
      type: "zkApp",
      body: zkApp,
      timestamp: isPending ? "" : new Date(zkApp.dateTime || "").getTime(),
      failureReason: isFailed ? zkApp.failureReason : "",
    };
  });
}

function formatCompleteTx(txList: FullTxItem[]): FormattedTx[] {
  const newList: FormattedTx[] = [];

  for (const txBody of txList) {
    if (txBody.kind !== "zkApp") {
      newList.push({ ...(txBody.body as unknown as FormattedTx) });
    } else {
      const zkAppBody = txBody.zkAppBody;
      if (!zkAppBody) continue;

      const failureReason = (zkAppBody as unknown as { failureReasons?: string[] })
        .failureReasons ?? [];
      const isFailed = Array.isArray(failureReason) && failureReason.length > 0;
      const status = isFailed ? "failed" : "applied";

      newList.push({
        id: "",
        hash: zkAppBody.hash,
        kind: "zkApp",
        dateTime: zkAppBody.dateTime || "",
        from: zkAppBody.zkappCommand.feePayer.body.publicKey,
        to: getZkOtherAccount(zkAppBody),
        amount: "0",
        fee: zkAppBody.zkappCommand.feePayer.body.fee,
        nonce: zkAppBody.zkappCommand.feePayer.body.nonce,
        memo: zkAppBody.zkappCommand.memo,
        status,
        type: "zkApp",
        body: zkAppBody,
        timestamp: new Date(zkAppBody.dateTime || "").getTime(),
        failureReason: isFailed ? failureReason : "",
      });
    }
  }

  return newList;
}

export function setScamAndTxList(
  scamList: ScamItem[],
  txList: FormattedTx[]
): FormattedTx[] {
  return txList.map((txData) => {
    const nextTxData = { ...txData };
    if (nextTxData.from) {
      const address = nextTxData.from;
      const index = scamList.findIndex((scam) => scam.address === address);
      nextTxData.isFromAddressScam = index !== -1;
    }
    return nextTxData;
  });
}

function tokenHistoryFilter(list: FormattedTx[], tokenId: string): FormattedTx[] {
  if (!tokenId) return list;

  const newList: FormattedTx[] = [];
  for (const txItem of list) {
    const body = txItem.body as ZkAppItem | undefined;
    if (body?.zkappCommand) {
      const accountUpdates = body.zkappCommand.accountUpdates;
      const targetIndex = accountUpdates.findIndex(
        (updateItem) => updateItem.body.tokenId === tokenId
      );
      if (targetIndex !== -1) {
        newList.push(txItem);
      }
    }
  }
  return newList;
}

export interface TxHistoryAction {
  txPendingList?: PendingTx[];
  zkPendingList?: ZkAppItem[];
  fullTxList?: FullTxItem[];
  tokenId?: string;
}

export function formatAllTxHistory(action: TxHistoryAction): FormattedTx[] {
  let txPendingList = action.txPendingList || [];
  let zkPendingList = action.zkPendingList || [];
  const fullTxList = action.fullTxList || [];
  const tokenId = action.tokenId;

  txPendingList = txPendingList.slice().reverse();
  const formattedPendingTx = formatPendingTx(txPendingList);
  const formattedFullTx = formatCompleteTx(fullTxList);
  const formattedZkPending = formatZkTx(zkPendingList, true);

  const commonPendingList = [...formattedPendingTx, ...formattedZkPending];
  commonPendingList.sort((a, b) => b.nonce - a.nonce);

  if (commonPendingList.length > 0) {
    const lastItem = commonPendingList[commonPendingList.length - 1];
    if (lastItem) {
      lastItem.showSpeedUp = true;
    }
  }

  let nextPendingList = [...commonPendingList];
  if (tokenId !== ZK_DEFAULT_TOKEN_ID) {
    nextPendingList = tokenHistoryFilter(nextPendingList, tokenId || "");
  }

  const newList: FormattedTx[] = [...nextPendingList, ...formattedFullTx];
  if (newList.length > 0) {
    newList.push({ showExplorer: true } as FormattedTx);
  }

  return newList;
}
