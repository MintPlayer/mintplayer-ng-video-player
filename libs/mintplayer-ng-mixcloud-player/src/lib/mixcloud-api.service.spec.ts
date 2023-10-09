import { TestBed } from '@angular/core/testing';

import { MixcloudApiService } from './mixcloud-api.service';

describe('MixcloudApiService', () => {
  let service: MixcloudApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MixcloudApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
