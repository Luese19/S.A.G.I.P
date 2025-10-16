# 🔐 Security Guidelines for S.A.G.I.P Project

## ⚠️ IMPORTANT: Before Pushing to GitHub

### Files That Should NEVER Be Committed

- ✅ `.env` - Contains your actual API keys (already in .gitignore)
- ✅ `google-services.json` - Android Firebase config (already in .gitignore)
- ✅ `GoogleService-Info.plist` - iOS Firebase config (already in .gitignore)

## 🔧 Setup Instructions for New Contributors

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/S.A.G.I.P.git
cd S.A.G.I.P
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy the example environment file:

```bash
# Windows PowerShell
Copy-Item .env.template .env

# Linux/Mac
cp .env.template .env
```

### 4. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing project
3. Go to Project Settings (gear icon)
4. Scroll to "Your apps" section
5. Copy the configuration values to your `.env` file

### 5. Configure Google Sign-In (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Firebase project
3. Go to APIs & Services > Credentials
4. Create OAuth 2.0 Client ID (Web application)
5. Copy the Client ID to your `.env` file

### 6. Setup Firebase Services

#### Firestore Database

1. Go to Firebase Console > Firestore Database
2. Create database in production mode
3. Set up security rules from `firebase-rules/firestore.rules`

#### Realtime Database

1. Go to Firebase Console > Realtime Database
2. Create database
3. Set up security rules from `firebase-rules/realtimedb.rules`

#### Authentication

1. Go to Firebase Console > Authentication
2. Enable Email/Password authentication
3. (Optional) Enable Google authentication

## 🛡️ Security Best Practices

### Firebase Security Rules

Deploy your security rules:

```bash
firebase deploy --only firestore:rules
firebase deploy --only database:rules
```

### API Key Restrictions (Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to APIs & Services > Credentials
3. Click on your API key
4. Under "Application restrictions":
   - For web: Set HTTP referrers
   - For mobile: Set Android/iOS app restrictions
5. Under "API restrictions":
   - Restrict to only required APIs (Firebase services)

### Environment Variables Checklist

- [ ] `.env` is in `.gitignore`
- [ ] `.env.template` or `.env.example` is committed (with dummy values)
- [ ] No real API keys in source code
- [ ] No hardcoded passwords or secrets
- [ ] All team members have their own `.env` file

## 🚨 What To Do If You Accidentally Commit Secrets

### 1. Immediately Rotate Your API Keys

1. Go to Firebase Console
2. Delete the exposed API key
3. Create a new one
4. Update your `.env` file

### 2. Remove from Git History

```bash
# Remove file from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push to remote
git push origin --force --all
```

Or use BFG Repo-Cleaner (easier):

```bash
# Download BFG from: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-files .env
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force --all
```

### 3. Notify Your Team

- Inform all team members about the key rotation
- Ensure everyone updates their local `.env` files

## 📋 Pre-Commit Checklist

Before running `git push`:

- [ ] Check `git status` - ensure `.env` is not staged
- [ ] Review `git diff --staged` - no secrets visible
- [ ] Run `grep -r "AIzaSy" .` to search for exposed API keys
- [ ] Verify `.gitignore` is properly configured

## 🔍 Verify Your Setup

Run this command to ensure no secrets are tracked:

```bash
git ls-files | grep -E '\.env$|google-services\.json$'
```

If any files show up, they are tracked by Git and need to be removed:

```bash
git rm --cached .env
git commit -m "Remove .env from tracking"
```

## 📞 Need Help?

If you've exposed secrets or need help with setup, contact the project maintainers immediately.

---

**Remember:** Security is everyone's responsibility! 🛡️
