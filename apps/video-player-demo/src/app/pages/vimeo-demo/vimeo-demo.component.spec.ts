import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VimeoDemoComponent } from './vimeo-demo.component';

describe('VimeoDemoComponent', () => {
  let component: VimeoDemoComponent;
  let fixture: ComponentFixture<VimeoDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VimeoDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VimeoDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
