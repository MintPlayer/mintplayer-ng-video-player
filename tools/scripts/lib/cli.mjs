/**
 * The one entry-point guard every workspace CLI shares.
 *
 * Each script used to carry its own
 * `if (import.meta.url === pathToFileURL(process.argv[1]).href) { ...body... }`.
 * That body is exactly the code a spec cannot reach: V8 coverage does not see a
 * CLI run as a child process, and importing the module skips the guard. So the
 * body moves into an exported `main()`, which a spec drives directly against a
 * temp dir, and the guard shrinks to one call to `runCli` — which is covered by
 * the import itself, and whose "was run" half is specced here once.
 *
 * `main()` returns the exit code. A non-zero code exits immediately, like the
 * `process.exit(n)` calls it replaces; zero or nothing lets the process end on
 * its own, so a watcher or a spawned child keeps it alive exactly as before.
 * A throw is printed with its stack and exits 1.
 */
import { pathToFileURL } from 'node:url';

/** True when `moduleUrl` is the script node was asked to run, not a module it imported. */
export function isEntryPoint(moduleUrl, scriptPath = process.argv[1]) {
  return !!scriptPath && moduleUrl === pathToFileURL(scriptPath).href;
}

/**
 * Run `main` when `moduleUrl` is the entry point; otherwise do nothing.
 *
 * Returns the promise of the run (or undefined when not run) so a spec can
 * await it. Callers do not need to: the script's own top level may ignore it.
 *
 * @param {string} moduleUrl the caller's `import.meta.url`
 * @param {() => unknown} main
 * @param {{ argv?: string[], exit?: (code: number) => void, error?: (...args: any[]) => void }} [options]
 */
export function runCli(
  moduleUrl,
  main,
  { argv = process.argv, exit = (code) => process.exit(code), error = console.error } = {},
) {
  if (!isEntryPoint(moduleUrl, argv[1])) return undefined;
  return Promise.resolve()
    .then(() => main())
    .then(
      (code) => {
        if (typeof code === 'number' && code !== 0) exit(code);
        return code;
      },
      (err) => {
        error(err?.stack ?? err);
        exit(1);
        return 1;
      },
    );
}
