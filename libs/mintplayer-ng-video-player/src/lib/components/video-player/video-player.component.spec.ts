import { StaticProvider } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VIDEO_APIS } from '@mintplayer/player-provider';
import { MockProvider } from 'ng-mocks';

import { VideoPlayerComponent } from './video-player.component';
import { VideoPlayerService } from '../../services/video-player.service';

describe('VideoPlayerComponent', () => {
  let component: VideoPlayerComponent;
  let fixture: ComponentFixture<VideoPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [],
      declarations: [ VideoPlayerComponent ],
      providers: [
        <StaticProvider>{ provide: VIDEO_APIS, multi: true, useValue: [] },
        MockProvider(VideoPlayerService),
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
