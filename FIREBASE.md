# Firebase Architecture for Kitab

This document outlines the Firebase architecture implemented in Kitab, a book tracking app that allows users to log books, create reviews, and maintain bookshelves.

## Authentication

Kitab uses Firebase Authentication with the following methods:
- Email/Password
- Google Sign-In
- Apple Sign-In (iOS only)

## Database Structure

### Firestore Collections

#### `users`
Stores user profiles.
```
Document ID: <uid> (same as Firebase Auth uid)
Fields:
  - displayName: string
  - avatar: string (name of the avatar selected)
  - createdAt: timestamp
  - email: string
  - bio: string (optional)
```

#### `logs`
Each document represents one book log for one user.
```
Document ID: <auto-id>
Fields:
  - userId: string (uid)
  - googleBookId: string (ID from Google Books API)
  - rating: number (1–5)
  - review: string (optional)
  - loggedAt: timestamp (when they added this log)
  - status: string (optional: "read", "currently-reading", "want-to-read")
```

#### `bookshelves`
Allows users to create custom bookshelves.
```
Document ID: <auto-id>
Fields:
  - userId: string (uid)
  - name: string
  - bookIds: array of strings (Google Book IDs)
  - createdAt: timestamp
```

## Book Data

Book metadata is sourced from the **Google Books API** and is not stored in Firebase except for the ID references. This approach saves storage costs and ensures data is always up-to-date.

## Avatars System

Avatars are stored as local assets in the app, and only the avatar ID is saved in the user's profile. This makes it easy to add new avatars in future app updates.

## Security Rules

The Firestore security rules implement the following access patterns:

1. User profiles: Only the user can edit their own profile, but all authenticated users can view profiles
2. Logs (Reviews): Anyone can read logs, but only the author can edit or delete them
3. Bookshelves: Anyone can read bookshelves, but only the owner can edit or delete them

See [firestore.rules](firebase-rules/firestore.rules) for detailed security rules implementation.

## Getting Started

1. Initialize Firebase in your app using the `initializeFirebase()` function from `config/firebase.ts`
2. Use the Firebase authentication methods through the `useAuth()` hook from `contexts/AuthContext.tsx`
3. Use the book service functions from `config/bookService.ts` to interact with logs and bookshelves
4. Use the Google Books API functions from `config/googleBooksApi.ts` to fetch book data 