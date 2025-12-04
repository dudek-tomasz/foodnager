import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom for DOM testing as per guidelines
    environment: 'jsdom',
    
    // Global test setup
    globals: true,
    
    // Setup files to run before each test file
    setupFiles: ['./src/tests/setup.ts'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
    
    // Test include/exclude patterns
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'e2e'],
    
    // Test timeout
    testTimeout: 10000,
    
    // Separate threads for better performance
    threads: true,
    
    // Watch options
    watch: false,
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});

