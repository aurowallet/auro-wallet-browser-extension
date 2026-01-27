import { create } from 'zustand';
import { LOCK_TIME_DEFAULT } from '../constant';
import type { VaultData } from '../background/apiService/vaultHelpers';

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
  password: string;
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
  setCurrentAccount: (account: AccountInfo) => void;
  setMnemonic: (mne: string) => void;
  setAutoLockTime: (time: number) => void;
}

export interface UnlockPayload {
  password?: string;
  data?: VaultData | null;
  currentAccount?: AccountInfo;
  autoLockTime?: number;
}

const useInternalStore = create<StoreState>((set, get) => ({
  // === APIService state ===
  isUnlocked: false,
  data: null,
  password: '',
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
    password: payload.password || '',
    data: payload.data || null,
    currentAccount: payload.currentAccount || {},
    autoLockTime: payload.autoLockTime || LOCK_TIME_DEFAULT,
  }),

  lock: () => set((state) => ({
    isUnlocked: false,
    password: '',
    data: null,
    currentAccount: { address: state.currentAccount?.address || '' },
    mne: "",
    autoLockTime: state.autoLockTime,
  })),

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
  setCurrentAccount: (acc: AccountInfo) => useInternalStore.getState().setCurrentAccount(acc),
  setMnemonic: (mne: string) => useInternalStore.getState().setMnemonic(mne),
  setAutoLockTime: (time: number) => useInternalStore.getState().setAutoLockTime(time),

  _directUpdate: (partial: Partial<StoreState>) => useInternalStore.getState()._directUpdate(partial),
  _directSet: (newState: Partial<StoreState>) => useInternalStore.getState()._directSet(newState),
};