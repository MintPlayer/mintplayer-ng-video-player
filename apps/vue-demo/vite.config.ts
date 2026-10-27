/// <reference types='vitest' />
import type { UserConfigFn } from 'vite';
import { workspaceAliases } from '../../tools/vite/vite-helpers';
import { nxReadySignal } from '@nx/vite/plugins/nx-ready-signal.plugin';

const config: UserConfigFn = async () => {
  const { default: vue } = await import('@vitejs/plugin-vue');

  return {
    root: __dirname,
    cacheDir: '../../node_modules/.vite/apps/vue-demo',
    server: {
      port: 4200,
      host: 'localhost',
    },
    preview: {
      port: 4301,
      host: 'localhost',
    },
    // github.svg and friends live in public/, so absolute URLs must stay URLs
    // rather than become module imports (which vitest cannot resolve).
    plugins: [
      vue({ template: { transformAssetUrls: { includeAbsolute: false } } }),
      nxReadySignal(),
    ],
    resolve: { alias: workspaceAliases() },
    build: {
      outDir: '../../dist/apps/vue-demo',
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
    test: {
      watch: false,
      globals: true,
      environment: 'jsdom',
      include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      reporters: ['default'],
      coverage: {
        // Two levels up, not one: `root` is this project's own directory, so
        // '../' landed the report in apps/coverage/ where nothing collected it.
        reportsDirectory: '../../coverage/apps/vue-demo',
        provider: 'v8' as const,
        reporter: ['lcovonly', 'text-summary'],
        enabled: true,
      },
    },
  };
};

export default config;
