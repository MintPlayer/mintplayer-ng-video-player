import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Color } from '@mintplayer/ng-bootstrap';
import { BsNavbarModule } from '@mintplayer/ng-bootstrap/navbar';

@Component({
  selector: 'mintplayer-ng-video-player-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [BsNavbarModule, RouterOutlet, RouterLink]
})
export class AppComponent {
  versionInfo = '';
  colors = Color;
  title = '@mintplayer/ng-video-player';
}
