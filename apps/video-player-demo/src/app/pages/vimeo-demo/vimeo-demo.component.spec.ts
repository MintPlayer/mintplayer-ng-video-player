import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { BsButtonGroupModule } from '@mintplayer/ng-bootstrap/button-group';
import { BsGridModule } from '@mintplayer/ng-bootstrap/grid';
import { BsRangeModule } from '@mintplayer/ng-bootstrap/range';
import { VideoPlayerComponent } from '@mintplayer/ng-video-player';
import { MockComponent, MockModule } from 'ng-mocks';

import { VimeoDemoComponent } from './vimeo-demo.component';

describe('VimeoDemoComponent', () => {
  let component: VimeoDemoComponent;
  let fixture: ComponentFixture<VimeoDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        MockModule(BsGridModule),
        MockModule(BsRangeModule),
        MockModule(BsButtonGroupModule),
      ],
      declarations: [
        // Unit to test
        VimeoDemoComponent,
      
        // Mock dependencies
        MockComponent(VideoPlayerComponent),
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VimeoDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it(`should have as title 'Vimeo player'`, () => {
    expect(component.title).toEqual('Vimeo player');
  });

  it('should render title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain(
      'Welcome to Vimeo player!'
    );
  });
});