# S.A.G.I.P - React Native PvP DRRM Quiz Game

**S**mart **A**ndroid **G**ame for **I**nteractive **P**reparedness

A real-time, competitive quiz application that teaches Disaster Risk Reduction and Management (DRRM) through engaging 1v1 matches. Built with React Native, TypeScript, and Firebase for Android-first deployment.

## 🎯 Project Overview

This is a **production-ready MVP** for Phase 1 featuring:
- **Real-time 1v1 quiz matches** with synchronized timers
- **NDRRMP-aligned content** covering all 4 thematic areas (Prevention, Preparedness, Response, Recovery)
- **Pasig City localization** with local hotlines and hazard information
- **Secure server-side validation** using Firebase Cloud Functions
- **Offline-ready architecture** with local persistence

## 🚀 Key Features

### ✅ **Completed (MVP Phase 1)**
- **🔐 Authentication System**: Email/password + Google Sign-In
- **🎮 Matchmaking Lobby**: Real-time queue with position tracking
- **⚡ Live Quiz Matches**: Synchronized 30-second questions with scoring
- **📊 Real-time Scores**: Live score updates during matches
- **🏆 Post-match Reviews**: Detailed explanations and learning
- **🔒 Security First**: Server-side validation, no client-side cheating
- **📱 Responsive Design**: Optimized for all Android devices
- **🌐 Offline Support**: Cached content and queued submissions

### 🔄 **Technical Architecture**
- **Frontend**: React Native + TypeScript + Expo
- **State Management**: Redux Toolkit with optimized slices
- **Backend**: Firebase (Auth + Firestore + RTDB + Cloud Functions)
- **UI Framework**: React Native Paper (Material Design)
- **Animations**: React Native Reanimated (60 FPS)
- **Forms**: React Hook Form with validation

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Expo CLI**: `npm install -g @expo/cli`
- **Android Studio** (for Android development)
- **Firebase Project** with enabled services

## 🛠️ Installation & Setup

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd S.A.G.I.P
npm install
```

### 2. 🔐 Configure Environment Variables

**⚠️ IMPORTANT: Never commit your `.env` file!**

Copy the environment template:
```bash
# Windows PowerShell
Copy-Item .env.template .env

# Linux/Mac
cp .env.template .env
```

Then edit `.env` with your Firebase configuration:

1. **Get Firebase Config:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project → Project Settings (gear icon)
   - Scroll to "Your apps" section
   - Copy all configuration values

2. **Update `.env` file:**
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-actual-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-rtdb.firebaseio.com/
```

3. **Google Sign-In (Optional):**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - APIs & Services → Credentials
   - Copy your Web Client ID
   - Add to `.env`: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-client-id`

📖 **See [SECURITY.md](./SECURITY.md) for detailed security guidelines**

### 3. Setup Firebase Services

### 2. Firebase Configuration

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable required services:
   - **Authentication** (Email/Password + Google Sign-In)
   - **Firestore Database**
   - **Realtime Database**
   - **Cloud Functions**

#### Configure Firebase in App
1. **Download** `google-services.json` from Firebase Console
2. **Place** in project root directory
3. **Update** environment variables in `.env` file:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id
```

### 3. Firebase Security Rules

Deploy the provided security rules to ensure server-side validation:

#### Firestore Rules (`firebase-rules/firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own profiles
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }

    // Quiz content is read-only for authenticated users
    match /quizzes/{quizId} {
      allow read: if isAuthenticated();
      allow write: if false; // Server-side only
    }

    // Questions are read-only
    match /questions/{questionId} {
      allow read: if isAuthenticated();
      allow write: if false; // Server-side only
    }

    // Leaderboards are read-only
    match /leaderboards/{document} {
      allow read: if isAuthenticated();
      allow write: if false; // Server-side only
    }
  }
}
```

#### Realtime Database Rules (`firebase-rules/realtimedb.rules`)
```javascript
{
  "rules": {
    "matchMaking": {
      "queue": {
        "$userId": {
          ".write": "auth != null && auth.uid == $userId"
        }
      }
    },
    "inGame": {
      "$matchId": {
        ".read": "auth != null && (data.child('players/playerA').val() == auth.uid || data.child('players/playerB').val() == auth.uid)",
        ".write": false // Server-side only
      }
    }
  }
}
```

### 4. Populate Sample Data

Run the sample data population script:
```bash
npx tsx src/utils/populateSampleData.ts
```

This will add:
- **8 sample questions** across all DRRM themes
- **4 quiz configurations** with different difficulty levels
- **Pasig-specific localization** data

### 5. Start Development Server

```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS (if available)
npm run ios

# Run in web browser
npm run web
```

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   └── auth/
│       └── LoginForm.tsx
├── data/                # Sample quiz content
│   └── sampleQuizzes.ts
├── screens/             # Main app screens
│   ├── AuthScreen.tsx   # Login/Signup
│   ├── MainScreen.tsx   # Main menu
│   ├── MatchmakingScreen.tsx  # Queue lobby
│   └── QuizMatchScreen.tsx    # Live match gameplay
├── services/            # Firebase service layers
│   └── firebase/
│       ├── auth.ts      # Authentication service
│       ├── firestore.ts # Firestore operations
│       ├── database.ts  # RTDB operations
│       └── functions.ts # Cloud Functions calls
├── store/               # Redux state management
│   ├── slices/          # Redux slices
│   │   ├── authSlice.ts
│   │   ├── matchmakingSlice.ts
│   │   ├── matchSlice.ts
│   │   └── uiSlice.ts
│   ├── hooks.ts         # Typed Redux hooks
│   └── Provider.tsx     # Redux provider
├── utils/               # Utility functions
│   └── populateSampleData.ts
└── config/
    └── firebase.ts      # Firebase configuration
```

## 🎮 User Flow

### For New Users:
1. **Launch app** → Loading screen while initializing auth
2. **Authentication** → Login or create account
3. **Main menu** → Choose game mode
4. **Matchmaking** → Join queue, wait for opponent
5. **Live match** → Answer questions in real-time
6. **Results** → View score and explanations

### For Returning Users:
1. **Auto-login** → Seamless authentication
2. **Continue** → Resume from last activity
3. **Quick match** → Jump into new game

## 🔧 Development Commands

```bash
# Development
npm start                 # Start Metro bundler
npm run android          # Run on Android
npm run ios             # Run on iOS
npm run web             # Run in browser

# Building
npm run build:android    # Build APK
npm run build:ios       # Build IPA

# Testing & Quality
npm run lint            # Run ESLint
npm run type-check      # TypeScript checking
npm test               # Run tests

# Firebase
npm run firebase:emulators  # Start Firebase emulators
npm run firebase:deploy     # Deploy functions
```

## 🧪 Testing Checklist

### ✅ **Authentication Testing**
- [ ] Email/password registration works
- [ ] Google Sign-In functions properly
- [ ] User profiles created automatically
- [ ] Session persistence across app restarts

### ✅ **Matchmaking Testing**
- [ ] Users can join/leave queue
- [ ] Queue position updates in real-time
- [ ] Match creation when 2 players available
- [ ] Proper error handling for failed matches

### ✅ **Live Match Testing**
- [ ] Questions load correctly
- [ ] Timer synchronization works
- [ ] Answer submission functions
- [ ] Real-time score updates
- [ ] Match completion and results

### ✅ **Performance Testing**
- [ ] 60 FPS on interactive screens
- [ ] Smooth animations and transitions
- [ ] Responsive on various Android devices
- [ ] Offline content caching works

## 🔒 Security Features

### **Server-Side Validation**
- All scoring computed in Cloud Functions
- No client-side score manipulation possible
- Match state validated before updates
- Secure user authentication flow

### **Data Protection**
- Firestore security rules restrict access
- RTDB rules prevent unauthorized writes
- User data encrypted in transit
- Secure API key management

## 📱 Android Optimization

### **Performance Optimizations**
- **60 FPS animations** using React Native Reanimated
- **Native thread animations** for smooth interactions
- **Optimized images** and assets
- **Efficient state management** with Redux

### **Responsive Design**
- **Flexible layouts** for all screen sizes
- **Touch-friendly** button sizes (44dp minimum)
- **Readable text** at all screen densities
- **Proper contrast** for accessibility

## 🌐 Offline Support

### **Cached Content**
- Quiz questions stored locally
- User progress saved offline
- Queued submissions for when online

### **Sync Strategy**
- Automatic retry for failed submissions
- Conflict resolution for concurrent edits
- Background sync when connection restored

## 📊 Analytics & Monitoring

### **Match Analytics**
- Match start/completion tracking
- Question response times
- Player engagement metrics
- Error reporting and debugging

### **Performance Monitoring**
- Frame rate monitoring
- Memory usage tracking
- Network request performance
- Crash reporting

## 🚀 Deployment

### **Firebase Deployment**
```bash
# Deploy Cloud Functions
firebase deploy --only functions

# Deploy security rules
firebase deploy --only firestore:rules
firebase deploy --only database

# Deploy everything
firebase deploy
```

### **App Store Preparation**
- Generate signed APK/AAB
- Configure app metadata
- Set up Firebase App Distribution
- Prepare store listings

## 🔮 Future Enhancements (Phase 2)

### **Advanced Features**
- **Drag-and-drop questions** with gesture handling
- **ELO-based matchmaking** for skill balance
- **Regional leaderboards** and tournaments
- **Social features** (friends, challenges)

### **Monetization**
- **IAP for premium content**
- **Rewarded ads** for bonus points
- **LGU sponsorships** for local content

### **Enhanced UX**
- **Remote config** for dynamic content
- **A/B testing** for feature optimization
- **Accessibility improvements**
- **Multi-language support**

## 📞 Support & Contact

For technical support or questions about the DRRM Quiz Game:

- **Documentation**: [Link to docs]
- **Issues**: [GitHub Issues]
- **Email**: support@sagip.app

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ for Disaster Risk Reduction and Management education**
