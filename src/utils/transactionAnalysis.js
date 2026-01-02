import BigNumber from "bignumber.js";
import {
  MAIN_COIN_CONFIG,
  ZK_DEFAULT_TOKEN_ID,
  ZK_EMPTY_PUBLICKEY,
} from "@/constant";
import { amountDecimals } from "./utils";

/**
 * Risk levels for transaction analysis
 */
export const RISK_LEVEL = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

/**
 * Risk types that can be detected in zkApp transactions
 */
export const RISK_TYPES = {
  CONVERT_TO_ZKAPP: "convertToZkApp",
  PERMISSIONS_CHANGE: "permissionsChange",
  PERMISSIONS_LOCKED: "permissionsLocked",
  DELEGATE_CHANGE: "delegateChange",
  TIMING_CHANGE: "timingChange",
  LARGE_OUTFLOW: "largeOutflow",
  UNKNOWN_TOKEN: "unknownToken",
  VERIFICATION_KEY_CHANGE: "verificationKeyChange",
  ACCESS_IMPOSSIBLE: "accessImpossible",
  SEND_IMPOSSIBLE: "sendImpossible",
  RECEIVE_IMPOSSIBLE: "receiveImpossible",
};

/**
 * Check if a value is set (not null/undefined and not default)
 * Handles both direct values and Mina's flaggedOption format { isSome: boolean, value: ... }
 */
function isValueSet(value) {
  if (value === null || value === undefined) {
    return false;
  }
  // Handle Mina's flaggedOption format
  if (typeof value === "object") {
    // If it has isSome property, check its value
    if ("isSome" in value) {
      return value.isSome === true;
    }
  }
  return true;
}

/**
 * Get the actual value from a flaggedOption or direct value
 */
function getOptionValue(value) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "object" && "isSome" in value) {
    return value.isSome ? value.value : null;
  }
  return value;
}

/**
 * Check if permission is set to "Impossible"
 */
function isPermissionImpossible(permission) {
  if (!permission) return false;
  if (typeof permission === "string") {
    return permission.toLowerCase() === "impossible";
  }
  if (typeof permission === "object") {
    return (
      permission.constant === true ||
      permission.signatureNecessary === false ||
      permission.signatureSufficient === false
    );
  }
  return false;
}

/**
 * Analyze a single account update for risks
 * @param {Object} accountUpdate - The account update object
 * @param {string} currentAddress - The current user's address
 * @returns {Array} Array of risk objects
 */
function analyzeAccountUpdateRisks(accountUpdate, currentAddress) {
  const risks = [];
  const body = accountUpdate.body;

  if (!body) return risks;

  const isCurrentAccount =
    body.publicKey?.toLowerCase() === currentAddress?.toLowerCase();

  // Check for verification key change (converting to zkApp)
  // Only show risk if it affects the current account
  if (isValueSet(body.update?.verificationKey) && isCurrentAccount) {
    const vkValue = getOptionValue(body.update.verificationKey);
    risks.push({
      type: RISK_TYPES.CONVERT_TO_ZKAPP,
      level: RISK_LEVEL.HIGH,
      address: body.publicKey,
      isCurrentAccount,
      details: {
        verificationKeyHash: vkValue?.hash || body.update.verificationKey?.hash,
      },
    });
  }

  // Check for permissions changes
  if (isValueSet(body.update?.permissions)) {
    const permissions = getOptionValue(body.update.permissions) || body.update.permissions;
    const permissionRisks = [];

    // Check for dangerous permission settings (Impossible permissions)
    // These are shown for ALL accounts since they are extreme/irreversible
    if (isPermissionImpossible(permissions.access)) {
      permissionRisks.push({
        type: RISK_TYPES.ACCESS_IMPOSSIBLE,
        level: RISK_LEVEL.HIGH,
        permission: "access",
      });
    }
    if (isPermissionImpossible(permissions.send)) {
      permissionRisks.push({
        type: RISK_TYPES.SEND_IMPOSSIBLE,
        level: RISK_LEVEL.HIGH,
        permission: "send",
      });
    }
    if (isPermissionImpossible(permissions.receive)) {
      permissionRisks.push({
        type: RISK_TYPES.RECEIVE_IMPOSSIBLE,
        level: RISK_LEVEL.HIGH,
        permission: "receive",
      });
    }
    if (isPermissionImpossible(permissions.setPermissions)) {
      permissionRisks.push({
        type: RISK_TYPES.PERMISSIONS_LOCKED,
        level: RISK_LEVEL.HIGH,
        permission: "setPermissions",
      });
    }

    // For "Impossible" permissions - show warning for ALL accounts (irreversible)
    // For regular permissions changes - only show for current account
    if (permissionRisks.length > 0) {
      // Always show dangerous "Impossible" permissions for any account
      risks.push({
        type: RISK_TYPES.PERMISSIONS_CHANGE,
        level: RISK_LEVEL.HIGH,
        address: body.publicKey,
        isCurrentAccount,
        details: {
          permissions: permissions,
          dangerousPermissions: permissionRisks,
        },
      });
    } else if (isCurrentAccount) {
      // Regular permissions changes only shown for current account
      risks.push({
        type: RISK_TYPES.PERMISSIONS_CHANGE,
        level: RISK_LEVEL.MEDIUM,
        address: body.publicKey,
        isCurrentAccount,
        details: {
          permissions: permissions,
        },
      });
    }
  }

  // Check for delegate changes - only for current account
  if (isValueSet(body.update?.delegate) && isCurrentAccount) {
    const delegateValue = getOptionValue(body.update.delegate) || body.update.delegate;
    risks.push({
      type: RISK_TYPES.DELEGATE_CHANGE,
      level: RISK_LEVEL.MEDIUM,
      address: body.publicKey,
      isCurrentAccount,
      details: {
        newDelegate: delegateValue,
      },
    });
  }

  // Check for timing/vesting changes - only for current account
  if (isValueSet(body.update?.timing) && isCurrentAccount) {
    const timingValue = getOptionValue(body.update.timing) || body.update.timing;
    risks.push({
      type: RISK_TYPES.TIMING_CHANGE,
      level: RISK_LEVEL.HIGH,
      address: body.publicKey,
      isCurrentAccount,
      details: {
        timing: timingValue,
      },
    });
  }

  return risks;
}

/**
 * Analyze zkApp transaction for risks
 * @param {string|Object} zkappCommand - The zkApp command (string or object)
 * @param {string} currentAddress - The current user's address
 * @returns {Object} Analysis result with risks array and summary
 */
export function analyzeTransactionRisks(zkappCommand, currentAddress) {
  try {
    const command =
      typeof zkappCommand === "string"
        ? JSON.parse(zkappCommand)
        : zkappCommand;

    const risks = [];
    const accountUpdates = command.accountUpdates || [];

    // Analyze each account update
    accountUpdates.forEach((update, index) => {
      const updateRisks = analyzeAccountUpdateRisks(update, currentAddress);
      updateRisks.forEach((risk) => {
        risk.accountUpdateIndex = index;
        risks.push(risk);
      });
    });

    // Calculate risk summary
    const highRisks = risks.filter((r) => r.level === RISK_LEVEL.HIGH);
    const mediumRisks = risks.filter((r) => r.level === RISK_LEVEL.MEDIUM);
    const currentAccountRisks = risks.filter((r) => r.isCurrentAccount);

    let overallLevel = RISK_LEVEL.LOW;
    if (highRisks.length > 0) {
      overallLevel = RISK_LEVEL.HIGH;
    } else if (mediumRisks.length > 0) {
      overallLevel = RISK_LEVEL.MEDIUM;
    }

    return {
      risks,
      summary: {
        totalRisks: risks.length,
        highRiskCount: highRisks.length,
        mediumRiskCount: mediumRisks.length,
        currentAccountRiskCount: currentAccountRisks.length,
        overallLevel,
        hasCurrentAccountRisks: currentAccountRisks.length > 0,
      },
    };
  } catch (error) {
    return {
      risks: [],
      summary: {
        totalRisks: 0,
        highRiskCount: 0,
        mediumRiskCount: 0,
        currentAccountRiskCount: 0,
        overallLevel: RISK_LEVEL.LOW,
        hasCurrentAccountRisks: false,
      },
      error: error.message,
    };
  }
}

/**
 * Calculate token flow for a zkApp transaction
 * @param {string|Object} zkappCommand - The zkApp command (string or object)
 * @param {string} currentAddress - The current user's address
 * @returns {Object} Token flow summary
 */
export function calculateTokenFlow(zkappCommand, currentAddress) {
  try {
    const command =
      typeof zkappCommand === "string"
        ? JSON.parse(zkappCommand)
        : zkappCommand;

    const accountUpdates = command.accountUpdates || [];
    const feePayer = command.feePayer;

    // Token flow by tokenId
    const tokenFlows = {};

    // Process each account update
    accountUpdates.forEach((update) => {
      const body = update.body;
      if (!body) return;

      const publicKey = body.publicKey;
      const tokenId = body.tokenId || ZK_DEFAULT_TOKEN_ID;
      const balanceChange = body.balanceChange;

      if (!balanceChange) return;

      const magnitude = new BigNumber(balanceChange.magnitude || "0");
      if (magnitude.isZero()) return;

      const isNegative =
        balanceChange.sgn?.toLowerCase() === "negative" ||
        balanceChange.sgn === "Negative";
      const amount = isNegative ? magnitude.negated() : magnitude;

      // Initialize token flow entry
      if (!tokenFlows[tokenId]) {
        const isMainToken = tokenId === ZK_DEFAULT_TOKEN_ID;
        tokenFlows[tokenId] = {
          tokenId,
          symbol: isMainToken
            ? MAIN_COIN_CONFIG.symbol
            : body.update?.tokenSymbol || "UNKNOWN",
          isMainToken,
          decimals: MAIN_COIN_CONFIG.decimals,
          currentAccountReceive: new BigNumber(0),
          currentAccountSend: new BigNumber(0),
          otherAccountsReceive: [],
          otherAccountsSend: [],
        };
      }

      const isCurrentAccount =
        publicKey?.toLowerCase() === currentAddress?.toLowerCase();

      if (isCurrentAccount) {
        if (amount.isGreaterThan(0)) {
          tokenFlows[tokenId].currentAccountReceive =
            tokenFlows[tokenId].currentAccountReceive.plus(amount);
        } else if (amount.isLessThan(0)) {
          tokenFlows[tokenId].currentAccountSend =
            tokenFlows[tokenId].currentAccountSend.plus(amount.abs());
        }
      } else {
        if (amount.isGreaterThan(0)) {
          tokenFlows[tokenId].otherAccountsReceive.push({
            address: publicKey,
            amount: amount.toString(),
          });
        } else if (amount.isLessThan(0)) {
          tokenFlows[tokenId].otherAccountsSend.push({
            address: publicKey,
            amount: amount.abs().toString(),
          });
        }
      }
    });

    // Calculate fee (from feePayer)
    let feeAmount = new BigNumber(0);
    let feePayerAddress = currentAddress;
    if (feePayer?.body) {
      const feePayerKey = feePayer.body.publicKey;
      if (
        feePayerKey &&
        feePayerKey.toLowerCase() !== ZK_EMPTY_PUBLICKEY.toLowerCase()
      ) {
        feePayerAddress = feePayerKey;
      }
      if (feePayer.body.fee) {
        feeAmount = new BigNumber(feePayer.body.fee);
      }
    }

    // Add fee to MINA outflow if feePayer is current account
    const isCurrentAccountFeePayer =
      feePayerAddress?.toLowerCase() === currentAddress?.toLowerCase();
    if (isCurrentAccountFeePayer && feeAmount.isGreaterThan(0)) {
      if (!tokenFlows[ZK_DEFAULT_TOKEN_ID]) {
        tokenFlows[ZK_DEFAULT_TOKEN_ID] = {
          tokenId: ZK_DEFAULT_TOKEN_ID,
          symbol: MAIN_COIN_CONFIG.symbol,
          isMainToken: true,
          decimals: MAIN_COIN_CONFIG.decimals,
          currentAccountReceive: new BigNumber(0),
          currentAccountSend: new BigNumber(0),
          otherAccountsReceive: [],
          otherAccountsSend: [],
        };
      }
      tokenFlows[ZK_DEFAULT_TOKEN_ID].fee = feeAmount.toString();
    }

    // Convert to final format with human-readable amounts
    const result = {
      flows: [],
      summary: {
        totalReceive: {},
        totalSend: {},
        netFlow: {},
      },
    };

    Object.values(tokenFlows).forEach((flow) => {
      const decimals = flow.decimals;
      const receiveRaw = flow.currentAccountReceive;
      const sendRaw = flow.currentAccountSend;
      const feeRaw = flow.fee ? new BigNumber(flow.fee) : new BigNumber(0);
      const netRaw = receiveRaw.minus(sendRaw).minus(feeRaw);

      // Calculate total from other accounts
      const otherReceiveTotal = flow.otherAccountsReceive.reduce(
        (sum, item) => sum.plus(new BigNumber(item.amount)),
        new BigNumber(0)
      );
      const otherSendTotal = flow.otherAccountsSend.reduce(
        (sum, item) => sum.plus(new BigNumber(item.amount)),
        new BigNumber(0)
      );

      const flowEntry = {
        tokenId: flow.tokenId,
        symbol: flow.symbol,
        isMainToken: flow.isMainToken,
        receive: {
          raw: receiveRaw.toString(),
          formatted: amountDecimals(receiveRaw.toString(), decimals),
        },
        send: {
          raw: sendRaw.toString(),
          formatted: amountDecimals(sendRaw.toString(), decimals),
        },
        net: {
          raw: netRaw.toString(),
          formatted: amountDecimals(netRaw.abs().toString(), decimals),
          isPositive: netRaw.isGreaterThanOrEqualTo(0),
          symbol: netRaw.isGreaterThanOrEqualTo(0) ? "+" : "-",
        },
        otherAccountsReceive: flow.otherAccountsReceive.map((item) => ({
          ...item,
          formatted: amountDecimals(item.amount, decimals),
        })),
        otherAccountsSend: flow.otherAccountsSend.map((item) => ({
          ...item,
          formatted: amountDecimals(item.amount, decimals),
        })),
        otherReceiveTotal: {
          raw: otherReceiveTotal.toString(),
          formatted: amountDecimals(otherReceiveTotal.toString(), decimals),
        },
        otherSendTotal: {
          raw: otherSendTotal.toString(),
          formatted: amountDecimals(otherSendTotal.toString(), decimals),
        },
        // Check if current account has any direct involvement
        hasCurrentAccountFlow:
          !receiveRaw.isZero() || !sendRaw.isZero() || !feeRaw.isZero(),
        // Check if there are transfers between other accounts
        hasOtherAccountsFlow:
          flow.otherAccountsReceive.length > 0 ||
          flow.otherAccountsSend.length > 0,
      };

      if (flow.fee) {
        flowEntry.fee = {
          raw: flow.fee,
          formatted: amountDecimals(flow.fee, decimals),
        };
      }

      result.flows.push(flowEntry);

      // Update summary
      result.summary.totalReceive[flow.symbol] = flowEntry.receive.formatted;
      result.summary.totalSend[flow.symbol] = flowEntry.send.formatted;
      result.summary.netFlow[flow.symbol] =
        flowEntry.net.symbol + flowEntry.net.formatted;
    });

    return result;
  } catch (error) {
    return {
      flows: [],
      summary: {
        totalReceive: {},
        totalSend: {},
        netFlow: {},
      },
      error: error.message,
    };
  }
}

/**
 * Comprehensive transaction analysis combining risks and token flows
 * @param {string|Object} zkappCommand - The zkApp command
 * @param {string} currentAddress - The current user's address
 * @returns {Object} Complete analysis result
 */
export function analyzeTransaction(zkappCommand, currentAddress) {
  const riskAnalysis = analyzeTransactionRisks(zkappCommand, currentAddress);
  const tokenFlow = calculateTokenFlow(zkappCommand, currentAddress);

  return {
    risks: riskAnalysis,
    tokenFlow: tokenFlow,
    hasRisks: riskAnalysis.summary.totalRisks > 0,
    hasHighRisks: riskAnalysis.summary.highRiskCount > 0,
  };
}

/**
 * Get risk description key for i18n
 * @param {string} riskType - The risk type
 * @returns {string} i18n key for the risk description
 */
export function getRiskDescriptionKey(riskType) {
  const keyMap = {
    [RISK_TYPES.CONVERT_TO_ZKAPP]: "riskConvertToZkApp",
    [RISK_TYPES.PERMISSIONS_CHANGE]: "riskPermissionsChange",
    [RISK_TYPES.PERMISSIONS_LOCKED]: "riskPermissionsLocked",
    [RISK_TYPES.DELEGATE_CHANGE]: "riskDelegateChange",
    [RISK_TYPES.TIMING_CHANGE]: "riskTimingChange",
    [RISK_TYPES.LARGE_OUTFLOW]: "riskLargeOutflow",
    [RISK_TYPES.UNKNOWN_TOKEN]: "riskUnknownToken",
    [RISK_TYPES.VERIFICATION_KEY_CHANGE]: "riskVerificationKeyChange",
    [RISK_TYPES.ACCESS_IMPOSSIBLE]: "riskAccessImpossible",
    [RISK_TYPES.SEND_IMPOSSIBLE]: "riskSendImpossible",
    [RISK_TYPES.RECEIVE_IMPOSSIBLE]: "riskReceiveImpossible",
  };
  return keyMap[riskType] || "riskUnknown";
}

/**
 * Get specific risk detail for display
 * @param {Object} risk - The risk object
 * @returns {Object} Specific details for the risk
 */
export function getRiskSpecificDetails(risk) {
  const details = {
    type: risk.type,
    level: risk.level,
    affectedPermissions: [],
    changedPermissions: [],
  };

  if (risk.details?.dangerousPermissions) {
    // Extract Impossible permissions
    details.affectedPermissions = risk.details.dangerousPermissions.map(
      (p) => p.permission
    );
  }

  if (risk.details?.permissions) {
    // Extract all changed permissions
    const perms = risk.details.permissions;
    const permKeys = [
      "editState",
      "access",
      "send",
      "receive",
      "setDelegate",
      "setPermissions",
      "setVerificationKey",
      "setZkappUri",
      "editActionState",
      "setTokenSymbol",
      "incrementNonce",
      "setVotingFor",
      "setTiming",
    ];
    permKeys.forEach((key) => {
      if (perms[key] !== null && perms[key] !== undefined) {
        const value =
          typeof perms[key] === "object" ? perms[key].auth : perms[key];
        details.changedPermissions.push({ key, value });
      }
    });
  }

  if (risk.details?.newDelegate) {
    details.newDelegate = risk.details.newDelegate;
  }

  if (risk.details?.timing) {
    details.timing = risk.details.timing;
  }

  if (risk.details?.verificationKeyHash) {
    details.verificationKeyHash = risk.details.verificationKeyHash;
  }

  return details;
}
