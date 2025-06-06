// scripts/pre-beta-check.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runPreBetaChecks() {
  console.log('Running pre-beta verification checks...');

  // Check 1: Verify all service files exist
  console.log('\nChecking service files...');
  const servicesDir = path.join(__dirname, '../src/services');
  const expectedServices = [
    'authService.ts',
    'bookService.ts',
    'aiService.ts',
    'feedbackService.ts',
    'triggerService.ts',
    'consultantService.ts',
    'statisticsService.ts',
    'dictionaryService.ts',
    'interactionService.ts',
    'monitoringService.ts',
    'databaseService.ts',
    'registry.ts',
    'initManager.ts',
    'dependencies.ts',
    'initServices.ts'
  ];

  let allFilesExist = true;
  for (const filename of expectedServices) {
    const filePath = path.join(servicesDir, filename);
    if (!fs.existsSync(filePath)) {
      console.error(`Missing service file: ${filename}`);
      allFilesExist = false;
    }
  }

  if (allFilesExist) {
    console.log('✅ All expected service files exist');
  } else {
    console.error('❌ Some service files are missing');
  }

  // Check 3: Verify beta environment configuration
  console.log('\nChecking environment configuration...');
  const envFilePath = path.join(__dirname, '../.env.beta');
  if (!fs.existsSync(envFilePath)) {
    console.error('❌ Missing .env.beta file');
  } else {
    console.log('✅ .env.beta file exists');

    // Check for required variables
    const envContent = fs.readFileSync(envFilePath, 'utf8');
    const requiredVars = [
      'VITE_APP_ENV',
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_BETA_MODE'
    ];

    const missingVars = requiredVars.filter(varName => !envContent.includes(varName));

    if (missingVars.length === 0) {
      console.log('✅ All required environment variables are defined');
    } else {
      console.error('❌ Missing environment variables:', missingVars);
    }
  }

  // Check 4: Verify beta scripts in package.json
  console.log('\nChecking package.json scripts...');
  const packageJsonPath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  const requiredScripts = [
    'beta:start',
    'beta:build',
    'beta:preview',
    'create-test-accounts',
    'pre-beta-check',
    'prepare-beta',
    'start:beta'
  ];

  const missingScripts = requiredScripts.filter(
    script => !packageJson.scripts || !packageJson.scripts[script]
  );

  if (missingScripts.length === 0) {
    console.log('✅ All required scripts are defined in package.json');
  } else {
    console.error('❌ Missing scripts in package.json:', missingScripts);
  }

  // Check 5: Verify components for beta testing
  console.log('\nChecking beta testing components...');
  const adminComponentsDir = path.join(__dirname, '../src/components/admin');

  if (!fs.existsSync(adminComponentsDir)) {
    console.error('❌ Missing admin components directory');
  } else {
    const serviceStatusCheckPath = path.join(adminComponentsDir, 'ServiceStatusCheck.tsx');

    if (!fs.existsSync(serviceStatusCheckPath)) {
      console.error('❌ Missing ServiceStatusCheck component');
    } else {
      console.log('✅ ServiceStatusCheck component exists');
    }
  }

  console.log('\nPre-beta verification completed');
}

runPreBetaChecks().catch(console.error);
