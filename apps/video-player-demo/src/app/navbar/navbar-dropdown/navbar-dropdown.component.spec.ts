import { Component, Directive, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BsHasOverlayComponent } from '@mintplayer/ng-bootstrap/has-overlay';
import { MockComponent, MockModule } from 'ng-mocks';
import { BsNavbarItemComponent } from '../navbar-item/navbar-item.component';
import { BsNavbarComponent } from '../navbar/navbar.component';

import { BsNavbarDropdownComponent } from './navbar-dropdown.component';

describe('BsNavbarDropdownComponent', () => {
  let component: BsNavbarDropdownTestComponent;
  let fixture: ComponentFixture<BsNavbarDropdownTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: 'a', component: PageAComponent },
          { path: 'b', children: [
            { path: 'c', component: PageBCComponent }
          ]}
        ]),
        MockComponent(BsHasOverlayComponent)
      ],
      declarations: [
        // Component to test
        BsNavbarDropdownComponent,

        // Mock components
        BsNavbarMockComponent,
        BsNavbarNavMockComponent,
        BsNavbarItemMockComponent,
        ClickOutsideDirective,

        // Pages
        PageAComponent,
        PageBCComponent,

        // Testbench
        BsNavbarDropdownTestComponent
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BsNavbarDropdownTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

@Component({
  selector: 'bs-navbar-test',
  template: `
  <bs-navbar>
    <bs-navbar-nav>
      <bs-navbar-item>
        <a [routerLink]='["/a"]'>a</a>
      </bs-navbar-item>
      <bs-navbar-item>
        <a [routerLink]='[]'>dropdown</a>
        <bs-navbar-dropdown>
          <bs-navbar-item>
            <a [routerLink]='["/b", "c"]'>bc</a>
          </bs-navbar-item>
        </bs-navbar-dropdown>
      </bs-navbar-item>
    </bs-navbar-nav>
  </bs-navbar>`
})
class BsNavbarDropdownTestComponent {
}

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
  selector: 'bs-navbar-nav',
  template: `
  <div>
    <ul>
      <ng-content></ng-content>
    </ul>  
  </div>`
})
class BsNavbarNavMockComponent {
}

@Component({
  selector: 'bs-navbar-item',
  template: `
  <li>
    <ng-content></ng-content>
  </li>`,
  providers: [
    { provide: BsNavbarItemComponent, useExisting: BsNavbarItemMockComponent }
  ]
})
class BsNavbarItemMockComponent {
}

@Component({
  selector: 'page-a',
  template: `
  <div>Page A</div>`
})
class PageAComponent {
}

@Component({
  selector: 'page-bc',
  template: `
  <div>Page B - C</div>`
})
class PageBCComponent {
}

@Directive({
  selector: '[clickOutside]'
})
class ClickOutsideDirective {
  @Input() exclude: HTMLElement[] = [];
}