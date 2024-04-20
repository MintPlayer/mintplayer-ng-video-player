import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { BsGridModule } from '@mintplayer/ng-bootstrap/grid';
import { BsListGroupModule } from '@mintplayer/ng-bootstrap/list-group';
import { BsSelectModule } from '@mintplayer/ng-bootstrap/select';
import { BsToggleButtonModule } from '@mintplayer/ng-bootstrap/toggle-button';
import { VideoPlayerComponent, provideVideoApis } from '@mintplayer/ng-video-player';
import { MockComponent, MockDirective, MockModule, MockProvider } from 'ng-mocks';
import { PlaylistDemoComponent } from './playlist-demo.component';
import { BsButtonTypeDirective } from '@mintplayer/ng-bootstrap/button-type';

describe('PlaylistDemoComponent', () => {
  let component: PlaylistDemoComponent;
  let fixture: ComponentFixture<PlaylistDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        MockModule(BsGridModule),
        MockModule(BsSelectModule),
        MockModule(BsListGroupModule),
        MockModule(BsToggleButtonModule),
        MockDirective(BsButtonTypeDirective)
      ],
      declarations: [
        // Unit to test
        PlaylistDemoComponent,
      
        // Mock dependencies
        MockComponent(VideoPlayerComponent),
      ],
      providers: [
        provideVideoApis(),
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
