/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { workspaceAliases } from '../../tools/vite/vite-helpers';
import { nxReadySignal } from '@nx/vite/plugins/nx-ready-signal.plugin';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/react-demo',

  resolve: { alias: workspaceAliases() },

  server: {
    port: 4200,
    host: 'localhost',
  },

  preview: {
    port: 4300,
    host: 'localhost',
  },

  plugins: [react(), nxReadySignal()],

  build: {
    outDir: '../../dist/apps/react-demo',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
