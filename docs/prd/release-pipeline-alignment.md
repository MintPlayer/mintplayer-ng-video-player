# PRD: Align the release pipeline and demo version with mintplayer-ng-bootstrap

Issue: [#102](https://github.com/MintPlayer/mintplayer-ng-video-player/issues/102)
Companion: MintPlayer/mintplayer-ng-seo#26
Reference: mintplayer-ng-bootstrap `.github/` (publish-master, pull-request, test, actions/setup,
actions/docker-push), `tools/scripts/check-demo-versions.mjs`, `docs/prd/package-version-in-demos.md`
(since ng-bootstrap#447, fd49127e)

Decisions were settled in a grilling session on 2026-10-27. See §6.

## 1. Problem

`publish-master.yml` is one serial job: build → test → coverage → version → 20 hand-written
"Push to NPM" / "Push to Github" pairs → two Docker images that each `npm install` and rebuild the
demo from scratch. The versioning action is pinned to the old `fc5aa28d # versioning-v1`.

The live Angular demo shows the right version only because the in-image rebuild happens after the
versioning step has stamped the sources. Nothing checks this. Locally, `nx serve angular-demo` shows
`0.0.0-PLACEHOLDER`. No test covers the badge.

## 2. Current state (investigated 2026-10-27)

| Area | Today | File |
|---|---|---|
| Workflows | `publish-master.yml`, `pull-request.yml`, `build-any.yml`, **all three named `npm-publish`** | `.github/workflows/` |
| Jobs (master) | `build` (everything) → `deploy` | `publish-master.yml` |
| Concurrency | `cancel-in-progress: true` everywhere | |
| Versioning | after lib build and tests; single call, no plan/release split | `publish-master.yml:79-81` |
| Publish | **20** pairs (issue says 17), `JS-DevTools/npm-publish@v4`, npm + GitHub Packages, provenance | `publish-master.yml:83-464` |
| Packages | `dist/libs/{ng-canvas-resizer,player-provider,player-progress,video-player,playlist-controller}`, `dist/libs/frameworks/{ng,r,v}-video-player`, `dist/libs/platforms/*-player` (12) | |
| Docker | angular + react; the Dockerfile runs `npm install` + `nx build`, nginx serves `dist/apps/angular-demo/browser` / `dist/apps/react-demo`. `docker-compose.yml` only pulls the `:master` images. | `apps/{angular,react}-demo/Dockerfile` |
| Vue demo | built in CI, **no image, not deployed** | |
| Version display | **Angular only** (`app.config.ts:4,21` → `app.component.html:23`). React has **no header/nav**; Vue has `<header><nav>` (`App.vue:7-12`). | |
| Path mappings | only `@mintplayer/ng-video-player/package.json` (`tsconfig.base.json:50`); React/Vue resolve via `nxViteTsPaths()` | |
| e2e | angular: Cypress 15 with legacy `cypress.json`, **which cannot run**; react/vue: Playwright. **No workflow runs e2e** (ng-bootstrap's doesn't either). | `apps/*-demo-e2e` |
| Nx | **22.7.5** (latest 24.0.2). `migrations.json` from #98 still committed (7 entries). `nx.json:10` generator default `e2eTestRunner: cypress`. **No remote cache**, `cacheableOperations: []`. | |
| Node / actions | Node 22, `checkout@v4`, `setup-node@v4`, `metadata@v5`, `build-push@v6`, `attest@v1`, `ssh-action@v1.0.0` | |
| tools | `rebase-lcov-paths.mjs`; **no Nx project, no test runner**; its header promises a spec that doesn't exist | `tools/` |
| Secrets | org: `NX_CACHE_SERVER`, `NX_CACHE_RO_TOKEN`, `NX_CACHE_RW_TOKEN`, `COVERAGE_TOKEN`, `PUBLISH_TO_NPMJS`, `VPS_*` (all repos). Repo: `CODECOV_TOKEN`, `PUBLISH_FTP_*`, `SLIPLANE_*`, **none referenced** | |

**Baseline timing** (run 40203505605, 2026-10-25): **6m23s** wall clock. `npm ci` 61s, lib build
30s, tests 50s, versioning 32s, 40 publish steps ~20s, Angular image **1m58s**, React image 18s,
deploy 12s.

## 3. Goals

- G1: `.github/` has the same structure as ng-bootstrap's, adapted only where this repo differs
  (three demos, no SSR, no snippets package, no .NET).
- G2: the version a demo shows is the version that ships, enforced by a build-time guard, not by
  step order.
- G3: an unstamped demo shows `dev`, never `0.0.0-PLACEHOLDER`.
- G4: an e2e test covers the badge in all three demos.
- G5: the master run is no slower than 6m23s.
- G6: the workspace is on current tooling (Nx 24, the newest Node LTS, the latest action majors).

## 4. Requirements

### F0 Tooling upgrade (milestone 0)
- `nx migrate latest` (24.x), then run the migrations and commit. First re-run the 7 pending
  entries in the existing `migrations.json`, and delete the file once its migrations have run.
- Fallback: if Nx 24 does not build and test green within about 30 minutes, go to the latest 23.x and
  record why.
- Node: the newest LTS line at implementation time (24, or 26 if it has been promoted). Check it then,
  don't assume it. Keep `engines` consistent. *(Implemented: Node 24 is still the newest LTS.
  `engines` already allows `>=24.0.0`, so it is unchanged.)*

### F1 Shared workflow pieces
- `.github/actions/setup` (ported): setup-node, an `actions/cache` of `node_modules` keyed on the
  lockfile hash, and `npm ci` only on a cache miss. No dotnet input.
- `.github/actions/docker-push` (ported).
- `.github/workflows/test.yml` (reusable, `workflow_call`): **one job**,
  `nx run-many -t test --all --coverage --watch=false --parallel=2`, which uploads `coverage/` as an artifact.
  It is called by `publish-master.yml` and `pull-request.yml`. No matrix and no `affected` (D6).
- Remote cache, as in ng-bootstrap: workflow-level env `NX_SELF_HOSTED_REMOTE_CACHE_SERVER: secrets.NX_CACHE_SERVER`
  and `NX_SELF_HOSTED_REMOTE_CACHE_ACCESS_TOKEN`: RW on a push to the default branch, RO otherwise.
  `nx.json` target defaults get `cache: true` for build/test/lint, and `test` declares its coverage
  directory as an output, so unaffected projects' reports are restored from the cache.
- Workflow names are `publish-master`, `pull-request` and `test`. **Delete `build-any.yml`.**
- Every action is on its latest major (checked 2026-10-27): checkout v7, setup-node v7, cache v6,
  upload-artifact v7, download-artifact v8, login v4, metadata v6, build-push v7, attest v4,
  ssh-action v1.2.5. The MintPlayer actions keep their SHA pins.

### F2 `publish-master.yml`
- **Concurrency: `cancel-in-progress: false`** (D9). A newer merge queues behind the run in flight.
- `build` (`contents: read`, `id-token: write`; output `plan`):
  - `nx run-many -t build --exclude=angular-demo,react-demo,vue-demo --configuration=production`
  - Plan step: `MintPlayer/MintPlayer.Spark/apps/CodeCoverage/versioning-action@14900a6057ee305ac9b03690fcb2ff989452e2eb # versioning-v1.1.0`
    with `phase: plan`. Without `id-token` the action falls back to local mode without failing.
  - `nx run-many -t build --projects=angular-demo,react-demo,vue-demo --configuration=production --exclude-task-dependencies`
    Any non-`^build` dependency of the demos must move into the lib step (S1).
  - `node tools/scripts/check-demo-versions.mjs`
  - `upload-artifact` with name `dist`, path `dist/`
- `tests`: `uses: ./.github/workflows/test.yml`, `secrets: inherit`.
- `coverage` (needs `tests`): download the coverage artifact, run `rebase-lcov-paths.mjs`, then
  `coverage-upload-v1`, with `files: coverage/libs/**/lcov.info` + `coverage/tools/lcov.info`, `flags: unit`,
  `fail-ci-if-error: false`.
- `publish-libs` (needs `[build, tests]`, `contents: write`): download `dist`, then the versioning
  action with `phase: release` and `plan: ${{ needs.build.outputs.plan }}`, then
  `MintPlayer/github-actions/publish-npm-packages@b08fbddf0b285a8633ac138b89d79ceb8cc8c888`,
  which replaces all 40 steps (S5: nested dirs).
- `docker` (needs `[build, tests]`, a matrix over angular/react,
  `packages/attestations/id-token/artifact-metadata: write`): download `dist`, login, metadata, then
  `build-push-action` with `target: prebuilt` and `build-contexts: dist=dist/apps/angular-demo/browser`
  or `dist=dist/apps/react-demo`, then docker-push, attestation and "make the image public". Image names
  are unchanged (`ghcr.io/<repo>-angular`, `-react`).
- `deploy` (needs `docker`): the same SSH script.
- `publish-master` aggregator (`if: always()`, needs all), failing on any failed or cancelled need:
  one stable check name.

### F3 `pull-request.yml`
- Build, then `uses: ./.github/workflows/test.yml`, then the same coverage job (rebase + upload). The
  conditional rebase at `pull-request.yml:49-61` goes away. A `pull-request` aggregator job provides a
  stable check name.

### F4 Dockerfiles (angular-demo, react-demo)
- Stages: `runtime` (nginx + `nginx.conf`); `prebuilt` (`FROM runtime`, `COPY --from=dist . <serve dir>`);
  `builder` (today's `npm install` + `nx build`); and `standalone` (`FROM runtime`, copy from
  `builder`). **`standalone` is the last stage**, so a plain `docker build .` defaults to it. CI
  always passes `target: prebuilt`.

### F5 Version badge in every demo
- tsconfig paths: add `@mintplayer/r-video-player/package.json` and `@mintplayer/v-video-player/package.json`,
  pointing at the libs' source `package.json` (as Angular's does).
- Angular: port `bootstrap-version.provider.ts` as `video-player-version.provider.ts`
  (`displayVersion(v) => v === '0.0.0-PLACEHOLDER' ? 'dev' : v`) plus its unit spec, and wire it in
  `app.config.ts`.
- React: **add a minimal header** to `app.tsx`. *(Implemented as a Bootstrap navbar,
  `<nav className='navbar navbar-dark bg-dark'>`, styled in `app.module.scss`.)* It holds a GitHub
  link titled `@mintplayer/r-video-player on GitHub` with the version in a `<span>`. *(The mapping
  lives in `display-version.ts` and is covered by a badge test in `app.spec.tsx`.)*
- Vue: the same link in the existing `<nav>`, titled `@mintplayer/v-video-player on GitHub`.

### F6 Version guard
- Port `tools/scripts/check-demo-versions.mjs`, `tools/scripts/lib/cli.mjs` and the spec
  (`check-demo-versions.spec.ts`, vitest, temp trees). `DEMOS`:
  - angular-demo: `libs/frameworks/ng-video-player/package.json`, bundle `dist/apps/angular-demo/browser`
  - react-demo: `libs/frameworks/r-video-player/package.json`, bundle `dist/apps/react-demo`
  - vue-demo: `libs/frameworks/v-video-player/package.json`, bundle `dist/apps/vue-demo`
- The guard fails when a source `package.json` still holds the placeholder, when a bundle dir is
  missing, or when no `.js`/`.mjs` in a bundle contains the stamped version as a quoted literal. It
  asserts **presence** of the version, never absence of the placeholder (`@angular/core` contains
  the literal).
- New `tools` Nx project (`tools/project.json`, coverage at `coverage/tools`), so the specs run in
  `run-many -t test`. Add the missing `rebase-lcov-paths` spec. *(Implemented: the `test` target is
  inferred by `@nx/vitest`, because Nx 24 removed the executor. The project also covers
  `tools/vite/vite-helpers.ts`, which replaces `nxViteTsPaths`/`nxCopyAssetsPlugin`.)*

### F7 e2e
- **Migrate angular-demo-e2e to Playwright** (`@nx/playwright`, `playwright.config.ts`,
  `src/example.spec.ts`), porting the existing Cypress assertions. Remove `cypress`, `@nx/cypress` and
  `eslint-plugin-cypress` after grepping for other users. Set `nx.json` `e2eTestRunner` to `playwright`.
- Each demo's e2e gets "navbar shows the library version, or dev when unstamped", using
  `getByTitle('<pkg> on GitHub').locator('span')` and
  `toHaveText(/^(dev|\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?)$/)`. These run locally; CI doesn't run e2e.
- *(Implemented: every e2e target is inferred by `@nx/playwright/plugin`, and the suites run
  Chromium only. vue-demo previews on port 4301, so it no longer collides with react-demo's 4300
  when the suites run in parallel.)*

## 5. Spikes (time-boxed, run before implementation)

| # | Question | How | Box | Decides |
|---|---|---|---|---|
| S1 | What does `phase: plan` stamp (source and dist `package.json`)? Do the demos' `package.json` imports resolve to the stamped source? Do the demos have a non-`^build` task dependency? How large is the plan output (job outputs are capped at 1 MB)? | Read the action's `action.yml` / README at `14900a60`, and `nx show project <demo> --json`. Stamp locally if local mode allows, then `git diff --stat`. | 30 min | F2, F6 |
| S2 | ~~Does Cypress run?~~ Answered: no (Cypress 15 + `cypress.json`). Settled by D3. | — | — | — |
| S3 | Do the `prebuilt` images serve the same pages (routes, `nginx.conf` fallbacks, Angular `/browser`)? How long do they take to build? | `docker build --build-context dist=... --target prebuilt` locally, then curl `/` and a deep route. | 30 min | F4 |
| S4 | Will the split graph beat 6m23s? Estimated critical path: build (setup with the `node_modules` cache, about 20–65s; libs 30s or a cache hit; plan ~30s; demos ~40s; upload ~15s; ≈ 2.5–3 min) → docker (~1 min) → deploy (12s) ≈ **4–4.5 min**. | Measure the demo build time and the `dist/` artifact size locally. Confirm on the merge run, without pushing just to measure. | 15 min | G5 |
| S5 | Does `publish-npm-packages@b08fbddf` find nested `dist/libs/frameworks/*` and `platforms/*`? What are its inputs (secret names, GitHub registry, provenance, skip-if-published)? | Read its `action.yml`, and compare with the ng-seo and ng-bootstrap call sites. | 15 min | F2 |
| S6 | Nx 24 migration: do `@nx/angular`, `@nx/vite` (with the `nxViteTsPaths` workaround in `react-demo/vite.config.ts:11-13`), `@nx/jest`, `@nx/vitest` and `@nx/playwright` still build and test? | Do the migration, then one `run-many -t build test`. Fallback: Nx 23 (F0). | 30 min | F0 |

### Findings (2026-10-27)

- **S1.** `phase: plan` stamps both the source and the build-output `package.json` of every package
  and writes no tag. `phase: release` takes `plan:` and refuses a plan the tag history has moved
  past. Server mode needs `id-token: write`; without it the action warns and runs locally. The
  demos import the source `package.json` (Angular through `libs/frameworks/ng-video-player/package.ts`,
  React and Vue through new `tsconfig.base.json` paths), so they show the stamped version. No demo
  has a non-`^build` task dependency, so `--exclude-task-dependencies` drops nothing. The plan's
  size against the 1 MB output cap is unmeasured (only server mode produces a real plan); confirm on
  the merge run.
- **S3.** Not run: no Docker daemon on the dev machine. The `prebuilt` stage copies the same
  directories the old images served (`browser/` for Angular, the bundle root for React), with the
  same `nginx.conf`. Verify `/` and a deep route on the first deploy.
- **S4.** Not measured beyond the local builds; confirm on the merge run.
- **S5.** `publish-npm-packages@b08fbddf` scans `folder` recursively, so the nested
  `dist/libs/frameworks/*` and `dist/libs/platforms/*` are found, and it publishes in topological
  order. `registries` is a JSON array of `{url, token, access, skipDuplicate (default true),
  provenance (default true on npmjs)}`. The `v3` tag predates the action, so the SHA pin stays.
- **S6.** Nx 24.0.2 migrated, with these consequences:
  - Every removed executor became an inferred target (`@nx/jest`, `@nx/vite`, `@nx/vitest`,
    `@nx/playwright`, `@nx/eslint`).
  - `nxViteTsPaths` and `nxCopyAssetsPlugin` are inert stubs in Nx 24. They are replaced by
    `tools/vite/vite-helpers.ts`:
    - `workspaceAliases()` turns the `tsconfig.base.json` paths into anchored `resolve.alias`
      regexes. Vite 8's native `resolve.tsconfigPaths` fails on the platform libs' secondary entry
      points.
    - `copyPackageFiles()` copies `package.json` and `README.md` into each library's `dist`. The
      removed `@nx/vite:build` executor used to do this, and the publish action needs it.
  - The r-/v-video-player `outDir`/`cacheDir` were one level short (`libs/dist`). The executor's
    `outputPath` had masked that.
  - vue-demo now type-checks: it had `skipTypeCheck: true`. Its `vite/client` types moved to a
    reference directive.
  - angular-demo-e2e moved to Playwright (D3). The e2e suites run chromium only, and vue-demo
    previews on 4301 so it no longer collides with react-demo's 4300.

## 6. Decisions

| # | Decision | Choice | Trap accepted |
|---|---|---|---|
| D1 | Which demos show a version | **All three** (angular, react, vue) | Scope grows into two demo UIs, and a Vue-only guard failure blocks a release of a demo that isn't deployed |
| D2 | React badge placement | **A new minimal header**, matching Vue's structure | It changes how the React demo looks |
| D3 | Angular e2e runner | **Playwright**, Cypress removed | A noisy `package-lock.json` diff |
| D4 | Nx | **Migrate to 24** as milestone 0 (fallback 23 after ~30 min), and clean up `migrations.json` | A fresh major can block #102 on unrelated breakage |
| D5 | Workflow scope | **Full `.github` alignment**: setup + docker-push actions, a reusable test.yml, `build-any.yml` deleted, real workflow names | Branch pushes without a PR get no CI |
| D6 | test.yml shape | **One job, `run-many`**, on PRs too, **with the `nx-cache.mintplayer.com` remote cache** | It has to move to a matrix if the suites grow past about 3 min |
| D7 | Dockerfile stages | **Keep `standalone`** (the last/default stage) beside `prebuilt` | A `builder` stage that CI never exercises |
| D8 | Versions | **The latest of everything**: Nx, Node LTS, every action's latest major (ahead of ng-bootstrap) | Node and action majors change at once, so on a CI-only failure check the Node version first |
| D9 | Master concurrency | **Queue (`cancel-in-progress: false`)**, unlike ng-bootstrap's D6 | Bursts drop the *pending* middle run, and deploys happen one after another |

Note for the companion repos: D8 and D9 now make this repo stricter than ng-bootstrap. ng-seo#26
(and later ng-bootstrap) should follow them.

## 7. Out of scope

- Deploying vue-demo.
- Running e2e in CI (neither repo does today).
- Deleting the unused repo secrets (`CODECOV_TOKEN`, `PUBLISH_FTP_*`, `SLIPLANE_*`). That's for the
  owner, outside the PR.

## 8. Milestones

0. Spike S6, then the Nx 24 migration + Node LTS (F0). Commit.
1. Spikes S1, S3, S4, S5. Record the findings in §5.
2. `tools` project: the guard, `cli.mjs`, both specs (F6).
3. Version badges + `displayVersion` in all three demos, plus path mappings (F5).
4. The Playwright migration for angular-demo-e2e and the badge e2e in all three (F7).
5. Dockerfile stages (F4).
6. `.github/`: setup + docker-push actions, test.yml, publish-master, pull-request, delete build-any
   (F1–F3).
7. One local sweep at the end: `run-many -t build test`, the three e2e projects, the guard against a
   locally stamped build, and one `docker build --target prebuilt` per image. Then one PR.

## 9. Acceptance

- The master run is green.
- The plan step logs server mode.
- `check-demo-versions` reports OK for all three demos.
- The live angular and react demos show the released version.
- Wall clock ≤ 6m23s (baseline run 40203505605).
- A PR run uses the remote cache (an Nx "remote cache hit" appears in the log for unaffected projects).

## 10. Status (2026-10-27)

Milestones 0–7 are implemented in PR #103.

- **Verified locally, with the cache disabled:**
  - `run-many -t build test typecheck`: all 27 projects pass.
  - The three e2e projects pass.
  - A build stamped `9.9.9-local.1` passes `check-demo-versions` for all three demos.
  - `tools`: 68 tests pass.
- **Open, checked on the merge run:**
  - Every item in §9.
  - S3: no Docker daemon was available, so `docker build --target prebuilt` from milestone 7 did
    not run. On the first deploy, check that `/` and a deep route serve.
  - S4: timing and the plan output size.
- **Known, not in scope:** lint fails on errors that predate this work (`no-var` in `.d.ts`,
  `@nx/dependency-checks`, `prefer-inject`, …) and on an eslint-plugin-react crash under ESLint 10.
  CI doesn't run lint.
