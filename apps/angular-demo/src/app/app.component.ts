import { ViewportScroller } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Color } from '@mintplayer/ng-bootstrap';
import { BsNavbarComponent, BsNavbarBrandComponent, BsNavbarContentDirective, BsNavbarDropdownComponent, BsNavbarItemComponent, BsNavbarNavComponent, BsNavbarTriggerDirective, BsExpandButtonDirective, DropdownToggleDirective, NavLinkDirective } from '@mintplayer/ng-bootstrap/navbar';

@Component({
  selector: 'mintplayer-ng-video-player-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [BsNavbarComponent, BsNavbarBrandComponent, BsNavbarContentDirective, BsNavbarDropdownComponent, BsNavbarItemComponent, BsNavbarNavComponent, BsNavbarTriggerDirective, BsExpandButtonDirective, DropdownToggleDirective, NavLinkDirective, RouterOutlet, RouterLink]
})
export class AppComponent {
  constructor(@Inject('VIDEO_PLAYER_VERSION') videoPlayerVersion: string, scroller: ViewportScroller) {
    this.versionInfo = videoPlayerVersion;
    scroller.setOffset([0, 56]);
  }
  
  versionInfo = '';
  colors = Color;
  title = '@mintplayer/ng-video-player';
}
