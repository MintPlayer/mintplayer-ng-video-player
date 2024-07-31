import { ApplicationConfig } from '@angular/core';
import { PreloadAllModules, provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling, withPreloading } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import ngVideoPlayerJson from '@mintplayer/ng-video-player/package.json';
import { APP_BASE_HREF } from '@angular/common';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter([
      { path: '', loadChildren: () => import('./pages/pages.routes').then(m => m.ROUTES) }
    ],
      withPreloading(PreloadAllModules),
      withEnabledBlockingInitialNavigation(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      })
    ),
    provideAnimations(),
    { provide: APP_BASE_HREF, useFactory: () => document.getElementsByTagName('base')[0].href.slice(0, -1) },
    { provide: 'VIDEO_PLAYER_VERSION', useValue: ngVideoPlayerJson.version }
  ]
}
