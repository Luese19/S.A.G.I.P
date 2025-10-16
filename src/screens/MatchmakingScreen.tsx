import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {
  ActivityIndicator
} from 'react-native-paper';
import { getActiveQuizzes } from '../data/sampleQuizzes';
import { useAppDispatch, useAuthUser, useMatchmakingState } from '../store/hooks';
import {
  joinMatchmaking,
  leaveMatchmaking,
  listenToQueuePosition
} from '../store/slices/matchmakingSlice';

const { width, height } = Dimensions.get('window');

export const MatchmakingScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAuthUser();
  const {
    isInQueue,
    queuePosition,
    estimatedWaitTime,
    isSearching,
    matchId
  } = useMatchmakingState();

  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const [showQuizSelector, setShowQuizSelector] = useState(false);
  const [availableQuizzes] = useState(getActiveQuizzes());
  const [pulseAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));

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

  useEffect(() => {
    if (isInQueue && user?.uid) {
      // Start listening to queue position updates
      dispatch(listenToQueuePosition(user.uid));
    }

    return () => {
      // Cleanup when component unmounts
      if (user?.uid) {
        dispatch(leaveMatchmaking(user.uid));
      }
    };
  }, [isInQueue, user?.uid, dispatch]);

  const handleJoinQueue = async () => {
    if (!user?.uid) return;

    try {
      await dispatch(joinMatchmaking(user.uid)).unwrap();
    } catch (error) {
      console.error('Failed to join matchmaking:', error);
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

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
        </LinearGradient>

        <View style={styles.content}>
          {/* Queue Status */}
          {!isInQueue ? (
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
          ) : (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <LinearGradient
                colors={['#fa709a', '#fee140']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.searchingCard}
              >
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.searchingTitle}>Finding Match...</Text>
                {queuePosition && (
                  <View style={styles.queueInfoBox}>
                    <View style={styles.queueStat}>
                      <Text style={styles.queueLabel}>Position</Text>
                      <Text style={styles.queueValue}>#{queuePosition}</Text>
                    </View>
                    <View style={styles.queueDivider} />
                    <View style={styles.queueStat}>
                      <Text style={styles.queueLabel}>Est. Wait</Text>
                      <Text style={styles.queueValue}>{formatWaitTime(estimatedWaitTime)}</Text>
                    </View>
                  </View>
                )}
                <Text style={styles.searchingText}>Looking for another player...</Text>
              </LinearGradient>
            </Animated.View>
          )}

          {/* Quiz Selection */}
          {!isInQueue && (
            <>
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
                  !selectedQuiz && styles.startButtonDisabled
                ]}
                onPress={handleJoinQueue}
                disabled={!selectedQuiz}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={selectedQuiz ? ['#f093fb', '#f5576c'] : ['#ccc', '#999']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.startButtonGradient}
                >
                  <Text style={styles.startButtonText}>🎮 Find Match</Text>
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
            </>
          )}

          {/* Leave Queue Button */}
          {isInQueue && (
            <TouchableOpacity
              style={styles.leaveButton}
              onPress={handleLeaveQueue}
              activeOpacity={0.7}
            >
              <Text style={styles.leaveButtonText}>✕ Leave Queue</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
});