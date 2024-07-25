import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { APP_BASE_HREF } from '@angular/common';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter([]),
    provideAnimations(),
    { provide: APP_BASE_HREF, useFactory: () => document.getElementsByTagName('base')[0].href.slice(0, -1) },
    { provide: 'VIDEO_PLAYER_VERSION', useValue: '' }
  ]
}
