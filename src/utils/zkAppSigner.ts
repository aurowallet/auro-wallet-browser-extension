export type SignerEra = "berkeley";

function getAccountUpdateBody(accountUpdate: unknown): Record<string, unknown> | null {
  if (!accountUpdate || typeof accountUpdate !== "object") return null;
  const body = (accountUpdate as { body?: unknown }).body;
  if (!body || typeof body !== "object") return null;
  return body as Record<string, unknown>;
}

function getUpdateAppStateLength(body: Record<string, unknown>): number | null {
  const update = body.update;
  if (!update || typeof update !== "object") return null;
  const appState = (update as { appState?: unknown }).appState;
  return Array.isArray(appState) ? appState.length : null;
}

function getAccountPreconditionStateLength(body: Record<string, unknown>): number | null {
  const preconditions = body.preconditions;
  const account =
    preconditions && typeof preconditions === "object"
      ? (preconditions as { account?: unknown }).account
      : undefined;
  if (!account || typeof account !== "object") return null;
  const state = (account as { state?: unknown }).state;
  return Array.isArray(state) ? state.length : null;
}

export function getAccountUpdateStateLengths(zkappCommand: unknown): number[] {
  if (!zkappCommand || typeof zkappCommand !== "object") return [];
  const accountUpdates = (zkappCommand as { accountUpdates?: unknown }).accountUpdates;
  if (!Array.isArray(accountUpdates)) return [];

  const lengths: number[] = [];
  accountUpdates.forEach((accountUpdate) => {
    const body = getAccountUpdateBody(accountUpdate);
    if (!body) return;

    const appStateLength = getUpdateAppStateLength(body);
    if (appStateLength !== null) {
      lengths.push(appStateLength);
    }

    const accountStateLength = getAccountPreconditionStateLength(body);
    if (accountStateLength !== null) {
      lengths.push(accountStateLength);
    }
  });

  return lengths;
}

export function getZkappCommandEra(zkappCommand: unknown): SignerEra | undefined {
  const stateLengths = getAccountUpdateStateLengths(zkappCommand);

  if (stateLengths.includes(8)) return "berkeley";
  return undefined;
}

export function hasUnsupportedZkappStateLength(zkappCommand: unknown): boolean {
  const stateLengths = getAccountUpdateStateLengths(zkappCommand);
  const hasBerkeleyState = stateLengths.includes(8);
  const hasMesaState = stateLengths.includes(32);
  const hasUnknownState = stateLengths.some((length) => length !== 8 && length !== 32);

  return hasUnknownState || (hasBerkeleyState && hasMesaState);
}
