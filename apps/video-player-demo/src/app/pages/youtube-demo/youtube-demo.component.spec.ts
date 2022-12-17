import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BsButtonTypeDirective } from '@mintplayer/ng-bootstrap/button-type';
import { YoutubePlayerComponent } from '@mintplayer/ng-youtube-player';
import { MockComponent, MockDirective } from 'ng-mocks';

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
        MockDirective(BsButtonTypeDirective),
        MockComponent(YoutubePlayerComponent),
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