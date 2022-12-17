import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { BsButtonGroupModule } from '@mintplayer/ng-bootstrap/button-group';
import { BsButtonTypeModule } from '@mintplayer/ng-bootstrap/button-type';
import { BsGridModule } from '@mintplayer/ng-bootstrap/grid';
import { BsInputGroupModule } from '@mintplayer/ng-bootstrap/input-group';
import { BsListGroupModule } from '@mintplayer/ng-bootstrap/list-group';
import { BsRangeModule } from '@mintplayer/ng-bootstrap/range';
import { BsToggleButtonModule } from '@mintplayer/ng-bootstrap/toggle-button';
import { VideoPlayerComponent } from '@mintplayer/ng-video-player';
import { MockComponent, MockModule } from 'ng-mocks';

import { VideoDemoComponent } from './video-demo.component';

describe('VideoDemoComponent', () => {
  let component: VideoDemoComponent;
  let fixture: ComponentFixture<VideoDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        MockModule(BsGridModule),
        MockModule(BsRangeModule),
        MockModule(BsListGroupModule),
        MockModule(BsInputGroupModule),
        MockModule(BsButtonTypeModule),
        MockModule(BsButtonGroupModule),
        MockModule(BsToggleButtonModule),
      ],
      declarations: [
        // Unit to test  
        VideoDemoComponent,

        // Mock dependencies
        MockComponent(VideoPlayerComponent),
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
