import { TestBed } from '@angular/core/testing';

import { StreamableService } from './streamable-api.service';

describe('StreamableService', () => {
  let service: StreamableService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StreamableService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
