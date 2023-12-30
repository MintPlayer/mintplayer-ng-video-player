import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: 'video', loadChildren: () => import('./video-demo/video-demo.module').then(m => m.VideoDemoModule) },
  { path: 'playlist', loadChildren: () => import('./playlist-demo/playlist-demo.module').then(m => m.PlaylistDemoModule) },
  { path: 'canvas-resizer', loadChildren: () => import('./canvas-resizer-demo/canvas-resizer-demo.module').then(m => m.CanvasResizerDemoModule) },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
