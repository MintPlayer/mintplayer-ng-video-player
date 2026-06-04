import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { BsGridComponent, BsGridRowDirective, BsGridColDirective, BsGridColumnDirective, BsColFormLabelDirective } from '@mintplayer/ng-bootstrap/grid';
import { BsListGroupComponent, BsListGroupItemComponent } from '@mintplayer/ng-bootstrap/list-group';
import { BsSelectComponent, BsSelectValueAccessor } from '@mintplayer/ng-bootstrap/select';
import { BsCheckboxComponent } from '@mintplayer/ng-bootstrap/checkbox';
import { VideoPlayerComponent, provideVideoApis } from '@mintplayer/ng-video-player';
import { MockComponent, MockDirective, MockProvider } from 'ng-mocks';
import { PlaylistDemoComponent } from './playlist-demo.component';
import { BsButtonTypeDirective } from '@mintplayer/ng-bootstrap/button-type';

describe('PlaylistDemoComponent', () => {
  let component: PlaylistDemoComponent;
  let fixture: ComponentFixture<PlaylistDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        // Unit to test
        PlaylistDemoComponent,

        // Mock dependencies
        FormsModule,
        MockComponent(BsGridComponent),
        MockDirective(BsGridRowDirective),
        MockDirective(BsGridColDirective),
        MockDirective(BsGridColumnDirective),
        MockDirective(BsColFormLabelDirective),
        MockComponent(BsSelectComponent),
        MockDirective(BsSelectValueAccessor),
        MockComponent(BsListGroupComponent),
        MockComponent(BsListGroupItemComponent),
        MockComponent(BsCheckboxComponent),
        MockDirective(BsButtonTypeDirective),
        MockComponent(VideoPlayerComponent),
      ],
      declarations: [],
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
