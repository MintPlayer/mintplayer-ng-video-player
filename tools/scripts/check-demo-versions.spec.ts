/**
 * The CI guard for docs/prd/release-pipeline-alignment.md F6, driven against temp trees.
 *
 * It must FAIL in three ways, each a different way the deployed navbar ends up wrong:
 *   - the library package.json is still unstamped (the plan step did not run, or ran too late);
 *   - a bundle dir is missing (a moved build output would otherwise be a silent pass);
 *   - a bundle lacks the stamped version (the demo was built before the stamp, or restored from cache).
 * And it must PASS when the placeholder string appears next to the real version, because
 * @angular/core ships that literal itself.
 */
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';

import { DEMOS, PLACEHOLDER, holdsVersion, main, problemsOf, scriptFiles } from './check-demo-versions.mjs';

const roots: string[] = [];
function tree(files: Record<string, string>): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'mp-demo-versions-')));
  roots.push(root);
  Object.entries(files).map(([rel, content]) => {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), content, 'utf8');
  });
  return root;
}
afterAll(() => roots.map((root) => rmSync(root, { recursive: true, force: true })));

const DEMO = { name: 'demo', packageJson: 'libs/lib/package.json', bundles: ['dist/demo/browser', 'dist/demo/server'] };
const pkg = (version: string) => JSON.stringify({ name: '@mintplayer/lib', version });

describe('holdsVersion', () => {
  it('finds the version as a string literal in any quote style', () => {
    expect(holdsVersion('const v={version:"22.28.0"}', '22.28.0')).toBe(true);
    expect(holdsVersion("x='22.28.0'", '22.28.0')).toBe(true);
    expect(holdsVersion('x=`22.28.0`', '22.28.0')).toBe(true);
  });

  it('does not match a longer version that merely contains it', () => {
    expect(holdsVersion('"22.28.01"', '22.28.0')).toBe(false);
    expect(holdsVersion('"122.28.0"', '22.28.0')).toBe(false);
  });
});

describe('scriptFiles', () => {
  it('lists .js and .mjs files recursively and nothing else', () => {
    const root = tree({ 'a.js': '', 'sub/b.mjs': '', 'sub/c.css': '', 'index.html': '' });
    expect(scriptFiles(root).map((file) => file.slice(root.length + 1).replaceAll('\\', '/')).sort()).toEqual(['a.js', 'sub/b.mjs']);
  });
});

describe('problemsOf', () => {
  it('passes when the client and the server bundle both carry the stamped version', () => {
    const root = tree({
      'libs/lib/package.json': pkg('22.28.0'),
      'dist/demo/browser/assets/main-abc.js': 'var p={version:"22.28.0"};',
      'dist/demo/server/main.server.mjs': 'export const v="22.28.0";',
    });
    expect(problemsOf(DEMO, root)).toEqual([]);
  });

  it('passes even when @angular/core-style code holds the placeholder literal beside the real version', () => {
    const root = tree({
      'libs/lib/package.json': pkg('22.28.0'),
      'dist/demo/browser/main.js': `e==="${PLACEHOLDER}"?"next":"v";var p={version:"22.28.0"};`,
      'dist/demo/server/chunk.mjs': `e==="${PLACEHOLDER}";export const v="22.28.0";`,
    });
    expect(problemsOf(DEMO, root)).toEqual([]);
  });

  it('fails an unstamped package.json without looking at the bundles', () => {
    const root = tree({ 'libs/lib/package.json': pkg(PLACEHOLDER) });
    expect(problemsOf(DEMO, root)).toEqual([`libs/lib/package.json still holds ${PLACEHOLDER}: the versioning plan did not stamp it`]);
  });

  it('fails a bundle dir that does not exist', () => {
    const root = tree({ 'libs/lib/package.json': pkg('22.28.0'), 'dist/demo/browser/main.js': '"22.28.0"' });
    expect(problemsOf(DEMO, root)).toEqual(['dist/demo/server does not exist; build demo first']);
  });

  it('fails a bundle built before the stamp', () => {
    const root = tree({
      'libs/lib/package.json': pkg('22.29.0'),
      'dist/demo/browser/main.js': 'var p={version:"22.28.0"};',
      'dist/demo/server/main.mjs': 'export const v="22.29.0";',
    });
    expect(problemsOf(DEMO, root)).toEqual(['no script under dist/demo/browser contains the version 22.29.0']);
  });
});

describe('main', () => {
  it('returns 0 and logs each demo when all carry their version', () => {
    const root = tree({
      'libs/lib/package.json': pkg('1.2.3'),
      'dist/demo/browser/main.js': '"1.2.3"',
      'dist/demo/server/main.mjs': '"1.2.3"',
    });
    const log = vi.fn();
    const error = vi.fn();
    expect(main({ repoRoot: root, demos: [DEMO], log, error })).toBe(0);
    expect(log).toHaveBeenCalledWith('check-demo-versions: OK  demo');
    expect(error).not.toHaveBeenCalled();
  });

  it('returns 1 and names every failing demo', () => {
    const root = tree({ 'libs/lib/package.json': pkg(PLACEHOLDER) });
    const error = vi.fn();
    expect(main({ repoRoot: root, demos: [DEMO, { ...DEMO, name: 'other' }], log: vi.fn(), error })).toBe(1);
    expect(error.mock.calls[0][0]).toContain('demo: libs/lib/package.json still holds');
    expect(error.mock.calls[0][0]).toContain('other: libs/lib/package.json still holds');
  });

  it('covers the three demos, each with its one client bundle', () => {
    expect(DEMOS.map((demo) => [demo.name, demo.bundles.length])).toEqual([
      ['angular-demo', 1],
      ['react-demo', 1],
      ['vue-demo', 1],
    ]);
  });
});
