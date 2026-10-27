/**
 * The vite helpers that replaced Nx's removed nxViteTsPaths / nxCopyAssetsPlugin.
 * workspaceAliases() is specced against the real tsconfig.base.json, because
 * the property that matters is how ITS keys resolve: an exact package key must
 * not swallow its own secondary entry points.
 */
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { Plugin } from 'vite';
import { describe, expect, it } from 'vitest';

import { copyPackageFiles, workspaceAliases } from './vite-helpers';

const workspaceRoot = resolve(__dirname, '../..').replace(/\\/g, '/');

/** Resolves an import the way vite's alias stage does: the first matching entry wins. */
function resolveImport(id: string): string | undefined {
  for (const { find, replacement } of workspaceAliases()) {
    if (find instanceof RegExp && find.test(id))
      return id.replace(find, replacement);
  }
  return undefined;
}

describe('workspaceAliases', () => {
  it('maps a package key to its entry point', () => {
    expect(resolveImport('@mintplayer/player-provider')).toBe(
      `${workspaceRoot}/libs/player-provider/src/index.ts`,
    );
  });

  it('maps a secondary entry point through the wildcard key, not the bare package key', () => {
    expect(resolveImport('@mintplayer/twitch-player/api')).toBe(
      `${workspaceRoot}/libs/platforms/twitch-player/api/index.ts`,
    );
  });

  it('maps package.json keys to the source package.json the demos show', () => {
    expect(resolveImport('@mintplayer/r-video-player/package.json')).toBe(
      `${workspaceRoot}/libs/frameworks/r-video-player/package.json`,
    );
  });

  it('leaves imports outside the workspace paths alone', () => {
    expect(resolveImport('@mintplayer/ng-bootstrap')).toBeUndefined();
    expect(resolveImport('@mintplayer/player-provider-extra')).toBeUndefined();
  });

  it('anchors every key, so no entry prefix-matches another package', () => {
    for (const { find } of workspaceAliases()) {
      expect(find).toBeInstanceOf(RegExp);
      expect(String(find)).toMatch(/^\/\^.*\$\/$/);
    }
  });
});

describe('copyPackageFiles', () => {
  it('copies the named files from the project root into the output directory', () => {
    const projectRoot = mkdtempSync(join(tmpdir(), 'vite-helpers-'));
    writeFileSync(join(projectRoot, 'package.json'), '{"name":"x"}');
    writeFileSync(join(projectRoot, 'README.md'), '# x');
    mkdirSync(join(projectRoot, 'out'));

    const plugin = copyPackageFiles(projectRoot, 'out') as Plugin & {
      closeBundle: () => void;
    };
    expect(plugin.apply).toBe('build');
    plugin.closeBundle();

    expect(readFileSync(join(projectRoot, 'out/package.json'), 'utf8')).toBe(
      '{"name":"x"}',
    );
    expect(readFileSync(join(projectRoot, 'out/README.md'), 'utf8')).toBe(
      '# x',
    );
  });

  it('fails loudly when a file is missing, rather than shipping a package without it', () => {
    const projectRoot = mkdtempSync(join(tmpdir(), 'vite-helpers-'));
    mkdirSync(join(projectRoot, 'out'));

    const plugin = copyPackageFiles(projectRoot, 'out', [
      'package.json',
    ]) as Plugin & { closeBundle: () => void };
    expect(() => plugin.closeBundle()).toThrow(/ENOENT/);
  });
});
