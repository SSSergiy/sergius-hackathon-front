import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true, 
    environment: 'jsdom', 
    setupFiles: './src/setupTests.js', 
    css: {
      modules: {
        classNameStrategy: 'non-scoped', // Попробуй это
        generateScopedName: '[name]__[local]___[hash:base64:5]',
        moduleNameMapper: {
          '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
        },
      }
    }
  },
});