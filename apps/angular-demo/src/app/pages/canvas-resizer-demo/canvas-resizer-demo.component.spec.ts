global.ResizeObserver = require('resize-observer-polyfill');
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CanvasResizerDemoComponent } from './canvas-resizer-demo.component';
import { MockModule } from 'ng-mocks';
import { BsGridModule } from '@mintplayer/ng-bootstrap/grid';

describe('CanvasResizerDemoComponent', () => {
  let component: CanvasResizerDemoComponent;
  let fixture: ComponentFixture<CanvasResizerDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        // Unit to test
        CanvasResizerDemoComponent,
        
        // Mock dependencies
        MockModule(BsGridModule)
      ],
      declarations: []
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
