// @flow strict
// This is injected by the webpack DefinePlugin
/* global __COMMIT_HASH__ */

// This is used to identify the Browser as apposed to an SSR execution environment
export const isBrowser: boolean =
    typeof window !== 'undefined' && typeof window.scrollY === 'number';

// This is used to identify the Server as apposed to a Browser execution environment
export const isSSR = !isBrowser;

// // This identifies production builds
// export const isProduction: boolean = process.env['NODE_ENV'] === 'production';

// // Set to true when we are building a test build for Playwright, this is typically
// // used for things like disabling ads when running Playwright tests
// export const isPlaywrightTest: boolean =
//     isBrowser && document.cookie.includes('playwright_test=1');

// // This is used to identify when we are inside a JEST run and is used at run time not
// // at build time unlike isPlaywrightTest
// export const isTestRun = Boolean(process.env['JEST_WORKER_ID']);

// // Build Commit Hash
// export const buildCommitHash: string =
//     process.env['COMMIT_HASH'] ||
//     // $FlowFixMe[cannot-resolve-name] - This is injected by Webpack at build time
//     // __COMMIT_HASH__ ||
//     'unknown'; // eslint-disable-line no-undef
