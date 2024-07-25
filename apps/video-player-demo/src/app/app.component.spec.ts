import { Component, ContentChildren, Directive, forwardRef, Input, QueryList } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { MockModule } from 'ng-mocks';
import { BsNavbarModule } from '@mintplayer/ng-bootstrap/navbar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        
        // Mock components
        MockModule(BsNavbarModule),
      ],
      declarations: [
        // Mock pages
        YoutubeMockComponent,
        VimeoMockComponent,
        SoundcloudMockComponent,
        VideoMockComponent,
        PlaylistMockComponent,
      ],
      providers: [
        provideRouter([
          { path: 'youtube', component: YoutubeMockComponent },
          { path: 'vimeo', component: VimeoMockComponent },
          { path: 'soundcloud', component: SoundcloudMockComponent },
          { path: 'video', component: VideoMockComponent },
          { path: 'playlist', component: PlaylistMockComponent },
        ]),
        provideNoopAnimations(),
        { provide: 'VIDEO_PLAYER_VERSION', useValue: '1.0.0' }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title '@mintplayer/ng-video-player'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('@mintplayer/ng-video-player');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain(
      '@mintplayer/ng-video-player'
    );
  });
});

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

enum Color {
  primary = 0,
  secondary = 1,
  success = 2,
  danger = 3,
  warning = 4,
  info = 5,
  light = 6,
  dark = 7,
  body = 8,
  white = 9,
  transparent = 10
}

@Component({
  selector: 'youtube-mock-page',
  template: `<div>Youtube</div>`
})
class YoutubeMockComponent { }

@Component({
  selector: 'vimeo-mock-page',
  template: `<div>Vimeo</div>`
})
class VimeoMockComponent { }

@Component({
  selector: 'soundcloud-mock-page',
  template: `<div>Soundcloud</div>`
})
class SoundcloudMockComponent { }

@Component({
  selector: 'video-mock-page',
  template: `<div>Video</div>`
})
class VideoMockComponent { }

@Component({
  selector: 'playlist-mock-page',
  template: `<div>Playlist</div>`
})
class PlaylistMockComponent { }

@Component({
  selector: 'bs-navbar',
  template: `
  <nav>
    <div>
      <ng-content></ng-content>
    </div>  
  </nav>`
})
class BsNavbarMockComponent {
  @Input() color?: Color;
  @Input() breakpoint?: Breakpoint;
}

@Component({
  selector: 'bs-navbar-nav',
  template: `
  <div>
    <ul>
      <ng-content></ng-content>
    </ul>  
  </div>`
})
class BsNavbarNavMockComponent {
  @Input() collapse = true;
}

@Component({
  selector: 'bs-navbar-brand',
  template: `
  <div>
    <ng-content></ng-content>
  </div>`
})
class BsNavbarBrandMockComponent {}

@Component({
  selector: 'bs-navbar-dropdown',
  template: `
  <ul>
    <ng-content></ng-content>
  </ul>`,
  providers: [
    // { provide: BsNavbarDropdownComponent, useExisting: BsNavbarDropdownMockComponent }
  ]
})
class BsNavbarDropdownMockComponent {
}

@Component({
  selector: 'bs-navbar-item',
  template: `
  <li>
    <ng-content></ng-content>
  </li>`,
  providers: [
    // { provide: BsNavbarItemComponent, useExisting: BsNavbarItemMockComponent }
  ]
})
class BsNavbarItemMockComponent {
  @ContentChildren(forwardRef(() => BsNavbarDropdownMockComponent)) dropdowns!: QueryList<BsNavbarDropdownMockComponent>;
}

@Directive({
  selector: '[bsNavbarContent]'
})
class BsNavbarContentMockDirective {
  @Input('bsNavbarContent') navbar!: BsNavbarMockComponent;
}
