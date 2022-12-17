import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BsButtonTypeModule } from '@mintplayer/ng-bootstrap/button-type';
import { DailymotionPlayerComponent } from '@mintplayer/ng-dailymotion-player';
import { MockComponent, MockModule } from 'ng-mocks';

import { DailymotionDemoComponent } from './dailymotion-demo.component';

describe('DailymotionDemoComponent', () => {
  let component: DailymotionDemoComponent;
  let fixture: ComponentFixture<DailymotionDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MockModule(BsButtonTypeModule),
      ],
      declarations: [
        // Unit to test
        DailymotionDemoComponent,
      
        // Mock dependencies
        MockComponent(DailymotionPlayerComponent),
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DailymotionDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it(`should have as title 'DailyMotion player'`, () => {
    expect(component.title).toEqual('DailyMotion player');
  });

  it('should render title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain(
      'Welcome to DailyMotion player!'
    );
  });
});