/// <reference types='vitest' />
import { defineConfig } from 'vite';
import {
  copyPackageFiles,
  workspaceAliases,
} from '../../../tools/vite/vite-helpers';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import * as path from 'path';

const outDir = '../../../dist/libs/frameworks/r-video-player';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/libs/frameworks/r-video-player',

  plugins: [
    react(),
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(__dirname, 'tsconfig.lib.json'),
    }),
    copyPackageFiles(__dirname, outDir),
  ],
  resolve: { alias: workspaceAliases() },

  // Configuration for building your library.
  // See: https://vitejs.dev/guide/build.html#library-mode
  build: {
    outDir,
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      // Could also be a dictionary or array of multiple entry points.
      entry: 'src/index.ts',
      name: 'mintplayer-r-video-player',
      fileName: 'index',
      // Change this to the formats you want to support.
      // Don't forget to update your package.json as well.
      formats: ['es', 'cjs'],
    },
    rolldownOptions: {
      // External packages that should not be bundled into your library.
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@vidyard/embed-code',
      ],
    },
  },

  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    passWithNoTests: true,
    reporters: ['default'],
    coverage: {
      // Mirrors the project path under the workspace coverage/ dir — that
      // mapping is what tools/scripts/rebase-lcov-paths.mjs roots the SF:
      // paths with, and what the workflow globs on.
      reportsDirectory: '../../../coverage/libs/frameworks/r-video-player',
      provider: 'v8' as const,
      reporter: ['lcovonly', 'text-summary'],
      enabled: true,
      // Explicit, so a source file that no spec imports is reported at 0%
      // rather than silently dropped from the denominator.
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.{spec,test}.{ts,tsx}'],
    },
  },
});
