// Client-Side Matchmaking Service (No Cloud Functions Required)
// This is a fallback implementation for development/testing

import { get, onValue, push, ref, remove, set } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { database, auth } from '../../config/firebase';

export interface MatchmakingConfig {
  maxWaitTime: number; // milliseconds
  matchCheckInterval: number; // milliseconds
}

const DEFAULT_CONFIG: MatchmakingConfig = {
  maxWaitTime: 60000, // 60 seconds
  matchCheckInterval: 3000, // Check every 3 seconds
};

export class ClientMatchmakingService {
  private static matchCheckIntervalId: ReturnType<typeof setInterval> | null = null;

  /**
   * Check if user is currently authenticated
   */
  private static async checkAuthentication(): Promise<string> {
    return new Promise((resolve, reject) => {
      // Set a timeout for the auth check
      const timeout = setTimeout(() => {
        reject(new Error('Authentication check timeout'));
      }, 5000);

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        clearTimeout(timeout);
        unsubscribe();

        if (user && user.uid) {
          console.log('[Matchmaking] User authenticated:', user.uid);
          resolve(user.uid);
        } else {
          console.error('[Matchmaking] No authenticated user found');
          reject(new Error('User must be authenticated to join matchmaking'));
        }
      });
    });
  }

  /**
   * Join matchmaking queue and attempt to find a match
   * This runs entirely on the client side without Cloud Functions
   */
  static async joinAndFindMatch(
    userId: string,
    displayName: string,
    config: Partial<MatchmakingConfig> = {}
  ): Promise<{ success: boolean; matchId?: string; error?: string }> {
    try {
      // First, verify the user is authenticated
      const authenticatedUserId = await this.checkAuthentication();

      // Ensure the provided userId matches the authenticated user
      if (authenticatedUserId !== userId) {
        throw new Error('User ID does not match authenticated user');
      }

      const { maxWaitTime, matchCheckInterval } = { ...DEFAULT_CONFIG, ...config };

      // Add user to queue
      const queueRef = ref(database, `matchMaking/queue/${userId}`);
      await set(queueRef, {
        userId,
        displayName,
        timestamp: Date.now(),
      });

      // Try to find a match
      return await this.findMatch(userId, maxWaitTime, matchCheckInterval);
    } catch (error: any) {
      console.error('Client matchmaking error:', error);
      return {
        success: false,
        error: error.message || 'Failed to join matchmaking',
      };
    }
  }

  /**
   * Poll for available opponents and create match when found
   */
  private static async findMatch(
    userId: string,
    maxWaitTime: number,
    checkInterval: number
  ): Promise<{ success: boolean; matchId?: string; error?: string }> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let matchFound = false;

      const checkForMatch = async () => {
        try {
          // Verify authentication is still valid
          await this.checkAuthentication();

          // Check if we've exceeded max wait time
          if (Date.now() - startTime > maxWaitTime) {
            this.stopMatchCheck();
            resolve({
              success: false,
              error: 'Match timeout - no opponents found',
            });
            return;
          }

          // Get all players in queue
          const queueRef = ref(database, 'matchMaking/queue');
          console.log('[Matchmaking] Checking queue for opponents...');
          const snapshot = await get(queueRef);
          const queue = snapshot.exists() ? snapshot.val() : null;

          if (!queue) {
            console.log('[Matchmaking] Queue is empty');
            return; // No one in queue yet
          }

          console.log('[Matchmaking] Queue data:', queue);

          // Find another player (not current user)
          const waitingPlayers = Object.keys(queue).filter((id) => id !== userId);

          if (waitingPlayers.length === 0) {
            return; // No opponents yet
          }

          // Match found! Create the match
          matchFound = true;
          this.stopMatchCheck();

          const opponentId = waitingPlayers[0];
          const matchId = await this.createMatch(userId, opponentId, queue);

          resolve({
            success: true,
            matchId,
          });
        } catch (error: any) {
          console.error('Match check error:', error);

          // If it's an authentication error, provide specific guidance
          if (error.message && error.message.includes('authenticated')) {
            console.error('[Matchmaking] Authentication error - user may need to log in again');
          }

          this.stopMatchCheck();
          resolve({
            success: false,
            error: error.message || 'Match check failed',
          });
        }
      };

      // Start periodic checking
      this.matchCheckIntervalId = setInterval(checkForMatch, checkInterval);

      // Check immediately
      checkForMatch();
    });
  }

  /**
   * Create a new match between two players
   */
  private static async createMatch(
    playerAId: string,
    playerBId: string,
    queueData: any
  ): Promise<string> {
    try {
      // Verify authentication before creating match
      const authenticatedUserId = await this.checkAuthentication();

      if (authenticatedUserId !== playerAId && authenticatedUserId !== playerBId) {
        throw new Error('Authenticated user is not a participant in this match');
      }

      // Create match reference
      const matchesRef = ref(database, 'inGame');
      const newMatchRef = push(matchesRef);
      const matchId = newMatchRef.key;

      if (!matchId) {
        throw new Error('Failed to generate match ID');
      }

      // Prepare match data
      const matchData = {
        players: {
          playerA: playerAId,
          playerB: playerBId,
        },
        playerNames: {
          playerA: queueData[playerAId]?.displayName || 'Player A',
          playerB: queueData[playerBId]?.displayName || 'Player B',
        },
        state: 'waiting',
        questionIndex: 0,
        startTime: Date.now(),
        questions: [], // Will be set when quiz is selected
        perPlayer: {
          playerA: {
            score: 0,
            ready: false,
          },
          playerB: {
            score: 0,
            ready: false,
          },
        },
        liveScores: {
          playerA: 0,
          playerB: 0,
        },
      };

      // Set match data
      await set(newMatchRef, matchData);

      // Remove both players from queue
      const queueRef = ref(database, 'matchMaking/queue');
      await remove(ref(database, `matchMaking/queue/${playerAId}`));
      await remove(ref(database, `matchMaking/queue/${playerBId}`));

      return matchId;
    } catch (error: any) {
      console.error('Create match error:', error);
      throw new Error(error.message || 'Failed to create match');
    }
  }

  /**
   * Stop checking for matches
   */
  static stopMatchCheck(): void {
    if (this.matchCheckIntervalId) {
      clearInterval(this.matchCheckIntervalId);
      this.matchCheckIntervalId = null;
    }
  }

  /**
   * Leave matchmaking queue
   */
  static async leaveQueue(userId: string): Promise<void> {
    try {
      // Verify authentication before leaving queue
      const authenticatedUserId = await this.checkAuthentication();

      if (authenticatedUserId !== userId) {
        throw new Error('User ID does not match authenticated user');
      }

      this.stopMatchCheck();
      const queueRef = ref(database, `matchMaking/queue/${userId}`);
      await remove(queueRef);
    } catch (error: any) {
      console.error('Leave queue error:', error);
      throw new Error(error.message || 'Failed to leave queue');
    }
  }

  /**
   * Listen to match creation
   */
  static listenForMatch(
    userId: string,
    callback: (matchId: string | null) => void
  ): () => void {
    // Verify authentication before listening for matches
    this.checkAuthentication().catch((error) => {
      console.error('Authentication check failed for listenForMatch:', error);
      callback(null);
      return () => {}; // Return empty cleanup function
    });

    // Listen to all matches to find one where this user is a player
    const matchesRef = ref(database, 'inGame');
    
    const unsubscribe = onValue(matchesRef, (snapshot) => {
      const matches = snapshot.val();
      
      if (!matches) {
        callback(null);
        return;
      }

      // Find match where user is a player
      const userMatch = Object.entries(matches).find(([matchId, match]: [string, any]) => {
        return match.players?.playerA === userId || match.players?.playerB === userId;
      });

      if (userMatch) {
        const [matchId] = userMatch;
        callback(matchId);
      } else {
        callback(null);
      }
    });

    return unsubscribe;
  }
}
