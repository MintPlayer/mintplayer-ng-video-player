import { YoutubeApiService } from './youtube-api.service';

describe('YoutubeApiService', () => {
  let service: YoutubeApiService;

  beforeEach(() => {
    service = new YoutubeApiService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});