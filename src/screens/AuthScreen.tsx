import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Paragraph, Surface, Text, TextInput, Title } from 'react-native-paper';
import { AuthService } from '../services/firebase/auth';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from '../store/slices/authSlice';

const { width } = Dimensions.get('window');

interface LoginFormData {
  email: string;
  password: string;
}

interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
}

// Check if Google Sign-In is configured
const GOOGLE_SIGNIN_ENABLED = false; // Set to true after configuring Google Sign-In

export const AuthScreen: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const dispatch = useAppDispatch();
  
  // Use selector to get only isLoading to minimize re-renders
  const isLoading = useAppSelector((state) => state.ui.isLoading);

  // Use useMemo to prevent form from recreating on every render
  const loginFormInstance = useMemo(() => ({
    defaultValues: {
      email: '',
      password: '',
    },
    shouldUnregister: false, // Keep field values even when unmounted
  }), []);

  const signUpFormInstance = useMemo(() => ({
    mode: 'onBlur' as const,
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      displayName: '',
    },
    shouldUnregister: false, // Keep field values even when unmounted
  }), []);

  const loginForm = useForm<LoginFormData>(loginFormInstance);
  const signUpForm = useForm<SignUpFormData>(signUpFormInstance);

  const handleLogin = async (data: LoginFormData) => {
    try {
      const result = await dispatch(signInWithEmail(data)).unwrap();
      if (result) {
        // Navigation will be handled by the auth state change
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error);
    }
  };

  const handleSignUp = async (data: SignUpFormData) => {
    // Validate passwords match
    if (data.password !== data.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      const result = await dispatch(signUpWithEmail({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
      })).unwrap();

      if (result) {
        Alert.alert('Success', 'Account created successfully!');
        setIsSignUp(false);
        // Reset the sign-up form
        signUpForm.reset({
          email: '',
          password: '',
          confirmPassword: '',
          displayName: '',
        });
      }
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await dispatch(signInWithGoogle()).unwrap();
      if (result) {
        // Navigation will be handled by the auth state change
      }
    } catch (error: any) {
      Alert.alert('Google Sign In Failed', error);
    }
  };

  const handleForgotPassword = () => {
    const email = loginForm.getValues('email');
    
    if (!email) {
      Alert.alert('Email Required', 'Please enter your email address first.');
      return;
    }

    Alert.alert(
      'Reset Password',
      `Send password reset link to ${email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              await AuthService.sendPasswordResetEmail(email);
              Alert.alert(
                'Email Sent',
                'Password reset link has been sent to your email.'
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to send reset email');
            }
          },
        },
      ]
    );
  };

  const toggleMode = () => {
    const newIsSignUp = !isSignUp;
    setIsSignUp(newIsSignUp);
    setShowPassword(false);
    setShowConfirmPassword(false);
    
    // Don't reset forms on toggle - let users keep their data
    // Forms will reset on successful submission instead
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Decorative Header with Fun Icons */}
      <View style={styles.headerDecoration}>
        <MaterialCommunityIcons name="shield-check" size={60} color="#FF6B6B" style={styles.floatingIcon} />
        <MaterialCommunityIcons name="school" size={50} color="#4ECDC4" style={[styles.floatingIcon, styles.iconRight]} />
        <MaterialCommunityIcons name="atom" size={45} color="#FFE66D" style={[styles.floatingIcon, styles.iconLeft]} />
      </View>

      <Surface style={styles.surface} elevation={4}>
        {/* Fun App Icon/Logo Area */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons 
              name={isSignUp ? "account-plus" : "shield-account"} 
              size={50} 
              color="#FFF" 
            />
          </View>
        </View>

        <Title style={styles.title}>
          {isSignUp ? '🎉 Join the Fun!' : '👋 Welcome Back!'}
        </Title>
        <Paragraph style={styles.subtitle}>
          {isSignUp
            ? 'Create your account and start learning!'
            : 'Ready to learn something awesome today?'
          }
        </Paragraph>

        {isSignUp ? (
          // Sign Up Form - Use key to force remount when switching
          <View style={styles.form} key="signup-form">
            <Controller
              control={signUpForm.control}
              rules={{
                required: 'Display name is required',
                minLength: {
                  value: 2,
                  message: 'Display name must be at least 2 characters',
                },
                maxLength: {
                  value: 30,
                  message: 'Display name must be less than 30 characters',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Your Cool Name 😎"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={(text) => {
                      onChange(text);
                    }}
                    style={styles.input}
                    mode="outlined"
                    autoComplete="name"
                    textContentType="name"
                    left={<TextInput.Icon icon={() => <MaterialCommunityIcons name="account-circle" size={24} color="#FF6B6B" />} />}
                    error={!!signUpForm.formState.errors.displayName}
                    disabled={isLoading}
                    theme={{ colors: { primary: '#FF6B6B' } }}
                  />
                </View>
              )}
              name="displayName"
            />
            {signUpForm.formState.errors.displayName && (
              <Text style={styles.errorText}>
                ⚠️ {signUpForm.formState.errors.displayName.message}
              </Text>
            )}

            <Controller
              control={signUpForm.control}
              rules={{
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email address',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Email Address 📧"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={(text) => {
                      onChange(text);
                    }}
                    style={styles.input}
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    left={<TextInput.Icon icon={() => <MaterialCommunityIcons name="email" size={24} color="#4ECDC4" />} />}
                    error={!!signUpForm.formState.errors.email}
                    disabled={isLoading}
                    theme={{ colors: { primary: '#4ECDC4' } }}
                  />
                </View>
              )}
              name="email"
            />
            {signUpForm.formState.errors.email && (
              <Text style={styles.errorText}>
                ⚠️ {signUpForm.formState.errors.email.message}
              </Text>
            )}

            <Controller
              control={signUpForm.control}
              rules={{
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Secret Password 🔒"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={(text) => {
                      onChange(text);
                    }}
                    style={styles.input}
                    mode="outlined"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password-new"
                    textContentType="newPassword"
                    left={<TextInput.Icon icon={() => <MaterialCommunityIcons name="lock" size={24} color="#A8E6CF" />} />}
                    right={
                      <TextInput.Icon
                        icon={showPassword ? "eye-off" : "eye"}
                        onPress={() => setShowPassword(!showPassword)}
                      />
                    }
                    error={!!signUpForm.formState.errors.password}
                    disabled={isLoading}
                    theme={{ colors: { primary: '#A8E6CF' } }}
                  />
                </View>
              )}
              name="password"
            />
            {signUpForm.formState.errors.password ? (
              <Text style={styles.errorText}>
                ⚠️ {signUpForm.formState.errors.password.message}
              </Text>
            ) : (
              <Text style={styles.helperText}>
                💡 Must be at least 6 characters
              </Text>
            )}

            <Controller
              control={signUpForm.control}
              rules={{
                required: 'Please confirm your password',
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Confirm Password 🔐"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={(text) => {
                      onChange(text);
                    }}
                    style={styles.input}
                    mode="outlined"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoComplete="password-new"
                    textContentType="newPassword"
                    left={<TextInput.Icon icon={() => <MaterialCommunityIcons name="lock-check" size={24} color="#FFD93D" />} />}
                    right={
                      <TextInput.Icon
                        icon={showConfirmPassword ? "eye-off" : "eye"}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      />
                    }
                    error={!!signUpForm.formState.errors.confirmPassword}
                    disabled={isLoading}
                    theme={{ colors: { primary: '#FFD93D' } }}
                  />
                </View>
              )}
              name="confirmPassword"
            />
            {signUpForm.formState.errors.confirmPassword && (
              <Text style={styles.errorText}>
                ⚠️ {signUpForm.formState.errors.confirmPassword.message}
              </Text>
            )}

            <Button
              mode="contained"
              onPress={signUpForm.handleSubmit(handleSignUp)}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              icon={() => <MaterialCommunityIcons name="account-plus" size={20} color="#FFF" />}
            >
              🎊 Create My Account
            </Button>
          </View>
        ) : (
          // Login Form - Use key to force remount when switching
          <View style={styles.form} key="login-form">
            <Controller
              control={loginForm.control}
              rules={{
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email address',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Email Address 📧"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    style={styles.input}
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    left={<TextInput.Icon icon={() => <MaterialCommunityIcons name="email" size={24} color="#4ECDC4" />} />}
                    error={!!loginForm.formState.errors.email}
                    theme={{ colors: { primary: '#4ECDC4' } }}
                  />
                </View>
              )}
              name="email"
            />
            {loginForm.formState.errors.email && (
              <Text style={styles.errorText}>
                ⚠️ {loginForm.formState.errors.email.message}
              </Text>
            )}

            <Controller
              control={loginForm.control}
              rules={{
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Password 🔒"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    style={styles.input}
                    mode="outlined"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                    textContentType="password"
                    left={<TextInput.Icon icon={() => <MaterialCommunityIcons name="lock" size={24} color="#A8E6CF" />} />}
                    right={
                      <TextInput.Icon
                        icon={showPassword ? "eye-off" : "eye"}
                        onPress={() => setShowPassword(!showPassword)}
                      />
                    }
                    error={!!loginForm.formState.errors.password}
                    theme={{ colors: { primary: '#A8E6CF' } }}
                  />
                </View>
              )}
              name="password"
            />
            {loginForm.formState.errors.password && (
              <Text style={styles.errorText}>
                ⚠️ {loginForm.formState.errors.password.message}
              </Text>
            )}

            <View style={styles.forgotPasswordContainer}>
              <Text style={styles.forgotPasswordText} onPress={handleForgotPassword}>
                🤔 Forgot Password?
              </Text>
            </View>

            <Button
              mode="contained"
              onPress={loginForm.handleSubmit(handleLogin)}
              loading={isLoading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              icon={() => <MaterialCommunityIcons name="login" size={20} color="#FFF" />}
            >
              🚀 Let's Go!
            </Button>

            {GOOGLE_SIGNIN_ENABLED && (
              <Button
                mode="outlined"
                onPress={handleGoogleSignIn}
                loading={isLoading}
                style={styles.googleButton}
                contentStyle={styles.buttonContent}
                labelStyle={styles.googleButtonLabel}
                icon={() => <MaterialCommunityIcons name="google" size={20} color="#FF6B6B" />}
              >
                Continue with Google
              </Button>
            )}
          </View>
        )}

        <View style={styles.toggleContainer}>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleQuestion}>
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
            </Text>
            <Text style={styles.toggleText} onPress={toggleMode}>
              {isSignUp ? '👉 Sign In' : '👉 Sign Up'}
            </Text>
          </View>
        </View>
      </Surface>
      
      {/* Decorative Footer with Fun Icons */}
      <View style={styles.footerDecoration}>
        <MaterialCommunityIcons name="star" size={30} color="#FFE66D" style={styles.starIcon} />
        <MaterialCommunityIcons name="trophy" size={35} color="#FF6B6B" style={styles.trophyIcon} />
        <MaterialCommunityIcons name="star" size={30} color="#4ECDC4" style={styles.starIcon} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFF5E6', // Warm, friendly background
  },
  headerDecoration: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 30,
  },
  floatingIcon: {
    opacity: 0.8,
  },
  iconRight: {
    transform: [{ translateY: 10 }],
  },
  iconLeft: {
    transform: [{ translateY: -5 }],
  },
  surface: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#636E72',
    fontSize: 16,
    fontWeight: '500',
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    marginBottom: 16,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
    marginBottom: 8,
  },
  forgotPasswordText: {
    color: '#FF6B6B',
    fontSize: 15,
    fontWeight: '600',
  },
  button: {
    marginTop: 16,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#FF6B6B',
    elevation: 4,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  googleButton: {
    marginTop: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    elevation: 2,
  },
  googleButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  toggleContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  toggleQuestion: {
    fontSize: 15,
    color: '#636E72',
  },
  toggleText: {
    color: '#FF6B6B',
    fontWeight: '700',
    fontSize: 16,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
    marginLeft: 12,
    fontWeight: '500',
  },
  helperText: {
    color: '#95A5A6',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
    marginLeft: 12,
    fontStyle: 'italic',
  },
  footerDecoration: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 20,
  },
  starIcon: {
    opacity: 0.7,
  },
  trophyIcon: {
    opacity: 0.8,
  },
});