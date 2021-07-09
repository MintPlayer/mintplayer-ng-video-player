import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { VideoPlayerModule } from '@mintplayer/ng-video-player';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    FormsModule,
    VideoPlayerModule
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
