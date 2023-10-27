import { TestBed } from '@angular/core/testing';

import { VidyardService } from './vidyard.service';

describe('VidyardService', () => {
  let service: VidyardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VidyardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
