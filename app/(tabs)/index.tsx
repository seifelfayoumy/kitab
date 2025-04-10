import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, View, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Define Book type
type Book = {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [trendingBooks, setTrendingBooks] = useState<Book[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch trending books on component mount
  useEffect(() => {
    fetchTrendingBooks();
  }, []);

  // Function to fetch trending books from Google Books API
  const fetchTrendingBooks = async () => {
    setIsLoadingTrending(true);
    setError(null);
    
    try {
      // Fetch popular books (using "subject:fiction" as an example)
      const response = await fetch(
        'https://www.googleapis.com/books/v1/volumes?q=subject:fiction&orderBy=relevance&maxResults=20'
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch trending books');
      }
      
      const data = await response.json();
      
      if (data.items && Array.isArray(data.items)) {
        const books: Book[] = data.items.map((item: any) => ({
          id: item.id,
          title: item.volumeInfo.title || 'Unknown Title',
          author: item.volumeInfo.authors ? item.volumeInfo.authors[0] : 'Unknown Author',
          coverUrl: item.volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192?text=No+Cover',
        }));
        
        setTrendingBooks(books);
      } else {
        setTrendingBooks([]);
      }
    } catch (err) {
      console.error('Error fetching trending books:', err);
      setError('Failed to load trending books. Please try again later.');
      setTrendingBooks([]);
    } finally {
      setIsLoadingTrending(false);
    }
  };

  // Function to handle search with Google Books API
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      // Make actual Google Books API call
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=20`
      );
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      
      if (data.items && Array.isArray(data.items)) {
        const books: Book[] = data.items.map((item: any) => ({
          id: item.id,
          title: item.volumeInfo.title || 'Unknown Title',
          author: item.volumeInfo.authors ? item.volumeInfo.authors[0] : 'Unknown Author',
          coverUrl: item.volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192?text=No+Cover',
        }));
        
        setSearchResults(books);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Error searching books:', err);
      setError('An error occurred while searching. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Navigate to book details when a book is clicked
  const handleBookPress = (book: Book) => {
    router.push(`/book-details/${book.id}`);
  };

  // Render book item as just the cover (Letterboxd style)
  const renderBookItem = ({ item }: { item: Book }) => (
    <TouchableOpacity 
      style={styles.bookCoverContainer}
      onPress={() => handleBookPress(item)}
      activeOpacity={0.7}
    >
      <Image 
        source={{ uri: item.coverUrl }} 
        style={styles.bookCover} 
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.appTitle}>Kitab</ThemedText>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { color: Colors[colorScheme ?? 'light'].text }]}
          placeholder="Search for books..."
          placeholderTextColor={Colors[colorScheme ?? 'light'].muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons 
            name="search" 
            size={24} 
            color={Colors[colorScheme ?? 'light'].background} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        {isSearching ? (
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        ) : searchQuery && searchResults.length > 0 ? (
          <>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Search Results</ThemedText>
            <FlatList
              data={searchResults}
              renderItem={renderBookItem}
              keyExtractor={item => item.id}
              numColumns={3}
              columnWrapperStyle={styles.bookRow}
              contentContainerStyle={styles.bookGrid}
            />
          </>
        ) : searchQuery && searchResults.length === 0 ? (
          <ThemedText style={styles.noResults}>No books found. Try a different search.</ThemedText>
        ) : error ? (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        ) : isLoadingTrending ? (
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        ) : (
          <>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Trending Books</ThemedText>
            <FlatList
              data={trendingBooks}
              renderItem={renderBookItem}
              keyExtractor={item => item.id}
              numColumns={3}
              columnWrapperStyle={styles.bookRow}
              contentContainerStyle={styles.bookGrid}
            />
          </>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50, // Account for status bar
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  appTitle: {
    fontSize: 36,
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontFamily: 'Merriweather-Regular',
    fontSize: 16,
  },
  searchButton: {
    width: 50,
    height: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginLeft: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    marginBottom: 15,
  },
  bookGrid: {
    paddingBottom: 20,
  },
  bookRow: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  bookCoverContainer: {
    width: '30%',
    aspectRatio: 2/3,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookCover: {
    width: '100%',
    height: '100%',
  },
  noResults: {
    textAlign: 'center',
    marginTop: 30,
    opacity: 0.7,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#e74c3c',
  },
});
