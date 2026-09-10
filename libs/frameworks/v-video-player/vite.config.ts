/// <reference types='vitest' />
import type { UserConfigFn } from 'vite';
import * as path from 'path';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

const config: UserConfigFn = async () => {
  const { default: vue } = await import('@vitejs/plugin-vue');
  const { default: dts } = await import('vite-plugin-dts');

  return {
    root: __dirname,
    cacheDir: '../../node_modules/.vite/libs/frameworks/v-video-player',
    plugins: [
      vue(),
      nxViteTsPaths(),
      nxCopyAssetsPlugin(['*.md']),
      dts({
        entryRoot: 'src',
        tsconfigPath: path.join(__dirname, 'tsconfig.lib.json'),
      }),
    ],
    // Uncomment this if you are using workers.
    // worker: {
    //  plugins: [ nxViteTsPaths() ],
    // },
    // Configuration for building your library.
    // See: https://vitejs.dev/guide/build.html#library-mode
    build: {
      outDir: '../../dist/libs/frameworks/v-video-player',
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      lib: {
        // Could also be a dictionary or array of multiple entry points.
        entry: 'src/index.ts',
        name: 'mintplayer-v-video-player',
        fileName: 'index',
        // Change this to the formats you want to support.
        // Don't forget to update your package.json as well.
        formats: ['es', 'cjs'],
      },
      rollupOptions: {
        // External packages that should not be bundled into your library.
        external: ['vue'],
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
        // Three levels up, not two: `root` is this project's own directory, so
        // '../../' landed the report in libs/coverage/ where nothing collected
        // it. The path has to mirror the project path under the workspace
        // coverage/ dir — that mapping is what tools/scripts/rebase-lcov-paths.mjs
        // uses to root the SF: paths, and what the workflow globs on.
        reportsDirectory: '../../../coverage/libs/frameworks/v-video-player',
        provider: 'v8' as const,
        reporter: ['lcovonly', 'text-summary'],
        // Always on. The report is a CI artefact, not an opt-in.
        enabled: true,
        // Explicit, so a source file that no spec imports is reported at 0%
        // rather than silently dropped from the denominator.
        all: true,
        include: ['src/**/*.{ts,vue}'],
        exclude: ['src/**/*.{spec,test}.ts'],
      },
    },
  };
};

export default config;
