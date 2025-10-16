import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = useDispatch<AppDispatch>;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Specific hooks for different slices
export const useAuth = () => useAppSelector((state) => state.auth);
export const useMatchmaking = () => useAppSelector((state) => state.matchmaking);
export const useMatch = () => useAppSelector((state) => state.match);
export const useUI = () => useAppSelector((state) => state.ui);

// Combined hooks for common use cases
export const useAuthUser = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  return { user, isAuthenticated, isLoading };
};

export const useMatchState = () => {
  const matchState = useMatch();
  return matchState;
};

export const useMatchmakingState = () => {
  const { isInQueue, queuePosition, estimatedWaitTime, isSearching, matchId } = useMatchmaking();
  return { isInQueue, queuePosition, estimatedWaitTime, isSearching, matchId };
};