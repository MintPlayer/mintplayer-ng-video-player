import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { SoundcloudDemoComponent } from './soundcloud-demo.component';

describe('SoundcloudDemoComponent', () => {
  let component: SoundcloudDemoComponent;
  let fixture: ComponentFixture<SoundcloudDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule
      ],
      declarations: [
        // Unit to test
        SoundcloudDemoComponent,
      
        // Mock dependencies
        SoundcloudPlayerMockComponent
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SoundcloudDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it(`should have as title 'SoundCloud player'`, () => {
    expect(component.title).toEqual('SoundCloud player');
  });

  it('should render title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain(
      'Welcome to SoundCloud player!'
    );
  });
});

interface PlayerProgress {
  currentTime: number;
  duration: number;
}

enum PlayerState {
  UNSTARTED = 'unstarted',
  PLAYING = 'playing',
  PAUSED = 'paused',
  ENDED = 'ended',
}

@Component({
  selector: 'soundcloud-player',
  template: '<div>Soundcloud player</div>'
})
class SoundcloudPlayerMockComponent {
  @Input() width = 400;
  @Input() height = 300;
  @Input() videoId = '';
  @Input() autoplay = true;

  @Output() playerStateChange = new EventEmitter<PlayerState>();
  @Output() progressChange = new EventEmitter<PlayerProgress>();

  playVideo(soundCloudId: string) {
    this.videoId = soundCloudId;
  }
}