import { AfterViewInit, Directive, ElementRef, HostBinding, OnDestroy } from '@angular/core';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'canvas[canvasResizer]',
  standalone: true,
})
export class CanvasResizerDirective implements AfterViewInit, OnDestroy {
  constructor(private element: ElementRef) {
    this.observer = new ResizeObserver((entries) => {
      requestAnimationFrame(() => this.onResize(entries));
    });
  }

  observer: ResizeObserver;
  @HostBinding('attr.width') width?: number;
  @HostBinding('attr.height') height?: number;

  onResize(entries: ResizeObserverEntry[]) {
    this.width = entries[0].borderBoxSize[0].inlineSize;
    this.height = entries[0].borderBoxSize[0].blockSize;
  }

  ngAfterViewInit() {
    this.observer.observe(this.element.nativeElement, { box: 'border-box' });
  }

  ngOnDestroy() {
    this.observer.unobserve(this.element.nativeElement);
  }
}
