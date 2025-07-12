// src/services/dictionaryService.ts
import { appLog } from '../components/LogViewer';
import { fetchData } from '../utils/dataFetcher';
import { dictionaryCache } from './cacheService';
import { getDefinition as backendGetDefinition, saveAiInteraction } from './backendService';
import { BookId, SectionId, ChapterId, UserId } from '../types/idTypes';
import { registry } from './serviceRegistry';
import { handleServiceError } from '../utils/errorHandling';
import { logInteraction, InteractionEventType } from './loggingService';
import { getGlossaryDefinition, getAllGlossaryTerms } from './glossaryService';

// Types for dictionary responses
export interface DictionaryEntry {
  term: string;
  definition: string;
  examples?: string[];
  relatedTerms?: string[];
  pronunciation?: string;
  source?: 'glossary' | 'database' | 'local' | 'external' | 'fallback' | 'not_found';
  wordOrigin?: string;
  isPhrasalVerb?: boolean;
  // Context-aware properties
  contextScore?: number;
  contextKeywords?: string[];
  isContextAware?: boolean;
}

// Alice-specific glossary terms with enhanced definitions
const aliceGlossary: Record<string, DictionaryEntry> = {
  'Alice': {
    term: 'Alice',
    definition: 'The curious and imaginative protagonist of the story who follows the White Rabbit down the rabbit hole into Wonderland.',
    examples: [
      'Alice was beginning to get very tired of sitting by her sister on the bank.',
      'Alice had not a moment to think about stopping herself before she found herself falling down a very deep well.'
    ],
    relatedTerms: ['protagonist', 'curious', 'imaginative', 'Wonderland'],
    pronunciation: "/ˈælɪs/",
    source: 'glossary',
    wordOrigin: 'From Old French "Aalis", a variant of "Adelais" meaning "noble kind"'
  },
  'Wonderland': {
    term: 'Wonderland',
    definition: 'The magical and nonsensical world that Alice discovers after falling down the rabbit hole, where animals can talk and nothing follows normal logic.',
    examples: [
      'Welcome to Wonderland!',
      'In Wonderland, animals can talk and nothing makes sense.'
    ],
    relatedTerms: ['fantasy', 'magical', 'dream', 'nonsensical'],
    pronunciation: "/ˈwʌndərˌlænd/",
    source: 'glossary',
    wordOrigin: 'Compound word: "wonder" (amazement) + "land" (territory)'
  },
  'White Rabbit': {
    term: 'White Rabbit',
    definition: 'A hurried, anxious creature with a pocket watch who leads Alice into Wonderland. Represents the constraints of time and adult responsibilities.',
    examples: [
      '"Oh my ears and whiskers, how late it\'s getting!" exclaimed the White Rabbit as he hurried past Alice.',
      'The White Rabbit pulled a watch out of his waistcoat pocket.'
    ],
    relatedTerms: ['pocket watch', 'hurried', 'anxious', 'time', 'waistcoat'],
    pronunciation: "/waɪt ˈræbɪt/",
    source: 'glossary',
    wordOrigin: 'Symbolic character representing time consciousness'
  },
  'Cheshire Cat': {
    term: 'Cheshire Cat',
    definition: 'A mysterious feline known for its mischievous grin that can appear and disappear at will, offering cryptic advice to Alice.',
    examples: [
      'The Cheshire Cat vanished quite slowly, beginning with the end of the tail, and ending with the grin.',
      '"We\'re all mad here. I\'m mad. You\'re mad," said the Cheshire Cat with its enigmatic smile.'
    ],
    relatedTerms: ['cat', 'grin', 'vanish', 'appear', 'mad', 'mysterious'],
    pronunciation: "/ˈtʃɛʃər kæt/",
    source: 'glossary',
    wordOrigin: 'Named after Cheshire, a county in England, known for its cheese'
  },
  'Mad Hatter': {
    term: 'Mad Hatter',
    definition: 'An eccentric character trapped in a perpetual tea party due to a quarrel with Time, representing the absurdity of social conventions.',
    examples: [
      '"Have I gone mad?" the Hatter asked Alice, his eyes twinkling with mischief during the eternal tea party.',
      'The Mad Hatter\'s tea party never ends because he offended Time.'
    ],
    relatedTerms: ['tea party', 'eccentric', 'mad', 'time', 'social conventions'],
    pronunciation: "/mæd ˈhætər/",
    source: 'glossary',
    wordOrigin: 'Reference to hat makers who used mercury in their work, causing mental illness'
  },
  'Queen of Hearts': {
    term: 'Queen of Hearts',
    definition: 'The tyrannical ruler of Wonderland who frequently orders executions, symbolizing arbitrary authority and the fear of punishment.',
    examples: [
      '"Off with their heads!" shouted the Queen of Hearts whenever she was displeased.',
      'The Queen of Hearts ruled Wonderland with an iron fist and a love for croquet.'
    ],
    relatedTerms: ['tyrannical', 'authority', 'execution', 'croquet', 'arbitrary'],
    pronunciation: "/kwin əv hɑrts/",
    source: 'glossary',
    wordOrigin: 'Playing card reference representing absolute power'
  },
  'rabbit-hole': {
    term: 'rabbit-hole',
    definition: 'The entrance to an underground tunnel that leads Alice into Wonderland. Metaphorically, it represents a journey into the unknown or an absorbing topic or activity.',
    examples: [
      'Alice followed the White Rabbit down the rabbit-hole.',
      'She fell down a very deep rabbit-hole and wondered what would happen next.'
    ],
    relatedTerms: ['tunnel', 'entrance', 'Wonderland', 'adventure', 'unknown'],
    pronunciation: "/ˈræbɪt hoʊl/",
    source: 'glossary',
    wordOrigin: 'Literal: hole made by a rabbit; metaphorical: deep exploration'
  },
  'Caucus-Race': {
    term: 'Caucus-Race',
    definition: 'A nonsensical race from Alice in Wonderland where participants run in a circle, starting and stopping when they like, and everyone wins and receives a prize.',
    examples: [
      '"What I was going to say," said the Dodo in an offended tone, "was, that the best thing to get us dry would be a Caucus-race."',
      'The disorganized meeting felt more like a caucus-race than a productive discussion.'
    ],
    relatedTerms: ['race', 'nonsensical', 'circle', 'prize', 'Dodo'],
    pronunciation: "/ˈkɔkəs reɪs/",
    source: 'glossary',
    wordOrigin: 'Political term "caucus" combined with "race" for satirical effect'
  },
  'Dodo': {
    term: 'Dodo',
    definition: 'A flightless bird that appears in the Caucus-Race scene, representing the extinct dodo bird and symbolizing the absurdity of certain social activities.',
    examples: [
      'The Dodo suggested a Caucus-race to dry off the wet animals.',
      'The Dodo was the judge of the race and declared everyone a winner.'
    ],
    relatedTerms: ['bird', 'extinct', 'Caucus-Race', 'judge', 'winner'],
    pronunciation: "/ˈdoʊdoʊ/",
    source: 'glossary',
    wordOrigin: 'From Portuguese "doudo" meaning "fool" or "simpleton"'
  },
  'March Hare': {
    term: 'March Hare',
    definition: 'A character at the Mad Hatter\'s tea party, known for being "mad as a March hare" - a reference to the erratic behavior of hares during their breeding season.',
    examples: [
      'The March Hare was sitting at the tea table with the Mad Hatter.',
      '"Take some more tea," the March Hare said to Alice very earnestly.'
    ],
    relatedTerms: ['hare', 'mad', 'tea party', 'March', 'breeding season'],
    pronunciation: "/mɑrtʃ hɛr/",
    source: 'glossary',
    wordOrigin: 'English idiom "mad as a March hare" referring to spring breeding behavior'
  },
  'Dormouse': {
    term: 'Dormouse',
    definition: 'A sleepy character at the Mad Hatter\'s tea party who frequently falls asleep and is used as a cushion by the other characters.',
    examples: [
      'The Dormouse was fast asleep at the tea party.',
      'The Hatter and March Hare used the Dormouse as a cushion.'
    ],
    relatedTerms: ['sleepy', 'tea party', 'cushion', 'Mad Hatter', 'March Hare'],
    pronunciation: "/ˈdɔrmaʊs/",
    source: 'glossary',
    wordOrigin: 'From Old French "dormeus" meaning "sleepy"'
  },
  'Caterpillar': {
    term: 'Caterpillar',
    definition: 'A wise but cryptic character who sits on a mushroom smoking a hookah, giving Alice advice about growing and shrinking.',
    examples: [
      'The Caterpillar sat on a mushroom smoking a hookah.',
      '"Who are you?" said the Caterpillar to Alice.'
    ],
    relatedTerms: ['mushroom', 'hookah', 'wise', 'cryptic', 'advice'],
    pronunciation: "/ˈkætərˌpɪlər/",
    source: 'glossary',
    wordOrigin: 'From Old French "catepelose" meaning "hairy cat"'
  },
  'Duchess': {
    term: 'Duchess',
    definition: 'A character who appears briefly in the story, known for her violent behavior and the baby she carries that turns into a pig.',
    examples: [
      'The Duchess was holding a baby that kept sneezing.',
      'The baby turned into a pig and ran away.'
    ],
    relatedTerms: ['baby', 'pig', 'violent', 'sneezing', 'pepper'],
    pronunciation: "/ˈdʌtʃəs/",
    source: 'glossary',
    wordOrigin: 'From Old French "duchesse" meaning "female duke"'
  },
  'Gryphon': {
    term: 'Gryphon',
    definition: 'A mythical creature with the head and wings of an eagle and the body of a lion, who escorts Alice to see the Mock Turtle.',
    examples: [
      'The Gryphon took Alice to see the Mock Turtle.',
      'The Gryphon and Mock Turtle told Alice about their school days.'
    ],
    relatedTerms: ['eagle', 'lion', 'mythical', 'Mock Turtle', 'school'],
    pronunciation: "/ˈɡrɪfən/",
    source: 'glossary',
    wordOrigin: 'From Greek "gryps" meaning "curved" or "hooked"'
  },
  'Mock Turtle': {
    term: 'Mock Turtle',
    definition: 'A character with the head, hind hooves, and tail of a cow, who tells Alice about his education and sings sad songs.',
    examples: [
      'The Mock Turtle told Alice about his school days.',
      '"Will you walk a little faster?" said the Mock Turtle to Alice.'
    ],
    relatedTerms: ['cow', 'education', 'sad', 'songs', 'school'],
    pronunciation: "/mɒk ˈtɜrtəl/",
    source: 'glossary',
    wordOrigin: 'Mock turtle soup was a Victorian dish made from calf\'s head'
  },
  'Knave of Hearts': {
    term: 'Knave of Hearts',
    definition: 'A character accused of stealing the Queen\'s tarts, representing the Jack in a deck of playing cards.',
    examples: [
      'The Knave of Hearts was accused of stealing the tarts.',
      'The trial of the Knave of Hearts was a chaotic affair.'
    ],
    relatedTerms: ['tarts', 'trial', 'stealing', 'playing cards', 'Jack'],
    pronunciation: "/neɪv əv hɑrts/",
    source: 'glossary',
    wordOrigin: 'Knave is an old term for the Jack in playing cards'
  },
  'Tweedledee and Tweedledum': {
    term: 'Tweedledee and Tweedledum',
    definition: 'Twin brothers who recite poetry to Alice and engage in nonsensical arguments, representing the duality of human nature.',
    examples: [
      'Tweedledee and Tweedledum agreed to have a battle.',
      'The twins recited "The Walrus and the Carpenter" to Alice.'
    ],
    relatedTerms: ['twins', 'poetry', 'battle', 'nonsensical', 'duality'],
    pronunciation: "/ˈtwiːdəldiː ænd ˈtwiːdəldʌm/",
    source: 'glossary',
    wordOrigin: 'Names from a nursery rhyme about two identical characters'
  },
  'Walrus': {
    term: 'Walrus',
    definition: 'A character in the poem recited by Tweedledee and Tweedledum, who along with the Carpenter, tricks and eats young oysters.',
    examples: [
      '"The time has come," the Walrus said, "to talk of many things."',
      'The Walrus and the Carpenter ate all the oysters.'
    ],
    relatedTerms: ['Carpenter', 'oysters', 'poem', 'trickery', 'deception'],
    pronunciation: "/ˈwɔlrəs/",
    source: 'glossary',
    wordOrigin: 'From Dutch "walrus" meaning "horse whale"'
  },
  'Carpenter': {
    term: 'Carpenter',
    definition: 'A character in the poem who accompanies the Walrus in tricking and eating young oysters.',
    examples: [
      'The Carpenter walked with the Walrus on the beach.',
      'The Carpenter and Walrus invited the oysters for a walk.'
    ],
    relatedTerms: ['Walrus', 'oysters', 'beach', 'trickery', 'deception'],
    pronunciation: "/ˈkɑrpəntər/",
    source: 'glossary',
    wordOrigin: 'From Old French "carpentier" meaning "wagon maker"'
  }
};

// Common phrasal verbs that should be treated as single units
const phrasalVerbs: Record<string, string> = {
  'look up': 'to search for information or direct one\'s gaze upward',
  'find out': 'to discover or learn something',
  'come across': 'to encounter or discover by chance',
  'run into': 'to meet someone unexpectedly',
  'get up': 'to rise from bed or a sitting position',
  'sit down': 'to take a seat',
  'stand up': 'to rise to a standing position',
  'turn around': 'to change direction or reverse course',
  'come back': 'to return',
  'go away': 'to leave',
  'come in': 'to enter',
  'go out': 'to leave a place',
  'put on': 'to wear or apply something',
  'take off': 'to remove clothing or depart',
  'pick up': 'to lift or collect something',
  'put down': 'to place something on a surface',
  'come up': 'to arise or appear',
  'go down': 'to descend or decrease',
  'come out': 'to emerge or be revealed',
  'go in': 'to enter',
  'look down': 'to direct one\'s gaze downward',
  'come over': 'to visit someone',
  'go over': 'to review or examine',
  'come through': 'to succeed or provide help',
  'go through': 'to experience or examine',
  'come along': 'to accompany or progress',
  'go along': 'to accompany or agree',
  'come about': 'to happen or occur',
  'go about': 'to proceed with or handle',
  'go across': 'to cross or traverse',
  'come after': 'to follow or pursue',
  'go after': 'to pursue or chase',
  'come before': 'to precede or appear in front of',
  'go before': 'to precede or appear before',
  'come between': 'to interfere or separate',
  'go between': 'to mediate or act as intermediary',
  'come by': 'to obtain or visit',
  'go by': 'to pass or follow',
  'come for': 'to arrive to collect or attack',
  'go for': 'to attempt or choose',
  'come from': 'to originate from',
  'go from': 'to depart from',
  'come into': 'to inherit or acquire',
  'go into': 'to enter or investigate',
  'come of': 'to result from',
  'go of': 'to explode or detonate',
  'come off': 'to succeed or be removed',
  'go off': 'to explode or leave',
  'come on': 'to begin or encourage',
  'go on': 'to continue or happen',
  'come round': 'to visit or recover consciousness',
  'go round': 'to circulate or visit',
  'come to': 'to amount to or regain consciousness',
  'go to': 'to attend or approach',
  'come under': 'to be subjected to',
  'go under': 'to sink or fail',
  'come upon': 'to encounter or discover',
  'go upon': 'to base on or rely on',
  'come with': 'to accompany or include',
  'go with': 'to accompany or match'
};

/**
 * Check if a selection is a phrasal verb
 * @param text Selected text
 * @returns Object with phrasal verb info or null
 */
function detectPhrasalVerb(text: string): { phrase: string; definition: string; isPhrasal: boolean } | null {
  const cleanText = text.toLowerCase().trim();
  
  // Check for exact phrasal verb match
  if (phrasalVerbs[cleanText]) {
    return {
      phrase: cleanText,
      definition: phrasalVerbs[cleanText],
      isPhrasal: true
    };
  }
  
  // Check for variations (with different spacing, punctuation)
  const variations = [
    cleanText,
    cleanText.replace(/\s+/g, ' '),
    cleanText.replace(/[.,!?;:'"]/g, ''),
    cleanText.replace(/[.,!?;:'"]/g, '').replace(/\s+/g, ' ')
  ];
  
  for (const variation of variations) {
    if (phrasalVerbs[variation]) {
      return {
        phrase: variation,
        definition: phrasalVerbs[variation],
        isPhrasal: true
      };
    }
  }
  
  return null;
}

/**
 * Get Alice glossary definition from Supabase
 * @param word Word to look up
 * @returns Dictionary entry or null if not found
 */
async function getAliceGlossaryDefinition(word: string): Promise<DictionaryEntry | null> {
  try {
  // Clean the word
  const cleanWord = word.replace(/[.,!?;:'"]/g, '').trim();
    
    appLog('DictionaryService', 'Fetching Alice glossary definition from Supabase', 'debug', { word: cleanWord });

    // Try to get the definition from Supabase
    const glossaryTerm = await getGlossaryDefinition(cleanWord);
    
    if (glossaryTerm) {
      appLog('DictionaryService', `Found definition for "${cleanWord}" in Alice glossary`, 'success');
      
      return {
        term: glossaryTerm.term,
        definition: glossaryTerm.definition,
        examples: glossaryTerm.example ? [glossaryTerm.example] : undefined,
        relatedTerms: undefined, // Could be enhanced later
        pronunciation: undefined, // Could be enhanced later
        source: 'glossary',
        wordOrigin: undefined // Could be enhanced later
      };
    }
    
    appLog('DictionaryService', `No definition found for "${cleanWord}" in Alice glossary`, 'debug');
    return null;
  } catch (error) {
    appLog('DictionaryService', 'Error fetching Alice glossary definition', 'error', error);
  return null;
  }
}

/**
 * External dictionary API using Free Dictionary API
 * @param word Word to look up
 * @returns Dictionary entry
 */
async function fetchExternalDefinition(word: string): Promise<DictionaryEntry | null> {
  try {
    appLog('DictionaryService', 'Fetching from Free Dictionary API', 'info', { word });
    
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);

    if (!response.ok) {
      if (response.status === 404) {
        appLog('DictionaryService', 'Word not found in Free Dictionary API', 'warning', { word });
        return null;
      }
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || !data[0] || !data[0].meanings || !data[0].meanings[0]) {
      throw new Error('Invalid response format from API');
    }

    // Get all definitions and examples
    const definitions: string[] = [];
    const examples: string[] = [];
    const synonyms: string[] = [];
    const antonyms: string[] = [];
    let origin = '';

    data[0].meanings.forEach((meaning: any) => {
      meaning.definitions.forEach((def: any) => {
        if (def.definition) {
          definitions.push(def.definition);
        }
        if (def.example) {
          examples.push(def.example);
        }
      });
      if (meaning.synonyms) {
        synonyms.push(...meaning.synonyms);
      }
      if (meaning.antonyms) {
        antonyms.push(...meaning.antonyms);
      }
    });

    // Get etymology if available
    if (data[0].etymologies && data[0].etymologies[0]) {
      origin = data[0].etymologies[0];
    }

    return {
      term: word,
      definition: definitions.join('\n\n'),
      examples: examples.length > 0 ? examples : undefined,
      pronunciation: data[0]?.phonetic,
      relatedTerms: [...new Set([...synonyms, ...antonyms])].slice(0, 10), // Remove duplicates and limit to 10
      source: 'external',
      wordOrigin: origin || undefined
    };
  } catch (error) {
    appLog('DictionaryService', 'Error fetching from Free Dictionary API', 'error', error);
    return null;
  }
}

/**
 * Get definition from local dictionary
 * @param word Word to look up
 * @returns Dictionary entry or null if not found
 */
function getLocalDefinition(word: string): DictionaryEntry | null {
  // This function is kept for backward compatibility but now returns null
  // since we're using the Alice glossary for local definitions
  appLog('DictionaryService', 'Local dictionary lookup (deprecated)', 'debug', { word });
  return null;
}

/**
 * Get definition from database
 * @param bookId Book ID
 * @param term Term to look up
 * @param sectionId Optional section ID for context
 * @param chapterId Optional chapter ID for context
 * @returns Dictionary entry or null if not found
 */
async function getDatabaseDefinition(
  bookId: string | BookId,
  term: string,
  sectionId?: string | SectionId,
  chapterId?: string | ChapterId
): Promise<DictionaryEntry | null> {
  try {
    // Clean the term to improve matching
    const cleanTerm = term.replace(/[.,!?;:'"\/\\()\[\]{}]/g, '').trim();

    appLog('DictionaryService', 'Fetching definition from database', 'info', {
      bookId, term: cleanTerm, sectionId, chapterId
    });

    const { data, error } = await backendGetDefinition(
      bookId.toString(),
      cleanTerm,
      sectionId?.toString(),
      chapterId?.toString()
    );

    if (error) {
      appLog('DictionaryService', 'Error fetching from database', 'warning', error);
      return null;
    }

    if (!data) {
      appLog('DictionaryService', 'No definition found in database', 'info', { term: cleanTerm });
      return null;
    }

    appLog('DictionaryService', 'Found definition in database', 'success', { term: cleanTerm });

    return {
      term,
      definition: data,
      source: 'database'
    };
  } catch (error) {
    appLog('DictionaryService', 'Error fetching definition from database', 'error', error);
    return null;
  }
}

/**
 * Dictionary Service Interface
 */
export interface DictionaryServiceInterface {
  getDefinition: (
    bookId: string | BookId,
    term: string,
    sectionId?: string | SectionId,
    chapterId?: string | ChapterId
  ) => Promise<DictionaryEntry>;
  
  getContextAwareDefinition: (
    bookId: string | BookId,
    term: string,
    surroundingText: string,
    sectionId?: string | SectionId,
    chapterId?: string | ChapterId
  ) => Promise<DictionaryEntry>;

  logDictionaryLookup: (
    userId: string | UserId,
    bookId: string | BookId,
    sectionId: string | SectionId | undefined,
    term: string,
    definitionFound: boolean
  ) => Promise<void>;

  saveToVocabulary: (
    userId: string | UserId,
    term: string,
    definition: string
  ) => Promise<boolean>;

  getUserVocabulary: (userId: string | UserId) => Promise<any[]>;

  removeFromVocabulary: (
    userId: string | UserId,
    term: string
  ) => Promise<boolean>;

  clearDefinitionCache: () => void;
}

/**
 * Create Dictionary Service
 *
 * Factory function to create the dictionary service implementation
 */
const createDictionaryService = async (): Promise<DictionaryServiceInterface> => {
  appLog('DictionaryService', 'Creating dictionary service', 'info');

  // Create service implementation
  const dictionaryService: DictionaryServiceInterface = {
    getDefinition: async (
      bookId: string | BookId,
      term: string,
      sectionId?: string | SectionId,
      chapterId?: string | ChapterId
    ): Promise<DictionaryEntry> => {
      appLog('DictionaryService', 'Getting definition', 'info', {
        bookId, term, sectionId, chapterId
      });

      // Clean the term
      const cleanTerm = term.replace(/[.,!?;:'"\/\\()\[\]{}]/g, '').trim();
      const lowerTerm = cleanTerm.toLowerCase();

      // Create a cache key
      const cacheKey = `definition_${bookId}_${lowerTerm}${sectionId ? `_${sectionId}` : ''}${chapterId ? `_${chapterId}` : ''}`;

      try {
        // Check cache first
        const cachedDefinition = dictionaryCache.get<DictionaryEntry>(cacheKey);
        if (cachedDefinition) {
          appLog('DictionaryService', 'Found definition in cache', 'success', { term: cleanTerm, source: cachedDefinition.source });
          return cachedDefinition;
        }

        // 1. FIRST PRIORITY: Check Alice glossary (highest priority for Alice-specific terms)
        const aliceDefinition = await getAliceGlossaryDefinition(cleanTerm);
        if (aliceDefinition) {
          appLog('DictionaryService', 'Found definition in Alice glossary', 'success', { term: cleanTerm });
          dictionaryCache.set(cacheKey, aliceDefinition, 24 * 60 * 60 * 1000); // 24 hours
          return aliceDefinition;
        }

        // 2. SECOND PRIORITY: Check for phrasal verbs
        const phrasalVerbInfo = detectPhrasalVerb(cleanTerm);
        if (phrasalVerbInfo) {
          appLog('DictionaryService', 'Detected phrasal verb', 'info', { term: cleanTerm, phrase: phrasalVerbInfo.phrase });
          const phrasalDefinition: DictionaryEntry = {
            term: phrasalVerbInfo.phrase,
            definition: phrasalVerbInfo.definition,
            examples: [`She ${phrasalVerbInfo.phrase} the information in the dictionary.`],
            source: 'glossary',
            isPhrasalVerb: true,
            wordOrigin: 'Phrasal verb: verb + preposition/adverb combination'
          };
          dictionaryCache.set(cacheKey, phrasalDefinition, 24 * 60 * 60 * 1000); // 24 hours
          return phrasalDefinition;
        }

        // 3. THIRD PRIORITY: Try database with context (section and chapter)
        const dbDefinition = await getDatabaseDefinition(bookId, cleanTerm, sectionId, chapterId);
        if (dbDefinition) {
          appLog('DictionaryService', 'Found definition in database with context', 'success', { term: cleanTerm });
          dictionaryCache.set(cacheKey, dbDefinition, 24 * 60 * 60 * 1000); // 24 hours
          return dbDefinition;
        }

        // 4. FOURTH PRIORITY: Try external API (Free Dictionary API)
        const externalDefinition = await fetchExternalDefinition(cleanTerm);
        if (externalDefinition) {
          appLog('DictionaryService', 'Found definition in external API', 'info', { term: cleanTerm });
          dictionaryCache.set(cacheKey, externalDefinition, 24 * 60 * 60 * 1000); // 24 hours
          return externalDefinition;
        }

        // 5. FIFTH PRIORITY: Try local dictionary as fallback
        const localDefinition = getLocalDefinition(cleanTerm);
        if (localDefinition) {
          appLog('DictionaryService', 'Found definition in local dictionary', 'info', { term: cleanTerm });
          dictionaryCache.set(cacheKey, localDefinition, 24 * 60 * 60 * 1000); // 24 hours
          return localDefinition;
        }

        // 6. FINAL FALLBACK: No definition found
        appLog('DictionaryService', 'No definition found for term', 'warning', { term: cleanTerm });
        const notFoundDefinition: DictionaryEntry = {
          term: cleanTerm,
          definition: 'No definition found for this term.',
          source: 'not_found'
        };

        // Cache the not found result for a shorter time (1 hour)
        dictionaryCache.set(cacheKey, notFoundDefinition, 60 * 60 * 1000); // 1 hour
        return notFoundDefinition;
      } catch (error) {
        appLog('DictionaryService', 'Error getting definition', 'error', { term: cleanTerm, error });

        // Return an error fallback
        return {
          term: cleanTerm,
          definition: 'An error occurred while retrieving the definition. Please try again.',
          source: 'not_found'
        };
      }
    },

    getContextAwareDefinition: async (
      bookId: string | BookId,
      term: string,
      surroundingText: string,
      sectionId?: string | SectionId,
      chapterId?: string | ChapterId
    ): Promise<DictionaryEntry> => {
      try {
        // First get the full definition
        const fullDefinition = await getDefinition(bookId, term, sectionId, chapterId);
        
        // If no definition found, return the original result
        if (!fullDefinition || fullDefinition.source === 'not_found') {
          return fullDefinition;
        }

        // Analyze context to determine relevance
        const contextAnalysis = analyzeContext(term, surroundingText, fullDefinition);
        
        // Create context-aware definition
        const contextAwareDefinition: DictionaryEntry = {
          ...fullDefinition,
          definition: contextAnalysis.relevantDefinition,
          contextScore: contextAnalysis.score,
          contextKeywords: contextAnalysis.keywords,
          isContextAware: true,
          // Preserve word origin if context suggests etymology interest or if it's particularly interesting
          wordOrigin: contextAnalysis.preserveWordOrigin ? fullDefinition.wordOrigin : undefined
        };

        appLog('DictionaryService', 'Generated context-aware definition', 'info', {
          term,
          contextScore: contextAnalysis.score,
          originalLength: fullDefinition.definition.length,
          contextLength: contextAnalysis.relevantDefinition.length,
          preserveWordOrigin: contextAnalysis.preserveWordOrigin
        });

        return contextAwareDefinition;
      } catch (error) {
        appLog('DictionaryService', 'Error getting context-aware definition', 'error', error);
        // Fallback to regular definition
        return await getDefinition(bookId, term, sectionId, chapterId);
      }
    },

    logDictionaryLookup: async (
      userId: string | UserId,
      bookId: string | BookId,
      sectionId: string | SectionId | undefined,
      term: string,
      found: boolean
    ): Promise<void> => {
      try {
        appLog('DictionaryService', 'Logging dictionary lookup', 'info', {
          userId, bookId, sectionId, term, found
        });

        // Log as AI interaction for analytics (legacy method)
        await saveAiInteraction(
          userId.toString(),
          bookId.toString(),
          `Dictionary lookup: ${term}`,
          found ? `Definition found for "${term}"` : `No definition found for "${term}"`,
          sectionId?.toString()
        );

        // Log to the new interactions table
        await logInteraction(
          userId.toString(),
          InteractionEventType.DEFINITION_LOOKUP,
          {
            bookId: bookId.toString(),
            sectionId: sectionId?.toString(),
            content: term,
            definitionFound: found
          }
        ).catch(err => {
          // Just log the error but don't fail the lookup
          appLog('DictionaryService', 'Error logging definition lookup interaction', 'error', err);
        });
      } catch (error) {
        appLog('DictionaryService', 'Error logging dictionary lookup', 'error', error);
      }
    },

    saveToVocabulary: async (
      userId: string | UserId,
      term: string,
      definition: string
    ): Promise<boolean> => {
      try {
        // In a real app, this would save to Supabase
        appLog('DictionaryService', 'Saving to vocabulary', 'info', { userId, term });

        const vocabulary = JSON.parse(localStorage.getItem('userVocabulary') || '{}');

        if (!vocabulary[userId]) {
          vocabulary[userId] = [];
        }

        // Check if term already exists
        const existingIndex = vocabulary[userId].findIndex((item: any) => item.term === term);

        if (existingIndex !== -1) {
          // Update existing entry
          vocabulary[userId][existingIndex] = {
            term,
            definition,
            savedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        } else {
          // Add new entry
          vocabulary[userId].push({
            term,
            definition,
            savedAt: new Date().toISOString()
          });
        }

        localStorage.setItem('userVocabulary', JSON.stringify(vocabulary));
        return true;
      } catch (error) {
        appLog('DictionaryService', 'Error saving to vocabulary', 'error', error);
        return false;
      }
    },

    getUserVocabulary: async (userId: string | UserId): Promise<any[]> => {
      try {
        const vocabulary = JSON.parse(localStorage.getItem('userVocabulary') || '{}');
        return vocabulary[userId] || [];
      } catch (error) {
        appLog('DictionaryService', 'Error getting vocabulary', 'error', error);
        return [];
      }
    },

    removeFromVocabulary: async (
      userId: string | UserId,
      term: string
    ): Promise<boolean> => {
      try {
        const vocabulary = JSON.parse(localStorage.getItem('userVocabulary') || '{}');

        if (!vocabulary[userId]) {
          return false;
        }

        const index = vocabulary[userId].findIndex((item: any) => item.term === term);

        if (index === -1) {
          return false;
        }

        vocabulary[userId].splice(index, 1);
        localStorage.setItem('userVocabulary', JSON.stringify(vocabulary));
        return true;
      } catch (error) {
        appLog('DictionaryService', 'Error removing from vocabulary', 'error', error);
        return false;
      }
    },

    clearDefinitionCache: () => {
      dictionaryCache.clear();
      appLog('DictionaryService', 'Definition cache cleared', 'info');
    }
  };

  return dictionaryService;
};

// Export the factory function
export { createDictionaryService };

// Create backward-compatible exports
export async function getDefinition(
  bookId: string | BookId,
  term: string,
  sectionId?: string | SectionId,
  chapterId?: string | ChapterId
): Promise<DictionaryEntry> {
  const service = await registry.getService<DictionaryServiceInterface>('dictionaryService');
  return service.getDefinition(bookId, term, sectionId, chapterId);
};

export async function logDictionaryLookup(
  userId: string | UserId,
  bookId: string | BookId,
  sectionId: string | SectionId | undefined,
  term: string,
  definitionFound: boolean
): Promise<void> {
  const service = await registry.getService<DictionaryServiceInterface>('dictionaryService');
  return service.logDictionaryLookup(userId, bookId, sectionId, term, definitionFound);
};

export async function saveToVocabulary(
  userId: string | UserId,
  term: string,
  definition: string
): Promise<boolean> {
  const service = await registry.getService<DictionaryServiceInterface>('dictionaryService');
  return service.saveToVocabulary(userId, term, definition);
};

export async function getUserVocabulary(userId: string | UserId): Promise<any[]> {
  const service = await registry.getService<DictionaryServiceInterface>('dictionaryService');
  return service.getUserVocabulary(userId);
};

export async function removeFromVocabulary(userId: string | UserId, term: string): Promise<boolean> {
  const service = await registry.getService<DictionaryServiceInterface>('dictionaryService');
  return service.removeFromVocabulary(userId, term);
};

export function clearDefinitionCache(): void {
  const service = registry.get<DictionaryServiceInterface>('dictionaryService');
  service.clearDefinitionCache();
};

/**
 * Get all Alice glossary terms as a Set for efficient lookup
 * @returns Set of all glossary terms
 */
export async function getAliceGlossaryTerms(): Promise<Set<string>> {
  try {
    return await getAllGlossaryTerms();
  } catch (error) {
    appLog('DictionaryService', 'Error getting Alice glossary terms', 'error', error);
    // Return empty set on error
    return new Set<string>();
  }
}

/**
 * Analyze text context to determine the most relevant definition
 * @param term The selected term
 * @param surroundingText Text around the term
 * @param fullDefinition The complete definition entry
 * @returns Context analysis result
 */
function analyzeContext(
  term: string,
  surroundingText: string,
  fullDefinition: DictionaryEntry
): {
  relevantDefinition: string;
  score: number;
  keywords: string[];
  preserveWordOrigin: boolean;
} {
  // Clean and normalize the surrounding text
  const cleanText = surroundingText.toLowerCase();
  const cleanTerm = term.toLowerCase();
  
  // Extract keywords from the surrounding text
  const textKeywords = extractKeywords(cleanText);
  
  // Extract keywords from the full definition
  const definitionKeywords = extractKeywords(fullDefinition.definition.toLowerCase());
  
  // Calculate relevance score based on keyword overlap
  const keywordOverlap = textKeywords.filter(keyword => 
    definitionKeywords.includes(keyword)
  );
  
  const score = keywordOverlap.length / Math.max(textKeywords.length, 1);
    
  // Check if context suggests etymology interest
  const etymologyKeywords = ['origin', 'etymology', 'derived', 'comes from', 'meaning', 'root', 'history', 'old', 'ancient', 'latin', 'greek', 'french', 'german'];
  const hasEtymologyInterest = etymologyKeywords.some(keyword => 
    cleanText.includes(keyword)
  );
  
  // If we have examples, try to find the most relevant one
  let relevantDefinition = fullDefinition.definition;
  let relevantExample = '';
  
  if (fullDefinition.examples && fullDefinition.examples.length > 0) {
    // Find the example that best matches the context
    const bestExample = fullDefinition.examples.reduce((best, example) => {
      const exampleKeywords = extractKeywords(example.toLowerCase());
      const exampleScore = exampleKeywords.filter(keyword => 
        textKeywords.includes(keyword)
      ).length / Math.max(exampleKeywords.length, 1);
      
      return exampleScore > best.score ? { example, score: exampleScore } : best;
    }, { example: '', score: 0 });
    
    if (bestExample.score > 0.3) { // Threshold for relevance
      relevantExample = bestExample.example;
    }
  }
  
  // Create a shorter, context-aware definition
  if (score > 0.2) { // If there's good context match
    // Try to extract the most relevant part of the definition
    const sentences = fullDefinition.definition.split(/[.!?]+/).filter(s => s.trim());
    
    if (sentences.length > 1) {
      // Find the sentence that best matches the context
      const bestSentence = sentences.reduce((best, sentence) => {
        const sentenceKeywords = extractKeywords(sentence.toLowerCase());
        const sentenceScore = sentenceKeywords.filter(keyword => 
          textKeywords.includes(keyword)
        ).length / Math.max(sentenceKeywords.length, 1);
        
        return sentenceScore > best.score ? { sentence, score: sentenceScore } : best;
      }, { sentence: sentences[0], score: 0 });
      
      if (bestSentence.score > 0.1) {
        relevantDefinition = bestSentence.sentence.trim();
    
        // Add the relevant example if we found one
        if (relevantExample) {
          relevantDefinition += ` (e.g., "${relevantExample}")`;
        }
      }
    }
  }
  
  // If the definition is still too long, truncate it
  if (relevantDefinition.length > 200) {
    const truncated = relevantDefinition.substring(0, 200).trim();
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 150) {
      relevantDefinition = truncated.substring(0, lastSpace) + '...';
    } else {
      relevantDefinition = truncated + '...';
    }
  }
  
  // Determine if we should preserve word origin
  // Always preserve if there's etymology interest or if the word origin is particularly interesting
  const preserveWordOrigin = hasEtymologyInterest || 
    !!(fullDefinition.wordOrigin && (
      fullDefinition.wordOrigin.includes('Old French') ||
      fullDefinition.wordOrigin.includes('Latin') ||
      fullDefinition.wordOrigin.includes('Greek') ||
      fullDefinition.wordOrigin.includes('Compound word') ||
      fullDefinition.wordOrigin.includes('Named after')
    ));
  
  return {
    relevantDefinition,
    score,
    keywords: keywordOverlap,
    preserveWordOrigin
  };
}

/**
 * Extract meaningful keywords from text
 * @param text Text to extract keywords from
 * @returns Array of keywords
 */
function extractKeywords(text: string): string[] {
  // Remove common stop words and punctuation
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs'
  ]);
  
  // Extract words (3+ characters) that aren't stop words
  const words = text.match(/\b[a-z]{3,}\b/g) || [];
  return words.filter(word => !stopWords.has(word));
}
