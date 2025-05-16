import { 
  firestore, 
  COLLECTIONS, 
  BookLog, 
  BookStatus, 
  Bookshelf,
  getCollection,
  getDoc,
  getFirestore,
} from './firebase';

/**
 * Add or update a book log (review)
 */
export const saveBookLog = async (
  userId: string,
  googleBookId: string,
  rating: number,
  review?: string,
  status?: BookStatus
): Promise<string> => {
  try {
    // Check if user already has a log for this book
    const existingLogsSnapshot = await getCollection(COLLECTIONS.LOGS)
      .where('userId', '==', userId)
      .where('googleBookId', '==', googleBookId)
      .limit(1)
      .get();

    const logData: Omit<BookLog, 'id'> = {
      userId,
      googleBookId,
      rating,
      review,
      status,
      loggedAt: new Date(),
    };

    let logId: string;

    if (!existingLogsSnapshot.empty) {
      // Update existing log
      const existingLog = existingLogsSnapshot.docs[0];
      await existingLog.ref.update({
        ...logData,
        loggedAt: firestore.FieldValue.serverTimestamp(),
      });
      logId = existingLog.id;
    } else {
      // Create new log
      const docRef = await getCollection(COLLECTIONS.LOGS).add({
        ...logData,
        loggedAt: firestore.FieldValue.serverTimestamp(),
      });
      logId = docRef.id;
    }

    return logId;
  } catch (error) {
    console.error('Error saving book log:', error);
    throw error;
  }
};

/**
 * Get all logs for a user
 */
export const getUserLogs = async (userId: string): Promise<BookLog[]> => {
  try {
    const logsSnapshot = await getCollection(COLLECTIONS.LOGS)
      .where('userId', '==', userId)
      .orderBy('loggedAt', 'desc')
      .get();

    return logsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      loggedAt: doc.data().loggedAt?.toDate() || new Date(),
    } as BookLog));
  } catch (error) {
    console.error('Error getting user logs:', error);
    throw error;
  }
};

/**
 * Get logs for a specific book for a user
 */
export const getBookLogs = async (
  userId: string,
  googleBookId: string
): Promise<BookLog[]> => {
  try {
    const logsSnapshot = await getCollection(COLLECTIONS.LOGS)
      .where('userId', '==', userId)
      .where('googleBookId', '==', googleBookId)
      .get();

    return logsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      loggedAt: doc.data().loggedAt?.toDate() || new Date(),
    } as BookLog));
  } catch (error) {
    console.error('Error getting book logs:', error);
    throw error;
  }
};

/**
 * Delete a log
 */
export const deleteLog = async (logId: string): Promise<void> => {
  try {
    await getCollection(COLLECTIONS.LOGS).doc(logId).delete();
  } catch (error) {
    console.error('Error deleting log:', error);
    throw error;
  }
};

/**
 * Create a new bookshelf
 */
export const createBookshelf = async (
  userId: string,
  name: string,
  bookIds: string[] = []
): Promise<string> => {
  try {
    const bookshelfData: Omit<Bookshelf, 'id'> = {
      userId,
      name,
      bookIds,
      createdAt: new Date(),
    };

    const docRef = await getCollection(COLLECTIONS.BOOKSHELVES).add({
      ...bookshelfData,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating bookshelf:', error);
    throw error;
  }
};

/**
 * Get all bookshelves for a user
 */
export const getUserBookshelves = async (userId: string): Promise<Bookshelf[]> => {
  try {
    const bookshelvesSnapshot = await getCollection(COLLECTIONS.BOOKSHELVES)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return bookshelvesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    } as Bookshelf));
  } catch (error) {
    console.error('Error getting user bookshelves:', error);
    throw error;
  }
};

/**
 * Get a specific bookshelf
 */
export const getBookshelf = async (bookshelfId: string): Promise<Bookshelf | null> => {
  try {
    const doc = await getCollection(COLLECTIONS.BOOKSHELVES).doc(bookshelfId).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate() || new Date(),
    } as Bookshelf;
  } catch (error) {
    console.error('Error getting bookshelf:', error);
    throw error;
  }
};

/**
 * Add a book to a bookshelf
 */
export const addBookToBookshelf = async (
  bookshelfId: string,
  googleBookId: string
): Promise<void> => {
  try {
    await getCollection(COLLECTIONS.BOOKSHELVES)
      .doc(bookshelfId)
      .update({
        bookIds: firestore.FieldValue.arrayUnion(googleBookId),
      });
  } catch (error) {
    console.error('Error adding book to bookshelf:', error);
    throw error;
  }
};

/**
 * Remove a book from a bookshelf
 */
export const removeBookFromBookshelf = async (
  bookshelfId: string,
  googleBookId: string
): Promise<void> => {
  try {
    await getCollection(COLLECTIONS.BOOKSHELVES)
      .doc(bookshelfId)
      .update({
        bookIds: firestore.FieldValue.arrayRemove(googleBookId),
      });
  } catch (error) {
    console.error('Error removing book from bookshelf:', error);
    throw error;
  }
};

/**
 * Delete a bookshelf
 */
export const deleteBookshelf = async (bookshelfId: string): Promise<void> => {
  try {
    await getCollection(COLLECTIONS.BOOKSHELVES).doc(bookshelfId).delete();
  } catch (error) {
    console.error('Error deleting bookshelf:', error);
    throw error;
  }
}; 