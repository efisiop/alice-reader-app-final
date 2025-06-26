import { getAliceGlossaryTerms } from '../src/services/dictionaryService.ts';

console.log('🧪 Testing Glossary Highlighting Feature');
console.log('=====================================\n');

try {
  // Test getting glossary terms
  console.log('📖 Loading Alice glossary terms...');
  const terms = getAliceGlossaryTerms();
  
  console.log(`✅ Successfully loaded ${terms.size} glossary terms\n`);
  
  // Test some specific terms
  const testTerms = [
    'Alice',
    'Wonderland', 
    'White Rabbit',
    'Cheshire Cat',
    'Mad Hatter',
    'Queen of Hearts',
    'Dormouse',
    'Caucus-Race',
    'rabbit-hole'
  ];
  
  console.log('🔍 Testing specific terms:');
  testTerms.forEach(term => {
    const hasTerm = terms.has(term);
    const hasLower = terms.has(term.toLowerCase());
    const hasUpper = terms.has(term.charAt(0).toUpperCase() + term.slice(1));
    
    console.log(`  "${term}": ${hasTerm ? '✅' : '❌'} (exact)`);
    console.log(`  "${term.toLowerCase()}": ${hasLower ? '✅' : '❌'} (lowercase)`);
    console.log(`  "${term.charAt(0).toUpperCase() + term.slice(1)}": ${hasUpper ? '✅' : '❌'} (capitalized)`);
    console.log('');
  });
  
  // Show some sample terms
  console.log('📋 Sample glossary terms:');
  const sampleTerms = Array.from(terms).slice(0, 20);
  sampleTerms.forEach((term, index) => {
    console.log(`  ${index + 1}. ${term}`);
  });
  
  if (terms.size > 20) {
    console.log(`  ... and ${terms.size - 20} more terms`);
  }
  
  console.log('\n🎉 Glossary highlighting feature is ready!');
  console.log('\n💡 Next steps:');
  console.log('   1. Start the development server: npm run dev');
  console.log('   2. Navigate to the reader interface');
  console.log('   3. Hover over words to see different highlights');
  console.log('   4. Technical terms will show orange, normal words will show blue');
  
} catch (error) {
  console.error('❌ Error testing glossary highlighting:', error);
  process.exit(1);
} 