import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppDispatch, useAuthUser } from '../store/hooks';
import { signOut } from '../store/slices/authSlice';

const { width } = Dimensions.get('window');

export const MainScreen: React.FC = () => {
  const { user, isAuthenticated } = useAuthUser();
  const dispatch = useAppDispatch();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSignOut = async () => {
    try {
      await dispatch(signOut()).unwrap();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (!isAuthenticated || !user) {
    return null; // This shouldn't happen as auth state should redirect
  }

  // Calculate level from XP
  const level = Math.floor(user.xp / 100) + 1;
  const xpProgress = (user.xp % 100) / 100;
  const winRate = user.matchesPlayed > 0 
    ? Math.min((Math.floor(user.xp / 50) / user.matchesPlayed) * 100, 100).toFixed(0)
    : 0;

  const MenuCard = ({ 
    title, 
    description, 
    icon, 
    onPress, 
    gradient, 
    primary = false 
  }: any) => (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.menuCardTouchable}
    >
      <LinearGradient
        colors={gradient || ['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientCard, primary && styles.primaryCard]}
      >
        <View style={styles.cardIcon}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
        <View style={styles.cardArrow}>
          <Text style={styles.arrowText}>→</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Header with Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroHeader}
      >
        {/* Settings Button */}
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/settings' as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>

        <Animated.View 
          style={[
            styles.heroContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              {user.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {user.displayName?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{level}</Text>
              </View>
            </View>
            
            <View style={styles.welcomeSection}>
              <Text style={styles.greetingText}>Welcome back,</Text>
              <Text style={styles.nameText}>{user.displayName}!</Text>
              <Text style={styles.subtitleText}>Ready for your next challenge?</Text>
            </View>
          </View>

          {/* Enhanced Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.xp}</Text>
              <Text style={styles.statLabel}>XP</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.matchesPlayed}</Text>
              <Text style={styles.statLabel}>Matches</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{winRate}%</Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.bestScore}</Text>
              <Text style={styles.statLabel}>Best</Text>
            </View>
          </View>

          {/* XP Progress */}
          <View style={styles.xpProgressContainer}>
            <View style={styles.xpInfo}>
              <Text style={styles.xpLabel}>Level {level}</Text>
              <Text style={styles.xpNextLevel}>
                {100 - (user.xp % 100)} XP to Level {level + 1}
              </Text>
            </View>
            <View style={styles.progressBarOuter}>
              <View style={[styles.progressBarInner, { width: `${xpProgress * 100}%` }]} />
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Featured Action - Quick Match */}
        <View style={styles.section}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <MenuCard
              title="Quick Match"
              description="Jump into an exciting match now!"
              icon="🎮"
              onPress={() => router.push('/matchmaking')}
              gradient={['#f093fb', '#f5576c']}
              primary={true}
            />
          </Animated.View>
        </View>

        {/* Game Modes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Modes</Text>
          <View style={styles.gridContainer}>
            <View style={styles.gridItem}>
              <MenuCard
                title="Practice"
                description="Learn at your pace"
                icon="📚"
                onPress={() => {/* Navigate to practice */}}
                gradient={['#4facfe', '#00f2fe']}
              />
            </View>
            <View style={styles.gridItem}>
              <MenuCard
                title="Ranked"
                description="Competitive play"
                icon="🏆"
                onPress={() => router.push('/matchmaking')}
                gradient={['#43e97b', '#38f9d7']}
              />
            </View>
          </View>
        </View>

        {/* Explore Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explore</Text>
          <View style={styles.gridContainer}>
            <View style={styles.gridItem}>
              <MenuCard
                title="Leaderboard"
                description="Top players"
                icon="🥇"
                onPress={() => {/* Navigate to leaderboard */}}
                gradient={['#fa709a', '#fee140']}
              />
            </View>
            <View style={styles.gridItem}>
              <MenuCard
                title="Achievements"
                description="Your progress"
                icon="⭐"
                onPress={() => {/* Navigate to achievements */}}
                gradient={['#30cfd0', '#330867']}
              />
            </View>
          </View>
        </View>

        {/* Knowledge Areas Progress Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Knowledge Areas</Text>
          
          <View style={styles.knowledgeCard}>
            <View style={styles.knowledgeItem}>
              <View style={styles.knowledgeHeader}>
                <Text style={styles.knowledgeIcon}>🛡️</Text>
                <Text style={styles.knowledgeLabel}>Prevention</Text>
              </View>
              <View style={styles.knowledgeBarContainer}>
                <View style={[styles.knowledgeBar, { width: '75%', backgroundColor: '#34C759' }]} />
              </View>
              <Text style={styles.knowledgePercent}>75%</Text>
            </View>

            <View style={styles.knowledgeItem}>
              <View style={styles.knowledgeHeader}>
                <Text style={styles.knowledgeIcon}>📋</Text>
                <Text style={styles.knowledgeLabel}>Preparedness</Text>
              </View>
              <View style={styles.knowledgeBarContainer}>
                <View style={[styles.knowledgeBar, { width: '60%', backgroundColor: '#007AFF' }]} />
              </View>
              <Text style={styles.knowledgePercent}>60%</Text>
            </View>

            <View style={styles.knowledgeItem}>
              <View style={styles.knowledgeHeader}>
                <Text style={styles.knowledgeIcon}>🚨</Text>
                <Text style={styles.knowledgeLabel}>Response</Text>
              </View>
              <View style={styles.knowledgeBarContainer}>
                <View style={[styles.knowledgeBar, { width: '45%', backgroundColor: '#FF9500' }]} />
              </View>
              <Text style={styles.knowledgePercent}>45%</Text>
            </View>

            <View style={styles.knowledgeItem}>
              <View style={styles.knowledgeHeader}>
                <Text style={styles.knowledgeIcon}>🔄</Text>
                <Text style={styles.knowledgeLabel}>Recovery</Text>
              </View>
              <View style={styles.knowledgeBarContainer}>
                <View style={[styles.knowledgeBar, { width: '30%', backgroundColor: '#FF3B30' }]} />
              </View>
              <Text style={styles.knowledgePercent}>30%</Text>
            </View>
          </View>
        </View>

        {/* Sign Out Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            onPress={handleSignOut}
            style={styles.signOutButton}
            activeOpacity={0.7}
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  heroHeader: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    position: 'relative',
  },
  settingsButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  settingsIcon: {
    fontSize: 24,
  },
  heroContent: {
    width: '100%',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#FFD700',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  levelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  welcomeSection: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backdropFilter: 'blur(10px)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 8,
  },
  xpProgressContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
  },
  xpInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  xpLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  xpNextLevel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressBarOuter: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 0,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  menuCardTouchable: {
    marginBottom: 12,
  },
  gradientCard: {
    borderRadius: 16,
    padding: 18,
    minHeight: 130,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    justifyContent: 'space-between',
  },
  primaryCard: {
    minHeight: 150,
    padding: 20,
  },
  cardIcon: {
    marginBottom: 12,
  },
  iconText: {
    fontSize: 36,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  cardArrow: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  gridContainer: {
    flexDirection: 'row',
    marginHorizontal: -6,
    marginBottom: 0,
  },
  gridItem: {
    flex: 1,
    paddingHorizontal: 6,
  },
  knowledgeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  knowledgeItem: {
    marginBottom: 16,
  },
  knowledgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  knowledgeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  knowledgeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  knowledgePercent: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  knowledgeBarContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  knowledgeBar: {
    height: '100%',
    borderRadius: 4,
  },
  signOutButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d32f2f',
  },
  bottomSpacing: {
    height: 30,
  },
  header: {
    padding: 24,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  menuCard: {
    marginBottom: 16,
    elevation: 2,
  },
  button: {
    marginTop: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 24,
  },
  statsCard: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statsLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
  },
});