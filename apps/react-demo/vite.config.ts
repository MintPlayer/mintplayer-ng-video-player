/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import * as path from 'path';
import * as fs from 'fs';

// The r-video-player wrapper is bundled from source, so vite has to resolve the
// @mintplayer/* platform plugins it imports transitively. @vitejs/plugin-react
// ships enforce:'pre' plugins and escalates rollup's UNRESOLVED_IMPORT warning
// to a fatal error, which trips over nxViteTsPaths' resolution for these
// source-only workspace libs. Pinning the tsconfig.base.json paths as
// resolve.alias (the earliest resolution stage) makes them resolve reliably.
const tsconfigBase = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../tsconfig.base.json'), 'utf-8')
);
const workspaceRoot = path.join(__dirname, '../..');
const alias = Object.entries<string[]>(
  tsconfigBase.compilerOptions?.paths ?? {}
)
  .filter(([key]) => !key.endsWith('/*'))
  .map(([find, targets]) => ({
    find,
    replacement: path.join(workspaceRoot, targets[0]),
  }));

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/react-demo',

  resolve: { alias },

  server: {
    port: 4200,
    host: 'localhost',
  },

  preview: {
    port: 4300,
    host: 'localhost',
  },

  plugins: [react(), nxViteTsPaths()],

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },

  build: {
    outDir: '../../dist/apps/react-demo',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
