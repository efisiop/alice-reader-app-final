// scripts/verify-config.js
// Simple script to verify environment configuration

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Verifying environment configuration...');

// Function to strip comments from JSON
function stripJsonComments(jsonString) {
  return jsonString
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .replace(/\/\/.*$/gm, '')         // Remove single-line comments
    .replace(/\s+/g, ' ');           // Replace multiple whitespace with single space
}

// Check for tsconfig.app.json
const tsconfigAppPath = join(__dirname, '../tsconfig.app.json');
if (existsSync(tsconfigAppPath)) {
  console.log('✅ tsconfig.app.json exists');

  try {
    // Check for path aliases
    const fileContent = readFileSync(tsconfigAppPath, 'utf8');
    const jsonContent = stripJsonComments(fileContent);
    const tsconfigApp = JSON.parse(jsonContent);

    if (tsconfigApp.compilerOptions && tsconfigApp.compilerOptions.paths) {
      console.log('✅ Path aliases configured in tsconfig.app.json');

      // Check for specific path aliases
      const requiredAliases = ['@/*', '@components/*', '@services/*', '@utils/*', '@constants/*'];
      const configuredAliases = Object.keys(tsconfigApp.compilerOptions.paths);

      const missingAliases = requiredAliases.filter(alias => !configuredAliases.includes(alias));

      if (missingAliases.length === 0) {
        console.log('✅ All required path aliases are configured');
      } else {
        console.error('❌ Missing path aliases:', missingAliases);
      }
    } else {
      console.error('❌ Path aliases not configured in tsconfig.app.json');
    }
  } catch (error) {
    console.error('❌ Error parsing tsconfig.app.json:', error.message);
  }
} else {
  console.error('❌ tsconfig.app.json not found');
}

// Check for constants file
const constantsPath = join(__dirname, '../src/constants/app.ts');
if (existsSync(constantsPath)) {
  console.log('✅ Constants file exists at src/constants/app.ts');
} else {
  console.error('❌ Constants file not found at src/constants/app.ts');
}

// Check for environment configuration
const envConfigPath = join(__dirname, '../src/config/environment.ts');
if (existsSync(envConfigPath)) {
  console.log('✅ Environment configuration exists at src/config/environment.ts');
} else {
  console.error('❌ Environment configuration not found at src/config/environment.ts');
}

console.log('\nVerification complete!');
