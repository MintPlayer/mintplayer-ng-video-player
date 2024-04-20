import { StaticProvider } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { BsButtonGroupComponent } from '@mintplayer/ng-bootstrap/button-group';
import { BsButtonTypeDirective } from '@mintplayer/ng-bootstrap/button-type';
import { BsGridModule } from '@mintplayer/ng-bootstrap/grid';
import { BsInputGroupComponent } from '@mintplayer/ng-bootstrap/input-group';
import { BsListGroupModule } from '@mintplayer/ng-bootstrap/list-group';
import { BsRangeModule } from '@mintplayer/ng-bootstrap/range';
import { BsToggleButtonModule } from '@mintplayer/ng-bootstrap/toggle-button';
import { MockComponent, MockDirective, MockModule } from 'ng-mocks';

import { VideoDemoComponent } from './video-demo.component';
import { BsFormModule } from '@mintplayer/ng-bootstrap/form';
import { VideoPlayerComponent, provideVideoApis } from '@mintplayer/ng-video-player';
import { APP_BASE_HREF } from '@angular/common';

describe('VideoDemoComponent', () => {
  let component: VideoDemoComponent;
  let fixture: ComponentFixture<VideoDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        MockModule(BsFormModule),
        MockModule(BsGridModule),
        MockModule(BsRangeModule),
        MockModule(BsListGroupModule),
        MockComponent(BsButtonGroupComponent),
        MockDirective(BsButtonTypeDirective),
        MockComponent(BsButtonGroupComponent),
        MockComponent(BsInputGroupComponent),
        MockModule(BsToggleButtonModule),

        MockComponent(VideoPlayerComponent),
      ],
      declarations: [
        // Unit to test
        VideoDemoComponent,
      ],
      providers: <StaticProvider[]>[
        { provide: APP_BASE_HREF, useValue: 'http://example.com' },
        provideVideoApis(),
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it(`should have as title 'video-player-demo'`, () => {
    expect(component.title).toEqual('video-player-demo');
  });

  it('should render title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain(
      'Welcome to video-player-demo!'
    );
  });
});
