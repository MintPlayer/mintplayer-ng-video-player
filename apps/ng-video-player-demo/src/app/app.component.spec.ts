import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { RouterTestingModule } from '@angular/router/testing';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { PlayerState } from '@mintplayer/ng-video-player';
import { FormsModule } from '@angular/forms';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        RouterTestingModule.withRoutes([]),
      ],
      declarations: [
        // Unit to test
        AppComponent,
      
        // Mock dependencies
        MockVideoPlayerComponent,
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'ng-video-player-demo'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('video-player-demo');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain(
      'Welcome to video-player-demo!'
    );
  });
});

@Component({
  selector: 'video-player',
  template: `<div>Video player</div>`
})
class MockVideoPlayerComponent {
  @Input() width!: number;
  @Input() height!: number;
  @Input() autoplay!: boolean;
  @Input() url!: string;
  @Input() volume!: number;
  @Input() mute!: boolean;
  @Input() playerState!: PlayerState;

  @Output() progressChange = new EventEmitter<number>();
  @Output() volumeChange = new EventEmitter<number>();
  @Output() muteChange = new EventEmitter<boolean>();
  @Output() playerStateChange = new EventEmitter<PlayerState>();
  @Output() isPipChange = new EventEmitter<boolean>();

}