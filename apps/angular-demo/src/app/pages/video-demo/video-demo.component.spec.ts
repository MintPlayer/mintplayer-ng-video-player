import { StaticProvider } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { BsButtonGroupComponent } from '@mintplayer/ng-bootstrap/button-group';
import { BsButtonTypeDirective } from '@mintplayer/ng-bootstrap/button-type';
import { BsGridComponent, BsGridRowDirective, BsGridColDirective, BsGridColumnDirective, BsColFormLabelDirective } from '@mintplayer/ng-bootstrap/grid';
import { BsInputGroupComponent } from '@mintplayer/ng-bootstrap/input-group';
import { BsListGroupComponent, BsListGroupItemComponent } from '@mintplayer/ng-bootstrap/list-group';
import { BsRangeComponent, BsRangeValueAccessor } from '@mintplayer/ng-bootstrap/range';
import { BsCheckboxComponent } from '@mintplayer/ng-bootstrap/checkbox';
import { MockComponent, MockDirective } from 'ng-mocks';

import { VideoDemoComponent } from './video-demo.component';
import { BsFormComponent, BsFormControlDirective, BsFormGroupDirective } from '@mintplayer/ng-bootstrap/form';
import { VideoPlayerComponent, provideVideoApis } from '@mintplayer/ng-video-player';
import { APP_BASE_HREF } from '@angular/common';
import { provideRouter } from '@angular/router';

describe('VideoDemoComponent', () => {
  let component: VideoDemoComponent;
  let fixture: ComponentFixture<VideoDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        // Unit to test
        VideoDemoComponent,

        // Mock dependencies
        FormsModule,
        MockComponent(BsFormComponent),
        MockDirective(BsFormControlDirective),
        MockDirective(BsFormGroupDirective),
        MockComponent(BsGridComponent),
        MockDirective(BsGridRowDirective),
        MockDirective(BsGridColDirective),
        MockDirective(BsGridColumnDirective),
        MockDirective(BsColFormLabelDirective),
        MockComponent(BsRangeComponent),
        MockDirective(BsRangeValueAccessor),
        MockComponent(BsListGroupComponent),
        MockComponent(BsListGroupItemComponent),
        MockComponent(BsButtonGroupComponent),
        MockDirective(BsButtonTypeDirective),
        MockComponent(BsButtonGroupComponent),
        MockComponent(BsInputGroupComponent),
        MockComponent(BsCheckboxComponent),

        MockComponent(VideoPlayerComponent),
      ],
      declarations: [],
      providers: <StaticProvider[]>[
        provideRouter([]),
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

  it(`should have as title 'angular-demo'`, () => {
    expect(component.title).toEqual('angular-demo');
  });

  it('should render title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain(
      'Welcome to angular-demo!'
    );
  });
});
