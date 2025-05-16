import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image, 
  ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Bookshelf } from '@/config/firebase';
import { ThemedText } from './ThemedText';
import { Colors } from '@/constants/Colors';
import { getBooksByIds, getBookCoverUrl } from '@/config/googleBooksApi';
import { useColorScheme } from '@/hooks/useColorScheme';

interface BookshelfCardProps {
  bookshelf: Bookshelf;
  isEditable?: boolean;
  onDelete?: () => void;
}

export function BookshelfCard({ bookshelf, isEditable = false, onDelete }: BookshelfCardProps) {
  const [coverImages, setCoverImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const colorScheme = useColorScheme();
  const router = useRouter();

  useEffect(() => {
    const fetchBookCovers = async () => {
      if (bookshelf.bookIds.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        // Only fetch covers for the first 5 books (for performance)
        const bookIdsToFetch = bookshelf.bookIds.slice(0, 5);
        const books = await getBooksByIds(bookIdsToFetch);
        
        // Get cover URLs from the books
        const covers = books.map(book => getBookCoverUrl(book.volumeInfo));
        setCoverImages(covers);
      } catch (error) {
        console.error('Error fetching book covers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookCovers();
  }, [bookshelf.bookIds]);

  const handlePress = () => {
    router.push(`/bookshelf/${bookshelf.id}`);
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        { backgroundColor: Colors[colorScheme].cardBackground }
      ]} 
      onPress={handlePress}
    >
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.title}>{bookshelf.name}</ThemedText>
        {isEditable && onDelete && (
          <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color={Colors[colorScheme].error} />
          </TouchableOpacity>
        )}
      </View>

      <ThemedText style={styles.bookCount}>
        {bookshelf.bookIds.length} {bookshelf.bookIds.length === 1 ? 'book' : 'books'}
      </ThemedText>

      {isLoading ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        <>
          {coverImages.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.coversContainer}
            >
              {coverImages.map((cover, index) => (
                <Image 
                  key={index} 
                  source={{ uri: cover }} 
                  style={styles.coverImage}
                />
              ))}
              {bookshelf.bookIds.length > 5 && (
                <View style={styles.moreContainer}>
                  <ThemedText style={styles.moreText}>+{bookshelf.bookIds.length - 5}</ThemedText>
                </View>
              )}
            </ScrollView>
          ) : (
            <ThemedText style={styles.emptyText}>No books yet</ThemedText>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 4,
  },
  bookCount: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 12,
  },
  loading: {
    marginVertical: 20,
  },
  coversContainer: {
    paddingVertical: 8,
  },
  coverImage: {
    width: 70,
    height: 100,
    borderRadius: 6,
    marginRight: 12,
  },
  moreContainer: {
    width: 70,
    height: 100,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
    fontStyle: 'italic',
    opacity: 0.7,
  },
}); 