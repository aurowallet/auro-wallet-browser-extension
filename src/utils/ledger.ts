import { MinaApp } from "@zondax/ledger-mina-js";
import { LedgerError } from "@zondax/ledger-js";
import BigNumber from "bignumber.js";
import i18n from "i18next";
import { MAIN_COIN_CONFIG } from "../constant";
import { LEDGER_STATUS, LedgerStatusType } from "../constant/commonType";
import { NetworkID_MAP } from "../constant/network";
import { getCurrentNodeConfig } from "./browserUtils";
import {
  LedgerConnectionManager,
  type LedgerDiagnostics,
  type LedgerResponseInfo,
} from "./ledgerConnection";
import type { LedgerTransportMode } from "./ledgerTransport";
import { isZekoNet } from "./utils";
import {
  applyLedgerZkAppSignature,
  fieldElementToLedgerBytes,
  getLedgerSignedZkApp,
  LedgerSignedZkApp,
  LedgerZkAppBody,
  ledgerSignatureToBase58,
  prepareLedgerZkApp,
} from "./ledgerZkApp";
export type { LedgerDiagnostics } from "./ledgerConnection";

// ============ Constants ============

const Networks = { MAINNET: 0x01, DEVNET: 0x00 } as const;
const TxType = { PAYMENT: 0x00, DELEGATION: 0x04 } as const;

// Web Locks requires a stable name so extension pages share one APDU queue.
// This is an internal browser resource name, not a Ledger protocol value.
const LEDGER_DEVICE_LOCK_NAME = "aurowallet-ledger-device";

function stringifyLedgerError(error: unknown): string {
  try {
    const serialized = JSON.stringify(error, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value
    );
    if (serialized && serialized !== "{}") return serialized;
  } catch {
    // Fall through to the native string representation for circular values.
  }

  return String(error);
}

function normalizeLedgerReturnCode(
  returnCode?: string | number | null
): number | undefined {
  if (typeof returnCode === "number") {
    return Number.isFinite(returnCode) ? returnCode : undefined;
  }
  if (typeof returnCode !== "string" || !returnCode.trim()) return undefined;

  const value = returnCode.trim();
  if (/^0x[\da-f]+$/i.test(value)) return Number.parseInt(value.slice(2), 16);

  const decimal = Number(value);
  if (
    Number.isInteger(decimal) &&
    (decimal < 0 || LedgerError[decimal] !== undefined)
  ) {
    return decimal;
  }

  if (/^[\da-f]+$/i.test(value)) {
    const hexadecimal = Number.parseInt(value, 16);
    if (LedgerError[hexadecimal] !== undefined) return hexadecimal;
  }

  return Number.isInteger(decimal) ? decimal : undefined;
}

interface LedgerResponseOptions {
  detectUnsupported?: boolean;
}

function resolveLedgerResponse(
  response: unknown,
  options: LedgerResponseOptions = {}
): LedgerResponseInfo {
  const value =
    response && typeof response === "object"
      ? (response as {
          name?: string;
          id?: string;
          statusCode?: string | number;
          returnCode?: string | number;
          return_code?: string | number;
          message?: unknown;
          errorMessage?: unknown;
          statusText?: unknown;
        })
      : undefined;
  const returnCode = normalizeLedgerReturnCode(
    value?.returnCode ??
      value?.return_code ??
      value?.statusCode ??
      (typeof response === "string" || typeof response === "number"
        ? response
        : undefined)
  );
  const hasCode = (...codes: LedgerError[]) =>
    returnCode !== undefined && codes.includes(returnCode);
  const conditionsNotSatisfied = hasCode(
    LedgerError.ConditionsOfUseNotSatisfied
  );
  let returnedMessage: string | null = null;
  if (value) {
    for (const message of [value.message, value.errorMessage, value.statusText]) {
      if (typeof message === "string" && message.trim()) {
        returnedMessage = message.trim();
        break;
      }
    }
  }
  // Mina App versions may report a user rejection as either 0x6986 or
  // 0x6985 (ConditionsOfUseNotSatisfied). Classification is code-based;
  // returned messages are used only for display.
  const rejected =
    hasCode(LedgerError.TransactionRejected, LedgerError.UserRefusedOnDevice) ||
    conditionsNotSatisfied;
  const transportBusy =
    value?.id === "TransportLocked" ||
    value?.name === "TransportRaceCondition";
  const appNotOpen = hasCode(LedgerError.AppDoesNotSeemToBeOpen);
  const busy =
    !rejected &&
    (transportBusy ||
      conditionsNotSatisfied ||
      hasCode(LedgerError.LockedDevice, LedgerError.DeviceIsBusy));
  const unsupported =
    !!options.detectUnsupported &&
    hasCode(
      LedgerError.InstructionNotSupported,
      LedgerError.UnknownApdu,
      LedgerError.ClaNotSupported
    );
  let message = returnedMessage || stringifyLedgerError(response);
  if (rejected) message = i18n.t("ledgerRejected");
  if (busy && !returnedMessage) message = i18n.t("ledgerBusyTip");
  if (unsupported) message = i18n.t("ledgerZkAppUpdateRequired");

  return {
    success: hasCode(LedgerError.NoErrors),
    rejected,
    busy,
    appNotOpen,
    message,
  };
}

function toLedgerFailure(info: LedgerResponseInfo): {
  rejected?: boolean;
  error: { message: string };
} {
  return {
    rejected: info.rejected || undefined,
    error: { message: info.message },
  };
}

function normalizeLedgerTransactionSignature(signature: string): string {
  const normalized = String(signature || "").replace(/^0x/i, "");
  if (!/^[0-9a-f]+$/i.test(normalized) || normalized.length !== 128) {
    throw new Error("Ledger payment signature must contain exactly 64 bytes");
  }
  const reverseBytes = (part: string): string =>
    part.match(/.{2}/g)!.reverse().join("");
  return reverseBytes(normalized.slice(0, 64)) + reverseBytes(normalized.slice(64));
}

// ============ Types ============

interface TransactionBody {
  fromAddress: string;
  toAddress?: string;
  receiverAddress?: string;
  amount?: string | number;
  fee: string | number;
  nonce: string | number;
  memo?: string;
}

interface SignResult {
  rejected?: boolean;
  signature?: string | { field: string; scalar: string } | null;
  payload?: {
    fee: number;
    from: string;
    to: string;
    nonce: number;
    amount: number;
    memo: string;
    validUntil: number;
  };
  error?: { message: string };
  signedMessage?: string;
  signedZkApp?: LedgerSignedZkApp;
}

interface AddressResult {
  rejected?: boolean;
  publicKey?: string;
  error?: { message: string };
}

interface AccountVerificationResult {
  verified: boolean;
  rejected?: boolean;
  error?: { message: string };
}

type AwaitDeviceCallback = () => void;

// ============ LedgerManager Class ============

export class LedgerManager {
  private readonly connection: LedgerConnectionManager;
  private ledgerOperationDepth = 0;
  private ledgerOperationIdleResolvers: Array<() => void> = [];

  constructor(options: { autoConnect?: boolean } = {}) {
    this.connection = new LedgerConnectionManager({
      autoConnect: options.autoConnect,
      withDeviceLock: (task) => this._withDeviceLock(task),
      isDeviceLockHeld: () => this._isDeviceLockHeld(),
      waitForActiveLedgerOperations: () => this._waitForActiveLedgerOperations(),
      resolveResponse: (response) => resolveLedgerResponse(response),
    });
  }

  get app(): MinaApp | null {
    return this.connection.app;
  }

  get status(): LedgerStatusType {
    return this.connection.status;
  }

  private _resolveLedgerResponse(
    response: unknown,
    options?: LedgerResponseOptions
  ): LedgerResponseInfo {
    const info = resolveLedgerResponse(response, options);
    this.connection.applyResponseInfo(info);
    return info;
  }

  private async _withDeviceLock<T>(
    task: () => Promise<T>
  ): Promise<T> {
    const lockManager =
      typeof navigator !== "undefined" ? navigator.locks : undefined;
    if (!lockManager) return task();

    return lockManager.request(
      LEDGER_DEVICE_LOCK_NAME,
      { mode: "exclusive" },
      task
    );
  }

  private async _isDeviceLockHeld(): Promise<boolean> {
    const lockManager =
      typeof navigator !== "undefined" ? navigator.locks : undefined;
    if (!lockManager) return false;
    try {
      const snapshot = await lockManager.query();
      return !!snapshot.held?.some(
        (lock) => lock.name === LEDGER_DEVICE_LOCK_NAME
      );
    } catch {
      return false;
    }
  }

  async _tryConnectFromExisting() {
    return this.connection.tryConnectFromExisting();
  }

  async requestConnect() {
    return this.connection.requestConnect();
  }

  async ensureConnect() {
    return this._withLedgerOperation(() => this.connection.ensureConnect());
  }

  addStatusListener(listener: (status: LedgerStatusType) => void): void {
    this.connection.addStatusListener(listener);
  }

  removeStatusListener(listener: (status: LedgerStatusType) => void): void {
    this.connection.removeStatusListener(listener);
  }

  getDiagnostics(): LedgerDiagnostics {
    return this.connection.getDiagnostics();
  }

  getLastErrorMessage(): string | null {
    return this.connection.getLastErrorMessage();
  }

  getTransportMode(): LedgerTransportMode {
    return this.connection.getTransportMode();
  }

  async getStoredTransportMode(): Promise<LedgerTransportMode> {
    return this.connection.getStoredTransportMode();
  }

  async setTransportMode(mode: LedgerTransportMode): Promise<void> {
    return this.connection.setTransportMode(mode, this.ledgerOperationDepth > 0);
  }

  private async _withLedgerOperation<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    if (this.connection.isTransitioning) {
      throw new Error("Ledger transport is switching");
    }
    this.ledgerOperationDepth += 1;
    try {
      return await operation();
    } finally {
      this.ledgerOperationDepth -= 1;
      if (this.ledgerOperationDepth === 0) {
        const resolvers = this.ledgerOperationIdleResolvers;
        this.ledgerOperationIdleResolvers = [];
        resolvers.forEach((resolve) => resolve());
      }
    }
  }

  private _waitForActiveLedgerOperations(): Promise<void> {
    if (this.ledgerOperationDepth === 0) return Promise.resolve();
    return new Promise((resolve) => {
      this.ledgerOperationIdleResolvers.push(resolve);
    });
  }

  private async _verifySigningAccount(
    expectedAddress: string,
    accountIndex: number
  ): Promise<AccountVerificationResult> {
    // Field-element APDUs do not contain a sender address, so zkApp signing
    // must bind the requested account to the Ledger-derived public key first.
    if (!expectedAddress) {
      return {
        verified: false,
        error: { message: i18n.t("buildFailed") },
      };
    }

    const response = await this._withDeviceLock(() =>
      this.app!.getAddress(accountIndex, false)
    );
    const info = this._resolveLedgerResponse(response);
    const addressMatches =
      !!response.publicKey && response.publicKey === expectedAddress;

    if (!info.success || !response.publicKey) {
      return {
        verified: false,
        ...toLedgerFailure(info),
      };
    }
    if (!addressMatches) {
      return {
        verified: false,
        error: { message: i18n.t("ledgerAccountMismatch") },
      };
    }

    this.connection.updateStatus(LEDGER_STATUS.READY);
    return { verified: true };
  }

  async getAddress(
    accountIndex: number = 0,
    showOnDevice: boolean = true
  ): Promise<AddressResult> {
    return this._withLedgerOperation(async () => {
      const connection = await this.ensureConnect();
      if (this.status !== LEDGER_STATUS.READY) {
        return {
          error: {
            message: resolveLedgerResponse({ status: connection.status }).message,
          },
        };
      }

      try {
        const resp = await this._withDeviceLock(() =>
          this.app!.getAddress(accountIndex, showOnDevice)
        );
        const info = this._resolveLedgerResponse(resp);
        if (!info.success || !resp.publicKey) {
          return toLedgerFailure(info);
        }
        return { publicKey: resp.publicKey || undefined };
      } catch (error) {
        const info = this._resolveLedgerResponse(error);
        return toLedgerFailure(info);
      }
    });
  }

  async _sign(
    body: TransactionBody,
    type: number,
    accountIndex: number,
    onAwaitDevice?: AwaitDeviceCallback
  ): Promise<SignResult | undefined> {
    return this._withLedgerOperation(async () => {
      await this.ensureConnect();
      if (this.status !== LEDGER_STATUS.READY) {
        return;
      }
      const cfg = await getCurrentNodeConfig();
      if (isZekoNet(cfg.networkID)) {
        return { signature: null, error: { message: i18n.t("notSupportNow") } };
      }

      const networkId = await this._getNetworkId();
      const decimal = new BigNumber(10).pow(MAIN_COIN_CONFIG.decimals);

      const amountNano = new BigNumber(body.amount || 0).multipliedBy(decimal);
      const feeNano = new BigNumber(body.fee).multipliedBy(decimal);

      const payload = {
        txType: type,
        senderAccount: accountIndex,
        senderAddress: body.fromAddress,
        receiverAddress: body.toAddress || body.receiverAddress || "",
        amount: amountNano.toNumber(),
        fee: feeNano.toNumber(),
        nonce: +body.nonce,
        memo: body.memo || "",
        networkId,
        validUntil: 4294967295,
      };

      try {
        const { signature, returnCode, statusText, message } =
          (await this._withDeviceLock(() => {
            onAwaitDevice?.();
            return this.app!.signTransaction(payload);
          })) as {
            signature: string;
            returnCode: string | number;
            statusText?: string;
            message?: string;
          };

        const info = this._resolveLedgerResponse({
          returnCode,
          statusText,
          message,
        });
        if (!info.success) {
          return {
            signature: null,
            ...toLedgerFailure(info),
          };
        }
        return {
          signature:
            normalizeLedgerTransactionSignature(signature),
          payload: {
            fee: payload.fee,
            from: payload.senderAddress,
            to: payload.receiverAddress,
            nonce: payload.nonce,
            amount: payload.amount,
            memo: payload.memo,
            validUntil: payload.validUntil,
          },
        };
      } catch (error) {
        const info = this._resolveLedgerResponse(error);
        return { signature: null, ...toLedgerFailure(info) };
      }
    });
  }

  async signPayment(
    body: TransactionBody,
    accountIndex: number = 0,
    onAwaitDevice?: AwaitDeviceCallback
  ): Promise<SignResult | undefined> {
    return this._sign(body, TxType.PAYMENT, accountIndex, onAwaitDevice);
  }

  async signDelegation(
    body: TransactionBody,
    accountIndex: number = 0,
    onAwaitDevice?: AwaitDeviceCallback
  ): Promise<SignResult | undefined> {
    return this._sign(body, TxType.DELEGATION, accountIndex, onAwaitDevice);
  }

  async signMessage(
    message: string,
    accountIndex: number = 0,
    onAwaitDevice?: AwaitDeviceCallback
  ): Promise<SignResult | undefined> {
    return this._withLedgerOperation(async () => {
      await this.ensureConnect();
      if (this.status !== LEDGER_STATUS.READY) {
        return;
      }

      const cfg = await getCurrentNodeConfig();
      if (isZekoNet(cfg.networkID)) {
        return { signature: null, error: { message: i18n.t("notSupportNow") } };
      }

      const networkId = await this._getNetworkId();

      try {
        const resp = (await this._withDeviceLock(() => {
          onAwaitDevice?.();
          return this.app!.signMessage(accountIndex, networkId, message);
        })) as {
          returnCode?: string | number;
          return_code?: string | number;
          statusText?: string;
          message?: string;
          field?: string;
          scalar?: string;
          signed_message?: string;
        };

        const info = this._resolveLedgerResponse(resp);
        if (!info.success) {
          return {
            signature: null,
            ...toLedgerFailure(info),
          };
        }
        return {
          signature: {
            field: resp.field || "",
            scalar: resp.scalar || "",
          },
          signedMessage: resp.signed_message,
        };
      } catch (err) {
        const info = this._resolveLedgerResponse(err);
        return {
          signature: null,
          ...toLedgerFailure(info),
        };
      }
    });
  }

  async signZkApp(
    body: LedgerZkAppBody,
    accountIndex: number = 0,
    onAwaitDevice?: AwaitDeviceCallback
  ): Promise<SignResult | undefined> {
    return this._withLedgerOperation(async () => {
      await this.ensureConnect();
      if (this.status !== LEDGER_STATUS.READY) {
        return;
      }

      const cfg = await getCurrentNodeConfig();
      if (isZekoNet(cfg.networkID)) {
        return { signature: null, error: { message: i18n.t("notSupportNow") } };
      }

      try {
        const verification = await this._verifySigningAccount(
          body.fromAddress,
          accountIndex
        );
        if (!verification.verified) {
          return {
            rejected: verification.rejected,
            signature: null,
            error: verification.error,
          };
        }

        const prepared = await prepareLedgerZkApp(body, cfg.networkID);
        const networkId = await this._getNetworkId();

        for (const request of prepared.signingRequests) {
          const resp = await this._withDeviceLock(() => {
            onAwaitDevice?.();
            return this.app!.signFieldElement(
              accountIndex,
              networkId,
              fieldElementToLedgerBytes(request.fieldElement)
            );
          });
          const info = this._resolveLedgerResponse(resp, {
            detectUnsupported: true,
          });
          if (!info.success || !resp.field || !resp.scalar) {
            return {
              signature: null,
              ...toLedgerFailure(info),
            };
          }

          applyLedgerZkAppSignature(
            prepared,
            request,
            ledgerSignatureToBase58(resp.field, resp.scalar)
          );
        }
        return { signedZkApp: getLedgerSignedZkApp(prepared) };
      } catch (err) {
        const info = this._resolveLedgerResponse(err, {
          detectUnsupported: true,
        });
        return {
          signature: null,
          ...toLedgerFailure(info),
        };
      }
    });
  }

  async _getNetworkId(): Promise<number> {
    const cfg = await getCurrentNodeConfig();
    return cfg.networkID === NetworkID_MAP.mainnet
      ? Networks.MAINNET
      : Networks.DEVNET;
  }

  async destroy(): Promise<void> {
    await this.connection.destroy();
  }
}

export default new LedgerManager({ autoConnect: false });
