import BigNumber from "bignumber.js";
import { AccountUpdate } from "../constant/zkAccountUpdateDoc";
import { addressSlice, amountDecimals } from "./utils";
import {
  MAIN_COIN_CONFIG,
  ZK_DEFAULT_TOKEN_ID,
  ZK_EMPTY_PUBLICKEY,
} from "@/constant";

function short(s) {
  return ".." + s.slice(-4);
}
function getFormatFeePayer(zkappCommand) {
  let feePayer = zkappCommand.feePayer;
  feePayer.body.authorization = short(feePayer.authorization);
  if (feePayer.body.validUntil === null) delete feePayer.body.validUntil;
  return { label: "FeePayer", ...feePayer.body };
}

function removeNoUpdateValue(data, docBody) {
  const bodyKeys = Object.keys(data);
  // Flag to track if any child was isRemovedAll
  let isRemovedAll = true;
  bodyKeys.forEach((key) => {
    const nextBodyContent = data[key];
    const body_docEntries = docBody.docEntries;
    const body_entries = docBody.entries;
    if (nextBodyContent === body_docEntries[key]) {
      // The key matches the default value, so delete it
      delete data[key];
      // const nextKeys = Object.keys(data);
    } else {
      const nextType = body_entries[key]?.type;

      if (nextType === "object") {
        // Check if the child object is empty
        const childRemoved = removeNoUpdateValue(
          nextBodyContent,
          body_entries[key]
        );
        if (childRemoved) {
          // Remove the key if the child object is empty
          delete data[key];
        } else {
          isRemovedAll = false;
        }
      } else {
        isRemovedAll = false;
      }
    }
  });

  return isRemovedAll;
}
function filterByDefaultsValue(jsonUpdateBody) {
  const nextRealBody = { ...jsonUpdateBody };
  const nextDocBody = AccountUpdate.entries.body;
  removeNoUpdateValue(nextRealBody, nextDocBody);
  return nextRealBody;
}
function getFormatAccountUpdate(jsonUpdate, index) {
  let body = filterByDefaultsValue(jsonUpdate.body);
  delete body.callData;
  if (body.balanceChange?.magnitude === "0") delete body.balanceChange;
  if (body.tokenId === "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf") {
    delete body.tokenId;
  } else {
    body.tokenId = short(body.tokenId);
  }
  if (body.callDepth === 0) delete body.callDepth;
  if (body.incrementNonce === false) delete body.incrementNonce;
  if (body.useFullCommitment === false) delete body.useFullCommitment;
  if (body.implicitAccountCreationFee === false)
    delete body.implicitAccountCreationFee;
  if (body.events?.length === 0) delete body.events;
  if (body.actions?.length === 0) delete body.actions;
  if (body.preconditions?.account) {
    body.preconditions.account = JSON.stringify(body.preconditions.account);
  }
  if (body.preconditions?.network) {
    body.preconditions.network = JSON.stringify(body.preconditions.network);
  }
  if (body.preconditions?.validWhile) {
    body.preconditions.validWhile = JSON.stringify(
      body.preconditions.validWhile
    );
  }
  if (jsonUpdate.authorization?.proof) {
    jsonUpdate.authorization.proof = short(jsonUpdate.authorization.proof);
  }
  if (jsonUpdate.authorization?.signature) {
    jsonUpdate.authorization.signature = short(
      jsonUpdate.authorization.signature
    );
  } else {
    if (jsonUpdate.authorization?.signature === null) {
      delete jsonUpdate.authorization?.signature;
    }
  }
  if (body.update?.verificationKey) {
    body.update.verificationKey = JSON.stringify({
      data: short(body.update.verificationKey.data),
      hash: short(body.update.verificationKey.hash),
    });
  }
  for (let key of ["permissions", "appState", "timing"]) {
    if (body.update?.[key]) {
      body.update[key] = JSON.stringify(body.update[key]);
    }
  }
  for (let key of ["events", "actions"]) {
    if (body[key]) {
      body[key] = JSON.stringify(body[key]);
    }
  }
  if (
    jsonUpdate.authorization !== undefined ||
    body.authorizationKind?.isProved === true ||
    body.authorizationKind?.isSigned === true
  ) {
    body.authorization = jsonUpdate.authorization;
  }
  body.mayUseToken = {
    parentsOwnToken: jsonUpdate.body.mayUseToken.parentsOwnToken,
    inheritFromParent: jsonUpdate.body.mayUseToken.inheritFromParent,
  };
  let pretty = { ...body };
  pretty = { label: "AccountUpdates:(" + (index + 1) + ")", ...pretty };
  return pretty;
}
/**
 * format zkCommond
 * @returns
 */
export function toPretty(zkappCommand) {
  const nextZkCommond = JSON.parse(zkappCommand);
  const feePayerBody = getFormatFeePayer(nextZkCommond);
  return [
    feePayerBody,
    ...nextZkCommond.accountUpdates.map((accountUpdates, index) =>
      getFormatAccountUpdate(accountUpdates, index)
    ),
  ];
}

function getFormatFeePayerV2(zkappCommand, currentAddress) {
  let feePayer = zkappCommand.feePayer;
  let feePayerKey = feePayer.body.publicKey;
  if (feePayerKey.toLowerCase() === ZK_EMPTY_PUBLICKEY.toLocaleLowerCase()) {
    feePayerKey = currentAddress;
  }
  let fee = feePayer.body.fee;
  if (fee) {
    fee = amountDecimals(fee, MAIN_COIN_CONFIG.decimals);
  }
  let res = {
    label: "feePayer",
    children: [
      { label: "publicKey", value: addressSlice(feePayerKey) },
      {
        label: "fee",
        value: fee + " " + MAIN_COIN_CONFIG.symbol,
      },
    ],
  };
  return res;
}

function getUpdateBody(zkappCommand) {
  const accountUpdates = zkappCommand.accountUpdates;
  let updateInfo = {
    label: "accountUpdates",
    children: [],
  };
  for (let index = 0; index < accountUpdates.length; index++) {
    const accountItemBody = accountUpdates[index].body;
    const publicKey = accountItemBody.publicKey;
    const tokenId = accountItemBody.tokenId;
    const balanceChangeBody = accountItemBody.balanceChange;
    let balanceChangeOperator =
      balanceChangeBody.sgn.toLowerCase() === "negative" ? "-" : "+";
    let balanceChange = new BigNumber(balanceChangeBody.magnitude).isEqualTo(0)
      ? 0
      : balanceChangeOperator +
        amountDecimals(balanceChangeBody.magnitude, MAIN_COIN_CONFIG.decimals);
    let tokenSymbol;
    if (accountItemBody.tokenId === ZK_DEFAULT_TOKEN_ID) {
      tokenSymbol = MAIN_COIN_CONFIG.symbol;
    } else {
      const bodyTokenSymbol = accountItemBody.update.tokenSymbol;
      tokenSymbol = bodyTokenSymbol === null ? "UNKNOWN" : bodyTokenSymbol;
    }
    const showBalanceChange = balanceChange + " " + tokenSymbol;
    updateInfo.children.push({
      label: "Account #" + (index + 1),
      children: [
        {
          label: "publicKey",
          value: addressSlice(publicKey),
        },
        {
          label: "tokenId",
          value: addressSlice(tokenId),
        },
        {
          label: "balanceChange",
          value: showBalanceChange,
        },
      ],
    });
  }
  return updateInfo;
}
export function getZkInfo(zkappCommand, currentAddress) {
  try {
    const nextZkCommond = JSON.parse(zkappCommand);
    const feePayerBody = getFormatFeePayerV2(nextZkCommond, currentAddress);
    const accountUpdateBody = getUpdateBody(nextZkCommond);
    return [feePayerBody, accountUpdateBody];
  } catch (error) {
    return [
      {
        label: "Error",
        value: String(error),
      },
    ];
  }
}

/** format zkAppCommand to string */
export function zkCommondFormat(zkAppCommand) {
  if (typeof zkAppCommand === "string") {
    // if zkAppCommand is string
    return zkAppCommand;
  }
  // if zkAppCommand is object
  return JSON.stringify(zkAppCommand);
}

/** get fee from zk */
export function getZkFee(zkappCommand) {
  try {
    const nextZkCommond = JSON.parse(zkappCommand);
    let feePayer = nextZkCommond.feePayer;
    let fee = feePayer.body.fee;
    if (new BigNumber(fee).isGreaterThan(0)) {
      return amountDecimals(fee, MAIN_COIN_CONFIG.decimals);
    }
    return 0;
  } catch (error) {
    return 0;
  }
}

/**
 * verifyTokenCommand from server
 * @param {*} sourceData
 * @param {*} sendTokenId
 * @param {*} buildZkCommand
 * @returns
 */
export function verifyTokenCommand(sourceData, sendTokenId, buildZkCommand) {
  const { sender, receiver, amount, isNewAccount } = sourceData;
  const nextBuildZkCommand = JSON.parse(buildZkCommand);
  let senderVerified = false;
  let receiverVerified = false;
  const accountUpdateCount = isNewAccount ? 4 : 3;
  if (nextBuildZkCommand.accountUpdates.length != accountUpdateCount) {
    return false;
  }
  nextBuildZkCommand.accountUpdates.forEach((accountUpdate) => {
    const { publicKey, balanceChange, tokenId } = accountUpdate.body;

    if (tokenId === sendTokenId) {
      if (publicKey === sender) {
        if (
          balanceChange.magnitude === amount.toString() &&
          balanceChange.sgn === "Negative"
        ) {
          senderVerified = true;
        }
      }

      if (publicKey === receiver) {
        if (
          balanceChange.magnitude === amount.toString() &&
          balanceChange.sgn === "Positive"
        ) {
          receiverVerified = true;
        }
      }
    }
  });

  return senderVerified && receiverVerified;
}

/**
 * get accoutUpdate count to calc zk tx fee
 * @param {*} zkappCommand
 * @returns
 */
export function getAccountUpdateCount(zkappCommand) {
  let nextZkCommand = JSON.parse(zkappCommand);
  let accountUpdates = nextZkCommand.accountUpdates;
  return accountUpdates.length;
}
export function getZkAppUpdateInfo(accountUpdates, publicKey, tokenId) {
  try {
    if (!Array.isArray(accountUpdates)) {
      return 0;
    }
    let totalBalanceChange = "0";
    let updateList = [];
    let otherList = [];
    accountUpdates.forEach((update) => {
      const { body } = update;
      if (body.tokenId === tokenId) {
        const magnitude = new BigNumber(body.balanceChange.magnitude)
          .abs()
          .toString();
        if (body.publicKey === publicKey) {
          if (body.balanceChange.sgn === "Negative") {
            totalBalanceChange = new BigNumber(totalBalanceChange)
              .minus(magnitude)
              .toString();
          } else if (body.balanceChange.sgn === "Positive") {
            totalBalanceChange = new BigNumber(totalBalanceChange)
              .plus(magnitude)
              .toString();
          }
        } else {
          updateList.push({
            address: body.publicKey,
            amount: magnitude,
          });
        }
      }
      if (body.publicKey !== publicKey) {
        otherList.push(body.publicKey);
      }
    });
    if (updateList.length !== 0) {
      updateList.sort((a, b) => b.amount - a.amount);
    }

    let symbol = "";
    let from = "";
    let to = "";
    if (totalBalanceChange > 0) {
      symbol = "+";

      from = updateList.length > 0 ? updateList[0].address : otherList[0];
      to = publicKey;
    } else if (totalBalanceChange < 0) {
      symbol = "-";
      totalBalanceChange = new BigNumber(totalBalanceChange).abs().toString();
      from = publicKey;
      to = updateList.length > 0 ? updateList[0].address : otherList[0];
    }
    return {
      totalBalanceChange,
      symbol,
      updateCount: accountUpdates.length,
      from, //
      to,
    };
  } catch (error) {
    return {
      totalBalanceChange: 0,
      symbol: "",
      updateCount: "-",
      from: "-",
      to: "-",
    };
  }
}