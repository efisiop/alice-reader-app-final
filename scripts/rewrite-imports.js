// scripts/rewrite-imports.js
const fs = require('fs');
const path = require('path');

// Configuration
const SRC_DIR = path.resolve(__dirname, '../src');
const EXCLUDE_DIRS = ['generated', 'node_modules', 'services'];
const SERVICE_NAMES = [
  'bookService',
  'feedbackService',
  'triggerService',
  'aiService',
  'statisticsService'
];

// Process a file to rewrite imports
function rewriteImports(filePath) {
  console.log(`Processing ${filePath}`);
  
  // Read file content
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find service imports
  let updatedContent = content;
  
  for (const serviceName of SERVICE_NAMES) {
    // Match direct imports of the service
    const directImportRegex = new RegExp(`import\\s+(?:{[^}]*}|\\*\\s+as\\s+\\w+|(\\w+))\\s+from\\s+['"](?:\\.\\.?\\/)+services\\/${serviceName}['"]`, 'g');
    
    // Replace with registry import
    updatedContent = updatedContent.replace(directImportRegex, (match, defaultImport) => {
      if (defaultImport) {
        return `import { get${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} } from '../services/registry';\n` +
               `import { initManager } from '../services/initManager'`;
      } else {
        return `import { SERVICE_NAMES, registry } from '../services/registry';\n` +
               `import { initManager } from '../services/initManager'`;
      }
    });
    
    // Match named imports from the service
    const namedImportRegex = new RegExp(`import\\s+{([^}]*)}\\s+from\\s+['"](?:\\.\\.?\\/)+services\\/${serviceName}['"]`, 'g');
    
    // Replace with registry import
    updatedContent = updatedContent.replace(namedImportRegex, (match, namedImports) => {
      return `import { SERVICE_NAMES, registry } from '../services/registry';\n` +
             `import { initManager } from '../services/initManager';\n` +
             `import { ${namedImports} } from '../services/${serviceName}'`;
    });
  }
  
  // Only write if changes were made
  if (updatedContent !== content) {
    fs.writeFileSync(filePath, updatedContent);
    console.log(`Updated imports in ${filePath}`);
  }
}

// Process all files in a directory recursively
function processDirectory(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    
    if (entry.isDirectory() && !EXCLUDE_DIRS.includes(entry.name)) {
      processDirectory(fullPath);
    } else if (
      entry.isFile() && 
      (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
      !entry.name.endsWith('.test.ts') &&
      !entry.name.endsWith('.d.ts')
    ) {
      rewriteImports(fullPath);
    }
  }
}

// Main function
function rewriteServiceImports() {
  processDirectory(SRC_DIR);
  console.log('Import rewriting complete');
}

rewriteServiceImports();
