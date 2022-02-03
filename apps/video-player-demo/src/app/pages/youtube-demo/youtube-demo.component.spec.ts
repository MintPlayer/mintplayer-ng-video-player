import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YoutubeDemoComponent } from './youtube-demo.component';

describe('YoutubeDemoComponent', () => {
  let component: YoutubeDemoComponent;
  let fixture: ComponentFixture<YoutubeDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ YoutubeDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(YoutubeDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
