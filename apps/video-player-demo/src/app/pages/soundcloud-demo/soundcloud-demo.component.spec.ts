import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoundcloudDemoComponent } from './soundcloud-demo.component';

describe('SoundcloudDemoComponent', () => {
  let component: SoundcloudDemoComponent;
  let fixture: ComponentFixture<SoundcloudDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SoundcloudDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SoundcloudDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
