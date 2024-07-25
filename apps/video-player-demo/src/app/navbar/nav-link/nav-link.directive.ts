import { Directive, ElementRef, forwardRef, HostBinding, Inject, Optional, PLATFORM_ID } from '@angular/core';
import { BsNavbarDropdownComponent } from '../navbar-dropdown/navbar-dropdown.component';
import { BsNavbarComponent } from '../navbar/navbar.component';

@Directive({
  selector: 'bs-navbar-item > li > a'
  // Below selector doesn't work well either (does not select the github link)
  // selector: 'bs-navbar-item > a[routerLink]'
  // Below selector seems to target other a's that aren't even remotely inside a bs-navbar-item
  // selector: 'bs-navbar-item:first-child > a'
})
export class NavLinkDirective {

  constructor(
    private elementRef: ElementRef<HTMLAnchorElement>,
    @Optional() parentNavbar: BsNavbarComponent,
    @Optional() @Inject(forwardRef(() => BsNavbarDropdownComponent)) parentDropdown: BsNavbarDropdownComponent
  ) {
    if (parentNavbar) {
      if (parentDropdown == null) {
        this.elementRef.nativeElement.classList.add('nav-link');
      } else {
        this.elementRef.nativeElement.classList.add('dropdown-item');
      }
    }
    this.cursorPointer = !!parentNavbar;
  }

  @HostBinding('class.cursor-pointer') cursorPointer: boolean;

}