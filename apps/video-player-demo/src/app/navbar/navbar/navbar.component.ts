import { Component, ElementRef, HostListener, Input, TemplateRef, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Breakpoint, Color } from '@mintplayer/ng-bootstrap';
import { BehaviorSubject, combineLatest, debounceTime, filter, map, Observable, take } from 'rxjs';

@Component({
  selector: 'bs-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class BsNavbarComponent {

  constructor() {
    this.expandAt$ = this.breakPoint$
      .pipe(map((breakpoint) => {
        switch (breakpoint) {
          case 'xxl': return 1400;
          case 'xl': return 1200;
          case 'lg': return 992;
          case 'md': return 768;
          case 'sm': return 576;
          case 'xs': return 0;
          default: return null;
        }
      }));

    this.isSmallMode$ = combineLatest([this.expandAt$, this.windowWidth$])
      .pipe(filter(([expandAt, windowWidth]) => {
        return windowWidth !== null;
      }))
      .pipe(map(([expandAt, windowWidth]) => {
        if (windowWidth === null) {
          throw 'windowWidth should not be null here';
        } else if (!expandAt) {
          return true;
        } else if (windowWidth >= expandAt) {
          return false;
        } else {
          return true;
        }
      }));

    this.windowWidth$
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe(() => this.isResizing$.next(false));

    this.onWindowResize();

    this.expandClass$ = this.breakPoint$.pipe(map((breakpoint) => {
      if (breakpoint === null) {
        return null;
      } else {
        return `navbar-expand-${breakpoint}`;
      }
    }));
    this.wAutoClass$ = this.breakPoint$.pipe(map((breakpoint) => {
      if (breakpoint === null) {
        return null;
      } else {
        return `w-${breakpoint}-auto`;
      }
    }));
    this.dNoneClass$ = this.breakPoint$.pipe(map((breakpoint) => {
      if (breakpoint === null) {
        return null;
      } else {
        return `d-${breakpoint}-none`;
      }
    }));

    this.backgroundColorClass$ = this.color$.pipe(map((color) => {
      switch (color) {
        case Color.light:
        case null:
          return ['navbar-light'];
        default:
          return ['navbar-dark', `bg-${Color[color]}`];
      }
    }));

    this.navClassList$ = combineLatest([this.expandClass$, this.backgroundColorClass$])
      .pipe(map(([expandClass, backgroundColorClass]) => {
        const result: string[] = [];
        return result.concat(expandClass ?? [], ...backgroundColorClass);
      }));
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.isResizing$.next(true);
    if (typeof window !== 'undefined') {
      this.windowWidth$.next(window.innerWidth);
    }
  }

  @ViewChild('nav') nav!: ElementRef;
  @Input() autoclose = true;

  expandButtonTemplate: TemplateRef<any> | null = null;
  
  
  expandClass$: Observable<string | null>;
  wAutoClass$: Observable<string | null>;
  dNoneClass$: Observable<string | null>;
  isExpanded$ = new BehaviorSubject<boolean>(false);
  windowWidth$ = new BehaviorSubject<number | null>(null);
  isResizing$ = new BehaviorSubject<boolean>(false);
  expandAt$: Observable<number | null>;
  isSmallMode$: Observable<boolean>;
  backgroundColorClass$: Observable<string[]>;
  navClassList$: Observable<string[]>;

  toggleExpanded() {
    this.isExpanded$.pipe(take(1)).subscribe((isExpanded) => {
      this.isExpanded$.next(!isExpanded);
    });
  }

  //#region Color
  color$ = new BehaviorSubject<Color | null>(null);
  public get color() {
    return this.color$.value;
  }
  @Input() public set color(value: Color | null) {
    this.color$.next(value);
  }
  //#endregion

  //#region Breakpoint
  breakPoint$ = new BehaviorSubject<Breakpoint | null>('md');
  public get breakpoint() {
    return this.breakPoint$.value;
  }
  @Input() public set breakpoint(value: Breakpoint | null) {
    this.breakPoint$.next(value);
  }
  //#endregion

  
}
