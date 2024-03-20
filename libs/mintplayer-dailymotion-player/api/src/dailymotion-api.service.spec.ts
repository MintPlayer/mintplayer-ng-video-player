import { DailymotionApiService } from './dailymotion-api.service';

describe('DailymotionApiService', () => {
  let service: DailymotionApiService;

  beforeEach(() => {
    service = new DailymotionApiService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
