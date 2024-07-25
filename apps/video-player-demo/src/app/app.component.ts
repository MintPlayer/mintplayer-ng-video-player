import { Component } from '@angular/core';
import { BsNavbarModule } from '@mintplayer/ng-bootstrap/navbar';
// import { BsNavbarModule } from './navbar/navbar.module';


@Component({
  selector: 'mintplayer-ng-video-player-root',
  template: `<h1>&#64;mintplayer/ng-video-player</h1>`,
  standalone: true,
  imports: [BsNavbarModule]
})
export class AppComponent {}
