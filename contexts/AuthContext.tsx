import React, { createContext, useState, useContext, useEffect } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Alert, Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import appleAuth from '@invertase/react-native-apple-authentication';

type User = FirebaseAuthTypes.User & {
  username?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  createUsername: (username: string) => Promise<boolean>;
  checkUsernameExists: (username: string) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithApple: async () => {},
  signOut: async () => {},
  createUsername: async () => false,
  checkUsernameExists: async () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Check if user has a username in Firestore
        try {
          const userDoc = await firestore().collection('users').doc(firebaseUser.uid).get();
          const userData = userDoc.data();
          
          // Merge Firebase user with Firestore data
          setUser({
            ...firebaseUser,
            username: userData?.username,
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Initialize Google Sign-In and Apple Sign-In when the component mounts
  useEffect(() => {
    // Configure Google Sign-In
    GoogleSignin.configure({
      // Using the actual web client ID from GoogleService-Info.plist
      webClientId: '678486496496-3td8npji90k790jp6e7k2jqvc5vilb42.apps.googleusercontent.com',
      offlineAccess: true,
    });
    
    // Check if Apple Authentication is available on this device
    if (appleAuth.isSupported) {
      console.log('Apple Authentication is supported on this device');
    } else {
      console.log('Apple Authentication is not supported on this device');
    }
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      
      // Check if your device supports Google Play Services
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      console.log('Google Play Services check passed');
      
      // Sign out from any previous Google Sign-In to avoid token conflicts
      await GoogleSignin.signOut();
      console.log('Previous Google Sign-In cleared');
      
      // Perform the Google sign-in
      console.log('Attempting Google sign-in...');
      const signInResult = await GoogleSignin.signIn();
      console.log('Google sign-in result:', signInResult);
      
      // Extract idToken from the nested data structure
      const { idToken } = signInResult.data;
      
      if (!idToken) {
        console.error('No ID token in sign-in result:', signInResult);
        throw new Error('Google Sign-In failed - no ID token returned');
      }
      
      console.log('ID token obtained successfully');
      
      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      
      // Sign in with credential to Firebase
      const userCredential = await auth().signInWithCredential(googleCredential);
      console.log('Firebase authentication successful');
      
      // Check if this is a new user
      if (userCredential.additionalUserInfo?.isNewUser) {
        // Create a new user document in Firestore
        await firestore().collection('users').doc(userCredential.user.uid).set({
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
        console.log('New user created in Firestore');
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      
      // More detailed error reporting
      if (error.code) {
        console.error(`Error code: ${error.code}`);
      }
      
      // Platform-specific error handling
      if (Platform.OS === 'ios') {
        console.error('iOS specific error details:', error);
      } else if (Platform.OS === 'android') {
        console.error('Android specific error details:', error);
      }
      
      Alert.alert('Sign In Error', `Failed to sign in with Google: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const signInWithApple = async () => {
    // Check if Apple Authentication is supported on this device
    if (!appleAuth.isSupported) {
      Alert.alert('Error', 'Apple Authentication is not supported on this device');
      return;
    }

    try {
      setLoading(true);
      console.log('Starting Apple Sign-In process...');
      
      // Perform the apple sign-in request
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });
      console.log('Apple Auth Request completed');
      
      // Get the credential for Apple Sign In
      const { identityToken, nonce } = appleAuthRequestResponse;
      console.log('Identity token received:', identityToken ? 'Yes' : 'No');
      
      // Make sure we have an identity token
      if (!identityToken) {
        throw new Error('Apple Sign-In failed - no identity token returned');
      }
      
      // Create a Firebase credential from the response
      const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);
      console.log('Apple credential created');
      
      // Sign in with the credential
      const userCredential = await auth().signInWithCredential(appleCredential);
      console.log('Firebase authentication successful');
      
      // Get user information
      const { fullName } = appleAuthRequestResponse;
      let displayName = 'Apple User';
      
      // If we have a name from Apple, use it
      if (fullName && (fullName.givenName || fullName.familyName)) {
        displayName = `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim();
        console.log('Using name from Apple:', displayName);
      }
      
      // Check if this is a new user
      if (userCredential.additionalUserInfo?.isNewUser) {
        console.log('Creating new user in Firestore');
        // Create a new user document in Firestore
        await firestore().collection('users').doc(userCredential.user.uid).set({
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || displayName,
          photoURL: userCredential.user.photoURL,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
        console.log('New user created in Firestore');
      }
    } catch (error: any) {
      console.error('Apple sign in error:', error);
      
      // More detailed error reporting
      if (error.code) {
        console.error(`Error code: ${error.code}`);
      }
      
      // Platform-specific error handling
      if (Platform.OS === 'ios') {
        console.error('iOS specific error details:', error);
      } else if (Platform.OS === 'android') {
        console.error('Android specific error details:', error);
      }
      
      Alert.alert('Sign In Error', `Failed to sign in with Apple: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await auth().signOut();
    } catch (error: any) {
      console.error('Sign out error:', error);
      Alert.alert('Error', error.message || 'Failed to sign out');
    }
  };

  const checkUsernameExists = async (username: string): Promise<boolean> => {
    try {
      const snapshot = await firestore()
        .collection('usernames')
        .doc(username.toLowerCase())
        .get();
      
      return snapshot.exists;
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  };

  const createUsername = async (username: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const usernameExists = await checkUsernameExists(username);
      
      if (usernameExists) {
        Alert.alert('Username taken', 'Please choose another username');
        return false;
      }
      
      // Create a batch to ensure both operations succeed or fail together
      const batch = firestore().batch();
      
      // Add username to user document
      const userRef = firestore().collection('users').doc(user.uid);
      batch.set(userRef, { username }, { merge: true });
      
      // Reserve the username in a separate collection for uniqueness
      const usernameRef = firestore().collection('usernames').doc(username.toLowerCase());
      batch.set(usernameRef, { uid: user.uid });
      
      await batch.commit();
      
      // Update local user state
      setUser(currentUser => {
        if (currentUser) {
          return { ...currentUser, username };
        }
        return currentUser;
      });
      
      return true;
    } catch (error) {
      console.error('Error creating username:', error);
      Alert.alert('Error', 'Failed to create username. Please try again.');
      return false;
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signInWithApple,
    signOut,
    createUsername,
    checkUsernameExists,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};