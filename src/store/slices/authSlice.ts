import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User as FirebaseUser } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { AuthService, AuthUser } from '../../services/firebase/auth';
import { FirestoreService } from '../../services/firebase/firestore';

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  initializationComplete: boolean;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
  initializationComplete: false,
};

// Helper function to extract only serializable data from Firebase User
const serializeFirebaseUser = (firebaseUser: FirebaseUser) => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email,
  displayName: firebaseUser.displayName,
  photoURL: firebaseUser.photoURL,
  emailVerified: firebaseUser.emailVerified,
});

// Helper function to convert Firestore Timestamps to serializable dates
const serializeTimestamp = (timestamp: any): string => {
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  return new Date().toISOString();
};

// Helper function to serialize user profile data
const serializeUserProfile = (profile: any) => ({
  ...profile,
  createdAt: profile.createdAt ? serializeTimestamp(profile.createdAt) : new Date().toISOString(),
  updatedAt: profile.updatedAt ? serializeTimestamp(profile.updatedAt) : new Date().toISOString(),
});

// Async thunks for authentication
export const initializeAuth = createAsyncThunk(
  'auth/initializeAuth',
  async (_, { rejectWithValue }) => {
    try {
      return new Promise<AuthUser | null>((resolve) => {
        const unsubscribe = AuthService.onAuthStateChanged(async (firebaseUser: any) => {
          unsubscribe();

          if (firebaseUser) {
            try {
              // Get user profile from Firestore
              const userProfile = await FirestoreService.getUserProfile(firebaseUser.uid);

              if (userProfile) {
                const authUser: AuthUser = {
                  ...serializeFirebaseUser(firebaseUser),
                  ...serializeUserProfile(userProfile),
                };
                resolve(authUser);
              } else {
                // Create new user profile if it doesn't exist
                const newProfile = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  displayName: firebaseUser.displayName || 'Anonymous',
                  xp: 0,
                  matchesPlayed: 0,
                  bestScore: 0,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };

                await FirestoreService.createUserProfile(firebaseUser.uid, {
                  ...newProfile,
                  createdAt: Timestamp.now(),
                  updatedAt: Timestamp.now(),
                });

                const authUser: AuthUser = {
                  ...serializeFirebaseUser(firebaseUser),
                  ...newProfile,
                };
                resolve(authUser);
              }
            } catch (error) {
              console.error('Error fetching user profile:', error);
              rejectWithValue('Failed to load user profile');
            }
          } else {
            resolve(null);
          }
        });
      });
    } catch (error) {
      return rejectWithValue('Authentication initialization failed');
    }
  }
);

export const signInWithEmail = createAsyncThunk(
  'auth/signInWithEmail',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const userCredential = await AuthService.signInWithEmail(email, password);
      const firebaseUser = userCredential.user;

      const userProfile = await FirestoreService.getUserProfile(firebaseUser.uid);

      if (userProfile) {
        return {
          ...serializeFirebaseUser(firebaseUser),
          ...serializeUserProfile(userProfile),
        } as AuthUser;
      }

      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Sign in failed');
    }
  }
);

export const signUpWithEmail = createAsyncThunk(
  'auth/signUpWithEmail',
  async ({ email, password, displayName }: { email: string; password: string; displayName: string }, { rejectWithValue }) => {
    try {
      const userCredential = await AuthService.signUpWithEmail(email, password);

      // Update the user profile with display name
      await AuthService.updateProfile({ displayName });

      // Create user profile in Firestore
      const newProfile = {
        uid: userCredential.user.uid,
        email: userCredential.user.email || email,
        displayName: displayName,
        xp: 0,
        matchesPlayed: 0,
        bestScore: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await FirestoreService.createUserProfile(userCredential.user.uid, {
        ...newProfile,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      return {
        ...serializeFirebaseUser(userCredential.user),
        ...newProfile,
      } as AuthUser;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Sign up failed');
    }
  }
);

export const signInWithGoogle = createAsyncThunk(
  'auth/signInWithGoogle',
  async (_, { rejectWithValue }) => {
    try {
      // Note: signInWithGoogle will throw an error indicating setup is required
      // This is expected until Google Sign-In is properly configured
      const userCredential = await AuthService.signInWithGoogle();
      const firebaseUser = userCredential.user;

      const userProfile = await FirestoreService.getUserProfile(firebaseUser.uid);

      if (userProfile) {
        return {
          ...serializeFirebaseUser(firebaseUser),
          ...userProfile,
        } as AuthUser;
      }

      return null;
    } catch (error: any) {
      // This will catch the "Google Sign-In requires additional setup" error
      return rejectWithValue(error.message || 'Google sign in failed');
    }
  }
);

export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      await AuthService.signOut();
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Sign out failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUserProfile: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setInitializationComplete: (state, action: PayloadAction<boolean>) => {
      state.initializationComplete = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize auth
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = action.payload !== null;
        state.initializationComplete = true;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.initializationComplete = true;
      })

      // Sign in with email
      .addCase(signInWithEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signInWithEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = action.payload !== null;
      })
      .addCase(signInWithEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Sign up with email
      .addCase(signUpWithEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signUpWithEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = action.payload !== null;
      })
      .addCase(signUpWithEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Sign in with Google
      .addCase(signInWithGoogle.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signInWithGoogle.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = action.payload !== null;
      })
      .addCase(signInWithGoogle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Sign out
      .addCase(signOut.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(signOut.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, updateUserProfile, setInitializationComplete } = authSlice.actions;
export default authSlice.reducer;