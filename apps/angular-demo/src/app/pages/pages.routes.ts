import { Routes } from '@angular/router';

export const ROUTES: Routes = [
  { path: 'video', loadComponent: () => import('./video-demo/video-demo.component').then(m => m.VideoDemoComponent) },
  { path: 'playlist', loadComponent: () => import('./playlist-demo/playlist-demo.component').then(m => m.PlaylistDemoComponent) },
  { path: 'canvas-resizer', loadComponent: () => import('./canvas-resizer-demo/canvas-resizer-demo.component').then(m => m.CanvasResizerDemoComponent) },
];