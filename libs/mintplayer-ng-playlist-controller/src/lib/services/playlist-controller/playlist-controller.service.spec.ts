import { TestBed } from '@angular/core/testing';

import { PlaylistControllerService } from './playlist-controller.service';

describe('PlaylistControllerService', () => {
  let service: PlaylistControllerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlaylistControllerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
