import { Component, Input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { PlayerState } from '@mintplayer/ng-video-player';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        // Mock components
        VideoPlayerMockComponent,
      
        AppComponent
      ],
      imports: [FormsModule]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'video-player-demo'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('video-player-demo');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('h1').textContent).toContain(
      'Welcome to video-player-demo!'
    );
  });
});

@Component({
  selector: 'video-player',
  template: `
    <div>
      Video player
    </div>`
})
class VideoPlayerMockComponent {
  @Input() public url!: string;
  @Input() public width!: number;
  @Input() public height!: number;
  @Input() public mute!: boolean;
  @Input() public volume!: number;
  @Input() public autoplay!: boolean;
  @Input() public playerState!: PlayerState;
}