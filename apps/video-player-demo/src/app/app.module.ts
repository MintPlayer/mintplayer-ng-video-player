import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BsNavbarModule } from '@mintplayer/ng-bootstrap/navbar';
import ngVideoPlayerJson from '@mintplayer/ng-video-player/package.json';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, BrowserAnimationsModule, BsNavbarModule, AppRoutingModule],
  providers: [
    { provide: 'VIDEO_PLAYER_VERSION', useValue: ngVideoPlayerJson.version }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
