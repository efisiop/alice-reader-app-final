import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import baseUrlPlugin from './vite-base-url-plugin'

// Use GitHub Pages base path in production, local path in development
const getBase = (mode: string) => {
  if (mode === 'production') {
    return '/alice-reader-app-final/' // Correct repository name for GitHub Pages
  }
  return '/'
}

// Log the base path for debugging
console.log(`Base path: ${getBase(process.env.NODE_ENV || 'development')}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`Current directory: ${__dirname}`);

export default defineConfig(({ mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), '');

  console.log(`Building for ${mode} environment`);

  return {
    plugins: [react(), baseUrlPlugin()],
    base: getBase(mode),
    define: {
      'import.meta.env.VITE_APP_ENV': JSON.stringify(env.VITE_APP_ENV || mode),
      'import.meta.env.VITE_BUILD_DATE': JSON.stringify(new Date().toISOString()),
      'import.meta.env.VITE_BETA_MODE': JSON.stringify(env.VITE_BETA_MODE === 'true'),
      'import.meta.env.VITE_BETA_VERSION': JSON.stringify(env.VITE_BETA_VERSION || '0.0.0'),
    },
    optimizeDeps: {
      include: ['notistack'],
      force: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      assetsDir: 'assets',
      emptyOutDir: true,
      commonjsOptions: {
        include: [/notistack/, /node_modules/],
      },
      rollupOptions: {
        ...(mode === 'production' ? {
          external: [
            './pages/TestPage',
            './pages/TestReaderPage',
            './pages/TestReaderInterfacePage',
            './pages/TestDirectReaderPage',
            './pages/TestLinks',
            './pages/HashTestLinks',
            './routes/TestRoutes',
          ],
        } : {}),
        output: {
          // Add hashes to filenames for cache busting
          entryFileNames: `assets/[name]-[hash].js`,
          chunkFileNames: `assets/[name]-[hash].js`,
          assetFileNames: `assets/[name]-[hash].[ext]`,
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom', 'notistack'],
            ui: ['@mui/material', '@mui/icons-material'],
            supabase: ['@supabase/supabase-js'],
          },
        },
      },
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
    server: {
      port: 5173,
      open: true,
    },

  }
})
