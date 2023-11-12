import { TestBed } from '@angular/core/testing';

import { WistiaService } from './wistia.service';

describe('WistiaService', () => {
  let service: WistiaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WistiaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
