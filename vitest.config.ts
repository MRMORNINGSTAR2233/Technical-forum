import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { config } from 'dotenv';

// Load .env file into process.env BEFORE any tests run
config();

export default defineConfig({
  plugins: [react()],
  test: {
    // Use node environment by default for database tests
    // Override with @vitest-environment jsdom for UI tests
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // Run tests sequentially to avoid database conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Run test files sequentially
    fileParallelism: false,
    // Increase timeout for property-based tests
    testTimeout: 30000,
    // Environment by file pattern
    environmentMatchGlobs: [
      // UI tests need jsdom
      ['**/*-ui.test.{ts,tsx}', 'jsdom'],
      ['**/layout.test.{ts,tsx}', 'jsdom'],
      ['**/editor.test.{ts,tsx}', 'jsdom'],
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
