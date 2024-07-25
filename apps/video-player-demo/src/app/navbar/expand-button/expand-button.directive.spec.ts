import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BsNavbarComponent } from '..';
import { BsExpandButtonDirective } from './expand-button.directive';

describe('BsExpandButtonDirective', () => {
  let component: BsExpandButtonTestComponent;
  let fixture: ComponentFixture<BsExpandButtonTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        // Directive to test
        BsExpandButtonDirective,

        // Mock dependencies
        BsNavbarMockComponent,

        // Testbench
        BsExpandButtonTestComponent,
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BsExpandButtonTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it('should put the togglebutton template in the navbar', () => {
    expect(component.navbar.expandButtonTemplate).toBeDefined();
  });
});

@Component({
  selector: 'bs-navbar',
  template: `
  <nav>
    <div>
      <ng-content></ng-content>
    </div>  
  </nav>`,
  providers: [
    { provide: BsNavbarComponent, useExisting: BsNavbarMockComponent }
  ]
})
class BsNavbarMockComponent {
}

@Component({
  selector: 'bs-nav-link-test',
  template: `
  <bs-navbar #navbar>
    <ng-template bsExpandButton let-state>
      <input type="checkbox" [checked]="state === 'open'">
    </ng-template>
  </bs-navbar>`
})
class BsExpandButtonTestComponent {
  @ViewChild('navbar') navbar!: BsNavbarComponent;
}
