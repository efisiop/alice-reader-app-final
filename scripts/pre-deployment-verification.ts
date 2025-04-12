#!/usr/bin/env ts-node
/**
 * Pre-Deployment Verification Script
 * 
 * This script runs a series of checks to ensure the application is ready for deployment.
 * It checks dependencies, builds, linting, type checking, bundle size, and security.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔍 Starting Pre-Deployment Verification');

const CHECKS = {
  DEPENDENCIES: '📦 Checking dependencies',
  BUILD: '🏗️  Testing build process',
  LINT: '🧹 Running linter checks',
  TYPE_CHECK: '✓ Running TypeScript checks',
  BUNDLE_SIZE: '📏 Analyzing bundle size',
  PERFORMANCE: '⚡ Running performance checks',
  ACCESSIBILITY: '♿ Running accessibility checks',
  SECURITY: '🔒 Running security audit'
};

let hasErrors = false;

// Check dependencies
console.log('\n' + CHECKS.DEPENDENCIES);
try {
  console.log('Checking for outdated packages...');
  const outdated = execSync('npm outdated --json', { encoding: 'utf8' });
  
  if (outdated && outdated.length > 2) { // Check if it's more than just "{}"
    const outdatedJson = JSON.parse(outdated);
    const packages = Object.keys(outdatedJson);
    
    console.log(`Found ${packages.length} outdated packages:`);
    packages.forEach(pkg => {
      const info = outdatedJson[pkg];
      console.log(`  - ${pkg}: ${info.current} → ${info.latest}`);
    });
  } else {
    console.log('All packages are up to date.');
  }
  
  console.log('Checking for duplicate packages...');
  execSync('npm dedupe', { stdio: 'inherit' });
  console.log('Dedupe completed.');
} catch (error) {
  console.error('Error checking dependencies:', error);
  hasErrors = true;
}

// Test build process
console.log('\n' + CHECKS.BUILD);
try {
  console.log('Running test build...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Build successful.');
  
  // Check if index.html exists in build directory
  const buildDir = path.resolve(__dirname, '../dist');
  if (fs.existsSync(path.join(buildDir, 'index.html'))) {
    console.log('Build output verified.');
  } else {
    console.error('Build output missing index.html.');
    hasErrors = true;
  }
} catch (error) {
  console.error('Build failed:', error);
  hasErrors = true;
}

// Run linter
console.log('\n' + CHECKS.LINT);
try {
  console.log('Running ESLint...');
  execSync('npm run lint', { stdio: 'inherit' });
  console.log('Linting passed.');
} catch (error) {
  console.error('Linting failed:', error);
  hasErrors = true;
}

// Run TypeScript checks
console.log('\n' + CHECKS.TYPE_CHECK);
try {
  console.log('Running TypeScript checks...');
  execSync('npm run type-check', { stdio: 'inherit' });
  console.log('TypeScript checks passed.');
} catch (error) {
  console.error('TypeScript checks failed:', error);
  hasErrors = true;
}

// Analyze bundle size
console.log('\n' + CHECKS.BUNDLE_SIZE);
try {
  console.log('Analyzing bundle size...');
  // This would typically use a tool like webpack-bundle-analyzer
  // For example purposes, we'll just check the build directory size
  const buildDir = path.resolve(__dirname, '../dist');
  let totalSize = 0;
  
  const calculateDirSize = (dirPath: string) => {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        calculateDirSize(filePath);
      } else {
        totalSize += stat.size;
      }
    }
  };
  
  if (fs.existsSync(buildDir)) {
    calculateDirSize(buildDir);
    const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
    console.log(`Total bundle size: ${sizeInMB} MB`);
    
    if (parseFloat(sizeInMB) > 10) {
      console.warn('Warning: Bundle size exceeds 10MB. Consider optimization.');
    } else {
      console.log('Bundle size is acceptable.');
    }
  } else {
    console.error('Build directory not found.');
    hasErrors = true;
  }
} catch (error) {
  console.error('Error analyzing bundle size:', error);
  hasErrors = true;
}

// Run security audit
console.log('\n' + CHECKS.SECURITY);
try {
  console.log('Running npm audit...');
  execSync('npm audit --json > audit-results.json', { stdio: 'inherit' });
  
  const auditResults = JSON.parse(fs.readFileSync('audit-results.json', 'utf8'));
  
  if (auditResults.metadata.vulnerabilities.high > 0 || auditResults.metadata.vulnerabilities.critical > 0) {
    console.error(`Security vulnerabilities found: ${auditResults.metadata.vulnerabilities.high} high, ${auditResults.metadata.vulnerabilities.critical} critical`);
    console.error('Please run npm audit fix or address these issues before deployment.');
    hasErrors = true;
  } else {
    console.log('No high or critical security vulnerabilities found.');
  }
  
  // Clean up
  fs.unlinkSync('audit-results.json');
} catch (error) {
  console.error('Error running security audit:', error);
  hasErrors = true;
}

// Conclusion
console.log('\n🏁 Pre-Deployment Verification Complete');

if (hasErrors) {
  console.error('❌ Some checks failed. Please address the issues before deployment.');
  process.exit(1);
} else {
  console.log('✅ All checks passed. The application is ready for deployment.');
}
