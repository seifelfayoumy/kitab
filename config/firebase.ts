import { initializeApp, getApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Initialize Firebase
export const initializeFirebase = () => {
  // Firebase is initialized via native modules
  
  // Configure Google Sign-In
  GoogleSignin.configure({
    webClientId: Platform.select({
      ios: '678486496496-3td8npji90k790jp6e7k2jqvc5vilb42.apps.googleusercontent.com',
      android: '678486496496-575rff4q3f0s7cetvetpnkuvb9ge46l7.apps.googleusercontent.com',
    }),
    offlineAccess: true,
  });
};

// Get Firebase instances
export const getFirebaseApp = () => getApp();
export const getFirestore = () => firestore();
export const getAuth = () => auth();

// Helper for Firestore collections
export const getCollection = (name: string) => firestore().collection(name);
export const getDoc = (collectionName: string, docId: string) => 
  firestore().collection(collectionName).doc(docId);

// Firebase authentication helpers
export const GoogleAuthProvider = auth.GoogleAuthProvider;
export const AppleAuthProvider = auth.AppleAuthProvider;

// Firestore collection names
export const COLLECTIONS = {
  USERS: 'users',
  LOGS: 'logs',
  BOOKSHELVES: 'bookshelves',
};

// Book status types
export enum BookStatus {
  READ = 'read',
  CURRENTLY_READING = 'currently-reading',
  WANT_TO_READ = 'want-to-read',
}

// User type with Firebase Auth and custom fields
export type User = {
  uid: string;
  displayName: string | null;
  email: string | null;
  avatar: string | null;
  createdAt: Date;
  bio?: string;
};

// Book log type
export type BookLog = {
  id?: string;
  userId: string;
  googleBookId: string;
  rating: number;
  review?: string;
  loggedAt: Date;
  status?: BookStatus;
};

// Bookshelf type
export type Bookshelf = {
  id?: string;
  userId: string;
  name: string;
  bookIds: string[];
  createdAt: Date;
};

// Export Firebase services for backward compatibility
// but prefer using the helper functions above
export { auth, firestore }; 