import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ClientMatchmakingService } from '../../services/firebase/clientMatchmaking';
import { DatabaseService } from '../../services/firebase/database';
import { FunctionsService } from '../../services/firebase/functions';
import { NetworkErrorHandler } from '../../utils/networkErrorHandler';

// Feature flag to use client-side matchmaking instead of Cloud Functions
const USE_CLIENT_MATCHMAKING = true; // Set to false when Cloud Functions are deployed

export interface MatchmakingState {
  isInQueue: boolean;
  queuePosition: number | null;
  estimatedWaitTime: number | null; // in seconds
  isSearching: boolean;
  error: string | null;
  matchId: string | null;
  retryCount: number;
  lastAttempt: number | null;
}

const initialState: MatchmakingState = {
  isInQueue: false,
  queuePosition: null,
  estimatedWaitTime: null,
  isSearching: false,
  error: null,
  matchId: null,
  retryCount: 0,
  lastAttempt: null,
};

// Helper to check if retry should be attempted
const shouldRetry = (retryCount: number, lastAttempt: number | null): boolean => {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds

  if (retryCount >= MAX_RETRIES) return false;
  if (!lastAttempt) return true;

  return Date.now() - lastAttempt > RETRY_DELAY;
};

// Async thunks for matchmaking
export const joinMatchmaking = createAsyncThunk(
  'matchmaking/joinMatchmaking',
  async (userId: string, { rejectWithValue, getState }) => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Use client-side matchmaking if feature flag is enabled
      if (USE_CLIENT_MATCHMAKING) {
        console.log('[Matchmaking] Using client-side matchmaking');
        
        const result = await ClientMatchmakingService.joinAndFindMatch(
          userId,
          'Player', // This should come from auth state
          {
            maxWaitTime: 60000, // 60 seconds
            matchCheckInterval: 3000, // Check every 3 seconds
          }
        );

        if (result.success && result.matchId) {
          return result.matchId;
        } else {
          // Still waiting in queue
          return null;
        }
      }

      // Original Cloud Functions approach
      await DatabaseService.joinMatchmaking(userId);

      const response = await FunctionsService.callMatchmake({
        userId,
        userProfile: {
          displayName: 'Player',
        },
      });

      if (response.success && response.matchId) {
        return response.matchId;
      } else {
        throw new Error(response.error || 'Failed to join matchmaking');
      }
    } catch (error: any) {
      NetworkErrorHandler.logError(error, 'joinMatchmaking');
      const parsedError = NetworkErrorHandler.parseError(error);
      return rejectWithValue(parsedError.message);
    }
  }
);

export const leaveMatchmaking = createAsyncThunk(
  'matchmaking/leaveMatchmaking',
  async (userId: string, { rejectWithValue }) => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Use client-side matchmaking if feature flag is enabled
      if (USE_CLIENT_MATCHMAKING) {
        await ClientMatchmakingService.leaveQueue(userId);
        return true;
      }

      // Original approach
      await DatabaseService.leaveMatchmaking(userId);
      return true;
    } catch (error: any) {
      NetworkErrorHandler.logError(error, 'leaveMatchmaking');
      const parsedError = NetworkErrorHandler.parseError(error);
      return rejectWithValue(parsedError.message);
    }
  }
);

// Store listener reference for cleanup
let queueListenerUnsubscribe: (() => void) | null = null;

export const listenToQueuePosition = createAsyncThunk(
  'matchmaking/listenToQueuePosition',
  async (userId: string, { dispatch }) => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Clean up previous listener if exists
      if (queueListenerUnsubscribe) {
        queueListenerUnsubscribe();
      }

      queueListenerUnsubscribe = DatabaseService.listenToMatchmaking((entries) => {
        const userEntry = entries.find(entry => entry.userId === userId);
        if (userEntry) {
          const position = entries
            .sort((a, b) => a.timestamp - b.timestamp)
            .findIndex(entry => entry.userId === userId) + 1;

          dispatch(updateQueuePosition(position));
          dispatch(updateEstimatedWaitTime(Math.max(10, position * 15))); // Estimate 15 seconds per player
        } else {
          dispatch(updateQueuePosition(null));
          dispatch(updateEstimatedWaitTime(null));
        }
      });

      return true;
    } catch (error: any) {
      NetworkErrorHandler.logError(error, 'listenToQueuePosition');
      console.error('Queue listening error:', error);
      return false;
    }
  }
);

// Cleanup listener
export const cleanupQueueListener = createAsyncThunk(
  'matchmaking/cleanupQueueListener',
  async () => {
    if (queueListenerUnsubscribe) {
      queueListenerUnsubscribe();
      queueListenerUnsubscribe = null;
    }
  }
);

const matchmakingSlice = createSlice({
  name: 'matchmaking',
  initialState,
  reducers: {
    setSearching: (state, action: PayloadAction<boolean>) => {
      state.isSearching = action.payload;
    },
    updateQueuePosition: (state, action: PayloadAction<number | null>) => {
      state.queuePosition = action.payload;
    },
    updateEstimatedWaitTime: (state, action: PayloadAction<number | null>) => {
      state.estimatedWaitTime = action.payload;
    },
    setMatchId: (state, action: PayloadAction<string | null>) => {
      state.matchId = action.payload;
    },
    clearMatchmakingError: (state) => {
      state.error = null;
    },
    resetMatchmakingState: (state) => {
      state.isInQueue = false;
      state.queuePosition = null;
      state.estimatedWaitTime = null;
      state.isSearching = false;
      state.error = null;
      state.matchId = null;
      state.retryCount = 0;
      state.lastAttempt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Join matchmaking
      .addCase(joinMatchmaking.pending, (state) => {
        state.isSearching = true;
        state.error = null;
        state.lastAttempt = Date.now();
      })
      .addCase(joinMatchmaking.fulfilled, (state, action) => {
        state.isSearching = false;
        state.isInQueue = true;
        state.matchId = action.payload;
        state.retryCount = 0;
        state.error = null;
      })
      .addCase(joinMatchmaking.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.payload as string;
        state.retryCount += 1;
      })

      // Leave matchmaking
      .addCase(leaveMatchmaking.pending, (state) => {
        state.isSearching = true;
        state.error = null;
      })
      .addCase(leaveMatchmaking.fulfilled, (state) => {
        state.isSearching = false;
        state.isInQueue = false;
        state.queuePosition = null;
        state.estimatedWaitTime = null;
        state.matchId = null;
        state.retryCount = 0;
        state.error = null;
      })
      .addCase(leaveMatchmaking.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.payload as string;
      })

      // Cleanup listener
      .addCase(cleanupQueueListener.fulfilled, (state) => {
        // Listener cleaned up successfully
        if (__DEV__) {
          console.log('Queue listener cleaned up');
        }
      });
  },
});

export const {
  setSearching,
  updateQueuePosition,
  updateEstimatedWaitTime,
  setMatchId,
  clearMatchmakingError,
  resetMatchmakingState,
} = matchmakingSlice.actions;

export default matchmakingSlice.reducer;