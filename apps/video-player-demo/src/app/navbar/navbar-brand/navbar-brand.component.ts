import { Component, HostBinding, Input } from '@angular/core';

@Component({
  selector: 'bs-navbar-brand',
  templateUrl: './navbar-brand.component.html',
  styleUrls: ['./navbar-brand.component.scss']
})
export class BsNavbarBrandComponent {
  @Input() public routerLink: any[] = [];
  @HostBinding('class.mx-auto') mxAuto = true;
}
