import { coverageConfigDefaults, defineConfig } from 'vitest/config';

// The CI scripts (the coverage-path rebase, the demo version guard) had no
// project and no test target, so a regression in them only showed up as a
// wrong coverage number or a wrong version on the live demo.
export default defineConfig({
  test: {
    name: 'tools',
    globals: true,
    environment: 'node',
    include: ['**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    reporters: ['default'],
    pool: 'threads',
    coverage: {
      provider: 'v8',
      reporter: ['lcov'],
      reportsDirectory: '../coverage/tools',
      // Vitest 4 removed `coverage.all`: without an explicit `include`, a source
      // file no test imports is absent from the report rather than 0%.
      include: ['scripts/**/*.mjs', 'vite/**/*.ts'],
      exclude: [...coverageConfigDefaults.exclude, '**/*.d.ts'],
    },
  },
});
