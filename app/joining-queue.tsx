import { JoiningQueueScreen } from '@/src/components/JoiningQueueScreen';
import { useAppDispatch, useAuthUser, useMatchmaking } from '@/src/store/hooks';
import { cleanupQueueListener, leaveMatchmaking, listenToQueuePosition } from '@/src/store/slices/matchmakingSlice';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';

export default function JoiningQueue() {
  const dispatch = useAppDispatch();
  const { user } = useAuthUser();
  const matchmakingState = useMatchmaking();
  const {
    isInQueue,
    queuePosition,
    estimatedWaitTime,
    matchId,
  } = matchmakingState;

  const [queueStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'connecting'>('online');

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

  // Track elapsed time in queue
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - queueStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [queueStartTime]);

  // Listen to queue position updates
  useEffect(() => {
    if (user?.uid) {
      console.log('[JoiningQueue] Starting queue position listener for user:', user.uid);
      dispatch(listenToQueuePosition(user.uid));
    }

    return () => {
      console.log('[JoiningQueue] Cleaning up queue listener');
      dispatch(cleanupQueueListener());
    };
  }, [user?.uid, dispatch]);

  // Handle match found - navigate to match screen
  useEffect(() => {
    if (matchId) {
      console.log('[JoiningQueue] Match found:', matchId);
      // Navigate to the match screen or main screen
      router.replace('/'); // You can change this to navigate to the actual match screen
    }
  }, [matchId]);

  const handleLeaveQueue = async () => {
    if (!user?.uid) return;

    try {
      await dispatch(leaveMatchmaking(user.uid)).unwrap();
      // Navigate back to matchmaking screen
      router.back();
    } catch (error) {
      console.error('Failed to leave matchmaking:', error);
      // Still navigate back even if there's an error
      router.back();
    }
  };

  return (
    <JoiningQueueScreen
      queuePosition={queuePosition}
      estimatedWaitTime={estimatedWaitTime}
      elapsedTime={elapsedTime}
      connectionStatus={connectionStatus}
      selectedQuizTitle={undefined} // You can pass this via route params if needed
      onLeaveQueue={handleLeaveQueue}
    />
  );
}
