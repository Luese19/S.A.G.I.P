import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';

export interface MatchmakeRequest {
  userId: string;
  userProfile: {
    displayName: string;
    avatarUrl?: string;
  };
}

export interface MatchmakeResponse {
  success: boolean;
  matchId?: string;
  error?: string;
}

export interface SubmitAnswerRequest {
  matchId: string;
  playerUid: string;
  questionId: string;
  answerId: string;
  clientTimestamp: number;
  timeBonus?: number;
}

export interface SubmitAnswerResponse {
  success: boolean;
  isCorrect: boolean;
  pointsEarned: number;
  timeBonus: number;
  totalScore: number;
  correctAnswer?: string;
  explanation?: string;
  error?: string;
}

export interface EndMatchRequest {
  matchId: string;
  playerUid: string;
}

export interface EndMatchResponse {
  success: boolean;
  finalScores: {
    playerA: number;
    playerB: number;
  };
  matchSummary?: {
    totalQuestions: number;
    correctAnswers: number;
    averageTime: number;
  };
  error?: string;
}

export class FunctionsService {
  // Matchmaking function
  static async callMatchmake(data: MatchmakeRequest): Promise<MatchmakeResponse> {
    try {
      const callable = httpsCallable<MatchmakeRequest, MatchmakeResponse>(
        functions,
        'function_matchmake'
      );
      const response = await callable(data);
      return response.data;
    } catch (error) {
      console.error('Matchmake function error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Submit answer function
  static async callSubmitAnswer(data: SubmitAnswerRequest): Promise<SubmitAnswerResponse> {
    try {
      const callable = httpsCallable<SubmitAnswerRequest, SubmitAnswerResponse>(
        functions,
        'function_submitAnswer'
      );
      const response = await callable(data);
      return response.data;
    } catch (error) {
      console.error('Submit answer function error:', error);
      return {
        success: false,
        isCorrect: false,
        pointsEarned: 0,
        timeBonus: 0,
        totalScore: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // End match function
  static async callEndMatch(data: EndMatchRequest): Promise<EndMatchResponse> {
    try {
      const callable = httpsCallable<EndMatchRequest, EndMatchResponse>(
        functions,
        'function_endMatch'
      );
      const response = await callable(data);
      return response.data;
    } catch (error) {
      console.error('End match function error:', error);
      return {
        success: false,
        finalScores: { playerA: 0, playerB: 0 },
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Analytics functions
  static async logMatchStarted(matchId: string, userId: string): Promise<void> {
    try {
      const callable = httpsCallable(functions, 'log_analytics_event');
      await callable({
        event: 'match_started',
        matchId,
        userId,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Analytics logging error:', error);
    }
  }

  static async logQuestionSubmitted(
    matchId: string,
    userId: string,
    questionId: string,
    timeSpent: number
  ): Promise<void> {
    try {
      const callable = httpsCallable(functions, 'log_analytics_event');
      await callable({
        event: 'question_submitted',
        matchId,
        userId,
        questionId,
        timeSpent,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Analytics logging error:', error);
    }
  }

  static async logMatchEnded(
    matchId: string,
    userId: string,
    finalScore: number,
    totalQuestions: number
  ): Promise<void> {
    try {
      const callable = httpsCallable(functions, 'log_analytics_event');
      await callable({
        event: 'match_ended',
        matchId,
        userId,
        finalScore,
        totalQuestions,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Analytics logging error:', error);
    }
  }
}
