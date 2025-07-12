#!/usr/bin/env node
// src/scripts/runTests.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define test types
const TEST_TYPES = {
  UNIT: 'unit',
  INTEGRATION: 'integration',
  E2E: 'e2e',
  ALL: 'all',
};

// Parse command line arguments
const args = process.argv.slice(2);
const testType = args[0] || TEST_TYPES.ALL;
const watch = args.includes('--watch');
const coverage = args.includes('--coverage');
const ci = args.includes('--ci');

// Validate test type
if (!Object.values(TEST_TYPES).includes(testType)) {
  console.error(`Invalid test type: ${testType}`);
  console.error(`Valid test types: ${Object.values(TEST_TYPES).join(', ')}`);
  process.exit(1);
}

// Set up environment
process.env.NODE_ENV = 'test';

// Load .env.test file
try {
  const envFile = fs.readFileSync(path.resolve(process.cwd(), '.env.test'), 'utf8');
  const envVars = envFile.split('\\n').filter(line => line.trim() && !line.startsWith('#'));
  
  for (const envVar of envVars) {
    const [key, value] = envVar.split('=');
    process.env[key] = value;
  }
} catch (error) {
  console.warn('Warning: .env.test file not found or could not be read');
}

// Build Jest command
function buildJestCommand(testType) {
  let command = 'jest';
  
  // Add test pattern based on test type
  switch (testType) {
    case TEST_TYPES.UNIT:
      command += ' --testMatch="**/__tests__/**/*.test.{ts,tsx}"';
      break;
    case TEST_TYPES.INTEGRATION:
      command += ' --testMatch="**/__tests__/**/*.integration.{ts,tsx}"';
      break;
    case TEST_TYPES.E2E:
      command += ' --testMatch="**/__tests__/**/*.e2e.{ts,tsx}"';
      break;
    case TEST_TYPES.ALL:
      // Default pattern includes all tests
      break;
  }
  
  // Add watch mode if specified
  if (watch) {
    command += ' --watch';
  }
  
  // Add coverage if specified
  if (coverage) {
    command += ' --coverage';
  }
  
  // Add CI mode if specified
  if (ci) {
    command += ' --ci';
  }
  
  return command;
}

// Run tests
try {
  console.log(`Running ${testType} tests...`);
  
  const command = buildJestCommand(testType);
  execSync(command, { stdio: 'inherit' });
  
  console.log(`${testType} tests completed successfully!`);
} catch (error) {
  console.error(`Error running ${testType} tests:`, error.message);
  process.exit(1);
}
