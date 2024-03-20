import { SoundcloudApiService } from './soundcloud-api.service';

describe('SoundcloudApiService', () => {
  let service: SoundcloudApiService;

  beforeEach(() => {
    service = new SoundcloudApiService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
