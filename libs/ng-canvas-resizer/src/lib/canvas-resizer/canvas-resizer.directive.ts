import { AfterViewInit, Directive, ElementRef, OnDestroy, Renderer2 } from '@angular/core';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'canvas[canvasResizer]',
  standalone: true,
})
export class CanvasResizerDirective implements AfterViewInit, OnDestroy {
  constructor(private element: ElementRef, private renderer: Renderer2) {
    this.observer = new ResizeObserver((entries) => {
      requestAnimationFrame(() => this.onResize(entries));
    });
  }

  observer: ResizeObserver;
  width?: number;
  height?: number;

  /**
   * Writes the size onto the element directly rather than through
   * `@HostBinding('attr.width')`, which is what this used to do.
   *
   * The host binding applied exactly once: these fields are written from a
   * ResizeObserver's animation-frame callback, outside anything Angular
   * tracks, so nothing ever invalidated the binding again — the canvas kept
   * whatever size it had at first render and every later resize was silently
   * dropped. Marking the host view dirty and forcing change detection did not
   * bring it back either.
   *
   * Attributes, not styles: on a canvas these size the backing store, and a
   * mismatch with the rendered box is what makes the drawing come out
   * stretched. Renderer2 so the write still goes through Angular's renderer.
   */
  onResize(entries: ResizeObserverEntry[]) {
    this.width = entries[0].borderBoxSize[0].inlineSize;
    this.height = entries[0].borderBoxSize[0].blockSize;

    const canvas = this.element.nativeElement;
    this.renderer.setAttribute(canvas, 'width', String(this.width));
    this.renderer.setAttribute(canvas, 'height', String(this.height));
  }

  ngAfterViewInit() {
    this.observer.observe(this.element.nativeElement, { box: 'border-box' });
  }

  ngOnDestroy() {
    this.observer.unobserve(this.element.nativeElement);
  }
}
