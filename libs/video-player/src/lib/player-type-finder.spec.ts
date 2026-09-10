import { IApiService } from '@mintplayer/player-provider';
import { findApis } from './player-type-finder';

/** The smallest thing findApis will accept: an id and some url regexes. */
function api(id: string, urlRegexes: RegExp[], extra: Partial<IApiService> = {}) {
  return <IApiService>{
    get id() {
      return id;
    },
    urlRegexes,
    loadApi: () => Promise.resolve(),
    prepareHtml: () => '',
    createPlayer: () => Promise.reject('not used'),
    ...extra,
  };
}

const youtube = api('youtube', [
  /http[s]{0,1}:\/\/(www\.){0,1}youtube\.com\/watch\?v=(?<id>[^&]+)/,
  /http[s]{0,1}:\/\/(www\.){0,1}youtu\.be\/(?<id>[^&?]+)/,
]);
const vimeo = api('vimeo', [/http[s]{0,1}:\/\/(www\.){0,1}vimeo\.com\/(?<id>\d+)/]);

describe('findApis', () => {
  it('returns nothing when no api matches', () => {
    expect(findApis('https://example.com/video/1', [youtube, vimeo])).toEqual([]);
  });

  it('returns nothing when there are no apis to try', () => {
    expect(findApis('https://www.youtube.com/watch?v=abc', [])).toEqual([]);
  });

  it('extracts the id from the named capture group', () => {
    const found = findApis('https://www.youtube.com/watch?v=dQw4w9WgXcQ', [
      youtube,
      vimeo,
    ]);

    expect(found).toHaveLength(1);
    expect(found[0].api).toBe(youtube);
    expect(found[0].id).toBe('dQw4w9WgXcQ');
  });

  it('matches on any of an api\'s regexes, not just the first', () => {
    const found = findApis('https://youtu.be/dQw4w9WgXcQ', [youtube]);

    expect(found[0].id).toBe('dQw4w9WgXcQ');
  });

  it('returns every matching api, in the order they were given', () => {
    const overlapping = api('overlapping', [
      /http[s]{0,1}:\/\/(www\.){0,1}youtube\.com\/watch\?v=(?<id>[^&]+)/,
    ]);
    const found = findApis('https://www.youtube.com/watch?v=abc', [
      overlapping,
      youtube,
    ]);

    expect(found.map((f) => f.api.id)).toEqual(['overlapping', 'youtube']);
  });

  it('prefers match2id over the named group when the api supplies one', () => {
    const withMatch2id = api(
      'match2id',
      [/https:\/\/host\/(?<id>\d+)\/(?<slug>.+)/],
      { match2id: (match) => `${match.groups!['id']}-${match.groups!['slug']}` }
    );

    const found = findApis('https://host/42/some-slug', [withMatch2id]);

    expect(found[0].id).toBe('42-some-slug');
  });

  it('skips an api whose regex has no named groups', () => {
    // Without a `groups` object there is no id to hand to the player, so the
    // api must be dropped rather than yield a VideoRequest with id undefined.
    const groupless = api('groupless', [/https:\/\/host\/\d+/]);

    expect(findApis('https://host/42', [groupless])).toEqual([]);
  });

  it('does not carry match state between calls for a global regex', () => {
    // `lastIndex` on a /g regex is the classic trap here: findApis clones each
    // regex, so a second call for the same url has to match again.
    const global = api('global', [
      new RegExp(/https:\/\/host\/(?<id>\d+)/, 'g'),
    ]);

    expect(findApis('https://host/42', [global])[0].id).toBe('42');
    expect(findApis('https://host/42', [global])[0].id).toBe('42');
  });
});
