// Google Books API base URL
const BASE_URL = 'https://www.googleapis.com/books/v1';

export interface GoogleBookVolumeInfo {
  title: string;
  subtitle?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  pageCount?: number;
  categories?: string[];
  averageRating?: number;
  ratingsCount?: number;
  imageLinks?: {
    smallThumbnail?: string;
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
    extraLarge?: string;
  };
  language?: string;
  previewLink?: string;
  infoLink?: string;
  canonicalVolumeLink?: string;
}

export interface GoogleBookItem {
  id: string;
  volumeInfo: GoogleBookVolumeInfo;
  searchInfo?: {
    textSnippet?: string;
  };
}

export interface GoogleBooksResponse {
  items: GoogleBookItem[];
  totalItems: number;
  kind: string;
}

/**
 * Search for books by query
 */
export const searchBooks = async (
  query: string,
  startIndex = 0,
  maxResults = 20
): Promise<{ books: GoogleBookItem[]; totalItems: number }> => {
  try {
    const response = await fetch(
      `${BASE_URL}/volumes?q=${encodeURIComponent(query)}&startIndex=${startIndex}&maxResults=${maxResults}`
    );

    if (!response.ok) {
      throw new Error(`Error searching books: ${response.statusText}`);
    }

    const data = await response.json() as GoogleBooksResponse;
    
    return {
      books: data.items || [],
      totalItems: data.totalItems || 0,
    };
  } catch (error) {
    console.error('Error searching books:', error);
    return { books: [], totalItems: 0 };
  }
};

/**
 * Get a book by ID
 */
export const getBookById = async (bookId: string): Promise<GoogleBookItem | null> => {
  try {
    const response = await fetch(`${BASE_URL}/volumes/${bookId}`);

    if (!response.ok) {
      throw new Error(`Error fetching book: ${response.statusText}`);
    }

    const data = await response.json() as GoogleBookItem;
    return data;
  } catch (error) {
    console.error(`Error fetching book ${bookId}:`, error);
    return null;
  }
};

/**
 * Get multiple books by IDs
 */
export const getBooksByIds = async (bookIds: string[]): Promise<GoogleBookItem[]> => {
  try {
    // The Google Books API doesn't have a batch endpoint,
    // so we need to fetch each book individually
    const bookPromises = bookIds.map(id => getBookById(id));
    const books = await Promise.all(bookPromises);
    
    // Filter out null results
    return books.filter(book => book !== null) as GoogleBookItem[];
  } catch (error) {
    console.error('Error fetching multiple books:', error);
    return [];
  }
};

/**
 * Get a cover image URL from a book
 * Returns the best available image or a placeholder
 */
export const getBookCoverUrl = (volumeInfo: GoogleBookVolumeInfo): string => {
  // Try to get the best image available
  if (volumeInfo.imageLinks) {
    return (
      volumeInfo.imageLinks.large ||
      volumeInfo.imageLinks.medium ||
      volumeInfo.imageLinks.small ||
      volumeInfo.imageLinks.thumbnail ||
      volumeInfo.imageLinks.smallThumbnail ||
      'https://via.placeholder.com/128x192?text=No+Cover'
    );
  }
  
  return 'https://via.placeholder.com/128x192?text=No+Cover';
}; 