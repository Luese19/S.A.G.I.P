import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  Timestamp,
  Unsubscribe,
  updateDoc,
  where,
} from 'firebase/firestore';
import { firestore } from '../../config/firebase';

// Types for our data models
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  xp: number;
  matchesPlayed: number;
  bestScore: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Question {
  id: string;
  type: 'MC' | 'TF' | 'DND' | 'SEQ';
  text: string;
  choices?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  explanation: string;
  timeLimitMs: number;
  pointsBase: number;
  theme: 'Prevention' | 'Preparedness' | 'Response' | 'Recovery';
  localizedData?: {
    pasig?: {
      hotlines?: string[];
      hazardLinks?: string[];
    };
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  theme: 'Prevention' | 'Preparedness' | 'Response' | 'Recovery';
  questions: string[]; // Array of question IDs
  localizationTags: string[]; // e.g., ['pasig']
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface LeaderboardEntry {
  userId: string;
  score: number;
  matchesPlayed: number;
  timestamp: Timestamp;
}

export interface MatchSummary {
  id: string;
  players: {
    playerA: string;
    playerB: string;
  };
  finalScores: {
    playerA: number;
    playerB: number;
  };
  questionsAnswered: number;
  duration: number; // in seconds
  completedAt: Timestamp;
}

export class FirestoreService {
  // Collection references
  private static get usersCollection() {
    return collection(firestore, 'users');
  }

  private static get quizzesCollection() {
    return collection(firestore, 'quizzes');
  }

  private static get questionsCollection() {
    return collection(firestore, 'questions');
  }

  private static get leaderboardsCollection() {
    return collection(firestore, 'leaderboards');
  }

  private static get matchesCollection() {
    return collection(firestore, 'matches');
  }

  // User Profile Management
  static async createUserProfile(uid: string, profile: Partial<UserProfile>): Promise<void> {
    const now = Timestamp.now();
    const userProfile: UserProfile = {
      uid,
      displayName: profile.displayName || '',
      email: profile.email || '',
      xp: 0,
      matchesPlayed: 0,
      bestScore: 0,
      createdAt: now,
      updatedAt: now,
      ...profile,
    };

    const userDoc = doc(this.usersCollection, uid);
    await setDoc(userDoc, userProfile);
  }

  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userDoc = doc(this.usersCollection, uid);
    const docSnap = await getDoc(userDoc);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  }

  static async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const userDoc = doc(this.usersCollection, uid);
    await updateDoc(userDoc, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  }

  // Quiz Management
  static async getActiveQuizzes(): Promise<Quiz[]> {
    const q = query(this.quizzesCollection, where('isActive', '==', true));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Quiz[];
  }

  static async getQuizById(quizId: string): Promise<Quiz | null> {
    const quizDoc = doc(this.quizzesCollection, quizId);
    const docSnap = await getDoc(quizDoc);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Quiz;
    }
    return null;
  }

  // Questions Management
  static async getQuestionsByIds(questionIds: string[]): Promise<Question[]> {
    if (questionIds.length === 0) return [];

    const q = query(
      this.questionsCollection,
      where(documentId(), 'in', questionIds.slice(0, 10)) // Firestore 'in' limit is 10
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Question[];
  }

  static async getQuestionsByTheme(theme: Question['theme']): Promise<Question[]> {
    const q = query(
      this.questionsCollection,
      where('theme', '==', theme),
      limit(50)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Question[];
  }

  // Leaderboard Management
  static async getGlobalLeaderboard(limitCount: number = 10): Promise<LeaderboardEntry[]> {
    const leaderboardDoc = doc(this.leaderboardsCollection, 'global');
    const scoresCollection = collection(leaderboardDoc, 'scores');
    const q = query(scoresCollection, orderBy('score', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap => docSnap.data() as LeaderboardEntry);
  }

  static async updateLeaderboard(userId: string, score: number): Promise<void> {
    const userProfile = await this.getUserProfile(userId);
    if (!userProfile) return;

    const leaderboardEntry: LeaderboardEntry = {
      userId,
      score,
      matchesPlayed: userProfile.matchesPlayed,
      timestamp: Timestamp.now(),
    };

    // Update global leaderboard
    const leaderboardDoc = doc(this.leaderboardsCollection, 'global');
    const scoreDoc = doc(collection(leaderboardDoc, 'scores'), userId);
    await setDoc(scoreDoc, leaderboardEntry);
  }

  // Match Summary Management
  static async saveMatchSummary(matchSummary: MatchSummary): Promise<void> {
    const matchDoc = doc(this.matchesCollection, matchSummary.id);
    await setDoc(matchDoc, {
      ...matchSummary,
      completedAt: Timestamp.now(),
    });
  }

  static async getMatchSummary(matchId: string): Promise<MatchSummary | null> {
    const matchDoc = doc(this.matchesCollection, matchId);
    const docSnap = await getDoc(matchDoc);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as MatchSummary;
    }
    return null;
  }

  // Real-time listeners
  static listenToUserProfile(uid: string, callback: (profile: UserProfile | null) => void): Unsubscribe {
    const userDoc = doc(this.usersCollection, uid);
    return onSnapshot(userDoc, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as UserProfile);
      } else {
        callback(null);
      }
    });
  }

  static listenToLeaderboard(callback: (entries: LeaderboardEntry[]) => void): Unsubscribe {
    const leaderboardDoc = doc(this.leaderboardsCollection, 'global');
    const scoresCollection = collection(leaderboardDoc, 'scores');
    const q = query(scoresCollection, orderBy('score', 'desc'), limit(10));
    
    return onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(docSnap => docSnap.data() as LeaderboardEntry);
      callback(entries);
    });
  }
}
