import { Component, EventEmitter, Injectable, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { PlaylistController } from '@mintplayer/ng-playlist-controller';
import { BehaviorSubject } from 'rxjs';

import { PlaylistDemoComponent } from './playlist-demo.component';

describe('PlaylistDemoComponent', () => {
  let component: PlaylistDemoComponent;
  let fixture: ComponentFixture<PlaylistDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule
      ],
      declarations: [
        // Unit to test
        PlaylistDemoComponent,
      
        // Mock dependencies
        VideoPlayerMockComponent
      ],
      providers: [
        { provide: PlaylistController, useClass: PlaylistControllerMock }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlaylistDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it(`should have as title 'playlist'`, () => {
    expect(component.title).toEqual('playlist');
  });

  it('should render title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain(
      'Welcome to playlist!'
    );
  });
});

enum EPlayerState {
  unstarted = 1,
  playing = 2,
  paused = 3,
  ended = 4,
}

@Component({
  selector: 'video-player',
  template: '<div>Video player</div>'
})
class VideoPlayerMockComponent {
  @Input() width = 400;
  @Input() height = 300;
  @Output() playerStateChange = new EventEmitter<EPlayerState>();
}

@Injectable()
class PlaylistControllerMock<TVideo> {
  video$ = new BehaviorSubject<TVideo | null>(null);
}