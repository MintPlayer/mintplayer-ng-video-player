import { TestBed } from '@angular/core/testing';

import { VimeoApiService } from './vimeo-api.service';

describe('VimeoApiService', () => {
  let service: VimeoApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VimeoApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
