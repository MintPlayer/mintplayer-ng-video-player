/**
 * The shared entry-point guard. Every CLI in tools/ ends in
 * `runCli(import.meta.url, main)`, so the "was it run or imported" decision and
 * the exit-code contract are specced once, here, rather than per script — where
 * they could not be, because a spec only ever imports.
 */
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

import { isEntryPoint, runCli } from './cli.mjs';

const script = resolve('/work/tools/scripts/some-cli.mjs');
const url = pathToFileURL(script).href;
const ran = ['node', script];

describe('isEntryPoint', () => {
  it('is true for the script node was asked to run', () => {
    expect(isEntryPoint(url, script)).toBe(true);
  });

  it('is false for a module that was merely imported', () => {
    expect(isEntryPoint(url, resolve('/work/tools/scripts/other.mjs'))).toBe(false);
  });

  it('is false when there is no script at all (a REPL, or node -e)', () => {
    expect(isEntryPoint(url, undefined)).toBe(false);
    expect(isEntryPoint(url, '')).toBe(false);
  });
});

describe('runCli', () => {
  it('does not call main when the module was imported', () => {
    const main = vi.fn();
    expect(runCli(url, main, { argv: ['node', resolve('/elsewhere.mjs')] })).toBeUndefined();
    expect(main).not.toHaveBeenCalled();
  });

  it('exits with a non-zero code main returns', async () => {
    const exit = vi.fn();
    await runCli(url, () => 2, { argv: ran, exit });
    expect(exit).toHaveBeenCalledWith(2);
  });

  it('does not exit on success, so a watcher or child can keep the process alive', async () => {
    const exit = vi.fn();
    expect(await runCli(url, async () => 0, { argv: ran, exit })).toBe(0);
    expect(await runCli(url, () => undefined, { argv: ran, exit })).toBeUndefined();
    expect(exit).not.toHaveBeenCalled();
  });

  it('prints the stack of a throw and exits 1', async () => {
    const exit = vi.fn();
    const error = vi.fn();
    const boom = new Error('boom');
    await runCli(url, async () => { throw boom; }, { argv: ran, exit, error });
    expect(error).toHaveBeenCalledWith(boom.stack);
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('prints a thrown non-Error as-is', async () => {
    const error = vi.fn();
    await runCli(url, () => { throw 'plain'; }, { argv: ran, exit: vi.fn(), error });
    expect(error).toHaveBeenCalledWith('plain');
  });

  it('calls main with no arguments, so each script\'s own defaults apply', async () => {
    const main = vi.fn();
    await runCli(url, main, { argv: ran, exit: vi.fn() });
    expect(main).toHaveBeenCalledWith();
  });
});
