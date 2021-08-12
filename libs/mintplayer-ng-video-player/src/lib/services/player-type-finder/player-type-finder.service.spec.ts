import { TestBed } from '@angular/core/testing';

import { PlayerTypeFinderService } from './player-type-finder.service';

describe('PlayerTypeFinderService', () => {
  let service: PlayerTypeFinderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlayerTypeFinderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
