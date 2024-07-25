import { isPlatformServer } from '@angular/common';
import { AfterViewInit, Directive, ElementRef, Inject, Input, OnDestroy, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BsNavbarComponent } from '../navbar/navbar.component';

@Directive({
  selector: '[bsNavbarContent]'
})
export class BsNavbarContentDirective implements AfterViewInit, OnDestroy {

  constructor(private element: ElementRef, @Inject(PLATFORM_ID) private platformId: any) {
    combineLatest([this.viewInit$, this.navbar$])
      .pipe(filter(([viewInit, navbar]) => viewInit && !!navbar))
      .pipe(take(1), takeUntilDestroyed())
      .subscribe(([viewInit, navbar]) => {
        if (isPlatformServer(platformId)) {
          this.element.nativeElement.style.paddingTop = (this.initialPadding + 58) + 'px';
        } else {
          // Initialize the ResizeObserver
          this.resizeObserver = new ResizeObserver((entries) => {
            const height = navbar
              ? navbar.nav.nativeElement.offsetHeight
              : entries[0].contentRect.height;

            this.element.nativeElement.style.paddingTop = (this.initialPadding + height) + 'px';
          });

          // Monitor the size
          const px = getComputedStyle(this.element.nativeElement).getPropertyValue('padding-top');
          const pt = parseInt(px.replace(/px$/, ''));
          this.initialPadding = isNaN(pt) ? 0 : pt;
          if (this.resizeObserver && navbar) {
            this.resizeObserver.observe(navbar.nav.nativeElement);
          }
        }
      });
  }

  private viewInit$ = new BehaviorSubject<boolean>(false);
  private navbar$ = new BehaviorSubject<BsNavbarComponent | undefined>(undefined);
  resizeObserver: ResizeObserver | null = null;
  initialPadding = 0;

  @Input('bsNavbarContent') set navbar(value: BsNavbarComponent | undefined) {
    this.navbar$.next(value);
  }
  
  ngAfterViewInit() {
    this.viewInit$.next(true);
  }

  ngOnDestroy() {
    this.resizeObserver?.unobserve(this.navbar$.value?.nav.nativeElement);
  }
}
