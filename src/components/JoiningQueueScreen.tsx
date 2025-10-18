import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

interface JoiningQueueScreenProps {
  queuePosition: number | null;
  estimatedWaitTime: number | null; // in seconds
  elapsedTime: number; // in seconds
  connectionStatus: 'online' | 'offline' | 'connecting';
  selectedQuizTitle?: string;
  onLeaveQueue: () => void;
}

export const JoiningQueueScreen: React.FC<JoiningQueueScreenProps> = ({
  queuePosition,
  estimatedWaitTime,
  elapsedTime,
  connectionStatus,
  selectedQuizTitle,
  onLeaveQueue,
}) => {
  const [pulseAnim] = useState(new Animated.Value(1));
  const [dotsAnim] = useState(new Animated.Value(0));
  const [searchingDots, setSearchingDots] = useState('');

  // Pulse animation for the main card
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Animated dots for searching text
  useEffect(() => {
    const interval = setInterval(() => {
      setSearchingDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const formatWaitTime = (seconds: number | null): string => {
    if (!seconds) return 'Calculating...';

    if (seconds < 60) {
      return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (remainingSeconds === 0) {
      return `${minutes}m`;
    }

    return `${minutes}m ${remainingSeconds}s`;
  };

  const getMotivationalMessage = (): string => {
    if (!queuePosition) {
      return "🔍 Searching for the perfect opponent...";
    }

    if (queuePosition === 1) {
      return "🎯 You're first in line! Match incoming...";
    }

    if (queuePosition <= 3) {
      return "⚡ Almost there! You're near the front!";
    }

    if (queuePosition <= 5) {
      return "💪 Hang tight! Your match is coming soon!";
    }

    return `🎮 ${queuePosition} players ahead. Stay ready!`;
  };

  const getProgressPercentage = (): number => {
    if (!estimatedWaitTime || estimatedWaitTime === 0) return 0;
    const progress = (elapsedTime / estimatedWaitTime) * 100;
    return Math.min(progress, 95); // Cap at 95% to avoid showing 100% when still waiting
  };

  const handleLeaveQueue = () => {
    Alert.alert(
      '🚪 Leave Queue?',
      'Are you sure you want to cancel matchmaking? You will lose your place in the queue.',
      [
        {
          text: 'Stay in Queue',
          style: 'cancel',
        },
        {
          text: 'Leave Queue',
          style: 'destructive',
          onPress: onLeaveQueue,
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        {/* Animated Background Circles */}
        <View style={styles.backgroundCircles}>
          <Animated.View style={[styles.circle, styles.circle1, { transform: [{ scale: pulseAnim }] }]} />
          <Animated.View style={[styles.circle, styles.circle2, { transform: [{ scale: pulseAnim }] }]} />
          <Animated.View style={[styles.circle, styles.circle3, { transform: [{ scale: pulseAnim }] }]} />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleLeaveQueue}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Joining Queue</Text>
            {selectedQuizTitle && (
              <Text style={styles.quizTitle}>📝 {selectedQuizTitle}</Text>
            )}
          </View>

          {/* Main Searching Card */}
          <Animated.View style={[styles.searchingCard, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.searchingIconContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.searchingEmoji}>🔍</Text>
            </View>
            
            <Text style={styles.searchingTitle}>
              Finding Your Opponent{searchingDots}
            </Text>
            
            <Text style={styles.motivationalText}>
              {getMotivationalMessage()}
            </Text>

            {/* Progress Bar */}
            {estimatedWaitTime && estimatedWaitTime > 0 && (
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${getProgressPercentage()}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.round(getProgressPercentage())}% Complete
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {/* Queue Position */}
            <View style={styles.statCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.statGradient}
              >
                <Text style={styles.statIcon}>📍</Text>
                <Text style={styles.statLabel}>Queue Position</Text>
                <Text style={styles.statValue}>
                  {queuePosition ? `#${queuePosition}` : '---'}
                </Text>
              </LinearGradient>
            </View>

            {/* Elapsed Time */}
            <View style={styles.statCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.statGradient}
              >
                <Text style={styles.statIcon}>⏱️</Text>
                <Text style={styles.statLabel}>Waiting Time</Text>
                <Text style={styles.statValue}>{formatWaitTime(elapsedTime)}</Text>
              </LinearGradient>
            </View>

            {/* Estimated Wait */}
            <View style={styles.statCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.statGradient}
              >
                <Text style={styles.statIcon}>⏳</Text>
                <Text style={styles.statLabel}>Est. Wait</Text>
                <Text style={styles.statValue}>
                  {formatWaitTime(estimatedWaitTime)}
                </Text>
              </LinearGradient>
            </View>

            {/* Connection Status */}
            <View style={styles.statCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.statGradient}
              >
                <Text style={styles.statIcon}>
                  {connectionStatus === 'online' ? '🟢' : connectionStatus === 'offline' ? '🔴' : '🟡'}
                </Text>
                <Text style={styles.statLabel}>Status</Text>
                <Text style={styles.statValue}>
                  {connectionStatus === 'online' ? 'Online' : connectionStatus === 'offline' ? 'Offline' : 'Connecting'}
                </Text>
              </LinearGradient>
            </View>
          </View>

          {/* Tips Section */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 While You Wait</Text>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>Stay on this screen for the fastest matching</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>Your spot in queue is reserved</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>You'll be notified when a match is found</Text>
            </View>
          </View>

          {/* Leave Queue Button */}
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={handleLeaveQueue}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(255,59,48,0.8)', 'rgba(255,149,0,0.8)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.leaveButtonGradient}
            >
              <Text style={styles.leaveButtonText}>✕ Cancel & Leave Queue</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  backgroundCircles: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circle1: {
    width: 300,
    height: 300,
    top: -100,
    right: -50,
  },
  circle2: {
    width: 200,
    height: 200,
    bottom: 100,
    left: -50,
  },
  circle3: {
    width: 150,
    height: 150,
    top: height / 2,
    right: -30,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    zIndex: 10,
  },
  backButtonText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: -2,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  quizTitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  searchingCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  searchingIconContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  searchingEmoji: {
    fontSize: 48,
    position: 'absolute',
    top: 15,
    left: 15,
  },
  searchingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  motivationalText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 20,
  },
  progressBarContainer: {
    width: '100%',
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  tipsCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  tipBullet: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
  },
  leaveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 'auto',
  },
  leaveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  leaveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});
