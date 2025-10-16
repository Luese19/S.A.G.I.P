import {
    createUserWithEmailAndPassword,
    deleteUser,
    sendPasswordResetEmail as firebaseSendPasswordResetEmail,
    signOut as firebaseSignOut,
    updateProfile as firebaseUpdateProfile,
    User as FirebaseUser,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    UserCredential,
} from 'firebase/auth';
import { auth } from '../../config/firebase';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export interface AuthUser extends User {
  xp: number;
  matchesPlayed: number;
  bestScore: number;
  createdAt: any;
}

export class AuthService {
  // Email/Password Authentication
  static async signUpWithEmail(email: string, password: string): Promise<UserCredential> {
    try {
      return await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Failed to create account');
    }
  }

  static async signInWithEmail(email: string, password: string): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Sign in error:', error);
      // Provide user-friendly error messages
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else if (error.code === 'auth/user-disabled') {
        throw new Error('This account has been disabled');
      }
      throw new Error(error.message || 'Failed to sign in');
    }
  }

  static async signOut(): Promise<void> {
    try {
      return await firebaseSignOut(auth);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  }

  // Google Sign-In
  static async signInWithGoogle(): Promise<UserCredential> {
    // Note: Google Sign-In requires additional setup for React Native
    // This is a placeholder that throws a helpful error message
    throw new Error(
      'Google Sign-In requires additional setup for React Native.\n\n' +
      'To enable Google Sign-In, you need to:\n' +
      '1. Install @react-native-google-signin/google-signin or @react-native-firebase/auth\n' +
      '2. Configure Google Sign-In in Firebase Console\n' +
      '3. Add SHA-1 certificate fingerprint to Firebase\n' +
      '4. Implement the sign-in flow\n\n' +
      'See GOOGLE_SIGNIN_SETUP.md for detailed instructions.'
    );
  }

  // Password Reset
  static async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      return await firebaseSendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      }
      throw new Error(error.message || 'Failed to send password reset email');
    }
  }

  // User Management
  static async deleteAccount(): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user is currently signed in');
      }
      await deleteUser(user);
    } catch (error: any) {
      console.error('Delete account error:', error);
      if (error.code === 'auth/requires-recent-login') {
        throw new Error('Please sign in again before deleting your account');
      }
      throw new Error(error.message || 'Failed to delete account');
    }
  }

  static async updateProfile(updates: { displayName?: string; photoURL?: string }): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user is currently signed in');
      }
      await firebaseUpdateProfile(user, updates);
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  }

  // Auth State Observer
  static onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  // Current User
  static get currentUser() {
    return auth.currentUser;
  }

  static get isAuthenticated(): boolean {
    return auth.currentUser !== null;
  }
}
