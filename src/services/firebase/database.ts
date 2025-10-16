import {
    get,
    off,
    onValue,
    push,
    ref,
    remove,
    set,
    Unsubscribe,
    update,
} from 'firebase/database';
import { database } from '../../config/firebase';

export interface MatchMakingEntry {
  userId: string;
  timestamp: number;
}

export interface GameMatch {
  id: string;
  players: {
    playerA: string;
    playerB: string;
  };
  state: 'waiting' | 'active' | 'ended';
  questionIndex: number;
  startTime: number;
  questions: string[]; // Array of question IDs
  perPlayer: {
    playerA: {
      currentAnswer?: string;
      localTimestamp?: number;
      score: number;
    };
    playerB: {
      currentAnswer?: string;
      localTimestamp?: number;
      score: number;
    };
  };
  liveScores: {
    playerA: number;
    playerB: number;
  };
}

export class DatabaseService {
  // Path references
  private static get matchMakingRef() {
    return ref(database, 'matchMaking/queue');
  }

  private static getMatchRef(matchId: string) {
    return ref(database, `inGame/${matchId}`);
  }

  // Matchmaking
  static async joinMatchmaking(userId: string): Promise<void> {
    const entry: MatchMakingEntry = {
      userId,
      timestamp: Date.now(),
    };
    const userRef = ref(database, `matchMaking/queue/${userId}`);
    await set(userRef, entry);
  }

  static async leaveMatchmaking(userId: string): Promise<void> {
    const userRef = ref(database, `matchMaking/queue/${userId}`);
    await remove(userRef);
  }

  static listenToMatchmaking(callback: (entries: MatchMakingEntry[]) => void): Unsubscribe {
    return onValue(this.matchMakingRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const entries = Object.values(data) as MatchMakingEntry[];
        callback(entries);
      } else {
        callback([]);
      }
    });
  }

  // Match Management
  static async createMatch(matchData: Omit<GameMatch, 'id'>): Promise<string> {
    try {
      const matchesRef = ref(database, 'inGame');
      const matchRef = push(matchesRef);
      const matchId = matchRef.key;

      if (!matchId) {
        throw new Error('Failed to generate match ID');
      }

      const gameMatch: GameMatch = {
        id: matchId,
        ...matchData,
      };

      await set(matchRef, gameMatch);
      return matchId;
    } catch (error: any) {
      console.error('Create match error:', error);
      throw new Error(error.message || 'Failed to create match');
    }
  }

  static async updateMatch(matchId: string, updates: Partial<GameMatch>): Promise<void> {
    try {
      if (!matchId) {
        throw new Error('Match ID is required');
      }
      await update(this.getMatchRef(matchId), updates);
    } catch (error: any) {
      console.error('Update match error:', error);
      throw new Error(error.message || 'Failed to update match');
    }
  }

  static listenToMatch(matchId: string, callback: (match: GameMatch | null) => void): Unsubscribe {
    return onValue(this.getMatchRef(matchId), (snapshot) => {
      const data = snapshot.val();
      callback(data ? { id: matchId, ...data } as GameMatch : null);
    });
  }

  static stopListeningToMatch(matchId: string) {
    off(this.getMatchRef(matchId));
  }

  static async getMatch(matchId: string): Promise<GameMatch | null> {
    try {
      if (!matchId) {
        throw new Error('Match ID is required');
      }
      const snapshot = await get(this.getMatchRef(matchId));
      const data = snapshot.val();
      return data ? { id: matchId, ...data } as GameMatch : null;
    } catch (error: any) {
      console.error('Get match error:', error);
      throw new Error(error.message || 'Failed to get match');
    }
  }

  // Player-specific updates
  static async updatePlayerAnswer(
    matchId: string,
    playerId: string,
    answer: string,
    timestamp: number
  ): Promise<void> {
    try {
      if (!matchId || !playerId) {
        throw new Error('Match ID and Player ID are required');
      }
      const playerKey = playerId === 'playerA' ? 'playerA' : 'playerB';
      const playerRef = ref(database, `inGame/${matchId}/perPlayer/${playerKey}`);
      await update(playerRef, {
        currentAnswer: answer,
        localTimestamp: timestamp,
      });
    } catch (error: any) {
      console.error('Update player answer error:', error);
      throw new Error(error.message || 'Failed to update player answer');
    }
  }

  static async updatePlayerScore(
    matchId: string,
    playerId: string,
    score: number
  ): Promise<void> {
    try {
      if (!matchId || !playerId) {
        throw new Error('Match ID and Player ID are required');
      }
      const playerKey = playerId === 'playerA' ? 'playerA' : 'playerB';
      const playerRef = ref(database, `inGame/${matchId}/perPlayer/${playerKey}`);
      await update(playerRef, { score });
    } catch (error: any) {
      console.error('Update player score error:', error);
      throw new Error(error.message || 'Failed to update player score');
    }
  }

  static async updateLiveScores(
    matchId: string,
    scores: { playerA: number; playerB: number }
  ): Promise<void> {
    const scoresRef = ref(database, `inGame/${matchId}/liveScores`);
    await update(scoresRef, scores);
  }

  // Match state management
  static async startMatch(matchId: string, questionIds: string[]): Promise<void> {
    await update(this.getMatchRef(matchId), {
      state: 'active',
      questionIndex: 0,
      startTime: Date.now(),
      questions: questionIds,
    });
  }

  static async endMatch(matchId: string): Promise<void> {
    await update(this.getMatchRef(matchId), {
      state: 'ended',
    });
  }

  static async advanceToNextQuestion(matchId: string): Promise<void> {
    const match = await this.getMatch(matchId);
    if (match) {
      await update(this.getMatchRef(matchId), {
        questionIndex: match.questionIndex + 1,
      });
    }
  }
}
