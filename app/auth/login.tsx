import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Image, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function LoginScreen() {
  const { user, loading, signInWithGoogle, signInWithApple, createUsername, checkUsernameExists } = useAuth();
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [showUsernameInput, setShowUsernameInput] = useState(false);

  // If user is already logged in but doesn't have a username, show username input
  React.useEffect(() => {
    if (user && !user.username) {
      setShowUsernameInput(true);
    } else if (user && user.username) {
      // User is fully authenticated with username, redirect to home
      router.replace('/(tabs)');
    }
  }, [user]);

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
  };

  const handleAppleSignIn = async () => {
    await signInWithApple();
  };

  const handleUsernameSubmit = async () => {
    if (!username.trim()) {
      setUsernameError('Username cannot be empty');
      return;
    }

    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      return;
    }

    setIsCheckingUsername(true);
    setUsernameError('');

    try {
      const exists = await checkUsernameExists(username);
      if (exists) {
        setUsernameError('This username is already taken');
        setIsCheckingUsername(false);
        return;
      }

      const success = await createUsername(username);
      if (success) {
        // Username created successfully, navigate to home
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Error creating username:', error);
      setUsernameError('An error occurred. Please try again.');
    } finally {
      setIsCheckingUsername(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  if (showUsernameInput) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <ThemedView style={styles.usernameContainer}>
          <ThemedText type="title" style={styles.title}>Create Username</ThemedText>
          <ThemedText style={styles.subtitle}>
            Choose a unique username for your Kitab account
          </ThemedText>
          
          <TextInput
            style={styles.usernameInput}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          {usernameError ? (
            <ThemedText style={styles.errorText}>{usernameError}</ThemedText>
          ) : null}
          
          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleUsernameSubmit}
            disabled={isCheckingUsername}>
            {isCheckingUsername ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ThemedText style={styles.submitButtonText}>Continue</ThemedText>
            )}
          </TouchableOpacity>
        </ThemedView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('@/assets/images/icon.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />
        <ThemedText type="title" style={styles.appName}>Kitab</ThemedText>
        <ThemedText style={styles.tagline}>Your personal book journal</ThemedText>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
          <Image 
            source={require('@/assets/images/google-logo.png')} 
            style={styles.buttonIcon} 
          />
          <ThemedText style={styles.buttonText}>Continue with Google</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.appleButton} onPress={handleAppleSignIn}>
          <Image 
            source={require('@/assets/images/apple-logo.png')} 
            style={styles.buttonIcon} 
          />
          <ThemedText style={styles.appleButtonText}>Continue with Apple</ThemedText>
        </TouchableOpacity>
      </View>

      <ThemedText style={styles.termsText}>
        By continuing, you agree to Kitab's Terms of Service and Privacy Policy
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    opacity: 0.7,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 16,
  },
  buttonIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  appleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.6,
  },
  usernameContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.7,
  },
  usernameInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});