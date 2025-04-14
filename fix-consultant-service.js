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

// Replace all supabase.X() calls with client.X()
const pattern = /await\s+supabase\./g;
const replacement = 'const client = await getSupabaseClient();\n    await client.';

content = content.replace(pattern, replacement);

// Replace all direct uses of "supabase." without await
const directPattern = /supabase\./g;
content = content.replace(directPattern, 'client.');

// Write the transformed content back to the file
fs.writeFileSync(filePath, content, 'utf8');
console.log('Consultant service updated successfully.'); 