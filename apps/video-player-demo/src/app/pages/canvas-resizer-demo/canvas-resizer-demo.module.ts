import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BsGridModule } from '@mintplayer/ng-bootstrap/grid';
import { CanvasResizerModule } from '@mintplayer/ng-canvas-resizer';

import { CanvasResizerDemoRoutingModule } from './canvas-resizer-demo-routing.module';
import { CanvasResizerDemoComponent } from './canvas-resizer-demo.component';


@NgModule({
  declarations: [
    CanvasResizerDemoComponent
  ],
  imports: [
    CommonModule,
    BsGridModule,
    CanvasResizerModule,
    CanvasResizerDemoRoutingModule
  ]
})
export class CanvasResizerDemoModule { }
