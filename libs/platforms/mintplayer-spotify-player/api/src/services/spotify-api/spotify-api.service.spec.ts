import { SpotifyApiService } from './spotify-api.service';

describe('SpotifyApiService', () => {
  let service: SpotifyApiService;

  beforeEach(() => {
    service = new SpotifyApiService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
