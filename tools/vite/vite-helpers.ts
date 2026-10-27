import * as fs from 'fs';
import * as path from 'path';
import type { Alias, Plugin } from 'vite';

// Copies package files (package.json, README.md) from the project root into the
// build output after the bundle is written, which the removed @nx/vite:build
// executor and nxCopyAssetsPlugin used to do. The publish step picks a package
// up by the package.json in its dist folder, so a library build without it
// silently drops out of the release.
export function copyPackageFiles(
  projectRoot: string,
  outDir: string,
  files = ['package.json', 'README.md'],
): Plugin {
  return {
    name: 'copy-package-files',
    apply: 'build',
    closeBundle() {
      for (const file of files) {
        fs.copyFileSync(
          path.join(projectRoot, file),
          path.join(path.resolve(projectRoot, outDir), file),
        );
      }
    },
  };
}

// Turns the tsconfig.base.json paths into resolve.alias entries, so every vite
// project resolves the source-only @mintplayer/* workspace libs the same way.
// Nx 24 removed nxViteTsPaths, and vite's native resolve.tsconfigPaths fails on
// the platform libs' secondary entry points (e.g. twitch-player/api), which have
// no tsconfig of their own. resolve.alias is also the earliest resolution stage,
// ahead of @vitejs/plugin-react's enforce:'pre' plugins.
//
// Each key becomes an anchored regex, so '@mintplayer/x' never prefix-matches
// '@mintplayer/x/api' and the order of the paths does not matter.
export function workspaceAliases(): Alias[] {
  const workspaceRoot = path.join(__dirname, '../..');
  const tsconfigBase = JSON.parse(
    fs.readFileSync(path.join(workspaceRoot, 'tsconfig.base.json'), 'utf-8'),
  );
  const paths: Record<string, string[]> =
    tsconfigBase.compilerOptions?.paths ?? {};

  return Object.entries(paths).map(([key, [target]]) => {
    const escape = (s: string) => s.replace(/[.+?^${}()|[\]\\/]/g, '\\$&');
    const replacement = path.join(workspaceRoot, target).replace(/\\/g, '/');
    return key.endsWith('/*')
      ? {
          find: new RegExp(`^${escape(key.slice(0, -1))}(.+)$`),
          replacement: replacement.replace('*', '$1'),
        }
      : { find: new RegExp(`^${escape(key)}$`), replacement };
  });
}
