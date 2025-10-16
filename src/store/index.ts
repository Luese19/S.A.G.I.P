import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import matchmakingReducer from './slices/matchmakingSlice';
import matchReducer from './slices/matchSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    matchmaking: matchmakingReducer,
    match: matchReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for Firebase timestamps
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredActionsPaths: ['payload.timestamp', 'payload.createdAt'],
        ignoredPaths: ['auth.user.createdAt', 'auth.user.updatedAt'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export store for use in the app
export default store;