import { TestBed } from '@angular/core/testing';

import { SoundcloudApiService } from './soundcloud-api.service';

describe('SoundcloudApiService', () => {
  let service: SoundcloudApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SoundcloudApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
