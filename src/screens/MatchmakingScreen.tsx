import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import {
    ActivityIndicator,
    Portal,
    Snackbar
} from 'react-native-paper';
import { getActiveQuizzes } from '../data/sampleQuizzes';
import { AuthService } from '../services/firebase/auth';
import { useAppDispatch, useAuthUser, useMatchmaking } from '../store/hooks';
import {
    joinMatchmaking,
    leaveMatchmaking
} from '../store/slices/matchmakingSlice';

const { width, height } = Dimensions.get('window');

export const MatchmakingScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAuthUser();
  const matchmakingState = useMatchmaking();
  const {
    isInQueue,
    queuePosition,
    estimatedWaitTime,
    isSearching,
    matchId,
    error: matchmakingError
  } = matchmakingState;

  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const [showQuizSelector, setShowQuizSelector] = useState(false);
  const [availableQuizzes] = useState(getActiveQuizzes());
  const [pulseAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isJoiningQueue, setIsJoiningQueue] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'connecting'>('connecting');
  
  // Track if we've already navigated to joining-queue to prevent loops
  const hasNavigatedRef = useRef(false);

  // Enhanced authentication validation
  const validateAuthentication = useCallback(async () => {
    if (!isAuthenticated || !user?.uid) {
      setSnackbarMessage('Please log in to access matchmaking');
      setSnackbarVisible(true);
      return false;
    }

    setIsAuthenticating(true);
    try {
      // Verify Firebase auth state
      const currentUser = AuthService.currentUser;
      if (!currentUser || currentUser.uid !== user.uid) {
        setSnackbarMessage('Authentication verification failed. Please log in again.');
        setSnackbarVisible(true);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Authentication validation error:', error);
      setSnackbarMessage('Authentication error. Please try logging in again.');
      setSnackbarVisible(true);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, [isAuthenticated, user?.uid]);

  // Firebase connection monitoring
  useEffect(() => {
    const checkConnection = () => {
      // Basic connection check - in a real app you'd use NetInfo or Firebase connection monitoring
      // navigator.onLine is not available in React Native, so we default to online
      setConnectionStatus('online');
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (isInQueue) {
      // Pulse animation when searching
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isInQueue]);

  // Handle match found
  useEffect(() => {
    if (matchId) {
      console.log('[MatchmakingScreen] Match found:', matchId);
      setSnackbarMessage('🎉 Match found! Check your match details.');
      setSnackbarVisible(true);

      // Show match details and navigation options
      setTimeout(() => {
        Alert.alert(
          '🎮 Match Found!',
          `Your match is ready!\n\nMatch ID: ${matchId}\n\nYou can now return to the main screen to view your match details and start playing.`,
          [
            { text: 'Stay Here', style: 'cancel' },
            { text: 'Go to Main', onPress: () => router.push('/') }
          ]
        );
      }, 1500);
    }
  }, [matchId]);

  // Handle errors
  useEffect(() => {
    if (matchmakingError) {
      console.error('[MatchmakingScreen] Matchmaking error:', matchmakingError);

      // Provide specific error messages based on error type
      let errorMessage = matchmakingError;
      if (matchmakingError.includes('authenticated') || matchmakingError.includes('auth')) {
        errorMessage = 'Authentication error. Please log in again.';
      } else if (matchmakingError.includes('network') || matchmakingError.includes('connection')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (matchmakingError.includes('permission') || matchmakingError.includes('denied')) {
        errorMessage = 'Permission error. Please try logging in again.';
      }

      setSnackbarMessage(errorMessage);
      setSnackbarVisible(true);
    }
  }, [matchmakingError]);

  const handleJoinQueue = async () => {
    if (!user?.uid) {
      setSnackbarMessage('Please log in to join matchmaking');
      setSnackbarVisible(true);
      return;
    }

    // Validate authentication before joining queue
    const isAuthValid = await validateAuthentication();
    if (!isAuthValid) {
      return;
    }

    // Check if quiz is selected
    if (!selectedQuiz) {
      setSnackbarMessage('Please select a quiz type first');
      setSnackbarVisible(true);
      return;
    }

    // Check connection status
    if (connectionStatus === 'offline') {
      setSnackbarMessage('No internet connection. Please check your connection and try again.');
      setSnackbarVisible(true);
      return;
    }

    setIsJoiningQueue(true);
    try {
      console.log('[MatchmakingScreen] Joining matchmaking queue for user:', user.uid);
      await dispatch(joinMatchmaking(user.uid)).unwrap();
      setSnackbarMessage('Joined matchmaking queue successfully!');
      setSnackbarVisible(true);
    } catch (error: any) {
      console.error('[MatchmakingScreen] Failed to join matchmaking:', error);
      // Provide specific error messages based on error type
      let errorMessage = 'Failed to join matchmaking queue';
      if (error.message) {
        if (error.message.includes('authenticated') || error.message.includes('auth')) {
          errorMessage = '🔒 Authentication error. Please log in again.';
        } else if (error.message.includes('network') || error.message.includes('connection')) {
          errorMessage = '🌐 Network error. Please check your connection.';
        } else if (error.message.includes('permission') || error.message.includes('denied')) {
          errorMessage = '🚫 Permission denied. Please try logging in again.';
        } else if (error.message.includes('timeout')) {
          errorMessage = '⏱️ Request timeout. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      setSnackbarMessage(errorMessage);
      setSnackbarVisible(true);
    } finally {
      setIsJoiningQueue(false);
    }
  };

  const handleLeaveQueue = async () => {
    if (!user?.uid) return;

    try {
      await dispatch(leaveMatchmaking(user.uid)).unwrap();
    } catch (error) {
      console.error('Failed to leave matchmaking:', error);
    }
  };

  const formatWaitTime = (seconds: number | null): string => {
    if (!seconds) return 'Calculating...';

    if (seconds < 60) {
      return `${seconds} seconds`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (remainingSeconds === 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }

    return `${minutes}m ${remainingSeconds}s`;
  };

  // Reset navigation flag when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      hasNavigatedRef.current = false;
    }, [])
  );

  // Navigate to joining queue screen when user joins queue
  useEffect(() => {
    if (isInQueue && !hasNavigatedRef.current) {
      console.log('[MatchmakingScreen] Navigating to joining-queue');
      hasNavigatedRef.current = true;
      router.push('/joining-queue');
    }
  }, [isInQueue]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header with Gradient */}
          <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quick Match</Text>
          <Text style={styles.headerSubtitle}>
            🎮 Challenge players in real-time DRRM quizzes
          </Text>

          {/* Connection Status Indicator */}
          <View style={styles.connectionStatus}>
            <View style={[
              styles.connectionDot,
              { backgroundColor: connectionStatus === 'online' ? '#4CAF50' : connectionStatus === 'offline' ? '#f44336' : '#FF9800' }
            ]} />
            <Text style={styles.connectionText}>
              {connectionStatus === 'online' ? '🟢 Online' : connectionStatus === 'offline' ? '🔴 Offline' : '🟡 Connecting...'}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Ready to Play Card */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <LinearGradient
              colors={['#4facfe', '#00f2fe']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.readyCard}
            >
              <Text style={styles.readyEmoji}>🎯</Text>
              <Text style={styles.readyTitle}>Ready to Play!</Text>
              <Text style={styles.readyText}>
                Choose a quiz and find your opponent
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Quiz Selection */}
          <View style={styles.section}>
                <Text style={styles.sectionTitle}>Choose Quiz Type</Text>
                <View style={styles.quizGrid}>
                  {availableQuizzes.map((quiz, index) => (
                    <TouchableOpacity
                      key={quiz.id}
                      style={[
                        styles.quizCard,
                        selectedQuiz === quiz.id && styles.quizCardSelected
                      ]}
                      onPress={() => setSelectedQuiz(quiz.id)}
                      activeOpacity={0.7}
                    >
                      <LinearGradient
                        colors={
                          index === 0 ? ['#43e97b', '#38f9d7'] :
                          index === 1 ? ['#fa709a', '#fee140'] :
                          ['#30cfd0', '#330867']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.quizCardGradient}
                      >
                        <Text style={styles.quizEmoji}>
                          {index === 0 ? '🛡️' : index === 1 ? '📋' : '🚨'}
                        </Text>
                        <Text style={styles.quizTitle}>{quiz.title}</Text>
                        {selectedQuiz === quiz.id && (
                          <View style={styles.selectedBadge}>
                            <Text style={styles.selectedText}>✓</Text>
                          </View>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Start Button */}
              <TouchableOpacity
                style={[
                  styles.startButton,
                  (!selectedQuiz || isJoiningQueue) && styles.startButtonDisabled
                ]}
                onPress={handleJoinQueue}
                disabled={!selectedQuiz || isJoiningQueue}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    selectedQuiz && !isJoiningQueue
                      ? ['#f093fb', '#f5576c']
                      : ['#ccc', '#999']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.startButtonGradient}
                >
                  {isJoiningQueue ? (
                    <>
                      <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.startButtonText}>Joining Queue...</Text>
                    </>
                  ) : (
                    <Text style={styles.startButtonText}>🎮 Find Match</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* How It Works */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>How It Works</Text>
                <View style={styles.stepsCard}>
                  {[
                    { icon: '1️⃣', text: 'Choose your preferred quiz type' },
                    { icon: '2️⃣', text: 'Join the matchmaking queue' },
                    { icon: '3️⃣', text: 'Get matched with another player' },
                    { icon: '4️⃣', text: 'Answer questions in real-time' },
                  ].map((step, index) => (
                    <View key={index} style={styles.stepItem}>
                      <Text style={styles.stepIcon}>{step.icon}</Text>
                      <Text style={styles.stepText}>{step.text}</Text>
                    </View>
                  ))}
                </View>
              </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Snackbar for notifications */}
      <Portal>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={4000}
          style={styles.snackbar}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    padding: 16,
    marginTop: -20,
  },
  readyCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  readyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  readyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  readyText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  searchingCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  searchingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 20,
  },
  queueInfoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  queueStat: {
    flex: 1,
    alignItems: 'center',
  },
  queueLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  queueValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  queueDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
  },
  searchingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  quizGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  quizCard: {
    width: (width - 44) / 2,
    marginHorizontal: 6,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  quizCardSelected: {
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  quizCardGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
    position: 'relative',
  },
  quizEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  startButton: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonGradient: {
    padding: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  leaveButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f44336',
    marginTop: 16,
  },
  leaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f44336',
  },
  bottomSpacing: {
    height: 40,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginHorizontal: 20,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  snackbar: {
    backgroundColor: '#333',
    marginBottom: 80,
  },
  queueProgressContainer: {
    width: '100%',
    marginTop: 16,
  },
  progressIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  progressItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    fontSize: 24,
    marginBottom: 4,
  },
  progressText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  motivationalContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  motivationalEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  motivationalText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});