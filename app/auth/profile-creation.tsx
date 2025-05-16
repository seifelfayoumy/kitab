import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import debounce from 'lodash.debounce';

// Define available avatars
const AVATARS = [
  { id: 'explorer', source: require('@/assets/avatars/explorer.png') },
  { id: 'thinker', source: require('@/assets/avatars/thinker.png') },
  // Add more avatars here as they become available
];

const { width } = Dimensions.get('window');
const avatarSize = (width - 80) / 3; // Adjust spacing and number of columns

export default function ProfileCreationScreen() {
  const { user, loading: authLoading, createProfile, checkUsernameExists } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if user already has a profile or is not logged in
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        console.log('Profile Creation: No user found, redirecting to login.');
        router.replace('/auth/login');
      } else if (user.displayName && user.avatar) {
        console.log('Profile Creation: User already has profile, redirecting to home.');
        router.replace('/(tabs)');
      }
    }
  }, [user, authLoading, router]);

  // Debounced username check
  const debouncedCheckUsername = useCallback(
    debounce(async (name: string) => {
      if (name.length >= 3) {
        setIsCheckingUsername(true);
        setUsernameError('');
        try {
          const exists = await checkUsernameExists(name);
          if (exists) {
            setUsernameError('Username is already taken.');
          } else {
            setUsernameError(''); // Explicitly clear error if available
          }
        } catch (error) {
          console.error('Error checking username:', error);
          setUsernameError('Could not check username. Try again.');
        }
        setIsCheckingUsername(false);
      }
    }, 500), // 500ms debounce delay
    [checkUsernameExists]
  );

  const handleUsernameChange = (text: string) => {
    const formattedUsername = text.toLowerCase().replace(/[^a-z0-9_]/g, ''); // Allow lowercase, numbers, underscore
    setDisplayName(formattedUsername);
    setUsernameError(''); // Clear previous errors on change

    if (formattedUsername.length < 3 && formattedUsername.length > 0) {
      setUsernameError('Username must be at least 3 characters.');
    } else if (formattedUsername.length >= 3) {
      debouncedCheckUsername(formattedUsername);
    }
  };

  const handleAvatarSelect = (avatarId: string) => {
    setSelectedAvatar(avatarId);
    setAvatarError(''); // Clear error on selection
  };

  const handleSubmit = async () => {
    let isValid = true;
    setUsernameError('');
    setAvatarError('');

    // Validate username
    if (!displayName.trim()) {
      setUsernameError('Username cannot be empty.');
      isValid = false;
    } else if (displayName.length < 3) {
      setUsernameError('Username must be at least 3 characters.');
      isValid = false;
    } else if (!/^[a-z0-9_]+$/.test(displayName)) {
      setUsernameError('Username can only contain lowercase letters, numbers, and underscores.');
      isValid = false;
    }

    // Validate avatar selection
    if (!selectedAvatar) {
      setAvatarError('Please select an avatar.');
      isValid = false;
    }

    if (!isValid) return;

    // Final check for username availability before submitting
    setIsSubmitting(true);
    setIsCheckingUsername(true); // Show checking indicator during final check
    try {
      const exists = await checkUsernameExists(displayName);
      if (exists) {
        setUsernameError('This username is already taken.');
        setIsSubmitting(false);
        setIsCheckingUsername(false);
        return;
      }
    } catch (error) {
      Alert.alert('Error', 'Could not verify username uniqueness. Please try again.');
      setIsSubmitting(false);
      setIsCheckingUsername(false);
      return;
    }
    setIsCheckingUsername(false); // Hide indicator after check

    // Proceed with profile creation
    if (selectedAvatar) {
      try {
        const success = await createProfile(displayName, selectedAvatar);
        if (success) {
          console.log('Profile created successfully, navigating home.');
          router.replace('/(tabs)');
        } else {
          // Error handled within createProfile (Alert)
          console.log('Profile creation failed (handled in context).');
        }
      } catch (error) {
        console.error('Error during final profile submission:', error);
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (authLoading || !user || (user.displayName && user.avatar)) {
    // Show loading indicator while checking auth state or if redirecting
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingView}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.title}>Create Your Profile</ThemedText>
          <ThemedText style={styles.subtitle}>Choose a unique username and an avatar.</ThemedText>

          {/* Username Input */}
          <ThemedText style={styles.label}>Username</ThemedText>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="e.g., bookworm_123"
              placeholderTextColor={Colors.light.textSecondary}
              value={displayName}
              onChangeText={handleUsernameChange}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
            {isCheckingUsername && <ActivityIndicator size="small" style={styles.inputIndicator} />}
          </View>
          {usernameError ? <ThemedText style={styles.errorText}>{usernameError}</ThemedText> : null}

          {/* Avatar Selection */}
          <ThemedText style={[styles.label, styles.avatarLabel]}>Choose Avatar</ThemedText>
          <View style={styles.avatarGrid}>
            {AVATARS.map((avatar) => (
              <TouchableOpacity
                key={avatar.id}
                style={[
                  styles.avatarButton,
                  selectedAvatar === avatar.id && styles.selectedAvatarButton,
                ]}
                onPress={() => handleAvatarSelect(avatar.id)}
              >
                <Image source={avatar.source} style={styles.avatarImage} />
              </TouchableOpacity>
            ))}
          </View>
          {avatarError ? <ThemedText style={styles.errorText}>{avatarError}</ThemedText> : null}

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>Create Profile</ThemedText>
            )}
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Styles
const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    color: Colors.light.textSecondary,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  avatarLabel: {
    marginTop: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: Colors.light.text,
  },
  inputIndicator: {
    marginLeft: 8,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    justifyContent: 'space-around',
  },
  avatarButton: {
    width: avatarSize,
    height: avatarSize,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
    borderRadius: 12,
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedAvatarButton: {
    borderColor: Colors.light.primary,
  },
  avatarImage: {
    width: avatarSize - 20,
    height: avatarSize - 20,
    resizeMode: 'contain',
  },
  button: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    color: Colors.light.error,
    marginBottom: 8,
  },
});