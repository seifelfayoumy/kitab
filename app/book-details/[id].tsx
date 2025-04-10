import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';

// Define types
type BookDetails = {
  id: string;
  title: string;
  authors: string[];
  description: string;
  publisher: string;
  publishedDate: string;
  pageCount: number;
  categories: string[];
  coverUrl: string;
  averageRating: number;
  ratingsCount: number;
};

type Review = {
  id: string;
  userId: string;
  username: string;
  rating: number;
  text: string;
  createdAt: any;
  bookId: string;
};

type ShelfType = 'read' | 'currentlyReading' | 'wantToRead' | 'custom';

export default function BookDetailsScreen() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  
  const [bookDetails, setBookDetails] = useState<BookDetails | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [userShelf, setUserShelf] = useState<ShelfType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isAddingToShelf, setIsAddingToShelf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch book details and reviews on component mount
  useEffect(() => {
    if (id) {
      fetchBookDetails();
      fetchReviews();
      if (user) {
        fetchUserShelf();
      }
    }
  }, [id, user]);

  // Function to fetch book details from Google Books API and Firestore
  const fetchBookDetails = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First check if we have this book in Firestore
      const bookDoc = await firestore().collection('books').doc(id as string).get();
      
      if (bookDoc.exists) {
        // Book exists in Firestore, use this data
        const firestoreData = bookDoc.data();
        setBookDetails({
          id: id as string,
          title: firestoreData.title,
          authors: firestoreData.authors,
          description: firestoreData.description,
          publisher: firestoreData.publisher,
          publishedDate: firestoreData.publishedDate,
          pageCount: firestoreData.pageCount,
          categories: firestoreData.categories,
          coverUrl: firestoreData.coverUrl,
          averageRating: firestoreData.averageRating,
          ratingsCount: firestoreData.ratingsCount
        });
      } else {
        // Book doesn't exist in Firestore, fetch from Google Books API
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch book details');
        }
        
        const data = await response.json();
        const volumeInfo = data.volumeInfo;
        
        const bookData = {
          id: id as string,
          title: volumeInfo.title || 'Unknown Title',
          authors: volumeInfo.authors || ['Unknown Author'],
          description: volumeInfo.description || 'No description available',
          publisher: volumeInfo.publisher || 'Unknown Publisher',
          publishedDate: volumeInfo.publishedDate || 'Unknown Date',
          pageCount: volumeInfo.pageCount || 0,
          categories: volumeInfo.categories || [],
          coverUrl: volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192?text=No+Cover',
          averageRating: volumeInfo.averageRating || 0,
          ratingsCount: volumeInfo.ratingsCount || 0
        };
        
        setBookDetails(bookData);
        
        // Save this book to Firestore for future reference
        await firestore().collection('books').doc(id as string).set(bookData);
      }
    } catch (err) {
      console.error('Error fetching book details:', err);
      setError('Failed to load book details. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch reviews from Firestore
  const fetchReviews = async () => {
    try {
      const reviewsSnapshot = await firestore()
        .collection('reviews')
        .where('bookId', '==', id)
        .orderBy('createdAt', 'desc')
        .get();
      
      const reviewsData: Review[] = [];
      
      reviewsSnapshot.forEach(doc => {
        const review = { id: doc.id, ...doc.data() } as Review;
        reviewsData.push(review);
        
        // Check if this is the current user's review
        if (user && review.userId === user.uid) {
          setUserReview(review);
        }
      });
      
      setReviews(reviewsData);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  // Function to fetch user's shelf for this book
  const fetchUserShelf = async () => {
    if (!user) return;
    
    try {
      const shelfSnapshot = await firestore()
        .collection('shelves')
        .where('userId', '==', user.uid)
        .where('bookId', '==', id)
        .limit(1)
        .get();
      
      if (!shelfSnapshot.empty) {
        const shelfData = shelfSnapshot.docs[0].data();
        setUserShelf(shelfData.type as ShelfType);
      }
    } catch (err) {
      console.error('Error fetching user shelf:', err);
    }
  };

  // Function to add book to a shelf
  const addToShelf = async (shelfType: ShelfType) => {
    if (!user || !bookDetails) return;
    
    setIsAddingToShelf(true);
    
    try {
      // Check if book is already on a shelf
      const shelfSnapshot = await firestore()
        .collection('shelves')
        .where('userId', '==', user.uid)
        .where('bookId', '==', id)
        .limit(1)
        .get();
      
      if (!shelfSnapshot.empty) {
        // Update existing shelf
        const shelfDoc = shelfSnapshot.docs[0];
        await shelfDoc.ref.update({ type: shelfType });
      } else {
        // Add to new shelf
        await firestore().collection('shelves').add({
          userId: user.uid,
          bookId: id,
          type: shelfType,
          addedAt: firestore.FieldValue.serverTimestamp(),
          title: bookDetails.title,
          authors: bookDetails.authors,
          coverUrl: bookDetails.coverUrl
        });
      }
      
      setUserShelf(shelfType);
    } catch (err) {
      console.error('Error adding to shelf:', err);
      setError('Failed to add book to shelf. Please try again.');
    } finally {
      setIsAddingToShelf(false);
    }
  };

  // Function to navigate to review screen
  const navigateToReview = () => {
    if (bookDetails) {
      router.push({
        pathname: `/write-review/${id}`,
        params: {
          title: bookDetails.title,
          coverUrl: bookDetails.coverUrl,
          existingRating: userReview?.rating || 0,
          existingText: userReview?.text || ''
        }
      });
    }
  };

  // Function to render star rating
  const renderStarRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons 
          key={`full-${i}`} 
          name="star" 
          size={20} 
          color="#FFD700" 
          style={styles.starIcon} 
        />
      );
    }
    
    // Half star
    if (halfStar) {
      stars.push(
        <Ionicons 
          key="half" 
          name="star-half" 
          size={20} 
          color="#FFD700" 
          style={styles.starIcon} 
        />
      );
    }
    
    // Empty stars
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons 
          key={`empty-${i}`} 
          name="star-outline" 
          size={20} 
          color="#FFD700" 
          style={styles.starIcon} 
        />
      );
    }
    
    return stars;
  };

  // Function to render review item
  const renderReviewItem = (review: Review) => (
    <View key={review.id} style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <ThemedText type="defaultSemiBold">{review.username}</ThemedText>
        <View style={styles.ratingContainer}>
          {renderStarRating(review.rating)}
        </View>
      </View>
      <ThemedText style={styles.reviewText}>{review.text}</ThemedText>
    </View>
  );

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        <ThemedText style={styles.loadingText}>Loading book details...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={fetchBookDetails}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  if (!bookDetails) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>Book not found</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <ThemedText style={styles.retryButtonText}>Go Back</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{
          title: '',
          headerShown: true,
          headerTransparent: true,
          headerBackTitle: 'Back',
          headerTintColor: Colors[colorScheme ?? 'light'].text,
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Book Cover and Basic Info */}
        <View style={styles.heroSection}>
          <Image 
            source={{ uri: bookDetails.coverUrl }} 
            style={styles.coverImage} 
            resizeMode="cover"
          />
          <View style={styles.basicInfo}>
            <ThemedText type="title" style={styles.title}>{bookDetails.title}</ThemedText>
            <ThemedText style={styles.author}>
              {bookDetails.authors.join(', ')}
            </ThemedText>
            
            {/* Rating */}
            <View style={styles.ratingContainer}>
              {renderStarRating(bookDetails.averageRating)}
              <ThemedText style={styles.ratingText}>
                {bookDetails.averageRating.toFixed(1)} ({bookDetails.ratingsCount} ratings)
              </ThemedText>
            </View>
          </View>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.shelfButton, userShelf === 'read' && styles.activeShelfButton]}
            onPress={() => addToShelf('read')}
            disabled={isAddingToShelf}
          >
            <ThemedText 
              style={[styles.shelfButtonText, userShelf === 'read' && styles.activeShelfButtonText]}
            >
              Read
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.shelfButton, userShelf === 'currentlyReading' && styles.activeShelfButton]}
            onPress={() => addToShelf('currentlyReading')}
            disabled={isAddingToShelf}
          >
            <ThemedText 
              style={[styles.shelfButtonText, userShelf === 'currentlyReading' && styles.activeShelfButtonText]}
            >
              Currently Reading
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.shelfButton, userShelf === 'wantToRead' && styles.activeShelfButton]}
            onPress={() => addToShelf('wantToRead')}
            disabled={isAddingToShelf}
          >
            <ThemedText 
              style={[styles.shelfButtonText, userShelf === 'wantToRead' && styles.activeShelfButtonText]}
            >
              Want to Read
            </ThemedText>
          </TouchableOpacity>
        </View>
        
        {/* Write Review Button */}
        <TouchableOpacity 
          style={styles.writeReviewButton}
          onPress={navigateToReview}
        >
          <Ionicons name="create-outline" size={20} color="#fff" style={styles.reviewIcon} />
          <ThemedText style={styles.writeReviewText}>
            {userReview ? 'Edit Your Review' : 'Write a Review'}
          </ThemedText>
        </TouchableOpacity>
        
        {/* Book Details */}
        <View style={styles.detailsSection}>
          <ThemedText type="subtitle" style={styles.sectionHeader}>About this book</ThemedText>
          <ThemedText style={styles.description}>{bookDetails.description}</ThemedText>
          
          <View style={styles.metadataContainer}>
            <View style={styles.metadataItem}>
              <ThemedText style={styles.metadataLabel}>Publisher</ThemedText>
              <ThemedText style={styles.metadataValue}>{bookDetails.publisher}</ThemedText>
            </View>
            
            <View style={styles.metadataItem}>
              <ThemedText style={styles.metadataLabel}>Published</ThemedText>
              <ThemedText style={styles.metadataValue}>{bookDetails.publishedDate}</ThemedText>
            </View>
            
            <View style={styles.metadataItem}>
              <ThemedText style={styles.metadataLabel}>Pages</ThemedText>
              <ThemedText style={styles.metadataValue}>{bookDetails.pageCount}</ThemedText>
            </View>
            
            {bookDetails.categories.length > 0 && (
              <View style={styles.metadataItem}>
                <ThemedText style={styles.metadataLabel}>Genres</ThemedText>
                <ThemedText style={styles.metadataValue}>{bookDetails.categories.join(', ')}</ThemedText>
              </View>
            )}
          </View>
        </View>
        
        {/* Reviews Section */}
        <View style={styles.reviewsSection}>
          <ThemedText type="subtitle" style={styles.sectionHeader}>
            Reviews ({reviews.length})
          </ThemedText>
          
          {reviews.length > 0 ? (
            <View style={styles.reviewsList}>
              {reviews.map(review => renderReviewItem(review))}
            </View>
          ) : (
            <ThemedText style={styles.noReviewsText}>
              No reviews yet. Be the first to review this book!
            </ThemedText>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginBottom: 20,
    textAlign: 'center',
    color: '#e74c3c',
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  heroSection: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 100, // Extra padding for header
  },
  coverImage: {
    width: 120,
    height: 180,
    borderRadius: 8,
  },
  basicInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 5,
  },
  author: {
    fontSize: 16,
    marginBottom: 10,
    opacity: 0.8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  starIcon: {
    marginRight: 2,
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  shelfButton: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  activeShelfButton: {
    backgroundColor: '#4CAF50',
  },
  shelfButtonText: {
    fontSize: 12,
    textAlign: 'center',
  },
  activeShelfButtonText: {
    color: '#fff',
  },
  writeReviewButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewIcon: {
    marginRight: 8,
  },
  writeReviewText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  detailsSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  sectionHeader: {
    marginBottom: 15,
  },
  description: {
    lineHeight: 24,
    marginBottom: 20,
  },
  metadataContainer: {
    marginTop: 10,
  },
  metadataItem: {
    marginBottom: 10,
  },
  metadataLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  metadataValue: {
    fontSize: 16,
  },
  reviewsSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingBottom: 40,
  },
  reviewsList: {
    marginTop: 10,
  },
  reviewItem: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  reviewText: {
    lineHeight: 22,
  },
  noReviewsText: {
    textAlign: 'center',
    marginTop: 20,
    opacity: 0.7,
  },
});