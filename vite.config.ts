import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    // T053: Optimize chunk splitting for better caching and performance
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom'],
          // Separate chunk for markdown editor (only loaded when needed)
          'markdown': ['./src/renderer/components/MarkdownEditor'],
          // AI Panel components
          'ai-panel': ['./src/renderer/components/AIPanel'],
        }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable minification and tree-shaking
    minify: 'esbuild',
    target: 'esnext'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@main': resolve(__dirname, 'src/main'),
      '@renderer': resolve(__dirname, 'src/renderer'),
      '@core': resolve(__dirname, 'src/core'),
      '@types': resolve(__dirname, 'src/types')
    }
  },
  server: {
    port: 5173
  },
  // T053: Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: []
  }
});
