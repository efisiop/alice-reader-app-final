import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Use GitHub Pages base path in production, local path in development
const getBase = (mode: string) => {
  if (mode === 'production') {
    return '/alice-reader/' // Replace with your repository name
  }
  return '/'
}

export default defineConfig(({ mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), '');

  console.log(`Building for ${mode} environment with simplified config`);

  return {
    plugins: [react()],
    base: getBase(mode),
    define: {
      'import.meta.env.VITE_APP_ENV': JSON.stringify('production'),
      'import.meta.env.VITE_BUILD_DATE': JSON.stringify(new Date().toISOString()),
      'import.meta.env.VITE_BETA_MODE': JSON.stringify(false),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@services': path.resolve(__dirname, './src/services'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@types': path.resolve(__dirname, './src/types'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@data': path.resolve(__dirname, './src/data'),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        // Explicitly exclude Beta components
        external: [
          /src\/components\/Beta\/.*/,
          /src\/pages\/Beta\/.*/,
        ],
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['@mui/material', '@mui/icons-material'],
            supabase: ['@supabase/supabase-js'],
          },
        },
      },
      // Generate 404.html for GitHub Pages SPA support
      assetsDir: 'assets',
      emptyOutDir: true,
    },
  }
})
