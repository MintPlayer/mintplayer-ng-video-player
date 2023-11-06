import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: 'video', loadChildren: () => import('./video-demo/video-demo.module').then(m => m.VideoDemoModule) },
  { path: 'playlist', loadChildren: () => import('./playlist-demo/playlist-demo.module').then(m => m.PlaylistDemoModule) }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
