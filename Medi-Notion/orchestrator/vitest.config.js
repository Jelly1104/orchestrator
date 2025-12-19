import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.js', '**/*.spec.js'],
    exclude: ['node_modules', 'viewer/node_modules'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: [
        'agents/**/*.js',
        'skills/**/*.js',
        'orchestrator.js',
        'utils/**/*.js',
        'security/**/*.js'
      ],
      exclude: [
        '**/*.test.js',
        '**/*.spec.js',
        'viewer/**'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    testTimeout: 30000,
    hookTimeout: 10000
  }
});
