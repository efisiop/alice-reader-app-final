// scripts/check-circular-deps.js
// Script to check for circular dependencies in the codebase

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('Checking for circular dependencies in the codebase...');

// Check if madge is installed
try {
  execSync('npx madge --version', { stdio: 'ignore' });
} catch (error) {
  console.log('Installing madge for dependency analysis...');
  execSync('npm install --no-save madge', { stdio: 'inherit' });
}

// Run madge to check for circular dependencies
try {
  console.log('Analyzing dependencies...');
  
  // Create a temporary directory for the output
  const tempDir = join(rootDir, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  
  // Generate a graph visualization
  const graphPath = join(tempDir, 'dependency-graph.svg');
  execSync(`npx madge --image ${graphPath} --extensions ts,tsx,js,jsx src/`, { 
    cwd: rootDir,
    stdio: 'inherit' 
  });
  
  console.log(`Dependency graph generated at: ${graphPath}`);
  
  // Check for circular dependencies
  const result = execSync('npx madge --circular --extensions ts,tsx,js,jsx src/', { 
    cwd: rootDir,
    encoding: 'utf-8' 
  });
  
  if (result.trim()) {
    console.error('❌ Circular dependencies detected:');
    console.error(result);
    process.exit(1);
  } else {
    console.log('✅ No circular dependencies detected!');
  }
  
  // Check specifically for service dependencies
  console.log('\nChecking service dependencies...');
  const serviceResult = execSync('npx madge --circular --extensions ts,tsx,js,jsx src/services/', { 
    cwd: rootDir,
    encoding: 'utf-8' 
  });
  
  if (serviceResult.trim()) {
    console.error('❌ Circular dependencies detected in services:');
    console.error(serviceResult);
    process.exit(1);
  } else {
    console.log('✅ No circular dependencies detected in services!');
  }
  
} catch (error) {
  console.error('Error checking for circular dependencies:', error.message);
  process.exit(1);
}

console.log('\nDependency check completed successfully!');
