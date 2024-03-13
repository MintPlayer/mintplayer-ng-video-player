import { TestBed } from '@angular/core/testing';

import { TwitchApiService } from './twitch-api.service';

describe('TwitchApiService', () => {
  let service: TwitchApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TwitchApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
