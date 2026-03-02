import { create } from 'zustand';
import { LOCK_TIME_DEFAULT } from '../constant';
import type { Vault } from '../constant/vaultTypes';

// VaultData can be V2 Vault, V1 array format, or null
type V1Wallet = { mnemonic?: string; accounts: unknown[]; currentAddress?: string };
type VaultData = Vault | V1Wallet[] | null;

// Types
export interface AccountInfo {
  address?: string;
  accountName?: string;
  type?: string;
  hdPath?: number;
  [key: string]: unknown;
}

export interface StoreState {
  isUnlocked: boolean;
  data: VaultData | null;
  cryptoKey: CryptoKey | null;
  vaultSalt: string;
  currentAccount: AccountInfo;
  mne: string;
  autoLockTime: number;
  accountApprovedUrlList: Record<string, string[]>;
  currentConnect: Record<string, unknown>;
  tokenBuildList: Record<string, unknown>;
  _directSet: (newState: Partial<StoreState>) => void;
  _directUpdate: (partial: Partial<StoreState>) => void;
  unlock: (payload: UnlockPayload) => void;
  lock: () => void;
  reset: () => void;
  setCurrentAccount: (account: AccountInfo) => void;
  setMnemonic: (mne: string) => void;
  setAutoLockTime: (time: number) => void;
}

export interface UnlockPayload {
  cryptoKey?: CryptoKey | null;
  vaultSalt?: string;
  data?: VaultData | null;
  currentAccount?: AccountInfo;
  autoLockTime?: number;
}

const useInternalStore = create<StoreState>((set, get) => ({
  // === APIService state ===
  isUnlocked: false,
  data: null,
  cryptoKey: null,
  vaultSalt: '',
  currentAccount: {},
  mne: "",
  autoLockTime: LOCK_TIME_DEFAULT,

  // === DappService state ===
  accountApprovedUrlList: {},
  currentConnect: {},
  tokenBuildList: {},

  _directSet: (newState: Partial<StoreState>) => set(newState),
  _directUpdate: (partial: Partial<StoreState>) => set((state) => ({ ...state, ...partial })),

  unlock: (payload: UnlockPayload) => set({
    isUnlocked: true,
    cryptoKey: payload.cryptoKey || null,
    vaultSalt: payload.vaultSalt || '',
    data: payload.data || null,
    currentAccount: payload.currentAccount || {},
    autoLockTime: payload.autoLockTime ?? LOCK_TIME_DEFAULT,
  }),

  lock: () => set((state) => ({
    isUnlocked: false,
    cryptoKey: null,
    vaultSalt: '',
    data: null,
    currentAccount: { address: state.currentAccount?.address || '' },
    mne: "",
    autoLockTime: state.autoLockTime,
  })),

  reset: () => set({
    isUnlocked: false,
    cryptoKey: null,
    vaultSalt: '',
    data: null,
    currentAccount: {},
    mne: "",
  }),

  setCurrentAccount: (account: AccountInfo) => set({ currentAccount: account }),
  setMnemonic: (mne: string) => set({ mne }),
  setAutoLockTime: (time: number) => set({ autoLockTime: time }),
}))

export const memStore = {
  getState: (): StoreState => useInternalStore.getState(),
  updateState: (newState: Partial<StoreState>) => useInternalStore.getState()._directUpdate(newState),
  putState: (newState: Partial<StoreState>) => useInternalStore.getState()._directSet(newState),
  subscribe: (listener: (state: StoreState) => void) => useInternalStore.subscribe((state) => listener(state)),

  unlock: (payload: UnlockPayload) => useInternalStore.getState().unlock(payload),
  lock: () => useInternalStore.getState().lock(),
  reset: () => useInternalStore.getState().reset(),
  setCurrentAccount: (acc: AccountInfo) => useInternalStore.getState().setCurrentAccount(acc),
  setMnemonic: (mne: string) => useInternalStore.getState().setMnemonic(mne),
  setAutoLockTime: (time: number) => useInternalStore.getState().setAutoLockTime(time),

  _directUpdate: (partial: Partial<StoreState>) => useInternalStore.getState()._directUpdate(partial),
  _directSet: (newState: Partial<StoreState>) => useInternalStore.getState()._directSet(newState),
};
