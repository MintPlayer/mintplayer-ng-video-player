import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: 'youtube', loadChildren: () => import('./youtube-demo/youtube-demo.module').then(m => m.YoutubeDemoModule) },
  { path: 'dailymotion', loadChildren: () => import('./dailymotion-demo/dailymotion-demo.module').then(m => m.DailymotionDemoModule) },
  { path: 'vimeo', loadChildren: () => import('./vimeo-demo/vimeo-demo.module').then(m => m.VimeoDemoModule) },
  { path: 'soundcloud', loadChildren: () => import('./soundcloud-demo/soundcloud-demo.module').then(m => m.SoundcloudDemoModule) },
  { path: 'video', loadChildren: () => import('./video-demo/video-demo.module').then(m => m.VideoDemoModule) },
  { path: 'playlist', loadChildren: () => import('./playlist-demo/playlist-demo.module').then(m => m.PlaylistDemoModule) }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
