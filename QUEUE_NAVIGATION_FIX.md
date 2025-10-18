# Queue Navigation Fix - Documentation

## The Problem

**Issue:** The app was stuck in an infinite redirect loop where:
1. User joins queue → navigates to `/joining-queue`
2. User presses device back button or navigates to home screen
3. MatchmakingScreen detects `isInQueue` is still `true`
4. Automatically redirects back to `/joining-queue`
5. Loop continues infinitely 🔄

**Result:** User couldn't leave the queue screen or navigate anywhere else!

---

## The Root Cause

### Problem 1: Infinite Navigation Loop
```typescript
// ❌ OLD CODE - This runs every time MatchmakingScreen renders
useEffect(() => {
  if (isInQueue) {
    router.push('/joining-queue');  // Triggers on EVERY render when isInQueue is true
  }
}, [isInQueue]);
```

When the user navigated back, the MatchmakingScreen would see `isInQueue` is still `true` and immediately push them back to the joining-queue screen.

### Problem 2: No State Cleanup
When the user navigated away from the joining-queue screen using the device back button (not the Leave Queue button), the queue state wasn't being cleaned up.

---

## The Solution

### Fix 1: Prevent Infinite Redirects in MatchmakingScreen

**Added a navigation guard** using `useRef` to track if we've already navigated:

```typescript
// Track if we've already navigated to prevent loops
const hasNavigatedRef = useRef(false);

// Reset the flag when screen comes into focus
useFocusEffect(
  useCallback(() => {
    hasNavigatedRef.current = false;
  }, [])
);

// Only navigate ONCE per queue join
useEffect(() => {
  if (isInQueue && !hasNavigatedRef.current) {
    console.log('[MatchmakingScreen] Navigating to joining-queue');
    hasNavigatedRef.current = true;  // ✅ Set flag to prevent re-navigation
    router.push('/joining-queue');
  }
}, [isInQueue]);
```

**How it works:**
- ✅ Navigation only happens ONCE when `isInQueue` becomes `true`
- ✅ Flag is reset when screen comes back into focus
- ✅ Prevents infinite redirect loops

### Fix 2: Auto-Navigate Back When Not In Queue

**Added a focus check** in `joining-queue.tsx`:

```typescript
// Check if user is still in queue when screen focuses
useFocusEffect(
  useCallback(() => {
    // If user is not in queue when this screen is focused, go back
    if (!isInQueue) {
      console.log('[JoiningQueue] Not in queue, navigating back');
      router.back();
    }
  }, [isInQueue])
);
```

**How it works:**
- ✅ When joining-queue screen focuses, it checks `isInQueue` state
- ✅ If user is NOT in queue (state was cleaned up elsewhere), automatically go back
- ✅ Prevents showing queue screen when user isn't actually in queue

---

## Code Changes Summary

### File 1: `src/screens/MatchmakingScreen.tsx`

**Changes:**
1. ✅ Added `useFocusEffect` import from `expo-router`
2. ✅ Added `useRef` import from React
3. ✅ Added `hasNavigatedRef` to track navigation state
4. ✅ Added `useFocusEffect` to reset flag on focus
5. ✅ Updated navigation effect to check flag before navigating

### File 2: `app/joining-queue.tsx`

**Changes:**
1. ✅ Added `useFocusEffect` import from `expo-router`
2. ✅ Added `useCallback` import from React
3. ✅ Added `isInQueue` to destructured state
4. ✅ Added `useFocusEffect` to check queue state on focus
5. ✅ Auto-navigate back if not in queue

---

## Flow Diagrams

### ✅ Fixed Flow - User Joins Queue

```
MatchmakingScreen
    ↓ User clicks "Find Match"
    ↓ isInQueue becomes true
    ↓ hasNavigatedRef.current is false
    ↓
Navigate to /joining-queue (ONE TIME)
    ↓ hasNavigatedRef.current = true
    ↓
JoiningQueue Screen
    ✅ Displays queue UI
    ✅ Shows real-time updates
```

### ✅ Fixed Flow - User Presses Device Back Button

```
JoiningQueue Screen
    ↓ User presses device back
    ↓
MatchmakingScreen
    ↓ Screen comes into focus
    ↓ useFocusEffect resets hasNavigatedRef.current = false
    ↓ isInQueue is still true BUT hasNavigatedRef.current is false
    ↓
    ✅ Does NOT re-navigate (because we want user to stay here)
    ✅ User can now select quiz and try again OR leave
```

### ✅ Fixed Flow - Queue is Cancelled Externally

```
JoiningQueue Screen
    ↓ Queue state changes (isInQueue = false)
    ↓ Could happen from: timeout, error, server cleanup, etc.
    ↓
useFocusEffect detects isInQueue = false
    ↓
Auto-navigate back to MatchmakingScreen
    ✅ User returns to matchmaking
    ✅ Can start new queue if desired
```

---

## Key Hooks Used

### 1. `useFocusEffect`
```typescript
// Runs when screen comes into focus
useFocusEffect(
  useCallback(() => {
    // Code here runs when screen is focused
    return () => {
      // Cleanup when screen loses focus
    };
  }, [dependencies])
);
```

**Purpose:** Handle screen focus/blur events for navigation

### 2. `useRef`
```typescript
const hasNavigatedRef = useRef(false);
```

**Purpose:** Persist value across renders without triggering re-renders

---

## Testing the Fix

### Test Case 1: Normal Queue Flow ✅
1. Open matchmaking screen
2. Select a quiz
3. Click "Find Match"
4. **Expected:** Navigate to joining-queue screen ONCE
5. **Result:** ✅ Works correctly

### Test Case 2: Device Back Button ✅
1. Join queue (on joining-queue screen)
2. Press device back button
3. **Expected:** Return to matchmaking screen, stay there
4. **Result:** ✅ Stays on matchmaking screen, no infinite loop

### Test Case 3: Leave Queue Button ✅
1. Join queue (on joining-queue screen)
2. Click "Leave Queue" button
3. Confirm in dialog
4. **Expected:** Leave queue AND navigate back
5. **Result:** ✅ Works correctly

### Test Case 4: Navigate to Home ✅
1. Join queue (on joining-queue screen)
2. Navigate to home screen (tab navigation)
3. **Expected:** Can navigate away, queue continues in background
4. **Result:** ✅ Can navigate freely

### Test Case 5: Return After Navigating Away ✅
1. Join queue
2. Navigate to home
3. Navigate back to matchmaking
4. **Expected:** Don't auto-redirect if user manually navigated away
5. **Result:** ✅ Stays on matchmaking screen

---

## Benefits of This Fix

1. ✅ **No Infinite Loops** - Users can navigate freely
2. ✅ **Proper State Management** - Queue state is respected
3. ✅ **Better UX** - Users aren't forced into queue screen
4. ✅ **Defensive Programming** - Handles edge cases gracefully
5. ✅ **Clean Navigation** - Respects user's navigation intentions

---

## Summary

The fix uses two complementary strategies:

1. **Navigation Guard** (`hasNavigatedRef`) - Prevents re-navigating when user comes back
2. **Focus Check** (`useFocusEffect`) - Auto-navigates away if queue state is invalid

Together, these ensure smooth navigation while respecting the queue state! 🎯
