import { TestBed } from '@angular/core/testing';

import { DailymotionApiService } from './dailymotion-api.service';

describe('DailymotionApiService', () => {
  let service: DailymotionApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DailymotionApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
