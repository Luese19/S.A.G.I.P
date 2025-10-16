import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  ActivityIndicator,
  Modal,
  Portal,
  ProgressBar,
  Text
} from 'react-native-paper';
import { useAppDispatch, useAuthUser, useMatchState } from '../store/hooks';
import {
  advanceToNextQuestion,
  clearSelectedAnswer,
  loadMatch,
  selectAnswer,
  setTimeRemaining,
  submitAnswer
} from '../store/slices/matchSlice';

const { width, height } = Dimensions.get('window');

interface QuizMatchScreenProps {
  matchId: string;
}

export const QuizMatchScreen: React.FC<QuizMatchScreenProps> = ({ matchId }) => {
  const dispatch = useAppDispatch();
  const { user } = useAuthUser();
  const {
    currentMatch,
    currentQuestionIndex,
    timeRemaining,
    selectedAnswer,
    isAnswering,
    playerScore,
    opponentScore,
    matchStatus,
    questions
  } = useMatchState();

  const [timerAnimation] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    explanation: string;
    pointsEarned: number;
  } | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = currentMatch ? (currentQuestionIndex + 1) / currentMatch.questions.length : 0;

  // Fade in animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentQuestionIndex]);

  useEffect(() => {
    if (matchId && user?.uid) {
      dispatch(loadMatch(matchId));
    }
  }, [matchId, user?.uid, dispatch]);

  useEffect(() => {
    if (timeRemaining > 0 && matchStatus === 'active') {
      const timer = setInterval(() => {
        dispatch(setTimeRemaining(timeRemaining - 1));
      }, 1000);

      return () => clearInterval(timer);
    } else if (timeRemaining === 0 && matchStatus === 'active') {
      // Time's up - auto-submit or move to next question
      handleTimeUp();
    }
  }, [timeRemaining, matchStatus, dispatch]);

  useEffect(() => {
    // Animate timer bar
    Animated.timing(timerAnimation, {
      toValue: timeRemaining / 30, // Assuming 30 second questions
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [timeRemaining]);

  const handleTimeUp = () => {
    if (selectedAnswer) {
      handleSubmitAnswer();
    } else {
      // No answer selected, move to next question
      setTimeout(() => {
        dispatch(advanceToNextQuestion());
      }, 2000);
    }
  };

  const handleAnswerSelect = (answerId: string) => {
    if (isAnswering) return;

    dispatch(selectAnswer(answerId));
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !currentQuestion || !user?.uid || !currentMatch) {
      return;
    }

    try {
      const result = await dispatch(submitAnswer({
        matchId: currentMatch.id,
        playerUid: user.uid,
        questionId: currentQuestion.id,
        answerId: selectedAnswer,
        timeSpent: 30 - timeRemaining, // Calculate time spent
      })).unwrap();

      setLastResult({
        isCorrect: result.isCorrect,
        correctAnswer: result.correctAnswer || '',
        explanation: result.explanation || '',
        pointsEarned: result.pointsEarned,
      });
      setShowResult(true);

      // Auto-advance after showing result
      setTimeout(() => {
        setShowResult(false);
        dispatch(clearSelectedAnswer());
        dispatch(advanceToNextQuestion());
      }, 3000);

    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  const getTimerColor = () => {
    if (timeRemaining > 20) return '#4CAF50'; // Green
    if (timeRemaining > 10) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const renderQuestion = () => {
    if (!currentQuestion) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading question...</Text>
        </View>
      );
    }

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <LinearGradient
          colors={['#ffffff', '#f8f9fa']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.questionCard}
        >
          <View style={styles.questionHeader}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.themeChip}
            >
              <Text style={styles.themeText}>{currentQuestion.theme}</Text>
            </LinearGradient>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>
                🏆 {currentQuestion.pointsBase} pts
              </Text>
            </View>
          </View>

          <Text style={styles.questionTitle}>
            {currentQuestion.text}
          </Text>

          {currentQuestion.type === 'MC' && currentQuestion.choices && (
            <View style={styles.choicesContainer}>
              {currentQuestion.choices.map((choice, index) => (
                <TouchableOpacity
                  key={choice.id}
                  onPress={() => handleAnswerSelect(choice.id)}
                  disabled={isAnswering}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={
                      selectedAnswer === choice.id
                        ? ['#667eea', '#764ba2']
                        : ['#ffffff', '#f8f9fa']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.choiceButton,
                      selectedAnswer === choice.id && styles.selectedChoice
                    ]}
                  >
                    <View style={styles.choiceContent}>
                      <View style={styles.choiceLetter}>
                        <Text style={[
                          styles.choiceLetterText,
                          selectedAnswer === choice.id && styles.choiceLetterTextSelected
                        ]}>
                          {String.fromCharCode(65 + index)}
                        </Text>
                      </View>
                      <Text style={[
                        styles.choiceText,
                        selectedAnswer === choice.id && styles.choiceTextSelected
                      ]}>
                        {choice.text}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {currentQuestion.type === 'TF' && (
            <View style={styles.tfContainer}>
              <TouchableOpacity
                onPress={() => handleAnswerSelect('true')}
                disabled={isAnswering}
                style={{ flex: 1 }}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={
                    selectedAnswer === 'true'
                      ? ['#43e97b', '#38f9d7']
                      : ['#ffffff', '#f8f9fa']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.tfButton}
                >
                  <Text style={[
                    styles.tfText,
                    selectedAnswer === 'true' && styles.tfTextSelected
                  ]}>
                    ✓ True
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleAnswerSelect('false')}
                disabled={isAnswering}
                style={{ flex: 1 }}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={
                    selectedAnswer === 'false'
                      ? ['#fa709a', '#fee140']
                      : ['#ffffff', '#f8f9fa']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.tfButton}
                >
                  <Text style={[
                    styles.tfText,
                    selectedAnswer === 'false' && styles.tfTextSelected
                  ]}>
                    ✗ False
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderTimer = () => (
    <View style={styles.timerContainer}>
      <LinearGradient
        colors={
          timeRemaining > 20 ? ['#43e97b', '#38f9d7'] :
          timeRemaining > 10 ? ['#fa709a', '#fee140'] :
          ['#f54ea2', '#ff7676']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.timerCard}
      >
        <Text style={styles.timerEmoji}>⏱️</Text>
        <Text style={styles.timerValue}>{timeRemaining}s</Text>
        <Text style={styles.timerLabel}>Time Left</Text>
      </LinearGradient>
      <View style={styles.timerBar}>
        <Animated.View
          style={[
            styles.timerProgress,
            {
              width: timerAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: getTimerColor(),
            },
          ]}
        />
      </View>
    </View>
  );

  const renderScores = () => (
    <View style={styles.scoresContainer}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.scoreCard}
      >
        <Text style={styles.scoreEmoji}>👤</Text>
        <Text style={styles.scoreLabel}>You</Text>
        <Text style={styles.scoreValue}>{playerScore}</Text>
      </LinearGradient>
      
      <View style={styles.vsContainer}>
        <Text style={styles.vsText}>VS</Text>
      </View>

      <LinearGradient
        colors={['#f093fb', '#f5576c']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.scoreCard}
      >
        <Text style={styles.scoreEmoji}>🤖</Text>
        <Text style={styles.scoreLabel}>Opponent</Text>
        <Text style={styles.scoreValue}>{opponentScore}</Text>
      </LinearGradient>
    </View>
  );

  const renderResultModal = () => (
    <Portal>
      <Modal
        visible={showResult}
        onDismiss={() => setShowResult(false)}
        contentContainerStyle={styles.resultModal}
      >
        {lastResult && (
          <LinearGradient
            colors={
              lastResult.isCorrect
                ? ['#43e97b', '#38f9d7']
                : ['#f54ea2', '#ff7676']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.resultContent}
          >
            <Text style={styles.resultEmoji}>
              {lastResult.isCorrect ? '🎉' : '💭'}
            </Text>
            <Text style={styles.resultTitle}>
              {lastResult.isCorrect ? 'Correct!' : 'Incorrect'}
            </Text>

            <Text style={styles.resultPoints}>
              +{lastResult.pointsEarned} points
            </Text>

            {!lastResult.isCorrect && (
              <Text style={styles.correctAnswer}>
                Correct answer: {lastResult.correctAnswer}
              </Text>
            )}

            <Text style={styles.explanation}>
              {lastResult.explanation}
            </Text>
          </LinearGradient>
        )}
      </Modal>
    </Portal>
  );

  if (matchStatus === 'waiting') {
    return (
      <View style={styles.centeredContainer}>
        <LinearGradient
          colors={['#4facfe', '#00f2fe']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.waitingCard}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.waitingTitle}>Waiting for Match</Text>
          <Text style={styles.waitingText}>
            Getting ready to start the quiz...
          </Text>
        </LinearGradient>
      </View>
    );
  }

  if (matchStatus === 'ended') {
    const isWinner = playerScore > opponentScore;
    return (
      <View style={styles.centeredContainer}>
        <LinearGradient
          colors={
            isWinner
              ? ['#43e97b', '#38f9d7']
              : ['#fa709a', '#fee140']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.resultCard}
        >
          <Text style={styles.resultCardEmoji}>
            {isWinner ? '🏆' : '🎯'}
          </Text>
          <Text style={styles.resultCardTitle}>
            {isWinner ? 'Victory!' : 'Match Complete!'}
          </Text>
          <View style={styles.finalScores}>
            <Text style={styles.finalScore}>Your Score: {playerScore}</Text>
            <Text style={styles.finalScore}>Opponent: {opponentScore}</Text>
          </View>
          <TouchableOpacity
            style={styles.playAgainButton}
            onPress={() => {/* Navigate back to main */}}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.playAgainGradient}
            >
              <Text style={styles.playAgainText}>Play Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} style={styles.progressBar} color="#fff" />
          <Text style={styles.progressText}>
            Question {currentQuestionIndex + 1} of {currentMatch?.questions.length || 0}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.gameArea}>
        {renderTimer()}
        {renderScores()}
        {renderQuestion()}

        <TouchableOpacity
          onPress={handleSubmitAnswer}
          disabled={!selectedAnswer || isAnswering}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={
              !selectedAnswer || isAnswering
                ? ['#cccccc', '#999999']
                : ['#667eea', '#764ba2']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.submitButton}
          >
            <Text style={styles.submitText}>
              {isAnswering ? 'Submitting...' : 'Submit Answer'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {renderResultModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f2f5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  gameArea: {
    flex: 1,
    padding: 16,
  },
  
  // Timer Styles
  timerContainer: {
    marginBottom: 20,
  },
  timerCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  timerEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  timerValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  timerLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  timerBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  timerProgress: {
    height: '100%',
    borderRadius: 3,
  },
  
  // Score Styles
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  scoreCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  scoreEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  vsContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#667eea',
  },
  
  // Question Styles
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  questionCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  themeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  themeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  pointsBadge: {
    backgroundColor: '#fff3e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f57c00',
  },
  questionTitle: {
    fontSize: 20,
    marginBottom: 24,
    lineHeight: 28,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  
  // Choice Styles
  choicesContainer: {
    gap: 12,
  },
  choiceButton: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedChoice: {
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  choiceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  choiceLetter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  choiceLetterText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  choiceLetterTextSelected: {
    color: '#ffffff',
  },
  choiceText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  choiceTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  
  // True/False Styles
  tfContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  tfButton: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tfText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
  },
  tfTextSelected: {
    color: '#ffffff',
  },
  
  // Submit Button
  submitButton: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 'auto',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  submitText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  
  // Waiting State
  waitingCard: {
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    width: width * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  waitingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  waitingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  
  // Result Card (Match End)
  resultCard: {
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    width: width * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  resultCardEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  resultCardTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 24,
  },
  finalScores: {
    gap: 12,
    marginBottom: 32,
  },
  finalScore: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  playAgainButton: {
    width: '100%',
  },
  playAgainGradient: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  playAgainText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  
  // Result Modal (Answer Feedback)
  resultModal: {
    backgroundColor: 'transparent',
    margin: 20,
  },
  resultContent: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  resultEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  resultPoints: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  correctAnswer: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    color: '#ffffff',
    fontWeight: '600',
  },
  explanation: {
    fontSize: 15,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 22,
  },
});