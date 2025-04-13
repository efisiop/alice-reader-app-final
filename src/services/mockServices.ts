// src/services/mockServices.ts
import { registry } from '@services/serviceRegistry';

// Mock Auth Service
const mockAuthService = {
  signIn: async (email: string, password: string) => ({ data: { user: { id: '123', email } }, error: null }),
  signUp: async (email: string, password: string) => ({ data: { user: { id: '123', email } }, error: null }),
  getCurrentUser: async () => ({ id: '123', email: 'test@example.com', firstName: 'Test', lastName: 'User' }),
  getUserProfile: async (userId: string) => ({ id: userId, first_name: 'Test', last_name: 'User', email: 'test@example.com', is_verified: true }),
  signOut: async () => ({}),
  onAuthStateChange: (callback: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
  verifyBook: async (code: string) => ({ success: true, error: null })
};

// Mock Book Service
const mockBookService = {
  getBook: async (id: string) => ({ 
    id, 
    title: 'Alice in Wonderland', 
    author: 'Lewis Carroll',
    totalPages: 100,
    coverImage: 'https://m.media-amazon.com/images/I/71pmz7EqjdL._AC_UF1000,1000_QL80_.jpg'
  }),
  getPage: async (bookId: string, pageNumber: number) => ({
    content: `This is page ${pageNumber} of Alice in Wonderland. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`,
    pageNumber,
    title: `Chapter ${Math.ceil(pageNumber / 10)}`
  }),
  getReadingProgress: async (userId: string, bookId: string) => ({
    percentage_complete: 25,
    current_page: 25,
    current_chapter: 'Chapter 3',
    total_reading_time: 120, // minutes
    last_read_at: new Date().toISOString()
  }),
  updateReadingProgress: async (userId: string, bookId: string, pageNumber: number, readingTime: number) => ({
    success: true
  })
};

// Mock Dictionary Service
const mockDictionaryService = {
  getDefinition: async (word: string) => ({
    word,
    definition: `This is a mock definition for the word "${word}".`,
    partOfSpeech: 'noun',
    examples: [`Example sentence using the word "${word}".`]
  })
};

// Mock AI Service
const mockAIService = {
  getResponse: async (query: string, context?: string) => ({
    response: `This is a mock AI response to: "${query}"${context ? ` in the context of "${context}"` : ''}.`,
    sources: []
  })
};

// Mock Analytics Service
const mockAnalyticsService = {
  trackPageView: (page: string, properties?: any) => console.log(`Page view tracked: ${page}`, properties),
  trackEvent: (event: string, properties?: any) => console.log(`Event tracked: ${event}`, properties),
  trackReaderAction: (action: string, properties?: any) => console.log(`Reader action tracked: ${action}`, properties),
  trackPerformance: (metric: string, value: number, properties?: any) => console.log(`Performance tracked: ${metric}=${value}`, properties),
  identifyUser: (userId: string, traits?: any) => console.log(`User identified: ${userId}`, traits),
  resetUser: () => console.log('User reset')
};

// Mock Trigger Service
const mockTriggerService = {
  subscribeToTriggers: (userId: string, callback: (trigger: any) => void) => {
    // Simulate a trigger after 5 seconds
    setTimeout(() => {
      callback({
        id: 'trigger-1',
        message: 'How are you finding the story so far?',
        type: 'feedback'
      });
    }, 5000);
    
    return () => {}; // Unsubscribe function
  },
  markTriggerProcessed: async (triggerId: string, response?: string) => ({
    success: true
  })
};

// Mock Statistics Service
const mockStatisticsService = {
  getReadingStatistics: async (userId: string, bookId: string) => ({
    totalReadingTime: 150, // minutes
    totalPagesRead: 68,
    totalChaptersCompleted: 3,
    averageReadingSpeed: 130, // words per minute
    vocabularyLookups: 25,
    aiAssistantUsage: 12,
    lastReadDate: new Date().toISOString(),
    dailyReadingTime: [15, 25, 10, 30, 20, 35, 15],
    weeklyProgress: [5, 12, 8, 15, 10, 20, 18],
    pagesPerSession: [3, 5, 2, 7, 4, 8, 3],
    readingSpeed: [120, 130, 110, 140, 125, 135, 130],
    daysActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    vocabularyGrowth: [5, 8, 12, 15, 18, 22, 25],
    aiInteractions: [2, 1, 3, 0, 2, 4, 1]
  })
};

// Mock Consultant Service
const mockConsultantService = {
  getDashboardData: async (consultantId: string) => ({
    assignedReaders: [
      { id: 'r1', name: 'Leo Johnson', progress: 35, lastActive: '2 hours ago', status: 'active' },
      { id: 'r2', name: 'Sarah Williams', progress: 68, lastActive: '1 day ago', status: 'inactive' },
      { id: 'r3', name: 'Michael Brown', progress: 12, lastActive: '3 hours ago', status: 'active' }
    ],
    helpRequests: [
      { id: 'h1', reader: { id: 'r1', name: 'Leo Johnson' }, question: 'I don\'t understand why the Queen wants to cut off heads?', status: 'pending', created_at: new Date().toISOString() },
      { id: 'h2', reader: { id: 'r3', name: 'Michael Brown' }, question: 'What does "curiouser and curiouser" mean?', status: 'pending', created_at: new Date().toISOString() }
    ],
    stats: {
      totalReaders: 3,
      activeReaders: 2,
      pendingHelpRequests: 2,
      resolvedHelpRequests: 5
    }
  }),
  getHelpRequests: async (consultantId: string) => ({
    helpRequests: [
      { id: 'h1', reader: { id: 'r1', name: 'Leo Johnson' }, question: 'I don\'t understand why the Queen wants to cut off heads?', context: 'Chapter 8', status: 'pending', created_at: new Date().toISOString(), book_page: 45, priority: 'high' },
      { id: 'h2', reader: { id: 'r3', name: 'Michael Brown' }, question: 'What does "curiouser and curiouser" mean?', context: 'Chapter 2', status: 'pending', created_at: new Date().toISOString(), book_page: 12, priority: 'medium' }
    ]
  }),
  respondToHelpRequest: async (requestId: string, response: any) => ({
    success: true
  })
};

// Mock Monitoring Service
const mockMonitoringService = {
  getSystemStatus: async () => ({
    services: [
      { name: 'Authentication Service', status: 'healthy', uptime: '99.9%', lastIssue: null },
      { name: 'Book Service', status: 'healthy', uptime: '99.7%', lastIssue: '2023-06-10T15:30:00Z' },
      { name: 'Dictionary Service', status: 'degraded', uptime: '98.5%', lastIssue: '2023-06-15T08:45:00Z' }
    ],
    database: {
      status: 'healthy',
      connectionPool: '12/20',
      avgQueryTime: '45ms',
      storage: {
        used: '2.3GB',
        total: '20GB',
        percentage: 11.5
      }
    },
    users: {
      total: 125,
      active: 78,
      consultants: 5,
      admins: 2
    }
  })
};

// Register all mock services
export const registerMockServices = () => {
  registry.register('authService', mockAuthService);
  registry.register('bookService', mockBookService);
  registry.register('dictionaryService', mockDictionaryService);
  registry.register('aiService', mockAIService);
  registry.register('analyticsService', mockAnalyticsService);
  registry.register('triggerService', mockTriggerService);
  registry.register('statisticsService', mockStatisticsService);
  registry.register('consultantService', mockConsultantService);
  registry.register('monitoringService', mockMonitoringService);
  
  console.log('All mock services registered successfully');
};

export default registerMockServices;
