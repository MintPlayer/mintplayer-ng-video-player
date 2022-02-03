import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlaylistDemoComponent } from './playlist-demo.component';

const routes: Routes = [{ path: '', component: PlaylistDemoComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PlaylistDemoRoutingModule { }
