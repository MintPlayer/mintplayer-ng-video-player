import { AfterContentChecked, Component, ContentChildren, DestroyRef, ElementRef, forwardRef, Inject, Optional, PLATFORM_ID, QueryList, ViewContainerRef } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BsNavbarComponent } from '../navbar/navbar.component';
import { BsNavbarDropdownComponent } from '../navbar-dropdown/navbar-dropdown.component';

@Component({
  selector: 'bs-navbar-item',
  templateUrl: './navbar-item.component.html',
  styleUrls: ['./navbar-item.component.scss']
})
export class BsNavbarItemComponent implements AfterContentChecked {

  constructor(
    private navbar: BsNavbarComponent,
    element: ElementRef,
    private destroy: DestroyRef,
    @Inject(PLATFORM_ID) private platformId: Object,
    @Optional() parentDropdown: BsNavbarDropdownComponent,
  ) {
    this.element = element;
    this.parentDropdown = parentDropdown;
  }

  element: ElementRef;
  parentDropdown: BsNavbarDropdownComponent;
  hasDropdown = false;
  anchorTag: HTMLAnchorElement | null = null;
  @ContentChildren(forwardRef(() => BsNavbarDropdownComponent)) dropdowns!: QueryList<BsNavbarDropdownComponent>;

  ngAfterContentChecked() {
    this.anchorTag = this.element.nativeElement.querySelector('li a');

    if (this.hasDropdown) {
      if (this.anchorTag) {
        this.anchorTag.classList.add('dropdown-toggle');

        if (isPlatformServer(this.platformId)) {
          this.anchorTag.href = 'javascript:;';
        }
  
        if (!this.anchorTag.getAttribute('close-init-b')) {
          this.anchorTag.setAttribute('close-init-b', '1');
          this.anchorTag.addEventListener('click', (ev: MouseEvent) => {
            ev.preventDefault();
            // Normally there should be only one dropdown in this list
            this.dropdowns.forEach((dropdown) => {
              if (!(dropdown.isVisible = !dropdown.isVisible)) {
                dropdown.childDropdowns.forEach((child) => child.isVisible = false);
              } else if (this.parentDropdown) {
                // import('@angular/cdk/overlay').then(({ OverlayModule, Overlay }) => {
                //   const overlayService = this.injector.get(Overlay);
                //   return overlayService;
                // }).then((overlayService) => {

                //   const p = new DomPortal(dropdown.element);
                //   const overlayRef = overlayService.create({
                //     positionStrategy: overlayService.position()
                //       .flexibleConnectedTo(this.element)
                //       .withPositions([
                //         { originX: 'end', originY: 'top', overlayX: 'start', overlayY: 'top' }
                //       ])
                //   });
                  // overlayRef.attach(p);

                // });
                // dropdown.showInOverlay = true;

                this.navbar.isSmallMode$
                  .pipe(takeUntilDestroyed(this.destroy))
                  .subscribe((isSmallMode) => dropdown.showInOverlay = !isSmallMode);
              }
            });
            return false;
          });
        }
      }
    } else {

      // Close if this is a link
      if ((this.dropdowns.length === 0) && this.anchorTag && !this.anchorTag.getAttribute('close-init-a')) {
        this.anchorTag.setAttribute('close-init-a', '1');
        this.anchorTag.addEventListener('click', (ev: MouseEvent) => {
          let d = this.parentDropdown;
          while (d && d.autoclose) {
            d.isVisible = false;
            d = d.parentDropdown;
          }
          if (this.navbar.autoclose) {
            this.navbar.isExpanded$.next(false);
          }
        });
      }

    }
  }
}
