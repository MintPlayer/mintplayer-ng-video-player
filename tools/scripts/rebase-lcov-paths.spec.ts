/**
 * The lcov SF: rebasing rules — the transform every coverage number this
 * workspace publishes now passes through. A silent regression here
 * re-introduces the 314-dropped-files defect the script's own header
 * documents, so the load-bearing properties (idempotence, separator
 * normalisation, the hard failure on unresolvable paths) are each pinned.
 *
 * The module is side-effect-free on import (CLI work sits behind an
 * isEntryPoint guard); `exists` is injected so no case touches the real tree
 * or depends on the cwd vitest happens to run from.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';

import {
  findReports,
  formatCoverageSummary,
  main,
  prefixFor,
  rebaseLcov,
  summarizeLcov,
} from './rebase-lcov-paths.mjs';

// ===========================================================================
// prefixFor: coverage/<project path>/lcov.info -> <project path>, posix
// ===========================================================================

describe('prefixFor', () => {
  it('derives the project path from the report location', () => {
    expect(prefixFor(join('coverage', 'libs', 'foo', 'lcov.info'), 'coverage')).toBe('libs/foo');
  });

  it('keeps deeper nesting intact', () => {
    expect(prefixFor(join('coverage', 'apps', 'demo', 'e2e', 'lcov.info'), 'coverage')).toBe(
      'apps/demo/e2e',
    );
  });

  it('accepts posix-separated input even where the native separator differs', () => {
    // The guarantee that motivated splitting on /[\\/]/: a posix-path caller
    // works on Windows too. The reverse fixture (a backslash literal) is NOT
    // asserted — on posix a backslash is a legal filename character, not a
    // separator, so that input has no portable meaning. The native-separator
    // case is already covered by the join()-built fixtures above, which use
    // backslashes when the suite runs on Windows.
    expect(prefixFor('coverage/libs/foo/lcov.info', 'coverage')).toBe('libs/foo');
  });

  it('drops the shard folder a sharded test job parks its report in', () => {
    expect(
      prefixFor(join('coverage', 'libs', 'foo', 'shard-2-of-3', 'lcov.info'), 'coverage'),
    ).toBe('libs/foo');
  });

  it('keeps a project folder that merely starts with "shard"', () => {
    expect(prefixFor(join('coverage', 'libs', 'shard-utils', 'lcov.info'), 'coverage')).toBe(
      'libs/shard-utils',
    );
  });

  it('returns an empty prefix for a report sitting directly in the coverage dir', () => {
    // The CLI refuses to rewrite in that case — there is no project to
    // attribute the paths to.
    expect(prefixFor(join('coverage', 'lcov.info'), 'coverage')).toBe('');
  });
});

// ===========================================================================
// rebaseLcov: the pure transform
// ===========================================================================

const always = () => true;
const never = () => false;

describe('rebaseLcov', () => {
  it('prefixes every SF: line and counts the rewrites', () => {
    const input = ['TN:', 'SF:src/a.ts', 'DA:1,1', 'end_of_record', 'SF:src/b.ts', 'end_of_record', ''].join('\n');
    const result = rebaseLcov(input, 'libs/foo', always);

    expect(result.text).toBe(
      ['TN:', 'SF:libs/foo/src/a.ts', 'DA:1,1', 'end_of_record', 'SF:libs/foo/src/b.ts', 'end_of_record', ''].join('\n'),
    );
    expect(result.rewritten).toBe(2);
    expect(result.alreadyRooted).toBe(0);
    expect(result.unresolved).toEqual([]);
  });

  it('leaves non-SF lines byte-identical, including end_of_record', () => {
    const input = 'TN:\nDA:12,0\nBRDA:3,0,0,1\nend_of_record\n';
    expect(rebaseLcov(input, 'libs/foo', always).text).toBe(input);
  });

  it('is idempotent: a second run only counts already-rooted, changes nothing', () => {
    const once = rebaseLcov('SF:src/a.ts\nend_of_record\n', 'libs/foo', always);
    const twice = rebaseLcov(once.text, 'libs/foo', always);

    expect(twice.text).toBe(once.text);
    expect(twice.rewritten).toBe(0);
    expect(twice.alreadyRooted).toBe(1);
  });

  it('handles a mixed report: rooted paths kept, bare paths prefixed', () => {
    const input = 'SF:libs/foo/src/a.ts\nend_of_record\nSF:src/b.ts\nend_of_record\n';
    const result = rebaseLcov(input, 'libs/foo', always);

    expect(result.alreadyRooted).toBe(1);
    expect(result.rewritten).toBe(1);
    expect(result.text).toContain('SF:libs/foo/src/b.ts');
  });

  it('normalises backslash-separated SF paths to posix', () => {
    const result = rebaseLcov('SF:src\\lib\\a.ts\nend_of_record\n', 'libs/foo', always);
    expect(result.text).toContain('SF:libs/foo/src/lib/a.ts');
  });

  it('does not treat a shared name prefix as rooted', () => {
    // `libs/foo-bar/...` must NOT count as already rooted under `libs/foo` —
    // the guard is on the full segment (`libs/foo/`), not a string prefix.
    const result = rebaseLcov('SF:libs/foo-bar/src/a.ts\nend_of_record\n', 'libs/foo', always);
    expect(result.rewritten).toBe(1);
    expect(result.text).toContain('SF:libs/foo/libs/foo-bar/src/a.ts');
  });

  it('reads CRLF input and always writes LF', () => {
    const result = rebaseLcov('SF:src/a.ts\r\nDA:1,1\r\nend_of_record\r\n', 'libs/foo', always);
    expect(result.text).toBe('SF:libs/foo/src/a.ts\nDA:1,1\nend_of_record\n');
  });

  it('preserves a trailing newline', () => {
    expect(rebaseLcov('end_of_record\n', 'libs/foo', always).text).toBe('end_of_record\n');
  });

  it('collects every rewritten path that does not resolve on disk', () => {
    const result = rebaseLcov('SF:src/a.ts\nSF:src/b.ts\n', 'libs/foo', never);
    expect(result.unresolved).toEqual([
      { raw: 'src/a.ts', rooted: 'libs/foo/src/a.ts' },
      { raw: 'src/b.ts', rooted: 'libs/foo/src/b.ts' },
    ]);
    // Unresolved paths are still rewritten — the CLI fails the build on them,
    // it does not half-apply the transform.
    expect(result.rewritten).toBe(2);
  });

  it('checks existence of the ROOTED path, never the raw one', () => {
    const asked: string[] = [];
    rebaseLcov('SF:src/a.ts\n', 'libs/foo', (p: string) => {
      asked.push(p);
      return true;
    });
    expect(asked).toEqual(['libs/foo/src/a.ts']);
  });

  it('does not consult exists for already-rooted paths', () => {
    const asked: string[] = [];
    rebaseLcov('SF:libs/foo/src/a.ts\n', 'libs/foo', (p: string) => {
      asked.push(p);
      return true;
    });
    expect(asked).toEqual([]);
  });
});

// ===========================================================================
// findReports: real fs against a temp tree
// ===========================================================================

describe('findReports', () => {
  const root = mkdtempSync(join(tmpdir(), 'rebase-lcov-spec-'));
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it('finds every lcov.info at any depth and nothing else', () => {
    mkdirSync(join(root, 'libs', 'foo'), { recursive: true });
    mkdirSync(join(root, 'apps', 'demo', 'nested'), { recursive: true });
    writeFileSync(join(root, 'libs', 'foo', 'lcov.info'), '');
    writeFileSync(join(root, 'apps', 'demo', 'nested', 'lcov.info'), '');
    writeFileSync(join(root, 'libs', 'foo', 'coverage-final.json'), '{}');
    writeFileSync(join(root, 'notes.txt'), '');

    // Assert on membership, not order: readdir order is platform-dependent.
    const found = findReports(root).sort();
    expect(found).toEqual(
      [join(root, 'apps', 'demo', 'nested', 'lcov.info'), join(root, 'libs', 'foo', 'lcov.info')].sort(),
    );
  });

  it('returns [] for a missing directory instead of throwing', () => {
    expect(findReports(join(root, 'does-not-exist'))).toEqual([]);
  });
});

// ===========================================================================
// The coverage summary (M30). Every lcov already carried these totals and
// nothing had ever added them up, which is how workspace branch coverage
// drifted 8.5 points under its own documented target unnoticed.
// ===========================================================================

describe('summarizeLcov', () => {
  const report = [
    'TN:',
    'SF:src/a.ts',
    'DA:1,1',
    'BRF:4',
    'BRH:3',
    'LF:10',
    'LH:8',
    'end_of_record',
    'SF:src/b.ts',
    'BRF:2',
    'BRH:0',
    'LF:5',
    'LH:1',
    'end_of_record',
    '',
  ].join('\n');

  it('adds the line totals across every record', () => {
    expect(summarizeLcov(report).lines).toEqual({ covered: 9, total: 15 });
  });

  it('adds the branch totals across every record', () => {
    expect(summarizeLcov(report).branches).toEqual({ covered: 3, total: 6 });
  });

  it('counts the files', () => {
    expect(summarizeLcov(report).files).toBe(2);
  });

  it('reads CRLF reports as readily as LF ones', () => {
    expect(summarizeLcov(report.split('\n').join('\r\n')).lines).toEqual({ covered: 9, total: 15 });
  });

  it('does not mistake DA: line hits for LH:', () => {
    // A naive substring match would pick up DA:, BRDA: and FNF: too.
    const noisy = 'SF:a.ts\nDA:1,99\nBRDA:1,0,0,7\nFNF:3\nFNH:2\nLF:4\nLH:2\nend_of_record\n';
    expect(summarizeLcov(noisy).lines).toEqual({ covered: 2, total: 4 });
  });

  it('reports zeros for a report with no records', () => {
    expect(summarizeLcov('')).toEqual({
      files: 0,
      lines: { covered: 0, total: 0 },
      branches: { covered: 0, total: 0 },
    });
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
  ])('tolerates %s rather than throwing', (_label, input) => {
    expect(summarizeLcov(input as never).files).toBe(0);
  });

  it('handles a project with lines but no branches at all', () => {
    const flat = 'SF:a.ts\nLF:3\nLH:3\nend_of_record\n';
    expect(summarizeLcov(flat).branches).toEqual({ covered: 0, total: 0 });
  });
});

describe('formatCoverageSummary', () => {
  const entry = (name: string, lines: [number, number], branches: [number, number]) => ({
    name,
    summary: {
      files: 1,
      lines: { covered: lines[0], total: lines[1] },
      branches: { covered: branches[0], total: branches[1] },
    },
  });

  it('shows each project as covered/total with a percentage', () => {
    const out = formatCoverageSummary([entry('tools', [432, 753], [239, 397])]);
    expect(out).toContain('432/753 (57.37%)');
    expect(out).toContain('239/397 (60.20%)');
  });

  it('adds a TOTAL row across every project', () => {
    const out = formatCoverageSummary([
      entry('a', [1, 2], [1, 4]),
      entry('b', [3, 8], [1, 6]),
    ]);
    const total = out.split('\n').find((l) => l.includes('TOTAL'));
    expect(total).toContain('4/10 (40.00%)');
    expect(total).toContain('2/10 (20.00%)');
  });

  it('reports branches separately from lines, which is the whole point', () => {
    // D8: branch coverage is the review metric. A project can look healthy on
    // lines and be far behind on branches — that must be visible at a glance.
    const out = formatCoverageSummary([entry('x', [100, 100], [1, 100])]);
    expect(out).toContain('100/100 (100.00%)');
    expect(out).toContain('1/100 (1.00%)');
  });

  it('shows a dash rather than dividing by zero for an empty measure', () => {
    expect(formatCoverageSummary([entry('x', [0, 0], [0, 0])])).toContain('—');
  });

  it('aligns the project column to the longest name', () => {
    const out = formatCoverageSummary([
      entry('a', [1, 1], [1, 1]),
      entry('libs/mintplayer-web-components', [1, 1], [1, 1]),
    ]);
    const [, first, second] = out.split('\n');
    expect(first.indexOf('1/1')).toBe(second.indexOf('1/1'));
  });

  it('emits a header row plus one row per project plus the total', () => {
    const out = formatCoverageSummary([entry('a', [1, 1], [1, 1]), entry('b', [1, 1], [1, 1])]);
    expect(out.split('\n')).toHaveLength(4);
  });

  it('produces a header and a TOTAL even with no projects', () => {
    const out = formatCoverageSummary([]);
    expect(out.split('\n')).toHaveLength(2);
    expect(out).toContain('TOTAL');
  });
});

// ===========================================================================
// main: the CLI the workflows run, against a temp workspace
// ===========================================================================

describe('main', () => {
  const workspaces: string[] = [];
  afterAll(() => workspaces.map((dir) => rmSync(dir, { recursive: true, force: true })));

  /** A temp workspace: `files` are sources that exist on disk, `reports` lcov texts under coverage/. */
  function workspace(files: string[], reports: Record<string, string>) {
    const root = mkdtempSync(join(tmpdir(), 'mp-lcov-main-'));
    workspaces.push(root);
    const put = (rel: string, text: string) => {
      mkdirSync(dirname(join(root, rel)), { recursive: true });
      writeFileSync(join(root, rel), text, 'utf8');
    };
    files.map((rel) => put(rel, ''));
    Object.entries(reports).map(([rel, text]) => put(join('coverage', rel), text));
    const log = vi.fn();
    const error = vi.fn();
    return {
      root,
      run: () =>
        main({
          coverageDir: join(root, 'coverage'),
          exists: (p: string) => existsSync(join(root, p)),
          log,
          error,
        }),
      report: (rel: string) => readFileSync(join(root, 'coverage', rel), 'utf8'),
      logged: () => log.mock.calls.map(([l]) => String(l)),
      errored: () => error.mock.calls.map(([l]) => String(l)),
    };
  }

  const LCOV = (sf: string) => `TN:\nSF:${sf}\nLF:4\nLH:3\nBRF:2\nBRH:1\nend_of_record\n`;

  it('fails when the test run emitted no report at all', () => {
    const ws = workspace([], {});
    expect(ws.run()).toBe(1);
    expect(ws.errored()[0]).toMatch(/^No lcov\.info found under .*coverage\/ — did the test run emit coverage\?$/);
  });

  it('rewrites every report in place to workspace-relative paths and prints the totals', () => {
    const ws = workspace(['libs/a/dock/index.ts', 'libs/b/dock/index.ts'], {
      'libs/a/lcov.info': LCOV('dock/index.ts'),
      'libs/b/lcov.info': LCOV('dock\\index.ts'),
    });
    expect(ws.run()).toBe(0);
    expect(ws.report('libs/a/lcov.info')).toContain('SF:libs/a/dock/index.ts');
    expect(ws.report('libs/b/lcov.info')).toContain('SF:libs/b/dock/index.ts');
    expect(ws.logged()[0]).toBe('Rebased 2 path(s) across 2 report(s) to workspace-relative; all resolve on disk.');
    expect(ws.logged()[1]).toMatch(/^\nCoverage about to be uploaded:\n/);
    expect(ws.logged()[1]).toContain('libs/a');
  });

  it('counts already-rooted paths separately, so a rerun is visibly a no-op', () => {
    const ws = workspace(['libs/a/x.ts'], { 'libs/a/lcov.info': LCOV('libs/a/x.ts') });
    expect(ws.run()).toBe(0);
    expect(ws.logged()[0]).toBe('Rebased 0 path(s) across 1 report(s) to workspace-relative (1 already rooted); all resolve on disk.');
  });

  it('refuses a report sitting directly in coverage/, and rewrites nothing', () => {
    const ws = workspace(['libs/a/x.ts'], { 'lcov.info': LCOV('x.ts'), 'libs/a/lcov.info': LCOV('x.ts') });
    expect(ws.run()).toBe(1);
    expect(ws.errored()[0]).toMatch(/^Refusing to rewrite .*lcov\.info: it sits directly in .*coverage\/, so there is no project prefix to apply\.$/);
    expect(ws.report('libs/a/lcov.info')).toContain('SF:x.ts');
  });

  it('fails hard on a rewritten path that does not exist, since it would shrink the denominator', () => {
    const ws = workspace([], { 'libs/a/lcov.info': LCOV('gone.ts') });
    expect(ws.run()).toBe(1);
    expect(ws.errored()[0]).toBe('\n1 rewritten path(s) do not exist on disk:');
    expect(ws.errored()[1]).toMatch(/^ {2}libs\/a\/gone\.ts {3}\(from .*lcov\.info\)$/);
    expect(ws.errored()[2]).toMatch(/hard failure rather than a warning/);
  });

  it('lists at most 20 unresolved paths', () => {
    const many = Array.from({ length: 25 }, (_, i) => LCOV(`gone${i}.ts`)).join('');
    const ws = workspace([], { 'libs/a/lcov.info': many });
    ws.run();
    expect(ws.errored()[0]).toBe('\n25 rewritten path(s) do not exist on disk:');
    expect(ws.errored().filter((l) => l.includes('(from '))).toHaveLength(20);
  });
});
