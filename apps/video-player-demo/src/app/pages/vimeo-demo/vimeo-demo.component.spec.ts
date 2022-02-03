import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { VimeoDemoComponent } from './vimeo-demo.component';

describe('VimeoDemoComponent', () => {
  let component: VimeoDemoComponent;
  let fixture: ComponentFixture<VimeoDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule
      ],
      declarations: [
        // Unit to test
        VimeoDemoComponent,
      
        // Mock dependencies
        VimeoPlayerMockComponent
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
  
  it(`should have as title 'vimeo-player-demo'`, () => {
    expect(component.title).toEqual('vimeo-player-demo');
  });

  it('should render title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain(
      'Welcome to vimeo-player-demo!'
    );
  });
});

@Component({
  selector: 'vimeo-player',
  template: '<div>Vimeo player</div>'
})
class VimeoPlayerMockComponent {
  @Input() width = 400;
  @Input() height = 300;
  @Input() videoId = '';
  @Input() volume = 50;
  @Input() isPip = false;
  @Output() volumeChange = new EventEmitter<number>();
  @Output() isPipChange = new EventEmitter<boolean>();
}