import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  initializeAuth
} from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { Platform } from 'react-native';

// Firebase configuration - Replace with your actual Firebase project config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyArTnbufndVxtid421vppWCkNxto9q-XpM",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "sagip-gamedev.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "sagip-gamedev",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "sagip-gamedev.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1031308192235",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:1031308192235:web:38749e10b9c4a8c66a11ae",
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || "https://sagip-gamedev-default-rtdb.firebaseio.com/",
};

// Validate Firebase configuration on startup
const validateFirebaseConfig = (): boolean => {
  const requiredFields: (keyof typeof firebaseConfig)[] = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
    'databaseURL'
  ];
  
  const missingFields = requiredFields.filter(
    field => !firebaseConfig[field] || 
    String(firebaseConfig[field]).startsWith('your-')
  );
  
  if (missingFields.length > 0) {
    console.warn(
      '⚠️ Firebase configuration incomplete. Missing or default values for:',
      missingFields.join(', ')
    );
    console.warn('Please update your .env file with proper Firebase credentials.');
    return false;
  }
  
  console.log('✅ Firebase configuration validated successfully');
  return true;
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Validate configuration on initialization
validateFirebaseConfig();

// Initialize Firebase Auth with appropriate persistence for the platform
// For React Native, we use browserLocalPersistence which works via AsyncStorage polyfill
let auth;
try {
  if (Platform.OS === 'web') {
    // Web uses default browser persistence
    auth = getAuth(app);
  } else {
    // React Native: Initialize with local persistence
    auth = initializeAuth(app, {
      persistence: browserLocalPersistence,
    });
  }
} catch (error: any) {
  // If auth is already initialized, get the existing instance
  if (error.code === 'auth/already-initialized') {
    auth = getAuth(app);
  } else {
    console.error('Firebase Auth initialization error:', error);
    // Fallback to default initialization
    auth = getAuth(app);
  }
}

export { auth };

export const database = getDatabase(app);
export const firestore = getFirestore(app);
export const functions = getFunctions(app);

// Export configuration for use in services
export { firebaseConfig };
export default app;
