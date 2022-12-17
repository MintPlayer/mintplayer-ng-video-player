import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { BsButtonGroupModule } from '@mintplayer/ng-bootstrap/button-group';
import { BsButtonTypeModule } from '@mintplayer/ng-bootstrap/button-type';
import { BsGridModule } from '@mintplayer/ng-bootstrap/grid';
import { BsInputGroupModule } from '@mintplayer/ng-bootstrap/input-group';
import { BsToggleButtonModule } from '@mintplayer/ng-bootstrap/toggle-button';
import { SoundcloudPlayerComponent } from '@mintplayer/ng-soundcloud-player';
import { MockComponent, MockModule } from 'ng-mocks';

import { SoundcloudDemoComponent } from './soundcloud-demo.component';

describe('SoundcloudDemoComponent', () => {
  let component: SoundcloudDemoComponent;
  let fixture: ComponentFixture<SoundcloudDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        MockModule(BsGridModule),
        MockModule(BsInputGroupModule),
        MockModule(BsToggleButtonModule),
        MockModule(BsButtonTypeModule),
        MockModule(BsButtonGroupModule),
      ],
      declarations: [
        // Unit to test
        SoundcloudDemoComponent,
      
        // Mock dependencies
        MockComponent(SoundcloudPlayerComponent),
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SoundcloudDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it(`should have as title 'SoundCloud player'`, () => {
    expect(component.title).toEqual('SoundCloud player');
  });

  it('should render title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain(
      'Welcome to SoundCloud player!'
    );
  });
});

interface PlayerProgress {
  currentTime: number;
  duration: number;
}

enum PlayerState {
  UNSTARTED = 'unstarted',
  PLAYING = 'playing',
  PAUSED = 'paused',
  ENDED = 'ended',
}
