
import { Component } from '@angular/core';
import { BsGridComponent, BsGridRowDirective, BsGridColDirective, BsGridColumnDirective, BsColFormLabelDirective } from '@mintplayer/ng-bootstrap/grid';
import { CanvasResizerDirective } from '@mintplayer/ng-canvas-resizer';

@Component({
  selector: 'mintplayer-ng-video-player-canvas-resizer-demo',
  templateUrl: './canvas-resizer-demo.component.html',
  styleUrl: './canvas-resizer-demo.component.scss',
  standalone: true,
  imports: [BsGridComponent, BsGridRowDirective, BsGridColDirective, BsGridColumnDirective, BsColFormLabelDirective, CanvasResizerDirective]
})
export class CanvasResizerDemoComponent {}
