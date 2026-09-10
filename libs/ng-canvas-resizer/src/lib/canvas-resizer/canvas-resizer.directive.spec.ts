import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CanvasResizerDirective } from './canvas-resizer.directive';

/**
 * jsdom has no ResizeObserver and never lays anything out, so the real one
 * would never fire. This stand-in records what was observed and lets a test
 * drive the callback with the entry shape the directive reads.
 */
class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];

  observed: { target: unknown; options?: ResizeObserverOptions }[] = [];
  unobserved: unknown[] = [];
  disconnected = 0;

  constructor(private callback: ResizeObserverCallback) {
    FakeResizeObserver.instances.push(this);
  }

  observe(target: Element, options?: ResizeObserverOptions) {
    this.observed.push({ target, options });
  }

  unobserve(target: Element) {
    this.unobserved.push(target);
  }

  disconnect() {
    this.disconnected++;
  }

  /** Fire the callback with one entry reporting the given border box. */
  emit(inlineSize: number, blockSize: number) {
    const entry = {
      borderBoxSize: [{ inlineSize, blockSize }],
    } as unknown as ResizeObserverEntry;
    this.callback([entry], this as unknown as ResizeObserver);
  }
}

@Component({
  standalone: true,
  imports: [CanvasResizerDirective],
  template: '<canvas canvasResizer></canvas>',
})
class HostComponent {
  @ViewChild(CanvasResizerDirective, { static: true })
  directive!: CanvasResizerDirective;
}

describe('CanvasResizerDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let canvas: HTMLCanvasElement;
  let observer: FakeResizeObserver;
  let originalResizeObserver: typeof ResizeObserver | undefined;

  beforeEach(async () => {
    FakeResizeObserver.instances = [];
    originalResizeObserver = (
      globalThis as { ResizeObserver?: typeof ResizeObserver }
    ).ResizeObserver;
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver =
      FakeResizeObserver;

    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    canvas = fixture.nativeElement.querySelector('canvas');
    observer = FakeResizeObserver.instances[0];
  });

  afterEach(() => {
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver =
      originalResizeObserver;
  });

  /**
   * The directive defers onResize to requestAnimationFrame, so a resize is
   * only visible a frame later. Queueing our own frame behind it is enough,
   * because rAF callbacks run in the order they were registered.
   *
   * The directive writes the attributes itself, so no change detection is
   * involved once the frame has run.
   */
  async function afterFrame() {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve())
    );
  }

  it('applies to a canvas and starts with no explicit size', () => {
    fixture.detectChanges();

    expect(fixture.componentInstance.directive).toBeTruthy();
    expect(canvas.hasAttribute('width')).toBe(false);
    expect(canvas.hasAttribute('height')).toBe(false);
  });

  it('builds exactly one observer per directive instance', () => {
    fixture.detectChanges();
    fixture.detectChanges();

    expect(FakeResizeObserver.instances).toHaveLength(1);
  });

  it('observes its own element by border box after the view initialises', () => {
    fixture.detectChanges();

    expect(observer.observed).toHaveLength(1);
    expect(observer.observed[0].target).toBe(canvas);
    // Border box, not content box: the canvas backing store has to match the
    // element's rendered box or the drawing comes out scaled.
    expect(observer.observed[0].options).toEqual({ box: 'border-box' });
  });

  it('does not observe until the view has initialised', () => {
    // The observer is built in the constructor; observe() waits for
    // ngAfterViewInit, so the element is attached by the time it is watched.
    expect(observer.observed).toEqual([]);
  });

  it('mirrors the observed border box onto the width and height attributes', async () => {
    fixture.detectChanges();

    observer.emit(640, 480);
    await afterFrame();

    expect(fixture.componentInstance.directive.width).toBe(640);
    expect(fixture.componentInstance.directive.height).toBe(480);
    expect(canvas.getAttribute('width')).toBe('640');
    expect(canvas.getAttribute('height')).toBe('480');
  });

  it('tracks every subsequent resize', async () => {
    fixture.detectChanges();

    observer.emit(640, 480);
    await afterFrame();
    observer.emit(800, 600);
    await afterFrame();

    expect(canvas.getAttribute('width')).toBe('800');
    expect(canvas.getAttribute('height')).toBe('600');
  });

  it('reads only the first entry, as it only ever observes one element', async () => {
    fixture.detectChanges();
    const entries = [
      { borderBoxSize: [{ inlineSize: 100, blockSize: 200 }] },
      { borderBoxSize: [{ inlineSize: 999, blockSize: 999 }] },
    ] as unknown as ResizeObserverEntry[];

    fixture.componentInstance.directive.onResize(entries);
    await afterFrame();

    expect(fixture.componentInstance.directive.width).toBe(100);
    expect(fixture.componentInstance.directive.height).toBe(200);
  });

  it('unobserves its element on destroy', () => {
    fixture.detectChanges();

    fixture.destroy();

    expect(observer.unobserved).toEqual([canvas]);
  });
});
