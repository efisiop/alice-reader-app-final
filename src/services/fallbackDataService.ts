// src/services/fallbackDataService.ts
// This file provides fallback data when Supabase is unavailable

import { BookWithChapters, SectionWithChapter, BookProgress, BookStats } from '../types/supabase';

// Fallback book data
const fallbackBooks = {
  'alice-in-wonderland': {
    id: 'alice-in-wonderland',
    title: 'Alice in Wonderland',
    author: 'Lewis Carroll',
    description: 'The classic tale of a girl who falls through a rabbit hole into a fantasy world.',
    cover_image_url: null,
    total_pages: 100,
    created_at: new Date().toISOString(),
    chapters: [
      {
        id: 'chapter-1',
        book_id: 'alice-in-wonderland',
        title: 'Down the Rabbit-Hole',
        number: 1,
        created_at: new Date().toISOString(),
        sections: [
          {
            id: 'chapter-1-section-1',
            chapter_id: 'chapter-1',
            title: 'Beginning',
            content: 'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice "without pictures or conversations?"',
            start_page: 1,
            end_page: 3,
            number: 1,
            created_at: new Date().toISOString()
          },
          {
            id: 'chapter-1-section-2',
            chapter_id: 'chapter-1',
            title: 'The Rabbit',
            content: 'There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, "Oh dear! Oh dear! I shall be late!" (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural).',
            start_page: 4,
            end_page: 6,
            number: 2,
            created_at: new Date().toISOString()
          }
        ]
      },
      {
        id: 'chapter-2',
        book_id: 'alice-in-wonderland',
        title: 'The Pool of Tears',
        number: 2,
        created_at: new Date().toISOString(),
        sections: [
          {
            id: 'chapter-2-section-1',
            chapter_id: 'chapter-2',
            title: 'Curiouser and Curiouser',
            content: '"Curiouser and curiouser!" cried Alice (she was so much surprised, that for the moment she quite forgot how to speak good English); "now I\'m opening out like the largest telescope that ever was! Good-bye, feet!"',
            start_page: 11,
            end_page: 14,
            number: 1,
            created_at: new Date().toISOString()
          }
        ]
      }
    ]
  }
};

// Fallback verification codes
const fallbackVerificationCodes = {
  'ALICE123': {
    code: 'ALICE123',
    book_id: 'alice-in-wonderland',
    is_used: false,
    used_by: null,
    created_at: new Date().toISOString(),
    books: {
      id: 'alice-in-wonderland',
      title: 'Alice in Wonderland',
      author: 'Lewis Carroll'
    }
  },
  'WONDERLAND': {
    code: 'WONDERLAND',
    book_id: 'alice-in-wonderland',
    is_used: false,
    used_by: null,
    created_at: new Date().toISOString(),
    books: {
      id: 'alice-in-wonderland',
      title: 'Alice in Wonderland',
      author: 'Lewis Carroll'
    }
  }
};

// Fallback dictionary terms
const fallbackDictionary = [
  {
    id: '1',
    book_id: 'alice-in-wonderland',
    term: 'Alice',
    definition: 'The curious and imaginative protagonist of the story.',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    book_id: 'alice-in-wonderland',
    term: 'Wonderland',
    definition: 'The magical world that Alice discovers after falling down the rabbit hole.',
    created_at: new Date().toISOString()
  }
];

// Helper function to get a book with fallback data
export function getFallbackBook(bookId: string): BookWithChapters | null {
  console.log('Using fallback data for book:', bookId);
  return fallbackBooks[bookId as keyof typeof fallbackBooks] || null;
}

// Helper function to verify a book code with fallback data
export function getFallbackVerificationCode(code: string) {
  console.log('Using fallback data for verification code:', code);
  const upperCode = code.toUpperCase();
  return fallbackVerificationCodes[upperCode as keyof typeof fallbackVerificationCodes] || null;
}

// Helper function to get sections for a specific page with fallback data
export function getFallbackSectionsForPage(bookId: string, pageNumber: number): SectionWithChapter[] {
  console.log('Using fallback data for sections on page:', pageNumber);
  
  const book = fallbackBooks[bookId as keyof typeof fallbackBooks];
  if (!book) return [];
  
  const result: SectionWithChapter[] = [];
  
  book.chapters.forEach(chapter => {
    chapter.sections.forEach(section => {
      if (pageNumber >= section.start_page && pageNumber <= section.end_page) {
        result.push({
          id: section.id,
          chapter_id: section.chapter_id,
          title: section.title,
          content: section.content,
          start_page: section.start_page,
          end_page: section.end_page,
          number: section.number,
          chapter_title: chapter.title,
          chapter_number: chapter.number
        });
      }
    });
  });
  
  return result;
}

// Helper function to get reading progress with fallback data
export function getFallbackReadingProgress(userId: string, bookId: string): BookProgress | null {
  console.log('Using fallback reading progress for user:', userId, 'and book:', bookId);
  
  const book = fallbackBooks[bookId as keyof typeof fallbackBooks];
  if (!book || !book.chapters.length || !book.chapters[0].sections.length) return null;
  
  const firstChapter = book.chapters[0];
  const firstSection = firstChapter.sections[0];
  
  return {
    section_id: firstSection.id,
    last_position: null,
    section_title: firstSection.title,
    chapter_title: firstChapter.title,
    page_number: firstSection.start_page
  };
}

// Helper function to get reading stats with fallback data
export function getFallbackReadingStats(userId: string, bookId: string): BookStats | null {
  console.log('Using fallback reading stats for user:', userId, 'and book:', bookId);
  
  const book = fallbackBooks[bookId as keyof typeof fallbackBooks];
  if (!book) return null;
  
  return {
    id: `fallback-${userId}-${bookId}`,
    user_id: userId,
    book_id: bookId,
    total_reading_time: 0,
    pages_read: 0,
    last_session_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    percentage_complete: 0
  };
}

// Helper function to get dictionary terms with fallback data
export function getFallbackDictionaryTerm(bookId: string, term: string) {
  console.log('Using fallback dictionary for term:', term);
  
  const foundTerm = fallbackDictionary.find(
    item => item.book_id === bookId && item.term.toLowerCase() === term.toLowerCase()
  );
  
  return foundTerm ? foundTerm.definition : null;
}
