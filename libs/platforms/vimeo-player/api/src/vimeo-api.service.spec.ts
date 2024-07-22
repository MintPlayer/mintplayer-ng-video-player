import { VimeoApiService } from './vimeo-api.service';

describe('VimeoApiService', () => {
  let service: VimeoApiService;

  beforeEach(() => {
    service = new VimeoApiService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
