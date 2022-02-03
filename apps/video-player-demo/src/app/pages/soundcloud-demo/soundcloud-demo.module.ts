import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SoundcloudPlayerModule } from '@mintplayer/ng-soundcloud-player';

import { SoundcloudDemoRoutingModule } from './soundcloud-demo-routing.module';
import { SoundcloudDemoComponent } from './soundcloud-demo.component';


@NgModule({
  declarations: [
    SoundcloudDemoComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SoundcloudPlayerModule,
    SoundcloudDemoRoutingModule
  ]
})
export class SoundcloudDemoModule { }
