import { Component, ContentChildren, forwardRef, Input, QueryList } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: 'youtube', component: YoutubeMockComponent },
          { path: 'dailymotion', component: DailymotionMockComponent },
          { path: 'vimeo', component: VimeoMockComponent },
          { path: 'soundcloud', component: SoundcloudMockComponent },
          { path: 'video', component: VideoMockComponent },
          { path: 'playlist', component: PlaylistMockComponent },
        ])
      ],
      declarations: [
        AppComponent,
      
        // Mock pages
        YoutubeMockComponent,
        DailymotionMockComponent,
        VimeoMockComponent,
        SoundcloudMockComponent,
        VideoMockComponent,
        PlaylistMockComponent,
        
        // Mock components
        BsNavbarMockComponent,
        BsNavbarNavMockComponent,
        BsNavbarDropdownMockComponent,
        BsNavbarItemMockComponent,
      ],
      providers: [
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

@Component({
  selector: 'youtube-mock-page',
  template: `<div>Youtube</div>`
})
class YoutubeMockComponent { }

@Component({
  selector: 'dailymotion-mock-page',
  template: `<div>Dailymotion</div>`
})
class DailymotionMockComponent { }

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
