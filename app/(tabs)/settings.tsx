import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { signOut } from '@/src/store/slices/authSlice';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SettingsScreen() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({ light: '#fff', dark: '#1a1a1a' }, 'background');
  const borderColor = useThemeColor({ light: '#e0e0e0', dark: '#333' }, 'tabIconDefault');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'tint');

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [autoMatchmaking, setAutoMatchmaking] = useState(false);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(signOut()).unwrap();
              router.replace('/');
            } catch (error) {
              console.error('Sign out error:', error);
            }
          },
        },
      ],
    );
  };

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: primaryColor }]}> Back</Text>
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>Settings</ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>PROFILE</ThemedText>
        <TouchableOpacity style={[styles.settingItem, { backgroundColor: cardColor, borderColor }]}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}></Text>
            <View style={styles.settingText}>
              <ThemedText type="defaultSemiBold">Account</ThemedText>
              <ThemedText style={styles.settingSubtitle}>{user.email}</ThemedText>
            </View>
          </View>
          <Text style={[styles.arrow, { color: textColor }]}></Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>GAME SETTINGS</ThemedText>
        
        <View style={[styles.settingItem, { backgroundColor: cardColor, borderColor }]}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}></Text>
            <View style={styles.settingText}>
              <ThemedText type="defaultSemiBold">Notifications</ThemedText>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#767577', true: primaryColor }}
          />
        </View>

        <View style={[styles.settingItem, { backgroundColor: cardColor, borderColor }]}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}></Text>
            <View style={styles.settingText}>
              <ThemedText type="defaultSemiBold">Sound Effects</ThemedText>
            </View>
          </View>
          <Switch
            value={soundEnabled}
            onValueChange={setSoundEnabled}
            trackColor={{ false: '#767577', true: primaryColor }}
          />
        </View>

        <View style={[styles.settingItem, { backgroundColor: cardColor, borderColor }]}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}></Text>
            <View style={styles.settingText}>
              <ThemedText type="defaultSemiBold">Haptic Feedback</ThemedText>
            </View>
          </View>
          <Switch
            value={hapticEnabled}
            onValueChange={setHapticEnabled}
            trackColor={{ false: '#767577', true: primaryColor }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.dangerButton, { backgroundColor: cardColor, borderColor: '#d32f2f' }]}
          onPress={handleSignOut}
        >
          <Text style={styles.dangerButtonText}> Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingText: { textAlign: 'center', marginTop: 40 },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  backButton: { marginBottom: 16 },
  backText: { fontSize: 32, fontWeight: 'bold' },
  headerTitle: { fontSize: 32, fontWeight: 'bold' },
  section: { marginBottom: 32, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 13, letterSpacing: 0.5, marginBottom: 12, opacity: 0.6 },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingIcon: { fontSize: 24, marginRight: 12 },
  settingText: { flex: 1 },
  settingSubtitle: { fontSize: 13, opacity: 0.6 },
  arrow: { fontSize: 28, fontWeight: '300', marginLeft: 8 },
  dangerButton: { padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 2 },
  dangerButtonText: { fontSize: 16, fontWeight: '600', color: '#d32f2f' },
  bottomSpacing: { height: 40 },
});
