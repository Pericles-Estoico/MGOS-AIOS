/**
 * @file vitest.config.ts
 * @description Vitest configuration for MGOS-AIOS project
 * @docs https://vitest.dev/config/
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  test: {
    // ============================================================================
    // Environment
    // ============================================================================
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],

    // ============================================================================
    // Test Discovery
    // ============================================================================
    include: [
      '**/__tests__/**/*.test.ts',
      '**/__tests__/**/*.test.tsx',
      'app/api/__tests__/**/*.test.ts'
    ],
    exclude: ['node_modules', 'dist', '.next'],

    // ============================================================================
    // Performance
    // ============================================================================
    threads: true,
    isolate: true,
    maxThreads: 4,
    minThreads: 1,

    // ============================================================================
    // Output
    // ============================================================================
    reporters: ['default', 'html'],
    outputFile: {
      html: './coverage/test-results.html'
    },

    // ============================================================================
    // Coverage
    // ============================================================================
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'supabase/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/fixtures/*',
        '**/__mocks__/*',
        '**/.next/'
      ],
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
      all: true
    },

    // ============================================================================
    // Timeouts
    // ============================================================================
    testTimeout: 30000,
    hookTimeout: 30000,

    // ============================================================================
    // Mocking
    // ============================================================================
    mockReset: true,
    restoreMocks: true,
    clearMocks: true
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/components': path.resolve(__dirname, './app/components'),
      '@/api': path.resolve(__dirname, './app/api')
    }
  }
});
