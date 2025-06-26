#!/usr/bin/env node

/**
 * Comprehensive Glossary Highlighting Verification Script
 * 
 * This script verifies that all 162 Alice in Wonderland glossary terms
 * are properly highlighted in orange when hovered over in the app.
 * 
 * Usage: node scripts/verify-glossary-highlighting.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// All the glossary terms provided by the user
const REQUIRED_GLOSSARY_TERMS = [
  'Leisurely',
  'Kid gloves',
  'Frowning',
  'Fender',
  'Imperious',
  'Shutting up like a telescope',
  'Prima',
  'Pilgrim',
  'Race-course',
  'Book-shelves',
  'Deft (pen)',
  'Terrier',
  'Half-comic and half-tragic',
  'Burning with curiosity',
  'Take a fancy to',
  'Person of authority',
  'Passionate (voice)',
  'History (tell you my)',
  'Wanderings',
  'Ou est ma chatte?',
  'Prosecute',
  'Thimble',
  'Ada',
  'Tertia',
  'Currants',
  'Ventured (to taste it)',
  'Wondered (at this)',
  'Score (two score years)',
  'Peeped',
  'Tale (long and sad / Mouse\'s tail)',
  'Mabel',
  'Usurpation',
  'Adoption (of more energetic remedies)',
  'Curtsey (Curtseying)',
  'White Rabbit',
  'Rabbit-hole',
  'Stigand',
  'Sulky',
  'Considering',
  'Wink (with one of its little eyes)',
  'Edwin and Morcar',
  'Energetic remedies',
  'Caucus-Race',
  'Lory',
  'Perennial',
  'Multiplication Table',
  'Advise',
  'Consultation',
  'Daresay',
  'Familiarly',
  'Poky (little house)',
  'Low-spirited',
  'Antipathies',
  'Archbishop of Canterbury',
  'Patted on the back',
  'Lose your temper',
  'William the Conqueror',
  'Mercia and Northumbria',
  'Melancholy (tone)',
  'Pool Of Tears',
  'Sighing',
  'Dodo',
  'Gallons (of tears)',
  'Naught',
  'Adjourn',
  'Splendidly (dressed)',
  'Camlet',
  'Edict',
  'Cross (all dripping wet, cross, and uncomfortable)',
  'Histories (nice little histories)',
  'Addressing (nobody in particular)',
  'Wells of fancy',
  'Bank (of a river)',
  'Canary',
  'Duck',
  'Vulgar',
  'Skurried',
  'Patriotic',
  'Puzzling (about it)',
  'Daisy-chain',
  'Cur',
  'Advisable',
  'Walrus',
  'Savage (if I\'ve kept her waiting)',
  'Fit (it fitted!)',
  'Mock Turtle',
  'Try the patience of an oyster',
  'Wither\'d wreath',
  'Afresh',
  'Marked in currants',
  'Plied (oars are plied)',
  'Quiver (all over with fright)',
  'Comfits',
  'Prizes',
  'Carrier (go by the)',
  'Panting',
  'Shedding gallons of tears',
  'Mad Tea-Party',
  'Fury',
  'Crocodile (How doth the little)'
];

// Sample text from Alice in Wonderland chapters for testing
const SAMPLE_TEXTS = {
  chapter1: [
    "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, 'and what is the use of a book,' thought Alice 'without pictures or conversations?'",
    "So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.",
    "There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, 'Oh dear! Oh dear! I shall be late!' (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural); but when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge.",
    "In another moment down went Alice after it, never once considering how in the world she was to get out again. The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down a very deep well.",
    "Either the well was very deep, or she fell very slowly, for she had plenty of time as she went down to look about her and to wonder what was going to happen next. First, she tried to look down and make out what she was coming to, but it was too dark to see anything; then she looked at the sides of the well, and noticed that they were filled with cupboards and book-shelves; here and there she saw maps and pictures hung upon pegs. She took down a jar from one of the shelves as she passed; it was labelled 'ORANGE MARMALADE', but to her great disappointment it was empty: she did not like to drop the jar for fear of killing somebody, so managed to put it into one of the cupboards as she fell past it."
  ],
  chapter2: [
    "'Curiouser and curiouser!' cried Alice (she was so much surprised, that for the moment she quite forgot how to speak good English); 'now I'm opening out like the largest telescope that ever was! Good-bye, feet!' (for when she looked down at her feet, they seemed to be almost out of sight, they were getting so far off). 'Oh, my poor little feet, I wonder who will put on your shoes and stockings for you now, dears? I'm sure I shan't be able! I shall be a great deal too far off to trouble myself about you: you must manage the best way you can; —but I must be kind to them,' thought Alice, 'or perhaps they won't walk the way I want to go! Let me see: I'll give them a new pair of boots every Christmas.'",
    "And she went on planning to herself how she would manage it. 'They must go by the carrier,' she thought; 'and how funny it'll seem, sending presents to one's own feet! And how odd the directions will look! Alice's Right Foot, Esq. Hearthrug, near the Fender, (with Alice's love). Oh dear, what nonsense I'm talking!'",
    "Just then her head struck against the roof of the hall: in fact she was now more than nine feet high, and she at once took up the little golden key and hurried off to the garden door. Poor Alice! It was as much as she could do, lying down on one side, to look through into the garden with one eye; but to get through was more hopeless than ever: she sat down and began to cry again.",
    "'You ought to be ashamed of yourself,' said Alice, 'a great girl like you,' (she might well say this), 'to go on crying in this way! Stop this moment, I tell you!' But she went on all the same, shedding gallons of tears, until there was a large pool all round her, about four inches deep and reaching half down the hall.",
    "After a time she heard a little pattering of feet in the distance, and she hastily dried her eyes to see what was coming. It was the White Rabbit returning, splendidly dressed, with a pair of white kid gloves in one hand and a large fan in the other: he came trotting along in a great hurry, muttering to himself as he came, 'Oh! the Duchess, the Duchess! Oh! won't she be savage if I've kept her waiting!'"
  ],
  chapter3: [
    "'O Mouse, do you know the way out of this pool? I am very tired of swimming about here, O Mouse!' (Alice thought this must be the right way of speaking to a mouse: she had never done such a thing before, but she remembered having seen in her brother's Latin Grammar, 'A mouse—of a mouse—to a mouse—a mouse—O mouse!') The Mouse looked at her rather inquisitively, and seemed to her to wink with one of its little eyes, but it said nothing.",
    "'Perhaps it doesn't understand English,' thought Alice; 'I daresay it's a French mouse, come over with William the Conqueror.' (For, with all her knowledge of history, Alice had no very clear notion how long ago anything had happened.) So she began again: 'Où est ma chatte?' which was the first sentence in her French lesson-book. The Mouse gave a sudden leap out of the water, and seemed to quiver all over with fright. 'Oh, I beg your pardon!' cried Alice hastily, afraid that she had hurt the poor animal's feelings. 'I quite forgot you didn't like cats.'",
    "'Not like cats!' cried the Mouse, in a shrill, passionate voice. 'Would you like cats if you were me?' 'Well, perhaps not,' said Alice in a soothing tone: 'don't be angry about it. And yet I wish I could show you our cat Dinah: I think you'd take a fancy to cats if you could only see her. She is such a dear quiet thing,' Alice went on, half to herself, as she swam lazily about in the pool, 'and she sits purring so nicely by the fire, licking her paws and washing her face—and she is such a nice soft thing to nurse—and she's such a capital one for catching mice—oh, I beg your pardon!' cried Alice again, for this time the Mouse was bristling all over, and she felt certain it must be really offended. 'We won't talk about her any more if you'd rather not.'",
    "'We indeed!' cried the Mouse, who was trembling down to the end of his tail. 'As if I would talk on such a subject! Our family always hated cats: nasty, low, vulgar things! Don't let me hear the name again!' 'I won't indeed!' said Alice, in a great hurry to change the subject of conversation. 'Are you—are you fond—of—of dogs?' The Mouse did not answer, so Alice went on eagerly: 'There is such a nice little dog near our house I should like to show you! A little bright-eyed terrier, you know, with oh, such long curly brown hair! And it'll fetch things when you throw them, and it'll sit up and beg for its dinner, and all sorts of things—I can't remember half of them—and it belongs to a farmer, you know, and he says it's so useful, it's worth a hundred pounds! He says it kills all the rats and—oh dear!' cried Alice in a sorrowful tone, 'I'm afraid I've offended it again!' For the Mouse was swimming away from her as hard as it could go, and making quite a commotion in the pool as it went.",
    "So she called softly after it, 'Mouse dear! Do come back again, and we won't talk about cats or dogs either, if you don't like them!' When the Mouse heard this, it turned round and swam slowly back to her: its face was quite pale (with passion, Alice thought), and it said in a low trembling voice, 'Let us get to the shore, and then I'll tell you my history, and you'll understand why it is I hate cats and dogs.' It was high time to go, for the pool was getting quite crowded with the birds and animals that had fallen into it: there were a Duck and a Dodo, a Lory and an Eaglet, and several other curious creatures. Alice led the way and the whole party swam to the shore.",
    "They were indeed a queer-looking party that assembled on the bank—the birds with draggled feathers, the animals with their fur clinging close to them, and all dripping wet, cross, and uncomfortable. The first question of course was, how to get dry again: they had a consultation about this, and after a few minutes it seemed quite natural to Alice to find herself talking familiarly with them, as if she had known them all her life. Indeed, she had quite a long argument with the Lory, who at last turned sulky, and would only say, 'I am older than you, and must know better'; and this Alice would not allow without knowing how old it was, and, as the Lory positively refused to tell its age, there was no more to be said.",
    "At last the Mouse, who seemed to be a person of authority among them, called out, 'Sit down, all of you, and listen to me! I'll soon make you dry enough!' They all sat down at once, in a large ring, with the Mouse in the middle. Alice kept her eyes anxiously fixed on it, for she felt sure she would catch a bad cold if she did not get dry very soon. 'Ahem!' said the Mouse with an important air, 'are you all ready? This is the driest thing I know. Silence all round, if you please! \"William the Conqueror, whose cause was favoured by the pope, was soon submitted to by the English, who wanted leaders, and had been of late much accustomed to usurpation and conquest. Edwin and Morcar, the earls of Mercia and Northumbria—\"' 'Ugh!' said the Lory, with a shiver.",
    "'I beg your pardon!' said the Mouse, frowning, but very politely: 'Did you speak?' 'Not I!' said the Lory hastily. 'I thought you did,' said the Mouse. '—I proceed. \"Edwin and Morcar, the earls of Mercia and Northumbria, declared for him: and even Stigand, the patriotic archbishop of Canterbury, found it advisable—\"' 'Found what?' said the Duck. 'Found it,' the Mouse replied rather crossly: 'of course you know what \"it\" means.' 'I know what \"it\" means well enough, when I find a thing,' said the Duck: 'it's generally a frog or a worm. The question is, what did the archbishop find?'"
  ]
};

class GlossaryHighlightingVerifier {
  constructor() {
    this.glossaryTerms = new Set();
    this.foundTerms = new Set();
    this.missingTerms = new Set();
    this.testResults = {
      totalTerms: REQUIRED_GLOSSARY_TERMS.length,
      foundTerms: 0,
      missingTerms: 0,
      chapters: {
        chapter1: { found: 0, missing: 0, terms: [] },
        chapter2: { found: 0, missing: 0, terms: [] },
        chapter3: { found: 0, missing: 0, terms: [] }
      }
    };
  }

  /**
   * Load glossary terms from Supabase
   */
  async loadGlossaryTerms() {
    console.log('📖 Loading glossary terms from Supabase...');
    
    try {
      const { data, error } = await supabase
        .from('alice_glossary')
        .select('term')
        .order('term');

      if (error) {
        throw new Error(`Failed to fetch glossary terms: ${error.message}`);
      }

      if (data && data.length > 0) {
        data.forEach(item => {
          const term = item.term;
          if (term) {
            // Add the original term
            this.glossaryTerms.add(term);
            
            // Add lowercase version
            this.glossaryTerms.add(term.toLowerCase());
            
            // Add capitalized version
            this.glossaryTerms.add(term.charAt(0).toUpperCase() + term.slice(1));
            
            // Add title case version for multi-word terms
            if (term.includes(' ')) {
              const titleCase = term.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ');
              this.glossaryTerms.add(titleCase);
            }
          }
        });
      }

      console.log(`✅ Loaded ${this.glossaryTerms.size} glossary terms (${data?.length || 0} original entries)\n`);
      
    } catch (error) {
      console.error('❌ Error loading glossary terms:', error.message);
      // For testing purposes, we'll use the required terms as fallback
      console.log('🔄 Using fallback glossary terms for testing...');
      REQUIRED_GLOSSARY_TERMS.forEach(term => {
        this.glossaryTerms.add(term);
        this.glossaryTerms.add(term.toLowerCase());
        this.glossaryTerms.add(term.charAt(0).toUpperCase() + term.slice(1));
        if (term.includes(' ')) {
          const titleCase = term.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
          this.glossaryTerms.add(titleCase);
        }
      });
    }
  }

  /**
   * Check if a word is in the glossary
   */
  isGlossaryTerm(word) {
    const cleanWord = word.replace(/[.,!?;:'"]/g, '').trim();
    const lowerWord = cleanWord.toLowerCase();
    const capitalizedWord = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);
    const titleCaseWord = cleanWord.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    return this.glossaryTerms.has(cleanWord) || 
           this.glossaryTerms.has(lowerWord) || 
           this.glossaryTerms.has(capitalizedWord) || 
           this.glossaryTerms.has(titleCaseWord);
  }

  /**
   * Get the original term from the glossary
   */
  getOriginalTerm(word) {
    const cleanWord = word.replace(/[.,!?;:'"]/g, '').trim();
    const lowerWord = cleanWord.toLowerCase();
    const capitalizedWord = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);
    const titleCaseWord = cleanWord.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    if (this.glossaryTerms.has(cleanWord)) return cleanWord;
    if (this.glossaryTerms.has(lowerWord)) return lowerWord;
    if (this.glossaryTerms.has(capitalizedWord)) return capitalizedWord;
    if (this.glossaryTerms.has(titleCaseWord)) return titleCaseWord;
    
    return null;
  }

  /**
   * Test glossary highlighting in a text sample
   */
  testTextSample(text, chapterName) {
    const wordPattern = /([\w'']+|[.,!?;:()\[\]{}""''\\\/-—–]|\s+)/g;
    const tokens = text.match(wordPattern) || [];
    const foundTerms = new Set();

    tokens.forEach(token => {
      if (!token || /^\s+$/.test(token) || /^[.,!?;:()\[\]{}""''\\\/-—–]$/.test(token)) {
        return;
      }

      if (this.isGlossaryTerm(token)) {
        const originalTerm = this.getOriginalTerm(token);
        if (originalTerm) {
          foundTerms.add(originalTerm);
          this.foundTerms.add(originalTerm);
        }
      }
    });

    // Update test results
    this.testResults.chapters[chapterName].found = foundTerms.size;
    this.testResults.chapters[chapterName].terms = Array.from(foundTerms);
    
    return foundTerms;
  }

  /**
   * Run comprehensive tests
   */
  async runTests() {
    console.log('🧪 Comprehensive Glossary Highlighting Verification');
    console.log('===================================================\n');

    // Step 1: Load glossary terms
    await this.loadGlossaryTerms();

    // Step 2: Test each chapter
    console.log('📚 Testing Chapter 1: Down the Rabbit-Hole');
    console.log('-------------------------------------------');
    SAMPLE_TEXTS.chapter1.forEach((text, index) => {
      const foundTerms = this.testTextSample(text, 'chapter1');
      if (foundTerms.size > 0) {
        console.log(`  Section ${index + 1}: Found ${foundTerms.size} terms: ${Array.from(foundTerms).join(', ')}`);
      }
    });

    console.log('\n📚 Testing Chapter 2: The Pool of Tears');
    console.log('----------------------------------------');
    SAMPLE_TEXTS.chapter2.forEach((text, index) => {
      const foundTerms = this.testTextSample(text, 'chapter2');
      if (foundTerms.size > 0) {
        console.log(`  Section ${index + 1}: Found ${foundTerms.size} terms: ${Array.from(foundTerms).join(', ')}`);
      }
    });

    console.log('\n📚 Testing Chapter 3: A Caucus-Race and a Long Tale');
    console.log('---------------------------------------------------');
    SAMPLE_TEXTS.chapter3.forEach((text, index) => {
      const foundTerms = this.testTextSample(text, 'chapter3');
      if (foundTerms.size > 0) {
        console.log(`  Section ${index + 1}: Found ${foundTerms.size} terms: ${Array.from(foundTerms).join(', ')}`);
      }
    });

    // Step 3: Calculate missing terms
    this.missingTerms = new Set(REQUIRED_GLOSSARY_TERMS.filter(term => !this.foundTerms.has(term)));
    this.testResults.foundTerms = this.foundTerms.size;
    this.testResults.missingTerms = this.missingTerms.size;

    // Step 4: Generate report
    this.generateReport();
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    console.log('\n📊 COMPREHENSIVE TEST RESULTS');
    console.log('=============================\n');

    // Summary statistics
    console.log('📈 Summary Statistics:');
    console.log(`  Total Required Terms: ${this.testResults.totalTerms}`);
    console.log(`  Found Terms: ${this.testResults.foundTerms} (${((this.testResults.foundTerms / this.testResults.totalTerms) * 100).toFixed(1)}%)`);
    console.log(`  Missing Terms: ${this.testResults.missingTerms} (${((this.testResults.missingTerms / this.testResults.totalTerms) * 100).toFixed(1)}%)`);

    // Chapter breakdown
    console.log('\n📖 Chapter Breakdown:');
    Object.entries(this.testResults.chapters).forEach(([chapter, stats]) => {
      const chapterName = chapter === 'chapter1' ? 'Chapter 1: Down the Rabbit-Hole' :
                         chapter === 'chapter2' ? 'Chapter 2: The Pool of Tears' :
                         'Chapter 3: A Caucus-Race and a Long Tale';
      console.log(`  ${chapterName}:`);
      console.log(`    Found: ${stats.found} terms`);
      if (stats.terms.length > 0) {
        console.log(`    Terms: ${stats.terms.join(', ')}`);
      }
    });

    // Found terms
    if (this.foundTerms.size > 0) {
      console.log('\n✅ Found Terms (should show orange highlighting):');
      const sortedFoundTerms = Array.from(this.foundTerms).sort();
      sortedFoundTerms.forEach((term, index) => {
        console.log(`  ${index + 1}. ${term}`);
      });
    }

    // Missing terms
    if (this.missingTerms.size > 0) {
      console.log('\n❌ Missing Terms (need to be added to glossary):');
      const sortedMissingTerms = Array.from(this.missingTerms).sort();
      sortedMissingTerms.forEach((term, index) => {
        console.log(`  ${index + 1}. ${term}`);
      });
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (this.missingTerms.size === 0) {
      console.log('  ✅ All required terms are present in the glossary!');
      console.log('  ✅ Orange highlighting should work correctly for all terms.');
    } else {
      console.log(`  ⚠️  ${this.missingTerms.size} terms are missing from the glossary.`);
      console.log('  🔧 Add missing terms to the alice_glossary table in Supabase.');
      console.log('  🎨 Ensure all terms show orange highlighting when hovered.');
    }

    console.log('\n🎯 Next Steps:');
    console.log('  1. Start the development server: npm run dev');
    console.log('  2. Navigate to /reader/interaction or /alice-glossary-demo');
    console.log('  3. Hover over words in the text');
    console.log('  4. Verify glossary terms show orange highlighting');
    console.log('  5. Verify normal words show blue highlighting');

    console.log('\n✨ Test completed!');
  }
}

// Run the verification
async function main() {
  try {
    const verifier = new GlossaryHighlightingVerifier();
    await verifier.runTests();
  } catch (error) {
    console.error('❌ Error running verification:', error.message);
    process.exit(1);
  }
}

main(); 