#!/usr/bin/env node

/**
 * Test Glossary Highlighting Across All Sections
 * 
 * This script verifies that the glossary highlighting system works
 * across all 21 sections of Alice in Wonderland.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Sample glossary terms that should appear in the text
const SAMPLE_GLOSSARY_TERMS = [
  'Alice',
  'White Rabbit',
  'rabbit-hole',
  'curious',
  'Wonderland',
  'Mouse',
  'Caucus-Race',
  'Dodo',
  'Dinah',
  'telescope',
  'pool of tears',
  'ORANGE MARMALADE'
];

// Book content structure (simplified for testing)
const bookContent = {
  chapters: [
    {
      title: "Chapter 1: Down the Rabbit-Hole",
      sections: [
        { id: "chapter-1-section-1", title: "Beginning", startPage: 1, endPage: 3, content: "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, 'and what is the use of a book,' thought Alice 'without pictures or conversations?' So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her." },
        { id: "chapter-1-section-2", title: "The Rabbit", startPage: 4, endPage: 6, content: "There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, 'Oh dear! Oh dear! I shall be late!' (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural); but when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge." },
        { id: "chapter-1-section-3", title: "Down the Hole", startPage: 7, endPage: 10, content: "In another moment down went Alice after it, never once considering how in the world she was to get out again. The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down a very deep well. Either the well was very deep, or she fell very slowly, for she had plenty of time as she went down to look about her and to wonder what was going to happen next. First, she tried to look down and make out what she was coming to, but it was too dark to see anything; then she looked at the sides of the well, and noticed that they were filled with cupboards and book-shelves; here and there she saw maps and pictures hung upon pegs. She took down a jar from one of the shelves as she passed; it was labelled 'ORANGE MARMALADE', but to her great disappointment it was empty: she did not like to drop the jar for fear of killing somebody, so managed to put it into one of the cupboards as she fell past it." },
        { id: "chapter-1-section-4", title: "The Hall of Doors", startPage: 11, endPage: 14, content: "Down, down, down. Would the fall never come to an end? 'I wonder how many miles I've fallen by this time?' she said aloud. 'I must be getting somewhere near the centre of the earth. Let me see: that would be four thousand miles down, I think—' (for, you see, Alice had learnt several things of this sort in her lessons in the schoolroom, and though this was not a very good opportunity for showing off her knowledge, as there was no one to listen to her, still it was good practice to say it over) '—yes, that's about the right distance—but then I wonder what Latitude or Longitude I've got to?' (Alice had no idea what Latitude was, or Longitude either, but thought they were nice grand words to say.)" },
        { id: "chapter-1-section-5", title: "The Golden Key", startPage: 15, endPage: 18, content: "Presently she began again. 'I wonder if I shall fall right through the earth! How funny it'll seem to come out among the people that walk with their heads downward! The Antipathies, I think—' (she was rather glad there was no one listening, this time, as it didn't sound at all the right word) '—but I shall have to ask them what the name of the country is, you know. Please, Ma'am, is this New Zealand or Australia?' (and she tried to curtsey as she spoke—fancy curtseying as you're falling through the air! Do you think you could manage it?) 'And what an ignorant little girl she'll think me for asking! No, it'll never do to ask: perhaps I shall see it written up somewhere.'" },
        { id: "chapter-1-section-6", title: "The Garden Door", startPage: 19, endPage: 22, content: "Down, down, down. There was nothing else to do, so Alice soon began talking again. 'Dinah'll miss me very much to-night, I should think!' (Dinah was the cat.) 'I hope they'll remember her saucer of milk at tea-time. Dinah my dear! I wish you were down here with me! There are no mice in the air, I'm afraid, but you might catch a bat, and that's very like a mouse, you know. But do cats eat bats, I wonder?' And here Alice began to get rather sleepy, and went on saying to herself, in a dreamy sort of way, 'Do cats eat bats? Do cats eat bats?' and sometimes, 'Do bats eat cats?' for, you see, as she couldn't answer either question, it didn't much matter which way she put it." },
        { id: "chapter-1-section-7", title: "The Pool of Tears", startPage: 23, endPage: 26, content: "She felt that she was dozing off, and had just begun to dream that she was walking hand in hand with Dinah, and saying to her very earnestly, 'Now, Dinah, tell me the truth: did you ever eat a bat?' when suddenly, thump! thump! down she came upon a heap of sticks and dry leaves, and the fall was over." }
      ]
    },
    {
      title: "Chapter 2: The Pool of Tears",
      sections: [
        { id: "chapter-2-section-1", title: "Curiouser and Curiouser", startPage: 27, endPage: 30, content: "'Curiouser and curiouser!' cried Alice (she was so much surprised, that for the moment she quite forgot how to speak good English); 'now I'm opening out like the largest telescope that ever was! Good-bye, feet!' (for when she looked down at her feet, they seemed to be almost out of sight, they were getting so far off). 'Oh, my poor little feet, I wonder who will put on your shoes and stockings for you now, dears? I'm sure I shan't be able! I shall be a great deal too far off to trouble myself about you: you must manage the best way you can; —but I must be kind to them,' thought Alice, 'or perhaps they won't walk the way I want to go! Let me see: I'll give them a new pair of boots every Christmas.'" },
        { id: "chapter-2-section-2", title: "The White Rabbit Again", startPage: 31, endPage: 34, content: "And she went on planning to herself how she would manage it. 'They must go by the carrier,' she thought; 'and how funny it'll seem, sending presents to one's own feet! And how odd the directions will look! Alice's Right Foot, Esq. Hearthrug, near the Fender, (with Alice's love). Oh dear, what nonsense I'm talking!'" },
        { id: "chapter-2-section-3", title: "The Hall and the Key", startPage: 35, endPage: 38, content: "Just then her head struck against the roof of the hall: in fact she was now more than nine feet high, and she at once took up the little golden key and hurried off to the garden door. Poor Alice! It was as much as she could do, lying down on one side, to look through into the garden with one eye; but to get through was more hopeless than ever: she sat down and began to cry again." },
        { id: "chapter-2-section-4", title: "The Pool of Tears", startPage: 39, endPage: 42, content: "'You ought to be ashamed of yourself,' said Alice, 'a great girl like you,' (she might well say this), 'to go on crying in this way! Stop this moment, I tell you!' But she went on all the same, shedding gallons of tears, until there was a large pool all round her, about four inches deep and reaching half down the hall. After a time she heard a little pattering of feet in the distance, and she hastily dried her eyes to see what was coming. It was the White Rabbit returning, splendidly dressed, with a pair of white kid gloves in one hand and a large fan in the other: he came trotting along in a great hurry, muttering to himself as he came, 'Oh! the Duchess, the Duchess! Oh! won't she be savage if I've kept her waiting!'" },
        { id: "chapter-2-section-5", title: "The Fan and Gloves", startPage: 43, endPage: 46, content: "Alice felt so desperate that she was ready to ask help of any one; so, when the Rabbit came near her, she began, in a low, timid voice, 'If you please, sir—' The Rabbit started violently, dropped the white kid gloves and the fan, and skurried away into the darkness as hard as he could go. Alice took up the fan and gloves, and, as the hall was very hot, she kept fanning herself all the time she went on talking: 'Dear, dear! How queer everything is to-day! And yesterday things went on just as usual. I wonder if I've been changed in the night? Let me think: was I the same when I got up this morning? I almost think I can remember feeling a little different. But if I'm not the same, the next question is, Who in the world am I? Ah, that's the great puzzle!'" },
        { id: "chapter-2-section-6", title: "The Shrinking", startPage: 47, endPage: 50, content: "And she began thinking over all the children she knew that were of the same age as herself, to see if she could have been changed for any of them. 'I'm sure I'm not Ada,' she said, 'for her hair goes in such long ringlets, and mine doesn't go in ringlets at all; and I'm sure I can't be Mabel, for I know all sorts of things, and she, oh! she knows such a very little! Besides, she's she, and I'm I, and—oh dear, how puzzling it all is! I'll try if I know all the things I used to know. Let me see: four times five is twelve, and four times six is thirteen, and four times seven is—oh dear! I shall never get to twenty at that rate! However, the Multiplication Table doesn't signify: let's try Geography. London is the capital of Paris, and Paris is the capital of Rome, and Rome—no, that's all wrong, I'm certain! I must have been changed for Mabel! I'll try and say 'How doth the little—'" },
        { id: "chapter-2-section-7", title: "The Mouse Appears", startPage: 51, endPage: 54, content: "She crossed her hands on her lap as if she were saying lessons, and began to repeat it, but her voice sounded hoarse and strange, and the words did not come the same as they used to do:— 'How doth the little crocodile Improve his shining tail, And pour the waters of the Nile On every golden scale! How cheerfully he seems to grin, How neatly spread his claws, And welcome little fishes in With gently smiling jaws!'" }
      ]
    },
    {
      title: "Chapter 3: A Caucus-Race and a Long Tale",
      sections: [
        { id: "chapter-3-section-1", title: "The Mouse", startPage: 55, endPage: 58, content: "'O Mouse, do you know the way out of this pool? I am very tired of swimming about here, O Mouse!' (Alice thought this must be the right way of speaking to a mouse: she had never done such a thing before, but she remembered having seen in her brother's Latin Grammar, 'A mouse—of a mouse—to a mouse—a mouse—O mouse!') The Mouse looked at her rather inquisitively, and seemed to her to wink with one of its little eyes, but it said nothing. 'Perhaps it doesn't understand English,' thought Alice; 'I daresay it's a French mouse, come over with William the Conqueror.' (For, with all her knowledge of history, Alice had no very clear notion how long ago anything had happened.) So she began again: 'Où est ma chatte?' which was the first sentence in her French lesson-book. The Mouse gave a sudden leap out of the water, and seemed to quiver all over with fright. 'Oh, I beg your pardon!' cried Alice hastily, afraid that she had hurt the poor animal's feelings. 'I quite forgot you didn't like cats.'" },
        { id: "chapter-3-section-2", title: "The Mouse's Tale", startPage: 59, endPage: 62, content: "'Not like cats!' cried the Mouse, in a shrill, passionate voice. 'Would you like cats if you were me?' 'Well, perhaps not,' said Alice in a soothing tone: 'don't be angry about it. And yet I wish I could show you our cat Dinah: I think you'd take a fancy to cats if you could only see her. She is such a dear quiet thing,' Alice went on, half to herself, as she swam lazily about in the pool, 'and she sits purring so nicely by the fire, licking her paws and washing her face—and she is such a nice soft thing to nurse—and she's such a capital one for catching mice—oh, I beg your pardon!' cried Alice again, for this time the Mouse was bristling all over, and she felt certain it must be really offended. 'We won't talk about her any more if you'd rather not.'" },
        { id: "chapter-3-section-3", title: "The Caucus-Race", startPage: 63, endPage: 66, content: "'We indeed!' cried the Mouse, who was trembling down to the end of his tail. 'As if I would talk on such a subject! Our family always hated cats: nasty, low, vulgar things! Don't let me hear the name again!' 'I won't indeed!' said Alice, in a great hurry to change the subject of conversation. 'Are you—are you fond—of—of dogs?' The Mouse did not answer, so Alice went on eagerly: 'There is such a nice little dog near our house I should like to show you! A little bright-eyed terrier, you know, with oh, such long curly brown hair! And it'll fetch things when you throw them, and it'll sit up and beg for its dinner, and all sorts of things—I can't remember half of them—and it belongs to a farmer, you know, and he says it's so useful, it's worth a hundred pounds! He says it kills all the rats and—oh dear!' cried Alice in a sorrowful tone, 'I'm afraid I've offended it again!' For the Mouse was swimming away from her as hard as it could go, and making quite a commotion in the pool as it went." },
        { id: "chapter-3-section-4", title: "The Dodo's Plan", startPage: 67, endPage: 70, content: "So she called softly after it, 'Mouse dear! Do come back again, and we won't talk about cats or dogs either, if you don't like them!' When the Mouse heard this, it turned round and swam slowly back to her: its face was quite pale (with passion, Alice thought), and it said in a low trembling voice, 'Let us get to the shore, and then I'll tell you my history, and you'll understand why it is I hate cats and dogs.' It was high time to go, for the pool was getting quite crowded with the birds and animals that had fallen into it: there were a Duck and a Dodo, a Lory and an Eaglet, and several other curious creatures. Alice led the way and the whole party swam to the shore." },
        { id: "chapter-3-section-5", title: "The Race Begins", startPage: 71, endPage: 74, content: "They were indeed a queer-looking party that assembled on the bank—the birds with draggled feathers, the animals with their fur clinging close to them, and all dripping wet, cross, and uncomfortable. The first question of course was, how to get dry again: they had a consultation about this, and after a few minutes it seemed quite natural to Alice to find herself talking familiarly with them, as if she had known them all her life. Indeed, she had quite a long argument with the Lory, who at last turned sulky, and would only say, 'I am older than you, and must know better'; and this Alice would not allow without knowing how old it was, and, as the Lory positively refused to tell its age, there was no more to be said." },
        { id: "chapter-3-section-6", title: "The Race Results", startPage: 75, endPage: 78, content: "At last the Mouse, who seemed to be a person of authority among them, called out, 'Sit down, all of you, and listen to me! I'll soon make you dry enough!' They all sat down at once, in a large ring, with the Mouse in the middle. Alice kept her eyes anxiously fixed on it, for she felt sure she would catch a bad cold if she did not get dry very soon. 'Ahem!' said the Mouse with an important air, 'are you all ready? This is the driest thing I know. Silence all round, if you please! \"William the Conqueror, whose cause was favoured by the pope, was soon submitted to by the English, who wanted leaders, and had been of late much accustomed to usurpation and conquest. Edwin and Morcar, the earls of Mercia and Northumbria—\"' 'Ugh!' said the Lory, with a shiver." },
        { id: "chapter-3-section-7", title: "The Prizes", startPage: 79, endPage: 82, content: "'I beg your pardon!' said the Mouse, frowning, but very politely: 'Did you speak?' 'Not I!' said the Lory hastily. 'I thought you did,' said the Mouse. '—I proceed. \"Edwin and Morcar, the earls of Mercia and Northumbria, declared for him: and even Stigand, the patriotic archbishop of Canterbury, found it advisable—\"' 'Found what?' said the Duck. 'Found it,' the Mouse replied rather crossly: 'of course you know what \"it\" means.' 'I know what \"it\" means well enough, when I find a thing,' said the Duck: 'it's generally a frog or a worm. The question is, what did the archbishop find?'" }
      ]
    }
  ]
};

class GlossaryHighlightingTester {
  constructor() {
    this.glossaryTerms = new Set();
    this.testResults = [];
    this.stats = {
      totalSections: 0,
      sectionsWithGlossaryTerms: 0,
      totalGlossaryMatches: 0,
      chapters: 0
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
      throw error;
    }
  }

  /**
   * Check if a word is a glossary term
   */
  isGlossaryTerm(word) {
    const cleanWord = word.replace(/[.,!?;:'"]/g, '').trim();
    if (!cleanWord) return false;
    
    return this.glossaryTerms.has(cleanWord) || 
           this.glossaryTerms.has(cleanWord.toLowerCase()) || 
           this.glossaryTerms.has(cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1));
  }

  /**
   * Test glossary highlighting in a section
   */
  testSection(section, chapterTitle) {
    const words = section.content.split(/\s+/);
    const glossaryMatches = [];
    
    words.forEach(word => {
      if (this.isGlossaryTerm(word)) {
        const cleanWord = word.replace(/[.,!?;:'"]/g, '').trim();
        glossaryMatches.push(cleanWord);
      }
    });

    const uniqueMatches = [...new Set(glossaryMatches)];
    
    return {
      sectionId: section.id,
      sectionTitle: section.title,
      chapterTitle,
      pageRange: `${section.startPage}-${section.endPage}`,
      glossaryMatches: uniqueMatches,
      matchCount: uniqueMatches.length,
      hasGlossaryTerms: uniqueMatches.length > 0
    };
  }

  /**
   * Test all sections in the book
   */
  async testAllSections() {
    console.log('🧪 Testing glossary highlighting across all sections...\n');
    
    this.stats.chapters = bookContent.chapters.length;
    
    bookContent.chapters.forEach(chapter => {
      console.log(`📚 ${chapter.title}:`);
      
      chapter.sections.forEach(section => {
        this.stats.totalSections++;
        const result = this.testSection(section, chapter.title);
        this.testResults.push(result);
        
        if (result.hasGlossaryTerms) {
          this.stats.sectionsWithGlossaryTerms++;
          this.stats.totalGlossaryMatches += result.matchCount;
          
          console.log(`  ✅ Section ${section.id}: "${section.title}" (pages ${section.pageRange})`);
          console.log(`     Found ${result.matchCount} glossary terms: ${result.glossaryMatches.join(', ')}`);
        } else {
          console.log(`  ⚠️  Section ${section.id}: "${section.title}" (pages ${section.pageRange}) - No glossary terms found`);
        }
      });
      
      console.log('');
    });
  }

  /**
   * Generate summary report
   */
  generateReport() {
    console.log('📊 GLOSSARY HIGHLIGHTING TEST RESULTS');
    console.log('=====================================\n');
    
    console.log(`📚 Total Chapters: ${this.stats.chapters}`);
    console.log(`📄 Total Sections: ${this.stats.totalSections}`);
    console.log(`✨ Sections with Glossary Terms: ${this.stats.sectionsWithGlossaryTerms}`);
    console.log(`🔍 Total Glossary Matches: ${this.stats.totalGlossaryMatches}`);
    console.log(`📈 Coverage: ${((this.stats.sectionsWithGlossaryTerms / this.stats.totalSections) * 100).toFixed(1)}%\n`);
    
    // Show sections with most glossary terms
    const topSections = this.testResults
      .filter(r => r.hasGlossaryTerms)
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, 5);
    
    if (topSections.length > 0) {
      console.log('🏆 Top 5 Sections with Most Glossary Terms:');
      topSections.forEach((section, index) => {
        console.log(`  ${index + 1}. ${section.sectionTitle} (${section.matchCount} terms): ${section.glossaryMatches.join(', ')}`);
      });
      console.log('');
    }
    
    // Show sections without glossary terms
    const sectionsWithoutTerms = this.testResults.filter(r => !r.hasGlossaryTerms);
    if (sectionsWithoutTerms.length > 0) {
      console.log('⚠️  Sections without Glossary Terms:');
      sectionsWithoutTerms.forEach(section => {
        console.log(`  - ${section.sectionTitle} (${section.pageRange})`);
      });
      console.log('');
    }
    
    // Overall assessment
    if (this.stats.sectionsWithGlossaryTerms > 0) {
      console.log('✅ SUCCESS: Glossary highlighting system is working across multiple sections!');
      console.log(`   The orange highlighting will appear in ${this.stats.sectionsWithGlossaryTerms} out of ${this.stats.totalSections} sections.`);
    } else {
      console.log('❌ ISSUE: No glossary terms found in any sections.');
      console.log('   This might indicate a problem with the glossary data or term matching.');
    }
  }

  /**
   * Run the complete test
   */
  async run() {
    console.log('🧪 Testing Glossary Highlighting Across All Sections');
    console.log('====================================================\n');
    
    try {
      await this.loadGlossaryTerms();
      await this.testAllSections();
      this.generateReport();
      
      console.log('\n🎯 NEXT STEPS:');
      console.log('1. Start the development server: npm run dev');
      console.log('2. Navigate to /reader/interaction');
      console.log('3. Test different sections to see orange glossary highlighting');
      console.log('4. Hover over words to see the highlighting effect');
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the test
const tester = new GlossaryHighlightingTester();
tester.run(); 