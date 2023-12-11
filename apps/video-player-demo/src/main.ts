import { enableProdMode, StaticProvider } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

const getBaseUrl = () => {
  return document.getElementsByTagName('base')[0].href.slice(0, -1);
}

const providers: StaticProvider[] = [
  { provide: APP_BASE_HREF, useFactory: getBaseUrl },
]

platformBrowserDynamic(providers)
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
