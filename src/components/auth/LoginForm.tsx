import { useAppDispatch, useUI } from '@/src/store/hooks';
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from '@/src/store/slices/authSlice';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Dimensions, StyleSheet, View } from 'react-native';
import { Button, Card, Paragraph, Text, TextInput, Title } from 'react-native-paper';

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

interface LoginFormProps {
  onToggleMode: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const dispatch = useAppDispatch();
  const { isLoading } = useUI();

  const loginForm = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signUpForm = useForm<SignUpFormData>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      displayName: '',
    },
  });

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
    if (data.password !== data.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (data.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
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

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    // Reset forms when toggling to prevent input issues
    if (!isSignUp) {
      signUpForm.reset({
        displayName: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
    } else {
      loginForm.reset({
        email: '',
        password: '',
      });
    }
    onToggleMode();
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Title>
          <Paragraph style={styles.subtitle}>
            {isSignUp
              ? 'Join the DRRM Quiz community'
              : 'Sign in to continue your learning journey'
            }
          </Paragraph>

          {isSignUp ? (
            // Sign Up Form
            <View style={styles.form}>
              <Controller
                control={signUpForm.control}
                rules={{
                  required: 'Display name is required',
                  minLength: { value: 2, message: 'Display name must be at least 2 characters' },
                  maxLength: { value: 30, message: 'Display name must be less than 30 characters' },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Display Name"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    style={styles.input}
                    mode="outlined"
                    left={<TextInput.Icon icon="account" />} // Display account icon
                    error={!!signUpForm.formState.errors.displayName}
                  />
                )}
                name="displayName"
              />
              {signUpForm.formState.errors.displayName && (
                <Text style={styles.errorText}>
                  {signUpForm.formState.errors.displayName.message}
                </Text>
              )}

              <Controller
                control={signUpForm.control}
                rules={{
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email address',
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Email"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    style={styles.input}
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}
                name="email"
              />
              {signUpForm.formState.errors.email && (
                <Text style={styles.errorText}>
                  {signUpForm.formState.errors.email.message}
                </Text>
              )}

              <Controller
                control={signUpForm.control}
                rules={{ required: 'Password is required' }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Password"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    style={styles.input}
                    mode="outlined"
                    secureTextEntry
                  />
                )}
                name="password"
              />
              {signUpForm.formState.errors.password && (
                <Text style={styles.errorText}>
                  {signUpForm.formState.errors.password.message}
                </Text>
              )}

              <Controller
                control={signUpForm.control}
                rules={{
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === signUpForm.getValues('password') || 'Passwords do not match',
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Confirm Password"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    style={styles.input}
                    mode="outlined"
                    secureTextEntry
                  />
                )}
                name="confirmPassword"
              />
              {signUpForm.formState.errors.confirmPassword && (
                <Text style={styles.errorText}>
                  {signUpForm.formState.errors.confirmPassword.message}
                </Text>
              )}

              <Button
                mode="contained"
                onPress={signUpForm.handleSubmit(handleSignUp)}
                loading={isLoading}
                style={styles.button}
              >
                Create Account
              </Button>
            </View>
          ) : (
            // Login Form
            <View style={styles.form}>
              <Controller
                control={loginForm.control}
                rules={{
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email address',
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Email"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    style={styles.input}
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}
                name="email"
              />
              {loginForm.formState.errors.email && (
                <Text style={styles.errorText}>
                  {loginForm.formState.errors.email.message}
                </Text>
              )}

              <Controller
                control={loginForm.control}
                rules={{ required: 'Password is required' }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Password"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    style={styles.input}
                    mode="outlined"
                    secureTextEntry
                  />
                )}
                name="password"
              />
              {loginForm.formState.errors.password && (
                <Text style={styles.errorText}>
                  {loginForm.formState.errors.password.message}
                </Text>
              )}

              <Button
                mode="contained"
                onPress={loginForm.handleSubmit(handleLogin)}
                loading={isLoading}
                style={styles.button}
              >
                Sign In
              </Button>

              <Button
                mode="outlined"
                onPress={handleGoogleSignIn}
                loading={isLoading}
                style={styles.googleButton}
                icon="google"
              >
                Continue with Google
              </Button>
            </View>
          )}

          <View style={styles.toggleContainer}>
            <Text>
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <Text style={styles.toggleText} onPress={toggleMode}>
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Text>
            </Text>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    elevation: 4,
    borderRadius: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  form: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
  googleButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  toggleContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  toggleText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
  },
});