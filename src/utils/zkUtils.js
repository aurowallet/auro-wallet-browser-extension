import { AccountUpdate } from "../constant/zkAccountUpdateDoc";

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
