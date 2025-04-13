
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
  