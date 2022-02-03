import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaylistDemoComponent } from './playlist-demo.component';

describe('PlaylistDemoComponent', () => {
  let component: PlaylistDemoComponent;
  let fixture: ComponentFixture<PlaylistDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlaylistDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlaylistDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
