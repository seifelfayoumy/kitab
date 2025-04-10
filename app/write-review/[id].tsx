import React, { useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';

export default function WriteReviewScreen() {
  const { id, title, coverUrl, existingRating, existingText } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  
  const [rating, setRating] = useState(Number(existingRating) || 0);
  const [reviewText, setReviewText] = useState(existingText as string || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to handle star rating selection
  const handleRatingPress = (selectedRating: number) => {
    // If user taps the same star twice, allow for half-star ratings
    if (rating === selectedRating) {
      setRating(selectedRating - 0.5);
    } else {
      setRating(selectedRating);
    }
  };

  // Function to render star rating
  const renderStarRating = () => {
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      let iconName = 'star-outline';
      
      if (i <= Math.floor(rating)) {
        iconName = 'star';
      } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
        iconName = 'star-half';
      }
      
      stars.push(
        <TouchableOpacity 
          key={i} 
          onPress={() => handleRatingPress(i)}
          style={styles.starButton}
        >
          <Ionicons 
            name={iconName} 
            size={40} 
            color="#FFD700" 
          />
        </TouchableOpacity>
      );
    }
    
    return stars;
  };

  // Function to submit review
  const submitReview = async () => {
    if (!user) {
      setError('You must be logged in to submit a review');
      return;
    }
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Check if user already has a review for this book
      const reviewsSnapshot = await firestore()
        .collection('reviews')
        .where('userId', '==', user.uid)
        .where('bookId', '==', id)
        .limit(1)
        .get();
      
      const reviewData = {
        userId: user.uid,
        username: user.username || 'Anonymous',
        bookId: id,
        rating,
        text: reviewText.trim(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };
      
      if (!reviewsSnapshot.empty) {
        // Update existing review
        const reviewDoc = reviewsSnapshot.docs[0];
        await reviewDoc.ref.update(reviewData);
      } else {
        // Create new review
        reviewData.createdAt = firestore.FieldValue.serverTimestamp();
        await firestore().collection('reviews').add(reviewData);
        
        // Update book's rating in Firestore
        updateBookRating();
      }
      
      // Navigate back to book details
      router.back();
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to update book's average rating
  const updateBookRating = async () => {
    try {
      // Get all reviews for this book
      const reviewsSnapshot = await firestore()
        .collection('reviews')
        .where('bookId', '==', id)
        .get();
      
      if (!reviewsSnapshot.empty) {
        const reviews = reviewsSnapshot.docs.map(doc => doc.data());
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;
        
        // Update book document with new rating
        await firestore().collection('books').doc(id as string).update({
          averageRating,
          ratingsCount: reviews.length
        });
      }
    } catch (err) {
      console.error('Error updating book rating:', err);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Write Review',
          headerShown: true,
        }} 
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.bookInfo}>
          <Image 
            source={{ uri: coverUrl as string }} 
            style={styles.coverImage} 
            resizeMode="cover"
          />
          <ThemedText type="subtitle" style={styles.bookTitle}>
            {title}
          </ThemedText>
        </View>
        
        <View style={styles.ratingContainer}>
          <ThemedText style={styles.ratingLabel}>Your Rating</ThemedText>
          <View style={styles.starsContainer}>
            {renderStarRating()}
          </View>
          <ThemedText style={styles.ratingValue}>
            {rating > 0 ? rating.toFixed(1) : 'Not rated'}
          </ThemedText>
        </View>
        
        <View style={styles.reviewContainer}>
          <ThemedText style={styles.reviewLabel}>Your Review (Optional)</ThemedText>
          <TextInput
            style={[styles.reviewInput, { color: Colors[colorScheme ?? 'light'].text }]}
            placeholder="Write your thoughts about this book..."
            placeholderTextColor={Colors[colorScheme ?? 'light'].muted}
            multiline
            value={reviewText}
            onChangeText={setReviewText}
          />
        </View>
        
        {error && (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        )}
        
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={submitReview}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <ThemedText style={styles.submitButtonText}>Submit Review</ThemedText>
          )}
        </TouchableOpacity>
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
    padding: 20,
  },
  bookInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  coverImage: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginBottom: 10,
  },
  bookTitle: {
    textAlign: 'center',
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  ratingLabel: {
    fontSize: 18,
    marginBottom: 15,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  starButton: {
    padding: 5,
  },
  ratingValue: {
    marginTop: 10,
    fontSize: 16,
  },
  reviewContainer: {
    marginBottom: 30,
  },
  reviewLabel: {
    fontSize: 18,
    marginBottom: 10,
  },
  reviewInput: {
    height: 150,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 15,
    textAlignVertical: 'top',
    fontFamily: 'Merriweather-Regular',
    fontSize: 16,
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 15,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});