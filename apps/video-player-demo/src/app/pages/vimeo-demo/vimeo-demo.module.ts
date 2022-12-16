import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BsGridModule } from '@mintplayer/ng-bootstrap/grid';
import { BsRangeModule } from '@mintplayer/ng-bootstrap/range';
import { BsButtonTypeModule } from '@mintplayer/ng-bootstrap/button-type';
import { BsButtonGroupModule } from '@mintplayer/ng-bootstrap/button-group';
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
    BsGridModule,
    BsRangeModule,
    BsButtonTypeModule,
    BsButtonGroupModule,
    VimeoPlayerModule,
    VimeoDemoRoutingModule
  ]
})
export class VimeoDemoModule { }
