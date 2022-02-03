import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoundcloudPlayerComponent } from './soundcloud-player.component';

describe('SoundcloudPlayerComponent', () => {
  let component: SoundcloudPlayerComponent;
  let fixture: ComponentFixture<SoundcloudPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SoundcloudPlayerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SoundcloudPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
