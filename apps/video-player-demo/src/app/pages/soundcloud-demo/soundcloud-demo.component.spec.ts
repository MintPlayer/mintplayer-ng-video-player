import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { BsFormModule } from '@mintplayer/ng-bootstrap/form';
import { BsGridModule } from '@mintplayer/ng-bootstrap/grid';
import { BsInputGroupModule } from '@mintplayer/ng-bootstrap/input-group';
import { BsButtonTypeModule } from '@mintplayer/ng-bootstrap/button-type';
import { BsButtonGroupModule } from '@mintplayer/ng-bootstrap/button-group';
import { BsToggleButtonModule } from '@mintplayer/ng-bootstrap/toggle-button';
import { MockModule } from 'ng-mocks';

import { SoundcloudDemoComponent } from './soundcloud-demo.component';
import { SoundcloudPlayerModule } from '@mintplayer/ng-soundcloud-player';

describe('SoundcloudDemoComponent', () => {
  let component: SoundcloudDemoComponent;
  let fixture: ComponentFixture<SoundcloudDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        MockModule(BsFormModule),
        MockModule(BsGridModule),
        MockModule(BsInputGroupModule),
        MockModule(BsToggleButtonModule),
        MockModule(BsButtonTypeModule),
        MockModule(BsButtonGroupModule),
        MockModule(SoundcloudPlayerModule)
      ],
      declarations: [
        // Unit to test
        SoundcloudDemoComponent,
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
