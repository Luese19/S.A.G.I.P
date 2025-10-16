import { getApp, getApps, initializeApp } from 'firebase/app';
// Auth functions - Firebase 12.4.0 uses indexedDB for web, memory for React Native
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Firebase configuration - Replace with your actual Firebase project config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:123456789:android:abcdef123456",
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || "https://your-project-default-rtdb.firebaseio.com/",
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

// Initialize Firebase services
// Note: Firebase v12.4.0 uses memory-based persistence for React Native
// For production, consider upgrading to Firebase v13+ for better persistence support
// or using @react-native-firebase/auth for native persistence
export const auth = getAuth(app);
export const database = getDatabase(app);
export const firestore = getFirestore(app);
export const functions = getFunctions(app);

// Export configuration for use in services
export { firebaseConfig };
export default app;
