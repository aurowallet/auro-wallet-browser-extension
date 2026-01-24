/**
 * Typed Redux hooks
 * 
 * Provides type-safe versions of useSelector and useDispatch.
 * Use these instead of the plain react-redux hooks to get proper typing.
 */

import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../reducers';
import type { Dispatch, AnyAction } from 'redux';

/**
 * Typed useSelector hook
 * 
 * Usage:
 * ```typescript
 * import { useAppSelector } from '@/hooks/useStore';
 * const address = useAppSelector(state => state.accountInfo.currentAccount.address);
 * ```
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * Typed useDispatch hook
 * 
 * Usage:
 * ```typescript
 * import { useAppDispatch } from '@/hooks/useStore';
 * const dispatch = useAppDispatch();
 * dispatch(someAction());
 * ```
 */
export const useAppDispatch = () => useDispatch<Dispatch<AnyAction>>();

/**
 * Re-export RootState for convenience
 */
export type { RootState };
