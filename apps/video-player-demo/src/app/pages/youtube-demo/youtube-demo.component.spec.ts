import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BsButtonTypeModule } from '@mintplayer/ng-bootstrap/button-type';
import { YoutubePlayerModule } from '@mintplayer/ng-youtube-player';
import { MockModule } from 'ng-mocks';

import { YoutubeDemoComponent } from './youtube-demo.component';

describe('YoutubeDemoComponent', () => {
  let component: YoutubeDemoComponent;
  let fixture: ComponentFixture<YoutubeDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MockModule(BsButtonTypeModule),
        MockModule(YoutubePlayerModule)
      ],
      declarations: [
        // Unit to test
        YoutubeDemoComponent,
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