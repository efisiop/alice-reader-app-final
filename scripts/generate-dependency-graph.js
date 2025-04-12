// scripts/generate-dependency-graph.js
const fs = require('fs');
const path = require('path');

// Configuration
const SRC_DIR = path.resolve(__dirname, '../src');
const SERVICES_DIR = path.join(SRC_DIR, 'services');
const OUTPUT_FILE = path.join(__dirname, 'dependency-graph.json');

// Map of files to their dependencies
const dependencyMap = {};

// Process a file to find its dependencies
function processFile(filePath) {
  console.log(`Analyzing ${filePath}`);
  
  // Read file content
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find import statements using regex
  const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
  const dependencies = [];
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    
    // Convert relative imports to absolute
    if (importPath.startsWith('.')) {
      const dir = path.dirname(filePath);
      let absolutePath = path.resolve(dir, importPath);
      
      // Handle directory imports
      if (!absolutePath.endsWith('.ts') && !absolutePath.endsWith('.tsx')) {
        // Try with .ts extension
        if (fs.existsSync(`${absolutePath}.ts`)) {
          absolutePath = `${absolutePath}.ts`;
        } 
        // Try with .tsx extension
        else if (fs.existsSync(`${absolutePath}.tsx`)) {
          absolutePath = `${absolutePath}.tsx`;
        }
        // Try with /index.ts
        else if (fs.existsSync(path.join(absolutePath, 'index.ts'))) {
          absolutePath = path.join(absolutePath, 'index.ts');
        }
        // Try with /index.tsx
        else if (fs.existsSync(path.join(absolutePath, 'index.tsx'))) {
          absolutePath = path.join(absolutePath, 'index.tsx');
        }
      }
      
      // Only add if the file exists
      if (fs.existsSync(absolutePath)) {
        dependencies.push(absolutePath);
      }
    }
  }
  
  // Store dependencies
  dependencyMap[filePath] = dependencies;
}

// Process all service files
function processServices() {
  const serviceFiles = fs.readdirSync(SERVICES_DIR)
    .filter(file => file.endsWith('.ts') && !file.includes('.test.'))
    .map(file => path.join(SERVICES_DIR, file));
  
  for (const filePath of serviceFiles) {
    processFile(filePath);
  }
}

// Find clusters of interdependent services
function findClusters() {
  const visited = new Set();
  const clusters = {};
  let clusterIndex = 0;
  
  // DFS to find connected components
  function dfs(file, cluster) {
    visited.add(file);
    cluster.push(file);
    
    for (const dep of dependencyMap[file] || []) {
      if (!visited.has(dep) && dependencyMap[dep]) {
        dfs(dep, cluster);
      }
    }
  }
  
  // Process each file
  for (const file of Object.keys(dependencyMap)) {
    if (!visited.has(file)) {
      const cluster = [];
      dfs(file, cluster);
      if (cluster.length > 0) {
        clusters[`cluster${clusterIndex++}`] = cluster;
      }
    }
  }
  
  return clusters;
}

// Main function
function generateDependencyGraph() {
  processServices();
  const clusters = findClusters();
  
  // Output result
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
    dependencies: dependencyMap,
    clusters
  }, null, 2));
  
  console.log(`Dependency graph written to ${OUTPUT_FILE}`);
  console.log(`Found ${Object.keys(clusters).length} clusters`);
}

generateDependencyGraph();
