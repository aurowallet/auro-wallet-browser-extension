import { MAIN_COIN_CONFIG, ZK_DEFAULT_TOKEN_ID } from "@/constant";
import BigNumber from "bignumber.js";
import { amountDecimals, mergeLocalConfigToNetToken, toNonExponential, txSort } from "./utils";

// ============================token action================================
const defaultMinaAssets = {
  balance: {
    total: "0",
    liquid: "0",
  },
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
    iconUrl:"img/mina_color.svg"
  },
  localConfig: {
    hideToken: false,
  },
};

/**
 * token action
 * @param {*} a
 * @param {*} b
 * @returns
 */
function compareTokens(a, b) {
  const amountA = a.tokenBaseInfo.showAmount
    ? parseFloat(a.tokenBaseInfo.showAmount)
    : null;
  const amountB = b.tokenBaseInfo.showAmount
    ? parseFloat(b.tokenBaseInfo.showAmount)
    : null;

  if (amountA !== null && amountB !== null) {
    if (amountA > amountB) {
      return -1;
    } else if (amountA < amountB) {
      return 1;
    }
  } else if (amountA !== null) {
    return -1;
  } else if (amountB !== null) {
    return 1;
  }

  const balanceA = parseFloat(a.tokenBaseInfo.showBalance);
  const balanceB = parseFloat(b.tokenBaseInfo.showBalance);

  if (balanceA > balanceB) {
    return -1;
  } else if (balanceA < balanceB) {
    return 1;
  } else {
    const symbolA = a.tokenNetInfo?.tokenSymbol || "";
    const symbolB = b.tokenNetInfo?.tokenSymbol || "";
    return symbolA.localeCompare(symbolB);
  }
}

export function processTokenList(
  supportTokenList,
  tokenAssetsList,
  prices,
  localShowedTokenIds,
  localTokenConfig
) {
  let newTokenCount = 0;
  const sourceTokenList = tokenAssetsList;
  let totalShowAmount = 0;
  const tokenListWithLocalConfig = sourceTokenList.map((tokenItem) => {
    let localConfig = tokenItem.localConfig || {};
    let hideTokenStatus = false;
    if (localTokenConfig[tokenItem.tokenId]) {
      hideTokenStatus = localTokenConfig[tokenItem.tokenId].hideToken;
    }else{
      const supportInfo = supportTokenList.find((token) => token.tokenId == tokenItem.tokenId)
      hideTokenStatus = !supportInfo
    }
    if(tokenItem.tokenId==ZK_DEFAULT_TOKEN_ID){
      hideTokenStatus = false
    }
    return {
      ...tokenItem,
      localConfig: {
        ...localConfig,
        hideToken: hideTokenStatus,
      },
    };
  });
  const nextTokenList = tokenListWithLocalConfig.map((tokenItem) => {
    const isMainToken = tokenItem.tokenId === ZK_DEFAULT_TOKEN_ID
    const supportInfo = supportTokenList.find((token) => token.tokenId == tokenItem.tokenId)
    const tempToken = {
      ...tokenItem,
      tokenBaseInfo: { ...tokenItem.tokenBaseInfo },
    };
    const tokenBaseInfo = tempToken.tokenBaseInfo;

    tokenBaseInfo.isScam = false;
    tokenBaseInfo.iconUrl = supportInfo?.iconUrl ?? "";
    let decimals = 0;

    if(supportInfo?.tokenId){
      decimals = supportInfo.decimal
    }else{
      if(isMainToken){
        decimals = MAIN_COIN_CONFIG.decimals;
      }else{
        if(tokenItem.tokenNetInfo?.publicKey){
          const zkappState = tokenItem.tokenNetInfo.zkappState || [];
          if (Array.isArray(zkappState)) {
            decimals = zkappState[0] || 0;
          }
        }
      }
    }
    tokenBaseInfo.decimals = decimals;
    if (tokenItem.tokenNetInfo?.publicKey) {
      tokenBaseInfo.showBalance = toNonExponential(amountDecimals(
        tokenItem.balance.total,
        decimals
      ));
    } else {
      if (isMainToken) {
        tokenBaseInfo.isMainToken = true;
        const delegateAccount = tokenItem.delegateAccount?.publicKey;
        tokenBaseInfo.isDelegation =
          delegateAccount && delegateAccount !== tokenItem.publicKey;
        tokenBaseInfo.showBalance = toNonExponential(amountDecimals(
          tokenItem.balance.total,
          tokenBaseInfo.decimals
        ));
        tokenBaseInfo.iconUrl = "img/mina_color.svg";
      } else {
        tokenBaseInfo.showBalance = toNonExponential(amountDecimals(
          tokenItem.balance.total,
          decimals
        ));
      }
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
    if (
      !tempToken.tokenBaseInfo.tokenShowed &&
      !tempToken.tokenBaseInfo.isMainToken
    ) {
      newTokenCount = newTokenCount + 1;
    }
    return tempToken;
  });

  nextTokenList.sort(compareTokens);

  const defaultTokenIndex = nextTokenList.findIndex(
    (token) => token.tokenId === ZK_DEFAULT_TOKEN_ID
  );

  let mainTokenNetInfo = defaultMinaAssets;
  if (defaultTokenIndex !== -1) {
    const [defaultToken] = nextTokenList.splice(defaultTokenIndex, 1);
    nextTokenList.unshift(defaultToken);
    mainTokenNetInfo = defaultToken;
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

export function processTokenShowStatus(tokenAssetsList, tokenConfig,clickTokenID) {
  let tokenShowList = [];
  let totalShowAmount = 0;

  const nextTokenList = tokenAssetsList.map((tokenItem) => {
    if(tokenItem.tokenId == clickTokenID){
      let tempLocalConfig = tokenConfig[clickTokenID];
      if(!tempLocalConfig?.hideToken){
        tokenShowList.push(tokenItem);
        let tokenAmount = tokenItem.tokenBaseInfo.showAmount ?? 0;
        totalShowAmount = new BigNumber(totalShowAmount)
          .plus(tokenAmount)
          .toString();
      }
      return {
        ...tokenItem,
        localConfig: tempLocalConfig,
      };
    }else{
      if (!tokenItem.localConfig?.hideToken) {
        tokenShowList.push(tokenItem);
        let tokenAmount = tokenItem.tokenBaseInfo.showAmount ?? 0;
        totalShowAmount = new BigNumber(totalShowAmount)
          .plus(tokenAmount)
          .toString();
      }
      return tokenItem;
    }
  });
  return { tokenList: nextTokenList, tokenShowList, totalShowAmount };
}

export function processNewTokenStatus(tokenAssetsList, showedTokenIdList) {
  let newTokenCount = 0;
  const nextTokenList = tokenAssetsList.map((tokenItem) => {
    const tokenNew = showedTokenIdList.indexOf(tokenItem.tokenId) === -1; // -1 证明没展示过
    if (tokenNew) {
      newTokenCount = newTokenCount + 1;
    }
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
  let mainTokenNetInfo = nextTokenList.find(
    (token) => token.tokenId === ZK_DEFAULT_TOKEN_ID
  );
  return {
    tokenList: nextTokenList,
    tokenShowList,
    mainTokenNetInfo,
    newTokenCount,
  };
}

// ============================tx action================================
/**
 * format pending tx
 * @param {*} pendingTxList
 * @returns
 */
export function formatPendingTx(pendingTxList) {
  let newList = [];
  for (let index = 0; index < pendingTxList.length; index++) {
    const detail = pendingTxList[index];
    newList.push({
      id: detail.id,
      hash: detail.hash,
      kind: detail.kind,
      dateTime: detail.time,
      from: detail.from,
      to: detail.to,
      amount: detail.amount,
      fee: detail.fee,
      nonce: detail.nonce,
      memo: detail.memo,
      status: "PENDING",
      timestamp: new Date(detail.time).getTime(),
    });
  }
  return newList;
}

function getZkOtherAccount(zkApp) {
  let accountUpdates = zkApp.zkappCommand.accountUpdates;
  if (Array.isArray(accountUpdates) && accountUpdates.length > 0) {
    return accountUpdates[0]?.body?.publicKey;
  }
  return "";
}

function formatZkTx(zkAppList, isPending = false) {
  let newList = [];
  for (let index = 0; index < zkAppList.length; index++) {
    const zkApp = zkAppList[index];
    let isFailed =
      Array.isArray(zkApp.failureReason) && zkApp.failureReason.length > 0;
    let status = isPending ? "PENDING" : isFailed ? "failed" : "applied";
    newList.push({
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
      status: status,
      type: "zkApp",
      body: zkApp,
      timestamp: isPending ? "" : new Date(zkApp.dateTime).getTime(),
      failureReason: isFailed ? zkApp.failureReason : "",
    });
  }
  return newList;
}

export function formatTxTime(list) {
  return list.map((item) => {
    item.timestamp = new Date(item.dateTime).getTime();
    return item;
  });
}

export function setScamAndTxList(scamList, txList) {
  let nextTxList = txList.map((txData) => {
    const nextTxData = { ...txData };
    if (nextTxData.from) {
      const address = nextTxData.from;
      const index = scamList.findIndex((scam) => scam.address === address);
      nextTxData.isFromAddressScam = index !== -1;
    }
    return nextTxData;
  });
  return nextTxList;
}
function tokenHistoryFilter(list, tokenId) {
  if (!tokenId) {
    return list;
  }
  let newList = [];
  for (let index = 0; index < list.length; index++) {
    const txItem = list[index];
    if (txItem?.body?.zkappCommand) {
      // just filter zk pending
      const accountUpdates = txItem.body.zkappCommand.accountUpdates; // []
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

export function formatAllTxHistory(action) {
  let txList = action.txList || [];
  let txPendingList = action.txPendingList || [];
  let zkAppList = action.zkAppList || [];
  let zkPendingList = action.zkPendingList || [];

  let tokenId = action.tokenId;

  txPendingList = txPendingList.reverse();
  txPendingList = formatPendingTx(txPendingList);
  zkAppList = formatZkTx(zkAppList);
  zkPendingList = formatZkTx(zkPendingList, true);

  txList = formatTxTime(txList);

  const commonList = [...txList, ...zkAppList];
  commonList.sort(txSort);

  const commonPendingList = [...txPendingList, ...zkPendingList];
  commonPendingList.sort((a, b) => b.nonce - a.nonce);
  if (commonPendingList.length > 0) {
    commonPendingList[commonPendingList.length - 1].showSpeedUp = true;
  }

  let nextPendingList = [...commonPendingList];
  if (tokenId !== ZK_DEFAULT_TOKEN_ID) {
    nextPendingList = tokenHistoryFilter(nextPendingList, tokenId);
  }

  let newList = [...nextPendingList, ...commonList];
  if (newList.length > 0) {
    newList.push({
      showExplorer: true,
    });
  }
  return newList;
}
