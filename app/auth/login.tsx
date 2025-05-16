import React from 'react'; // Keep useState if needed elsewhere, remove if not
import { StyleSheet, View, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native'; // Remove TextInput, KeyboardAvoidingView if not used
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
// Import Colors if needed for styles, otherwise remove
import { Colors } from '@/constants/Colors'; 

export default function LoginScreen() {
  // Remove createUsername, checkUsernameExists, and related state
  const { user, loading, signInWithGoogle, signInWithApple } = useAuth(); 
  // Remove username, setUsername, usernameError, setUsernameError, isCheckingUsername, setIsCheckingUsername, showUsernameInput, setShowUsernameInput

  // Remove the useEffect hook as redirection is now handled in AuthContext
  // React.useEffect(() => {
  //   if (user) {
  //     console.log('Login screen - User state:', { hasUsername: !!user.username, hasAvatar: !!user.avatar });
      
  //     // Redirect to profile creation if username OR avatar is missing
  //     if (!user.username || !user.avatar) { 
  //       console.log('Redirecting to profile creation - missing username or avatar');
  //       router.replace('/auth/profile-creation');
  //     } else {
  //       // User is fully authenticated with username and avatar, redirect to home
  //       console.log('Redirecting to home - user has username and avatar');
  //       router.replace('/(tabs)');
  //     }
  //   }
  // }, [user, router]);

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
    // Navigation is handled by the useEffect hook based on user state changes
  };

  const handleAppleSignIn = async () => {
    await signInWithApple();
    // Navigation is handled by the useEffect hook based on user state changes
  };

  // Remove handleUsernameSubmit function entirely

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  // Remove the entire 'if (showUsernameInput)' block

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
    // Adjusted padding and justification for the main login view
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 30,
    paddingTop: 80, 
    paddingBottom: 50,
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
    // Adjusted margin for better spacing
    marginBottom: 40, 
  },
  logo: {
    // Slightly larger logo
    width: 120,
    height: 120,
    marginBottom: 15,
  },
  appName: {
    fontSize: 32, // Adjusted size
    fontWeight: 'bold',
    marginBottom: 5, // Adjusted margin
  },
  tagline: {
    fontSize: 16,
    // Use a secondary color for better hierarchy
    color: Colors.light.textSecondary, 
    opacity: 1, // Remove opacity if using direct color
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center', // Center buttons horizontally
    marginBottom: 20, // Keep margin
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Google's white
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25, // Rounded corners
    marginBottom: 15,
    width: '90%', // Button width
    justifyContent: 'center',
    // Shadow for depth (iOS)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Elevation for depth (Android)
    elevation: 3,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000', // Apple's black
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25, // Rounded corners
    width: '90%', // Button width
    justifyContent: 'center',
    // Shadow for depth (iOS)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    // Elevation for depth (Android)
    elevation: 3,
  },
  buttonIcon: {
    width: 20, // Adjusted icon size
    height: 20,
    marginRight: 15, // Space between icon and text
  },
  buttonText: {
    color: '#757575', // Google's grey text color
    fontWeight: '500',
    fontSize: 16,
  },
  appleButtonText: {
    color: '#FFFFFF', // White text for Apple button
    fontWeight: '500',
    fontSize: 16,
  },
  termsText: {
    fontSize: 12,
    color: Colors.light.textSecondary, // Use secondary color
    textAlign: 'center',
    marginTop: 20, // Add margin above terms text
    opacity: 1, // Remove opacity if using direct color
  },
  // Remove styles related to the username input form: 
  // usernameContainer, title, subtitle, usernameInput, errorText, submitButton, submitButtonText
});