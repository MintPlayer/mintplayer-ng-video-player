import { AfterContentInit, Component, ContentChildren, Directive, ElementRef, forwardRef, Inject, Optional, QueryList } from '@angular/core';
import { BsNavbarItemComponent } from '../navbar-item/navbar-item.component';
import { BsNavbarDropdownComponent } from '../navbar-dropdown/navbar-dropdown.component';

@Directive({
  // selector: 'bs-navbar-item > a[routerLink]',
  selector: 'bs-navbar-item',
  queries: {
    childDropdowns: new ContentChildren(forwardRef(() => BsNavbarDropdownComponent))
  }
})
export class DropdownToggleDirective implements AfterContentInit {

  constructor(
    private elementRef: ElementRef<HTMLAnchorElement>,
    @Inject(forwardRef(() => BsNavbarItemComponent)) private bsNavbarItem: BsNavbarItemComponent,
    @Optional() @Inject(forwardRef(() => BsNavbarDropdownComponent)) parentDropdown: BsNavbarDropdownComponent
  ) {
  }

  childDropdowns!: QueryList<BsNavbarDropdownComponent>;

  ngAfterContentInit() {
    if (this.bsNavbarItem.dropdowns.length > 0) {
      this.bsNavbarItem.hasDropdown = true;
    }
  }
}