import { TestBed } from '@angular/core/testing';

import { PlaylistController } from './playlist-controller.service';

interface Video {
  url: string;
}

describe('PlaylistControllerService', () => {
  let service: PlaylistController<Video>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PlaylistController]
    });
    service = TestBed.inject<PlaylistController<Video>>(PlaylistController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
