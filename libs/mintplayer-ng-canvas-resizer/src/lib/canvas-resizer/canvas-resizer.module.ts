import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasResizerDirective } from './canvas-resizer.directive';

@NgModule({
  declarations: [CanvasResizerDirective],
  imports: [CommonModule],
  exports: [CanvasResizerDirective]
})
export class CanvasResizerModule { }
