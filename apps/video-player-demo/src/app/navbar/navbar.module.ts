import { NgModule } from '@angular/core';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { ClickOutsideDirective } from '@mintplayer/ng-click-outside';
import { BsUserAgentDirective } from '@mintplayer/ng-bootstrap/user-agent';
import { BsNoNoscriptDirective } from '@mintplayer/ng-bootstrap/no-noscript';
import { BsHasOverlayComponent } from '@mintplayer/ng-bootstrap/has-overlay';
import { BsDropdownDividerDirective } from '@mintplayer/ng-bootstrap/dropdown-divider';
import { BsContainerComponent } from '@mintplayer/ng-bootstrap/container';
import { BsNavbarTogglerComponent } from '@mintplayer/ng-bootstrap/navbar-toggler';
import { BsNavbarComponent } from './navbar/navbar.component';
import { BsNavbarNavComponent } from './navbar-nav/navbar-nav.component';
import { BsNavbarDropdownComponent } from './navbar-dropdown/navbar-dropdown.component';
import { BsNavbarItemComponent } from './navbar-item/navbar-item.component';
import { DropdownToggleDirective } from './dropdown-toggle/dropdown-toggle.directive';
import { NavLinkDirective } from './nav-link/nav-link.directive';
import { BsNavbarContentDirective } from './navbar-content/navbar-content.directive';
import { BsNavbarBrandComponent } from './navbar-brand/navbar-brand.component';
import { BsExpandButtonDirective } from './expand-button/expand-button.directive';

@NgModule({
  declarations: [
    BsNavbarComponent,
    BsNavbarNavComponent,
    BsNavbarDropdownComponent,
    BsNavbarItemComponent,

    DropdownToggleDirective,
    NavLinkDirective,
    BsNavbarContentDirective,
    BsNavbarBrandComponent,
    BsExpandButtonDirective,
  ],
  imports: [
    AsyncPipe,
    NgTemplateOutlet,
    ClickOutsideDirective,
    BsContainerComponent,
    BsUserAgentDirective,
    BsNoNoscriptDirective,
    BsHasOverlayComponent,
    BsDropdownDividerDirective,
    BsNavbarTogglerComponent,
  ],
  exports: [
    BsNavbarComponent,
    BsNavbarNavComponent,
    BsNavbarDropdownComponent,
    BsNavbarItemComponent,

    DropdownToggleDirective,
    NavLinkDirective,
    BsNavbarContentDirective,
    BsNavbarBrandComponent,
    BsExpandButtonDirective,

    BsDropdownDividerDirective,
    BsNavbarTogglerComponent
  ]
})
export class BsNavbarModule { }
