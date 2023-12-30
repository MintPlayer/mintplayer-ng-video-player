import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CanvasResizerDemoComponent } from './canvas-resizer-demo.component';

describe('CanvasResizerDemoComponent', () => {
  let component: CanvasResizerDemoComponent;
  let fixture: ComponentFixture<CanvasResizerDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CanvasResizerDemoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CanvasResizerDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
