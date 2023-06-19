import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BsFormModule } from '@mintplayer/ng-bootstrap/form';
import { BsGridModule } from '@mintplayer/ng-bootstrap/grid';
import { BsButtonTypeModule } from '@mintplayer/ng-bootstrap/button-type';
import { BsInputGroupModule } from '@mintplayer/ng-bootstrap/input-group';
import { BsButtonGroupModule } from '@mintplayer/ng-bootstrap/button-group';
import { BsToggleButtonModule } from '@mintplayer/ng-bootstrap/toggle-button';
import { SoundcloudApiModule } from '@mintplayer/ng-soundcloud-player';

import { SoundcloudDemoRoutingModule } from './soundcloud-demo-routing.module';
import { SoundcloudDemoComponent } from './soundcloud-demo.component';


@NgModule({
  declarations: [
    SoundcloudDemoComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    BsFormModule,
    BsGridModule,
    BsInputGroupModule,
    BsButtonGroupModule,
    BsButtonTypeModule,
    BsToggleButtonModule,
    SoundcloudApiModule,
    SoundcloudDemoRoutingModule
  ]
})
export class SoundcloudDemoModule { }
