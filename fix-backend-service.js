import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'src', 'services', 'backendService.ts');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Define patterns to match functions that use useRealBackend and client
const functionPattern = /export async function (\w+)[^{]*\{[^}]*if\s*\(\s*(?:await\s+)?useRealBackend\(\)\s*\)\s*\{[^]*?const\s*\{\s*(?:data|data:\s+\w+)(?:,\s+error|,\s+error:\s+\w+)?\s*\}\s*=\s*await\s+client/g;

// Capture all functions that need client initialization
const functionsToFix = [];
let match;
while ((match = functionPattern.exec(content)) !== null) {
  functionsToFix.push(match[1]);
}

// For each function, ensure client is properly initialized
functionsToFix.forEach(functionName => {
  // Find the function
  const functionRegex = new RegExp(`export async function ${functionName}[^{]*\\{[^}]*if\\s*\\(\\s*(?:await\\s+)?useRealBackend\\(\\)\\s*\\)\\s*\\{`, 'g');
  const functionMatch = functionRegex.exec(content);
  
  if (functionMatch) {
    const startPos = functionMatch.index + functionMatch[0].length;
    
    // Check if we already have client initialization
    const nextChunkOfCode = content.substring(startPos, startPos + 200);
    if (!nextChunkOfCode.includes('const client = await getSupabaseClient()')) {
      // Insert client initialization
      const tryMatch = /\s*try\s*\{/.exec(nextChunkOfCode);
      const insertPosition = startPos + (tryMatch ? tryMatch.index + tryMatch[0].length : 0);
      
      const beforeInsert = content.substring(0, insertPosition);
      const afterInsert = content.substring(insertPosition);
      const insertion = '\n      // Get the Supabase client\n      const client = await getSupabaseClient();\n';
      
      content = beforeInsert + insertion + afterInsert;
    }
  }
});

// Fix all useRealBackend calls to be await useRealBackend()
content = content.replace(/if\s*\(\s*useRealBackend\(\)\s*\)/g, 'if (await useRealBackend())');

// Write the transformed content back to the file
fs.writeFileSync(filePath, content, 'utf8');
console.log('Backend service updated successfully.'); 