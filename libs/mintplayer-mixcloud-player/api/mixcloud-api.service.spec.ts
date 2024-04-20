import { MixcloudApiService } from './mixcloud-api.service';

describe('MixcloudApiService', () => {
  let service: MixcloudApiService;

  beforeEach(() => {
    service = new MixcloudApiService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
