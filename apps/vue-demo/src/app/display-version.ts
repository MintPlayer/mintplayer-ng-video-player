/** What every unpublished package.json holds; CI's versioning plan stamps the real version over it. */
const PLACEHOLDER = '0.0.0-PLACEHOLDER';

/** The version to show: the stamped one, or `dev` for a local or pull-request build that nothing stamped. */
export const displayVersion = (version: string) => version === PLACEHOLDER ? 'dev' : version;
