import { TwitchApiService } from './twitch-api.service';

describe('TwitchApiService', () => {
  let service: TwitchApiService;

  beforeEach(() => {
    service = new TwitchApiService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
