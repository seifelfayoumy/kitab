import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import appleAuth from '@invertase/react-native-apple-authentication';
import { useRouter } from 'expo-router';

// Import from our config
import { 
  getAuth,
  getFirestore,
  getCollection,
  COLLECTIONS, 
  User as FirebaseUser,
  GoogleAuthProvider,
  AppleAuthProvider,
  firestore, // for backward compatibility
} from '@/config/firebase';

type AuthContextType = {
  user: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  createProfile: (displayName: string, avatar: string) => Promise<boolean>;
  checkUsernameExists: (username: string) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithApple: async () => {},
  signOut: async () => {},
  createProfile: async () => false,
  checkUsernameExists: async () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Handle user authentication state changes
  useEffect(() => {
    const unsubscribe = getAuth().onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in
          const userDoc = await getCollection(COLLECTIONS.USERS)
            .doc(firebaseUser.uid)
            .get();
          
          const userData = userDoc.data();
          
          if (userData) {
            // User has profile data
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: userData.displayName,
              avatar: userData.avatar,
              createdAt: userData.createdAt?.toDate() || new Date(),
              bio: userData.bio,
            });
          } else {
            // User is authenticated but has no profile
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: null,
              avatar: null,
              createdAt: new Date(),
            });
          }
        } else {
          // User is signed out
          setUser(null);
        }
      } catch (error) {
        console.error('Error handling auth state change:', error);
        // Reset user state on error
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    if (loading) return;
    
    try {
      await GoogleSignin.hasPlayServices();
      
      // Sign in with Google
      const signInResult = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      
      if (!tokens.idToken) {
        throw new Error('Failed to get Google ID token');
      }
      
      // Create a Google credential
      const googleCredential = GoogleAuthProvider.credential(tokens.idToken);
      
      // Sign in with credential
      await getAuth().signInWithCredential(googleCredential);
    } catch (error: any) {
      console.error('Google sign in error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the login flow');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Play services not available or outdated');
      } else {
        Alert.alert('Error', 'Failed to sign in with Google');
      }
    }
  };

  const signInWithApple = async () => {
    if (loading) return;
    
    // Only available on iOS
    if (!appleAuth.isSupported || Platform.OS !== 'ios') {
      Alert.alert('Error', 'Apple authentication is only supported on iOS devices');
      return;
    }

    try {
      const appleAuthResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });

      if (!appleAuthResponse.identityToken) {
        throw new Error('Apple Sign-In failed - no identity token returned');
      }

      const { identityToken, nonce } = appleAuthResponse;
      const appleCredential = AppleAuthProvider.credential(identityToken, nonce);
      
      await getAuth().signInWithCredential(appleCredential);
    } catch (error: any) {
      console.error('Apple sign in error:', error);
      
      if (error.code === appleAuth.Error.CANCELED) {
        console.log('User cancelled Apple Sign in');
      } else {
        Alert.alert('Error', 'Failed to sign in with Apple. Please try again.');
      }
    }
  };

  const signOut = async () => {
    if (loading) return;
    
    try {
      // Sign out from Firebase
      await getAuth().signOut();
      
      // Try to sign out from Google
      try {
        await GoogleSignin.signOut();
      } catch (error) {
        console.log('Google sign out error (non-critical):', error);
      }
      
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const createProfile = async (displayName: string, avatar: string): Promise<boolean> => {
    if (!user || loading) {
      Alert.alert('Error', 'You must be logged in to create a profile');
      return false;
    }

    try {
      // Create user profile in Firestore
      await getCollection(COLLECTIONS.USERS)
        .doc(user.uid)
        .set({
          displayName,
          avatar,
          email: user.email,
          createdAt: firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

      // Update local user state
      setUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          displayName,
          avatar,
        };
      });

      return true;
    } catch (error) {
      console.error('Error creating profile:', error);
      Alert.alert('Error', 'Failed to create profile. Please try again.');
      return false;
    }
  };

  const checkUsernameExists = async (username: string): Promise<boolean> => {
    try {
      const querySnapshot = await getCollection(COLLECTIONS.USERS)
        .where('displayName', '==', username)
        .limit(1)
        .get();

      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking username:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithApple,
        signOut,
        createProfile,
        checkUsernameExists,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};