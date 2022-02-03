import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { VimeoPlayerModule } from '@mintplayer/ng-vimeo-player';

import { VimeoDemoRoutingModule } from './vimeo-demo-routing.module';
import { VimeoDemoComponent } from './vimeo-demo.component';


@NgModule({
  declarations: [
    VimeoDemoComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    VimeoPlayerModule,
    VimeoDemoRoutingModule
  ]
})
export class VimeoDemoModule { }
