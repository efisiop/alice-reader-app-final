// src/scripts/generateTestData.ts
import { getSupabaseClient } from '../services/supabaseClient';
import { testPersonas, consultantPersonas } from '../utils/testPersonas';
import { appLog } from '../components/LogViewer';
import { ALICE_BOOK_ID } from '../utils/bookIdUtils';
import { generateRandomCode } from '../services/verificationService';

/**
 * Generate test data for the application
 * This creates realistic test data for beta testing
 */
export const generateTestData = async (): Promise<boolean> => {
  try {
    appLog('TestData', 'Generating test data...', 'info');
    const supabase = await getSupabaseClient();
    
    // Create reading progress for test users
    await generateReadingProgress(supabase);
    
    // Create reading statistics
    await generateReadingStats(supabase);
    
    // Create AI interactions
    await generateAIInteractions(supabase);
    
    // Create help requests
    await generateHelpRequests(supabase);
    
    // Create user feedback
    await generateUserFeedback(supabase);
    
    // Create consultant triggers
    await generateConsultantTriggers(supabase);
    
    // Create verification codes
    await generateVerificationCodes(supabase);
    
    appLog('TestData', 'Test data generation complete', 'success');
    return true;
  } catch (error: any) {
    appLog('TestData', `Error generating test data: ${error.message}`, 'error');
    return false;
  }
};

/**
 * Generate reading progress for test users
 */
const generateReadingProgress = async (supabase: any): Promise<void> => {
  appLog('TestData', 'Generating reading progress...', 'info');
  
  // Get all test users
  const testUsers = testPersonas.filter(p => p.email);
  
  // Get sections for the book
  const { data: sections } = await supabase
    .from('sections')
    .select('id, start_page, end_page, chapter_id')
    .eq('chapter_id.book_id', ALICE_BOOK_ID)
    .order('start_page', { ascending: true });
  
  if (!sections || sections.length === 0) {
    appLog('TestData', 'No sections found for the book', 'warning');
    return;
  }
  
  // Get user IDs
  for (const persona of testUsers) {
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', persona.email)
      .limit(1);
    
    if (!users || users.length === 0) {
      appLog('TestData', `User ${persona.email} not found`, 'warning');
      continue;
    }
    
    const userId = users[0].id;
    
    // Randomly select a section based on persona
    const sectionIndex = Math.floor(Math.random() * sections.length);
    const section = sections[sectionIndex];
    
    // Create or update reading progress
    const { error } = await supabase
      .from('reading_progress')
      .upsert({
        user_id: userId,
        book_id: ALICE_BOOK_ID,
        section_id: section.id,
        last_position: String(section.start_page),
        last_read_at: new Date().toISOString()
      });
    
    if (error) {
      appLog('TestData', `Error creating reading progress for ${persona.email}: ${error.message}`, 'error');
    } else {
      appLog('TestData', `Created reading progress for ${persona.email}`, 'success');
    }
  }
};

/**
 * Generate reading statistics for test users
 */
const generateReadingStats = async (supabase: any): Promise<void> => {
  appLog('TestData', 'Generating reading statistics...', 'info');
  
  // Get all test users
  const testUsers = testPersonas.filter(p => p.email);
  
  // Get user IDs
  for (const persona of testUsers) {
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', persona.email)
      .limit(1);
    
    if (!users || users.length === 0) {
      appLog('TestData', `User ${persona.email} not found`, 'warning');
      continue;
    }
    
    const userId = users[0].id;
    
    // Generate random reading stats based on persona
    const totalReadingTime = Math.floor(Math.random() * 10000) + 1000; // 1000-11000 seconds
    const pagesRead = Math.floor(Math.random() * 50) + 10; // 10-60 pages
    const percentageComplete = Math.min(pagesRead / 100, 1); // Assuming 100 total pages
    
    // Create or update reading stats
    const { error } = await supabase
      .from('reading_stats')
      .upsert({
        user_id: userId,
        book_id: ALICE_BOOK_ID,
        total_reading_time: totalReadingTime,
        pages_read: pagesRead,
        percentage_complete: percentageComplete,
        last_session_date: new Date().toISOString()
      });
    
    if (error) {
      appLog('TestData', `Error creating reading stats for ${persona.email}: ${error.message}`, 'error');
    } else {
      appLog('TestData', `Created reading stats for ${persona.email}`, 'success');
    }
  }
};

/**
 * Generate AI interactions for test users
 */
const generateAIInteractions = async (supabase: any): Promise<void> => {
  appLog('TestData', 'Generating AI interactions...', 'info');
  
  // Sample questions and responses
  const interactions = [
    {
      question: "What is the significance of the White Rabbit?",
      response: "The White Rabbit represents time consciousness and serves as Alice's guide into Wonderland. His constant concern with being late contrasts with Alice's timeless curiosity and introduces the theme of time as a controlling force in adult life."
    },
    {
      question: "Why does the Cheshire Cat disappear?",
      response: "The Cheshire Cat's ability to appear and disappear represents the illogical nature of Wonderland. His disappearance, leaving only his smile behind, symbolizes how concepts and ideas can exist independently from physical reality, challenging Alice's understanding of the world."
    },
    {
      question: "What does 'down the rabbit hole' mean?",
      response: "The phrase 'down the rabbit hole' has become a metaphor for entering a strange, disorienting, or transformative experience. In the story, it literally represents Alice's journey to Wonderland, but symbolically it represents her transition from the rational world of Victorian England to the irrational world of Wonderland."
    },
    {
      question: "Why is the Mad Hatter mad?",
      response: "The Mad Hatter is 'mad' due to mercury poisoning, a common occupational hazard for hatters in the Victorian era who used mercury in the hat-making process. In the story, his madness represents the absurdity and nonsensical nature of Wonderland's social customs."
    },
    {
      question: "What does 'Eat Me' and 'Drink Me' symbolize?",
      response: "The 'Eat Me' cake and 'Drink Me' potion symbolize the changes children go through as they grow up. Alice's resulting size changes represent the confusing nature of growing up, where children sometimes feel too small (powerless) or too big (awkward) in different situations."
    }
  ];
  
  // Get all test users
  const testUsers = testPersonas.filter(p => p.email);
  
  // Get sections for the book
  const { data: sections } = await supabase
    .from('sections')
    .select('id')
    .eq('chapter_id.book_id', ALICE_BOOK_ID)
    .limit(10);
  
  if (!sections || sections.length === 0) {
    appLog('TestData', 'No sections found for the book', 'warning');
    return;
  }
  
  // Get user IDs
  for (const persona of testUsers) {
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', persona.email)
      .limit(1);
    
    if (!users || users.length === 0) {
      appLog('TestData', `User ${persona.email} not found`, 'warning');
      continue;
    }
    
    const userId = users[0].id;
    
    // Create 1-3 random AI interactions per user
    const numInteractions = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numInteractions; i++) {
      // Randomly select an interaction and section
      const interactionIndex = Math.floor(Math.random() * interactions.length);
      const sectionIndex = Math.floor(Math.random() * sections.length);
      
      const interaction = interactions[interactionIndex];
      const section = sections[sectionIndex];
      
      // Create AI interaction
      const { error } = await supabase
        .from('ai_interactions')
        .insert({
          user_id: userId,
          book_id: ALICE_BOOK_ID,
          section_id: section.id,
          question: interaction.question,
          response: interaction.response,
          created_at: new Date().toISOString()
        });
      
      if (error) {
        appLog('TestData', `Error creating AI interaction for ${persona.email}: ${error.message}`, 'error');
      } else {
        appLog('TestData', `Created AI interaction for ${persona.email}`, 'success');
      }
    }
  }
};

/**
 * Generate help requests for test users
 */
const generateHelpRequests = async (supabase: any): Promise<void> => {
  appLog('TestData', 'Generating help requests...', 'info');
  
  // Sample help requests
  const helpRequests = [
    {
      question: "I'm confused about the trial scene. Can someone explain what's happening?",
      status: "PENDING"
    },
    {
      question: "Why does the Queen keep saying 'Off with their heads'?",
      status: "IN_PROGRESS"
    },
    {
      question: "I don't understand the riddle 'Why is a raven like a writing desk?'",
      status: "RESOLVED"
    },
    {
      question: "Can someone explain the symbolism of the garden?",
      status: "PENDING"
    },
    {
      question: "I'm having trouble understanding the Mock Turtle's story.",
      status: "IN_PROGRESS"
    }
  ];
  
  // Get test users (only a subset will create help requests)
  const testUsers = testPersonas.filter(p => p.email).slice(0, 3);
  
  // Get sections for the book
  const { data: sections } = await supabase
    .from('sections')
    .select('id')
    .eq('chapter_id.book_id', ALICE_BOOK_ID)
    .limit(10);
  
  if (!sections || sections.length === 0) {
    appLog('TestData', 'No sections found for the book', 'warning');
    return;
  }
  
  // Get consultants
  const { data: consultants } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_consultant', true)
    .limit(2);
  
  // Get user IDs
  for (const persona of testUsers) {
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', persona.email)
      .limit(1);
    
    if (!users || users.length === 0) {
      appLog('TestData', `User ${persona.email} not found`, 'warning');
      continue;
    }
    
    const userId = users[0].id;
    
    // Create 1-2 random help requests per user
    const numRequests = Math.floor(Math.random() * 2) + 1;
    
    for (let i = 0; i < numRequests; i++) {
      // Randomly select a help request and section
      const requestIndex = Math.floor(Math.random() * helpRequests.length);
      const sectionIndex = Math.floor(Math.random() * sections.length);
      
      const helpRequest = helpRequests[requestIndex];
      const section = sections[sectionIndex];
      
      // Assign to consultant if in progress
      let consultantId = null;
      if (helpRequest.status === "IN_PROGRESS" && consultants && consultants.length > 0) {
        const consultantIndex = Math.floor(Math.random() * consultants.length);
        consultantId = consultants[consultantIndex].id;
      }
      
      // Create help request
      const { error } = await supabase
        .from('help_requests')
        .insert({
          user_id: userId,
          book_id: ALICE_BOOK_ID,
          section_id: section.id,
          question: helpRequest.question,
          status: helpRequest.status,
          consultant_id: consultantId,
          created_at: new Date().toISOString()
        });
      
      if (error) {
        appLog('TestData', `Error creating help request for ${persona.email}: ${error.message}`, 'error');
      } else {
        appLog('TestData', `Created help request for ${persona.email}`, 'success');
      }
    }
  }
};

/**
 * Generate user feedback for test users
 */
const generateUserFeedback = async (supabase: any): Promise<void> => {
  appLog('TestData', 'Generating user feedback...', 'info');
  
  // Sample feedback
  const feedbackItems = [
    {
      type: "AHA_MOMENT",
      content: "I just realized that the Caterpillar's transformation into a butterfly mirrors Alice's own transformation throughout the story!",
      is_public: true,
      is_featured: true
    },
    {
      type: "POSITIVE_EXPERIENCE",
      content: "The AI assistant helped me understand the wordplay in the Mock Turtle's story. It made the chapter much more enjoyable!",
      is_public: true,
      is_featured: false
    },
    {
      type: "SUGGESTION",
      content: "It would be helpful to have a character map showing how all the Wonderland characters are connected.",
      is_public: false,
      is_featured: false
    },
    {
      type: "CONFUSION",
      content: "I'm still confused about why time is stopped at the tea party. The explanation wasn't clear to me.",
      is_public: false,
      is_featured: false
    },
    {
      type: "GENERAL",
      content: "I'm really enjoying the reading experience so far. The dictionary feature is particularly helpful!",
      is_public: true,
      is_featured: true
    }
  ];
  
  // Get all test users
  const testUsers = testPersonas.filter(p => p.email);
  
  // Get sections for the book
  const { data: sections } = await supabase
    .from('sections')
    .select('id')
    .eq('chapter_id.book_id', ALICE_BOOK_ID)
    .limit(10);
  
  if (!sections || sections.length === 0) {
    appLog('TestData', 'No sections found for the book', 'warning');
    return;
  }
  
  // Get user IDs
  for (const persona of testUsers) {
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', persona.email)
      .limit(1);
    
    if (!users || users.length === 0) {
      appLog('TestData', `User ${persona.email} not found`, 'warning');
      continue;
    }
    
    const userId = users[0].id;
    
    // Create 1-2 random feedback items per user
    const numFeedback = Math.floor(Math.random() * 2) + 1;
    
    for (let i = 0; i < numFeedback; i++) {
      // Randomly select a feedback item and section
      const feedbackIndex = Math.floor(Math.random() * feedbackItems.length);
      const sectionIndex = Math.floor(Math.random() * sections.length);
      
      const feedback = feedbackItems[feedbackIndex];
      const section = sections[sectionIndex];
      
      // Create feedback
      const { error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: userId,
          book_id: ALICE_BOOK_ID,
          section_id: section.id,
          feedback_type: feedback.type,
          content: feedback.content,
          is_public: feedback.is_public,
          is_featured: feedback.is_featured,
          created_at: new Date().toISOString()
        });
      
      if (error) {
        appLog('TestData', `Error creating feedback for ${persona.email}: ${error.message}`, 'error');
      } else {
        appLog('TestData', `Created feedback for ${persona.email}`, 'success');
      }
    }
  }
};

/**
 * Generate consultant triggers for test users
 */
const generateConsultantTriggers = async (supabase: any): Promise<void> => {
  appLog('TestData', 'Generating consultant triggers...', 'info');
  
  // Sample triggers
  const triggers = [
    {
      type: "ENGAGEMENT",
      message: "Have you noticed how Alice's curiosity drives the story forward?",
      is_processed: false
    },
    {
      type: "CHECK_IN",
      message: "How are you finding the story so far? Is there anything you're curious about?",
      is_processed: false
    },
    {
      type: "QUIZ",
      message: "Can you identify three examples of wordplay in the chapter you just read?",
      is_processed: true
    },
    {
      type: "ENCOURAGE",
      message: "You're making great progress! The next chapter has some of the most memorable scenes in the book.",
      is_processed: false
    },
    {
      type: "ENGAGEMENT",
      message: "The Mad Hatter's tea party is full of riddles. Did you spot the famous unsolvable riddle?",
      is_processed: false
    }
  ];
  
  // Get test users (only a subset will receive triggers)
  const testUsers = testPersonas.filter(p => p.email).slice(0, 3);
  
  // Get consultants
  const { data: consultants } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_consultant', true)
    .limit(2);
  
  if (!consultants || consultants.length === 0) {
    appLog('TestData', 'No consultants found', 'warning');
    return;
  }
  
  // Get user IDs
  for (const persona of testUsers) {
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', persona.email)
      .limit(1);
    
    if (!users || users.length === 0) {
      appLog('TestData', `User ${persona.email} not found`, 'warning');
      continue;
    }
    
    const userId = users[0].id;
    
    // Create 1-2 random triggers per user
    const numTriggers = Math.floor(Math.random() * 2) + 1;
    
    for (let i = 0; i < numTriggers; i++) {
      // Randomly select a trigger and consultant
      const triggerIndex = Math.floor(Math.random() * triggers.length);
      const consultantIndex = Math.floor(Math.random() * consultants.length);
      
      const trigger = triggers[triggerIndex];
      const consultant = consultants[consultantIndex];
      
      // Create trigger
      const { error } = await supabase
        .from('consultant_triggers')
        .insert({
          consultant_id: consultant.id,
          user_id: userId,
          book_id: ALICE_BOOK_ID,
          trigger_type: trigger.type,
          message: trigger.message,
          is_processed: trigger.is_processed,
          created_at: new Date().toISOString()
        });
      
      if (error) {
        appLog('TestData', `Error creating trigger for ${persona.email}: ${error.message}`, 'error');
      } else {
        appLog('TestData', `Created trigger for ${persona.email}`, 'success');
      }
    }
  }
};

/**
 * Generate verification codes
 */
const generateVerificationCodes = async (supabase: any): Promise<void> => {
  appLog('TestData', 'Generating verification codes...', 'info');
  
  // Generate 10 verification codes
  for (let i = 0; i < 10; i++) {
    const code = generateRandomCode(8);
    
    // Create verification code
    const { error } = await supabase
      .from('verification_codes')
      .insert({
        code,
        book_id: ALICE_BOOK_ID,
        is_used: false,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      appLog('TestData', `Error creating verification code: ${error.message}`, 'error');
    } else {
      appLog('TestData', `Created verification code: ${code}`, 'success');
    }
  }
  
  // Create specific test codes
  const testCodes = ['ALICE123', 'WONDERLAND', 'RABBIT', 'TEAPARTY', 'CHESHIRE'];
  
  for (const code of testCodes) {
    // Check if code already exists
    const { data: existingCodes } = await supabase
      .from('verification_codes')
      .select('code')
      .eq('code', code)
      .limit(1);
    
    if (existingCodes && existingCodes.length > 0) {
      appLog('TestData', `Test code ${code} already exists, skipping`, 'info');
      continue;
    }
    
    // Create verification code
    const { error } = await supabase
      .from('verification_codes')
      .insert({
        code,
        book_id: ALICE_BOOK_ID,
        is_used: false,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      appLog('TestData', `Error creating test code ${code}: ${error.message}`, 'error');
    } else {
      appLog('TestData', `Created test code: ${code}`, 'success');
    }
  }
};

// Run if called directly
if (require.main === module) {
  generateTestData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default generateTestData;
