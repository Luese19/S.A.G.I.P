import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DatabaseService, GameMatch } from '../../services/firebase/database';
import { FunctionsService } from '../../services/firebase/functions';
import { FirestoreService, Question } from '../../services/firebase/firestore';

export interface MatchState {
  currentMatch: GameMatch | null;
  currentQuestionIndex: number;
  timeRemaining: number; // in seconds
  selectedAnswer: string | null;
  isAnswering: boolean;
  playerScore: number;
  opponentScore: number;
  matchStatus: 'waiting' | 'active' | 'question_results' | 'ended' | null;
  questions: Question[];
  isLoading: boolean;
  error: string | null;
}

const initialState: MatchState = {
  currentMatch: null,
  currentQuestionIndex: 0,
  timeRemaining: 0,
  selectedAnswer: null,
  isAnswering: false,
  playerScore: 0,
  opponentScore: 0,
  matchStatus: null,
  questions: [],
  isLoading: false,
  error: null,
};

// Async thunks for match management
export const loadMatch = createAsyncThunk(
  'match/loadMatch',
  async (matchId: string, { rejectWithValue }) => {
    try {
      const match = await DatabaseService.getMatch(matchId);
      if (!match) {
        throw new Error('Match not found');
      }

      // Load questions for the match
      const questions = await FirestoreService.getQuestionsByIds(match.questions);

      return { match, questions };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load match');
    }
  }
);

export const submitAnswer = createAsyncThunk(
  'match/submitAnswer',
  async (
    {
      matchId,
      playerUid,
      questionId,
      answerId,
      timeSpent
    }: {
      matchId: string;
      playerUid: string;
      questionId: string;
      answerId: string;
      timeSpent: number;
    },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as any;
      const currentMatch = state.match.currentMatch;

      if (!currentMatch) {
        throw new Error('No active match');
      }

      // Submit answer to server function
      const response = await FunctionsService.callSubmitAnswer({
        matchId,
        playerUid,
        questionId,
        answerId,
        clientTimestamp: Date.now(),
        timeBonus: Math.max(0, timeSpent), // Convert time remaining to time bonus
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to submit answer');
      }

      return {
        isCorrect: response.isCorrect,
        pointsEarned: response.pointsEarned,
        timeBonus: response.timeBonus,
        totalScore: response.totalScore,
        correctAnswer: response.correctAnswer,
        explanation: response.explanation,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to submit answer');
    }
  }
);

export const endMatch = createAsyncThunk(
  'match/endMatch',
  async ({ matchId, playerUid }: { matchId: string; playerUid: string }, { rejectWithValue }) => {
    try {
      const response = await FunctionsService.callEndMatch({
        matchId,
        playerUid,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to end match');
      }

      return {
        finalScores: response.finalScores,
        matchSummary: response.matchSummary,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to end match');
    }
  }
);

const matchSlice = createSlice({
  name: 'match',
  initialState,
  reducers: {
    setMatch: (state, action: PayloadAction<GameMatch>) => {
      state.currentMatch = action.payload;
      state.matchStatus = action.payload.state;
      state.currentQuestionIndex = action.payload.questionIndex;
    },
    updateMatchState: (state, action: PayloadAction<Partial<GameMatch>>) => {
      if (state.currentMatch) {
        state.currentMatch = { ...state.currentMatch, ...action.payload };
        state.matchStatus = action.payload.state || state.matchStatus;
        state.currentQuestionIndex = action.payload.questionIndex ?? state.currentQuestionIndex;
      }
    },
    setTimeRemaining: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload;
    },
    selectAnswer: (state, action: PayloadAction<string>) => {
      state.selectedAnswer = action.payload;
    },
    clearSelectedAnswer: (state) => {
      state.selectedAnswer = null;
    },
    setAnswering: (state, action: PayloadAction<boolean>) => {
      state.isAnswering = action.payload;
    },
    updateScores: (state, action: PayloadAction<{ player: number; opponent: number }>) => {
      state.playerScore = action.payload.player;
      state.opponentScore = action.payload.opponent;
    },
    advanceToNextQuestion: (state) => {
      if (state.currentMatch && state.currentQuestionIndex < state.currentMatch.questions.length - 1) {
        state.currentQuestionIndex += 1;
        state.selectedAnswer = null;
        state.timeRemaining = 30; // Reset timer for next question
        state.matchStatus = 'active';
      } else {
        state.matchStatus = 'ended';
      }
    },
    setQuestions: (state, action: PayloadAction<Question[]>) => {
      state.questions = action.payload;
    },
    clearMatchError: (state) => {
      state.error = null;
    },
    resetMatchState: (state) => {
      state.currentMatch = null;
      state.currentQuestionIndex = 0;
      state.timeRemaining = 0;
      state.selectedAnswer = null;
      state.isAnswering = false;
      state.playerScore = 0;
      state.opponentScore = 0;
      state.matchStatus = null;
      state.questions = [];
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load match
      .addCase(loadMatch.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadMatch.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentMatch = action.payload.match;
        state.questions = action.payload.questions;
        state.matchStatus = action.payload.match.state;
        state.currentQuestionIndex = action.payload.match.questionIndex;
        state.playerScore = action.payload.match.liveScores.playerA;
        state.opponentScore = action.payload.match.liveScores.playerB;
      })
      .addCase(loadMatch.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Submit answer
      .addCase(submitAnswer.pending, (state) => {
        state.isAnswering = true;
        state.error = null;
      })
      .addCase(submitAnswer.fulfilled, (state, action) => {
        state.isAnswering = false;
        state.matchStatus = 'question_results';

        // Update scores based on server response
        if (action.payload.isCorrect) {
          state.playerScore += action.payload.pointsEarned;
        }
      })
      .addCase(submitAnswer.rejected, (state, action) => {
        state.isAnswering = false;
        state.error = action.payload as string;
      })

      // End match
      .addCase(endMatch.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(endMatch.fulfilled, (state, action) => {
        state.isLoading = false;
        state.matchStatus = 'ended';
        state.playerScore = action.payload.finalScores.playerA;
        state.opponentScore = action.payload.finalScores.playerB;
      })
      .addCase(endMatch.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setMatch,
  updateMatchState,
  setTimeRemaining,
  selectAnswer,
  clearSelectedAnswer,
  setAnswering,
  updateScores,
  advanceToNextQuestion,
  setQuestions,
  clearMatchError,
  resetMatchState,
} = matchSlice.actions;

export default matchSlice.reducer;