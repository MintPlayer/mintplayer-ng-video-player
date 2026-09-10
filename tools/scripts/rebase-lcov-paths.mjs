#!/usr/bin/env node
/**
 * Rewrite every `SF:` path in the emitted lcov reports so it is relative to the
 * WORKSPACE root rather than to each project's own vitest root.
 *
 * Why this exists
 * ---------------
 * Vitest writes `SF:` paths relative to the config's root, so
 * `libs/mintplayer-web-components/dock/index.ts` is emitted as `dock/index.ts`.
 * The coverage service resolves report paths against `git ls-files` by longest
 * suffix — and `dock/index.ts` exists under FOUR libraries (web-components,
 * ng-bootstrap, react-bootstrap, vue-bootstrap). An ambiguous suffix cannot be
 * resolved, so the service marks the file unmatched and **excludes it from the
 * totals entirely**.
 *
 * Measured on PR #405 before this script existed: 314 of 1405 files (22.3%)
 * silently dropped — 58% of react-bootstrap and 58% of vue-bootstrap, which is
 * why those libraries reported ~66 and ~95 coverable lines for 129 and 130
 * files. The service's UI caps its "unmatched" list at 50, so the true scale
 * was invisible there.
 *
 * The mapping is exact because the coverage directory mirrors the project path:
 * `coverage/libs/mintplayer-web-components/lcov.info` <-> project
 * `libs/mintplayer-web-components`. So the prefix is just the report's own
 * directory, minus the leading `coverage/`.
 *
 * Fails loudly on a path that does not resolve on disk. Silence is how the
 * original bug survived; a project layout change should break the build rather
 * than quietly shrink the denominator again.
 *
 * Side-effect-free on import: the CLI work sits behind an isEntryPoint guard so
 * the spec can exercise the exported pieces without rewriting real reports.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, posix, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

const COVERAGE_DIR = 'coverage';

/** Every lcov.info under `dir`, at any depth. Missing dir -> []. */
export function findReports(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return findReports(full);
    return entry.name === 'lcov.info' ? [full] : [];
  });
}

/**
 * The workspace prefix a report's SF: paths need:
 * `coverage/libs/foo/lcov.info` -> `libs/foo`, always posix-separated.
 * Empty string for a report sitting directly in the coverage dir (no project
 * to attribute it to — the caller must refuse to rewrite that).
 */
export function prefixFor(report, coverageDir) {
  // Split on either separator: relative() emits the platform's own, but the
  // spec (and any caller) may hand in posix paths on Windows.
  return relative(coverageDir, report).split(/[\\/]/).slice(0, -1).join(posix.sep);
}

/**
 * Line and branch totals for one lcov report.
 *
 * Every report already carries these — `LF`/`LH` for lines, `BRF`/`BRH` for
 * branches — and nothing has ever added them up. That is why workspace branch
 * coverage sat 8.5 points under its own documented target without anyone
 * noticing: the figure had no home. A number nobody prints is a number nobody
 * defends.
 */
export function summarizeLcov(text) {
  const sum = (key) =>
    (String(text ?? '').match(new RegExp(`^${key}:(\\d+)`, 'gm')) ?? [])
      .reduce((total, line) => total + Number(line.slice(key.length + 1)), 0);

  return {
    files: (String(text ?? '').match(/^SF:/gm) ?? []).length,
    lines: { covered: sum('LH'), total: sum('LF') },
    branches: { covered: sum('BRH'), total: sum('BRF') },
  };
}

/** `covered/total (pct%)`, or a dash when there is nothing to measure. */
function ratio(part) {
  if (part.total === 0) return '—';
  return `${part.covered}/${part.total} (${((part.covered / part.total) * 100).toFixed(2)}%)`;
}

/**
 * The per-project table plus a TOTAL row, for the workflow log.
 *
 * Reporting only, deliberately: no threshold and no exit code. The gate lives
 * in `coverage-pr-gate.md` and is the service's job, so printing here cannot
 * start silently failing builds.
 */
export function formatCoverageSummary(entries) {
  const total = entries.reduce(
    (acc, { summary }) => ({
      files: acc.files + summary.files,
      lines: {
        covered: acc.lines.covered + summary.lines.covered,
        total: acc.lines.total + summary.lines.total,
      },
      branches: {
        covered: acc.branches.covered + summary.branches.covered,
        total: acc.branches.total + summary.branches.total,
      },
    }),
    { files: 0, lines: { covered: 0, total: 0 }, branches: { covered: 0, total: 0 } },
  );

  const width = Math.max(5, ...entries.map((e) => e.name.length));
  const row = (name, files, summary) =>
    `  ${name.padEnd(width)}  ${String(files).padStart(5)}  ` +
    `${ratio(summary.lines).padStart(22)}  ${ratio(summary.branches).padStart(22)}`;

  return [
    `  ${'project'.padEnd(width)}  ${'files'.padStart(5)}  ${'lines'.padStart(22)}  ${'branches'.padStart(22)}`,
    ...entries.map((e) => row(e.name, e.summary.files, e.summary)),
    `  ${'TOTAL'.padEnd(width)}  ${String(total.files).padStart(5)}  ` +
      `${ratio(total.lines).padStart(22)}  ${ratio(total.branches).padStart(22)}`,
  ].join('\n');
}

/**
 * Pure rewrite of one report's text. Normalises separators, prefixes each
 * `SF:` path, and is idempotent — an already-rooted path is left alone, so a
 * second run (or a report that already emits rooted paths) never
 * double-prefixes. Reads CRLF, always writes LF.
 *
 * `exists` is injected so the spec never depends on the real tree or the cwd.
 * Returns the rewritten text plus counts and the paths that failed to resolve.
 */
export function rebaseLcov(text, prefix, exists) {
  let rewritten = 0;
  let alreadyRooted = 0;
  const unresolved = [];

  const out = text
    .split(/\r?\n/)
    .map((line) => {
      if (!line.startsWith('SF:')) return line;
      const raw = line.slice(3).trim().split('\\').join(posix.sep);

      if (raw.startsWith(`${prefix}/`)) {
        alreadyRooted++;
        return `SF:${raw}`;
      }

      const rooted = `${prefix}/${raw}`;
      if (!exists(rooted)) unresolved.push({ raw, rooted });
      rewritten++;
      return `SF:${rooted}`;
    })
    .join('\n');

  return { text: out, rewritten, alreadyRooted, unresolved };
}

const isEntryPoint = !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntryPoint) {
  const reports = findReports(COVERAGE_DIR);
  if (reports.length === 0) {
    console.error(`No lcov.info found under ${COVERAGE_DIR}/ — did the test run emit coverage?`);
    process.exit(1);
  }

  let rewritten = 0;
  let alreadyRooted = 0;
  const unresolved = [];
  const summaries = [];

  for (const report of reports) {
    const prefix = prefixFor(report, COVERAGE_DIR);
    if (!prefix) {
      console.error(`Refusing to rewrite ${report}: it sits directly in ${COVERAGE_DIR}/, so there is no project prefix to apply.`);
      process.exit(1);
    }

    const result = rebaseLcov(readFileSync(report, 'utf8'), prefix, existsSync);
    rewritten += result.rewritten;
    alreadyRooted += result.alreadyRooted;
    unresolved.push(...result.unresolved.map((u) => ({ ...u, report })));
    writeFileSync(report, result.text, 'utf8');
    summaries.push({ name: prefix, summary: summarizeLcov(result.text) });
  }

  if (unresolved.length > 0) {
    console.error(`\n${unresolved.length} rewritten path(s) do not exist on disk:`);
    for (const u of unresolved.slice(0, 20)) console.error(`  ${u.rooted}   (from ${u.report})`);
    console.error(
      '\nEither the coverage directory no longer mirrors the project path, or a report\n' +
        "contains files that were not checked out. Both silently shrink the service's\n" +
        'denominator, so this is a hard failure rather than a warning.',
    );
    process.exit(1);
  }

  console.log(
    `Rebased ${rewritten} path(s) across ${reports.length} report(s) to workspace-relative` +
      (alreadyRooted ? ` (${alreadyRooted} already rooted)` : '') +
      '; all resolve on disk.',
  );
  console.log(`\nCoverage about to be uploaded:\n${formatCoverageSummary(summaries)}`);
}
