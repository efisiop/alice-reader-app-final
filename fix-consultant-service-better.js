import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'src', 'services', 'consultantService.ts');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Remove the supabase import
content = content.replace(/import\s*{\s*supabase\s*}\s*from\s*['"]\.\/supabaseClient['"]\s*;/, '');

// Make sure getSupabaseClient is imported
if (!content.includes('import { getSupabaseClient }')) {
  content = content.replace(
    /import\s*{([^}]*)}\s*from\s*['"]\.\/supabaseClient['"]\s*;/,
    'import { $1, getSupabaseClient } from \'./supabaseClient\';'
  );
  
  // If no other imports from supabaseClient, add it
  if (!content.includes('from \'./supabaseClient\'')) {
    content = `import { getSupabaseClient } from './supabaseClient';\n${content}`;
  }
}

// Find all blocks that use supabase
const regex = /(const\s*\{\s*(?:data|data:\s+\w+)(?:,\s+error|,\s+error:\s+\w+)?\s*\}\s*=\s*await\s+supabase\.|supabase\.)/g;
let match;
let positions = [];

while ((match = regex.exec(content)) !== null) {
  positions.push(match.index);
}

// Process in reverse order to avoid position shifts
positions.sort((a, b) => b - a);

for (const pos of positions) {
  // Look 5 lines back to see if we already have client initialization
  const prevCode = content.substring(Math.max(0, pos - 200), pos);
  
  if (!prevCode.includes('const client = await getSupabaseClient()')) {
    // Add client initialization
    const newPos = content.lastIndexOf('\n', pos);
    content = content.substring(0, newPos) + 
              '\n    const client = await getSupabaseClient();' + 
              content.substring(newPos);
  }
  
  // Replace the actual supabase call
  const nextChunk = content.substring(pos, pos + 50);
  
  if (nextChunk.includes('await supabase.')) {
    content = content.substring(0, pos) + 
              nextChunk.replace('await supabase.', 'await client.') + 
              content.substring(pos + nextChunk.length);
  } else if (nextChunk.includes('supabase.')) {
    content = content.substring(0, pos) + 
              nextChunk.replace('supabase.', 'client.') + 
              content.substring(pos + nextChunk.length);
  }
}

// Fix any double client initializations
content = content.replace(/const client = await getSupabaseClient\(\);\s*const client = await getSupabaseClient\(\);/g, 
                        'const client = await getSupabaseClient();');

// Write the transformed content back to the file
fs.writeFileSync(filePath, content, 'utf8');
console.log('Consultant service properly updated.'); 