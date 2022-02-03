import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailymotionDemoComponent } from './dailymotion-demo.component';

describe('DailymotionDemoComponent', () => {
  let component: DailymotionDemoComponent;
  let fixture: ComponentFixture<DailymotionDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DailymotionDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DailymotionDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
