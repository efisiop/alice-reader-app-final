// Simple script to test TypeScript compilation
import { execSync } from 'child_process';
import fs from 'fs';

console.log('Running TypeScript compilation check...');
try {
  execSync('tsc --noEmit', { stdio: 'inherit' });
  console.log('TypeScript compilation successful!');
} catch (error) {
  console.error('TypeScript compilation failed!');
  process.exit(1);
}

console.log('Checking for circular dependencies...');
try {
  // Create a simple Vite config for dependency analysis
  fs.writeFileSync('vite.analyze.config.js', `
    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';

    export default defineConfig({
      plugins: [react()],
      build: {
        rollupOptions: {
          onwarn(warning, warn) {
            // Log circular dependency warnings
            if (warning.code === 'CIRCULAR_DEPENDENCY') {
              console.log('Circular dependency found:', warning.message);
            }
            warn(warning);
          }
        }
      }
    });
  `);

  execSync('vite build --config vite.analyze.config.js --mode production', { stdio: 'inherit' });
  console.log('Build analysis completed!');
} catch (error) {
  console.error('Build analysis failed!');
  process.exit(1);
}
