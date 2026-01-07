import { create } from 'zustand';
import { LOCK_TIME_DEFAULT } from '../constant';

const useInternalStore = create((set, get) => ({
  // === APIService state ===
  isUnlocked: false,
  data: '',
  password: '',
  currentAccount: {},
  mne: "",
  autoLockTime: LOCK_TIME_DEFAULT,

  // === DappService state ===
  accountApprovedUrlList: {},
  currentConnect: {},
  tokenBuildList: {},

  _directSet: (newState) => set(newState),
  _directUpdate: (partial) => set((state) => ({ ...state, ...partial })),

  unlock: (payload) => set({
    isUnlocked: true,
    password: payload.password || '',
    data: payload.data || '',
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

  setCurrentAccount: (account) => set({ currentAccount: account }),
  setMnemonic: (mne) => set({ mne }),
  setAutoLockTime: (time) => set({ autoLockTime: time }),
}))

export const memStore = {
  getState: () => useInternalStore.getState(),
  updateState: (newState) => useInternalStore.getState()._directUpdate(newState),
  putState: (newState) => useInternalStore.getState()._directSet(newState),
  subscribe: (listener) => useInternalStore.subscribe((state) => listener(state)),

  unlock: (payload) => useInternalStore.getState().unlock(payload),
  lock: () => useInternalStore.getState().lock(),
  setCurrentAccount: (acc) => useInternalStore.getState().setCurrentAccount(acc),
  setMnemonic: (mne) => useInternalStore.getState().setMnemonic(mne),
  setAutoLockTime: (time) => useInternalStore.getState().setAutoLockTime(time),

  _directUpdate: (partial) => useInternalStore.getState()._directUpdate(partial),
  _directSet: (newState) => useInternalStore.getState()._directSet(newState),
};