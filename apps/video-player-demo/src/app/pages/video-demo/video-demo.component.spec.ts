import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { VideoDemoComponent } from './video-demo.component';

describe('VideoDemoComponent', () => {
  let component: VideoDemoComponent;
  let fixture: ComponentFixture<VideoDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule
      ],
      declarations: [
        // Unit to test  
        VideoDemoComponent,

        // Mock dependencies
        BsListGroupMockComponent,
        BsListGroupItemMockComponent,
        VideoPlayerMockComponent,
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it(`should have as title 'video-player-demo'`, () => {
    expect(component.title).toEqual('video-player-demo');
  });

  it('should render title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain(
      'Welcome to video-player-demo!'
    );
  });
});

@Component({
  selector: 'bs-list-group',
  template: 'list-group works'
})
class BsListGroupMockComponent {}

@Component({
  selector: 'bs-list-group-item',
  template: 'list-group-item works'
})
class BsListGroupItemMockComponent {}

@Component({
  selector: 'video-player',
  template: '<div>Video player</div>'
})
class VideoPlayerMockComponent {
  @Input() width = 400;
  @Input() height = 300;
  @Input() autoplay = true;
  @Input() url = '';
  @Input() volume = 50;
  @Input() mute = false;
  @Input() playerState = EPlayerState.unstarted;
  @Output() volumeChange = new EventEmitter<number>();
  @Output() muteChange = new EventEmitter<boolean>();
  @Output() progressChange = new EventEmitter<PlayerProgress>();
  @Output() playerStateChange = new EventEmitter<EPlayerState>();
  @Output() isPipChange = new EventEmitter<boolean>();
}

interface PlayerProgress {
  currentTime: number;
  duration: number;
}

enum EPlayerState {
  unstarted = 1,
  playing = 2,
  paused = 3,
  ended = 4,
}