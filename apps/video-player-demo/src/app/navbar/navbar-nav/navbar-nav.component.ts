import { Component, HostListener, Input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SlideUpDownAnimation } from '@mintplayer/ng-animations';
import { BehaviorSubject, combineLatest, debounceTime, filter, map, Observable } from 'rxjs';
import { BsNavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'bs-navbar-nav',
  templateUrl: './navbar-nav.component.html',
  styleUrls: ['./navbar-nav.component.scss'],
  animations: [SlideUpDownAnimation]
})
export class BsNavbarNavComponent {

  constructor(bsNavbar: BsNavbarComponent) {
    this.bsNavbar = bsNavbar;
    this.showNavs$ = combineLatest([this.bsNavbar.isExpanded$, this.bsNavbar.expandAt$, this.windowWidth$])
      .pipe(filter(([isExpanded, expandAt, windowWidth]) => {
        return windowWidth !== null;
      }))
      .pipe(map(([isExpanded, expandAt, windowWidth]) => {
        if (windowWidth === null) {
          throw 'windowWidth should not be null here';
        } else if (expandAt === null) {
          return isExpanded;
        } else if (windowWidth >= expandAt) {
          return true;
        } else {
          return isExpanded;
        }
      }));

    this.windowWidth$
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe(() => this.isResizing$.next(false));
    this.onWindowResize();
  }
  
  bsNavbar: BsNavbarComponent;
  collapse$ = new BehaviorSubject<boolean>(true);
  windowWidth$ = new BehaviorSubject<number | null>(null);
  showNavs$: Observable<boolean>;
  isResizing$ = new BehaviorSubject<boolean>(false);
  
  //#region collapse
  @Input() public set collapse(value: boolean) {
    this.collapse$.next(value);
  }
  public get collapse() {
    return this.collapse$.value;
  }
  //#endregion

  @HostListener('window:resize')
  onWindowResize() {
    this.isResizing$.next(true);
    if (typeof window !== 'undefined') {
      this.windowWidth$.next(window.innerWidth);
    }
  }
}
