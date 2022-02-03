import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YoutubeDemoComponent } from './youtube-demo.component';

describe('YoutubeDemoComponent', () => {
  let component: YoutubeDemoComponent;
  let fixture: ComponentFixture<YoutubeDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        // Unit to test
        YoutubeDemoComponent,
      
        // Mock dependencies
        YoutubePlayerMockComponent
      ]
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

@Component({
  selector: 'youtube-player',
  template: '<div>Youtube player</div>'
})
class YoutubePlayerMockComponent {
  @Input() width = 400;
  @Input() height = 300;
}
