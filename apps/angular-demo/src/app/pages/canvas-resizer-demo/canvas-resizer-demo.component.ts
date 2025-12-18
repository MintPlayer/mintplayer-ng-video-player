
import { Component } from '@angular/core';
import { BsGridModule } from '@mintplayer/ng-bootstrap/grid';
import { CanvasResizerDirective } from '@mintplayer/ng-canvas-resizer';

@Component({
  selector: 'mintplayer-ng-video-player-canvas-resizer-demo',
  templateUrl: './canvas-resizer-demo.component.html',
  styleUrl: './canvas-resizer-demo.component.scss',
  standalone: true,
  imports: [BsGridModule, CanvasResizerDirective]
})
export class CanvasResizerDemoComponent {}
