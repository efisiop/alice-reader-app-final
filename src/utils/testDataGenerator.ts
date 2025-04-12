// src/utils/testDataGenerator.ts
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a random user
 * @param isConsultant Whether the user is a consultant
 * @returns A random user object
 */
export function generateUser(isConsultant = false) {
  const userId = uuidv4();
  const email = `test-${Math.floor(Math.random() * 10000)}@example.com`;
  
  return {
    id: userId,
    email,
    created_at: new Date().toISOString(),
    is_consultant: isConsultant,
  };
}

/**
 * Generate a random book
 * @returns A random book object
 */
export function generateBook() {
  const bookId = uuidv4();
  const titles = [
    'Alice in Wonderland',
    'Through the Looking Glass',
    'The Hunting of the Snark',
    'Sylvie and Bruno',
    'Phantasmagoria',
  ];
  
  return {
    id: bookId,
    title: titles[Math.floor(Math.random() * titles.length)],
    author: 'Lewis Carroll',
    description: 'A classic tale by Lewis Carroll',
    cover_image_url: null,
    total_pages: Math.floor(Math.random() * 100) + 50,
    created_at: new Date().toISOString(),
  };
}

/**
 * Generate random chapters for a book
 * @param bookId The book ID
 * @param count The number of chapters to generate
 * @returns An array of random chapter objects
 */
export function generateChapters(bookId: string, count = 5) {
  const chapters = [];
  
  for (let i = 1; i <= count; i++) {
    chapters.push({
      id: uuidv4(),
      book_id: bookId,
      title: `Chapter ${i}`,
      number: i,
      created_at: new Date().toISOString(),
    });
  }
  
  return chapters;
}

/**
 * Generate random sections for a chapter
 * @param chapterId The chapter ID
 * @param count The number of sections to generate
 * @returns An array of random section objects
 */
export function generateSections(chapterId: string, count = 3) {
  const sections = [];
  
  for (let i = 1; i <= count; i++) {
    sections.push({
      id: uuidv4(),
      chapter_id: chapterId,
      title: `Section ${i}`,
      content: `This is the content of section ${i}. It contains some text that the reader can read.`,
      page_number: i,
      created_at: new Date().toISOString(),
    });
  }
  
  return sections;
}

/**
 * Generate random reading progress
 * @param userId The user ID
 * @param bookId The book ID
 * @returns A random reading progress object
 */
export function generateReadingProgress(userId: string, bookId: string) {
  return {
    id: uuidv4(),
    user_id: userId,
    book_id: bookId,
    current_page: Math.floor(Math.random() * 50) + 1,
    current_section_id: uuidv4(),
    last_read_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Generate random reading statistics
 * @param userId The user ID
 * @param bookId The book ID
 * @returns A random reading statistics object
 */
export function generateReadingStats(userId: string, bookId: string) {
  const pagesRead = Math.floor(Math.random() * 50) + 1;
  const totalReadingTime = Math.floor(Math.random() * 3600) + 600; // 10-70 minutes in seconds
  
  return {
    id: uuidv4(),
    user_id: userId,
    book_id: bookId,
    pages_read: pagesRead,
    total_reading_time: totalReadingTime,
    last_session_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Generate random reading sessions
 * @param userId The user ID
 * @param bookId The book ID
 * @param count The number of sessions to generate
 * @returns An array of random reading session objects
 */
export function generateReadingSessions(userId: string, bookId: string, count = 7) {
  const sessions = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    sessions.push({
      id: uuidv4(),
      user_id: userId,
      book_id: bookId,
      date: date.toISOString().split('T')[0],
      duration: Math.floor(Math.random() * 1800) + 300, // 5-35 minutes in seconds
      pages_read: Math.floor(Math.random() * 10) + 1,
      created_at: date.toISOString(),
      updated_at: date.toISOString(),
    });
  }
  
  return sessions;
}

/**
 * Generate random AI interactions
 * @param userId The user ID
 * @param bookId The book ID
 * @param count The number of interactions to generate
 * @returns An array of random AI interaction objects
 */
export function generateAIInteractions(userId: string, bookId: string, count = 5) {
  const interactions = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    date.setHours(date.getHours() - i);
    
    interactions.push({
      id: uuidv4(),
      user_id: userId,
      book_id: bookId,
      question: `What is the meaning of ${i + 1}?`,
      answer: `The meaning of ${i + 1} is ${i + 1}.`,
      created_at: date.toISOString(),
      updated_at: date.toISOString(),
    });
  }
  
  return interactions;
}

/**
 * Generate random help requests
 * @param userId The user ID
 * @param bookId The book ID
 * @param count The number of help requests to generate
 * @returns An array of random help request objects
 */
export function generateHelpRequests(userId: string, bookId: string, count = 3) {
  const helpRequests = [];
  const now = new Date();
  const statuses = ['pending', 'in_progress', 'resolved'];
  
  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    date.setHours(date.getHours() - i);
    
    helpRequests.push({
      id: uuidv4(),
      user_id: userId,
      book_id: bookId,
      message: `I need help with ${i + 1}.`,
      status: statuses[i % statuses.length],
      created_at: date.toISOString(),
      updated_at: date.toISOString(),
    });
  }
  
  return helpRequests;
}

/**
 * Generate random user feedback
 * @param userId The user ID
 * @param bookId The book ID
 * @param count The number of feedback items to generate
 * @returns An array of random user feedback objects
 */
export function generateUserFeedback(userId: string, bookId: string, count = 3) {
  const feedback = [];
  const now = new Date();
  const categories = ['aha_moment', 'positive_experience', 'challenge', 'suggestion'];
  
  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    date.setHours(date.getHours() - i);
    
    feedback.push({
      id: uuidv4(),
      user_id: userId,
      book_id: bookId,
      category: categories[i % categories.length],
      message: `This is feedback ${i + 1}.`,
      created_at: date.toISOString(),
      updated_at: date.toISOString(),
    });
  }
  
  return feedback;
}

/**
 * Generate a complete test dataset
 * @param userCount The number of users to generate
 * @param consultantCount The number of consultants to generate
 * @returns A complete test dataset
 */
export function generateTestDataset(userCount = 5, consultantCount = 2) {
  const users = [];
  const consultants = [];
  const books = [];
  const chapters = [];
  const sections = [];
  const readingProgress = [];
  const readingStats = [];
  const readingSessions = [];
  const aiInteractions = [];
  const helpRequests = [];
  const userFeedback = [];
  
  // Generate users
  for (let i = 0; i < userCount; i++) {
    users.push(generateUser());
  }
  
  // Generate consultants
  for (let i = 0; i < consultantCount; i++) {
    consultants.push(generateUser(true));
  }
  
  // Generate books
  for (let i = 0; i < 3; i++) {
    const book = generateBook();
    books.push(book);
    
    // Generate chapters
    const bookChapters = generateChapters(book.id);
    chapters.push(...bookChapters);
    
    // Generate sections
    for (const chapter of bookChapters) {
      const chapterSections = generateSections(chapter.id);
      sections.push(...chapterSections);
    }
    
    // Generate user data
    for (const user of users) {
      // Reading progress
      readingProgress.push(generateReadingProgress(user.id, book.id));
      
      // Reading stats
      readingStats.push(generateReadingStats(user.id, book.id));
      
      // Reading sessions
      readingSessions.push(...generateReadingSessions(user.id, book.id));
      
      // AI interactions
      aiInteractions.push(...generateAIInteractions(user.id, book.id));
      
      // Help requests
      helpRequests.push(...generateHelpRequests(user.id, book.id));
      
      // User feedback
      userFeedback.push(...generateUserFeedback(user.id, book.id));
    }
  }
  
  return {
    users,
    consultants,
    books,
    chapters,
    sections,
    readingProgress,
    readingStats,
    readingSessions,
    aiInteractions,
    helpRequests,
    userFeedback,
  };
}
